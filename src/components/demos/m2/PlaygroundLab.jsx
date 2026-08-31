import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MLP, genDataset } from '../../../lib/tinyNN.js'

// 2.5 神经网络训练实验室（Playground）：实时训练 + 决策边界热力图
export default function PlaygroundLab() {
  const [dsKind, setDsKind] = useState('circle')
  const [layers, setLayers] = useState([4, 3])
  const [act, setAct] = useState('tanh')
  const [lr, setLr] = useState(0.15)
  const [running, setRunning] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [lossHist, setLossHist] = useState([])
  const [boundary, setBoundary] = useState(null)
  const [tick, setTick] = useState(0)
  const cvRef = useRef(null)
  const cvLossRef = useRef(null)
  const W = 560; const H = 420; const LW = 280; const LH = 150

  const data = useMemo(() => genDataset(dsKind, 240, 7), [dsKind])
  const trainPts = data.slice(0, 200)
  const testPts = data.slice(200)
  const net = useMemo(() => new MLP([2, ...layers, 1], act, 'sigmoid', 42), [layers, act, dsKind])

  function reset() {
    setRunning(false); setEpoch(0); setLossHist([]); setBoundary(null)
  }
  useEffect(reset, [net])

  function trainSteps(n) {
    let loss = 0
    for (let s = 0; s < n; s++) {
      const idx = Math.floor(Math.random() * trainPts.length)
      const p = trainPts[idx]
      loss += net.trainBatch([[p.x, p.y]], [[p.label]], lr)
    }
    return loss / n
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const l = trainSteps(6)
      setEpoch((e) => e + 6)
      setLossHist((h) => [...h.slice(-199), l])
      setTick((t) => t + 1)
    }, 30)
    return () => clearInterval(id)
  }, [running, lr, net, trainPts])

  // 每隔几 tick 重算一次决策边界（60×60 网格）
  useEffect(() => {
    const N = 56
    const grid = []
    for (let i = 0; i <= N; i++) {
      const row = []
      for (let j = 0; j <= N; j++) {
        const wx = -3 + (6 * i) / N
        const wy = -3 + (6 * j) / N
        row.push(net.predict([wx, wy]))
      }
      grid.push(row)
    }
    setBoundary(grid)
  }, [tick, net])

  // 测试准确率
  const acc = useMemo(() => {
    let ok = 0
    testPts.forEach((p) => {
      const out = net.predict([p.x, p.y])
      if ((out > 0.5 ? 1 : 0) === p.label) ok++
    })
    return ok / testPts.length
  }, [tick, net, testPts])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    const px = (wx) => 16 + ((wx + 3) / 6) * (W - 32)
    const py = (wy) => H - 16 - ((wy + 3) / 6) * (H - 32)

    if (boundary) {
      const N = boundary.length - 1
      const cw = (W - 32) / N; const ch = (H - 32) / N
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const v = (boundary[i][j] + boundary[i + 1][j] + boundary[i][j + 1] + boundary[i + 1][j + 1]) / 4
          // v∈[0,1] → 蓝紫 vs 粉
          const t = v
          const r = Math.round(255 - t * 130)
          const g = Math.round(230 - t * 160)
          const b = Math.round(244 - t * 20)
          ctx.fillStyle = `rgba(${r},${g},${b},0.55)`
          ctx.fillRect(16 + i * cw, H - 16 - (j + 1) * ch, cw + 0.5, ch + 0.5)
        }
      }
    }

    trainPts.forEach((p) => {
      ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 4.4, 0, Math.PI * 2)
      ctx.fillStyle = p.label ? '#7c3aed' : '#db2777'; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke()
    })

    // 损失曲线
    const cv2 = cvLossRef.current
    if (!cv2) return
    cv2.width = LW * dpr; cv2.height = LH * dpr
    const c2 = cv2.getContext('2d')
    c2.setTransform(dpr, 0, 0, dpr, 0, 0)
    c2.fillStyle = '#fcfcfe'; c2.fillRect(0, 0, LW, LH)
    c2.strokeStyle = '#d9dde9'; c2.strokeRect(8, 10, LW - 16, LH - 28)
    if (lossHist.length > 1) {
      const maxL = Math.max(0.75, ...lossHist)
      c2.strokeStyle = '#7c3aed'; c2.lineWidth = 1.8
      c2.beginPath()
      lossHist.forEach((l, i) => {
        const x = 8 + (i / (lossHist.length - 1)) * (LW - 16)
        const y = LH - 18 - (l / maxL) * (LH - 30)
        i ? c2.lineTo(x, y) : c2.moveTo(x, y)
      })
      c2.stroke()
    }
    c2.fillStyle = '#8a92a6'; c2.font = '11px sans-serif'
    c2.fillText('训练损失', 14, 24)
  }
  useEffect(draw, [tick, boundary, lossHist, data])

  function addLayer() { if (layers.length < 4) setLayers([...layers.slice(0, -1), layers[layers.length - 1], 3]) }
  function removeLayer() { if (layers.length > 1) setLayers(layers.slice(0, -1)) }

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>数据集</label>
          <div className="seg">
            {[['circle', '同心圆'], ['xor', 'XOR'], ['blob', '双团'], ['spiral', '双螺旋']].map(([k, label]) => (
              <button key={k} className={dsKind === k ? 'on' : ''} onClick={() => setDsKind(k)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="ctrl"><label>激活函数</label>
          <div className="seg">
            {['tanh', 'relu'].map((k) => <button key={k} className={act === k ? 'on' : ''} onClick={() => setAct(k)}>{k}</button>)}
          </div>
        </div>
        <div className="ctrl"><label>学习率</label>
          <div className="seg">
            {[0.03, 0.15, 0.5].map((k) => <button key={k} className={lr === k ? 'on' : ''} onClick={() => setLr(k)}>{k}</button>)}
          </div>
        </div>
      </div>
      <div className="ctrl-row">
        <div className="ctrl"><label>隐藏层结构</label>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, background: 'var(--bg-soft)', padding: '3px 10px', borderRadius: 7 }}>
            2 → {layers.join(' → ')} → 1
          </span>
        </div>
        <button className="demo-btn small" onClick={() => setLayers((L) => L.map((n) => Math.min(8, n + 1)))}>＋ 每层加粗</button>
        <button className="demo-btn small" onClick={() => setLayers((L) => L.map((n) => Math.max(1, n - 1)))}>－ 每层变细</button>
        <button className="demo-btn small" onClick={addLayer}>＋ 加一层</button>
        <button className="demo-btn small" onClick={removeLayer}>－ 减一层</button>
      </div>
      <div className="ctrl-row">
        <button className="demo-btn primary" onClick={() => setRunning(!running)}>{running ? '⏸ 暂停训练' : '▶ 开始训练'}</button>
        <button className="demo-btn" onClick={reset}>🔄 重置</button>
        <div className="stat-chips">
          <span className="stat-chip">轮数 <b>{epoch}</b></span>
          <span className="stat-chip">测试集准确率 <b style={{ color: acc > 0.9 ? 'var(--green)' : 'var(--amber)' }}>{(acc * 100).toFixed(0)}%</b></span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="demo-canvas-box" style={{ flex: '1 1 420px' }}><canvas ref={cvRef} /></div>
        <div style={{ flex: '0 0 280px', maxWidth: '100%' }}>
          <div className="demo-canvas-box"><canvas ref={cvLossRef} style={{ aspectRatio: '280/150' }} /></div>
          <div className="callout tip" style={{ marginTop: 12, fontSize: 13 }}>
            <div className="co-title">🎮 推荐玩法</div>
            <p style={{ fontSize: 13 }}>
              ① 「同心圆」+ 只有 <b>1 层、1 个神经元</b>（结构 2→1→1）：训练半天也分不开——单条直线做不到。<br />
              ② 加到 <b>2→4→2→1</b>：瞬间学会！这就是「多层」的威力。<br />
              ③ 挑战 <b>双螺旋</b>：需要更宽更深，把学习率换成 0.03 慢慢磨。<br />
              ④ 学习率换 <b>0.5</b> + relu：感受一下「损失上下乱跳」。
            </p>
          </div>
        </div>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        背景颜色 = 网络当前的「想法」（每个位置属于紫类的概率）。训练就是背景从杂乱渐渐变得轮廓清晰的过程。你刚刚操作的这个循环，和训练 GPT 的循环在数学上完全相同。
      </div>
    </div>
  )
}
