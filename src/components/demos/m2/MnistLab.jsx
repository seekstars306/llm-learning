import React, { useRef, useState } from 'react'
import { MLP } from '../../../lib/tinyNN.js'

const GRID = 16
const DRAW = 280

// 把 128×128 的墨迹图裁剪、保持纵横比居中、区域平均降采样到 16×16
function canvasToFeatures(ctx128) {
  const { data } = ctx128.getImageData(0, 0, 128, 128)
  const ink = new Float32Array(128 * 128)
  let minX = 128, minY = 128, maxX = -1, maxY = -1
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4
      const v = (255 - data[i]) / 255
      ink[y * 128 + x] = v
      if (v > 0.25) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
  }
  const feat = new Float32Array(GRID * GRID)
  if (maxX < 0) return feat
  const bw = maxX - minX + 1; const bh = maxY - minY + 1
  const S = 14 // 内容最长边缩放到 14，四周留白
  const scale = S / Math.max(bw, bh)
  const offX = (GRID - bw * scale) / 2
  const offY = (GRID - bh * scale) / 2
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      // 网格单元 → 源图区域（保持纵横比），对区域做平均（抗锯齿降采样）
      const sx0 = minX + (gx - offX) / scale
      const sx1 = minX + (gx + 1 - offX) / scale
      const sy0 = minY + (gy - offY) / scale
      const sy1 = minY + (gy + 1 - offY) / scale
      let sum = 0; let cnt = 0
      for (let y = Math.max(0, Math.floor(sy0)); y < Math.min(128, Math.ceil(sy1)); y++) {
        for (let x = Math.max(0, Math.floor(sx0)); x < Math.min(128, Math.ceil(sx1)); x++) {
          sum += ink[y * 128 + x]; cnt++
        }
      }
      feat[gy * GRID + gx] = cnt ? Math.min(1, sum / cnt) : 0
    }
  }
  return feat
}

function makeDigitSample(ch, font, variant) {
  const cv = document.createElement('canvas')
  cv.width = 128; cv.height = 128
  const c = cv.getContext('2d', { willReadFrequently: true })
  c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128)
  c.fillStyle = '#000'; c.strokeStyle = '#000'
  const size = 86 * (0.82 + (variant % 4) * 0.07)
  c.font = `${variant % 2 ? 'bold ' : ''}${size}px ${font}`
  c.textAlign = 'center'; c.textBaseline = 'middle'
  const rot = ((variant % 7) - 3) * 0.05 // 任意 variant 都保持 ±0.15 rad 的小角度
  const dx = 64 + ((variant * 37) % 11) - 5
  const dy = 64 + ((variant * 53) % 11) - 5
  c.save(); c.translate(dx, dy); c.rotate(rot)
  if (variant % 3 === 0) { c.lineWidth = 5 + (variant % 3) * 2; c.strokeText(ch, 0, 0) } else { c.fillText(ch, 0, 0) }
  c.restore()
  return canvasToFeatures(c)
}

const FONTS = ['Arial, sans-serif', 'Georgia, serif', '"Courier New", monospace', 'Verdana, sans-serif', '"Trebuchet MS", sans-serif', '"Comic Sans MS", cursive']

