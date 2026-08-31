import React, { useEffect, useMemo, useRef, useState } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

const ACT = Math.tanh

// 2.3 前向传播：信号逐层流动的可视化（2 → 3 → 1 网络）
export default function ForwardLab() {
  const [x1, setX1] = useState(0.8)
  const [x2, setX2] = useState(-0.5)
  const [phase, setPhase] = useState(2) // 0..2 当前点亮到第几层
  const [playing, setPlaying] = useState(false)
  const cvRef = useRef(null)
  const W = 660; const H = 400

  const net = useMemo(() => {
    // 固定一组「有性格」的权重（用种子生成，保证演示稳定）
    const rng = { s: 777 }
    const rn = () => { rng.s = (rng.s * 16807 + 11) % 2147483647; return ((rng.s % 20000) - 10000) / 10000 }
    const w1 = [[rn(), rn()], [rn(), rn()], [rn(), rn()]]
    const b1 = [rn() * 0.5, rn() * 0.5, rn() * 0.5]
    const w2 = [rn(), rn(), rn()]
    const b2 = rn() * 0.5
    return { w1, b1, w2, b2 }
  }, [])

  const values = useMemo(() => {
    const z1 = net.w1.map((row, j) => row[0] * x1 + row[1] * x2 + net.b1[j])
    const h = z1.map(ACT)
    const z2 = net.w2.reduce((s, wj, j) => s + wj * h[j], net.b2)
    const y = z2 // 输出层用线性（回归感觉）
    return { z1, h, z2, y }
  }, [x1, x2, net])

  useEffect(() => {
    if (!playing) return
    setPhase(0)
    const id = setInterval(() => {
      setPhase((p) => {
        if (p >= 2) { setPlaying(false); return 2 }
        return p + 1
      })
    }, 900)
    return () => clearInterval(id)
  }, [playing])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)

    const colX = [90, 330, 570]
    const inY = [150, 250]
    const hY = [100, 200, 300]
    const outY = 200
    const lit = (l) => phase >= l

    // 边（颜色 = 权重正负，粗细 = |权重|，脉冲动画到已点亮层）
    const drawEdge = (x1p, y1p, x2p, y2p, wv, on) => {
      ctx.strokeStyle = wv >= 0 ? 'rgba(79,109,245,' : 'rgba(219,39,119,'
      ctx.strokeStyle += `${on ? 0.25 + Math.min(0.65, Math.abs(wv) * 0.5) : 0.10})`
      ctx.lineWidth = 1 + Math.abs(wv) * 2.2
      ctx.beginPath(); ctx.moveTo(x1p, y1p); ctx.lineTo(x2p, y2p); ctx.stroke()
      if (on) {
        const t = ((Date.now() / 600) % 1)
        const px = x1p + (x2p - x1p) * t; const py = y1p + (y2p - y1p) * t
        ctx.beginPath(); ctx.arc(px, py, 3.4, 0, Math.PI * 2)
        ctx.fillStyle = wv >= 0 ? '#4f6df5' : '#db2777'; ctx.fill()
      }
    }

    inY.forEach((iy, i) => hY.forEach((hy, j) => drawEdge(colX[0], iy, colX[1], hy, net.w1[j][i], lit(1))))
    hY.forEach((hy, j) => drawEdge(colX[1], hy, colX[2], outY, net.w2[j], lit(2)))

    // 神经元
    const node = (x, y, label, val, active, color) => {
      const r = 26
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = active ? color : '#eef0f7'
      ctx.globalAlpha = active ? 0.16 : 1
      ctx.fill(); ctx.globalAlpha = 1
      ctx.lineWidth = active ? 3 : 1.6
      ctx.strokeStyle = active ? color : '#c3c9da'
      ctx.stroke()
      ctx.fillStyle = '#1c2130'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'
      ctx.fillText(val, x, y + 5)
      ctx.fillStyle = '#8a92a6'; ctx.font = '11px sans-serif'
      ctx.fillText(label, x, y + r + 16)
    }

    node(colX[0], inY[0], '输入 x₁', x1.toFixed(2), true, '#64748b')
    node(colX[0], inY[1], '输入 x₂', x2.toFixed(2), true, '#64748b')
    hY.forEach((hy, j) => node(colX[1], hy, `隐藏 ${j + 1}`, values.h[j].toFixed(2), lit(1), '#7c3aed'))
    node(colX[2], outY, '输出 y', values.y.toFixed(2), lit(2), '#10b981')

    // 层标签
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('输入层', colX[0], 40); ctx.fillText('隐藏层（tanh）', colX[1], 40); ctx.fillText('输出层', colX[2], 40)
    ctx.textAlign = 'left'
  }
  useEffect(() => {
    draw()
    const id = setInterval(draw, 90)
    return () => clearInterval(id)
  }, [x1, x2, phase, values])

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>输入 x₁</label><input type="range" min="-1.5" max="1.5" step="0.01" value={x1} onChange={(e) => setX1(+e.target.value)} /><span className="val">{x1.toFixed(2)}</span></div>
        <div className="ctrl"><label>输入 x₂</label><input type="range" min="-1.5" max="1.5" step="0.01" value={x2} onChange={(e) => setX2(+e.target.value)} /><span className="val">{x2.toFixed(2)}</span></div>
        <button className="demo-btn primary" onClick={() => setPlaying(true)}>▶ 播放信号流动</button>
        <div className="seg">
          {[0, 1, 2].map((p) => <button key={p} className={phase === p ? 'on' : ''} onClick={() => { setPlaying(false); setPhase(p) }}>{p === 0 ? '输入' : p === 1 ? '隐藏层' : '输出'}</button>)}
        </div>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="legend-row" style={{ marginTop: 10 }}>
        <span><span className="legend-dot" style={{ background: '#4f6df5' }} />权重为正（激励）</span>
        <span><span className="legend-dot" style={{ background: '#db2777' }} />权重为负（抑制）</span>
        <span>线条越粗 = 权重绝对值越大；小圆点 = 正在流动的信号</span>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        这就是一次完整的<b>前向传播</b>：输入两个数 → 每个隐藏神经元「加权求和 + tanh」→ 输出汇总。改滑块看数值怎么变。GPT 推理时也是这样一层层算，只不过它有几十层、每层几万个神经元。
      </div>
    </div>
  )
}
