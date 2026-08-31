import React, { useMemo, useState } from 'react'
import { mulberry32 } from '../../../lib/plot.jsx'

// 1.6 数据划分：拖动比例，理解训练/验证/测试三份的角色
export default function DataSplitLab() {
  const [trainPct, setTrainPct] = useState(70)
  const [valPct, setValPct] = useState(15)
  const [seed, setSeed] = useState(1)
  const testPct = 100 - trainPct - valPct

  const blocks = useMemo(() => {
    const rng = mulberry32(seed)
    return Array.from({ length: 40 }, () => rng())
  }, [seed])

  const nTrain = Math.round((trainPct / 100) * 40)
  const nVal = Math.round((valPct / 100) * 40)

  const cats = [
    { name: '训练集', color: '#4f6df5', desc: '模型的「课本」：用来学习参数' },
    { name: '验证集', color: '#d97706', desc: '「模拟考」：用来调超参数、防过拟合' },
    { name: '测试集', color: '#10b981', desc: '「高考」：只考一次，代表真实水平' },
  ]

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>训练集</label><input type="range" min="10" max="80" step="5" value={trainPct} onChange={(e) => setTrainPct(+e.target.value)} /><span className="val">{trainPct}%</span></div>
        <div className="ctrl"><label>验证集</label><input type="range" min="5" max="30" step="5" value={valPct} onChange={(e) => setValPct(+e.target.value)} /><span className="val">{valPct}%</span></div>
        <button className="demo-btn" onClick={() => setSeed(seed + 1)}>🔀 重新洗牌</button>
      </div>
      {testPct < 10 && <div className="callout warn" style={{ marginTop: 4 }}>⚠️ 测试集至少留 10%，否则「高考」太没代表性啦！</div>}
      <div style={{ display: 'flex', gap: 4, margin: '16px 0 6px', height: 46, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ width: `${trainPct}%`, background: cats[0].color, transition: 'width 0.2s' }} />
        <div style={{ width: `${valPct}%`, background: cats[1].color, transition: 'width 0.2s' }} />
        <div style={{ width: `${testPct}%`, background: cats[2].color, transition: 'width 0.2s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(20, 1fr)`, gap: 4, marginTop: 14 }}>
        {blocks.map((_, i) => {
          const c = i < nTrain ? cats[0] : i < nTrain + nVal ? cats[1] : cats[2]
          return <div key={i} title={`${c.name} · 第 ${i + 1} 份`} style={{ height: 22, borderRadius: 4, background: c.color, opacity: 0.85, transition: 'background 0.2s' }} />
        })}
      </div>
      <div className="legend-row" style={{ marginTop: 14 }}>
        {cats.map((c) => (
          <span key={c.name}><span className="legend-dot" style={{ background: c.color }} /><b>{c.name}</b>（{c.name === '训练集' ? trainPct : c.name === '验证集' ? valPct : testPct}%）—— {c.desc}</span>
        ))}
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        关键纪律：<b>测试集在训练和调参的全过程中绝对不能碰</b>。如果你偷看了测试集并据此改模型，等于「提前看了考卷」，成绩就再也不能代表真实水平了 —— 行业里管这叫数据泄露（data leakage）。
      </div>
    </div>
  )
}
