import React, { useRef, useState, useEffect } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

// 1.3 线性回归：拖动直线拟合散点，实时看 MSE
export default function LineFitLab() {
  const W = 660; const H = 400
  const cvRef = useRef(null)
  const [w, setW] = useState(-0.6) // 斜率
  const [b, setB] = useState(0.9)  // 截距
  const [drag, setDrag] = useState(null)
  const [showErr, setShowErr] = useState(true)

  const data = React.useMemo(() => {
    const rng = mulberry32(99)
    const pts = []
    for (let i = 0; i < 18; i++) {
      const x = -1 + (2 * i) / 17 + (rng() - 0.5) * 0.06
      const y = 0.7 * x + 0.25 + (rng() - 0.5) * 0.5
      pts.push([x, y])
    }
    return pts
  }, [])

  const mse = data.reduce((s, p) => s + (w * p[0] + b - p[1]) ** 2, 0) / data.length
  const bestW = 0.7; const bestB = 0.25

  // p = [x, y] 世界坐标数组 → 画布像素（y 轴向上翻转）
  function toPx(p) { const [x, y] = p; return { x: 34 + ((x + 1.2) / 2.4) * (W - 60), y: H - 30 - ((y + 1.2) / 2.4) * (H - 60) } }
  function toWorld(px, py) {
    return { x: ((px - 34) / (W - 60)) * 2.4 - 1.2, y: ((H - 30 - py) / (H - 60)) * 2.4 - 1.2 }
  }

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    // 坐标轴
    ctx.strokeStyle = '#d9dde9'
    ctx.beginPath(); ctx.moveTo(34, H - 30); ctx.lineTo(W - 26, H - 30)
    ctx.moveTo(34, 20); ctx.lineTo(34, H - 30); ctx.stroke()
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('面积（标准化）→', W - 130, H - 12)
    ctx.fillText('↑ 房价', 40, 30)

    // 数据点与误差竖线
    data.forEach((p) => {
      const q = toPx(p)
      const yhat = w * p[0] + b
      const qh = toPx([p[0], yhat])
      if (showErr) {
        ctx.strokeStyle = 'rgba(220,38,38,0.45)'; ctx.lineWidth = 1.6
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x, qh.y); ctx.stroke()
        // 平方误差小方块
        const e = Math.abs(q.y - qh.y)
        if (e > 2) { ctx.strokeStyle = 'rgba(220,38,38,0.2)'; ctx.strokeRect(q.x, Math.min(q.y, qh.y), e, e) }
      }
      ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#4f6df5'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke()
    })

    // 拟合直线
    ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2.6
    const p1 = toPx([-1.2, w * -1.2 + b]); const p2 = toPx([1.2, w * 1.2 + b])
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke()

    // 可拖动控制点（线的两端）
    ;[p1, p2].forEach((q) => {
      ctx.beginPath(); ctx.arc(q.x, q.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()
      ctx.strokeStyle = '#db2777'; ctx.lineWidth = 3; ctx.stroke()
    })

    // 真实规律虚线
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.8
    const t1 = toPx([-1.2, bestW * -1.2 + bestB]); const t2 = toPx([1.2, bestW * 1.2 + bestB])
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke(); ctx.setLineDash([])
  }
  useEffect(draw, [w, b, showErr])

  // 用原生 pointer 事件统一鼠标与触摸（手机手指可拖动；不依赖 React 合成事件，
  // 保证拖拽在任何环境下都可靠）。状态经 ref 镜像，避免一次性监听器读到过期闭包。
  const stRef = useRef({ w, b })
  stRef.current = { w, b }
  const dragRef = useRef(null)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const pt = (e) => {
      const rect = cv.getBoundingClientRect()
      return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H]
    }
    const down = (e) => {
      const [px, py] = pt(e)
      const { w, b } = stRef.current
      const p1 = toPx([-1.2, w * -1.2 + b]); const p2 = toPx([1.2, w * 1.2 + b])
      const d1 = Math.hypot(px - p1.x, py - p1.y); const d2 = Math.hypot(px - p2.x, py - p2.y)
      if (d1 < 20 || d2 < 20) {
        dragRef.current = d1 < d2 ? 'p1' : 'p2'
        setDrag(dragRef.current)
        try { cv.setPointerCapture(e.pointerId) } catch { /* 旧浏览器忽略 */ }
      }
    }
    const move = (e) => {
      if (!dragRef.current) return
      const [px, py] = pt(e)
      const wd = toWorld(px, py)
      const { b } = stRef.current
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
      if (dragRef.current === 'p1') {
        const nw = clamp((b - wd.y) / (-1.2 - wd.x), -1.5, 1.5)
        setW(nw); setB(clamp(wd.y + wd.x * nw, -1.2, 1.2))
      } else {
        setW(clamp((wd.y - b) / (1.2 - wd.x), -1.5, 1.5)); setB(b)
      }
    }
    const up = (e) => {
      if (!dragRef.current) return
      try { cv.releasePointerCapture(e.pointerId) } catch { /* 未捕获时忽略 */ }
      dragRef.current = null
      setDrag(null)
    }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up)
    cv.addEventListener('pointercancel', up)
    return () => {
      cv.removeEventListener('pointerdown', down)
      cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up)
      cv.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>斜率 w</label><input type="range" min="-1.5" max="1.5" step="0.01" value={w} onChange={(e) => setW(+e.target.value)} /><span className="val">{w.toFixed(2)}</span></div>
        <div className="ctrl"><label>截距 b</label><input type="range" min="-1.2" max="1.2" step="0.01" value={b} onChange={(e) => setB(+e.target.value)} /><span className="val">{b.toFixed(2)}</span></div>
        <button className="demo-btn" onClick={() => setShowErr(!showErr)}>{showErr ? '隐藏误差方块' : '显示误差方块'}</button>
      </div>
      <div className="stat-chips" style={{ marginBottom: 12 }}>
        <span className="stat-chip">均方误差 MSE <b>{mse.toFixed(4)}</b></span>
        <span className="stat-chip" style={{ color: mse < 0.06 ? 'var(--green)' : 'var(--text-2)' }}>{mse < 0.06 ? '🎉 非常接近真实规律了！' : '目标：让 MSE 越小越好（试试 < 0.06）'}</span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} style={{ cursor: drag ? 'grabbing' : 'grab', touchAction: 'none' }} /></div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        🔴 红线是你手里的「模型」，可以直接<b>拖动两端的圆点</b>或用滑块调整。红色竖线和方块就是每个点的「误差」，MSE 是所有误差平方的平均。绿色虚线是数据背后真实的规律 —— 你拖到红线和它重合时，MSE 就最小。机器学习做的事，就是自动完成你刚才手动做的这件事。
      </div>
    </div>
  )
}
