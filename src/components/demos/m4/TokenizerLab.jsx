import React, { useMemo, useState } from 'react'
import { MiniBPE } from '../../../lib/tokenizer.js'

const CORPUS = `the cat sat on the mat . the cat saw a dog . the dog chased the cat . machine learning is fun . deep learning is powerful . the model learned the pattern . learning machine learning takes time . the transformer model reads tokens . tokens can be words or subwords . subword learning is important . natural language processing is a branch of machine learning .`

// 4.1 分词与 Token：BPE 现场「学合并」
export default function TokenizerLab() {
  const [text, setText] = useState('The Transformer reads subword tokens like "unbelievable" .')
  const [merges, setMerges] = useState(40)
  const bpe = useMemo(() => new MiniBPE(CORPUS, 120), [])

  const units = bpe.encode(text, merges)
  const total = units.reduce((s, u) => s + u.sym.length, 0)
  const colors = ['#4f6df5', '#db2777', '#10b981', '#d97706', '#7c3aed', '#0d9488', '#dc2626', '#2563eb', '#db2777']
  let ci = 0

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl" style={{ flex: 1, minWidth: 260 }}>
          <label>输入文本</label>
          <input
            style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit' }}
            value={text} onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>
      <div className="ctrl-row">
        <div className="ctrl"><label>BPE 合并次数（词表大小）</label><input type="range" min="0" max="120" step="1" value={merges} onChange={(e) => setMerges(+e.target.value)} /><span className="val">{merges}</span></div>
        <span className="stat-chip">切出 token 数 <b>{total}</b></span>
        <span className="stat-chip">字符数 <b>{text.length}</b></span>
      </div>
      <div style={{ background: '#fcfcfe', border: '1px solid var(--border)', borderRadius: 11, padding: '16px 18px', minHeight: 96, lineHeight: 2.2 }}>
        {units.map((u, i) => (
          <span key={i}>
            {u.sym.map((s, j) => {
              const color = colors[ci++ % colors.length]
              return (
                <span key={j} style={{ background: color + '22', borderBottom: `2.5px solid ${color}`, borderRadius: 4, padding: '1px 3px', margin: '0 2px', fontFamily: 'var(--mono)', fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{s}</span>
              )
            })}
          </span>
        ))}
        {!text && <span style={{ color: 'var(--text-3)' }}>在上方输入任意文字试试…</span>}
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        👉 把合并次数拉到 <b>0</b>：一切退回单字符；拉到 <b>120</b>：常见词（the、learning）被合并成一个 token，而没见过的长词（unbelievable）会自动拆成 <b>un + believ + able</b> 这样的「子词」。这就是大模型眼中的文字——<b>不是字，是 token 序列</b>；模型词表通常 3 万～15 万，计费、上下文长度、中英文差异（英文常 1 词 ≈ 1.3 token，中文 1 字 ≈ 0.6~1 token）全都从这来。
      </div>
    </div>
  )
}
