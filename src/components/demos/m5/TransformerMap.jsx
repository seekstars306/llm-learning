import React, { useState } from 'react'

// 5.5 Transformer 架构可点击导览图
const ARCH = {
  gpt: {
    label: 'GPT（Decoder-only，当今大模型主流）',
    color: '#4f6df5',
    blocks: [
      { id: 'text', name: '📝 输入文本', desc: '「今天天气」等原始文字。GPT 生成时，输入 = 系统提示 + 对话历史 + 已生成的部分。', layer: 'io' },
      { id: 'tok', name: '✂️ 分词器 Tokenizer', desc: '把文本切成 token 并编号（模块 4.1）。每个 token 一个整数 ID。', layer: 'io' },
      { id: 'emb', name: '🧭 Token Embedding + 位置编码', desc: '编号查表变成向量，并注入位置信息（注意力不认顺序，位置必须显式补充；现代模型多用 RoPE 旋转位置编码）。此后整个网络只对「向量序列」做加工。', layer: 'io' },
      { id: 'attn', name: '👁️ 掩码多头自注意力', desc: 'Transformer 的心脏。每个 token 用 Q·K 打分、softmax 得权重、加权吸收所有 V——但带因果掩码：每个位置只能看它左边（包括自己），不能偷看未来。多个「头」并行，各自捕捉不同关系（有的盯语法、有的盯指代）。', layer: 'core' },
      { id: 'addnorm', name: '➕ 残差连接 + LayerNorm', desc: '子层输出 = f(x) + x 再归一化（3.3/3.5 课的老朋友）。让上百层也能稳定训练。', layer: 'core' },
      { id: 'ffn', name: '🧮 前馈网络 FFN', desc: '对每个位置独立地做「升维→激活(GELU)→降维」的两层 MLP，约占参数的 2/3，被认为承担「知识存储」。', layer: 'core' },
      { id: 'stack', name: '🔁 以上 × N 层', desc: '「注意力 + FFN」为一层，堆 N 层（GPT-3 是 96 层）。层层抽象：低层抓语法，高层抓语义与推理。', layer: 'core' },
      { id: 'out', name: '🎯 输出层 Linear + Softmax', desc: '最后一个位置的向量乘一个大矩阵（词表 × 隐藏维），softmax 变成整个词表上的概率分布——「下一个 token 的预测」。', layer: 'io' },
      { id: 'gen', name: '🎡 采样生成', desc: '按温度/top-p 从分布里抽出一个 token，拼回输入，再走一遍模型——自回归循环（下节课实操）。', layer: 'io' },
    ],
  },
  bert: {
    label: 'BERT（Encoder-only，理解型）',
    color: '#10b981',
    blocks: [
      { id: 'text', name: '📝 输入文本', desc: '完整句子（不是逐词生成）。', layer: 'io' },
      { id: 'tok', name: '✂️ 分词器', desc: 'WordPiece 子词切分（和 BPE 思路相似）。', layer: 'io' },
      { id: 'emb', name: '🧭 Embedding + 位置编码', desc: '向量 + 位置 + 「段落/句对」编码。', layer: 'io' },
      { id: 'attn', name: '👁️ 双向多头自注意力', desc: '与 GPT 的核心差异：**没有因果掩码**——每个词同时看左右全文，适合「理解」任务。', layer: 'core' },
      { id: 'ffn', name: '🧮 前馈网络 FFN + 残差/LayerNorm', desc: '与 GPT 相同的配方。', layer: 'core' },
      { id: 'stack', name: '🔁 × N 层（BERT-base 12 层）', desc: '双向理解层层加深。', layer: 'core' },
      { id: 'out', name: '🎯 任务头', desc: '预训练目标：完形填空（遮住 15% 的词猜是什么）+ 下一句判断。微调后用于分类、问答、检索排序等理解任务。', layer: 'io' },
    ],
  },
  orig: {
    label: '原始 Transformer（2017：Encoder-Decoder，为翻译而生）',
    color: '#d97706',
    blocks: [
      { id: 'src', name: '🇬🇧 源句（英文）', desc: '待翻译文本。', layer: 'io' },
      { id: 'enc', name: '📦 编码器 ×6', desc: '双向自注意力 + FFN，把源句编码成表示序列（4.3 课的角色）。', layer: 'core' },
      { id: 'dec', name: '📤 解码器 ×6', desc: '两种注意力并用：带掩码的自注意力（看已生成的译文）+ 交叉注意力（回头看编码器的源句表示——4.3 演示里那些连线就是它）。', layer: 'core' },
      { id: 'out', name: '🎯 输出 + 逐词生成', desc: '逐词生成译文，训练目标即「下一个词预测」——GPT 的自回归思想源自这里。', layer: 'io' },
    ],
  },
}

