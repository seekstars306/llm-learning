import React, { useMemo, useRef, useState } from 'react'
import { CharLM, ZH_CORPUS, EN_CORPUS } from '../../../lib/lm.js'

// 5.6 GPT 生成原理：现场训练字符级小模型 + 逐 token 生成 + 温度/top-p
export default function SamplingLab() {
  const [lang, setLang] = useState('zh')
  const [T, setT] = useState(0.9)
  const [topP, setTopP] = useState(0.9)
  const [prompt, setPrompt] = useState('小智')
  const [genText, setGenText] = useState('')
  const [dist, setDist] = useState(null) // 当前步的候选分布
  const [playing, setPlaying] = useState(false)
  const [trained, setTrained] = useState(false)
  const [trainTag, setTrainTag] = useState('')
  const lmRef = useRef(null)
  const stateRef = useRef('')

  const corpus = lang === 'zh' ? ZH_CORPUS : EN_CORPUS

  function trainNow(l = lang) {
    const c = l === 'zh' ? ZH_CORPUS : EN_CORPUS
    lmRef.current = new CharLM(c, 5)
    setTrained(true)
    setTrainTag(`已在 ${c.length} 字符的语料上训练完毕（统计 1~5 阶上下文）`)
    setGenText('')
    setDist(null)
    stateRef.current = l === 'zh' ? '小智' : 'the '
    setPrompt(stateRef.current)
  }
  React.useEffect(() => { trainNow('zh') }, [])

  function stepGenerate() {
    const lm = lmRef.current
    if (!lm) return
    const d = lm.finalDist(stateRef.current, T, topP)
    setDist(d.slice(0, 8))
    // 采样
    let r = Math.random()
    let ch = d[d.length - 1].ch
    for (const cand of d) { r -= cand.p; if (r <= 0) { ch = cand.ch; break } }
    stateRef.current += ch
    setGenText(stateRef.current.slice(prompt.length))
  }

  React.useEffect(() => {
    if (!playing) return
    const id = setInterval(stepGenerate, 380)
    return () => clearInterval(id)
  }, [playing, T, topP, trained])

  const maxP = dist ? Math.max(...dist.map((d) => d.p)) : 1

  return (
    <div>
      <div className="ctrl-row">
        <div className="ctrl"><label>语料</label>
          <div className="seg">
            <button className={lang === 'zh' ? 'on' : ''} onClick={() => { setLang('zh'); trainNow('zh') }}>中文小故事</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => { setLang('en'); trainNow('en') }}>英文短文</button>
          </div>
        </div>
        <div className="ctrl"><label>开头 prompt</label>
          <input style={{ width: 130, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }} value={prompt} onChange={(e) => { setPrompt(e.target.value); stateRef.current = e.target.value; setGenText(''); setDist(null) }} />
        </div>
        <button className="demo-btn" onClick={() => trainNow(lang)}>🎓 重新训练</button>
      </div>
      <div className="ctrl-row">
        <div className="ctrl"><label>🌡 温度 temperature</label><input type="range" min="0.2" max="2" step="0.05" value={T} onChange={(e) => setT(+e.target.value)} /><span className="val">{T.toFixed(2)}</span></div>
        <div className="ctrl"><label>✂️ top-p</label><input type="range" min="0.1" max="1" step="0.05" value={topP} onChange={(e) => setTopP(+e.target.value)} /><span className="val">{topP.toFixed(2)}</span></div>
        <button className="demo-btn primary" onClick={() => setPlaying(!playing)} disabled={!trained}>{playing ? '⏸ 暂停' : '▶ 自动生成'}</button>
        <button className="demo-btn" onClick={stepGenerate} disabled={!trained}>生成下一个字</button>
        <button className="demo-btn" onClick={() => { setGenText(''); stateRef.current = prompt; setDist(null) }}>🔄 重置</button>
      </div>
      {trainTag && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>✅ {trainTag} —— 和 GPT 一样，训练目标也是「预测下一个词」，只是模型小了几亿倍。</div>}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 6 }}>模型续写：</div>
          <div style={{ background: '#fcfcfe', border: '1px solid var(--border)', borderRadius: 11, padding: '14px 16px', minHeight: 120, fontSize: 15, lineHeight: 1.9 }}>
            <span style={{ color: 'var(--text-3)' }}>{prompt}</span>
            <span style={{ color: '#b45309', fontWeight: 600 }}>{genText}</span>
            <span style={{ display: 'inline-block', width: 8, height: 17, background: '#d97706', verticalAlign: '-3px', animation: 'blink 1s infinite' }} />
          </div>
          {dist && (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '12px 0 6px' }}>当前候选分布（经过温度 {T.toFixed(2)} + top-p {topP.toFixed(2)}）：每根柱子 = 一个候选字的概率</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 110 }}>
                {dist.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: i === 0 ? '#b45309' : 'var(--text-3)' }}>{(d.p * 100).toFixed(0)}</div>
                    <div style={{ width: 34, height: Math.max(4, (d.p / maxP) * 80), background: i === 0 ? 'linear-gradient(180deg,#f59e0b,#d97706)' : '#b9c1d9', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ fontSize: 13, marginTop: 3 }}>{d.ch === ' ' ? '␣' : d.ch}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="callout tip" style={{ flex: '0 0 270px', maxWidth: '100%', fontSize: 13 }}>
          <div className="co-title">🎛 两个旋钮怎么玩</div>
          <p style={{ fontSize: 13 }}>
            <b>温度</b>：调到 0.2 → 顽固复读（总选最像的），调到 1.8 → 语无伦次。0.7～1.0 是常用区。<br /><br />
            <b>top-p</b>：只保留累计概率前 p 的候选。0.3 → 只在最有把握的几个里挑；1.0 → 不截断。<br /><br />
            观察柱状图：每次「生成下一个字」前，模型都先算出这个分布——<b>GPT 的「写作」就是把这个循环跑几千次</b>。把字符换成几万词表里的 token、把统计模型换成 1750 亿参数的 Transformer，就是真正的 GPT。
          </p>
        </div>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        自回归生成 = 「预测下一个 → 拼回输入 → 再预测下一个」的循环。你看到的柱状图（候选分布）、温度（分布的尖锐程度）、top-p（候选截断）三大件，与 ChatGPT 界面上的参数完全同源。
      </div>
    </div>
  )
}
