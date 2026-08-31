// 简化版 BPE（Byte Pair Encoding）分词器，用于分词演示
// 语料里 ASCII 词按空格/标点切开后做 BPE 合并；中文字符直接单独成 token

const isCJK = (ch) => /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)

function splitWords(text) {
  // 返回 ['我', 'love', '机器', 'learning', ...]：CJK 按字符切，连续 ASCII 连成一词
  const units = []
  let buf = ''
  const flush = () => { if (buf) { units.push(buf); buf = '' } }
  for (const ch of text) {
    if (isCJK(ch)) { flush(); units.push(ch) } else if (/\s/.test(ch)) { flush(); units.push(' ') } else { buf += ch }
  }
  flush()
  return units
}

function wordToSymbols(w) {
  // 单词内部拆成字符序列，末尾加 ▁ 标记词尾（模拟 GPT 风格的空格归属）
  const chars = [...w]
  chars.push('▁')
  return chars
}

export class MiniBPE {
  constructor(corpus, numMerges = 60) {
    this.merges = []
    // 统计词频
    const freq = {}
    for (const w of splitWords(corpus)) {
      if (w === ' ' || !w) continue
      freq[w] = (freq[w] || 0) + 1
    }
    // 每个 word 是符号数组
    let words = Object.entries(freq).map(([w, f]) => ({ sym: wordToSymbols(w), f }))
    for (let step = 0; step < numMerges; step++) {
      // 统计相邻符号对
      const pairs = {}
      for (const { sym, f } of words) {
        for (let i = 0; i < sym.length - 1; i++) {
          const p = sym[i] + sym[i + 1]
          pairs[p] = (pairs[p] || 0) + f
        }
      }
      const entries = Object.entries(pairs)
      if (!entries.length) break
      entries.sort((a, b) => b[1] - a[1])
      if (entries[0][1] < 2) break
      const best = entries[0][0]
      this.merges.push(best)
      words = words.map(({ sym, f }) => {
        const ns = []
        for (let i = 0; i < sym.length; i++) {
          if (i < sym.length - 1 && sym[i] + sym[i + 1] === best) { ns.push(best); i++ } else ns.push(sym[i])
        }
        return { sym: ns, f }
      })
    }
  }

  // encode(text, maxMerges)：允许限定「只用前 N 次合并」，观察词表从小到大的变化
  encode(text, maxMerges = Infinity) {
    const merges = this.merges.slice(0, maxMerges)
    return splitWords(text).map((w) => {
      if (w === ' ') return { sym: [' '], parts: [' '] }
      let sym = wordToSymbols(w)
      for (const m of merges) {
        const ns = []
        for (let i = 0; i < sym.length; i++) {
          if (i < sym.length - 1 && sym[i] + sym[i + 1] === m) { ns.push(m); i++ } else ns.push(sym[i])
        }
        sym = ns
      }
      return { sym, parts: sym }
    })
  }
}
