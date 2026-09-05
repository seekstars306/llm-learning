import React from 'react'
import { Md } from './Md.jsx'

const KIND_META = {
  analogy: { icon: '🌟', label: '打个比方' },
  tip: { icon: '💡', label: '小贴士' },
  warn: { icon: '⚠️', label: '注意' },
  story: { icon: '📖', label: '背景故事' },
  qa: { icon: '❓', label: '自问自答' },
}

export function Callout({ kind = 'tip', title, children }) {
  const meta = KIND_META[kind] || KIND_META.tip
  return (
    <div className={`callout ${kind}`}>
      <div className="co-title">
        <span>{meta.icon}</span>
        {title || meta.label}
      </div>
      {typeof children === 'string' ? <p><Md text={children} /></p> : children}
    </div>
  )
}
