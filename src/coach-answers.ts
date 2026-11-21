import { findAnswer, unknownAnswer } from './faq.ts'
import { expenseCategories, goalProgress, ledgerSummary, money, monthKey, readAmount, shiftDays, shortDate, simulatePurchase, totals } from './finance.ts'
import type { Ledger, Transaction } from './finance.ts'

export interface CoachReply {
  text: string
  purchase?: true
}

const categoryNames = [
  ['카페·간식', /카페|간식|디저트|커피|버블티|과자/],
  ['식비', /식비|밥값|외식|떡볶이|점심|저녁값/],
  ['교통', /교통|차비|버스|택시|지하철/],
  ['쇼핑', /쇼핑|옷값|의류/],
  ['취미·게임', /취미|게임/],
  ['학용품', /학용품|문구|필기구/],
  ['기타', /기타(지출|소비|카테고리)/],
] as const

const digits = '영일이삼사오육칠팔구'
const units: Record<string, number> = { 억: 1e8, 만: 1e4, 천: 1e3, 백: 1e2, 십: 10 }
const pricePattern = /(?<![\d,.영공일이삼사오육칠팔구십백천만억\-−])([\-−]?[\d,.영공일이삼사오육칠팔구십백천만억]+)(?:원|짜리)/
const amountTerm = /(\d[\d,]*(?:\.\d+)?|[영공일이삼사오육칠팔구])?([억만천백십])|(\d[\d,]*|[영공일이삼사오육칠팔구])/g
const purchaseWords = /사도|사면|사고싶|살수|살까|살건|구매해|구매하|구매할|결제해도|결제하면|지불해도|먹어도|마셔도|시켜도/
const guidanceWords = /써도|쓸수|쓸까|쓸돈|권장|더쓸|얼마까지|하루예산/
const helpWords = /용돈|잔액|수입|지출|예산|저축|목표|소비|카테고리|구매|기록|결제|저장|그래프|시뮬레이터|로그인|비교/
const amountWords = /얼마|합계|총액|총지출|썼|씀|쓴|쓰는|나갔|많이|내역|알려|줄이|줄일/
const manualQuestion = /어떻게(추가|기록|설정|삭제|수정|등록|만들)|어디(서|에)(추가|기록|설정|삭제|등록)|수정하는법|삭제하는법/

function parseWon(value: string): number | null {
  const plain = readAmount(value)
  if (plain !== null) return plain
  const terms = [...value.matchAll(amountTerm)]
  if (terms.map(term => term[0]).join('') !== value || !terms.some(term => term[2])) return null
  let amount = 0
  let group = 0
  let previousLargeUnit = Infinity
  let previousSmallUnit = 1e4
  for (const [, coefficient, unit, tail] of terms) {
    const part = coefficient ?? tail
    const count = part === undefined ? 1 : part === '공' ? 0 :
      digits.includes(part) ? digits.indexOf(part) :
        /^\d+(?:\.\d+)?$/.test(part) ? Number(part) : readAmount(part, true)
    if (count === null) return null
    if (!unit) {
      group += count
      continue
    }
    const scale = units[unit]
    if (scale < 1e4) {
      if (scale >= previousSmallUnit) return null
      previousSmallUnit = scale
      group += count * scale
      continue
    }
    if (scale >= previousLargeUnit) return null
    previousLargeUnit = scale
    previousSmallUnit = 1e4
    amount += (part === undefined && group ? group : group + count) * scale
    group = 0
  }
  const total = amount + group
  const rounded = Math.round(total)
  return Math.abs(total - rounded) < 1e-6 ? readAmount(String(rounded)) : null
}

function priceFrom(text: string, followUp: boolean) {
  const amount = text.match(/₩([−\-]?\d[\d,.]*)/)?.[1] ?? text.match(pricePattern)?.[1]
  if (amount) return parseWon(amount)
  if (!followUp) return null
  const bare = text.match(/^(?:그럼|그러면)?(\d[\d,]*)(?:은|는|도)?[?.!]*$/)?.[1]
  return bare ? readAmount(bare) : null
}

function weekStart(today: string) {
  const weekday = new Date(today + 'T00:00:00Z').getUTCDay()
  return shiftDays(today, -((weekday + 6) % 7))
}

interface Period { title: string; start: string; end: string }

function periodFor(text: string, today: string): Period {
  if (/어제/.test(text)) {
    const date = shiftDays(today, -1)
    return { title: '어제', start: date, end: date }
  }
  if (/오늘/.test(text)) return { title: '오늘', start: today, end: today }
  if (/지난주/.test(text)) return { title: '지난주', start: shiftDays(weekStart(today), -7), end: shiftDays(weekStart(today), -1) }
  if (/이번주/.test(text)) return { title: '이번 주', start: weekStart(today), end: today }
  if (/최근7일|일주일/.test(text)) return { title: '최근 7일', start: shiftDays(today, -6), end: today }
  if (/지난달|전월/.test(text)) {
    return { title: '지난달', start: monthKey(today, -1) + '-01', end: shiftDays(monthKey(today) + '-01', -1) }
  }
  return { title: '이번 달', start: monthKey(today) + '-01', end: today }
}

