import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { findAnswer, frequentQuestions } from './faq.ts'
import { IconTile, PageTitle, PrivacyNote } from './ui.tsx'

export function Coach() {
  const [question, setQuestion] = useState('')
  const [log, setLog] = useState<{ question: string; answer: string }[]>([])
  const history = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight
  }, [log])

  function send(value: string) {
    const clean = value.trim()
    if (!clean) return
    setLog(current => [...current, { question: clean, answer: findAnswer(clean) }])
    setQuestion('')
  }

  return <>
    <PageTitle title="소비 코치" detail="용돈, 지출, 저축에 대해 자주 묻는 질문의 답을 찾아요." />
    <section className="card coach-panel">
      <div className="coach-intro"><IconTile icon={Sparkles} /><p>질문을 적거나 자주 묻는 질문을 눌러 보세요.</p></div>
      <div className="coach-log" role="log" aria-label="소비 코치 대화" ref={history}>
        {log.map((message, index) => <div className="coach-turn" key={index}>
          <p className="coach-question">{message.question}</p><p className="coach-answer">{message.answer}</p>
        </div>)}
      </div>
      <div className="coach-chips" role="group" aria-label="자주 묻는 질문">
        {frequentQuestions.map(example => <button type="button" className="button secondary" key={example} onClick={() => send(example)}>{example}</button>)}
      </div>
      <form className="coach-form" onSubmit={event => { event.preventDefault(); send(question) }}>
        <label className="sr-only" htmlFor="coach-question">소비 코치에게 질문하기</label>
        <input id="coach-question" aria-describedby="coach-privacy" maxLength={150} value={question}
          onChange={event => setQuestion(event.target.value)} placeholder="궁금한 점을 적어 보세요" />
        <button className="button primary" type="submit" disabled={!question.trim()}><Send size={17} />보내기</button>
        <PrivacyNote id="coach-privacy" />
      </form>
    </section>
  </>
}
