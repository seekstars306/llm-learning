import React from 'react'

// 所有交互演示的统一外壳：标题栏 + 内容 + 底部说明
export function DemoShell({ id, title, caption, children }) {
  return (
    <div className="demo-wrap" id={`demo-${id}`}>
      <div className="demo-frame">
        <div className="demo-titlebar">
          <span className="demo-badge">动手玩</span>
          {title}
        </div>
        <div className="demo-body">{children}</div>
        {caption && <div className="demo-caption">{caption}</div>}
      </div>
    </div>
  )
}
