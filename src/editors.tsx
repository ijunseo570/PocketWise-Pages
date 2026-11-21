import { useState } from 'react'
import type { FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { expenseCategories, goalIcons, incomeCategories, money, readAmount, validDate } from './finance.ts'
import type { Category, Goal, GoalIcon, Kind, Transaction } from './finance.ts'
import { goalStyles, IconTile, Modal, MoneyInput, PrivacyNote } from './ui.tsx'


function useSave(close: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run(action: () => Promise<string | null>) {
    if (busy) return
    setError('')
    setBusy(true)
    const problem = await action()
    if (!problem) close()
    else {
      setError(problem)
      setBusy(false)
    }
  }
  return { busy, error, setError, run, dismiss: () => { if (!busy) close() } }
}
export function TransactionEditor({ entry, initialKind, today, save, remove, close }: {
  entry?: Transaction; initialKind: Kind; today: string; save: (entry: Transaction) => Promise<string | null>
  remove: (id: string) => Promise<string | null>; close: () => void
}) {
  const [kind, setKind] = useState(entry?.kind ?? initialKind)
  const categories = kind === 'expense' ? expenseCategories : incomeCategories
  const [category, setCategory] = useState<Category>(entry?.category ?? categories[0])
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '')
  const [date, setDate] = useState(entry?.date ?? today)
  const [memo, setMemo] = useState(entry?.memo ?? '')
  const { busy, error, setError, run, dismiss } = useSave(close)
  const [deleting, setDeleting] = useState(false)

  function changeKind(next: Kind) {
    setKind(next)
    setCategory(next === 'expense' ? expenseCategories[0] : incomeCategories[0])
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = readAmount(amount)
    if (parsed === null) return setError('금액은 ₩1부터 ₩999,999,999까지 정수로 입력해 주세요.')
    if (!validDate(date) || date > today) return setError('오늘 또는 이전 날짜를 입력해 주세요.')
    await run(() => save({ id: entry?.id ?? crypto.randomUUID(), kind, amount: parsed, date, category, memo: memo.trim() }))
  }

  return <Modal title={deleting ? '이 기록을 삭제할까요?' : entry ? '거래 수정' : kind === 'expense' ? '지출 추가' : '용돈 추가'}
    subtitle={deleting ? '삭제하면 잔액과 소비 분석에 바로 반영돼요.' : undefined} close={dismiss}>
    {deleting && entry ? <div className="form-footer">
      <button className="button secondary" disabled={busy} onClick={() => setDeleting(false)}>돌아가기</button>
      <button className="button danger" disabled={busy} onClick={() => void run(() => remove(entry.id))}>{busy ? '삭제 중…' : '삭제하기'}</button>
    </div> : <form className="editor-form" onSubmit={submit} noValidate>
      <div className="segment" role="group" aria-label="거래 유형">
        <button type="button" aria-pressed={kind === 'expense'} onClick={() => changeKind('expense')}>지출</button>
        <button type="button" aria-pressed={kind === 'income'} onClick={() => changeKind('income')}>수입</button>
      </div>
      <label htmlFor="entry-amount">금액<MoneyInput name="entry-amount" value={amount} change={setAmount} /></label>
      <div className="split-fields">
        <label>날짜<input type="date" value={date} max={today} onChange={event => setDate(event.target.value)} /></label>
        <label>카테고리<select value={category} onChange={event => setCategory(event.target.value as Category)}>
          {categories.map(name => <option key={name}>{name}</option>)}
        </select></label>
      </div>
      <div className="text-field">
        <label>메모 <small>선택</small><input value={memo} onChange={event => setMemo(event.target.value)}
          aria-describedby="entry-memo-privacy" maxLength={100} placeholder="어디에, 무엇을 위해 썼나요?" /></label>
        <PrivacyNote id="entry-memo-privacy" />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-footer">
        {entry && <button type="button" className="button plain destructive" disabled={busy} onClick={() => { setError(''); setDeleting(true) }}>
          <Trash2 size={17} /> 삭제
        </button>}
        <button type="button" className="button secondary" onClick={dismiss}>취소</button>
        <button className="button primary" type="submit" disabled={busy}>{busy ? '저장 중…' : '저장하기'}</button>
      </div>
    </form>}
    {deleting && error && <p className="form-error" role="alert">{error}</p>}
  </Modal>
}

