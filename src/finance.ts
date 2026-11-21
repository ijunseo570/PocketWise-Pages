export const expenseCategories = ['식비', '카페·간식', '교통', '쇼핑', '취미·게임', '학용품', '기타'] as const
export const incomeCategories = ['정기 용돈', '추가 용돈', '선물', '기타'] as const
export const goalIcons = ['headphones', 'game', 'bike', 'books', 'gift', 'sparkles'] as const

export type Kind = 'income' | 'expense'
export type Category = typeof expenseCategories[number] | typeof incomeCategories[number]
export type GoalIcon = typeof goalIcons[number]
export interface Transaction {
  id: string
  kind: Kind
  amount: number
  date: string
  category: Category
  memo: string
}
export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  createdOn: string
  due: string
  icon: GoalIcon
}
export interface Ledger {
  version: 1
  budget: number | null
  transactions: Transaction[]
  goals: Goal[]
}

const dayInMs = 86_400_000
const koreanDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long',
})
const seoulIso = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
})
const integer = new Intl.NumberFormat('ko-KR')
export const money = (amount: number) => (amount < 0 ? '−' : '') + '₩' + integer.format(Math.abs(amount))
export const todayInKorea = (now = new Date()) => seoulIso.format(now)
export const longDate = (date: string) => koreanDate.format(new Date(date + 'T00:00:00Z'))
export const shortDate = (date: string) => Number(date.slice(5, 7)) + '월 ' + Number(date.slice(8)) + '일'
export const iso = (date: Date) => date.toISOString().slice(0, 10)
export const monthKey = (date: string, offset = 0) =>
  iso(new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1 + offset, 1))).slice(0, 7)
export const shiftDays = (date: string, days: number) => iso(new Date(Date.parse(date) + days * dayInMs))
const dayDifference = (first: string, last: string) => (Date.parse(last) - Date.parse(first)) / dayInMs
export const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' &&
  Number.isFinite(Date.parse(value)) && iso(new Date(value)) === value

export function readAmount(input: string, allowZero = false): number | null {
  const clean = input.trim()
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(clean)) return null
  const amount = Number(clean.replaceAll(',', ''))
  return amount >= (allowZero ? 0 : 1) && amount <= 999_999_999 ? amount : null
}

export function sortedTransactions(transactions: Transaction[], direction: 'new' | 'old' = 'new') {
  return [...transactions].sort((first, second) =>
    direction === 'new' ? second.date.localeCompare(first.date) : first.date.localeCompare(second.date))
}

export function totals(transactions: Transaction[]) {
  let income = 0
  let expense = 0
  for (const entry of transactions) {
    if (entry.kind === 'income') income += entry.amount
    else expense += entry.amount
  }
  return { income, expense }
}

export function ledgerSummary(ledger: Ledger, today: string) {
  const month = monthKey(today)
  const currentTransactions = ledger.transactions.filter(entry => entry.date <= today)
  const monthly = totals(currentTransactions.filter(entry => entry.date.startsWith(month)))
  const overall = totals(currentTransactions)
  const savings = ledger.goals.reduce((total, goal) => total + goal.saved, 0)
  const cash = overall.income - overall.expense
  const balance = cash - savings
  const budget = ledger.budget ?? monthly.income
  const remainingBudget = budget - monthly.expense
  const daysLeft = dayDifference(today, monthKey(today, 1) + '-01')
  return {
    ...monthly, cash, savings, balance, budget, remainingBudget, daysLeft,
    usage: budget ? Math.round(monthly.expense / budget * 100) : null,
    daily: Math.floor(Math.max(0, Math.min(balance, remainingBudget)) / daysLeft),
  }
}

export function spendingStats(transactions: Transaction[], today: string) {
  const expenses = transactions.filter(entry => entry.kind === 'expense' && entry.date <= today)
  const month = monthKey(today)
  const monthExpenses = expenses.filter(entry => entry.date.startsWith(month))
  const categoryTotals = expenseCategories.map((name, index) => ({
    name, index, amount: monthExpenses.filter(entry => entry.category === name).reduce((sum, entry) => sum + entry.amount, 0),
  })).filter(category => category.amount > 0).sort((first, second) => second.amount - first.amount)
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDays(today, index - 6)
    return {
      date, label: shortDate(date),
      amount: expenses.filter(entry => entry.date === date).reduce((sum, entry) => sum + entry.amount, 0),
    }
  })
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const key = monthKey(today, index - 5)
    return {
      label: Number(key.slice(5)) + '월', key,
      amount: expenses.filter(entry => entry.date.startsWith(key)).reduce((sum, entry) => sum + entry.amount, 0),
    }
  })
  const previous = monthly[4].amount
  const thisMonth = monthly[5].amount
  const change = previous > 0 ? Math.round((thisMonth - previous) / previous * 100) : null
  return { categoryTotals, weekly, monthly, previous, thisMonth, change }
}

export function goalProgress(goal: Goal, today: string) {
  const remaining = Math.max(0, goal.target - goal.saved)
  const elapsed = dayDifference(goal.createdOn, today)
  const estimatedDays = goal.saved > 0 && elapsed > 0 ? Math.ceil(remaining * elapsed / goal.saved) : null
  // Very small daily averages can extrapolate beyond the supported calendar.
  const maxDays = dayDifference(today, '9999-12-31')
  const eta = remaining && estimatedDays !== null && estimatedDays <= maxDays ? shiftDays(today, estimatedDays) : null
  return { remaining, percent: Math.min(100, Math.floor(goal.saved * 100 / goal.target)), eta }
}

export function simulatePurchase(ledger: Ledger, price: number, today: string) {
  const summary = ledgerSummary(ledger, today)
  const balanceAfter = summary.balance - price
  const budgetAfter = summary.remainingBudget - price
  return {
    summary, balanceAfter, budgetAfter,
    dailyAfter: Math.floor(Math.max(0, Math.min(balanceAfter, budgetAfter)) / summary.daysLeft),
    goals: ledger.goals.filter(goal => goal.saved < goal.target).map(goal => {
      const gap = goal.target - goal.saved
      const possibleBefore = Math.min(gap, Math.max(0, summary.balance))
      const possibleAfter = Math.min(gap, Math.max(0, balanceAfter))
      return { id: goal.id, name: goal.name, possibleAfter, reduction: possibleBefore - possibleAfter }
    }),
  }
}
