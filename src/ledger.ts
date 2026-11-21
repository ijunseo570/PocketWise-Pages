import { expenseCategories, goalIcons, incomeCategories, todayInKorea, validDate } from './finance.ts'
import type { Ledger } from './finance.ts'

const validAmount = (value: unknown, minimum = 1) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= 999_999_999
const validText = (value: unknown, max: number) => typeof value === 'string' && value.length <= max
const validKey = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(value)
const validDay = (value: unknown) => typeof value === 'string' && validDate(value)
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const oneOf = (list: readonly string[], value: unknown) => typeof value === 'string' && list.includes(value)

export function emptyLedger(): Ledger {
  return { version: 1, budget: null, transactions: [], goals: [] }
}

function uniqueEntries(entries: unknown[], validate: (entry: Record<string, unknown>) => boolean) {
  const seen = new Set<unknown>()
  return entries.every(entry => {
    if (!isRecord(entry) || !validKey(entry.id) || seen.has(entry.id) || !validate(entry)) return false
    seen.add(entry.id)
    return true
  })
}

export function validLedger(value: unknown, today = todayInKorea()): value is Ledger {
  if (!isRecord(value) || value.version !== 1 || (value.budget !== null && !validAmount(value.budget))) return false
  if (!Array.isArray(value.transactions) || !Array.isArray(value.goals)) return false
  return uniqueEntries(value.transactions, entry =>
    (entry.kind === 'expense' || entry.kind === 'income') &&
    oneOf(entry.kind === 'expense' ? expenseCategories : incomeCategories, entry.category) &&
    validAmount(entry.amount) && typeof entry.date === 'string' && validDate(entry.date) && entry.date <= today &&
    validText(entry.memo, 100),
  ) && uniqueEntries(value.goals, goal =>
    validAmount(goal.target) && validAmount(goal.saved, 0) &&
    typeof goal.name === 'string' && !!goal.name.trim() && goal.name.length <= 60 &&
    typeof goal.createdOn === 'string' && validDate(goal.createdOn) && goal.createdOn <= today &&
    (goal.due === '' || validDay(goal.due)) && oneOf(goalIcons, goal.icon),
  )
}
