import React, { useEffect, useRef } from 'react'

// 高分屏 canvas 初始化：返回 ctx，并把 css 尺寸与物理像素对齐
export function useCanvas(draw, width = 720, height = 420, deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = width * dpr
    cv.height = height * dpr
    cv.style.width = '100%'
    cv.style.aspectRatio = `${width} / ${height}`
    cv.style.height = 'auto'
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    draw(ctx, width, height)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

// 各演示 draw() 里手动初始化 canvas 时统一用这个：设置物理尺寸 + CSS 等比缩放
export function setupCanvas(cv, W, H) {
  const dpr = window.devicePixelRatio || 1
  cv.width = W * dpr
  cv.height = H * dpr
  cv.style.width = '100%'
  cv.style.aspectRatio = `${W} / ${H}`
  cv.style.height = 'auto'
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

// 把世界坐标映射到画布
export function makeScale(xMin, xMax, yMin, yMax, w, h, pad = 34) {
  return {
    x: (v) => pad + ((v - xMin) / (xMax - xMin)) * (w - pad * 2),
    y: (v) => h - pad - ((v - yMin) / (yMax - yMin)) * (h - pad * 2),
    ix: (px) => xMin + ((px - pad) / (w - pad * 2)) * (xMax - xMin),
    iy: (py) => yMin + ((h - pad - py) / (h - pad * 2)) * (yMax - yMin),
    xMin, xMax, yMin, yMax, w, h, pad,
  }
}

export function clearCanvas(ctx, w, h, bg = '#fcfcfe') {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

export function drawAxes(ctx, sc, xLabel = 'x', yLabel = 'y', fmt = (v) => v) {
  ctx.strokeStyle = '#d9dde9'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sc.x(sc.xMin), sc.y(sc.yMin))
  ctx.lineTo(sc.x(sc.xMax), sc.y(sc.yMin))
  ctx.moveTo(sc.x(sc.xMin), sc.y(sc.yMin))
  ctx.lineTo(sc.x(sc.xMin), sc.y(sc.yMax))
  ctx.stroke()
  ctx.fillStyle = '#8a92a6'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  const nTicks = 5
  for (let i = 0; i <= nTicks; i++) {
    const v = sc.xMin + ((sc.xMax - sc.xMin) * i) / nTicks
    ctx.fillText(fmt(v), sc.x(v), sc.y(sc.yMin) + 16)
  }
  ctx.textAlign = 'right'
  for (let i = 0; i <= nTicks; i++) {
    const v = sc.yMin + ((sc.yMax - sc.yMin) * i) / nTicks
    ctx.fillText(fmt(v), sc.x(sc.xMin) - 7, sc.y(v) + 4)
  }
  ctx.textAlign = 'left'
  ctx.fillText(xLabel, sc.x(sc.xMax) - 14, sc.y(sc.yMin) + 28)
  ctx.fillText(yLabel, sc.x(sc.xMin) + 6, sc.y(sc.yMax) + 4)
}

export function plotFn(ctx, sc, f, color = '#4f6df5', lw = 2.2, n = 160) {
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  let started = false
  for (let i = 0; i <= n; i++) {
    const wx = sc.xMin + ((sc.xMax - sc.xMin) * i) / n
    const wy = f(wx)
    if (!isFinite(wy)) { started = false; continue }
    const py = Math.max(-2000, Math.min(4000, sc.y(wy)))
    if (!started) { ctx.moveTo(sc.x(wx), py); started = true }
    else ctx.lineTo(sc.x(wx), py)
  }
  ctx.stroke()
}

export function drawDots(ctx, pts, sc, color = '#4f6df5', r = 4, stroke = '#fff') {
  pts.forEach((p) => {
    ctx.beginPath()
    ctx.arc(sc.x(p[0]), sc.y(p[1]), r, 0, Math.PI * 2)
    ctx.fillStyle = p.color || color
    ctx.fill()
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke() }
  })
}

// requestAnimationFrame 循环 hook：返回 {playing, start, stop, tick}
export function useRafLoop(callback, deps = []) {
  const raf = useRef(null)
  const cbRef = useRef(callback)
  cbRef.current = callback
  useEffect(() => {
    let alive = true
    const loop = (t) => {
      if (!alive) return
      cbRef.current(t)
      raf.current = requestAnimationFrame(loop)
    }
    return () => { alive = false; cancelAnimationFrame(raf.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return () => { const r = raf.current; if (r) cancelAnimationFrame(r) }
}

// 简单伪随机（保证每次渲染演示初始数据一致）
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const PALETTE = ['#4f6df5', '#db2777', '#10b981', '#d97706', '#7c3aed', '#0d9488', '#dc2626', '#2563eb']
