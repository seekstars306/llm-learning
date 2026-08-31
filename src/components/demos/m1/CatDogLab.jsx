import React, { useEffect, useMemo, useRef, useState } from 'react'

// 1.1 特征空间与决策边界：点击添加猫/狗样本，看分类器如何划界
export default function CatDogLab() {
  const [pts, setPts] = useState(() => [
    { x: 0.28, y: 0.62, c: 0 }, { x: 0.2, y: 0.4, c: 0 }, { x: 0.36, y: 0.52, c: 0 },
    { x: 0.25, y: 0.3, c: 0 }, { x: 0.42, y: 0.72, c: 0 },
    { x: 0.72, y: 0.3, c: 1 }, { x: 0.8, y: 0.52, c: 1 }, { x: 0.66, y: 0.44, c: 1 },
    { x: 0.86, y: 0.36, c: 1 }, { x: 0.74, y: 0.68, c: 1 },
  ])
  const [cls, setCls] = useState(0)
  const cvRef = useRef(null)
  const W = 660; const H = 380

  // 数据点坐标 → 画布像素（y 翻转：归一化 y 向上，像素 y 向下）
  const px = (xn) => 30 + xn * (W - 50)
  const py = (yn) => 10 + (1 - yn) * (H - 20)

  const boundary = useMemo(() => {
    // 最近质心分类器：算出两类中心，画两者的垂直平分线（线性决策边界）
    const cs = [0, 1].map((c) => {
      const arr = pts.filter((p) => p.c === c)
      if (!arr.length) return null
      return { x: arr.reduce((s, p) => s + p.x, 0) / arr.length, y: arr.reduce((s, p) => s + p.y, 0) / arr.length }
    })
    if (!cs[0] || !cs[1]) return null
    const [a, b] = cs
    const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2
    const dx = b.x - a.x; const dy = b.y - a.y
    // 垂直平分线：过质心中点、方向垂直于两质心连线（全程在归一化坐标系内计算）
    const len = Math.hypot(dx, dy) || 1
    const dirX = -dy / len; const dirY = dx / len
    const t = 2
    return { p1: { x: mx - dirX * t, y: my - dirY * t }, p2: { x: mx + dirX * t, y: my + dirY * t }, a, b }
  }, [pts])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'
    ctx.fillRect(0, 0, W, H)

    // 决策边界（归一化端点 → 像素坐标，全程同一坐标系）
    if (boundary) {
      ctx.strokeStyle = '#4f6df5'; ctx.lineWidth = 2; ctx.setLineDash([7, 5])
      ctx.beginPath()
      ctx.moveTo(px(boundary.p1.x), py(boundary.p1.y))
      ctx.lineTo(px(boundary.p2.x), py(boundary.p2.y))
      ctx.stroke(); ctx.setLineDash([])
    }

    // 轴
    ctx.strokeStyle = '#d9dde9'; ctx.lineWidth = 1
    ctx.strokeRect(30, 10, W - 50, H - 20)
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('耳朵长度 →', W - 120, H - 4)
    ctx.save(); ctx.translate(12, 90); ctx.rotate(-Math.PI / 2); ctx.fillText('胡须数量 →', 0, 0); ctx.restore()

    // 点
    pts.forEach((p) => {
      ctx.font = '17px sans-serif'
      ctx.fillText(p.c === 0 ? '🐱' : '🐶', px(p.x) - 8, py(p.y) + 6)
    })
    // 质心
    if (boundary) {
      [['🐱', boundary.a], ['🐶', boundary.b]].forEach(([e, c]) => {
        if (!c) return
        ctx.font = '24px sans-serif'; ctx.globalAlpha = 0.55
        ctx.fillText(e, px(c.x) - 12, py(c.y) + 8)
        ctx.globalAlpha = 1
        ctx.strokeStyle = c === boundary.a ? '#db2777' : '#0d9488'
        ctx.beginPath(); ctx.arc(px(c.x), py(c.y), 17, 0, Math.PI * 2); ctx.stroke()
      })
    }
  }
  // 必须用 useEffect：useMemo 会在 canvas 挂载前执行，导致初始空白
  useEffect(draw, [pts, boundary])

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const py = ((e.clientY - rect.top) / rect.height) * H
    if (px < 32 || py < 12 || py > H - 12) return
    setPts([...pts, { x: (px - 30) / (W - 50), y: 1 - (py - 10) / (H - 20), c: cls }])
  }

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          <button className={cls === 0 ? 'on' : ''} onClick={() => setCls(0)}>🐱 放一只猫</button>
          <button className={cls === 1 ? 'on' : ''} onClick={() => setCls(1)}>🐶 放一只狗</button>
        </div>
        <button className="demo-btn" onClick={() => setPts([])}>清空</button>
        <button className="demo-btn" onClick={() => setPts([{ x: 0.28, y: 0.62, c: 0 }, { x: 0.2, y: 0.4, c: 0 }, { x: 0.36, y: 0.52, c: 0 }, { x: 0.25, y: 0.3, c: 0 }, { x: 0.42, y: 0.72, c: 0 }, { x: 0.72, y: 0.3, c: 1 }, { x: 0.8, y: 0.52, c: 1 }, { x: 0.66, y: 0.44, c: 1 }, { x: 0.86, y: 0.36, c: 1 }, { x: 0.74, y: 0.68, c: 1 }])}>恢复初始样本</button>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} onClick={handleClick} style={{ cursor: 'crosshair' }} /></div>
      <div className="legend-row" style={{ marginTop: 10 }}>
        <span><span className="legend-dot" style={{ background: '#db2777' }} />猫的平均位置</span>
        <span><span className="legend-dot" style={{ background: '#0d9488' }} />狗的平均位置</span>
        <span><span className="legend-dot" style={{ background: '#4f6df5' }} />决策边界（自动学出）</span>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        👆 在图上点击放置样本。每个动物被换成两个数字（特征），机器就能在坐标里处理它们；虚线是它自动找出的分界线。试试把样本堆得更乱，看分界线怎么变。
      </div>
    </div>
  )
}
