import React, { useEffect, useState } from 'react'

const DOCS = [
  { id: 1, title: '📄 HR 手册 · 考勤假务', text: '公司年假政策：入职满一年享有 5 天带薪年假，满三年 10 天…', pos: [0.15, 0.82] },
  { id: 2, title: '📄 财务制度 · 报销', text: '差旅报销须在返程后 7 个工作日内，在 OA 系统上传发票…', pos: [0.12, 0.18] },
  { id: 3, title: '📄 产品 A 用户手册', text: '产品 A 搭载 5000mAh 电池，标准场景续航约 12 小时…', pos: [0.78, 0.85] },
  { id: 4, title: '📄 行政 · 会议室', text: '会议室预订需提前 1 天在系统申请，单次最长 3 小时…', pos: [0.82, 0.2] },
]
const QUESTIONS = [
  { q: '入职满三年有几天年假？', vec: [0.22, 0.9], answer: '根据 HR 手册：入职满三年享有 10 天带薪年假（满一年为 5 天）。' },
  { q: '发票要在几天内上传？', vec: [0.18, 0.24], answer: '根据财务制度：差旅报销须在返程后 7 个工作日内在 OA 系统上传发票。' },
  { q: '产品 A 电池续航多久？', vec: [0.72, 0.92], answer: '根据产品手册：产品 A 标准场景续航约 12 小时（5000mAh 电池）。' },
]

function cos(a, b) {
  const dot = a[0] * b[0] + a[1] * b[1]
  const n = Math.hypot(...a) * Math.hypot(...b)
  return dot / n
}

const STEPS = ['① 知识库：文档切片', '② 全部向量化入库', '③ 问题向量化 + 相似度检索 Top-2', '④ 检索结果拼进 Prompt', '⑤ LLM 基于资料作答']

export default function RagLab() {
  const [qi, setQi] = useState(0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const q = QUESTIONS[qi]

  const sims = DOCS.map((d) => ({ ...d, sim: cos(q.vec, d.pos) })).sort((a, b) => b.sim - a.sim)
  const top2 = sims.slice(0, 2)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep((s) => { if (s >= 4) { setPlaying(false); return s } return s + 1 })
    }, 1100)
    return () => clearInterval(id)
  }, [playing, qi])

  useEffect(() => { setStep(0) }, [qi])

  const W = 660; const H = 330
  const px = (x) => 50 + x * 480
  const py = (y) => 40 + (1 - y) * 250

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>用户提问</label>
          <div className="seg">
            {QUESTIONS.map((qq, i) => <button key={i} className={qi === i ? 'on' : ''} onClick={() => setQi(i)}>{qq.q}</button>)}
          </div>
        </div>
        <button className="demo-btn primary" onClick={() => { if (step >= 4) setStep(0); setPlaying(!playing) }}>{playing ? '⏸ 暂停' : '▶ 播放全流程'}</button>
        <button className="demo-btn" onClick={() => setStep(Math.min(4, step + 1))}>下一步</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setStep(0) }}>🔄 重置</button>
      </div>

      <div className="demo-canvas-box">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
          {step >= 0 && DOCS.map((d) => {
            const hot = step >= 2 && top2.some((t) => t.id === d.id)
            return (
              <g key={d.id}>
                <rect x={px(d.pos[0]) - 13} y={py(d.pos[1]) - 13} width={26} height={26} rx={6}
                  fill={hot ? '#10b981' : step >= 1 ? '#dbe6fb' : '#eef0f7'} stroke={hot ? '#059669' : '#c9cede'} />
                <text x={px(d.pos[0])} y={py(d.pos[1]) + 4} fontSize={11} fill={hot ? '#fff' : '#64748b'} textAnchor="middle">📄{d.id}</text>
                <text x={px(d.pos[0]) + 18} y={py(d.pos[1]) + 4} fontSize={10} fill="#8a92a6">{d.title.slice(3, 14)}</text>
              </g>
            )
          })}
          {step >= 2 && (
            <>
              <circle cx={px(q.vec[0])} cy={py(q.vec[1])} r={9} fill="#d97706" stroke="#fff" strokeWidth={2} />
              <text x={px(q.vec[0]) + 14} y={py(q.vec[1]) + 4} fontSize={11.5} fill="#b45309" fontWeight={700}>❓ 问题向量</text>
              {top2.map((t) => (
                <line key={t.id} x1={px(q.vec[0])} y1={py(q.vec[1])} x2={px(t.pos[0])} y2={py(t.pos[1])}
                  stroke="#d97706" strokeWidth={1 + t.sim * 3} opacity={0.6} strokeDasharray="4 3" />
              ))}
            </>
          )}
          <text x={50} y={22} fontSize={12} fill="#8a92a6">向量空间俯视图：位置越近 = 语义越相近（真实是几百维，这里是示意）</text>
          {step >= 3 && (
            <foreignObject x={330} y={H - 118} width={320} height={110}>
              <div style={{ background: '#f6f2e8', border: '1px solid #e4d5b0', borderRadius: 10, padding: '8px 12px', fontSize: 11.5, lineHeight: 1.6, fontFamily: 'var(--mono)' }}>
                <b>拼装 Prompt：</b><br />「参考资料：{top2.map((t) => t.text.slice(0, 18) + '…').join(' ')}<br />请根据参考资料回答：{q.q}」
              </div>
            </foreignObject>
          )}
        </svg>
      </div>

      {step >= 2 && (
        <div className="stat-chips" style={{ marginTop: 12 }}>
          {sims.map((s) => (
            <span key={s.id} className="stat-chip" style={{ border: top2.some((t) => t.id === s.id) ? '1.5px solid var(--green)' : 'none', color: top2.some((t) => t.id === s.id) ? '#047857' : 'var(--text-2)' }}>
              文档{s.id} 相似度 <b>{s.sim.toFixed(3)}</b>{top2.some((t) => t.id === s.id) ? ' ✓入选' : ''}
            </span>
          ))}
        </div>
      )}
      {step >= 4 && (
        <div style={{ marginTop: 12, background: '#ecfaf3', border: '1px solid #bfe8d2', borderRadius: 11, padding: '12px 16px', fontSize: 14 }}>
          <b style={{ color: '#047857' }}>🤖 回答：</b>{q.answer}
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>回答里的事实全部来自检索到的资料——这就是 RAG 抑制幻觉的方式。</div>
        </div>
      )}
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 10 }}>
        当前进度：{STEPS[Math.min(step, 4)]}
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        RAG = 给大模型外挂一个「开卷考试」系统：<b>知识库 → 切片向量化 → 按语义相似度检索 → 塞进 Prompt → 生成</b>。模型不用重训就能随时更新知识、 cites 来源、大幅减少幻觉——企业落地大模型的第一站几乎都是它。3.5 课的词向量相似度在这里派上了大用场。
      </div>
    </div>
  )
}