// 2.6 从零训练一个「手写数字识别器」
export default function MnistLab() {
  const padRef = useRef(null)
  const pixRef = useRef(null)
  const drawing = useRef(false)
  const [net, setNet] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | gen | train | ready
  const [progress, setProgress] = useState(0)
  const [acc, setAcc] = useState(null)
  const [pred, setPred] = useState(null)
  const [featView, setFeatView] = useState(null)

  function clearPad() {
    const cv = padRef.current
    const ctx = cv.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, DRAW, DRAW)
    setPred(null); setFeatView(null)
  }
  React.useEffect(() => { clearPad() }, [])

  function padFeatures() {
    // 把画板内容缩到 128×128 再走同一套预处理
    const tmp = document.createElement('canvas')
    tmp.width = 128; tmp.height = 128
    const c = tmp.getContext('2d', { willReadFrequently: true })
    c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 128)
    c.drawImage(padRef.current, 0, 0, 128, 128)
    return canvasToFeatures(c)
  }

  function recognize() {
    const nn = netRef.current
    if (!nn) return
    const f = padFeatures()
    setFeatView(Array.from(f))
    const out = nn.forward(Array.from(f))
    setPred(out)
  }

  function pos(cv, e) {
    const rect = cv.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * DRAW
    const y = ((e.clientY - rect.top) / rect.height) * DRAW
    return [x, y]
  }
  function strokeTo(cv, e) {
    const ctx = cv.getContext('2d')
    const [x, y] = pos(cv, e)
    ctx.strokeStyle = '#000'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.lineTo(x, y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  // 原生 pointer 监听（一次性绑定 + ref 镜像状态），鼠标与触摸统一，拖动画线不依赖 React 合成事件
  const netRef = useRef(null)
  netRef.current = net
  React.useEffect(() => {
    const cv = padRef.current
    if (!cv) return
    const down = (e) => {
      if (!netRef.current) return
      drawing.current = true
      const ctx = cv.getContext('2d')
      ctx.beginPath()
      const [x, y] = pos(cv, e)
      ctx.moveTo(x, y)
    }
    const move = (e) => { if (drawing.current) strokeTo(cv, e) }
    const finish = () => {
      if (drawing.current) { drawing.current = false; recognize() }
    }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', finish)
    cv.addEventListener('pointerleave', finish)
    return () => {
      cv.removeEventListener('pointerdown', down)
      cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', finish)
      cv.removeEventListener('pointerleave', finish)
    }
  }, [])

  async function train() {
    setPhase('gen'); setProgress(0)
    await new Promise((r) => setTimeout(r, 30))
    // 生成数据：10 数字 × 6 字体 × 11 变形 ≈ 660 训练样本 + 60 测试样本
    const trainX = []; const trainY = []; const testX = []; const testY = []
    for (let d = 0; d <= 9; d++) {
      for (let fi = 0; fi < FONTS.length; fi++) {
        for (let v = 0; v < 11; v++) {
          trainX.push(Array.from(makeDigitSample(String(d), FONTS[fi], v)))
          trainY.push(oneHot(d))
        }
        testX.push(Array.from(makeDigitSample(String(d), FONTS[fi], 77)))
        testY.push(oneHot(d))
      }
    }
    setPhase('train')
    const m = new MLP([GRID * GRID, 48, 10], 'relu', 'sigmoid', 123)
    setNet(m)
    netRef.current = m
    const B = 24
    const epochs = 20
    for (let ep = 0; ep < epochs; ep++) {
      // 打乱
      for (let i = trainX.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[trainX[i], trainX[j]] = [trainX[j], trainX[i]]
        ;[trainY[i], trainY[j]] = [trainY[j], trainY[i]]
      }
      for (let s = 0; s < trainX.length; s += B) {
        m.trainBatch(trainX.slice(s, s + B), trainY.slice(s, s + B), 0.3)
      }
      let ok = 0
      for (let i = 0; i < testX.length; i++) {
        const o = m.forward(testX[i])
        if (o.indexOf(Math.max(...o)) === testY[i].indexOf(1)) ok++
      }
      setAcc(ok / testX.length)
      setProgress((ep + 1) / epochs)
      await new Promise((r) => setTimeout(r, 0)) // 让 UI 喘口气
    }
    setPhase('ready')
    recognize()
  }

  function oneHot(d) { const a = new Array(10).fill(0); a[d] = 1; return a }

  function drawPixPreview() {
    const cv = pixRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const N = GRID; const S = cv.width / N
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height)
    const src = featView
    if (src) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const v = src[y * N + x]
          ctx.fillStyle = `rgb(${255 - v * 255},${255 - v * 255},${255 - v * 255})`
          ctx.fillRect(x * S, y * S, S, S)
        }
      }
    }
  }
  React.useEffect(drawPixPreview, [featView])

  const topIdx = pred ? pred.indexOf(Math.max(...pred)) : null

  return (
    <div>
      <div className="ctrl-row">
        <button className="demo-btn primary" onClick={train} disabled={phase === 'gen' || phase === 'train'}>
          {phase === 'idle' ? '🎓 生成数据并现场训练' : phase === 'gen' ? '⏳ 正在生成训练数据…' : phase === 'train' ? `⏳ 训练中 ${(progress * 100).toFixed(0)}%` : '✅ 训练完成（可重新训练）'}
        </button>
        <button className="demo-btn" onClick={clearPad}>🧽 清空画板</button>
        {acc !== null && <span className="stat-chip">测试集准确率 <b style={{ color: 'var(--green)' }}>{(acc * 100).toFixed(0)}%</b></span>}
      </div>
      {phase === 'train' && (
        <div className="progress-track" style={{ marginBottom: 12 }}>
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <canvas
            ref={padRef}
            width={DRAW} height={DRAW}
            style={{ width: '100%', maxWidth: 280, border: '2px dashed #b9c1d9', borderRadius: 12, touchAction: 'none', cursor: 'crosshair', background: '#fff' }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>👆 在这里写一个大大的数字（0~9）</div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 6 }}>
            网络实际看到的输入（{GRID}×{GRID} 像素）：
          </div>
          <canvas ref={pixRef} width={128} height={128} style={{ width: 128, height: 128, imageRendering: 'pixelated', border: '1px solid var(--border)', borderRadius: 8 }} />
          {pred && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                我的判断：<span style={{ color: 'var(--accent)', fontSize: 20 }}>{topIdx}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>（置信度 {(pred[topIdx] * 100).toFixed(0)}%）</span>
              </div>
              {pred.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '3px 0' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, width: 12, color: i === topIdx ? 'var(--accent)' : 'var(--text-3)', fontWeight: i === topIdx ? 800 : 400 }}>{i}</span>
                  <div style={{ flex: 1, height: 10, background: 'var(--bg-soft)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(1, p * 100)}%`, height: '100%', background: i === topIdx ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : '#c9cede', borderRadius: 5, transition: 'width 0.25s' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, width: 38, textAlign: 'right', color: 'var(--text-3)' }}>{(p * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        点「生成数据并现场训练」：程序用 6 种字体 × 各种变形生成 {phase === 'idle' ? '720' : '720'} 张「印刷体数字」，你的浏览器在几秒内从零把它们学会。
        然后随手写个数字考考它！如果写得太艺术它认错了，正好说明：**模型只认识它「见过的世界」** —— 真实的 MNIST 任务用 6 万张人手写样本，才能达到 99% 准确率。
      </div>
    </div>
  )
}