function forPeriod(entries: Transaction[], { start, end }: Pick<Period, 'start' | 'end'>) {
  return entries.filter(entry => entry.date >= start && entry.date <= end)
}

function purchaseReply(ledger: Ledger, today: string, price: number | null): CoachReply {
  if (price === null) return { text: '가격을 알려 줘요. “3만 5천 원”이나 “35000원”처럼 적으면 구매 후 잔액과 예산을 계산해 볼게요.', purchase: true }
  const result = simulatePurchase(ledger, price, today)
  const { summary } = result
  if (!ledger.transactions.length) {
    return { text: money(price) + ' 구매를 계산하려면 먼저 홈에서 가진 용돈이나 받은 용돈을 등록해 주세요. 지금은 등록한 거래가 없어요.', purchase: true }
  }
  const after = result.balanceAfter < 0
    ? '현재 잔액으로는 ' + money(-result.balanceAfter) + '이 부족해요.'
    : '구매하면 ' + money(result.balanceAfter) + '이 남아요.'
  const details = summary.budget === 0 ? '이달 예산은 아직 설정되지 않았어요.' :
    result.budgetAfter < 0 ? '이달 예산은 ' + money(-result.budgetAfter) + ' 초과해요.' :
      '이달 예산은 ' + money(result.budgetAfter) + ' 남고, 하루 권장 금액은 ' + money(result.dailyAfter) + '이에요.'
  return { text: money(price) + '을 쓸 때의 계산이에요.\n' + after + '\n' + details, purchase: true }
}

function spendingReply(ledger: Ledger, today: string, text: string): string {
  const period = periodFor(text, today)
  const expenses = forPeriod(ledger.transactions, period).filter(entry => entry.kind === 'expense')
  const categories = categoryNames.filter(([, matcher]) => matcher.test(text)).map(([category]) => category)
  if (categories.length) {
    return categories.map(category => {
      const records = expenses.filter(entry => entry.category === category)
      return records.length ? period.title + ' ' + category + ' 지출은 ' + money(totals(records).expense) + '이고, ' + records.length + '건이에요.' :
        period.title + ' ' + category + '에 기록된 지출이 없어요.'
    }).join('\n')
  }
  if (!expenses.length) return period.title + ' 기록된 지출이 없어요.'
  if (/가장|많이|어디|카테고리|줄이|줄일/.test(text)) {
    const ranked = expenseCategories.map(name => ({
      name, amount: totals(expenses.filter(entry => entry.category === name)).expense,
    })).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount)
    const lead = ranked[0].amount
    const highest = ranked.filter(item => item.amount === lead).map(item => item.name).join(', ')
    return period.title + ' 기록에서 가장 많이 쓴 곳은 ' + highest + '이고, 카테고리별로 ' +
      money(lead) + '이에요.\n전체 지출은 ' + money(totals(expenses).expense) + '이에요.'
  }
  return period.title + ' 기록된 지출은 ' + money(totals(expenses).expense) + '이고, ' + expenses.length + '건이에요.'
}

function compareMonths(ledger: Ledger, today: string) {
  const thisStart = monthKey(today) + '-01'
  const lastStart = monthKey(today, -1) + '-01'
  const lastDay = shiftDays(thisStart, -1)
  const sameDay = shiftDays(lastStart, Number(today.slice(8, 10)) - 1)
  const lastEnd = sameDay < lastDay ? sameDay : lastDay
  const current = totals(forPeriod(ledger.transactions, { start: thisStart, end: today })).expense
  const previous = totals(forPeriod(ledger.transactions, { start: lastStart, end: lastEnd })).expense
  if (!current && !previous) return '비교할 두 기간에 기록된 지출이 없어요.'
  const difference = current - previous
  const conclusion = difference === 0 ? '두 기간이 같아요.' : money(Math.abs(difference)) + ' ' + (difference > 0 ? '더 썼어요.' : '덜 썼어요.')
  return '이번 달 ' + shortDate(thisStart) + '~' + shortDate(today) + ' ' + money(current) + '\n지난달 ' + shortDate(lastStart) + '~' + shortDate(lastEnd) + ' ' +
    money(previous) + '\n같은 시점까지 기록된 지출을 비교하면 ' + conclusion
}

