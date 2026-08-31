import React from 'react'
import katex from 'katex'

// 带逐项颜色解释的公式块。
// tex 中用 \textcolor{#xxx}{...} 标色，terms 里给每一段配上名字和解释。
export function Formula({ tex, terms = [], note }) {
  const html = katex.renderToString(tex, { displayMode: true, throwOnError: false })
  return (
    <div className="formula-card">
      <div className="formula-display" dangerouslySetInnerHTML={{ __html: html }} />
      {terms.length > 0 && (
        <div className="formula-terms">
          {terms.map((t, i) => (
            <div className="formula-term" key={i}>
              <span className="ft-frag" style={{ borderColor: t.color, color: t.color, background: t.color + '14' }}>
                <InlineTex tex={t.frag} />
              </span>
              <span className="ft-name">{t.name}</span>
              <span className="ft-desc">—— {t.desc}</span>
            </div>
          ))}
        </div>
      )}
      {note && <div className="formula-note">{note}</div>}
    </div>
  )
}

function InlineTex({ tex }) {
  const html = katex.renderToString(tex, { throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
