import React, { useState } from 'react'
import { auth } from '../lib/auth.js'

// 登录页：未登录时全站只显示这一页。注册入口保留但禁用（暂未开放）。
export function LoginPage() {
  const [mode, setMode] = useState('login') // login | register
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function submit(e) {
    e.preventDefault()
    setError(''); setNotice('')
    if (!username.trim() || !password) { setError('请输入用户名和密码'); return }
    const r = mode === 'login' ? auth.login(username, password) : auth.register(username, password)
    if (!r.ok) setError(r.error)
  }

  function switchMode(m) {
    setMode(m); setError(''); setNotice('')
    if (m === 'register') setNotice('注册功能暂未开放，现在请使用内置管理员账号登录。')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-emoji">🧠</span>
          <div>
            <b>LLM 修炼之路</b>
            <small>从零开始的大模型学习平台</small>
          </div>
        </div>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => switchMode('login')}>登录</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => switchMode('register')}>
            注册<span className="auth-soon">暂未开放</span>
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="auth-field">
            <span>用户名</span>
            <input
              type="text" value={username} autoComplete="username"
              placeholder="输入用户名"
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>密码</span>
            <input
              type="password" value={password} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="输入密码"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="auth-error">⚠️ {error}</div>}
          {notice && !error && <div className="auth-notice">ℹ️ {notice}</div>}
          <button type="submit" className="auth-submit">
            {mode === 'login' ? '登 录' : '注 册（暂未开放）'}
          </button>
        </form>

        <div className="auth-hint">
          🔑 系统内置管理员：账号 <code>admin</code> · 初始密码 <code>admin123</code>
        </div>
        <div className="auth-version">LLM 修炼之路 v{__APP_VERSION__}</div>
      </div>
    </div>
  )
}
