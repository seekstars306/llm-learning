import React, { useMemo, useState } from 'react'

// 精心手工构造的 2D 词向量：语义聚簇 + 类比结构（king-man+woman = queen 等）
const WORDS = {
  国王: [3.2, 4.2], 王后: [3.0, 4.9], 男人: [1.2, 1.6], 女人: [1.0, 2.3],
  爸爸: [1.9, 1.1], 妈妈: [1.7, 1.8],
  猫: [-2.5, -1.2], 小猫: [-2.6, -0.7], 狗: [-2.1, -1.8], 小狗: [-2.2, -1.3],
  苹果: [-1.0, -3.1], 香蕉: [-0.5, -3.3], 橙子: [-1.15, -3.5], 葡萄: [-0.3, -2.9],
  跑步: [2.8, -1.6], 散步: [2.35, -2.1], 跳跃: [3.15, -2.2], 游泳: [2.5, -1.15],
  手机: [-3.4, 2.2], 电脑: [-3.0, 2.75], 键盘: [-3.55, 2.9], 耳机: [-3.15, 1.85],
  北京: [0.6, 4.0], 上海: [0.95, 3.6], 广州: [0.45, 3.35],
  老师: [-1.5, 3.8], 学生: [-1.7, 2.6], 医院: [-0.8, 4.35], 药: [-0.95, 3.95],
}

const ANALOGIES = [
  { a: '国王', minus: '男人', b: '女人', expect: '王后', note: '性别方向的向量平移' },
  { a: '猫', minus: '狗', b: '小狗', expect: '小猫', note: '「幼崽化」方向' },
  { a: '爸爸', minus: '妈妈', b: '女人', expect: '男人', note: '同一性别方向' },
]

const COLORS = ['#4f6df5', '#db2777', '#10b981', '#d97706', '#7c3aed', '#0d9488']
const clusters = {
  人: ['国王', '王后', '男人', '女人', '爸爸', '妈妈', '老师', '学生'],
  动物: ['猫', '小猫', '狗', '小狗'],
  水果: ['苹果', '香蕉', '橙子', '葡萄'],
  动作: ['跑步', '散步', '跳跃', '游泳'],
  科技: ['手机', '电脑', '键盘', '耳机'],
  地点: ['北京', '上海', '广州', '医院', '药'],
}
const wordColor = {}
Object.values(clusters).forEach((arr, i) => arr.forEach((w) => (wordColor[w] = COLORS[i % COLORS.length])))

