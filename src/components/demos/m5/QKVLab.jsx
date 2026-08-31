import React, { useState } from 'react'

// 5.2 Q/K/V 分步手算：3 个 token × 2 维向量，一步步算出注意力输出
const WORDS = ['猫', '坐', '垫子']
const X = [ // 每行是一个词的输入向量（2 维）
  [1.0, 0.5],
  [0.3, 0.8],
  [0.6, 0.2],
]
const WQ = [[1.0, 0.0], [0.0, 1.0]] // 演示用：单位阵，保持数字可读
const WK = [[1.0, 0.0], [0.0, 1.0]]
const WV = [[1.0, 0.2], [0.3, 0.9]]

const matMul = (X, W) => X.map((row) => W[0].map((_, j) => row.reduce((s, x, i) => s + x * W[i][j], 0)))
const Q = matMul(X, WQ); const K = matMul(X, WK); const V = matMul(X, WV)
const S = Q.map((q) => K.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2)))
const SOFT = S.map((row) => {
  const m = Math.max(...row)
  const es = row.map((v) => Math.exp(v - m))
  const sum = es.reduce((a, b) => a + b, 0)
  return es.map((e) => e / sum)
})
const OUT = SOFT.map((row) => row.reduce((acc, w, j) => [acc[0] + w * V[j][0], acc[1] + w * V[j][1]], [0, 0]))

function fmt(v) { return (v >= 0 ? ' ' : '') + v.toFixed(2) }

const STEPS = [
  {
    title: '① 准备：每个词的输入向量 X',
    body: '每个词（token）经过 embedding 变成一个向量。为便于手算，这里只用 2 维、3 个词。',
  },
  {
    title: '② 生成三份「身份」：Q、K、V',
    body: '同一份 X 分别乘三个可学习的权重矩阵 W_Q、W_K、W_V，得到查询（Query，我在找什么）、键（Key，我能提供什么标签）、值（Value，我实际携带的信息）。这是注意力能「学出不同模式」的关键。',
  },
  {
    title: '③ 打分：Q 乘 K 的转置',
    body: '每个「查询」和每个「键」做点积——点积越大 = 越匹配。得到的 3×3 矩阵，第 i 行第 j 列 = 第 i 个词对第 j 个词的关注分数（原始分）。',
  },
  {
    title: '④ 缩放：除以 √维度',
    body: '维度大时点积会系统性变大，softmax 会被推向「一家独大」、梯度趋零。除以 √d（这里 √2≈1.41）把分数拉回健康区间。',
  },
  {
    title: '⑤ softmax：分数变权重',
    body: '每行做 softmax，变成总和为 1 的「注意力分布」。这一步是可微的「软性选择」：不是硬性挑一个词，而是按比例混合所有词的信息。',
  },
  {
    title: '⑥ 加权求和：输出 = 权重 × V',
    body: '每个词的输出 = 用注意力权重对所有词的 V 加权平均。至此，每个词都「吸收」了全句上下文——这就是一次自注意力的完整输出。',
  },
]

