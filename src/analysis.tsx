import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CalendarDays, Plus, Target, TrendingUp, WalletMinimal } from 'lucide-react'
import { ledgerSummary, money, shortDate, shiftDays, spendingStats } from './finance.ts'
import type { Ledger } from './finance.ts'
import { Empty, IconTile, PageTitle, Progress } from './ui.tsx'

const colors = ['#27b798', '#8872df', '#5687ed', '#f0a06b', '#38a9bc', '#c69521', '#8c9bb0']
const axisStyle = { fontSize: 12, fill: '#51647a' }
const toolStyle = { color: '#243b53', fontSize: '14px', borderRadius: '12px', borderColor: '#e2e8ec' }
const tooltipAmount = (amount: unknown) => typeof amount === 'number' ? money(amount) : ''

export function Analysis({ ledger, today, add, settings }: { ledger: Ledger; today: string; add: () => void; settings: () => void }) {
  const summary = ledgerSummary(ledger, today)
  const stats = spendingStats(ledger.transactions, today)
  const highest = stats.categoryTotals[0]
  return <>
    <PageTitle eyebrow={<><CalendarDays size={16} />{Number(today.slice(5, 7))}월 소비 리포트</>}
      title="소비 분석" detail="어디에, 언제 용돈을 가장 많이 썼는지 살펴봐요." />
    <div className="analysis-summary">
      <article className="card summary-item"><IconTile icon={Target} /><div><small>가장 많이 쓴 카테고리</small>
        <strong>{highest ? highest.name : '기록 없음'}</strong>{highest && <span>{money(highest.amount)}</span>}</div></article>
      <article className="card summary-item"><IconTile icon={TrendingUp} tone="lavender" /><div><small>지난달 대비 지출</small>
        <strong>{stats.change === null ? '비교 데이터 없음' : (stats.change > 0 ? '+' : '') + stats.change + '%'}</strong>
        {stats.change !== null && <span>지난달 전체 {money(stats.previous)}</span>}</div></article>
      <article className="card summary-item"><IconTile icon={WalletMinimal} tone="blue" /><div><small>이달 남은 예산</small>
        <strong>{money(summary.remainingBudget)}</strong><span>월 예산 {money(summary.budget)}</span></div>
        <button className="text-button accent" onClick={settings}>설정</button>
      </article>
    </div>
    {!stats.monthly.some(entry => entry.amount) && !stats.weekly.some(entry => entry.amount) ?
      <section className="card"><Empty title="분석할 지출이 없어요" detail="지출을 남기면 소비 흐름을 확인할 수 있어요."
        action={<button className="button secondary" onClick={add}><Plus size={17} />지출 추가</button>} /></section> :
      <div className="analysis-grid">
        <section className="card chart-card">
          <div className="section-heading"><div><h2>카테고리별 소비</h2><p>이번 달 지출 비중</p></div></div>
          {highest ? <>
            <div className="donut-container">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart><Pie data={stats.categoryTotals} dataKey="amount" nameKey="name" innerRadius="67%" outerRadius="94%"
                  cornerRadius={5} paddingAngle={stats.categoryTotals.length > 1 ? 3 : 0} stroke="none" isAnimationActive={false}>
                  {stats.categoryTotals.map(entry => <Cell key={entry.name} fill={colors[entry.index]} />)}
                </Pie><Tooltip formatter={tooltipAmount} contentStyle={toolStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="donut-label"><small>이번 달 지출</small><strong>{money(stats.thisMonth)}</strong></div>
            </div>
            <ul className="chart-legend">{stats.categoryTotals.map(entry => <li key={entry.name}>
              <span className="chart-dot" style={{ background: colors[entry.index] }} />{entry.name}
              <b>{money(entry.amount)}</b><small>{Math.round(entry.amount / stats.thisMonth * 100)}%</small>
            </li>)}</ul>
          </> : <Empty title="이번 달 지출이 없어요" detail="이번 달 지출을 기록해 보세요." />}
        </section>
        <div className="chart-stack">
          <section className="card chart-card">
            <div className="section-heading"><div><h2>주간 소비</h2><p>최근 7일 · {shortDate(shiftDays(today, -6))} ~ {shortDate(today)}</p></div></div>
            {stats.weekly.some(entry => entry.amount) ? <div className="chart-plot" aria-label="최근 7일 지출 막대그래프">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={stats.weekly} margin={{ top: 10, right: 5, left: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e3eaf0" />
                  <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={8} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={68} allowDecimals={false} tickFormatter={money} />
                  <Tooltip formatter={tooltipAmount} contentStyle={toolStyle} cursor={{ fill: '#eaf8f3' }} />
                  <Bar name="지출" dataKey="amount" fill="#25b99a" radius={[5, 5, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div> : <Empty title="최근 7일간 지출이 없어요" />}
          </section>
          <section className="card chart-card">
            <div className="section-heading"><div><h2>월별 소비 변화</h2><p>최근 6개월 · 이번 달은 오늘까지</p></div></div>
            {stats.monthly.some(entry => entry.amount) ? <div className="chart-plot" aria-label="최근 6개월 지출 변화 그래프">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={stats.monthly} margin={{ top: 10, right: 12, left: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e3eaf0" />
                  <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={68} allowDecimals={false} tickFormatter={money} />
                  <Tooltip formatter={tooltipAmount} contentStyle={toolStyle} />
                  <Line name="지출" dataKey="amount" type="monotone" stroke="#8271db" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div> : <Empty title="최근 6개월간 지출이 없어요" />}
          </section>
        </div>
      </div>}
    <section className="card budget-panel">
      <div className="section-heading"><h2>월 예산 분석</h2><button className="text-button accent" onClick={settings}>예산 설정</button></div>
      <p>{summary.usage === null ? '월 예산을 설정하거나 이번 달 수입을 기록하면 예산 사용률을 볼 수 있어요.' :
        summary.remainingBudget < 0 ? '이번 달 예산을 ' + money(-summary.remainingBudget) + ' 초과했어요.' :
          '월 예산 중 ' + money(summary.remainingBudget) + '이 남았고, 오늘 권장하는 사용 금액은 ' + money(summary.daily) + '이에요.'}</p>
      {summary.usage !== null && <Progress percent={summary.usage} label="월 예산 사용률" />}
    </section>
  </>
}
