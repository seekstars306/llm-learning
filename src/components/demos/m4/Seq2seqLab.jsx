import React, { useState } from 'react'

// 4.3 seq2seq + 注意力的诞生：翻译时每个目标词「回头看」源句
const SRC = ['I', 'love', 'machine', 'learning', '.']
const TGT = ['我', '喜欢', '机器', '学习', '。']
// 手工对齐矩阵：TGT[i] 对 SRC 的注意力分布
const ATTN = [
  [0.05, 0.05, 0.05, 0.05, 0.8], // 我 → I（句首标点对齐）
  [0.06, 0.78, 0.08, 0.04, 0.04], // 喜欢 → love
  [0.03, 0.05, 0.74, 0.13, 0.05], // 机器 → machine
  [0.04, 0.04, 0.28, 0.6, 0.04], // 学习 → learning（兼顾 machine learning 短语）
  [0.02, 0.02, 0.02, 0.02, 0.92], // 。→ .
]

export default function Seq2seqLab() {
  const [tIdx, setTIdx] = useState(0) // 当前正在解码的目标词
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState('attention') // attention | nolook

  React.useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTIdx((i) => { if (i >= TGT.length - 1) { setPlaying(false); return i } return i + 1 })
    }, 1100)
    return () => clearInterval(id)
  }, [playing])

  const W = 660; const H = 330
  const sx = (i) => 70 + i * 118 + 30
  const tx = (i) => 70 + i * 118 + 30
  const srcY = 66; const tgtY = H - 70

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          <button className={mode === 'attention' ? 'on' : ''} onClick={() => setMode('attention')}>带注意力</button>
          <button className={mode === 'nolook' ? 'on' : ''} onClick={() => setMode('nolook')}>不带注意力</button>
        </div>
        <button className="demo-btn primary" onClick={() => { if (tIdx >= TGT.length - 1) setTIdx(0); setPlaying(!playing) }}>{playing ? '⏸ 暂停' : '▶ 逐词翻译'}</button>
        <button className="demo-btn" onClick={() => setTIdx(Math.min(TGT.length - 1, tIdx + 1))}>下一个词</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setTIdx(0) }}>🔄 重置</button>
      </div>
      <div className="demo-canvas-box">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
          {/* 源句 */}
          <text x={22} y={srcY + 5} fontSize={12} fill="#8a92a6">英文源句（编码器读入）</text>
          {SRC.map((w, i) => {
            const weight = mode === 'attention' ? ATTN[tIdx][i] : 1 / SRC.length
            const hot = mode === 'attention' && i === ATTN[tIdx].indexOf(Math.max(...ATTN[tIdx]))
            return (
              <g key={i}>
                <rect x={sx(i) - 34} y={srcY - 22} width={68} height={34} rx={8} fill={hot ? '#4f6df5' : `rgba(79,109,245,${weight * 0.55})`} stroke={hot ? '#4f6df5' : '#c9cede'} />
                <text x={sx(i)} y={srcY} fontSize={14} fontWeight={hot ? 700 : 400} fill={hot ? '#fff' : '#4a5268'} textAnchor="middle">{w}</text>
                <text x={sx(i)} y={srcY + 26} fontSize={10} fill="#8a92a6" textAnchor="middle">{mode === 'attention' ? (weight * 100).toFixed(0) + '%' : ''}</text>
              </g>
            )
          })}
          {/* 对齐连线 */}
          {mode === 'attention' && TGT.slice(0, tIdx + 1).map((w, i) =>
            SRC.map((s, j) => ATTN[i][j] > 0.12 ? (
              <line key={`${i}-${j}`} x1={sx(j)} y1={srcY + 32} x2={tx(i)} y2={tgtY - 30} stroke="#d97706" strokeWidth={ATTN[i][j] * 7} opacity={i === tIdx ? 0.85 : 0.25} strokeLinecap="round" />
            ) : null
          ))}
          {/* 目标句 */}
          <text x={22} y={tgtY + 5} fontSize={12} fill="#8a92a6">中文目标句（解码器逐词生成）</text>
          {TGT.map((w, i) => {
            const done = i < tIdx
            const cur = i === tIdx
            return (
              <g key={i}>
                <rect x={tx(i) - 34} y={tgtY - 16} width={68} height={34} rx={8}
                  fill={cur ? '#d97706' : done ? '#fdf3e3' : '#f1f3f9'}
                  stroke={cur ? '#d97706' : done ? '#ecd9b4' : '#c9cede'} />
                <text x={tx(i)} y={tgtY + 6} fontSize={15} fontWeight={cur ? 700 : 400} fill={cur ? '#fff' : done ? '#b45309' : '#aeb4c6'} textAnchor="middle">{w}</text>
              </g>
            )
          })}
          {/* 生成状态 */}
          <text x={22} y={30} fontSize={12.5} fill={mode === 'attention' ? '#b45309' : '#dc2626'} fontWeight={600}>
            {mode === 'attention'
              ? `正在生成「${TGT[tIdx]}」：解码器回头扫描源句，聚焦于 ${SRC[ATTN[tIdx].indexOf(Math.max(...ATTN[tIdx]))]}`
              : `正在生成「${TGT[tIdx]}」：只能看到编码器压缩出的「一个定长摘要向量」，无法回看原文`}
          </text>
        </svg>
      </div>
      <div className="callout story" style={{ marginTop: 12 }}>
        <div className="co-title">📖 注意力诞生记</div>
        <p>
          2014 年的 seq2seq 模型翻译长句时表现拉胯——因为整句话被编码器压成**一个固定长度的向量**，就像让人只凭一句「大意摘要」复述全文。
          2015 年 Bahdanau 等人提出：让解码器每生成一个词时，**回头看一遍源句的所有词，按「相关度」加权取信息**——这个「回头看」的机制就是**注意力（attention）**。
          切换上面的「不带注意力」感受一下差别。到了 2017 年，研究者干脆发问：既然注意力这么有用，**干脆把 RNN 也扔掉，只留注意力行不行？**——这就是下一模块的开场。
        </p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        观察连线粗细 = 注意力权重大小。「机器→machine」「学习→learning」的对齐关系是模型自己学出来的，没人标注过。
      </div>
    </div>
  )
}
