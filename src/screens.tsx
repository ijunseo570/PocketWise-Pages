import { useState } from 'react'
import { CalendarDays, CalendarPlus, Check, ChevronDown, Pencil, Plus, ShoppingBag, Target, Wallet } from 'lucide-react'
import {
  expenseCategories, goalProgress, incomeCategories, ledgerSummary, money, readAmount, shortDate,
  simulatePurchase, sortedTransactions, totals,
} from './finance.ts'
import type { Goal, Kind, Ledger, Transaction } from './finance.ts'
import { Empty, EntryRow, goalStyles, IconTile, Modal, MoneyInput, PageTitle, Progress } from './ui.tsx'

export function Records({ ledger, add, edit }: {
  ledger: Ledger; add: (kind: Kind) => void; edit: (entry: Transaction) => void
}) {
  const [kind, setKind] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<'new' | 'old'>('new')
  const categoryList = kind === 'income' ? incomeCategories : kind === 'expense' ? expenseCategories :
    [...new Set([...expenseCategories, ...incomeCategories])]
  const filtered = sortedTransactions(ledger.transactions.filter(entry =>
    (kind === 'all' || entry.kind === kind) && (category === 'all' || category === entry.category)), sort)
  const total = totals(filtered)

  return <>
    <PageTitle title="용돈 기록" detail="들어온 돈과 쓴 돈을 한곳에 모아 봐요."
      action={<button className="button primary title-action" onClick={() => add('expense')}><Plus size={19} />거래 추가</button>} />
    <section className="card records-panel" aria-label="거래 목록">
      <div className="record-tools">
        <div className="segment" role="group" aria-label="거래 유형">
          {[['all', '전체'], ['income', '수입'], ['expense', '지출']].map(([value, label]) =>
            <button key={value} aria-pressed={value === kind} onClick={() => { setKind(value); setCategory('all') }}>{label}</button>)}
        </div>
        <div className="filters">
          <label className="select-control"><span className="sr-only">카테고리 필터</span>
            <select value={category} onChange={event => setCategory(event.target.value)}>
              <option value="all">모든 카테고리</option>
              {categoryList.map(name => <option key={name}>{name}</option>)}
            </select><ChevronDown size={15} aria-hidden="true" />
          </label>
          <label className="select-control"><span className="sr-only">정렬 순서</span>
            <select value={sort} onChange={event => setSort(event.target.value === 'old' ? 'old' : 'new')}>
              <option value="new">최신순</option><option value="old">오래된순</option>
            </select><ChevronDown size={15} aria-hidden="true" />
          </label>
        </div>
      </div>
      <div className="record-totals"><span>선택한 기록 {filtered.length}건</span>
        <div><span>수입 <b className="positive">{money(total.income)}</b></span><span>지출 <b>{money(total.expense)}</b></span></div>
      </div>
      {filtered.length ? <div className="entry-list">{filtered.map(entry =>
        <EntryRow key={entry.id} entry={entry} onClick={() => edit(entry)} />)}</div> :
        <Empty title={ledger.transactions.length ? '선택한 조건에 맞는 기록이 없어요' : '아직 기록이 없어요'}
          detail={ledger.transactions.length ? '필터를 바꿔서 다른 기록을 찾아보세요.' : '수입이나 지출을 기록해 보세요.'}
          action={!ledger.transactions.length && <button className="button secondary" onClick={() => add('income')}>
            <Plus size={17} />수입 추가</button>} />}
    </section>
  </>
}

