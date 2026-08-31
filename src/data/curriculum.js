import { m1 } from './m1.js'
import { m2 } from './m2.js'
import { m3 } from './m3.js'
import { m4 } from './m4.js'
import { m5 } from './m5.js'
import { m6 } from './m6.js'
import { m7 } from './m7.js'

// 全部课程数据。每课由结构化 block 数组组成，见 BlockRenderer。
export const modules = [m1, m2, m3, m4, m5, m6, m7]

export const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title, moduleColor: m.color, moduleEmoji: m.emoji })))

export function findLesson(id) {
  return allLessons.find((l) => l.id === id)
}

export function neighbors(id) {
  const i = allLessons.findIndex((l) => l.id === id)
  return { prev: i > 0 ? allLessons[i - 1] : null, next: i >= 0 && i < allLessons.length - 1 ? allLessons[i + 1] : null }
}

export const totalLessons = allLessons.length
