import React, { useState } from 'react'
import { glossary } from '../data/glossary.js'

export function GlossaryPage() {
  const [q, setQ] = useState('')
  const kw = q.trim().toLowerCase()
  const list = glossary.filter(
    (g) => !kw || g.term.toLowerCase().includes(kw) || g.en.toLowerCase().includes(kw) || g.def.toLowerCase().includes(kw)
  )
  const tags = [...new Set(glossary.map((g) => g.tag))]
  return (
    <div className="content-inner">
      <div className="lesson-head">
        <div className="lesson-kicker" style={{ color: 'var(--accent)' }}>📚 REFERENCE</div>
        <h1 className="lesson-title">术语速查表</h1>
        <div className="lesson-meta"><span>共 {glossary.length} 个术语 · 学习中随时回来查</span></div>
      </div>
      <input className="gloss-search" placeholder="🔍 搜索术语，比如 LoRA、注意力、量化…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="legend-row" style={{ marginTop: 14 }}>
        {tags.map((t) => (
          <span key={t} className="stat-chip" style={{ cursor: 'pointer', background: q === t ? 'var(--accent-soft)' : 'var(--bg-soft)' }} onClick={() => setQ(q === t ? '' : t)}>
            {t}
          </span>
        ))}
      </div>
      <div className="gloss-grid">
        {list.map((g) => (
          <div className="gloss-card" key={g.term}>
            <h4>{g.term} <span className="en">{g.en}</span> <span className="tag">{g.tag}</span></h4>
            <p>{g.def}</p>
          </div>
        ))}
        {list.length === 0 && <p style={{ color: 'var(--text-3)' }}>没有找到匹配的术语～</p>}
      </div>
    </div>
  )
}
