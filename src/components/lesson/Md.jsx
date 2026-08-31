import React from 'react'

// 轻量内联 Markdown：支持 **加粗**、*斜体*、`代码`
export function Md({ text }) {
  if (!text) return null
  return <>{parseInline(text)}</>
}

export function parseInline(text) {
  const nodes = []
  // 用一个正则把三种语法一起切出来
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g
  let last = 0
  let m
  let key = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[2] !== undefined) nodes.push(<strong key={key++}>{m[2]}</strong>)
    else if (m[4] !== undefined) nodes.push(<em key={key++}>{m[4]}</em>)
    else if (m[6] !== undefined) nodes.push(<code key={key++} className="inline-code">{m[6]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
