import React, { useEffect, useRef, useState } from 'react'

// 7.3 推理加速：KV Cache 动画 + 量化演示
export default function InferenceLab() {
  const [tab, setTab] = useState('kv')
  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          <button className={tab === 'kv' ? 'on' : ''} onClick={() => setTab('kv')}>🗂 KV Cache 对比动画</button>
          <button className={tab === 'quant' ? 'on' : ''} onClick={() => setTab('quant')}>🗜 量化（INT8/INT4）</button>
        </div>
      </div>
      {tab === 'kv' ? <KvCache /> : <QuantDemo />}
    </div>
  )
}

function KvCache() {
  const [tokens, setTokens] = useState(6) // 已生成的 token 数
  const [useCache, setUseCache] = useState(true)
  const [playing, setPlaying] = useState(false)
  const N = 8

  // 每 step 工作量：无缓存 = 重算全部 1..t 的 K/V ≈ t(t+1)/2 单位；有缓存 = 1 单位（只算新的）
  const workNo = (t) => (t * (t + 1)) / 2
  const workCache = 1
  const totalNo = workNo(N)
  const totalCache = N

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTokens((t) => { if (t >= N) { setPlaying(false); return t } return t + 1 })
    }, 550)
    return () => clearInterval(id)
  }, [playing])

  function draw() {
    const cv = cvRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const W = 660; const H = 300
    cv.width = W * dpr; cv.height = H * dpr
    cv.style.aspectRatio = `${W} / ${H}`
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#fcfcfe'; ctx.fillRect(0, 0, W, H)

    const rows = [
      { label: useCache ? '✅ 有 KV Cache' : '❌ 无 KV Cache', color: useCache ? '#10b981' : '#dc2626', work: (t) => (useCache ? workCache : workNo(t)) },
    ]

    // 每个生成步的工作量柱状图
    const bx = 60; const bw = 44; const gap = 24
    const maxWork = workNo(N)
    ctx.font = '12.5px sans-serif'
    ctx.fillStyle = '#8a92a6'
    ctx.fillText('每生成一个新 token，需要计算的 K/V 数量（越矮越省）：', 24, 30)

    for (let t = 1; t <= N; t++) {
      const w = rows[0].work(t)
      const h = (w / maxWork) * 180
      const x = bx + (t - 1) * (bw + gap)
      const active = t <= tokens
      ctx.fillStyle = active ? (useCache ? 'rgba(16,185,129,0.75)' : 'rgba(220,38,38,0.6)') : '#e4e7f0'
      ctx.fillRect(x, 240 - h, bw, h)
      ctx.fillStyle = active ? '#1c2130' : '#aeb4c6'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(w, x + bw / 2, 236 - h)
      ctx.fillStyle = '#4a5268'
      ctx.font = '12px sans-serif'
      ctx.fillText(`第${t}步`, x + bw / 2, 258)
    }
    ctx.textAlign = 'left'

    // 当前步：无缓存时画出「重算区域」
    if (!useCache && tokens > 0) {
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#dc2626'
      ctx.fillText(`第 ${tokens} 步：要把前 ${tokens} 个 token 的 K/V 全部重算一遍（工作量 ${workNo(tokens)} 单位）`, 24, 280)
    } else if (useCache && tokens > 0) {
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#047857'
      ctx.fillText(`第 ${tokens} 步：历史 K/V 直接读缓存，只算新 token 的 1 份（工作量 1 单位）`, 24, 280)
    }
  }
  const cvRef = useRef(null)
  useEffect(draw, [tokens, useCache])

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          <button className={useCache ? 'on' : ''} onClick={() => setUseCache(true)}>有 KV Cache</button>
          <button className={!useCache ? 'on' : ''} onClick={() => setUseCache(false)}>无 KV Cache</button>
        </div>
        <button className="demo-btn primary" onClick={() => { if (tokens >= N) setTokens(0); setPlaying(!playing) }}>{playing ? '⏸ 暂停' : '▶ 逐 token 生成'}</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setTokens(Math.min(N, tokens + 1)) }}>+1 token</button>
        <button className="demo-btn" onClick={() => { setPlaying(false); setTokens(0) }}>🔄 重置</button>
      </div>
      <div className="stat-chips" style={{ marginBottom: 10 }}>
        <span className="stat-chip">已生成 <b>{tokens}/{N}</b> tokens</span>
        <span className="stat-chip">累计工作量 <b style={{ color: useCache ? 'var(--green)' : 'var(--red)' }}>{tokens === 0 ? 0 : useCache ? tokens : workNo(tokens)} 单位</b></span>
        <span className="stat-chip">跑完 {N} 步的总量对比 <b>无缓存 {totalNo} 单位 vs 有缓存 {totalCache} 单位</b></span>
      </div>
      <div className="demo-canvas-box"><canvas ref={cvRef} /></div>
      <div className="callout tip" style={{ marginTop: 12 }}>
        <div className="co-title">🎓 原理一句话</div>
        <p style={{ fontSize: 13.5 }}>
          5.2 课说过：历史 token 的 K、V <b>永远不变</b>（它们的输入是已定文本）。但朴素实现每生成一个新 token，都会把整段输入重新前向一遍——历史 K/V 被白白重算，工作量随长度**平方增长**。KV Cache 把每层的 K/V 存下来复用，每步只算新 token 的那一份——代价是显存占用随上下文线性增长（长上下文的核心显存压力正来自这里）。这是所有大模型推理引擎（vLLM 等）的第一基石。
        </p>
      </div>
    </div>
  )
}

