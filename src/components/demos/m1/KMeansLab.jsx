import React, { useRef, useState, useEffect } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

// 1.2 无监督学习：K-Means 聚类动画
export default function KMeansLab() {
  const [K, setK] = useState(3)
  const [step, setStep] = useState(0) // 0=未开始；奇数=已分配；偶数=已更新中心
  const [running, setRunning] = useState(false)
  const [points, setPoints] = useState([])
  const [centroids, setCentroids] = useState([])
  const [assign, setAssign] = useState([])
  const cvRef = useRef(null)
  const W = 660; const H = 400
  const COLORS = ['#4f6df5', '#db2777', '#10b981', '#d97706']

  function reset(k = K) {
    const rng = mulberry32(20240601)
    const pts = []
    const blobs = [[0.25, 0.3], [0.75, 0.35], [0.5, 0.75]]
    for (let b = 0; b < 3; b++) {
      for (let i = 0; i < 40; i++) {
        pts.push({ x: blobs[b][0] + (rng() - 0.5) * 0.28, y: blobs[b][1] + (rng() - 0.5) * 0.3 })
      }
    }
    for (let i = 0; i < 25; i++) pts.push({ x: rng() * 0.9 + 0.05, y: rng() * 0.85 + 0.07 })
    const cs = []
    for (let i = 0; i < k; i++) cs.push({ x: rng() * 0.8 + 0.1, y: rng() * 0.8 + 0.1 })
    setPoints(pts); setCentroids(cs); setAssign(new Array(pts.length).fill(-1)); setStep(0); setRunning(false)
  }
  useEffect(() => { reset(K) }, [K])

  function doAssign(cs = centroids) {
    const a = points.map((p) => {
      let best = 0; let bd = Infinity
      cs.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2
        if (d < bd) { bd = d; best = i }
      })
      return best
    })
    setAssign(a)
    return a
  }

  function doUpdate(a = assign) {
    const cs = centroids.map((c, i) => {
      const mem = points.filter((_, j) => a[j] === i)
      if (!mem.length) return c
      return { x: mem.reduce((s, p) => s + p.x, 0) / mem.length, y: mem.reduce((s, p) => s + p.y, 0) / mem.length }
    })
    setCentroids(cs)
    return cs
  }

  function advance() {
    if (step % 2 === 0) { doAssign(); setStep(step + 1) } else { doUpdate(); setStep(step + 1) }
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setStep((s) => {
        if (s % 2 === 0) { doAssign(); return s + 1 }
        doUpdate(); return s + 1
      })
    }, 700)
    return () => clearInterval(id)
  }, [running, centroids, points, assign])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    const px = (p) => ({ x: 20 + p.x * (W - 40), y: 20 + p.y * (H - 40) })
    // 分配色
    const colored = step >= 1
    points.forEach((p, i) => {
      const q = px(p)
      ctx.beginPath(); ctx.arc(q.x, q.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = colored && assign[i] >= 0 ? COLORS[assign[i] % COLORS.length] : '#9aa3b8'
      ctx.fill()
    })
    // 中心
    centroids.forEach((c, i) => {
      const q = px(c)
      ctx.strokeStyle = COLORS[i % COLORS.length]; ctx.lineWidth = 2.5
      ctx.strokeRect(q.x - 9, q.y - 9, 18, 18)
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`中心${i + 1}`, q.x, q.y - 14)
    })
    ctx.textAlign = 'left'
  }
  useEffect(draw, [points, centroids, assign, step])

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>聚类数 K</label>
          <div className="seg">{[2, 3, 4].map((k) => <button key={k} className={K === k ? 'on' : ''} onClick={() => setK(k)}>{k} 类</button>)}</div>
        </div>
        <button className="demo-btn primary" onClick={() => setRunning(!running)}>{running ? '⏸ 暂停' : '▶ 自动迭代'}</button>
        <button className="demo-btn" onClick={advance} disabled={running}>{step % 2 === 0 ? '① 分配给最近中心' : '② 移动中心到平均'}</button>
        <button className="demo-btn" onClick={() => reset()}>🔄 换一批数据</button>
        <span className="stat-chip">步数 <b style={{ display: 'inline', fontSize: 13 }}>{step}</b></span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        灰点是没人告诉它答案的原始数据，机器自己分成了 {K} 组。点「自动迭代」看它反复「分配 → 移动中心」，直到中心稳定不再移动 —— 这就是无监督学习。
      </div>
    </div>
  )
}
