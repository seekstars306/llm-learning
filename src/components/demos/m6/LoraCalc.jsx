import React, { useState } from 'react'

const MODELS = [
  { name: '7B（如 LLaMA-7B）', B: 7, d: 4096, layers: 32 },
  { name: '13B', B: 13, d: 5120, layers: 40 },
  { name: '70B（如 LLaMA-70B）', B: 70, d: 8192, layers: 80 },
]

// 6.3 LoRA 参数量/显存计算器：全量微调 vs LoRA
export default function LoraCalc() {
  const [mi, setMi] = useState(0)
  const [r, setR] = useState(16)
  const [targets, setTargets] = useState(4) // 每层注入的线性层数（q,k,v,o = 4）
  const m = MODELS[mi]

  const fullParams = m.B * 1e9
  // LoRA 可训练参数：每层每个注入矩阵加一对低秩矩阵 (d×r + r×d) = 2·d·r
  const loraParams = 2 * m.d * r * targets * m.layers
  const pct = (loraParams / fullParams) * 100

  // 显存估算（字节/参数）：训练 = 权重(fp16,2) + 梯度(2) + Adam状态(8) ≈ 12~16，取 16
  const fullMem = (fullParams * 16) / 1e9
  // LoRA：冻结权重 fp16(2) + 可训练参数全套(16) + 激活等开销 3GB
  const loraMem = (fullParams * 2 + loraParams * 16) / 1e9 + 3

  const GB = (v) => (v >= 1024 ? (v / 1024).toFixed(1) + ' TB' : v.toFixed(1) + ' GB')
  const fmtParams = (p) => (p >= 1e9 ? (p / 1e9).toFixed(2) + 'B' : p >= 1e6 ? (p / 1e6).toFixed(1) + 'M' : (p / 1e3).toFixed(0) + 'K')

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>基座模型</label>
          <div className="seg">
            {MODELS.map((mm, i) => <button key={i} className={mi === i ? 'on' : ''} onClick={() => setMi(i)}>{mm.B}B</button>)}
          </div>
        </div>
        <div className="ctrl"><label>LoRA 秩 r</label><input type="range" min="1" max="256" step="1" value={r} onChange={(e) => setR(+e.target.value)} /><span className="val">{r}</span></div>
        <div className="ctrl"><label>注入位置</label>
          <div className="seg">
            <button className={targets === 4 ? 'on' : ''} onClick={() => setTargets(4)}>仅注意力 QKVO</button>
            <button className={targets === 12 ? 'on' : ''} onClick={() => setTargets(12)}>+ 全部 FFN</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '16px 0' }}>
        <div style={{ background: '#fdf0f0', border: '1px solid #f3caca', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>❌ 全量微调</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 2 }}>
            可训练参数：<b>{fmtParams(fullParams)}</b>（100%）<br />
            训练显存 ≈ <b>{GB(fullMem)}</b>（权重+梯度+Adam 状态）<br />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>需要多卡 A100/H100 服务器 🖥🖥🖥</span>
          </div>
          <div style={{ height: 14, background: '#fff', borderRadius: 7, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: '100%', height: '100%', background: '#dc2626', opacity: 0.7 }} />
          </div>
        </div>
        <div style={{ background: '#ecfaf3', border: '1px solid #bfe8d2', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontWeight: 800, color: '#047857', marginBottom: 8 }}>✅ LoRA（秩 r={r}）</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 2 }}>
            可训练参数：<b>{fmtParams(loraParams)}</b>（仅 <b>{pct.toFixed(3)}%</b>）<br />
            训练显存 ≈ <b>{GB(loraMem)}</b>（冻结权重 + 小 trainable + 开销）<br />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>一张 24GB 消费级显卡就能跑 🎮</span>
          </div>
          <div style={{ height: 14, background: '#fff', borderRadius: 7, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ width: `${Math.max(2, pct * 30)}%`, height: '100%', background: '#10b981' }} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fcfcfe', border: '1px solid var(--border)', borderRadius: 11, padding: '14px 18px', fontSize: 13.5, fontFamily: 'var(--mono)', lineHeight: 2 }}>
        <span style={{ color: 'var(--text-3)' }}>▸ 全量：</span>ΔW 是完整的 d×d 矩阵（{m.d}×{m.d} × {m.layers}层 × 若干矩阵）<br />
        <span style={{ color: 'var(--text-3)' }}>▸ LoRA：</span>ΔW ≈ <b style={{ color: '#4f6df5' }}>B</b>×<b style={{ color: '#db2777' }}>A</b>（{m.d}×{r} 加 {r}×{m.d}），每对仅 {2 * m.d * r} 个参数
      </div>
      <div className="callout tip" style={{ marginTop: 12 }}>
        <div className="co-title">🎓 读懂数字</div>
        <p style={{ fontSize: 13.5 }}>
          LoRA 的洞察：<b>微调时的「改动量」ΔW 本质上是低秩的</b>——不必更新整个大矩阵，用两个瘦矩阵的乘积（B×A）近似即可。
          训练时冻结原模型（不存梯度、不存 Adam 状态），显存从「服务器级」降到「游戏本级」，而效果通常接近全量微调。
          👉 把 r 从 256 拉到 4，看可训练参数比例如何跳水；换 70B 模型感受差距更夸张。
          训练完成后 B×A 可以直接合并回原权重（W' = W + BA），<b>推理零额外延迟</b>——这是它打败 Adapter 等前辈方法的关键。
        </p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        这就是 LoRA（2021，微软）成为「人人都能微调大模型」幕后英雄的原因：QLoRA 更是把它和 4bit 量化结合，单卡 48GB 微调 65B 模型。开源社区的千千万万定制模型，大多是 LoRA 的产物。
      </div>
    </div>
  )
}
