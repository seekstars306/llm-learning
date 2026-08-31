import React, { useEffect, useRef, useState } from 'react'

// 3.5 优化器赛跑：SGD vs Momentum vs Adam 在病态损失面上
// 损失：椭圆峡谷形 f = 0.5*(10x² + y²) —— 梯度方向几乎总是指向峡谷壁，需要动量/自适应帮助
function loss(x, y) { return 0.5 * (10 * x * x + y * y) }
function grad(x, y) { return [10 * x, y] }

export default function OptimizerLab() {
  const [lr, setLr] = useState(0.18)
  const [stepN, setStepN] = useState(0)
  const [running, setRunning] = useState(false)
  const cvRef = useRef(null)
  const W = 660; const H = 420
  const START = [-2.1, 1.7]

  const paths = React.useMemo(() => {
    const simulate = (kind) => {
      const pts = [{ x: START[0], y: START[1] }]
      let x = START[0]; let y = START[1]
      let mx = 0; let my = 0; let vx = 0; let vy = 0
      let sx = 0; let sy = 0
      const beta1 = 0.9; const beta2 = 0.999
      for (let t = 1; t <= 60; t++) {
        const [gx, gy] = grad(x, y)
        if (kind === 'sgd') {
          x -= lr * gx; y -= lr * gy
        } else if (kind === 'momentum') {
          mx = beta1 * mx + gx; my = beta1 * my + gy
          x -= lr * mx * (1 - beta1 === 0 ? 1 : 1); y -= lr * my
        } else {
          sx = beta1 * sx + (1 - beta1) * gx; sy = beta1 * sy + (1 - beta1) * gy
          vx = beta2 * vx + (1 - beta2) * gx * gx; vy = beta2 * vy + (1 - beta2) * gy * gy
          const mh = sx / (1 - Math.pow(beta1, t)); const vh = vx / (1 - Math.pow(beta2, t))
          const mh2 = sy / (1 - Math.pow(beta1, t)); const vh2 = vy / (1 - Math.pow(beta2, t))
          x -= (lr * 2.2) * mh / (Math.sqrt(vh) + 1e-8)
          y -= (lr * 2.2) * mh2 / (Math.sqrt(vh2) + 1e-8)
        }
        x = Math.max(-2.4, Math.min(2.4, x)); y = Math.max(-2.4, Math.min(2.4, y))
        pts.push({ x, y })
      }
      return pts
    }
    return { sgd: simulate('sgd'), momentum: simulate('momentum'), adam: simulate('adam') }
  }, [lr])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setStepN((s) => { if (s >= 60) { setRunning(false); return s } return s + 1 })
    }, 90)
    return () => clearInterval(id)
  }, [running, lr])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    const px = (x) => W / 2 + x * 130
    const py = (y) => H / 2 - y * 130

    // 等高线（椭圆峡谷）
    for (let v = 0.12; v < 8; v *= 1.45) {
      ctx.strokeStyle = `rgba(79,109,245,${0.3 - v * 0.02})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
        // 损失 = v 的椭圆：10x²+y² = 2v
        const ex = Math.sqrt(2 * v / 10) * Math.cos(a)
        const ey = Math.sqrt(2 * v) * Math.sin(a)
        const q = { x: px(ex), y: py(ey) }
        a === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)
      }
      ctx.stroke()
    }
    // 最优点
    ctx.fillStyle = '#10b981'
    ctx.beginPath(); ctx.arc(px(0), py(0), 5, 0, Math.PI * 2); ctx.fill()
    ctx.font = 'bold 12px sans-serif'; ctx.fillText('最低点 (0,0)', px(0) + 8, py(0) - 8)

    // 三条路径
    const styles = { sgd: ['#dc2626', 'SGD'], momentum: ['#d97706', 'Momentum'], adam: ['#4f6df5', 'Adam'] }
    Object.entries(styles).forEach(([k, [color, name]]) => {
      const pts = paths[k].slice(0, stepN + 1)
      ctx.strokeStyle = color; ctx.lineWidth = 2
      ctx.setLineDash(k === 'sgd' ? [5, 4] : k === 'momentum' ? [2, 3] : [])
      ctx.beginPath()
      pts.forEach((p, i) => { const q = { x: px(p.x), y: py(p.y) }; i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y) })
      ctx.stroke(); ctx.setLineDash([])
      const last = pts[pts.length - 1]
      ctx.beginPath(); ctx.arc(px(last.x), py(last.y), 6, 0, Math.PI * 2)
      ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(name, px(last.x) + 10, py(last.y) - 6)
    })
    // 起点
    ctx.fillStyle = '#1c2130'
    ctx.beginPath(); ctx.arc(px(START[0]), py(START[1]), 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillText('起点', px(START[0]) - 40, py(START[1]))
  }
  useEffect(draw, [stepN, lr, paths])

  const cur = (k) => paths[k][Math.min(stepN, 60)]
  const fmt = (p) => loss(p.x, p.y).toFixed(3)

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>学习率</label><input type="range" min="0.02" max="0.3" step="0.01" value={lr} onChange={(e) => { setLr(+e.target.value); setStepN(0); setRunning(false) }} /><span className="val">{lr.toFixed(2)}</span></div>
        <button className="demo-btn primary" onClick={() => { if (stepN >= 60) setStepN(0); setRunning(!running) }}>{running ? '⏸ 暂停' : '▶ 开始赛跑'}</button>
        <button className="demo-btn" onClick={() => setStepN(Math.min(60, stepN + 1))}>单步</button>
        <button className="demo-btn" onClick={() => { setStepN(0); setRunning(false) }}>🔄 重置</button>
        <span className="stat-chip">步数 <b>{stepN}</b></span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="stat-chips" style={{ marginTop: 10 }}>
        <span className="stat-chip" style={{ color: '#dc2626' }}>SGD 损失 <b>{fmt(cur('sgd'))}</b></span>
        <span className="stat-chip" style={{ color: '#d97706' }}>Momentum 损失 <b>{fmt(cur('momentum'))}</b></span>
        <span className="stat-chip" style={{ color: '#4f6df5' }}>Adam 损失 <b>{fmt(cur('adam'))}</b></span>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        这是一个「峡谷形」损失面：梯度几乎总指向谷壁而非谷底，朴素 SGD 会左右碰壁、蛇皮走位。**Momentum（动量）**把历史步速积累起来，冲劲带动它穿过峡谷；**Adam** 还额外为每个参数自动调节步长（梯度一贯小的参数迈大步），通常又稳又快。大模型默认优化器就是 Adam 家族（AdamW）。
      </div>
    </div>
  )
}
