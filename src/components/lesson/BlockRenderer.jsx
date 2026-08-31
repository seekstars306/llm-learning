import React from 'react'
import { Md } from './Md.jsx'
import { Formula } from './Formula.jsx'
import { Callout } from './Callout.jsx'
import { Quiz } from './Quiz.jsx'
import { DemoShell } from './DemoShell.jsx'
import { getDemo } from '../demos/registry.jsx'

// 课件的 block 渲染器：所有课程内容由统一的结构化 block 组成
export function BlockRenderer({ block, lessonId }) {
  switch (block.t) {
    case 'h':
      return <h2><span className="h-dot" />{block.text}</h2>
    case 'p':
      return <p><Md text={block.md} /></p>
    case 'list':
      return block.ordered ? (
        <ol>{block.items.map((it, i) => <li key={i}><Md text={it} /></li>)}</ol>
      ) : (
        <ul>{block.items.map((it, i) => <li key={i}><Md text={it} /></li>)}</ul>
      )
    case 'steps':
      return (
        <ul className="steps-list">
          {block.items.map((it, i) => (
            <li key={i}><div><b>{it.title}</b><span><Md text={it.md} /></span></div></li>
          ))}
        </ul>
      )
    case 'formula':
      return <Formula tex={block.tex} terms={block.terms} note={block.note} />
    case 'callout':
      return <Callout kind={block.kind} title={block.title}><Md text={block.md} /></Callout>
    case 'table':
      return (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>{block.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {block.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Md text={c} /></td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )
    case 'code':
      return (
        <pre className="code-block">
          {block.lang && <span className="code-lang">{block.lang}</span>}
          <code>{block.code}</code>
        </pre>
      )
    case 'demo': {
      const Comp = getDemo(block.id)
      if (!Comp) return null
      return (
        <DemoShell id={block.id} title={block.title} caption={block.caption}>
          <Comp />
        </DemoShell>
      )
    }
    case 'quiz':
      return <Quiz lessonId={lessonId} questions={block.questions} />
    case 'summary':
      return (
        <div className="summary-card">
          <h3>📌 本课要点</h3>
          <ul>{block.items.map((it, i) => <li key={i}><Md text={it} /></li>)}</ul>
        </div>
      )
    default:
      return null
  }
}
