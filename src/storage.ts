import { todayInKorea } from './finance.ts'
import type { Ledger } from './finance.ts'
import { emptyLedger, validLedger } from './ledger.ts'

export const localLedgerKey = 'pocketwise.v1.personal'

const asObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function decodeLedger(value: unknown, today = todayInKorea()): Ledger {
  if (!asObject(value) || value.version !== 1) throw new Error('지원하지 않는 기록 형식이에요.')
  const transactions = value.transactions ?? []
  const goals = value.goals ?? []
  if (!Array.isArray(transactions) || !Array.isArray(goals)) throw new Error('지원하지 않는 기록 형식이에요.')
  const data = {
    version: 1,
    budget: value.budget ?? null,
    transactions: transactions.map(entry => asObject(entry) ? {
      ...entry, category: entry.category ?? '기타', memo: entry.memo ?? '',
    } : entry),
    goals: goals.map(goal => asObject(goal) ? {
      ...goal, saved: goal.saved ?? 0, createdOn: goal.createdOn ?? today, due: goal.due ?? '', icon: goal.icon ?? 'sparkles',
    } : goal),
  }
  if (!validLedger(data, today)) throw new Error('저장된 기록의 일부 항목을 읽지 못했어요.')
  return data
}

export function readLocalLedger(storage: Pick<Storage, 'getItem'> = localStorage) {
  const raw = storage.getItem(localLedgerKey)
  return raw === null ? emptyLedger() : decodeLedger(JSON.parse(raw))
}

export function saveLocalLedger(ledger: Ledger, storage: Pick<Storage, 'setItem'> = localStorage) {
  if (!validLedger(ledger)) throw new Error('입력값을 확인해 주세요.')
  const data = {
    version: ledger.version,
    budget: ledger.budget,
    transactions: ledger.transactions.map(entry => ({ ...entry, type: 'transaction' })),
    goals: ledger.goals.map(goal => ({ ...goal, type: 'goal' })),
  }
  storage.setItem(localLedgerKey, JSON.stringify(data))
}