// 5.3 Q/K/V 与缩放点积注意力：分步手算演示
export default function QKVLab() {
  const [step, setStep] = useState(0)
  const [tA, setTA] = useState(0.8) // 交互：调一个原始分数
  const [tB, setTB] = useState(0.4)

  const S2 = [...S]
  S2[1] = [S[1][0], tA, tB] // 「坐」这一行的两个分数可调
  const row2 = [tA, tB, S[1][2]]
  const m2 = Math.max(...row2)
  const e2 = row2.map((v) => Math.exp(v - m2))
  const sum2 = e2.reduce((a, b) => a + b, 0)
  const softRow2 = e2.map((e) => e / sum2)
  const SOFT2 = S2.map((row, i) => (i === 1 ? softRow2 : SOFT[i]))

  const Matrix = ({ data, highlight, label, color = '#4f6df5' }) => (
    <div style={{ display: 'inline-block', margin: '4px 14px 10px 0', verticalAlign: 'top' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j} style={{
                  border: '1px solid #d9dde9', padding: '4px 8px', fontSize: 12.5, fontFamily: 'var(--mono)',
                  background: highlight && highlight[0] === i && highlight[1] === j ? '#fdeecd' : '#fff',
                }}>{typeof v === 'number' ? fmt(v) : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          {STEPS.map((s, i) => <button key={i} className={step === i ? 'on' : ''} onClick={() => setStep(i)}>{i + 1}</button>)}
        </div>
        <button className="demo-btn primary" onClick={() => setStep((step + 1) % STEPS.length)}>下一步 →</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{STEPS[step].title}</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-2)', minHeight: 44 }}>{STEPS[step].body}</p>

      <div style={{ background: '#fcfcfe', border: '1px solid var(--border)', borderRadius: 11, padding: '14px 16px', overflowX: 'auto' }}>
        {step === 0 && (
          <>
            <Matrix label="输入 X（3 词 × 2 维）" data={X} />
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>行：猫 / 坐 / 垫子</div>
          </>
        )}
        {step === 1 && (
          <>
            <Matrix label="Q = X·W_Q（查询）" data={Q} color="#4f6df5" />
            <Matrix label="K = X·W_K（键）" data={K} color="#10b981" />
            <Matrix label="V = X·W_V（值）" data={V} color="#d97706" />
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>演示中 W_Q、W_K 取单位阵（数字好读）；W_V 则真的混入了变化，可以看到 V ≠ X。</div>
          </>
        )}
        {step === 2 && (
          <>
            <Matrix label="分数 = Q·Kᵀ" data={S} />
            <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
              读法：第 i 行 = 「{WORDS[i]}」对每个词的关注分数。比如「坐」对「垫子」的分数是 <b>{S[1][2].toFixed(2)}</b>（动宾搭配天然相关）。
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <Matrix label="分数 ÷ √2" data={S.map((r) => r.map((v) => v / Math.SQRT2))} />
            <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>数字整体变小了。GPT 里维度是几十上百，这个缩放更是性命攸关（否则 softmax 饱和、梯度消失）。</div>
          </>
        )}
        {step === 4 && (
          <>
            <Matrix label="注意力权重（每行和=1）" data={SOFT} />
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 10 }}>
              🎛 亲手调一下：「坐」对「猫」的原始分数（当前 {tA.toFixed(2)}）：
            </div>
            <div className="ctrl-row">
              <div className="ctrl"><label>坐→猫</label><input type="range" min="-2" max="3" step="0.1" value={tA} onChange={(e) => setTA(+e.target.value)} /><span className="val">{tA.toFixed(1)}</span></div>
              <div className="ctrl"><label>坐→垫子</label><input type="range" min="-2" max="3" step="0.1" value={tB} onChange={(e) => setTB(+e.target.value)} /><span className="val">{tB.toFixed(1)}</span></div>
            </div>
            <Matrix label="「坐」这一行的权重（实时变化）" data={[SOFT2[1]]} highlight={[0, 1]} color="#d97706" />
            <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>把分数调高 → softmax 权重迅速向它集中；调到负数 → 被边缘化。softmax 就是注意力的「软选择器」。</div>
          </>
        )}
        {step === 5 && (
          <>
            <Matrix label="输出 = 权重 × V" data={OUT} color="#7c3aed" />
            <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
              对比输入 X：每个词的新向量都已混入其他词的信息（比如「坐」吸收了「猫」和「垫子」的语义）。这个输出会继续走「残差 + 前馈网络」进入下一层（下一课见）。真实 GPT 同时跑 12～96 个「头」（每组独立 Q/K/V），再拼接起来——那就是<b>多头注意力</b>。
            </div>
          </>
        )}
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        你刚刚手算了一遍缩放点积注意力：<b>Attention(Q,K,V) = softmax(QKᵀ/√d)·V</b>。Transformer 的「魔法」没有任何一步超出这六个公式块——只是把维度放大到上千、头数乘以几十、层数堆到上百。
      </div>
    </div>
  )
}
