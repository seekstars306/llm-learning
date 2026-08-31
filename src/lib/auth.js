// 本地登录体系（零后端）：内置一个管理员账号；注册入口保留但暂未开放。
// 说明：账号与登录态都存在浏览器 localStorage 里，属于"门禁"级保护，不是服务端安全。
const USERS_KEY = 'lllearn-users'
const SESSION_KEY = 'lllearn-session'

// 系统内置管理员（首次运行自动写入账号表）
const DEFAULT_ADMIN = { username: 'admin', password: 'admin123', role: 'admin', name: '管理员' }

function loadUsers() {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) || 'null')
    if (Array.isArray(raw) && raw.some((u) => u && u.username === DEFAULT_ADMIN.username)) return raw
  } catch { /* 数据损坏时重建 */ }
  const seeded = [DEFAULT_ADMIN]
  try { localStorage.setItem(USERS_KEY, JSON.stringify(seeded)) } catch { /* 隐私模式等 */ }
  return seeded
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

let state = { users: loadUsers(), session: loadSession() }
const listeners = new Set()

function emit() { listeners.forEach((l) => l()) }

export const auth = {
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  // 返回 { session, users }；session 为 null 表示未登录
  get() {
    return state
  },

  login(username, password) {
    const u = state.users.find((x) => x.username === username.trim())
    if (!u || u.password !== password) return { ok: false, error: '用户名或密码不对' }
    state = { ...state, session: { username: u.username, role: u.role || 'user', name: u.name || u.username, at: Date.now() } }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(state.session)) } catch { /* 忽略 */ }
    emit()
    return { ok: true }
  },

  logout() {
    state = { ...state, session: null }
    try { localStorage.removeItem(SESSION_KEY) } catch { /* 忽略 */ }
    emit()
  },

  // 注册功能预留：当前暂不开放
  register() {
    return { ok: false, error: '注册暂未开放，请使用内置管理员账号登录' }
  },
}