function QuantDemo() {
  const [bits, setBits] = useState(8)
  // 模拟 8 个权重：fp16 原值 vs 量化后
  const weights = [0.83, -0.42, 0.17, -0.95, 0.61, 0.08, -0.33, 0.72]
  const levels = Math.pow(2, bits)
  const quantized = weights.map((w) => Math.round((w + 1) / 2 * (levels - 1)) / (levels - 1) * 2 - 1)
  const err = weights.reduce((s, w, i) => s + (w - quantized[i]) ** 2, 0) / weights.length
  const memRatio = bits / 16

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>量化位宽</label>
          <div className="seg">
            <button className={bits === 16 ? 'on' : ''} onClick={() => setBits(16)}>FP16（原始）</button>
            <button className={bits === 8 ? 'on' : ''} onClick={() => setBits(8)}>INT8</button>
            <button className={bits === 4 ? 'on' : ''} onClick={() => setBits(4)}>INT4</button>
            <button className={bits === 2 ? 'on' : ''} onClick={() => setBits(2)}>INT2（极端）</button>
          </div>
        </div>
      </div>
      <div className="stat-chips" style={{ marginBottom: 14 }}>
        <span className="stat-chip">显存占用 <b style={{ color: '#4f6df5' }}>{(memRatio * 100).toFixed(0)}%</b>（7B 模型 ≈ {(7 * memRatio).toFixed(1)} GB）</span>
        <span className="stat-chip">平均量化误差 <b style={{ color: err > 0.02 ? 'var(--red)' : 'var(--green)' }}>{err.toFixed(4)}</b></span>
        <span className="stat-chip">可表示档位数 <b>{levels}</b></span>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {weights.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, fontFamily: 'var(--mono)' }}>
            <span style={{ width: 56, color: 'var(--text-3)' }}>w[{i}]</span>
            <div style={{ flex: 1, height: 16, background: 'var(--bg-soft)', borderRadius: 8, position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${((w + 1) / 2) * 100}%`, top: 0, width: 3, height: '100%', background: '#1c2130' }} title={`fp16: ${w}`} />
              {bits < 16 && (
                <div style={{ position: 'absolute', left: `${((quantized[i] + 1) / 2) * 100}%`, top: -3, width: 9, height: 22, borderRadius: 3, background: '#d97706', opacity: 0.85 }} title={`int${bits}: ${quantized[i]}`} />
              )}
            </div>
            <span style={{ width: 130, color: bits < 16 && Math.abs(w - quantized[i]) > 0.1 ? 'var(--red)' : 'var(--text-3)' }}>
              {w.toFixed(3)} → {bits < 16 ? quantized[i].toFixed(3) : w.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>黑色细线 = 原始权重；橙色块 = 量化后落到的档位（档位越少，落点离原值越远）。</div>
      <div className="callout tip" style={{ marginTop: 12 }}>
        <div className="co-title">🎓 读懂数字</div>
        <p style={{ fontSize: 13.5 }}>
          量化 = 把高精度的权重「四舍五入」到少数档位上：INT8 有 256 档（几乎无损），INT4 有 16 档（略损但可接受），INT2 只有 4 档（崩坏明显——试试看误差飙升）。
          实践中 7B 模型：FP16 要 14GB，INT8 要 7GB，INT4 只要 3.5GB——**游戏本就能跑**。配合 5.2/6.3 课的知识：QLoRA 用 4bit 存基座、LoRA 在上面微调，就是这么来的。
          更高级的 AWQ/GPTQ 等算法在量化时会「照顾重要权重」，进一步压损失。
        </p>
      </div>
    </div>
  )
}
