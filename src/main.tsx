import { lazy, StrictMode, Suspense, useEffect, useState } from 'react'
import {
  ChartNoAxesColumnIncreasing, House, LockKeyhole, ReceiptText, Settings2, Sparkles, Target, UsersRound,
  WalletCards,
} from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { Coach } from './coach.tsx'
import { Dashboard } from './dashboard.tsx'
import { GoalEditor, SettingsEditor, TransactionEditor } from './editors.tsx'
import { todayInKorea } from './finance.ts'
import type { Goal, Kind, Ledger, Transaction } from './finance.ts'
import { Goals, Records, Simulator } from './screens.tsx'
import { useLedger } from './use-ledger.ts'
import type { Commit } from './use-ledger.ts'
import { IconTile, Modal } from './ui.tsx'
import './style.css'

const Analysis = lazy(() => import('./analysis.tsx').then(module => ({ default: module.Analysis })))

const navigation = [
  { path: '/', label: '홈', icon: House },
  { path: '/records', label: '기록', icon: ReceiptText },
  { path: '/analysis', label: '소비 분석', icon: ChartNoAxesColumnIncreasing },
  { path: '/goals', label: '저축 목표', icon: Target },
  { path: '/coach', label: '소비 코치', icon: Sparkles },
] as const
type Dialog =
  | { type: 'entry'; entry?: Transaction; kind: Kind }
  | { type: 'goal'; goal?: Goal }
  | { type: 'settings' | 'simulator' | 'social' }

function MenuLinks() {
  return navigation.map(({ path, label, icon: Icon }) =>
    <NavLink key={path} to={path} end><Icon size={21} strokeWidth={1.85} />{label}</NavLink>)
}

function App() {
  const { ledger, commit, notice, error, refresh } = useLedger()
  if (!ledger) return <main className="record-recovery">
    <section className="card feature-panel">
      <IconTile icon={WalletCards} size={25} />
      <h1>기록을 불러오지 못했어요</h1>
      <p role="alert">{error}</p>
      <button className="button primary" onClick={refresh}>새로 고침</button>
    </section>
  </main>
  return <Workspace {...{ ledger, commit, notice }} />
}

function Workspace({ ledger, commit, notice }: { ledger: Ledger; commit: Commit; notice: string }) {
  const [today, setToday] = useState(todayInKorea)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const item = navigation.find(entry => entry.path === pathname) ?? navigation[0]

  useEffect(() => {
    const refresh = () => setToday(todayInKorea())
    const timer = window.setInterval(refresh, 30_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh) }
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const close = () => setDialog(null)
  const add = (kind: Kind) => setDialog({ type: 'entry', kind })
  const addExpense = () => add('expense')
  const editEntry = (entry: Transaction) => setDialog({ type: 'entry', kind: entry.kind, entry })
  const editGoal = (goal?: Goal) => setDialog({ type: 'goal', goal })
  const settings = () => setDialog({ type: 'settings' })
  const social = () => setDialog({ type: 'social' })

  return <div className="app-shell">
    <a className="skip" href="./#main-content" onClick={event => {
      event.preventDefault()
      document.getElementById('main-content')?.focus()
    }}>본문으로 이동</a>
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-mark"><WalletCards size={23} strokeWidth={2.1} /></span>
        <span>Pocket<span>Wise</span></span>
      </Link>
      <nav aria-label="주 메뉴" className="desktop-nav"><MenuLinks /></nav>
      <div className="sidebar-footer">
        <button onClick={settings}><Settings2 size={20} />용돈 설정</button>
        <div className="storage-caption"><LockKeyhole size={15} /> 이 브라우저에 저장</div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <span className="breadcrumb"><item.icon size={18} strokeWidth={1.9} /> {item.label}</span>
        <Link className="brand mobile-brand" to="/" aria-label="PocketWise 홈">
          <span className="brand-mark"><WalletCards size={20} /></span><span>Pocket<span>Wise</span></span>
        </Link>
        <div className="header-actions">
          <button className="button header-social secondary" onClick={social} aria-label="친구·그룹"><UsersRound size={18} /><span>친구·그룹</span></button>
          <button className="avatar" onClick={settings} aria-label="용돈 설정"><Settings2 size={19} strokeWidth={1.9} /></button>
        </div>
      </header>
      <main className="main" id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Dashboard ledger={ledger} today={today} addIncome={() => add('income')} addExpense={addExpense}
            editTransaction={editEntry} openRecords={() => navigate('/records')} openGoals={() => navigate('/goals')}
            openSimulator={() => setDialog({ type: 'simulator' })} openSocial={social} openSettings={settings} />} />
          <Route path="/records" element={<Records ledger={ledger} add={add} edit={editEntry} />} />
          <Route path="/analysis" element={<Suspense fallback={<div className="card feature-panel" role="status">소비 분석을 불러오는 중이에요.</div>}>
            <Analysis ledger={ledger} today={today} add={addExpense} settings={settings} />
          </Suspense>} />
          <Route path="/goals" element={<Goals ledger={ledger} today={today} add={() => editGoal()} edit={editGoal} />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="하단 메뉴"><MenuLinks /></nav>
    <div className="toast-area" role="status">{notice && <span>{notice}</span>}</div>
    {dialog?.type === 'entry' && <TransactionEditor entry={dialog.entry} initialKind={dialog.kind} today={today} close={close}
      save={entry => commit(current => ({ ...current, transactions: current.transactions.some(item => item.id === entry.id) ?
        current.transactions.map(item => item.id === entry.id ? entry : item) : [entry, ...current.transactions] }), '거래를 저장했어요.')}
      remove={id => commit(current => ({ ...current, transactions: current.transactions.filter(item => item.id !== id) }), '거래를 삭제했어요.')} />}
    {dialog?.type === 'goal' && <GoalEditor goal={dialog.goal} today={today} close={close}
      save={goal => commit(current => ({ ...current, goals: current.goals.some(item => item.id === goal.id) ?
        current.goals.map(item => item.id === goal.id ? goal : item) : [...current.goals, goal] }), '저축 목표를 저장했어요.')}
      remove={id => commit(current => ({ ...current, goals: current.goals.filter(item => item.id !== id) }), '저축 목표를 삭제했어요.')} />}
    {dialog?.type === 'settings' && <SettingsEditor budget={ledger.budget} close={close}
      save={budget => commit(current => ({ ...current, budget }), '월 예산을 저장했어요.')} />}
    {dialog?.type === 'simulator' && <Simulator ledger={ledger} today={today} close={close} />}
    {dialog?.type === 'social' && <Modal title="친구·그룹" close={close}>
      <section className="feature-panel social-panel">
        <IconTile icon={UsersRound} tone="blue" size={24} />
        <h2>이 기능은 배포판에서는 쓸 수 없어요</h2>
        <button className="button primary" onClick={close}>확인</button>
      </section>
    </Modal>}
  </div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><HashRouter><App /></HashRouter></StrictMode>)
