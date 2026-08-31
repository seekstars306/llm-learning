import React, { useEffect, useRef, useState } from 'react'

const SENT = ['今', '天', '天', '气', '真', '好', '，', '我', '想', '出', '门', '散步']

// 3.4 RNN：隐藏状态逐词更新 + 早期信息遗忘可视化
export default function RnnLab() {
  const [idx, setIdx] = useState(-1) // 已处理到第几个词
  const [playing, setPlaying] = useState(false)
  const [decay, setDecay] = useState(0.55)
  const cvRef = useRef(null)
  const W = 660; const H = 330

  // 固定随机矩阵：模拟 hidden = tanh(Wx·x + Wh·h)
  const mats = React.useMemo(() => {
    let s = 42
    const r = () => { s = (s * 16807 + 11) % 2147483647; return ((s % 2000) - 1000) / 1000 }
    const D = 6
    return {
      D,
      wx: Array.from({ length: D }, () => Array.from({ length: 6 }, () => r())),
      wh: Array.from({ length: D }, () => Array.from({ length: D }, () => r() * 0.9)),
    }
  }, [])

  const { states } = React.useMemo(() => {
    const st = [new Array(mats.D).fill(0)]
    let h = st[0]
    for (let t = 0; t < SENT.length; t++) {
      const x = Array.from({ length: 6 }, (_, i) => Math.sin((SENT[t].charCodeAt(0) * 7 + i * 13) % 100) / 3)
      const nh = []
      for (let j = 0; j < mats.D; j++) {
        let s = mats.wx[j].reduce((acc, w, i) => acc + w * x[i], 0)
        s += mats.wh[j].reduce((acc, w, i) => acc + w * h[i], 0)
        nh.push(Math.tanh(s))
      }
      h = nh
      st.push([...h])
    }
    return { states: st }
  }, [mats])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setIdx((i) => {
        if (i >= SENT.length - 1) { setPlaying(false); return i }
        return i + 1
      })
    }, 650)
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

    const D = mats.D
    const stateY = 96
    const stateX = 470

    // 词序列
    const cw = 50
    const seqX = 20; const seqY = 240
    ctx.font = '13px sans-serif'
    SENT.forEach((ch, t) => {
      const x = seqX + t * cw
      const done = t < idx || (t === idx && idx >= 0)
      const cur = t === idx
      // 词框
      ctx.fillStyle = cur ? '#4f6df5' : done ? '#e4e9fb' : '#eef0f7'
      ctx.fillRect(x, seqY, cw - 6, 34)
      ctx.fillStyle = cur ? '#fff' : '#4a5268'
      ctx.textAlign = 'center'
      ctx.font = '14px sans-serif'
      ctx.fillText(ch, x + (cw - 6) / 2, seqY + 22)
      // 箭头到下一词（伴随状态传递）
      if (t < SENT.length - 1) {
        ctx.strokeStyle = '#c3c9da'; ctx.lineWidth = 1.4
        ctx.beginPath(); ctx.moveTo(x + cw - 6, seqY + 17); ctx.lineTo(x + cw - 2, seqY + 17); ctx.stroke()
      }
    })
    ctx.textAlign = 'left'

    // 隐藏状态格子（当前）
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#8a92a6'
    ctx.fillText('隐藏状态 h（网络的工作记忆，6 维）', stateX - 60, stateY - 44)
    const h = states[Math.max(0, idx + 1)]
    const cs = 30
    for (let j = 0; j < D; j++) {
      const v = h[j]
      const x = stateX - 60 + j * (cs + 3)
      const a = Math.abs(v)
      ctx.fillStyle = v >= 0 ? `rgba(79,109,245,${0.15 + a * 0.8})` : `rgba(219,39,119,${0.15 + a * 0.8})`
      ctx.fillRect(x, stateY - 20, cs, cs)
      ctx.fillStyle = '#1c2130'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
      ctx.fillText(v.toFixed(2), x + cs / 2, stateY - 20 + cs / 2 + 4)
    }
    ctx.textAlign = 'left'
    // 循环箭头：h 传给下一步
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.8; ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(stateX - 64 + D * (cs + 3) + 8, stateY - 6)
    ctx.lineTo(stateX + 130, stateY - 6)
    ctx.lineTo(stateX + 130, stateY - 40)
    ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#7c3aed'; ctx.font = '11px sans-serif'
    ctx.fillText('h 传入下一步', stateX + 52, stateY - 46)

    // 「第 idx+1 个词的影响力」条形图（衰减模型）
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#8a92a6'
    ctx.fillText('各词对「当前记忆」的影响（越早的词衰减越多 → 梯度消失）', 24, 60)
    const barX = 24; const barY = 66; const maxW = 380
    SENT.forEach((ch, t) => {
      if (t > idx) return
      const age = idx - t
      const strength = Math.pow(decay, age)
      const w = strength * maxW
      ctx.fillStyle = age === 0 ? '#10b981' : `rgba(79,109,245,${Math.max(0.25, 1 - age * 0.12)})`
      ctx.fillRect(barX, barY + t * 22, Math.max(2, w), 14)
      ctx.fillStyle = '#4a5268'; ctx.font = '12px sans-serif'
      ctx.fillText(`${ch}  ${(strength * 100).toFixed(0)}%`, barX + maxW + 10, barY + t * 22 + 12)
    })
  }
  useEffect(draw, [idx, decay])

  return (
    <div>
      <div className="ctrl-row">
        <button className="demo-btn primary" onClick={() => { if (idx >= SENT.length - 1) setIdx(-1); setPlaying(!playing) }}>{playing ? '⏸ 暂停' : '▶ 逐词阅读'}</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setIdx(Math.min(SENT.length - 1, idx + 1)) }}>读下一个词</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setIdx(-1) }}>🔄 重置</button>
        <div className="ctrl"><label>记忆衰减率</label><input type="range" min="0.3" max="0.85" step="0.05" value={decay} onChange={(e) => setDecay(+e.target.value)} /><span className="val">{decay.toFixed(2)}</span></div>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        RNN 像**边读边在小本本上做笔记**：每读一个词，就结合「当前词」和「上一刻的笔记（h）」更新笔记。缺陷一目了然——笔记会被反复覆盖改写，<b>句子开头的信息传到句尾时已经衰减得所剩无几</b>（长序列梯度消失）。LSTM 加了「门控」缓解此问题，而 Transformer（下一模块）则用注意力让每个词都能「直接翻看全文」，彻底绕开这个瓶颈。
      </div>
    </div>
  )
}
