import React, { useRef, useState, useEffect } from 'react'

// 2.1 感知机：在 AND / OR / XOR 数据上训练单个神经元
export default function PerceptronLab() {
  const [ds, setDs] = useState('AND')
  const [epoch, setEpoch] = useState(0)
  const [w, setW] = useState([0.3, -0.2])
  const [b, setB] = useState(0.1)
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)
  const cvRef = useRef(null)
  const W = 400; const H = 400

  const data = {
    AND: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]],
    OR: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]],
    XOR: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
  }[ds]

  function reset(k = ds) {
    setW([Math.random() - 0.5, Math.random() - 0.5]); setB(Math.random() - 0.5)
    setEpoch(0); setLog([]); setRunning(false)
  }
  useEffect(() => { reset(ds) }, [ds])

  function trainStep() {
    let errors = 0
    const lr = 0.3
    let nw = [...w]; let nb = b
    data.forEach(([x1, x2, y]) => {
      const out = (nw[0] * x1 + nw[1] * x2 + nb) > 0 ? 1 : 0
      const err = y - out
      if (err !== 0) errors++
      nw[0] += lr * err * x1; nw[1] += lr * err * x2; nb += lr * err
    })
    setW(nw); setB(nb)
    const nextE = epoch + 1
    setEpoch(nextE)
    setLog((l) => [...l.slice(-3), `第 ${nextE} 轮：错 ${errors} 个`])
    return errors
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const errors = trainStep()
      if (errors === 0) setRunning(false)
    }, 500)
    return () => clearInterval(id)
  }, [running, w, b, data])

  const predict = (x, y) => (w[0] * x + w[1] * y + b) > 0 ? 1 : 0

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    const px = (v) => 60 + v * 280; const py = (v) => 340 - v * 280

    // 背景：决策区域
    const img = ctx.getImageData(0, 0, 1, 1)
    for (let i = 0; i <= 56; i++) {
      for (let j = 0; j <= 56; j++) {
        const wx = i / 56; const wy = 1 - j / 56
        const p = predict(wx, wy)
        ctx.fillStyle = p ? 'rgba(79,109,245,0.10)' : 'rgba(219,39,119,0.06)'
        ctx.fillRect(px(wx - 1 / 112), py(wy + 1 / 112), (W - 120) / 56, (H - 120) / 56)
      }
    }
    void img

    // 决策边界 w1*x + w2*y + b = 0
    ctx.strokeStyle = '#4f6df5'; ctx.lineWidth = 2.4
    if (Math.abs(w[1]) > 1e-6) {
      const y0 = (-b) / w[1]; const y1 = (-b - w[0]) / w[1]
      ctx.beginPath(); ctx.moveTo(px(-0.15), py(y0)); ctx.lineTo(px(1.15), py(y1)); ctx.stroke()
    } else if (Math.abs(w[0]) > 1e-6) {
      const x0 = (-b) / w[0]
      ctx.beginPath(); ctx.moveTo(px(x0), py(-0.15)); ctx.lineTo(px(x0), py(1.15)); ctx.stroke()
    }

    // 网格 & 坐标
    ctx.strokeStyle = '#d9dde9'; ctx.lineWidth = 1
    ctx.strokeRect(px(0), py(1), 280, 280)
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('输入 x₁', px(1) - 30, py(0) + 30)
    ctx.save(); ctx.translate(px(0) - 34, py(1) + 10); ctx.fillText('x₂', 0, 0); ctx.restore()

    // 数据点
    data.forEach(([x1, x2, y]) => {
      const cx = px(x1); const cy = py(x2)
      const out = predict(x1, x2)
      ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2)
      ctx.fillStyle = y ? '#4f6df5' : '#db2777'; ctx.fill()
      ctx.lineWidth = 3; ctx.strokeStyle = out === y ? '#10b981' : '#dc2626'; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(y ? '1' : '0', cx, cy + 4)
    })
    ctx.textAlign = 'left'
    // 图例
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#4f6df5'; ctx.fillText('● 输出应为 1', 24, 30)
    ctx.fillStyle = '#db2777'; ctx.fillText('● 输出应为 0', 130, 30)
    ctx.fillStyle = '#10b981'; ctx.fillText('○ 圈=分对', 226, 30)
    ctx.fillStyle = '#dc2626'; ctx.fillText('✗ 红圈=分错', 296, 30)
  }
  useEffect(draw, [w, b, data, ds])

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          {['AND', 'OR', 'XOR'].map((k) => <button key={k} className={ds === k ? 'on' : ''} onClick={() => setDs(k)}>{k} 门</button>)}
        </div>
        <button className="demo-btn primary" onClick={() => setRunning(!running)}>{running ? '⏸ 暂停' : '▶ 训练'}</button>
        <button className="demo-btn" onClick={() => { setRunning(false); trainStep() }}>单步</button>
        <button className="demo-btn" onClick={() => reset()}>🔄 重来</button>
        <span className="stat-chip">训练轮数 <b>{epoch}</b></span>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="demo-canvas-box" style={{ flex: '0 0 400px', maxWidth: '100%' }}><canvas ref={cvRef} /></div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="stat-chips" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span className="stat-chip">权重 w₁ <b>{w[0].toFixed(3)}</b></span>
            <span className="stat-chip">权重 w₂ <b>{w[1].toFixed(3)}</b></span>
            <span className="stat-chip">偏置 b <b>{b.toFixed(3)}</b></span>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            {log.map((l, i) => <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{l}</div>)}
            {ds === 'XOR' && epoch > 8 && (
              <div className="callout warn" style={{ marginTop: 10 }}>
                💥 发现了吗？XOR 训练了很多轮，仍然有分不对的点在闪红——<b>单个感知机根本画不出能分开 XOR 的直线</b>！这正是 1969 年《Perceptrons》一书指出的问题，它让神经网络研究冷却了十几年，直到「多层网络」登场。下一课我们就来解决它。
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        感知机的规则简单到极致：猜输出 → 猜错了就朝正确方向微调权重。看它如何一步步把直线转到「分对」的位置；再切到 <b>XOR 门</b>体验那个著名的「AI 寒冬时刻」。
      </div>
    </div>
  )
}