function savingsReply(ledger: Ledger, today: string, text: string, requested: number | null) {
  if (!ledger.goals.length) return (requested ? money(requested) + '을 모으려면 먼저 그 금액을 목표로 등록해 주세요. ' : '아직 등록된 저축 목표가 없어요. ') +
    '모은 금액을 꾸준히 기록하면 예상 달성일을 계산할 수 있어요.'
  const exactGoal = [...ledger.goals].sort((a, b) => b.name.length - a.name.length)
    .find(goal => text.includes(goal.name.normalize('NFKC').replace(/\s+/g, '').toLowerCase()))
  const candidates = exactGoal ? [exactGoal] : requested ? ledger.goals.filter(goal => goal.target === requested) : ledger.goals
  if (!candidates.length) {
    return money(requested ?? 0) + '에 맞는 저축 목표가 없어요. 그 금액으로 목표를 등록하면 실제 모은 금액과 함께 계산할 수 있어요.'
  }
  const goals = candidates.slice(0, 3).map(goal => {
    const { remaining, percent, eta } = goalProgress(goal, today)
    if (!remaining) return goal.name + '은 목표 ' + money(goal.target) + '을 달성했어요.'
    return goal.name + '은 ' + money(remaining) + ' 남았어요(' + percent + '% 달성). ' +
      (eta ? '지금 속도라면 ' + shortDate(eta) + '쯤 달성할 수 있어요.' : '모은 금액과 경과 기간이 쌓이면 예상일을 계산할 수 있어요.')
  })
  if (candidates.length > goals.length) goals.push('다른 목표가 궁금하다면 목표 이름을 함께 적어 주세요.')
  return goals.join('\n')
}

export function replyToCoach(question: string, ledger: Ledger, today: string, previousPurchase = false): CoachReply {
  const text = question.normalize('NFKC').toLowerCase().replace(/\s+/g, '')
  const price = priceFrom(text, previousPurchase)
  if (manualQuestion.test(text)) return { text: findAnswer(question) }
  const isFollowUp = previousPurchase && price !== null && /^(그럼|그러면|[₩\d]|[일이삼사오육칠팔구십백천만])/.test(text)
  const isPriceJudgment = price !== null && /짜리|결제|구매/.test(text) && /괜찮|가능|어때/.test(text)
  if (purchaseWords.test(text) || isFollowUp || isPriceJudgment) return purchaseReply(ledger, today, price)
  if (/저축|모으|모아|달성일|목표/.test(text)) return { text: savingsReply(ledger, today, text, price) }
  if (/지난달|전월/.test(text) && /비교|보다|대비|늘었|줄었|차이/.test(text)) return { text: compareMonths(ledger, today) }
  const summary = ledgerSummary(ledger, today)
  if (guidanceWords.test(text)) {
    if (!ledger.transactions.length) return { text: '먼저 받은 용돈과 지출을 등록하면 남은 잔액으로 권장 금액을 계산할 수 있어요.' }
    if (!summary.budget) return { text: '사용 가능한 용돈은 ' + money(summary.balance) + '이에요. 이달 예산을 설정하거나 수입을 기록하면 권장 금액도 알려줄 수 있어요.' }
    if (/이번달|이달|월말/.test(text)) {
      const available = Math.max(0, Math.min(summary.balance, summary.remainingBudget))
      return { text: '이번 달에 더 쓸 수 있는 금액은 최대 ' + money(available) + '이에요. 현재 잔액과 남은 월 예산 중 작은 금액으로 계산했어요.' }
    }
    if (/이번주|최근7일|일주일/.test(text)) {
      const weekday = new Date(today + 'T00:00:00Z').getUTCDay()
      const days = Math.min(/이번주/.test(text) ? 7 - ((weekday + 6) % 7) : 7, summary.daysLeft)
      return { text: '오늘부터 ' + shortDate(shiftDays(today, days - 1)) + '까지 권장 지출은 총 ' +
        money(summary.daily * days) + '이에요. 이달 잔액과 예산을 기준으로 하루 ' + money(summary.daily) + '씩 계산했어요.' }
    }
    return { text: '오늘 권장 지출은 ' + money(summary.daily) + '이에요. 남은 용돈과 이달 예산 중 적은 금액을 오늘 포함 ' +
      summary.daysLeft + '일로 나눴어요.' }
  }
  if (/수입|들어온돈|받은용돈/.test(text) && amountWords.test(text)) {
    const period = periodFor(text, today)
    return { text: period.title + ' 기록된 수입은 ' + money(totals(forPeriod(ledger.transactions, period)).income) + '이에요.' }
  }
  if (amountWords.test(text) && (/지출|소비|어디에|썼|쓴|카테고리|쓰는/.test(text) ||
    categoryNames.some(([, matcher]) => matcher.test(text)))) return { text: spendingReply(ledger, today, text) }
  if (/예산/.test(text) && /남|얼마|상태|초과|사용률/.test(text)) {
    if (!summary.budget) return { text: '이달 예산을 아직 정하지 않았어요. 용돈 설정에서 매달 지출 예산을 입력해 주세요.' }
    const remaining = summary.remainingBudget < 0 ? money(-summary.remainingBudget) + ' 초과했어요.' :
      money(summary.remainingBudget) + '이 남았어요.'
    return { text: '이달 예산 ' + money(summary.budget) + ' 중 ' + money(summary.expense) + '을 썼어요. ' + remaining }
  }
  if (/잔액|잔고|남은용돈|용돈이?얼마|용돈이?남/.test(text)) {
    return { text: '현재 사용 가능한 용돈은 ' + money(summary.balance) + '이에요.' +
      (summary.savings ? ' 목표에 따로 모아 둔 ' + money(summary.savings) + '은 별도로 계산했어요.' : '') }
  }
  return { text: helpWords.test(text) ? findAnswer(question) : unknownAnswer }
}
