import React, { useRef, useState, useEffect } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

// 1.5 过拟合：多项式阶数滑块，观察训练/测试误差走势
export default function OverfitLab() {
  const W = 660; const H = 400
  const cvRef = useRef(null)
  const [deg, setDeg] = useState(1)
  const [seed, setSeed] = useState(3)

  const { train, test } = React.useMemo(() => {
    const rng = mulberry32(seed * 101 + 7)
    const f = (x) => Math.sin(x * 2.4) * 0.55 + x * 0.2
    const mk = (n) => Array.from({ length: n }, () => {
      const x = -1 + rng() * 2
      return [x, f(x) + (rng() - 0.5) * 0.34]
    })
    return { train: mk(14), test: mk(14) }
  }, [seed])

  // 解正规方程求多项式系数（加微小岭正则保证数值稳定）
  const coef = React.useMemo(() => {
    const n = deg + 1
    const A = Array.from({ length: n }, () => new Array(n + 1).fill(0))
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        A[i][j] = train.reduce((s, p) => s + Math.pow(p[0], i + j), 0) + (i === j ? 1e-6 : 0)
      }
      A[i][n] = train.reduce((s, p) => s + p[1] * Math.pow(p[0], i), 0)
    }
    // 高斯消元
    for (let col = 0; col < n; col++) {
      let piv = col
      for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r
      ;[A[col], A[piv]] = [A[piv], A[col]]
      for (let r = col + 1; r < n; r++) {
        const m = A[r][col] / A[col][col]
        for (let c = col; c <= n; c++) A[r][c] -= m * A[col][c]
      }
    }
    const x = new Array(n).fill(0)
    for (let i = n - 1; i >= 0; i--) {
      x[i] = (A[i][n] - A[i].slice(i + 1, n).reduce((s, v, j) => s + v * x[i + 1 + j], 0)) / A[i][i]
    }
    return x
  }, [deg, train])

  const evalP = (x) => coef.reduce((s, c, i) => s + c * x ** i, 0)
  const err = (pts) => pts.reduce((s, p) => s + (evalP(p[0]) - p[1]) ** 2, 0) / pts.length
  const trainErr = err(train); const testErr = err(test)

  const toPx = (x, y) => ({ x: 34 + ((x + 1.15) / 2.3) * (W - 60), y: H - 30 - ((y + 1.15) / 2.3) * (H - 60) })

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#d9dde9'
    ctx.beginPath(); ctx.moveTo(34, H - 30); ctx.lineTo(W - 26, H - 30); ctx.moveTo(34, 20); ctx.lineTo(34, H - 30); ctx.stroke()
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('x →', W - 44, H - 12)

    // 模型曲线
    ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2.4
    ctx.beginPath()
    let pen = false
    for (let i = 0; i <= 300; i++) {
      const x = -1.15 + (2.3 * i) / 300
      const y = evalP(x)
      if (!isFinite(y) || Math.abs(y) > 1.6) { pen = false; continue }
      const q = toPx(x, y)
      pen ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)
      pen = true
    }
    ctx.stroke()

    // 真实规律
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.6
    ctx.beginPath()
    for (let i = 0; i <= 200; i++) {
      const x = -1.15 + (2.3 * i) / 200
      const q = toPx(x, Math.sin(x * 2.4) * 0.55 + x * 0.2)
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)
    }
    ctx.stroke(); ctx.setLineDash([])

    // 训练点 / 测试点
    train.forEach((p) => {
      const q = toPx(p[0], p[1])
      ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#4f6df5'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke()
    })
    test.forEach((p) => {
      const q = toPx(p[0], p[1])
      ctx.beginPath(); ctx.moveTo(q.x - 6, q.y + 6); ctx.lineTo(q.x + 6, q.y - 6); ctx.moveTo(q.x - 6, q.y - 6); ctx.lineTo(q.x + 6, q.y + 6)
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.4; ctx.stroke()
    })
  }
  useEffect(draw, [deg, coef])

  const overfitting = testErr / Math.max(1e-9, trainErr) > 2.2

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>多项式阶数（模型复杂度）</label><input type="range" min="1" max="11" step="1" value={deg} onChange={(e) => setDeg(+e.target.value)} /><span className="val">{deg} 阶</span></div>
        <button className="demo-btn" onClick={() => setSeed(seed + 1)}>🔄 换一批数据</button>
      </div>
      <div className="stat-chips" style={{ marginBottom: 12 }}>
        <span className="stat-chip">训练误差（蓝点） <b>{trainErr.toFixed(4)}</b></span>
        <span className="stat-chip">测试误差（橙×） <b>{testErr.toFixed(4)}</b></span>
        <span className="stat-chip" style={{ color: overfitting ? 'var(--red)' : 'var(--green)' }}>{overfitting ? '⚠️ 过拟合！模型在死记硬背' : testErr > 0.09 && deg < 4 ? '⚠️ 欠拟合：模型太简单' : '✅ 状态健康'}</span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="legend-row" style={{ marginTop: 10 }}>
        <span><span className="legend-dot" style={{ background: '#db2777' }} />模型曲线</span>
        <span><span className="legend-dot" style={{ background: '#10b981' }} />真实规律（模型不知道）</span>
        <span><span className="legend-dot" style={{ background: '#4f6df5', borderRadius: '50%' }} />训练点</span>
        <span>✕ 测试点（考试题）</span>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        👉 <b>1～2 阶</b>：模型太简单，曲线追不上真实规律（欠拟合）。<b>9～11 阶</b>：曲线疯狂扭动去穿过每个训练点，考试（橙×）却错得离谱（过拟合）。<b>3～5 阶</b>：刚刚好。现实中的深度网络参数量巨大，所以「防止过拟合」是永恒课题。
      </div>
    </div>
  )
}
