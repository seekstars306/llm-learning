import React, { useState } from 'react'
import { useCanvas } from '../../../lib/plot.jsx'

const FNS = {
  sigmoid: { f: (x) => 1 / (1 + Math.exp(-x)), d: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s) }, color: '#4f6df5', desc: '输出 (0,1)，像「概率」。缺点：输入很大很小时斜率≈0，梯度消失，深网络学不动。' },
  tanh: { f: Math.tanh, d: (x) => 1 - Math.tanh(x) ** 2, color: '#10b981', desc: '输出 (-1,1)，零中心。深网络早期常用，同样有梯度消失问题。' },
  relu: { f: (x) => Math.max(0, x), d: (x) => (x > 0 ? 1 : 0), color: '#db2777', desc: '负数归零、正数照抄。计算飞快、正区梯度恒为 1，是 CNN 的默认选择。缺点：「死神经元」（一直输出 0）。' },
  gelu: { f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))), d: (x) => { const c = Math.sqrt(2 / Math.PI); const inner = c * (x + 0.044715 * x ** 3); const t = Math.tanh(inner); return 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * c * (1 + 3 * 0.044715 * x * x) }, color: '#d97706', desc: 'ReLU 的平滑版，GPT / BERT 等 Transformer 系模型的标准配置。' },
}

// 2.2 激活函数：曲线 + 导数 + 一个滑动的输入点
export default function ActivationLab() {
  const [key, setKey] = useState('gelu')
  const [showD, setShowD] = useState(true)
  const [x, setX] = useState(1.2)
  const fn = FNS[key]

  const ref = useCanvas((ctx, W, H) => {
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)
    const sc = { x: (v) => 40 + ((v + 4) / 8) * (W - 70), y: (v) => H / 2 - (v / 3) * (H / 2 - 26) }
    // 零轴
    ctx.strokeStyle = '#c9cede'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(sc.x(-4), sc.y(0)); ctx.lineTo(sc.x(4), sc.y(0)); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(sc.x(0), 14); ctx.lineTo(sc.x(0), H - 24); ctx.stroke()
    ctx.fillStyle = '#8a92a6'; ctx.font = '11px sans-serif'
    for (let v = -4; v <= 4; v += 2) ctx.fillText(v, sc.x(v) - 4, sc.y(0) + 14)
    ctx.fillText('y', sc.x(0) + 6, 22)

    const plot = (f, color, lw, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw
      if (dash) ctx.setLineDash([5, 4])
      ctx.beginPath()
      let started = false
      for (let i = 0; i <= 240; i++) {
        const wx = -4 + (8 * i) / 240
        const wy = f(wx)
        if (!isFinite(wy)) continue
        const q = sc.x(wx); const p = sc.y(Math.max(-3, Math.min(3, wy)))
        started ? ctx.lineTo(q, p) : ctx.moveTo(q, p)
        started = true
      }
      ctx.stroke(); ctx.setLineDash([])
    }

    plot(fn.d, fn.color + '66', 1.8, true)
    plot(fn.f, fn.color, 2.8)

    // 滑动点
    const y = fn.f(x); const dy = fn.d(x)
    const px = sc.x(x); const py = sc.y(y)
    // 切线
    ctx.strokeStyle = fn.color + '99'; ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(px - 60, sc.y(y - dy * 2)); ctx.lineTo(px + 60, sc.y(y + dy * 2))
    ctx.stroke()
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fillStyle = fn.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
    // 导数竖线
    ctx.strokeStyle = '#d97706'; ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, sc.y(dy)); ctx.stroke(); ctx.setLineDash([])
    ctx.beginPath(); ctx.arc(px, sc.y(Math.max(-3, Math.min(3, dy))), 4.5, 0, Math.PI * 2)
    ctx.fillStyle = '#d97706'; ctx.fill()
  }, 660, 380, [key])

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          {Object.keys(FNS).map((k) => (
            <button key={k} className={key === k ? 'on' : ''} onClick={() => setKey(k)}>{k}</button>
          ))}
        </div>
        <div className="ctrl"><label>输入 x</label><input type="range" min="-4" max="4" step="0.01" value={x} onChange={(e) => setX(+e.target.value)} /><span className="val">{x.toFixed(2)}</span></div>
        <button className="demo-btn" onClick={() => setShowD(!showD)}>{showD ? '已显示导数（虚线）' : '显示导数（虚线）'}</button>
      </div>
      <div className="demo-canvas-box"><canvas ref={ref} /></div>
      <div className="stat-chips" style={{ margin: '12px 0' }}>
        <span className="stat-chip" style={{ color: fn.color }}>f(x) 输出 <b>{fn.f(x).toFixed(4)}</b></span>
        <span className="stat-chip" style={{ color: '#d97706' }}>f′(x) 斜率 <b>{fn.d(x).toFixed(4)}</b></span>
      </div>
      <div className="callout tip">
        <div className="co-title">🔍 看懂这张图</div>
        <p>
          实线是激活函数本身，<b>橙色虚线是它的导数（斜率）</b>。拖动滑块你会发现：<b>导数就是反向传播时「误差能流过多少」的阀门</b>——
          {key === 'sigmoid' && ' sigmoid 两端虚线几乎贴 0，意味着信号传不了几层就消失（梯度消失）。'}
          {key === 'tanh' && ' tanh 两端同样趋近 0，但中心区斜率最大到 1，比 sigmoid 好一些。'}
          {key === 'relu' && ' ReLU 正区间导数恒为 1，信号畅通无阻，这是它能训练深网络的关键；但 x<0 时导数=0，神经元可能「死掉」。'}
          {key === 'gelu' && ' GELU 平滑衔接了两端，兼得 ReLU 的通畅与更稳的梯度——GPT 系模型的标配。'}
        </p>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{fn.desc}</p>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        激活函数 = 给神经元注入「非线性」。如果没有它，无论多少层叠加，整个网络仍然等价于一层线性变换，永远画不出弯曲的决策边界。
      </div>
    </div>
  )
}
