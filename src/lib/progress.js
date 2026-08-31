// 学习进度管理：全部存 localStorage，跨会话保留
const KEY = 'lllearn.progress.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

let state = load()
const listeners = new Set()

function save() {
  localStorage.setItem(KEY, JSON.stringify(state))
  listeners.forEach((fn) => fn())
}

export const progress = {
  isDone(lessonId) {
    return !!state[lessonId]?.done
  },
  // 注意：必须生成新对象（不可变更新），useSyncExternalStore 靠引用变化感知更新
  markDone(lessonId) {
    state = { ...state, [lessonId]: { ...state[lessonId], done: true, at: Date.now() } }
    save()
  },
  markUndone(lessonId) {
    state = { ...state, [lessonId]: { ...state[lessonId], done: false } }
    save()
  },
  saveQuiz(lessonId, score, total) {
    const prev = state[lessonId] || {}
    const best = Math.max(prev.quizScore ?? -1, score)
    state = { ...state, [lessonId]: { ...prev, quizScore: best, quizTotal: total } }
    save()
  },
  get() {
    return state
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
