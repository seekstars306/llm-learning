import React, { useRef, useState, useEffect } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

// 1.4 梯度下降：在损失等高线图上看着小球一步步滚下山谷
export default function GradientDescentLab() {
  const W = 660; const H = 400
  const cvRef = useRef(null)
  const [lr, setLr] = useState(0.1)
  const [pos, setPos] = useState({ w: -1.05, b: 1.0 })
  const [path, setPath] = useState([{ w: -1.05, b: 1.0 }])
  const [running, setRunning] = useState(false)
  const [gradMode, setGradMode] = useState(true)

  const data = React.useMemo(() => {
    const rng = mulberry32(99)
    const pts = []
    for (let i = 0; i < 18; i++) {
      const x = -1 + (2 * i) / 17 + (rng() - 0.5) * 0.06
      pts.push([x, 0.7 * x + 0.25 + (rng() - 0.5) * 0.5])
    }
    return pts
  }, [])

  const lossAt = React.useCallback((w, b) => data.reduce((s, p) => s + (w * p[0] + b - p[1]) ** 2, 0) / data.length, [data])
  const gradAt = React.useCallback((w, b) => {
    const gw = data.reduce((s, p) => s + 2 * (w * p[0] + b - p[1]) * p[0], 0) / data.length
    const gb = data.reduce((s, p) => s + 2 * (w * p[0] + b - p[1]), 0) / data.length
    return [gw, gb]
  }, [data])

  function stepOnce() {
    setPos((cur) => {
      const [gw, gb] = gradAt(cur.w, cur.b)
      const nw = cur.w - lr * gw
      const nb = cur.b - lr * gb
      const next = { w: Math.max(-1.25, Math.min(1.25, nw)), b: Math.max(-1.25, Math.min(1.25, nb)) }
      setPath((p) => [...p, next])
      return next
    })
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(stepOnce, 260)
    return () => clearInterval(id)
  }, [running, lr])

  // 世界坐标 (w,b) ∈ [-1.2,1.2]²
  const toPx = (w, b) => ({ x: 34 + ((w + 1.2) / 2.4) * (W - 60), y: H - 30 - ((b + 1.2) / 2.4) * (H - 60) })

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)

    const N = 66
    const losses = []
    for (let i = 0; i <= N; i++) {
      losses.push([])
      for (let j = 0; j <= N; j++) {
        losses[i].push(lossAt(-1.2 + (2.4 * i) / N, -1.2 + (2.4 * j) / N))
      }
    }
    const maxL = Math.min(0.9, Math.max(...losses.flat()))

    // 热力图（损失越小越深蓝）
    const cw = (W - 60) / N; const ch = (H - 60) / N
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const v = Math.min(1, losses[i][j] / maxL)
        // 从深蓝(谷底)到浅色
        const r = 235 - v * 180; const g = 240 - v * 140; const b = 255 - v * 40
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(34 + i * cw, H - 30 - (j + 1) * ch, cw + 0.6, ch + 0.6)
      }
    }

    // 等高线（近似：阈值穿越处描点太复杂，直接画几个数值圈）
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1

    // 历史路径
    ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2
    ctx.beginPath()
    path.forEach((p, i) => {
      const q = toPx(p.w, p.b)
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)
    })
    ctx.stroke()
    path.forEach((p, i) => {
      const q = toPx(p.w, p.b)
      ctx.beginPath(); ctx.arc(q.x, q.y, i === path.length - 1 ? 7 : 3, 0, Math.PI * 2)
      ctx.fillStyle = i === path.length - 1 ? '#db2777' : 'rgba(219,39,119,0.55)'
      ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke()
    })

    // 谷底标记
    const opt = toPx(0.7, 0.25)
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(opt.x, opt.y, 12, 0, Math.PI * 2); ctx.stroke()
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#047857'
    ctx.fillText('谷底（最优解）', opt.x - 18, opt.y + 28)

    // 轴标签
    ctx.fillStyle = '#6b7390'; ctx.font = '12px sans-serif'
    ctx.fillText('斜率 w →', W - 96, H - 12)
    ctx.save(); ctx.translate(14, 100); ctx.rotate(-Math.PI / 2); ctx.fillText('截距 b →', 0, 0); ctx.restore()
  }
  useEffect(draw, [path, data])

  const curLoss = lossAt(pos.w, pos.b)
  const [gw, gb] = gradAt(pos.w, pos.b)
  const steps = path.length - 1

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>学习率</label><input type="range" min="0.01" max="0.9" step="0.01" value={lr} onChange={(e) => setLr(+e.target.value)} /><span className="val">{lr.toFixed(2)}</span></div>
        <button className="demo-btn primary" onClick={() => setRunning(!running)}>{running ? '⏸ 暂停' : '▶ 开始下山'}</button>
        <button className="demo-btn" onClick={stepOnce} disabled={running}>走一步</button>
        <button className="demo-btn" onClick={() => { setPos({ w: -1.05, b: 1.0 }); setPath([{ w: -1.05, b: 1.0 }]); setRunning(false) }}>🔄 回到山顶</button>
      </div>
      <div className="stat-chips" style={{ marginBottom: 12 }}>
        <span className="stat-chip">当前损失 <b>{curLoss.toFixed(4)}</b></span>
        <span className="stat-chip">已走步数 <b>{steps}</b></span>
        <span className="stat-chip">梯度 (gw, gb) <b>({gw.toFixed(2)}, {gb.toFixed(2)})</b></span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        这张图把「每种 (w, b) 组合的损失」画成了地形：<b>颜色越浅，损失越小（深蓝 = 高损失区）</b>。小球每一步都沿着「当前点最陡的下坡方向」（负梯度）走一小步。
        👉 把学习率调到 <b>0.05</b> 感受「步子太小学得慢」；再调到 <b>0.8</b> 看看「步子太大来回震荡甚至越过谷底」。真实的神经网络就是在数百万维的空间里做这件事。
      </div>
    </div>
  )
}