// 4.2 词向量：语义的几何世界
export default function EmbeddingLab() {
  const [selected, setSelected] = useState('国王')
  const [anIdx, setAnIdx] = useState(0)
  const [showArith, setShowArith] = useState(true)
  const an = ANALOGIES[anIdx]

  const result = useMemo(() => {
    const [ax, ay] = WORDS[an.a]; const [mx, my] = WORDS[an.minus]; const [bx, by] = WORDS[an.b]
    const rx = ax - mx + bx; const ry = ay - my + by
    let best = null; let bd = Infinity
    Object.entries(WORDS).forEach(([w, [x, y]]) => {
      const d = (x - rx) ** 2 + (y - ry) ** 2
      if (d < bd) { bd = d; best = w }
    })
    return { rx, ry, best }
  }, [an])

  function cosSim(v1, v2) {
    const dot = v1[0] * v2[0] + v1[1] * v2[1]
    const n1 = Math.hypot(...v1); const n2 = Math.hypot(...v2)
    return dot / (n1 * n2)
  }

  const neighbors = useMemo(() => {
    const v = WORDS[selected]
    return Object.entries(WORDS)
      .filter(([w]) => w !== selected)
      .map(([w, v2]) => ({ w, sim: cosSim(v, v2) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 6)
  }, [selected])

  const W = 660; const H = 430
  const px = (x) => W / 2 + x * 74
  const py = (y) => H / 2 - y * 74

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>类比运算</label>
          <div className="seg">
            {ANALOGIES.map((a, i) => (
              <button key={i} className={anIdx === i ? 'on' : ''} onClick={() => setAnIdx(i)}>
                {a.a} − {a.minus} + {a.b}
              </button>
            ))}
          </div>
        </div>
        <button className="demo-btn" onClick={() => setShowArith(!showArith)}>{showArith ? '显示运算路径' : '隐藏运算路径'}</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div className="demo-canvas-box" style={{ flex: '1 1 460px' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {/* 网格 */}
            {[...Array(11)].map((_, i) => (
              <line key={'v' + i} x1={i * 66} y1={0} x2={i * 66} y2={H} stroke="#eef0f7" />
            ))}
            {[...Array(7)].map((_, i) => (
              <line key={'h' + i} x1={0} y1={i * 72} x2={W} y2={i * 72} stroke="#eef0f7" />
            ))}
            {/* 运算路径 */}
            {showArith && (
              <>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
                  </marker>
                </defs>
                {/* a → a-m (红色虚线，反向) */}
                <line x1={px(WORDS[an.a][0])} y1={py(WORDS[an.a][1])} x2={px(WORDS[an.a][0] - WORDS[an.minus][0])} y2={py(WORDS[an.a][1] - WORDS[an.minus][1])} stroke="#dc2626" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#arrow)" opacity={0.75} />
                {/* + b */}
                <line x1={px(WORDS[an.a][0] - WORDS[an.minus][0])} y1={py(WORDS[an.a][1] - WORDS[an.minus][1])} x2={px(result.rx)} y2={py(result.ry)} stroke="#059669" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#arrow)" opacity={0.75} />
                <circle cx={px(result.rx)} cy={py(result.ry)} r={13} fill="none" stroke="#d97706" strokeWidth={2.5} strokeDasharray="4 3" />
                <text x={px(result.rx) + 17} y={py(result.ry) + 4} fontSize={13} fill="#d97706" fontWeight={700}>结果 ≈ {result.best}</text>
              </>
            )}
            {/* 词 */}
            {Object.entries(WORDS).map(([w, [x, y]]) => {
              const isSel = w === selected
              const isExpect = w === result.best && showArith
              return (
                <g key={w} onClick={() => setSelected(w)} style={{ cursor: 'pointer' }}>
                  <circle cx={px(x)} cy={py(y)} r={isExpect ? 9 : 5.5} fill={isExpect ? '#d97706' : wordColor[w] || '#8a92a6'} opacity={0.9} />
                  <text x={px(x)} y={py(y) - 11} fontSize={isSel || isExpect ? 14 : 12} fontWeight={isSel || isExpect ? 700 : 400} fill={isSel ? '#1c2130' : '#4a5268'} textAnchor="middle" style={{ fontFamily: 'inherit' }}>{w}</text>
                </g>
              )
            })}
          </svg>
        </div>
        <div style={{ flex: '0 0 240px', maxWidth: '100%' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>点击图中的词查看它的「邻居」：</div>
          {neighbors.map(({ w, sim }) => (
            <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '5px 0' }}>
              <span style={{ width: 44, fontSize: 13 }}>{w}</span>
              <div style={{ flex: 1, height: 9, background: 'var(--bg-soft)', borderRadius: 5 }}>
                <div style={{ width: `${(sim + 1) * 50}%`, height: '100%', background: wordColor[w] || '#8a92a6', borderRadius: 5 }} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, width: 42, textAlign: 'right', color: 'var(--text-3)' }}>{sim.toFixed(2)}</span>
            </div>
          ))}
          <div className="callout tip" style={{ marginTop: 14, fontSize: 12.5 }}>
            <div className="co-title">🧭 图例</div>
            <p style={{ fontSize: 12.5 }}>颜色 = 语义类别：蓝紫是人、绿是动物、粉是水果……<b>意思相近的词自然挤在一起</b>——这就是 embedding 的魔力：语义变成了几何。真实的词向量是几百维，这里的 2D 是它的「影子」。</p>
          </div>
        </div>
      </div>
      <div className="callout story" style={{ marginTop: 10 }}>
        <div className="co-title">🔬 向量运算实验：{an.a} − {an.minus} + {an.b} ≈ ？</div>
        <p>把「{an.a}」沿「{an.minus}」的反方向平移，再加上「{an.b}」的位移——箭头落点最近的词是 <b>{result.best}</b>（标准答案：{an.expect}）。{an.note}。 famous 的 king − man + woman ≈ queen 说的就是这件事：<b>「性别」「时态」「大小」这些抽象关系，在向量空间里是稳定的一个方向</b>。大模型对语义的操控，全建立在这片几何世界上。</p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        词向量（embedding）= 给每个词一个「坐标」。怎么学出来？经典方法是 word2vec：「用上下文猜词、用词猜上下文」，猜多了，坐标自动长成上图的样子。而在 GPT 里，embedding 只是第一层——训练完整个「预测下一个词」任务后，每个词的坐标会携带远比词义丰富的信息。
      </div>
    </div>
  )
}