export default function TransformerMap() {
  const [mode, setMode] = useState('gpt')
  const [sel, setSel] = useState('attn')
  const arch = ARCH[mode]
  const selBlock = arch.blocks.find((b) => b.id === sel) || arch.blocks[0]
  const core = arch.blocks.filter((b) => b.layer === 'core')
  const io = arch.blocks.filter((b) => b.layer === 'io')

  const Chip = ({ b }) => (
    <button
      onClick={() => setSel(b.id)}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: '9px 13px', borderRadius: 10, fontSize: 13,
        border: sel === b.id ? `2px solid ${arch.color}` : '1px solid var(--border)',
        background: sel === b.id ? arch.color + '14' : '#fff', fontWeight: sel === b.id ? 700 : 400,
        color: sel === b.id ? arch.color : 'var(--text-2)', transition: 'all 0.12s', marginBottom: 6,
      }}
    >
      {b.name}
    </button>
  )

  return (
    <div>
      <div className="ctrl-row">
        <div className="seg">
          {Object.entries(ARCH).map(([k, a]) => (
            <button key={k} className={mode === k ? 'on' : ''} onClick={() => { setMode(k); setSel(a.blocks.find((b) => b.layer === 'core')?.id || a.blocks[0].id) }}>
              {k === 'gpt' ? 'GPT（主流）' : k === 'bert' ? 'BERT' : '原始 Transformer'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: arch.color, fontWeight: 700 }}>{arch.label}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 300px', maxWidth: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>数据流 ↓（点击任意部件看讲解）</div>
          {io[0] && <Chip b={io[0]} />}
          <div style={{ textAlign: 'center', color: '#c3c9da', fontSize: 15 }}>↓</div>
          {core.map((b, i) => (
            <React.Fragment key={b.id}>
              <Chip b={b} />
              {i < core.length - 1 && <div style={{ textAlign: 'center', color: '#c3c9da', fontSize: 13 }}>↓ ↺</div>}
            </React.Fragment>
          ))}
          {io[0] && <div style={{ textAlign: 'center', color: '#c3c9da', fontSize: 15 }}>↓</div>}
          {io.slice(1).map((b) => <React.Fragment key={b.id}><Chip b={b} /><div style={{ textAlign: 'center', color: '#c3c9da', fontSize: 15 }}>↓</div></React.Fragment>)}
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ background: '#fcfcfe', border: `1.5px solid ${arch.color}`, borderRadius: 13, padding: '18px 20px' }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: arch.color, marginBottom: 8 }}>{selBlock.name}</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: 'var(--text-2)' }}>{selBlock.desc}</p>
          </div>
          <div className="callout tip" style={{ marginTop: 14, fontSize: 13 }}>
            <div className="co-title">🗺️ 一图流记忆法</div>
            <p style={{ fontSize: 13 }}>
              GPT = 「<b>分词 → 向量 → (掩码注意力 + FFN) ×N → 词表打分 → 采样</b>」的流水线。<br />
              与 BERT 只差一个开关（<b>看不看未来</b>）；与原始 Transformer 只差<b>扔掉了哪一半</b>。
              把这张图刻进脑子，你就有了理解一切大模型论文/开源项目的「地图」。
            </p>
          </div>
        </div>
      </div>
      <div className="demo-caption" style={{ borderTop: 'none', padding: '10px 2px 0' }}>
        三种架构一家亲：都源于 2017 年那篇论文。GPT 走纯解码器路线押注「生成能力」，BERT 走纯编码器路线深耕「理解」，如今前者成为大模型绝对主流。
      </div>
    </div>
  )
}
