import React, { useEffect, useRef, useState } from 'react'

const N = 8 // 输入 8×8
const K = 3 // 卷积核 3×3
const OUT = N - K + 1

const PATTERNS = {
  '7': [
    '11111100', '00000110', '00001100', '00011000', '00011000', '00011000', '00011000', '00011000',
  ],
  '+': [
    '00011000', '00011000', '00011000', '11111111', '11111111', '00011000', '00011000', '00011000',
  ],
  'L': [
    '11000000', '11000000', '11000000', '11000000', '11000000', '11000000', '11111111', '11111111',
  ],
}

const KERNELS = {
  '竖线检测': [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  '横线检测': [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  '锐化': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  '模糊': [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
}

// 3.2 CNN 卷积：核在图像上滑动计算动画
export default function ConvLab() {
  const [pattern, setPattern] = useState('+')
  const [kernelName, setKernelName] = useState('竖线检测')
  const [step, setStep] = useState(0) // 已计算到第几个输出位置（0 = 未开始）
  const [playing, setPlaying] = useState(false)
  const [showCalc, setShowCalc] = useState(true)
  const cvRef = useRef(null)
  const W = 660; const H = 400

  const input = PATTERNS[pattern].map((r) => [...r].map(Number))
  const kernel = KERNELS[kernelName]
  const outputs = []
  for (let i = 0; i < OUT; i++) {
    outputs.push([])
    for (let j = 0; j < OUT; j++) {
      let s = 0
      for (let ki = 0; ki < K; ki++) for (let kj = 0; kj < K; kj++) s += input[i + ki][j + kj] * kernel[ki][kj]
      outputs[i].push(Math.max(0, s)) // ReLU
    }
  }

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= OUT * OUT) { setPlaying(false); return s }
        return s + 1
      })
    }, 300)
    return () => clearInterval(id)
  }, [playing, pattern, kernelName])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)

    const cell = 34
    const x0 = 26; const y0 = 46
    const kx0 = x0 + N * cell + 92; const ky0 = 116
    const kcell = 34
    const ox0 = kx0 + K * kcell + 76; const oy0 = 66
    const ocell = 40

    const cur = Math.min(step, OUT * OUT)
    const ci = Math.floor((cur - 1) / OUT); const cj = (cur - 1) % OUT // 当前正在算的输出位置

    // 输入图
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#8a92a6'
    ctx.fillText('输入图像 8×8', x0, 32)
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const v = input[i][j]
        ctx.fillStyle = v ? '#3b4664' : '#eef0f7'
        ctx.fillRect(x0 + j * cell, y0 + i * cell, cell - 2, cell - 2)
        ctx.fillStyle = v ? '#fff' : '#aeb4c6'
        ctx.font = '13px monospace'; ctx.textAlign = 'center'
        ctx.fillText(v, x0 + j * cell + (cell - 2) / 2, y0 + i * cell + (cell - 2) / 2 + 5)
      }
    }
    ctx.textAlign = 'left'

    // 当前感受野高亮
    if (cur > 0 && ci < OUT) {
      ctx.strokeStyle = '#db2777'; ctx.lineWidth = 3
      ctx.strokeRect(x0 + cj * cell - 1, y0 + ci * cell - 1, cell * K + 1, cell * K + 1)
    }

    // 卷积核
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('卷积核 3×3（要学的权重）', kx0 - 20, 102)
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        const v = kernel[i][j]
        ctx.fillStyle = v > 0 ? 'rgba(79,109,245,0.16)' : 'rgba(219,39,119,0.16)'
        ctx.fillRect(kx0 + j * kcell, ky0 + i * kcell, kcell - 2, kcell - 2)
        ctx.fillStyle = v > 0 ? '#4f6df5' : '#db2777'
        ctx.font = '12px monospace'; ctx.textAlign = 'center'
        ctx.fillText(v.toFixed(2).replace('0.', '.').replace('1.00', '1'), kx0 + j * kcell + (kcell - 2) / 2, ky0 + i * kcell + (kcell - 2) / 2 + 4)
      }
    }
    ctx.textAlign = 'left'

    // 计算过程
    if (showCalc && cur > 0 && ci < OUT) {
      ctx.fillStyle = '#4a5268'; ctx.font = '12px sans-serif'
      let s = 0; const parts = []
      for (let ki = 0; ki < K; ki++) for (let kj = 0; kj < K; kj++) {
        const iv = input[ci + ki][cj + kj]; const kv = kernel[ki][kj]
        s += iv * kv
        if (iv !== 0) parts.push(`${iv}×${kv.toFixed(2).replace('0.', '.')}`)
      }
      const calcStr = parts.slice(0, 4).join(' + ') + (parts.length > 4 ? ' + …' : '') + ` = ${s.toFixed(1)}`
      const reluStr = `ReLU → ${Math.max(0, s).toFixed(1)}`
      ctx.fillText(`当前窗口（第 ${ci + 1} 行 第 ${cj + 1} 列）：`, x0, H - 52)
      ctx.font = '12px monospace'; ctx.fillStyle = '#7c3aed'
      ctx.fillText(calcStr, x0, H - 34)
      ctx.fillStyle = '#10b981'
      ctx.fillText(reluStr, x0, H - 16)
    }

    // 输出特征图
    ctx.fillStyle = '#8a92a6'; ctx.font = '12px sans-serif'
    ctx.fillText('输出特征图 6×6', ox0, 52)
    for (let i = 0; i < OUT; i++) {
      for (let j = 0; j < OUT; j++) {
        const done = i * OUT + j < cur
        const v = outputs[i][j]
        const maxV = 6
        const t = Math.min(1, Math.abs(v) / maxV)
        if (done) {
          ctx.fillStyle = v >= 0 ? `rgba(79,109,245,${0.12 + t * 0.75})` : `rgba(219,39,119,${0.12 + t * 0.75})`
        } else ctx.fillStyle = '#eef0f7'
        ctx.fillRect(ox0 + j * ocell, oy0 + i * ocell, ocell - 2, ocell - 2)
        if (done) {
          ctx.fillStyle = '#1c2130'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
          ctx.fillText(v.toFixed(1), ox0 + j * ocell + (ocell - 2) / 2, oy0 + i * ocell + (ocell - 2) / 2 + 4)
        }
      }
    }
    ctx.textAlign = 'left'
    // 箭头
    ctx.fillStyle = '#c3c9da'; ctx.font = '18px sans-serif'
    ctx.fillText('→', kx0 - 56, ky0 + 60); ctx.fillText('→', ox0 - 56, oy0 + 60)
  }
  useEffect(draw, [step, pattern, kernelName, showCalc])

  const done = step >= OUT * OUT

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>图像</label>
          <div className="seg">{Object.keys(PATTERNS).map((k) => <button key={k} className={pattern === k ? 'on' : ''} onClick={() => { setPattern(k); setStep(0); setPlaying(false) }}>{k}</button>)}</div>
        </div>
        <div className="ctrl"><label>卷积核</label>
          <div className="seg">{Object.keys(KERNELS).map((k) => <button key={k} className={kernelName === k ? 'on' : ''} onClick={() => { setKernelName(k); setStep(0); setPlaying(false) }}>{k}</button>)}</div>
        </div>
      </div>
      <div className="ctrl-row">
        <button className="demo-btn primary" onClick={() => { if (done) { setStep(0) } setPlaying(!playing) }}>{playing ? '⏸ 暂停' : '▶ 播放卷积'}</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setStep(Math.min(OUT * OUT, step + 1)) }}>单步</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setStep(0) }}>🔄 重置</button>
        <span className="stat-chip">进度 <b>{Math.min(step, OUT * OUT)}/{OUT * OUT}</b></span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        卷积 = 一个小窗口（卷积核）在图上滑动，每停一处就把 3×3 区域与核**对应相乘再求和**，得到输出的一个格子。不同核提取不同特征：「竖线检测」对竖线响应强（输出亮），换到「横线检测」就哑火——**一个卷积核就是一个特征探测器**。真实 CNN 第一层有几十上百个这样的核同时扫描，各自学习寻找不同特征。
      </div>
    </div>
  )
}
