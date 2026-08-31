import React, { useMemo, useState } from 'react'
import { Md } from './Md.jsx'

// 确定性伪随机：同一题每次进入页面排列一致，但不同题排列不同，
// 避免正确答案集中在同一选项位置（答案位置偏差）
function seededPerm(len, seedStr) {
  let h = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rand = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5
    return ((h >>> 0) % 100000) / 100000
  }
  const idx = Array.from({ length: len }, (_, i) => i)
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

// 课末小测验：每题即时反馈 + 解释；全部作答后汇报成绩
export function Quiz({ lessonId, questions }) {
  const [answers, setAnswers] = useState({}) // qIdx -> 选中的 optIdx（显示序）

  // 每题的选项显示顺序（确定性洗牌）+ 答案在显示序中的新位置
  const perms = useMemo(
    () => questions.map((q, qi) => {
      const perm = seededPerm(q.opts.length, `${lessonId}-${qi}-${q.q}`)
      return { perm, newAnswer: perm.indexOf(q.a) }
    }),
    [lessonId, questions]
  )

  const score = questions.reduce((s, q, i) => s + (answers[i] === perms[i].newAnswer ? 1 : 0), 0)
  const answered = Object.keys(answers).length
  const allDone = answered === questions.length

  function pick(qi, oi) {
    if (answers[qi] !== undefined) return
    const next = { ...answers, [qi]: oi }
    setAnswers(next)
    const sc = questions.reduce((s, q, i) => s + (next[i] === perms[i].newAnswer ? 1 : 0), 0)
    if (Object.keys(next).length === questions.length) {
      window.dispatchEvent(new CustomEvent('lllearn-quiz', { detail: { lessonId, score: sc, total: questions.length } }))
    }
  }

  return (
    <div className="quiz-card">
      <h3>🎯 随堂小测（{questions.length} 题）</h3>
      {questions.map((q, qi) => {
        const picked = answers[qi]
        const correctIdx = perms[qi].newAnswer
        return (
          <div key={qi}>
            <div className="quiz-q">{qi + 1}. {q.q}</div>
            <div className="quiz-opts">
              {perms[qi].perm.map((origIdx, oi) => {
                let cls = 'quiz-opt'
                if (picked !== undefined) {
                  if (oi === correctIdx) cls += ' correct'
                  else if (oi === picked) cls += ' wrong'
                }
                return (
                  <button key={origIdx} className={cls} disabled={picked !== undefined} onClick={() => pick(qi, oi)}>
                    <span className="opt-letter">{'ABCD'[oi]}</span>
                    <span><Md text={q.opts[origIdx]} /></span>
                  </button>
                )
              })}
            </div>
            {picked !== undefined && (
              <div className="quiz-why">
                {picked === correctIdx ? '✅ 答对了！' : '❌ 再想想～'} <Md text={q.why} />
              </div>
            )}
          </div>
        )
      })}
      {allDone && (
        <div className="quiz-score" style={{ background: score === questions.length ? 'var(--green-soft)' : 'var(--amber-soft)' }}>
          {score === questions.length
            ? `🏆 满分 ${score}/${questions.length}！这个概念你已经拿下了。`
            : `得分 ${score}/${questions.length}。错了没关系，看看解释，往下继续。`}
        </div>
      )}
    </div>
  )
}
