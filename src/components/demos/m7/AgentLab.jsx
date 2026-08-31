import React, { useState } from 'react'

const SCENARIOS = [
  {
    name: '🌦 查天气决定带伞',
    steps: [
      { kind: 'thought', text: '用户问北京明天是否下雨、要不要带伞。我需要实时天气数据——调用天气工具。' },
      { kind: 'action', text: 'weather_api(city="北京", date="明天")' },
      { kind: 'obs', text: '小雨，降水概率 80%，气温 15~20°C，北风 3 级' },
      { kind: 'thought', text: '拿到数据：降水概率 80%，明确建议带伞。信息已足够，无需再调用其他工具。' },
      { kind: 'answer', text: '明天北京有小雨（降水概率 80%），气温 15~20°C。建议带伞，早晚微凉可加一件外套。' },
    ],
  },
  {
    name: '🧮 算 √(7² + 23²)',
    steps: [
      { kind: 'thought', text: '需要计算 7² + 23² 再开方。心算易错——大模型算术并不可靠，调用计算器工具更稳。' },
      { kind: 'action', text: 'calculator(expr="sqrt(7**2 + 23**2)")' },
      { kind: 'obs', text: '24.0416…' },
      { kind: 'thought', text: '得到精确值约 24.04。可以整理作答。' },
      { kind: 'answer', text: '√(7² + 23²) = √578 ≈ 24.04。（我用计算器工具保证精度——纯靠语言模型心算很容易翻车）' },
    ],
  },
  {
    name: '📦 查订单并取消',
    steps: [
      { kind: 'thought', text: '用户想取消订单，但没说订单号。先查他名下最近的订单。' },
      { kind: 'action', text: 'orders_api(user="当前用户", status="待发货")' },
      { kind: 'obs', text: '[{"id":"A1003","item":"机械键盘","price":399}]' },
      { kind: 'thought', text: '查到一个待发货订单 A1003（机械键盘 ¥399）。取消是不可逆操作，应该先和用户确认而不是直接调用取消接口。' },
      { kind: 'answer', text: '找到您的待发货订单 A1003（机械键盘 ¥399）。请确认要取消它吗？确认后我立即办理。' },
    ],
  },
]

const KIND_META = {
  thought: { label: '💭 思考 Thought', color: '#4f6df5', bg: '#eef1ff' },
  action: { label: '🔧 行动 Action', color: '#d97706', bg: '#fdf3e3' },
  obs: { label: '👁 观察 Observation', color: '#059669', bg: '#e7f8f1' },
  answer: { label: '✅ 最终回答', color: '#7c3aed', bg: '#f5f0ff' },
}

export default function AgentLab() {
  const [si, setSi] = useState(0)
  const [idx, setIdx] = useState(0)
  const sc = SCENARIOS[si]

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>任务</label>
          <div className="seg">
            {SCENARIOS.map((s, i) => <button key={i} className={si === i ? 'on' : ''} onClick={() => { setSi(i); setIdx(0) }}>{s.name}</button>)}
          </div>
        </div>
        <button className="demo-btn primary" onClick={() => setIdx(Math.min(sc.steps.length, idx + 1))} disabled={idx >= sc.steps.length}>▶ 执行下一步</button>
        <button className="demo-btn" onClick={() => setIdx(0)}>🔄 重置</button>
        <span className="stat-chip">ReAct 循环 <b>{idx}/{sc.steps.length}</b></span>
      </div>

      <div style={{ minHeight: 60, marginBottom: 10 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
          <b>用户：</b>{sc.name.replace(/^[^\s]+\s/, '')}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {sc.steps.slice(0, idx).map((s, i) => {
          const m = KIND_META[s.kind]
          return (
            <div key={i} style={{ borderLeft: `4px solid ${m.color}`, background: m.bg, borderRadius: '6px 11px 11px 6px', padding: '9px 14px', fontSize: 13.5 }}>
              <div style={{ fontWeight: 800, color: m.color, fontSize: 12, marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontFamily: s.kind === 'action' ? 'var(--mono)' : 'inherit', color: 'var(--text-2)' }}>{s.text}</div>
            </div>
          )
        })}
        {idx < sc.steps.length && (
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '4px 2px' }}>
            ⏳ 待执行：{KIND_META[sc.steps[idx].kind].label} —— 点「执行下一步」
          </div>
        )}
      </div>

      <div className="callout tip" style={{ marginTop: 14 }}>
        <div className="co-title">🔍 注意第三个场景的细节</div>
        <p style={{ fontSize: 13.5 }}>
          好的 Agent 不只是「会调工具」：场景三里模型发现<b>取消订单不可逆</b>，主动停下来向用户确认——这是安全与交互设计的一部分。
          另外注意场景二的自白：<b>大模型算术不可靠，所以用工具补短板</b>——「知道自己不行并调用外部能力」，正是 Agent 范式的精髓。
        </p>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        Agent = 大模型当「大脑」+ 工具当「手脚」，循环执行 ReAct（Reason 思考 → Act 调工具 → Observe 看结果 → 再 Reason）直到完成任务。
        Function Calling 让模型输出结构化的调用请求，由外部程序执行后喂回结果。查天气、订机票、操作数据库、自动写报告——企业级 Agent 应用的骨架都是这个循环。
      </div>
    </div>
  )
}
