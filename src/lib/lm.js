// 字符级 N-gram 语言模型（带回退 + 温度 + top-p 采样）
// 用于「GPT 如何生成文本」的现场训练与逐 token 生成演示

// 原创微型语料：一个关于机器人小智学做菜的循环小故事
export const ZH_CORPUS = `小智是一台爱学习的机器人。小智想学会做菜，于是每天观察厨房里的师傅。师傅切菜，小智记录切菜的顺序。师傅炒菜，小智记录火候和时间。第一天，小智做的菜太咸了。第二天，小智做的菜又太淡了。小智不放弃，继续观察，继续记录，继续尝试。第七天，小智终于做出了一盘好吃的番茄炒蛋。师傅尝了一口，笑着说，小智真棒。小智学会做菜之后，又想学写诗。小智每天读诗，记录优美的句子。慢慢地，小智也能写出温暖的句子了。学习就像炒菜，火候到了，味道自然就出来了。`

export const EN_CORPUS = `the little robot reads a book about the sea . the sea is blue and wide . the robot wants to see the sea . it walks along the road and meets a cat . the cat says the sea is far away . the robot says it wants to try . they walk together past the hill and the trees . at last they see the blue sea . the waves sing to the sand . the robot and the cat sit by the sea and read their book again .`

export class CharLM {
  constructor(text, maxOrder = 5) {
    this.text = text
    this.chars = [...new Set(text)]
    this.maxOrder = maxOrder
    // counts[k] 记录长度为 k 的上下文 -> {ch: count}
    this.counts = []
    for (let k = 0; k <= maxOrder; k++) this.counts.push({})
    const t = text
    for (let i = 0; i < t.length; i++) {
      for (let k = 0; k <= maxOrder; k++) {
        if (i - k < 0) break
        const ctx = t.slice(i - k, i)
        const ch = t[i]
        const m = this.counts[k]
        if (!m[ctx]) m[ctx] = {}
        m[ctx][ch] = (m[ctx][ch] || 0) + 1
      }
    }
  }

  // 返回给定上下文下每个候选字符的概率分布 [{ch, p}]
  dist(context) {
    let ctx = context.slice(-this.maxOrder)
    while (ctx.length > 0) {
      const m = this.counts[ctx.length][ctx]
      if (m) {
        const total = Object.values(m).reduce((s, c) => s + c, 0)
        return Object.entries(m)
          .map(([ch, c]) => ({ ch, p: c / total }))
          .sort((a, b) => b.p - a.p)
      }
      ctx = ctx.slice(1)
    }
    const uni = this.counts[0]['']
    const total = Object.values(uni).reduce((s, c) => s + c, 0)
    return Object.entries(uni).map(([ch, c]) => ({ ch, p: c / total })).sort((a, b) => b.p - a.p)
  }

  // 应用温度（重新调整分布的尖锐程度）
  applyTemp(dist, temperature) {
    if (temperature === 1) return dist
    const logits = dist.map((d) => ({ ch: d.ch, w: Math.pow(Math.max(1e-12, d.p), 1 / temperature) }))
    const sum = logits.reduce((s, d) => s + d.w, 0)
    return logits.map((d) => ({ ch: d.ch, p: d.w / sum }))
  }

  // 应用 top-p（核采样：只保留累积概率前 topP 的候选）
  applyTopP(dist, topP) {
    if (topP >= 0.999) return dist
    const out = []
    let cum = 0
    for (const d of dist) {
      out.push(d)
      cum += d.p
      if (cum >= topP) break
    }
    const sum = out.reduce((s, d) => s + d.p, 0)
    return out.map((d) => ({ ch: d.ch, p: d.p / sum }))
  }

  finalDist(context, temperature = 1, topP = 1) {
    return this.applyTopP(this.applyTemp(this.dist(context), temperature), topP)
  }

  sample(dist, rng = Math.random) {
    let r = rng()
    for (const d of dist) {
      r -= d.p
      if (r <= 0) return d.ch
    }
    return dist[dist.length - 1].ch
  }

  generate(prompt, n, temperature = 1, topP = 1, rng = Math.random) {
    let s = prompt
    let out = ''
    for (let i = 0; i < n; i++) {
      const d = this.finalDist(s, temperature, topP)
      const ch = this.sample(d, rng)
      out += ch
      s += ch
    }
    return out
  }
}
