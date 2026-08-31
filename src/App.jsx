import React, { useSyncExternalStore } from 'react'
import { Routes, Route, NavLink, Link, useLocation, useParams } from 'react-router-dom'
import { modules, findLesson, neighbors, allLessons, totalLessons } from './data/curriculum.js'
import { progress } from './lib/progress.js'
import { auth } from './lib/auth.js'
import { BlockRenderer } from './components/lesson/BlockRenderer.jsx'
import { GlossaryPage } from './pages/GlossaryPage.jsx'
import { Roadmap } from './pages/Roadmap.jsx'
import { LoginPage } from './pages/LoginPage.jsx'

function useProgress() {
  return useSyncExternalStore(progress.subscribe, progress.get)
}

function useAuth() {
  return useSyncExternalStore(auth.subscribe, auth.get)
}

function currentLessonId(pathname) {
  const m = pathname.match(/^\/lesson\/([^/]+)/)
  return m ? m[1] : null
}

function Sidebar({ open, onClose }) {
  const prog = useProgress()
  const location = useLocation()
  const lessonId = currentLessonId(location.pathname)
  const openMod = lessonId ? lessonId.split('l')[0] : null
  const doneCount = allLessons.filter((l) => prog[l.id]?.done).length

  // 直接点开课程链接时展开对应模块
  const expanded = {}
  modules.forEach((m) => {
    expanded[m.id] = m.id === openMod
  })
  if (openMod) expanded[openMod] = true
  if (location.pathname === '/') Object.keys(expanded).forEach((k) => (expanded[k] = false))

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="side-logo">
        <span className="logo-emoji">🧠</span>
        <div>
          LLM 修炼之路
          <small>从零开始的大模型学习平台</small>
        </div>
      </div>
      <Link to="/" className="side-progress" style={{ textDecoration: 'none' }}>
        <div>
          <b>{doneCount}</b>
          <span style={{ fontSize: 11 }}> / {totalLessons} 课</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(doneCount / totalLessons) * 100}%` }} />
        </div>
        <span style={{ fontSize: 16 }}>🗺️</span>
      </Link>
      {modules.map((m) => (
        <div className="mod-group" key={m.id}>
          <button
            className="mod-head"
            onClick={(e) => {
              const ls = e.currentTarget.nextElementSibling
              if (ls) ls.style.display = ls.style.display === 'none' ? '' : 'none'
              e.currentTarget.querySelector('.chev')?.classList.toggle('open')
            }}
          >
            <span className="mod-emoji">{m.emoji}</span>
            {m.num}. {m.title}
            <span className={`chev ${expanded[m.id] ? 'open' : ''}`}>▶</span>
          </button>
          <div className="mod-lessons" style={expanded[m.id] ? {} : { display: 'none' }}>
            {m.lessons.map((l) => (
              <NavLink key={l.id} to={`/lesson/${l.id}`} className={({ isActive }) => `lesson-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <span>{l.title}</span>
                {prog[l.id]?.done && <span className="done-tick">✓</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      <div className="side-nav-extra">
        <NavLink to="/glossary" className={({ isActive }) => `lesson-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          📚 术语速查表
        </NavLink>
      </div>
    </aside>
  )
}

function LessonPage() {
  const { lessonId } = useParams()
  const prog = useProgress()
  const lesson = findLesson(lessonId)
  const { prev, next } = neighbors(lessonId)
  // 小测成绩计入进度
  React.useEffect(() => {
    if (!lesson) return
    const onQuiz = (e) => {
      if (e.detail?.lessonId === lesson.id) progress.saveQuiz(lesson.id, e.detail.score, e.detail.total)
    }
    window.addEventListener('lllearn-quiz', onQuiz)
    return () => window.removeEventListener('lllearn-quiz', onQuiz)
  }, [lesson?.id])
  if (!lesson) return <div className="content-inner">课程不存在</div>
  const done = !!prog[lesson.id]?.done

  return (
    <div className="content-inner">
      <div className="lesson-head">
        <div className="lesson-kicker" style={{ color: lesson.moduleColor }}>
          <span>{lesson.moduleEmoji}</span>
          {lesson.moduleId.replace('m', '模块 ')} · {lesson.moduleTitle}
        </div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-meta">
          <span>⏱ 约 {lesson.minutes} 分钟</span>
          {lesson.demoCount > 0 && <span>🕹 包含 {lesson.demoCount} 个交互演示</span>}
        </div>
      </div>
      <div className="lesson-body">
        {lesson.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} lessonId={lesson.id} />
        ))}
      </div>
      <div className="done-bar">
        <div className="done-text">
          {done ? '🎉 已完成本课，继续保持！' : '看完这节课了？标记完成，它会记入你的学习进度。'}
        </div>
        <button
          className={`done-btn ${done ? 'is-done' : ''}`}
          onClick={() => (done ? progress.markUndone(lesson.id) : progress.markDone(lesson.id))}
        >
          {done ? '✓ 已完成' : '标记完成'}
        </button>
      </div>
      <div className="pager">
        {prev ? (
          <Link to={`/lesson/${prev.id}`}>
            <div className="pg-label">← 上一课</div>
            <div className="pg-title">{prev.title}</div>
          </Link>
        ) : (
          <a className="pg-empty" />
        )}
        {next ? (
          <Link to={`/lesson/${next.id}`} className="next">
            <div className="pg-label">下一课 →</div>
            <div className="pg-title">{next.title}</div>
          </Link>
        ) : (
          <Link to="/" className="next">
            <div className="pg-label">返回 →</div>
            <div className="pg-title">学习路线图</div>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const user = useAuth()
  const [menuOpen, setMenuOpen] = React.useState(false)
  React.useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
  }, [location.pathname])
  // 手机端抽屉打开时锁住背景滚动
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])
  // 未登录：全站只显示登录页（注册暂未开放，内置管理员账号见登录页提示）
  if (!user.session) return <LoginPage />

  const lesson = currentLessonId(location.pathname) ? findLesson(currentLessonId(location.pathname)) : null
  const crumb = location.pathname === '/glossary'
    ? '术语速查表'
    : lesson
      ? <span>模块 {lesson.moduleId.slice(1)} · <b>{lesson.title}</b></span>
      : <b>学习路线图</b>

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="side-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className="main-col">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <span className="crumb">{crumb}</span>
          <div className="topbar-spacer" />
          <Link to="/glossary"><button className="btn-ghost">📚 术语表</button></Link>
          <Link to="/"><button className="btn-ghost">🗺️ 路线图</button></Link>
          <span className="user-chip" title={`登录账号：${user.session.username}${user.session.role === 'admin' ? '（管理员）' : ''}`}>
            {user.session.role === 'admin' ? '🛡️' : '👤'} {user.session.name}
          </span>
          <button className="btn-ghost" onClick={() => auth.logout()}>退出</button>
        </div>
        <div className="content">
          <Routes>
            <Route path="/" element={<Roadmap />} />
            <Route path="/lesson/:lessonId" element={<LessonPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
