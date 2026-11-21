import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { replyToCoach } from './coach-answers.ts'
import type { CoachReply } from './coach-answers.ts'
import { frequentQuestions } from './faq.ts'
import type { Ledger } from './finance.ts'
import { IconTile, PageTitle, PrivacyNote } from './ui.tsx'

const examples = [
  '이번 주에 얼마나 더 써도 돼?',
  '3만 5천 원짜리 옷을 사도 돼?',
  '이번 달에 어디에 가장 많이 썼어?',
  '저축 목표까지 얼마 남았어?',
  frequentQuestions[0],
]

export function Coach({ ledger, today }: { ledger: Ledger; today: string }) {
  const [question, setQuestion] = useState('')
  const [log, setLog] = useState<{ question: string; reply: CoachReply }[]>([])
  const history = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight
  }, [log])

  function send(value: string) {
    const clean = value.trim()
    if (!clean) return
    setLog(current => [...current, { question: clean, reply: replyToCoach(clean, ledger, today, current.at(-1)?.reply.purchase) }])
    setQuestion('')
  }

  return <>
    <PageTitle title="소비 코치" detail="내 기록으로 잔액, 지출, 저축 목표를 함께 살펴봐요." />
    <section className="card coach-panel">
      <div className="coach-intro"><IconTile icon={Sparkles} /><p>“간식에 얼마 썼어?”처럼 물어보면 이 브라우저에 저장된 기록으로 계산해요.</p></div>
      <div className="coach-log" role="log" aria-label="소비 코치 대화" ref={history}>
        {log.map((message, index) => <div className="coach-turn" key={index}>
          <p className="coach-question">{message.question}</p>
          <p className="coach-answer whitespace-pre-line">{message.reply.text}</p>
        </div>)}
      </div>
      <div className="coach-chips" role="group" aria-label="자주 묻는 질문">
        {examples.map(example => <button type="button" className="button secondary" key={example} onClick={() => send(example)}>{example}</button>)}
      </div>
      <form className="coach-form" onSubmit={event => { event.preventDefault(); send(question) }}>
        <label className="sr-only" htmlFor="coach-question">소비 코치에게 질문하기</label>
        <input id="coach-question" aria-describedby="coach-privacy" maxLength={150} value={question}
          onChange={event => setQuestion(event.target.value)} placeholder="예: 지난달보다 얼마나 더 썼어?" />
        <button className="button primary" type="submit" disabled={!question.trim()}><Send size={17} />보내기</button>
        <PrivacyNote id="coach-privacy" />
      </form>
    </section>
  </>
}
