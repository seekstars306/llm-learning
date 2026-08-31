import React, { useMemo, useState } from 'react'

const TOKENS = ['小猫', '追', '皮球', '，', '它', '玩', '得', '很', '开心']
// 手工设计的 4 维「词向量」：让注意力呈现有意义的模式
const VEC = {
  '小猫': [1.0, 0.0, 0.0, 0.8],
  '追': [0.0, 0.0, 1.0, 0.2],
  '皮球': [0.0, 1.0, 0.0, 0.6],
  '，': [0.0, 0.0, 0.0, 0.0],
  '它': [0.9, 0.7, 0.0, 0.0],
  '玩': [0.0, 0.7, 1.0, 0.3],
  '得': [0.0, 0.0, 1.0, 0.0],
  '很': [0.0, 0.0, 0.9, 0.0],
  '开心': [0.6, 0.2, 0.0, 0.9],
}

function softmax(arr, T = 1) {
  const m = Math.max(...arr)
  const es = arr.map((v) => Math.exp((v - m) / T))
  const s = es.reduce((a, b) => a + b, 0)
  return es.map((e) => e / s)
}

// 5.1 自注意力热力图：点任一词看它「关注」谁；温度滑块 + 因果掩码开关
export default function AttentionLab() {
  const [T, setT] = useState(1)
  const [causal, setCausal] = useState(false)
  const [row, setRow] = useState(4) // 默认选中「它」

  const attn = useMemo(() => {
    const n = TOKENS.length
    const d = Math.sqrt(4)
    const M = []
    for (let i = 0; i < n; i++) {
      const scores = []
      for (let j = 0; j < n; j++) {
        if (causal && j > i) { scores.push(-Infinity); continue }
        const qi = VEC[TOKENS[i]]; const kj = VEC[TOKENS[j]]
        scores.push(qi.reduce((s, q, k) => s + q * kj[k], 0) / d)
      }
      M.push(softmax(scores, T))
    }
    return M
  }, [T, causal])

  const color = (v) => {
    if (!isFinite(v)) return '#f1f3f9'
    const t = Math.min(1, v)
    return `rgba(79,109,245,${0.06 + t * 0.9})`
  }

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>softmax 温度</label><input type="range" min="0.3" max="3" step="0.05" value={T} onChange={(e) => setT(+e.target.value)} /><span className="val">{T.toFixed(2)}</span></div>
        <button className="demo-btn" onClick={() => setCausal(!causal)}>{causal ? '🔒 因果掩码：开（GPT 模式）' : '🔓 因果掩码：关（BERT 模式）'}</button>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>👆 点击任意一行，查看该词的注意力分布</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-3)' }}>查询 \ 被看</th>
              {TOKENS.map((t) => <th key={t} style={{ padding: '4px 6px', fontSize: 12.5, fontWeight: 600 }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {TOKENS.map((t, i) => (
              <tr key={i} onClick={() => setRow(i)} style={{ cursor: 'pointer', outline: row === i ? '2px solid #d97706' : 'none' }}>
                <td style={{ padding: '4px 8px', fontSize: 12.5, fontWeight: row === i ? 800 : 400, color: row === i ? '#b45309' : 'var(--text-2)' }}>{t}</td>
                {TOKENS.map((t2, j) => {
                  const v = attn[i][j]
                  return (
                    <td key={j} style={{ background: color(v), padding: '6px 6px', textAlign: 'center', fontSize: 11, fontFamily: 'var(--mono)', color: v > 0.45 ? '#fff' : '#4a5268', border: '1px solid #fff', minWidth: 40 }}>
                      {isFinite(v) ? v.toFixed(2) : '屏蔽'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          「{TOKENS[row]}」的目光分布：
          <span style={{ color: 'var(--accent-2)', marginLeft: 6 }}>
            {(() => {
              const rowV = attn[row].map((v, j) => (isFinite(v) ? [v, j] : [0, j]))
              const top = rowV.sort((a, b) => b[0] - a[0]).slice(0, 2).filter(([, j]) => j !== row && attn[row][j] > 0.05)
              return top.length ? top.map(([v, j]) => `${TOKENS[j]} ${(v * 100).toFixed(0)}%`).join('、') : '（主要看着自己）'
            })()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          {attn[row].map((v, j) => (
            <div key={j} style={{ textAlign: 'center' }}>
              <div style={{ width: 30, height: isFinite(v) ? Math.max(3, v * 90) : 3, background: isFinite(v) ? (j === row ? '#c9cede' : '#4f6df5') : '#e4e7f0', borderRadius: 4, margin: '0 auto' }} />
              <div style={{ fontSize: 12, marginTop: 3, color: 'var(--text-3)' }}>{TOKENS[j]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="callout tip" style={{ marginTop: 14 }}>
        <div className="co-title">🔍 三个观察点</div>
        <p style={{ fontSize: 13.5 }}>
          ① 点「<b>它</b>」：它的注意力集中在「小猫」和「皮球」上——<b>代词指代的消解，注意力一步完成</b>（RNN 需要 99 步接力的事）。<br />
          ② 把<b>温度</b>调低（0.4）：分布变得尖锐，几乎只看最相关的词；调高（2.5+）：变得平均、雨露均沾——这个旋钮和 GPT 生成文本时的是同一个。<br />
          ③ 打开<b>因果掩码</b>：每个词只能看自己左边（右上角被屏蔽）——这正是 GPT 生成模式的设定：还没说出来的词不能偷看；关掉则是 BERT 式的全句理解模式。
        </p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        图中数字由真实的注意力公式算出：分数 = 查询向量 · 键向量 ÷ √维度，再过 softmax。词向量是手工设计的（为了演示效果），真实模型里它们由训练自动学出、维度高达数十上百。下一课我们把这套计算的每一步掰开揉碎。
      </div>
    </div>
  )
}
