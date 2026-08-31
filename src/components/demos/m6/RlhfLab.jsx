import React, { useState } from 'react'

// 6.4 RLHF 三阶段：SFT → 奖励模型（你来当标注员）→ 强化学习优化
const PAIRS = [
  {
    q: '用户：帮我写一句关于春天的诗',
    a: '春天来了，花开了，很好。',
    b: '东风解冻，细雨如酥——柳梢新绿偷学着飞鸟的笔迹。',
    why: 'B 更有画面感与韵律（当然「更好」依人而异——这正是需要人类偏好数据的原因！）',
    ba: 3.1, bb: 7.4,
  },
  {
    q: '用户：地球到月球有多远？',
    a: '约 38 万公里（平均），大概是绕地球 9 圈半的距离。',
    b: '非常远，反正坐火箭要好几天呢。',
    why: '事实性问题要准确 + 有信息量：A 给了数字还给了类比，B 含糊其辞。',
    ba: 8.2, bb: 3.3,
  },
  {
    q: '用户：我心情很差，怎么办？',
    a: '心情差是正常的。建议：1. 出门散步 2. 找朋友倾诉 3. 保证睡眠。如果持续低落请寻求专业帮助。',
    b: '建议你多喝热水。',
    why: '共情 + 具体可行动的建议 + 适度关怀，远好于敷衍。',
    ba: 8.8, bb: 2.2,
  },
]

