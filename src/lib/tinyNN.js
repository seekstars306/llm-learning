// 纯 JavaScript 微型神经网络引擎：支持任意层数 MLP + 反向传播
// 足够小所以能在浏览器里实时训练，支撑 Playground / 手写数字 / 反向传播演示

export function randn(seedRef) {
  // Box-Muller 变换，seedRef = {s: 12345}
  seedRef.s = (seedRef.s * 16807 + 11) % 2147483647
  const u = Math.max(1e-9, (seedRef.s % 100000) / 100000)
  seedRef.s = (seedRef.s * 16807 + 11) % 2147483647
  const v = (seedRef.s % 100000) / 100000
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const ACT = {
  relu: { f: (x) => Math.max(0, x), d: (x) => (x > 0 ? 1 : 0) },
  tanh: { f: Math.tanh, d: (x) => 1 - Math.tanh(x) ** 2 },
  sigmoid: { f: (x) => 1 / (1 + Math.exp(-x)), d: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s) } },
  gelu: { f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))), d: (x) => { const c = Math.sqrt(2 / Math.PI); const inner = c * (x + 0.044715 * x ** 3); const t = Math.tanh(inner); return 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * c * (1 + 3 * 0.044715 * x * x) } },
}

export class MLP {
  /**
   * sizes: 如 [2, 8, 8, 1]，首为输入维，尾为输出维
   * hiddenAct: 'relu' | 'tanh' | 'sigmoid' | 'gelu'
   * outAct: 'sigmoid'（二分类）| 'none'（回归）
   */
  constructor(sizes, hiddenAct = 'tanh', outAct = 'sigmoid', seed = 42) {
    this.sizes = sizes
    this.hiddenAct = hiddenAct
    this.outAct = outAct
    this.seedRef = { s: seed }
    this.W = []
    this.b = []
    for (let l = 0; l < sizes.length - 1; l++) {
      const nin = sizes[l]
      const nout = sizes[l + 1]
      const scale = hiddenAct === 'relu' ? Math.sqrt(2 / nin) : Math.sqrt(1 / nin)
      this.W.push(Array.from({ length: nout }, () => Array.from({ length: nin }, () => randn(this.seedRef) * scale)))
      this.b.push(new Array(nout).fill(0))
    }
  }

  forward(x) {
    this.a = [x]
    this.z = []
    let cur = x
    const L = this.W.length
    for (let l = 0; l < L; l++) {
      const z = this.W[l].map((row, j) => row.reduce((s, w, i) => s + w * cur[i], 0) + this.b[l][j])
      const isOut = l === L - 1
      const act = isOut ? (this.outAct === 'sigmoid' ? ACT.sigmoid.f : (v) => v) : ACT[this.hiddenAct].f
      this.z.push(z)
      this.a.push(z.map(act))
      cur = this.a[l + 1]
    }
    return cur
  }

  // 二分类 BCE 或回归 MSE 的反向传播；梯度累加进 this.gW/gB（调用方负责先清零）
  backward(target) {
    const L = this.W.length
    const out = this.a[L]
    // 输出层误差 delta（sigmoid+BCE 与 linear+MSE 都恰好简化为 out - target）
    let delta = out.map((o, i) => o - target[i])
    for (let l = L - 1; l >= 0; l--) {
      const aPrev = this.a[l]
      for (let j = 0; j < delta.length; j++) {
        for (let i = 0; i < aPrev.length; i++) this.gW[l][j][i] += delta[j] * aPrev[i]
        this.gB[l][j] += delta[j]
      }
      if (l > 0) {
        const dAct = ACT[this.hiddenAct].d
        const zPrev = this.z[l - 1]
        const newDelta = new Array(aPrev.length).fill(0)
        for (let i = 0; i < aPrev.length; i++) {
          let s = 0
          for (let j = 0; j < delta.length; j++) s += this.W[l][j][i] * delta[j]
          newDelta[i] = s * dAct(zPrev[i])
        }
        delta = newDelta
      }
    }
    return this
  }

  step(lr, batchN = 1) {
    for (let l = 0; l < this.W.length; l++) {
      for (let j = 0; j < this.W[l].length; j++) {
        for (let i = 0; i < this.W[l][j].length; i++) this.W[l][j][i] -= (lr * this.gW[l][j][i]) / batchN
        this.b[l][j] -= (lr * this.gB[l][j]) / batchN
      }
    }
  }

  trainBatch(xs, ys, lr) {
    const n = xs.length
    this.gW = this.W.map((m) => m.map((r) => r.map(() => 0)))
    this.gB = this.b.map((v) => v.map(() => 0))
    let loss = 0
    for (let k = 0; k < n; k++) {
      this.forward(xs[k])
      const out = this.a[this.a.length - 1]
      if (this.outAct === 'sigmoid') {
        loss -= ys[k][0] * Math.log(Math.max(1e-9, out[0])) + (1 - ys[k][0]) * Math.log(Math.max(1e-9, 1 - out[0]))
      } else {
        loss += 0.5 * ((out[0] - ys[k][0]) ** 2)
      }
      this.backward(ys[k])
    }
    this.step(lr, n)
    return loss / n
  }

  predict(x) {
    return this.forward(x)[0]
  }
}

// ===== 二维分类数据集生成 =====
export function genDataset(kind, n = 220, seed = 7) {
  const pts = []
  const rng = { s: seed * 7919 + 13 }
  const r = () => {
    rng.s = (rng.s * 16807 + 11) % 2147483647
    return (rng.s % 100000) / 100000
  }
  const gauss = () => {
    const u = Math.max(1e-9, r())
    const v = r()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  for (let i = 0; i < n; i++) {
    if (kind === 'circle') {
      const rad = r() * 2.2
      const ang = r() * Math.PI * 2
      const inner = rad < 1.1
      pts.push({ x: Math.cos(ang) * (inner ? rad : 1.3 + rad * 0.55) + gauss() * 0.08, y: Math.sin(ang) * (inner ? rad : 1.3 + rad * 0.55) + gauss() * 0.08, label: inner ? 1 : 0 })
    } else if (kind === 'xor') {
      const x = (r() - 0.5) * 4.4
      const y = (r() - 0.5) * 4.4
      pts.push({ x, y, label: x * y > 0 ? 1 : 0 })
    } else if (kind === 'blob') {
      const which = i % 2
      const cx = which ? 1.3 : -1.3
      const cy = which ? -1.1 : 1.1
      pts.push({ x: cx + gauss() * 0.7, y: cy + gauss() * 0.7, label: which })
    } else if (kind === 'spiral') {
      const which = i % 2
      const t = 1.75 * (i / n) * 2 * Math.PI + (which ? Math.PI : 0)
      const rad = 0.2 + 2.3 * (i / n)
      pts.push({ x: Math.cos(t) * rad + gauss() * 0.09, y: Math.sin(t) * rad + gauss() * 0.09, label: which })
    }
  }
  return pts
}
