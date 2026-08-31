import React, { useMemo, useState } from 'react'

// 6.1 Scaling Laws：损失随规模呈幂律下降（Kaplan/Chinchilla 风格的示意模型）
// L(N) = L∞ + A·N^-0.076（示意），标记著名模型的位置
const MODELS = [
  { name: 'GPT-2', params: 1.5e9, note: '2019' },
  { name: 'GPT-3', params: 175e9, note: '2020' },
  { name: 'PaLM', params: 540e9, note: '2022' },
]

export default function ScalingLab() {
  const [logN, setLogN] = useState(9.2) // 参数量指数（10^logN）
  const N = Math.pow(10, logN)
  const loss = (n) => 1.6 + 8.5 * Math.pow(n, -0.076)

  const W = 660; const H = 400
  const x0 = 70; const y0 = H - 50; const w0 = W - 100; const h0 = H - 90
  const minLog = 7; const maxLog = 12
  const minL = loss(Math.pow(10, maxLog)); const maxL = loss(Math.pow(10, minLog)) * 1.02
  const px = (lg) => x0 + ((lg - minLog) / (maxLog - minLog)) * w0
  const py = (l) => y0 - ((l - minL) / (maxL - minL)) * h0

  // Chinchilla：最优数据量 ≈ 20 × 参数量
  const optTokens = 20 * N
  const tokens = Math.min(optTokens, Math.pow(10, logN + 2))
  const capability = Math.max(0, Math.min(100, (loss(Math.pow(10, maxLog)) - loss(N)) / (loss(Math.pow(10, maxLog)) - minL) * 100))

  const curve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 100; i++) {
      const lg = minLog + ((maxLog - minLog) * i) / 100
      pts.push([lg, loss(Math.pow(10, lg))])
    }
    return pts
  }, [])

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>参数量 10^{logN.toFixed(1)}（{(N / 1e9).toFixed(1)}B）</label><input type="range" min="7" max="12" step="0.05" value={logN} onChange={(e) => setLogN(+e.target.value)} /></div>
        <div className="stat-chips">
          <span className="stat-chip">预测损失 <b>{loss(N).toFixed(3)}</b></span>
          <span className="stat-chip">Chinchilla 最优数据 <b>{(optTokens / 1e9).toFixed(0)}B tokens</b></span>
        </div>
      </div>
      <div className="demo-canvas-box">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
          {/* 坐标 */}
          <line x1={x0} y1={y0} x2={x0 + w0} y2={y0} stroke="#d9dde9" />
          <line x1={x0} y1={y0} x2={x0} y2={30} stroke="#d9dde9" />
          {/* 幂律曲线 */}
          <path d={curve.map((p, i) => `${i ? 'L' : 'M'}${px(p[0])},${py(p[1])}`).join(' ')} fill="none" stroke="#7c3aed" strokeWidth={2.6} />
          {/* 著名模型 */}
          {MODELS.map((m) => (
            <g key={m.name}>
              <circle cx={px(Math.log10(m.params))} cy={py(loss(m.params))} r={5} fill="#db2777" />
              <text x={px(Math.log10(m.params))} y={py(loss(m.params)) - 12} fontSize={11} fill="#db2777" textAnchor="middle" fontWeight={700}>{m.name}</text>
            </g>
          ))}
          {/* 当前点 */}
          <circle cx={px(logN)} cy={py(loss(N))} r={7} fill="#4f6df5" stroke="#fff" strokeWidth={2} />
          <text x={px(logN)} y={py(loss(N)) + 22} fontSize={11.5} fill="#4f6df5" textAnchor="middle" fontWeight={700}>当前 {(N / 1e9).toFixed(1)}B</text>
          {/* 轴标签 */}
          <text x={x0 + w0 / 2} y={y0 + 34} fontSize={12} fill="#8a92a6" textAnchor="middle">参数量（对数轴）10⁷ → 10¹²</text>
          <text x={20} y={40} fontSize={12} fill="#8a92a6">预训练损失 ↑</text>
          <text x={x0 + 6} y={y0 + 16} fontSize={10.5} fill="#8a92a6">10⁷</text>
          <text x={x0 + w0 - 20} y={y0 + 16} fontSize={10.5} fill="#8a92a6">10¹²</text>
        </svg>
      </div>
      <div className="ctrl-row" style={{ marginTop: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>模型「能力」进度条（示意）：</span>
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${capability}%` }} />
        </div>
        <b style={{ fontSize: 13, color: '#4f6df5' }}>{capability.toFixed(0)}%</b>
      </div>
      <div className="callout tip" style={{ marginTop: 10 }}>
        <div className="co-title">📏 读图指南</div>
        <p style={{ fontSize: 13.5 }}>
          这是**双对数坐标**下的幂律：参数量每 ×10，损失按可预测的固定幅度下降——**大就是更强，且强得有规律**。这就是 2020 年 OpenAI 提出 Scaling Law 时的震撼：模型能力第一次变成可以「买」的资源（算力→性能的汇率表）。
          👉 拖动滑块感受：从 10B 拉到 100B，损失下降的幅度开始变小（边际收益递减），但依然在降。
          <b>Chinchilla 定律</b>（2022）：给定算力预算，参数量和数据量应该**同比例放大**（约 20 token/参数）——按这个标准，GPT-3 喂的数据其实「太瘦」了。
        </p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        Scaling Law 解释了为什么大厂敢豪掷数亿美元训练一次模型：**性能可以提前预测、按算力购买**。也解释了「涌现」争议：宏观损失曲线平滑下降，但具体能力（如算术）可能在某个规模后突然可用。
      </div>
    </div>
  )
}