export default function RlhfLab() {
  const [stage, setStage] = useState(0)
  const [pick, setPick] = useState({}) // pairIdx -> 'a' | 'b'
  const [kl, setKl] = useState(0.5)

  // 奖励模型的「学习」：你每选一次，对应回答的分数上升（模拟 RM 训练）
  const [scores, setScores] = useState(PAIRS.map((p) => [p.ba, p.bb]))
  function vote(i, which) {
    if (pick[i]) return
    setPick((pk) => ({ ...pk, [i]: which }))
    setScores((sc) => sc.map((s, j) => {
      if (j !== i) return s
      const winner = which === 'a' ? 0 : 1
      const loser = 1 - winner
      return [s[0] + (winner === 0 ? 0.5 : -0.2), s[1] + (winner === 1 ? 0.5 : -0.2)].map((v, k) => Math.max(1, k === winner ? v : v))
    }))
  }
  const voted = Object.keys(pick).length

  // KL 可视化：奖励轴上的位置 = 平衡点
  const rewardMax = 100
  const drift = Math.min(95, (1 - kl) * 95 + 5)
  const sftPos = 30

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          {['① SFT 指令微调', '② 奖励模型（你来当标注员）', '③ 强化学习优化'].map((s, i) => (
            <button key={i} className={stage === i ? 'on' : ''} onClick={() => setStage(i)}>{s}</button>
          ))}
        </div>
      </div>

      {stage === 0 && (
        <div>
          <div className="callout story">
            <div className="co-title">📖 第一步：教模型「听懂人话」</div>
            <p style={{ fontSize: 13.5 }}>
              预训练完的 GPT 只是「接龙机器」：你问「帮我写首诗」，它可能接龙出「这是我写过的另一首诗：…」（因为它见过网页里这种上下文）。
              **SFT（Supervised Fine-Tuning）**用几万条人工写的高质量「指令 → 回答」范例继续做下一词预测训练，让它学会**对话格式与助手指令**。
              这一步是用监督学习打样版，成本低、见效快。
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fdf0f0', border: '1px solid #f3caca', borderRadius: 11, padding: '12px 15px', fontSize: 13 }}>
              <b style={{ color: '#dc2626' }}>SFT 前（纯接龙）</b>
              <div style={{ marginTop: 6, lineHeight: 1.8, color: 'var(--text-2)' }}>用户：帮我写首诗<br />模型：我去年也写过一首，题目是「秋思」……（自顾自接龙）</div>
            </div>
            <div style={{ background: '#ecfaf3', border: '1px solid #bfe8d2', borderRadius: 11, padding: '12px 15px', fontSize: 13 }}>
              <b style={{ color: '#047857' }}>SFT 后（听指令）</b>
              <div style={{ marginTop: 6, lineHeight: 1.8, color: 'var(--text-2)' }}>用户：帮我写首诗<br />模型：好的，为你写了一首关于春天的短诗：……（直接满足请求）</div>
            </div>
          </div>
        </div>
      )}

      {stage === 1 && (
        <div>
          <div className="callout story">
            <div className="co-title">🗳 第二步：人类偏好数据 → 奖励模型</div>
            <p style={{ fontSize: 13.5 }}>
              「好回答」很难写成标准答案，但**比较两个回答哪个好**很容易！于是让模型对同一指令生成多个回答，人类标注员选出更好的。
              用几万~几十万对这样的偏好数据训练一个**奖励模型（Reward Model）**——它给任何回答打分，分数代表「人类有多喜欢」。
              <b>下面请你亲自当一次标注员</b>（3 题选 A 或 B），选完看奖励模型分数的变化：
            </p>
          </div>
          {PAIRS.map((p, i) => (
            <div key={i} style={{ background: '#fcfcfe', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 16px', marginBottom: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{p.q}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['a', 'b'].map((k, ki) => {
                  const chosen = pick[i] === k
                  const rejected = pick[i] && pick[i] !== k
                  return (
                    <button
                      key={k}
                      onClick={() => vote(i, k)}
                      disabled={!!pick[i]}
                      style={{
                        textAlign: 'left', fontSize: 13, lineHeight: 1.7, padding: '10px 13px', borderRadius: 10,
                        border: chosen ? '2px solid var(--green)' : rejected ? '2px solid var(--red)' : '1.5px solid var(--border)',
                        background: chosen ? 'var(--green-soft)' : rejected ? 'var(--red-soft)' : '#fff', cursor: pick[i] ? 'default' : 'pointer',
                        opacity: rejected ? 0.75 : 1,
                      }}
                    >
                      <b>{ki === 0 ? 'A' : 'B'}.</b> {ki === 0 ? p.a : p.b}
                      {pick[i] && (
                        <div style={{ marginTop: 6, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>
                          奖励模型评分：{scores[i][ki].toFixed(1)} → {chosen ? '↑ 奖励上调' : '↓ 惩罚下调'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {pick[i] && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 8 }}>💡 {p.why}</div>}
            </div>
          ))}
          {voted === PAIRS.length && (
            <div className="callout tip">
              <div className="co-title">🎉 你刚刚完成了 3 条偏好标注</div>
              <p style={{ fontSize: 13.5 }}>真实项目里这个动作要重复几万到几十万次（所以 AI 公司招了大量数据标注团队）。聚合起来的偏好信号训练出奖励模型——它就是第三阶段强化学习的「裁判」。</p>
            </div>
          )}
        </div>
      )}

      {stage === 2 && (
        <div>
          <div className="callout story">
            <div className="co-title">🎮 第三步：强化学习（PPO）——在奖励的引力与约束的缰绳之间</div>
            <p style={{ fontSize: 13.5 }}>
              现在让主模型（策略）生成回答，奖励模型打分，用强化学习（经典用 PPO）不断调高得分。但有个陷阱：模型可能找到「骗分」的怪回答（reward hacking，比如把某些套话说得天花乱坠）。
              解法是加一条 **KL 散度惩罚**：每走一步都要付「偏离原始 SFT 模型多远」的税——像给狗拴上缰绳。拖动滑块感受这个平衡：
            </p>
          </div>
          <div className="ctrl-row">
            <div className="ctrl"><label>KL 惩罚强度</label><input type="range" min="0.05" max="0.95" step="0.05" value={kl} onChange={(e) => setKl(+e.target.value)} /><span className="val">{kl.toFixed(2)}</span></div>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{kl < 0.3 ? '⚠️ 缰绳太松：奖励分很高，但回答风格开始跑偏、套话连篇（reward hacking）' : kl > 0.7 ? '⚠️ 缰绳太紧：模型几乎不敢动，和 SFT 原版没区别，对齐白做' : '✅ 平衡点：显著更符合人类偏好，又不失去语言能力'}</span>
          </div>
          <div className="demo-canvas-box">
            <svg viewBox="0 0 660 200" style={{ display: 'block', width: '100%' }}>
              <line x1={40} y1={150} x2={620} y2={150} stroke="#d9dde9" />
              <text x={40} y={170} fontSize={11} fill="#8a92a6">← 保守（SFT 原样）</text>
              <text x={620} y={170} fontSize={11} fill="#8a92a6" textAnchor="end">放飞（奖励最高）→</text>
              {/* 奖励曲线 */}
              <path d="M40,140 Q 400,60 620,45" fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="5 4" />
              <text x={470} y={38} fontSize={11.5} fill="#10b981">奖励模型给分（越高越被喜欢）</text>
              {/* SFT 锚点 */}
              <circle cx={40 + 5.8 * sftPos} cy={132} r={7} fill="#8a92a6" />
              <text x={40 + 5.8 * sftPos + 12} y={128} fontSize={11.5} fill="#64748b">SFT 参考点</text>
              {/* 当前策略位置 */}
              <circle cx={40 + 5.8 * (sftPos + (drift - 30)) * (drift > 30 ? 1 : 1)} cy={Math.max(55, 132 - (drift - 30) * 0.55)} r={9} fill="#4f6df5" stroke="#fff" strokeWidth={2} />
              <text x={40 + 5.8 * (sftPos + (drift - 30)) + 12} y={Math.max(58, 132 - (drift - 30) * 0.55) - 8} fontSize={11.5} fill="#4f6df5" fontWeight={700}>RLHF 后的策略</text>
              {/* 缰绳 */}
              <line x1={40 + 5.8 * sftPos} y1={132} x2={40 + 5.8 * (sftPos + (drift - 30))} y2={Math.max(55, 132 - (drift - 30) * 0.55)} stroke="#dc2626" strokeWidth={1.6} strokeDasharray="3 3" />
              <text x={230} y={185} fontSize={11} fill="#dc2626">-- 缰绳 = KL 惩罚（偏离太远要交税）</text>
            </svg>
          </div>
          <div className="callout tip" style={{ marginTop: 10 }}>
            <div className="co-title">📦 2023 年后的简化：DPO</div>
            <p style={{ fontSize: 13.5 }}>
              PPO 全家桶（奖励模型 + 强化学习 + 4 份模型副本）又贵又难调。**DPO（Direct Preference Optimization）**用数学推导证明：可以直接从偏好数据优化策略，**跳过奖励模型和 RL 循环**，稳定性大增——如今开源社区微调大多用 DPO 及其变体。工业界则两条路线并存（RLHF 系还有 GRPO 等新秀，尤其用于推理能力训练）。
            </p>
          </div>
        </div>
      )}
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        三步合起来 = ChatGPT 的炼成记：**SFT 教格式 → 人类偏好教「什么是好」→ RL 把「好」内化成行为**。同样的流程也用于训练安全边界（拒答有害请求）与如今的推理能力训练。
      </div>
    </div>
  )
}
