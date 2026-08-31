import React, { useEffect, useRef, useState } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

// 2.4 反向传播：单神经元实况训练 + 链式法则数字拆解
export default function BackpropLab() {
  const cvRef = useRef(null)
  const cvLoss = useRef(null)
  const W = 420; const H = 320
  const [w, setW] = useState(-0.4)
  const [b, setB] = useState(0.9)
  const [lr, setLr] = useState(0.3)
  const [history, setHistory] = useState([{ w: -0.4, b: 0.9, loss: 2.0 }])
  const [lastStep, setLastStep] = useState(null)
  const [running, setRunning] = useState(false)

  const data = React.useMemo(() => {
    const rng = mulberry32(5)
    return Array.from({ length: 6 }, (_, i) => {
      const x = -1 + i * 0.4
      return [x, 0.8 * x + 0.15 + (rng() - 0.5) * 0.1]
    })
  }, [])

  const lossOf = (ww, bb) => data.reduce((s, p) => s + 0.5 * (ww * p[0] + bb - p[1]) ** 2, 0) / data.length

  function step() {
    // 先在「旧参数」上完整算一遍前向+反向（拿真实数字做链式法则展示）
    let gw = 0; let gb = 0; let loss = 0
    const detail = data.map(([x, y]) => {
      const a = w * x + b
      const e = a - y
      gw += e * x / data.length
      gb += e / data.length
      loss += 0.5 * e * e / data.length
      return { x, y, a, e }
    })
    const nw = w - lr * gw
    const nb = b - lr * gb
    setLastStep({ w, b, gw, gb, loss, detail, nw, nb })
    setW(nw); setB(nb)
    setHistory((h) => [...h.slice(-160), { w: nw, b: nb, loss: lossOf(nw, nb) }])
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(step, 300)
    return () => clearInterval(id)
  }, [running, w, b, lr])

  function draw() {
    // 左图：数据与当前直线
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    const px = (x) => 40 + ((x + 1.2) / 2.4) * (W - 70)
    const py = (y) => H - 34 - ((y + 1.2) / 2.4) * (H - 70)
    ctx.strokeStyle = '#d9dde9'
    ctx.beginPath(); ctx.moveTo(px(-1.2), py(-1.2)); ctx.lineTo(px(1.2), py(-1.2)); ctx.moveTo(px(-1.2), py(-1.2)); ctx.lineTo(px(-1.2), py(1.2)); ctx.stroke()
    // 目标虚线
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(px(-1.2), py(0.8 * -1.2 + 0.15)); ctx.lineTo(px(1.2), py(0.8 * 1.2 + 0.15)); ctx.stroke(); ctx.setLineDash([])
    // 模型直线
    ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2.4
    ctx.beginPath(); ctx.moveTo(px(-1.2), py(w * -1.2 + b)); ctx.lineTo(px(1.2), py(w * 1.2 + b)); ctx.stroke()
    // 数据点 + 残差线
    data.forEach(([x, y]) => {
      ctx.strokeStyle = 'rgba(217,119,6,0.5)'; ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.moveTo(px(x), py(y)); ctx.lineTo(px(x), py(w * x + b)); ctx.stroke()
      ctx.beginPath(); ctx.arc(px(x), py(y), 4.6, 0, Math.PI * 2); ctx.fillStyle = '#4f6df5'; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke()
    })
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('y = 0.8x + 0.15 (目标)', 46, 26)
    ctx.fillStyle = '#db2777'; ctx.fillText(`y = ${w.toFixed(2)}x + ${b.toFixed(2)} (神经元)`, 210, 26)

    // 右图：损失下降曲线
    const cv2 = cvLoss.current
    if (!cv2) return
    cv2.width = W * dpr; cv2.height = H * dpr
    cv2.style.aspectRatio = `${W} / ${H}`
    const c2 = cv2.getContext('2d')
    c2.setTransform(dpr, 0, 0, dpr, 0, 0)
    c2.fillStyle = '#fcfcfe'; c2.fillRect(0, 0, W, H)
    c2.strokeStyle = '#d9dde9'
    c2.strokeRect(30, 14, W - 50, H - 50)
    const maxL = Math.max(0.5, ...history.map((h) => h.loss))
    c2.strokeStyle = '#7c3aed'; c2.lineWidth = 2
    c2.beginPath()
    history.forEach((h, i) => {
      const x = 30 + (i / Math.max(1, history.length - 1)) * (W - 50)
      const y = H - 36 - (h.loss / maxL) * (H - 50)
      i ? c2.lineTo(x, y) : c2.moveTo(x, y)
    })
    c2.stroke()
    c2.fillStyle = '#8a92a6'; c2.font = '11px sans-serif'
    c2.fillText('损失 Loss', 36, 28)
    c2.fillText(maxL.toFixed(2), 4, 22); c2.fillText('0', 16, H - 30)
  }
  useEffect(draw, [w, b, history])

  const curLoss = lossOf(w, b)

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>学习率</label><input type="range" min="0.02" max="0.9" step="0.01" value={lr} onChange={(e) => setLr(+e.target.value)} /><span className="val">{lr.toFixed(2)}</span></div>
        <button className="demo-btn primary" onClick={() => setRunning(!running)}>{running ? '⏸ 暂停' : '▶ 自动训练'}</button>
        <button className="demo-btn" onClick={step} disabled={running}>走一步（看拆解）</button>
        <button className="demo-btn" onClick={() => { setW(-0.4); setB(0.9); setHistory([{ w: -0.4, b: 0.9, loss: lossOf(-0.4, 0.9) }]); setLastStep(null); setRunning(false) }}>🔄 重来</button>
        <span className="stat-chip">损失 <b>{curLoss.toFixed(4)}</b></span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="demo-canvas-box" style={{ flex: 1, minWidth: 280 }}><canvas ref={cvRef} /></div>
        <div className="demo-canvas-box" style={{ flex: 1, minWidth: 280 }}><canvas ref={cvLoss} /></div>
      </div>

      {lastStep && (
        <div style={{ marginTop: 14 }}>
          <div className="callout story" style={{ marginBottom: 8 }}>
            <div className="co-title">🔬 上一次「走一步」的链式法则全过程（真实数字）</div>
            <p>反向传播 = 把误差从输出往回「分责任」。以第 1 个样本为例，跟着数字走一遍：</p>
          </div>
          <table className="data-table">
            <thead><tr><th>步骤</th><th>计算</th><th>本步结果</th><th>含义</th></tr></thead>
            <tbody>
              <tr><td>① 前向：算输出</td><td><code className="inline-code">a = w·x + b</code></td><td><b>{lastStep.detail[0].a.toFixed(3)}</b>（真实 y = {lastStep.detail[0].y.toFixed(3)}）</td><td>神经元的预测</td></tr>
              <tr><td>② 误差</td><td><code className="inline-code">e = a − y</code></td><td><b>{lastStep.detail[0].e.toFixed(3)}</b></td><td>预测比真实高了/低了多少</td></tr>
              <tr><td>③ 回传到 a</td><td><code className="inline-code">∂L/∂a = a − y</code></td><td>{lastStep.detail[0].e.toFixed(3)}</td><td>平方损失对输出的斜率 = 误差本身</td></tr>
              <tr><td>④ 回传到 w</td><td><code className="inline-code">∂L/∂w = e·x</code></td><td><b style={{ color: 'var(--red)' }}>{(lastStep.detail[0].e * lastStep.detail[0].x).toFixed(3)}</b></td><td>乘上输入 x（链式法则：外面斜率 × 里面斜率）</td></tr>
              <tr><td>⑤ 全部样本汇总</td><td><code className="inline-code">gw, gb 取平均</code></td><td>gw = <b>{lastStep.gw.toFixed(3)}</b>, gb = <b>{lastStep.gb.toFixed(3)}</b></td><td>这是所有样本「分摊」后的梯度</td></tr>
              <tr><td>⑥ 更新参数</td><td><code className="inline-code">w ← w − lr·gw</code></td><td>w: {lastStep.w.toFixed(3)} → <b style={{ color: 'var(--green)' }}>{lastStep.nw.toFixed(3)}</b></td><td>沿负梯度走一步（学习率 {lr.toFixed(2)}）</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
            深度网络的反向传播就是这条链的加长版：误差从损失出发，一层层乘上各层的局部斜率（链式法则），直达每个参数。框架（PyTorch 等）会自动帮你完成这一切——称为「自动求导」。
          </p>
        </div>
      )}
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        红线（神经元）在误差的「指挥」下一步步贴近绿色目标线。点几次「走一步」看下面的数字拆解，你会发现：<b>训练的全部秘密就是「误差 → 链式法则分责任 → 每个参数朝减误差方向挪一点」</b>。
      </div>
    </div>
  )
}