export function Goals({ ledger, today, add, edit }: { ledger: Ledger; today: string; add: () => void; edit: (goal: Goal) => void }) {
  const summary = ledgerSummary(ledger, today)
  return <>
    <PageTitle title="저축 목표" detail="갖고 싶은 것에 이름을 붙이고, 조금씩 모아 봐요."
      action={<button className="button primary title-action" onClick={add}><Plus size={19} />목표 추가</button>} />
    <section className="savings-overview">
      <div><IconTile icon={Target} /><span>목표에 모아 둔 저축액<strong>{money(summary.savings)}</strong></span></div>
      <div><IconTile icon={Wallet} tone="blue" /><span>사용 가능한 남은 용돈<strong>{money(summary.balance)}</strong></span></div>
    </section>
    {ledger.goals.length ? <div className="goal-grid">{ledger.goals.map(goal => {
      const progress = goalProgress(goal, today)
      return <article className="card goal-card" key={goal.id}>
        <div className="goal-card-head"><IconTile {...goalStyles[goal.icon]} />
          <div><h2>{goal.name}</h2><p>{goal.due ? '목표일 ' + goal.due.replaceAll('-', '.') : '목표일 자유'}</p></div>
          <button className="icon-button" onClick={() => edit(goal)} aria-label={goal.name + ' 수정'}><Pencil size={18} /></button>
        </div>
        <div className="goal-card-amount"><strong>{money(goal.saved)}</strong><span> / {money(goal.target)}</span><b>{progress.percent}%</b></div>
        <Progress percent={progress.percent} label={goal.name + ' 달성률'} />
        <dl className="goal-info">
          <div><dt><Target size={16} /> 남은 금액</dt><dd>{money(progress.remaining)}</dd></div>
          <div><dt><CalendarDays size={16} /> 예상 달성일</dt><dd>{!progress.remaining ? '목표 달성!' :
            progress.eta ? progress.eta.replaceAll('-', '.') : '저축 추이 필요'}</dd></div>
        </dl>
      </article>
    })}</div> : <section className="card"><Empty title="모으고 싶은 목표가 있나요?" detail="목표 금액과 실제로 모아 둔 금액을 기록해 보세요."
      action={<button className="button secondary" onClick={add}><CalendarPlus size={17} />첫 목표 추가</button>} /></section>}
  </>
}

export function Simulator({ ledger, today, close }: { ledger: Ledger; today: string; close: () => void }) {
  const [value, setValue] = useState('')
  const [price, setPrice] = useState<number | null>(null)
  const [error, setError] = useState('')
  const result = price === null ? null : simulatePurchase(ledger, price, today)
  return <Modal title="구매 전 시뮬레이터" subtitle="사기 전에, 남은 용돈과 저축 계획을 확인해 봐요." close={close}>
    <form className="editor-form sim-form" noValidate onSubmit={event => {
      event.preventDefault()
      const parsed = readAmount(value)
      if (parsed === null) return setError('가격은 ₩1부터 ₩999,999,999까지 정수로 입력해 주세요.')
      setError('')
      setPrice(parsed)
    }}>
      <label htmlFor="purchase-price">구매 예정 금액<MoneyInput name="purchase-price" value={value} placeholder="예: 15,000"
        change={next => { setValue(next); setPrice(null); setError('') }} /></label>
      <button type="submit" className="button primary"><ShoppingBag size={18} />계산하기</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
    {result && <div className="sim-result" aria-live="polite">
      <div className={'sim-state ' + (result.balanceAfter < 0 ? 'warning' : '')}>
        <span>{result.balanceAfter < 0 ? '현재 잔액이 부족해요' : <><Check size={16} />현재 잔액으로 구매할 수 있어요</>}</span>
        <strong>{money(result.balanceAfter)}</strong><small>구매 후 예상 잔액</small>
      </div>
      <dl className="sim-details">
        <div><dt>현재 남은 용돈</dt><dd>{money(result.summary.balance)}</dd></div>
        <div><dt>구매 예정 금액</dt><dd>{money(price ?? 0)}</dd></div>
        <div><dt>이번 예산 기간 남은 일수</dt><dd>{result.summary.daysLeft}일 · {shortDate(today)} 포함</dd></div>
        <div><dt>구매 후 하루 권장 사용 금액</dt><dd>{money(result.dailyAfter)}</dd></div>
      </dl>
      <div className="sim-goals">
        <h3>저축 목표에 미치는 영향</h3>
        <p>{result.goals.length ? '아래 금액은 구매 후 목표별로 추가 저축할 수 있는 한도예요. 모아 둔 저축액은 그대로예요.' :
          '진행 중인 저축 목표가 없어요.'}</p>
        {result.goals.map(goal => <div className="sim-goal" key={goal.id}>
          <span>{goal.name}</span><b>{money(goal.possibleAfter)}{goal.reduction > 0 && <small> · {money(goal.reduction)} 감소</small>}</b>
        </div>)}
      </div>
      <div className="sim-advice"><h3>구매를 결정하기 전에</h3>
        <p>{result.balanceAfter < 0 ? '지금 쓸 수 있는 돈으로는 가격을 감당하기 어려워요. 다음 용돈이 들어오는 날이나 더 낮은 가격을 확인해 보세요.' :
          result.budgetAfter < 0 ? '지금 결제할 수 있어도 이달 예산을 넘어요. 이번 달 꼭 써야 하는 돈이 남았는지 확인해 보세요.' :
            '이달 예산 안에서 살 수 있어요. 남은 교통비나 간식비, 저축 계획을 먼저 챙길 수 있는지 생각해 보세요.'}</p>
      </div>
    </div>}
  </Modal>
}