export function GoalEditor({ goal, today, save, remove, close }: {
  goal?: Goal; today: string; save: (goal: Goal) => Promise<string | null>; remove: (id: string) => Promise<string | null>; close: () => void
}) {
  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal ? String(goal.target) : '')
  const [saved, setSaved] = useState(goal ? String(goal.saved) : '')
  const [due, setDue] = useState(goal?.due ?? '')
  const [icon, setIcon] = useState<GoalIcon>(goal?.icon ?? 'sparkles')
  const { busy, error, setError, run, dismiss } = useSave(close)
  const [deleting, setDeleting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const targetAmount = readAmount(target)
    const savedAmount = readAmount(saved || '0', true)
    if (!name.trim()) return setError('목표 이름을 입력해 주세요.')
    if (targetAmount === null || savedAmount === null) return setError('목표와 저축 금액을 ₩999,999,999 이하의 정수로 입력해 주세요.')
    if (due && !validDate(due)) return setError('올바른 목표 날짜를 입력해 주세요.')
    await run(() => save({ id: goal?.id ?? crypto.randomUUID(), createdOn: goal?.createdOn ?? today, name: name.trim(),
      target: targetAmount, saved: savedAmount, due, icon }))
  }

  return <Modal title={deleting ? '저축 목표를 삭제할까요?' : goal ? '저축 목표 수정' : '저축 목표 추가'}
    subtitle={deleting && goal ? '이 목표에 모아 둔 ' + money(goal.saved) + '이 사용 가능한 잔액으로 돌아가요.' : undefined} close={dismiss}>
    {deleting && goal ? <div className="form-footer">
      <button className="button secondary" disabled={busy} onClick={() => setDeleting(false)}>돌아가기</button>
      <button className="button danger" disabled={busy} onClick={() => void run(() => remove(goal.id))}>{busy ? '삭제 중…' : '삭제하기'}</button>
    </div> : <form className="editor-form" onSubmit={submit} noValidate>
      <div className="text-field">
        <label>목표 이름<input value={name} onChange={event => setName(event.target.value)}
          aria-describedby="goal-name-privacy" maxLength={60} placeholder="예: 무선 헤드폰" /></label>
        <PrivacyNote id="goal-name-privacy" />
      </div>
      <div className="split-fields">
        <label htmlFor="goal-target">목표 금액<MoneyInput name="goal-target" value={target} change={setTarget} /></label>
        <label htmlFor="goal-saved">실제 저축액<MoneyInput name="goal-saved" value={saved} change={setSaved} /></label>
      </div>
      <p className="field-note">직접 모아 둔 금액을 입력하면 사용 가능한 용돈에서 빠져요.</p>
      <label>목표 날짜 <small>선택</small><input type="date" value={due} onChange={event => setDue(event.target.value)} /></label>
      <fieldset>
        <legend>목표 아이콘</legend>
        <div className="icon-picker">{goalIcons.map(id =>
          <button type="button" key={id} aria-label={goalStyles[id].label} title={goalStyles[id].label}
            aria-pressed={id === icon} onClick={() => setIcon(id)}><IconTile {...goalStyles[id]} /></button>
        )}</div>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-footer">
        {goal && <button type="button" className="button plain destructive" disabled={busy} onClick={() => { setError(''); setDeleting(true) }}>
          <Trash2 size={17} /> 삭제
        </button>}
        <button type="button" className="button secondary" onClick={dismiss}>취소</button>
        <button className="button primary" type="submit" disabled={busy}>{busy ? '저장 중…' : '저장하기'}</button>
      </div>
    </form>}
    {deleting && error && <p className="form-error" role="alert">{error}</p>}
  </Modal>
}

export function SettingsEditor({ budget, save, close }: {
  budget: number | null; save: (budget: number | null) => Promise<string | null>; close: () => void
}) {
  const [amount, setAmount] = useState(budget === null ? '' : String(budget))
  const { busy, error, setError, run, dismiss } = useSave(close)
  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = readAmount(amount)
    if (amount.trim() && parsed === null) return setError('예산은 ₩1부터 ₩999,999,999까지 정수로 입력해 주세요.')
    await run(() => save(parsed))
  }
  return <Modal title="용돈 설정" close={dismiss}>
    <form className="editor-form" onSubmit={submit} noValidate>
      <label htmlFor="budget">매달 지출 예산<MoneyInput name="budget" value={amount} change={setAmount} /></label>
      <p className="field-note">비워두면 이번 달 수입을 예산으로 사용해요.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary self-start" type="submit" disabled={busy}>{busy ? '저장 중…' : '예산 저장'}</button>
    </form>
  </Modal>
}
