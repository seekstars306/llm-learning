import React, { useState } from 'react'

const EXPERTS = ['📚 百科常识', '☁️ 天气生活', '💻 代码技术', '🧮 数学推理', '🎨 创意写作', '🌍 翻译语言', '🏛 历史人文', '⚕️ 医疗健康']
const EXPERT_COLORS = ['#4f6df5', '#0d9488', '#d97706', '#7c3aed', '#db2777', '#10b981', '#64748b', '#dc2626']

const TOKENS = [
  { t: '天气', scores: [0.5, 4.2, 0.3, 0.4, 0.6, 0.5, 0.7, 0.8] },
  { t: 'bug', scores: [0.4, 0.3, 4.5, 0.6, 0.4, 0.3, 0.3, 0.3] },
  { t: '导数', scores: [0.6, 0.3, 0.8, 4.4, 0.3, 0.2, 0.4, 0.3] },
  { t: '写诗', scores: [0.5, 0.5, 0.4, 0.6, 4.3, 0.5, 0.8, 0.3] },
  { t: '疫苗', scores: [0.6, 0.6, 0.3, 0.3, 0.3, 0.3, 0.5, 4.6] },
  { t: '长城', scores: [1.2, 0.4, 0.2, 0.3, 0.9, 0.3, 4.5, 0.3] },
]

function softmaxTop2(scores) {
  const idx = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0])
  const picked = idx.slice(0, 2)
  const es = picked.map(([s]) => Math.exp(s))
  const sum = es.reduce((a, b) => a + b, 0)
  return picked.map(([, i], k) => ({ i, w: es[k] / sum }))
}

export default function MoeLab() {
  const [ti, setTi] = useState(0)
  const [playing, setPlaying] = useState(false)
  const token = TOKENS[ti]
  const routed = softmaxTop2(token.scores)

  React.useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTi((t) => { if (t >= TOKENS.length - 1) { setPlaying(false); return t } return t + 1 })
    }, 1500)
    return () => clearInterval(id)
  }, [playing])

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>输入 token</label>
          <div className="seg">
            {TOKENS.map((tk, i) => <button key={i} className={ti === i ? 'on' : ''} onClick={() => { setTi(i); setPlaying(false) }}>{tk.t}</button>)}
          </div>
        </div>
        <button className="demo-btn primary" onClick={() => { if (ti >= TOKENS.length - 1) setTi(0); setPlaying(!playing) }}>{playing ? '⏸ 暂停' : '▶ 依次路由'}</button>
        <span className="stat-chip">激活专家 <b>2 / 8</b></span>
      </div>

      <div className="demo-canvas-box">
        <svg viewBox="0 0 660 360" style={{ display: 'block', width: '100%' }}>
          {/* token 入口 */}
          <rect x={40} y={140} width={92} height={44} rx={10} fill="#4f6df5" />
          <text x={86} y={167} fontSize={16} fill="#fff" textAnchor="middle" fontWeight={700}>{token.t}</text>
          <text x={86} y={205} fontSize={11.5} fill="#8a92a6" textAnchor="middle">输入 token</text>
          {/* 路由器 */}
          <rect x={210} y={128} width={110} height={68} rx={12} fill="#1e2233" />
          <text x={265} y={156} fontSize={12.5} fill="#fff" textAnchor="middle" fontWeight={700}>路由器 Router</text>
          <text x={265} y={176} fontSize={10.5} fill="#9aa3b8" textAnchor="middle">给 8 位专家打分</text>
          {/* 连线 token→router */}
          <line x1={132} y1={162} x2={210} y2={162} stroke="#4f6df5" strokeWidth={3} />
          <text x={170} y={152} fontSize={10.5} fill="#8a92a6" textAnchor="middle">向量</text>
          {/* 专家们 */}
          {EXPERTS.map((e, i) => {
            const y = 24 + i * 42
            const picked = routed.find((r) => r.i === i)
            const score = token.scores[i]
            const active = !!picked
            return (
              <g key={i}>
                {/* 分数连线 */}
                <line x1={320} y1={162} x2={430} y2={y + 18} stroke={active ? EXPERT_COLORS[i] : '#dfe3ee'} strokeWidth={active ? 2.4 : 1} opacity={active ? 0.9 : 0.5} />
                <text x={372} y={(162 + y + 18) / 2 - 4} fontSize={10} fill={active ? EXPERT_COLORS[i] : '#b9c1d9'} textAnchor="middle">{score.toFixed(1)}</text>
                {/* 专家块 */}
                <rect x={430} y={y} width={168} height={34} rx={9}
                  fill={active ? EXPERT_COLORS[i] + '22' : '#f1f3f9'}
                  stroke={active ? EXPERT_COLORS[i] : '#d9dde9'} strokeWidth={active ? 2 : 1} />
                <text x={444} y={y + 21} fontSize={12} fill={active ? EXPERT_COLORS[i] : '#aeb4c6'} fontWeight={active ? 700 : 400}>{e}</text>
                {active && (
                  <>
                    <rect x={436} y={y + 26} width={picked.w * 156} height={4} rx={2} fill={EXPERT_COLORS[i]} />
                    <text x={606} y={y + 21} fontSize={11.5} fill={EXPERT_COLORS[i]} fontWeight={800}>{(picked.w * 100).toFixed(0)}%</text>
                  </>
                )}
              </g>
            )
          })}
          <text x={514} y={352} fontSize={10.5} fill="#8a92a6" textAnchor="middle">只有被选中的专家真正参与计算</text>
        </svg>
      </div>

      <div className="callout tip" style={{ marginTop: 12 }}>
        <div className="co-title">🎓 关键账本</div>
        <p style={{ fontSize: 13.5 }}>
          切换不同 token 你会发现：路由器给 8 位专家打分，<b>只激活得分最高的 2 位</b>（top-2），输出按权重加权合并。
          这意味着：模型「总参数量」可以是稠密模型的几倍（知识容量大增），但每个 token 的「实际计算量」不变——
          <b>总参数 ≠ 计算量</b>，这是 MoE 与稠密模型的根本区别。举例：一个 400B 的 MoE 每次只激活约 40B 的部分，
          推理成本接近 40B 模型，知识储备却向 400B 看齐。代价：训练要小心专家负载均衡（有的专家累死、有的闲置），显存仍需装下全部专家。
        </p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        MoE（混合专家）不是新想法（1991 年就有雏形），但真正大规模成功是近年：Mixtral、DeepSeek-V3（671B 总参 / 37B 激活）、GPT-4（业内普遍推测为 MoE）都采用它——「用算力换知识」的主流答案。
      </div>
    </div>
  )
}
