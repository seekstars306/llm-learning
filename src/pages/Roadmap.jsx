import React, { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { modules, allLessons, totalLessons } from '../data/curriculum.js'
import { progress } from '../lib/progress.js'

export function Roadmap() {
  const prog = useSyncExternalStore(progress.subscribe, progress.get)
  const doneCount = allLessons.filter((l) => prog[l.id]?.done).length

  // 「继续学习」= 第一个未完成的课
  const nextUp = allLessons.find((l) => !prog[l.id]?.done) || allLessons[0]

  return (
    <div className="content-inner">
      <div className="hero">
        <h1>🧠 LLM 修炼之路</h1>
        <p>
          专为<b>零基础</b>学习者设计的大模型学习路线：从「什么是机器学习」一路讲到 RAG、Agent、MoE 等行业最前沿。
          每个概念都先用<b>生活化比喻</b>建立直觉，再用<b>公式逐项拆解</b>讲透原理，配上 20+ 个可以动手玩的交互演示。
        </p>
        <div className="hero-meta">
          <span>📚 {totalLessons} 节课</span>
          <span>🕹 21 个交互演示</span>
          <span>🎯 {Math.round((doneCount / totalLessons) * 100)}% 已完成</span>
          <span>⏱ 全程约 10 小时</span>
        </div>
      </div>

      <div className="done-bar" style={{ marginTop: 0, marginBottom: 30 }}>
        <div style={{ fontSize: 22 }}>{doneCount >= totalLessons ? '🏆' : '🚀'}</div>
        <div className="done-text">
          {doneCount >= totalLessons
            ? '恭喜你完成了全部课程！接下来去第 7 模块的「进阶路线」看看实战建议吧。'
            : doneCount === 0
              ? '从第 1 课开始，沿着路线图一路往上爬。每节课 10～20 分钟，进度会自动保存。'
              : `已完成 ${doneCount}/${totalLessons} 课，从上次停下的地方继续！`}
        </div>
        <Link to={`/lesson/${nextUp.id}`}>
          <button className="done-btn">{doneCount === 0 ? '开始第 1 课 →' : '继续学习 →'}</button>
        </Link>
      </div>

      {modules.map((m, idx) => {
        const done = m.lessons.filter((l) => prog[l.id]?.done).length
        return (
          <React.Fragment key={m.id}>
            <div className="path-connector">STAGE {m.num}</div>
            <div className="mod-cards" style={{ marginBottom: 26 }}>
              {m.lessons.map((l) => {
                const isDone = prog[l.id]?.done
                return (
                  <Link key={l.id} to={`/lesson/${l.id}`} className="mod-card" style={{ '--mod-color': m.color, '--mod-tint': m.color + '18' }}>
                    <span className="mod-num">{m.num}</span>
                    <div className="mod-card-top">
                      <span className="big-emoji">{l.emoji || m.emoji}</span>
                      <div>
                        <h3>{l.num} {l.title}</h3>
                        <div className="mod-sub">⏱ 约 {l.minutes} 分钟 {l.demoCount ? `· 🕹 ${l.demoCount} 个演示` : ''}</div>
                      </div>
                    </div>
                    <p>{l.brief}</p>
                    <div className="mod-card-foot">
                      {isDone ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ 已完成</span> : <span>📌 未开始</span>}
                      <div className="mini-track">
                        <div className="mini-fill" style={{ width: isDone ? '100%' : '0%' }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </React.Fragment>
        )
      })}
      <div className="footer-note">用 ❤️ 和大量 Canvas 为你打造 · 进度保存在浏览器本地</div>
    </div>
  )
}
