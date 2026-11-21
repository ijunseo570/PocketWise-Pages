import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, CircleHelp,
  Plus, PiggyBank, ShoppingBag, Target, Wallet, WalletMinimal,
} from 'lucide-react'
import type { Ledger, Transaction } from './finance.ts'
import { goalProgress, ledgerSummary, longDate, money, sortedTransactions } from './finance.ts'
import { Empty, EntryRow, goalStyles, IconTile, PageTitle, Progress } from './ui.tsx'

export function Dashboard({ ledger, today, addIncome, addExpense, editTransaction, openRecords, openGoals, openSimulator, openSocial, openSettings }: {
  ledger: Ledger; today: string; addIncome: () => void; addExpense: () => void; editTransaction: (entry: Transaction) => void
  openRecords: () => void; openGoals: () => void; openSimulator: () => void; openSocial: () => void; openSettings: () => void
}) {
  const summary = ledgerSummary(ledger, today)
  const recent = sortedTransactions(ledger.transactions.filter(entry => entry.kind === 'expense')).slice(0, 5)
  const goal = ledger.goals.find(item => item.saved < item.target) ?? ledger.goals[0]
  return <>
    <PageTitle eyebrow={<><CalendarDays size={16} />{longDate(today)}</>} title="내 용돈 한눈에 보기"
      detail="오늘의 용돈을 확인하고, 내일의 목표를 계획해 봐요."
      action={<div className="title-actions">
        <button className="button primary title-action" onClick={addIncome}><Plus size={19} />용돈 추가</button>
        <button className="button secondary title-action" onClick={addExpense}><ArrowUpRight size={18} />지출 추가</button>
      </div>} />
    <section className="balance-banner" aria-label="용돈 잔액">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <div className="balance-label"><WalletMinimal size={17} />현재 남은 용돈</div>
        <strong>{money(summary.balance)}</strong>
        {ledger.transactions.length === 0 && ledger.goals.length === 0 ?
          <div className="hero-note">처음 받은 용돈이나 지금 가진 금액을 등록해 봐요.</div> :
          <div className="hero-note"><PiggyBank size={16} /> 저축에 따로 모아 둔 돈 <b>{money(summary.savings)}</b></div>}
      </div>
      <img className="wallet-art" src={import.meta.env.BASE_URL + 'wallet.png'} alt="" width={398} height={280} />
    </section>
    <section className="metrics-grid" aria-label="이달의 용돈 현황">
      <article className="metric card">
        <IconTile icon={ArrowDownLeft} />
        <div><span>이번 달 수입</span><strong>{money(summary.income)}</strong></div>
        <small>이번 달 들어온 돈</small>
      </article>
      <article className="metric card">
        <IconTile icon={ArrowUpRight} tone="peach" />
        <div><span>이번 달 지출</span><strong>{money(summary.expense)}</strong></div>
        <small>이번 달 사용한 돈</small>
      </article>
      <article className="metric card">
        <IconTile icon={ChartNoAxesColumnIncreasing} tone="blue" />
        <div><button className="text-button metric-label" onClick={openSettings}>예산 사용률<CircleHelp size={14} /></button>
          <strong>{summary.usage === null ? '예산 미설정' : summary.usage + '%'}</strong>
        </div>
        {summary.usage === null ? <small>예산을 설정해 보세요</small> :
          <Progress percent={summary.usage} label="월 예산 사용률" />}
      </article>
      <article className="metric card">
        <IconTile icon={CalendarDays} tone="lavender" />
        <div><span>오늘의 권장 금액</span><strong>{money(summary.daily)}</strong></div>
        <small>오늘부터 이번 달 말까지 {summary.daysLeft}일</small>
      </article>
    </section>
    <div className="dashboard-lower">
      <section className="card recent-panel">
        <div className="section-heading">
          <h2>최근 지출</h2>
          <button className="text-button accent" onClick={openRecords}>전체 보기</button>
        </div>
        {recent.length ? <div className="entry-list">{recent.map(entry =>
          <EntryRow key={entry.id} entry={entry} onClick={() => editTransaction(entry)} />)}</div> :
          <Empty title="아직 지출이 없어요" detail="첫 지출을 기록해 보세요."
            action={<button className="button secondary" onClick={addExpense}><Plus size={17} />지출 추가</button>} />}
      </section>
      <div className="dashboard-aside">
        <section className="card quick-panel">
          <div className="section-heading"><h2>바로가기</h2></div>
          <button className="quick-row quick-mint" onClick={openSimulator}>
            <IconTile icon={ShoppingBag} />
            <span><strong>구매 전 시뮬레이터</strong><small>사고 나면 얼마나 남을까?</small></span>
          </button>
          <button className="quick-row quick-light" onClick={openSocial}>
            <IconTile icon={Target} tone="yellow" />
            <span><strong>친구 절약 랭킹</strong><small>배포판에서 이용 안내</small></span>
          </button>
        </section>
        {goal && <section className="card goal-preview">
          <div className="section-heading">
            <h2>저축 목표</h2>
            <button className="text-button accent" onClick={openGoals}>목표 보기</button>
          </div>
          <div className="goal-preview-summary">
            <IconTile {...goalStyles[goal.icon]} />
            <strong>{goal.name}</strong>
            <b>{goalProgress(goal, today).percent}%</b>
          </div>
          <Progress percent={goalProgress(goal, today).percent} label={goal.name + ' 달성률'} />
        </section>}
        {!goal && <button className="card no-goal" onClick={openGoals}><Wallet size={20} />저축 목표 세우기<ChevronRight size={15} /></button>}
      </div>
    </div>
  </>
}
