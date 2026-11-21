export const unknownAnswer = '아직 모르는 질문이에요'

const entries = [
  {
    question: '받은 용돈은 어떻게 추가해요?',
    related: ['수입 기록을 어디에 등록해요?', '잔액에 돈을 넣으려면?'],
    answer: '홈에서 용돈 추가를 눌러 금액과 날짜, 카테고리를 입력하고 저장하세요. 홈 잔액과 수입 합계에 바로 반영돼요.',
  },
  {
    question: '지출을 어떻게 기록해요?',
    related: ['쓴 돈을 어디에 적나요?', '결제한 금액을 등록하고 싶어요.'],
    answer: '홈에서 지출 추가를 눌러 금액, 날짜, 카테고리를 입력하세요. 메모는 필요할 때만 적으면 돼요.',
  },
  {
    question: '하루에 얼마나 써도 돼요?',
    related: ['오늘의 권장 금액은 어떻게 계산해요?', '이번 주에 얼마나 더 써도 돼?'],
    answer: '홈의 오늘의 권장 금액을 확인하세요. 사용 가능한 용돈과 남은 월 예산 중 작은 금액을 남은 일수로 나눠 계산해요.',
  },
  {
    question: '저축 목표를 어떻게 만들어요?',
    related: ['목표까지 얼마나 남았어요?', '모으고 싶은 금액을 어디에 적어요?'],
    answer: '저축 목표에서 목표 추가를 누르세요. 목표 금액과 실제로 모은 돈을 입력하면 진행률과 남은 금액을 볼 수 있어요.',
  },
  {
    question: '월 예산을 어떻게 설정해요?',
    related: ['한 달 용돈 한도를 바꾸고 싶어요.', '예산 사용률은 어떻게 계산해요?'],
    answer: '용돈 설정에서 매달 지출 예산을 입력하세요. 비워 두면 이번 달 수입을 예산으로 사용해요.',
  },
  {
    question: '잘못 적은 거래를 어떻게 수정해요?',
    related: ['거래 메모나 금액을 변경하고 싶어요.', '수입이나 지출을 고치려면?'],
    answer: '기록 화면에서 수정할 거래를 누르세요. 바뀐 금액, 날짜, 카테고리 또는 메모를 입력하고 저장하면 돼요.',
  },
  {
    question: '거래를 어떻게 삭제해요?',
    related: ['중복된 거래 내역을 지우고 싶어요.', '잘못 추가한 기록을 지우려면?'],
    answer: '기록 화면에서 해당 거래를 열고 삭제를 누르세요. 확인하면 잔액과 통계도 함께 갱신돼요.',
  },
  {
    question: '어디에 가장 많이 썼는지 볼 수 있나요?',
    related: ['소비 분석의 카테고리별 그래프는 어디 있나요?', '이번 달에 어디에 가장 많이 썼어?'],
    answer: '소비 분석에서 이번 달 가장 많이 쓴 카테고리와 카테고리별 금액을 볼 수 있어요. 주간·월간 그래프도 함께 확인할 수 있어요.',
  },
  {
    question: '지난달과 지출을 비교하려면 어떻게 해요?',
    related: ['지난달 대비 지출이 늘었나요?', '월별 소비 변화가 궁금해요.'],
    answer: '소비 분석의 지난달 대비 지출과 월별 소비 변화를 확인하세요. 지난달 지출 기록이 있으면 증감률도 볼 수 있어요.',
  },
  {
    question: '구매하기 전에 남을 돈을 계산할 수 있나요?',
    related: ['구매 전 시뮬레이터는 어떻게 써요?', '물건을 사면 잔액이 얼마 남아요?'],
    answer: '홈의 구매 전 시뮬레이터에 가격을 입력하세요. 구매 후 예상 잔액과 하루 권장 금액, 월 예산 초과 여부를 보여 줘요.',
  },
  {
    question: '저축 목표를 언제 달성할 수 있나요?',
    related: ['예상 달성일은 무엇으로 계산해요?', '저축 목표 달성일은 언제인가요?', '저축 속도로 목표 날짜를 알고 싶어요.'],
    answer: '저축 목표에 표시된 예상 달성일을 확인하세요. 목표를 만든 뒤 하루 이상 지났고 실제 저축액이 있으면 지금까지의 저축 속도로 추정해요.',
  },
  {
    question: '저장된 내 기록은 어디에 남아요?',
    related: ['새로고침해도 데이터가 남나요?', '다른 기기에서도 내 기록을 볼 수 있어요?'],
    answer: '이 사이트의 기록은 현재 브라우저에 저장돼요. 같은 브라우저에서 같은 주소를 다시 열면 기록을 볼 수 있어요.',
  },
  {
    question: '예산을 넘었을 때는 어떻게 해요?',
    related: ['월 예산이 초과됐어요.', '남은 예산이 마이너스예요.'],
    answer: '소비 분석에서 이번 달 남은 예산과 이번 주에 꼭 필요한 지출을 먼저 확인해 보세요. 구매 전 시뮬레이터로 새 지출의 영향을 살펴볼 수 있어요.',
  },
  {
    question: '기록에서 같은 카테고리만 볼 수 있어요?',
    related: ['거래 목록을 분류하거나 정렬하고 싶어요.', '지출 필터를 적용하려면?'],
    answer: '기록 화면의 카테고리 필터를 선택하세요. 수입과 지출을 따로 보거나 최신순과 오래된순으로 정렬할 수도 있어요.',
  },
] as const

export const frequentQuestions = entries.slice(0, 4).map(item => item.question)

const particles = ['으로부터', '에게서', '한테서', '에서는', '에서', '으로', '에게', '한테', '부터', '까지', '처럼', '보다', '은', '는', '이', '가', '을', '를', '에', '의', '도', '과', '와', '로', '만']

function normalizeWords(text: string) {
  const words = text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return words.flatMap(word => {
    while (true) {
      const suffix = particles.find(particle => word.endsWith(particle) && word.length - particle.length >= 2)
      if (!suffix) break
      word = word.slice(0, -suffix.length)
    }
    return word.length >= 2 && !particles.includes(word) ? [word] : []
  })
}

const indexed = entries.flatMap(({ question, related, answer }) => [question, ...related].map(phrase => {
  const ordered = normalizeWords(phrase)
  return { phrase: ordered.join(' '), words: new Set(ordered), answer }
}))

export function findAnswer(text: string) {
  const ordered = normalizeWords(text)
  const query = new Set(ordered)
  const exact = indexed.find(item => item.phrase === ordered.join(' '))
  if (exact) return exact.answer
  let best = { matches: 0, similarity: 0, answer: unknownAnswer }
  for (const item of indexed) {
    const matches = [...query].filter(word => item.words.has(word)).length
    if (matches === 0) continue
    const similarity = matches / (query.size + item.words.size - matches)
    if (matches > best.matches || (matches === best.matches && similarity > best.similarity)) {
      best = { matches, similarity, answer: item.answer }
    }
  }
  return best.answer
}
