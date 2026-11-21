import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import {
  ArrowDownLeft, Bike, Bus, Coffee, Gamepad2, Gift, Headphones, LibraryBig, PencilLine,
  ReceiptText, ShoppingBag, Sparkles, Utensils, WalletCards, X,
} from 'lucide-react'
import type { Category, GoalIcon, Transaction } from './finance.ts'
import { money, shortDate } from './finance.ts'

export const categoryStyles: Record<Category, { icon: typeof Coffee; tone: string }> = {
  '식비': { icon: Utensils, tone: 'peach' },
  '카페·간식': { icon: Coffee, tone: 'lavender' },
  '교통': { icon: Bus, tone: 'blue' },
  '쇼핑': { icon: ShoppingBag, tone: 'pink' },
  '취미·게임': { icon: Gamepad2, tone: 'mint' },
  '학용품': { icon: PencilLine, tone: 'yellow' },
  '기타': { icon: ReceiptText, tone: 'gray' },
  '정기 용돈': { icon: WalletCards, tone: 'mint' },
  '추가 용돈': { icon: ArrowDownLeft, tone: 'mint' },
  '선물': { icon: Gift, tone: 'pink' },
}

export const goalStyles: Record<GoalIcon, { icon: typeof Headphones; label: string; tone: string }> = {
  headphones: { icon: Headphones, label: '헤드폰', tone: 'lavender' },
  game: { icon: Gamepad2, label: '게임', tone: 'blue' },
  bike: { icon: Bike, label: '자전거', tone: 'mint' },
  books: { icon: LibraryBig, label: '책', tone: 'yellow' },
  gift: { icon: Gift, label: '선물', tone: 'pink' },
  sparkles: { icon: Sparkles, label: '기타', tone: 'peach' },
}

export function IconTile({ icon: Icon, tone = 'mint', size = 20 }: {
  icon: typeof Coffee; tone?: string; size?: number
}) {
  return <span className={'icon-tile tone-' + tone}><Icon size={size} strokeWidth={1.85} aria-hidden="true" /></span>
}

export function Progress({ percent, label }: { percent: number; label: string }) {
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={Math.min(100, percent)} aria-valuetext={percent + '%'}>
    <span style={{ width: Math.min(100, percent) + '%' }} />
  </div>
}

export function Empty({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="empty-state">
    <IconTile icon={ReceiptText} />
    <strong>{title}</strong>
    {detail && <p>{detail}</p>}
    {action}
  </div>
}

export function PageTitle({ eyebrow, title, detail, action }: {
  eyebrow?: ReactNode; title: string; detail: string; action?: ReactNode
}) {
  return <div className="page-title">
    <div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 tabIndex={-1}>{title}</h1>
      <p>{detail}</p>
    </div>
    {action}
  </div>
}

export function EntryRow({ entry, onClick }: { entry: Transaction; onClick: () => void }) {
  const style = categoryStyles[entry.category]
  return <button type="button" className="entry-row" onClick={onClick} aria-label={(entry.memo || entry.category) + ' 기록 수정'}>
    <IconTile {...style} />
    <span className="entry-text">
      <strong>{entry.memo || entry.category}</strong>
      <small>{entry.category}<span aria-hidden="true"> · </span>{shortDate(entry.date)}</small>
    </span>
    <span className={'entry-amount ' + (entry.kind === 'income' ? 'positive' : '')}>
      {entry.kind === 'income' ? '+' : '−'}{money(entry.amount)}
    </span>
  </button>
}

export function Modal({ title, subtitle, close, children }: {
  title: string; subtitle?: string; close: () => void; children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} aria-labelledby={id} onCancel={event => { event.preventDefault(); close() }}
    onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="dialog-inner">
      <div className="dialog-heading">
        <div><h2 id={id}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button type="button" className="icon-button" aria-label="닫기" onClick={close}><X size={21} /></button>
      </div>
      {children}
    </div>
  </dialog>
}

export function MoneyInput({ name, value, change, placeholder = '0' }: {
  name: string; value: string; change: (value: string) => void; placeholder?: string
}) {
  return <span className="money-field">
    <span aria-hidden="true">₩</span>
    <input id={name} name={name} inputMode="numeric" autoComplete="off" maxLength={13}
      value={value} onChange={event => change(event.target.value)} placeholder={placeholder} />
  </span>
}

export function PrivacyNote({ id }: { id: string }) {
  return <small className="privacy-note" id={id}>이름 · 학번 · 연락처는 쓰지 마세요</small>
}
