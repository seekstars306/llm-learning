// 术语速查表：按主题分组的关键词卡片
export const glossary = [
  // 基础
  { term: '机器学习', en: 'Machine Learning', tag: '基础', def: '让计算机从数据中自己找规律，而不是靠人一条条写规则。就像教小孩认猫：看够多的猫，他自己会总结特征。' },
  { term: '监督学习', en: 'Supervised Learning', tag: '基础', def: '给模型看「题目 + 标准答案」来学习。比如给 1 万张标好「猫/狗」的图片，让它学会区分。' },
  { term: '无监督学习', en: 'Unsupervised Learning', tag: '基础', def: '没有标准答案，让模型自己在数据里找结构，比如把相似的用户自动聚成几类（聚类）。' },
  { term: '损失函数', en: 'Loss Function', tag: '基础', def: '衡量模型「错得有多离谱」的数字。训练的目标就是把它降到最低，好比考试分数的反向指标。' },
  { term: '梯度下降', en: 'Gradient Descent', tag: '基础', def: '最经典的优化算法：沿着损失函数「下坡最陡」的方向一小步一小步走，最终走到山谷（最小值）。' },
  { term: '学习率', en: 'Learning Rate', tag: '基础', def: '每一步下山迈多大。太大容易跨过谷底来回震荡，太小则学得极慢。训练大模型最敏感的超参数之一。' },
  { term: '过拟合', en: 'Overfitting', tag: '基础', def: '模型把训练数据「背」下来了，连噪声也学了，导致遇到新数据表现很差。像只刷题不理解的考生。' },
  { term: '正则化', en: 'Regularization', tag: '基础', def: '防止过拟合的各种手段：给复杂模型加惩罚、随机丢弃神经元、早停等。核心思想是「别背题，理解规律」。' },
  { term: '训练集 / 验证集 / 测试集', en: 'Train / Val / Test', tag: '基础', def: '数据的三份切分：训练集用来学习，验证集用来调参，测试集只在最后考一次，用来评估真实水平。' },

  // 神经网络
  { term: '神经元', en: 'Neuron', tag: '网络', def: '神经网络的基本单元：把输入加权求和，加上偏置，再过一个激活函数输出。模拟大脑神经元的 simplified 版。' },
  { term: '权重与偏置', en: 'Weight & Bias', tag: '网络', def: '权重决定每个输入的重要程度，偏置是额外的可调常数。它们就是网络里被训练的「参数」。' },
  { term: '激活函数', en: 'Activation Function', tag: '网络', def: '给神经元加非线性的函数（ReLU、GELU 等）。没有它，再深的网络也只是线性变换，学不了复杂规律。' },
  { term: '反向传播', en: 'Backpropagation', tag: '网络', def: '训练的核心算法：从损失出发，用链式法则把「责任」一层层往回算，算出每个参数该怎么调。' },
  { term: '反向传播梯度', en: 'Gradient', tag: '网络', def: '损失对每个参数的偏导数，指出「这个参数往哪个方向调、调多少，损失降得最快」。' },
  { term: 'CNN 卷积神经网络', en: 'Convolutional Neural Network', tag: '网络', def: '擅长处理图像的网络：用小的卷积核在图上滑动扫描，自动学习边缘、纹理、形状等局部特征。' },
  { term: 'RNN 循环神经网络', en: 'Recurrent Neural Network', tag: '网络', def: '按顺序逐个处理序列元素，把前面的信息记在「隐藏状态」里带给后面。Transformer 之前的主流 NLP 模型。' },
  { term: 'Batch 归一化', en: 'Batch Normalization', tag: '网络', def: '把每层的输入拉回稳定的分布，让训练更快更稳。Transformer 里用的是它的变体 LayerNorm。' },

  // NLP & Transformer
  { term: 'Token', tag: 'NLP', def: '大模型处理文本的最小单位，可能是词、子词或单个汉字/字母。模型眼里的「文字」不是字，而是 token 序列。' },
  { term: '分词器', en: 'Tokenizer', tag: 'NLP', def: '把原始文本切成 token 并映射为编号的工具，如 BPE。大模型训练前，所有文本都要先经过它。' },
  { term: '词向量 / 嵌入', en: 'Embedding', tag: 'NLP', def: '把每个词映射成一个高维向量，意思相近的词在空间里也相近。语义变成了可以计算的几何。' },
  { term: '注意力机制', en: 'Attention', tag: 'Transformer', def: '让每个词「环顾四周」，按相关性加权汇总其他词的信息。是 Transformer 的灵魂，解决了长距离依赖。' },
  { term: '自注意力', en: 'Self-Attention', tag: 'Transformer', def: '序列自己关注自己：句子里的每个词都用注意力看句子里所有的词（包括自己），提取上下文信息。' },
  { term: 'Q / K / V', tag: 'Transformer', def: 'Query 查询、Key 键、Value 值——像图书馆检索：拿着问题(Q)和每本书的标签(K)比对，越匹配越多吃它的内容(V)。' },
  { term: '多头注意力', en: 'Multi-Head Attention', tag: 'Transformer', def: '并行跑多组注意力，各自关注不同角度（有的看语法、有的看指代），最后拼接，看得更全面。' },
  { term: 'Transformer', tag: 'Transformer', def: '2017 年提出、完全基于注意力的架构，抛弃了循环结构。当今几乎所有大模型（GPT/Claude/Gemini）的骨架。' },
  { term: '位置编码', en: 'Positional Encoding', tag: 'Transformer', def: '注意力本身不认顺序，需要额外把「词的位置」信息注入向量里，模型才知道语序。' },
  { term: '自回归生成', en: 'Autoregressive', tag: 'Transformer', def: 'GPT 式的文本生成方式：每次只预测下一个 token，然后把生成的接回去，再预测下一个，逐词滚动。' },
  { term: '温度采样', en: 'Temperature Sampling', tag: 'Transformer', def: '控制生成随机性的旋钮：温度低→保守稳定，温度高→天马行空。顶部还有 top-p 等截断策略。' },

  // 大模型训练
  { term: '预训练', en: 'Pre-training', tag: '训练', def: '在海量文本上做「预测下一个词」的自监督学习，让模型学会语言和世界知识。烧钱的大头，动辄数月数千卡。' },
  { term: 'Scaling Law', en: '缩放定律', tag: '训练', def: '模型能力随参数量、数据量、算力的增长呈可预测的幂律提升。「大力出奇迹」背后的理论依据。' },
  { term: '指令微调', en: 'SFT', tag: '训练', def: 'Supervised Fine-Tuning：用「指令 → 高质量回答」的数据继续训练预训练模型，让它从补全机变成听指令的助手。' },
  { term: 'LoRA', tag: '训练', def: 'Low-Rank Adaptation：冻结原模型，只训练插入的低秩小矩阵，参数量常只有全量微调的 0.1%～1%，单卡就能微调大模型。' },
  { term: 'RLHF', tag: '训练', def: 'Reinforcement Learning from Human Feedback：人类对回答排序 → 训练奖励模型 → 用强化学习优化模型，让它输出人类偏好的回答。' },
  { term: 'DPO', en: 'Direct Preference Optimization', tag: '训练', def: 'RLHF 的简化替代：直接用偏好数据优化策略，不需要单独训练奖励模型和跑强化学习，更稳定省事。' },
  { term: '幻觉', en: 'Hallucination', tag: '训练', def: '模型一本正经地编造事实。根源是它本质在预测「像样的文本」而非「真实的内容」，对齐和 RAG 可以缓解。' },
  { term: '对齐', en: 'Alignment', tag: '训练', def: '让模型的行为符合人类意图和价值观：有用、诚实、无害。RLHF/DPO 是主流对齐手段。' },

  // 前沿
  { term: 'RAG', en: '检索增强生成', tag: '前沿', def: '先从知识库里检索相关资料，塞进提示词再让模型回答。给大模型外挂知识库、减少幻觉的标准做法。' },
  { term: '向量数据库', en: 'Vector Database', tag: '前沿', def: '专门存 embedding 并支持「最近邻搜索」的数据库，是 RAG 检索环节的底座。' },
  { term: 'Agent 智能体', tag: '前沿', def: '让大模型作为「大脑」，循环执行 思考→调用工具→观察结果→再思考，自主完成多步任务。' },
  { term: 'Function Calling', en: '工具调用', tag: '前沿', def: '大模型输出结构化的函数调用请求（而非直接回答），由外部程序执行后把结果喂回去，接上计算器、搜索、API 等。' },
  { term: 'KV Cache', tag: '前沿', def: '推理时把每个 token 算过的 Key/Value 缓存起来，避免每生成一个词都重算历史，是大模型推理加速的关键。' },
  { term: '量化', en: 'Quantization', tag: '前沿', def: '把模型权重从 FP16 压到 INT8/INT4 等低位宽，显存占用大降、推理变快，精度损失通常很小。' },
  { term: 'MoE', en: '混合专家模型', tag: '前沿', def: 'Mixture of Experts：路由器每次只激活一小部分「专家」网络，模型总参数很大但每次计算量不变。' },
  { term: '多模态', en: 'Multimodal', tag: '前沿', def: '模型能同时理解/生成文字、图像、音频等多种形式。典型做法：把图像切成 patch 当作 token 一起建模。' },
  { term: '上下文窗口', en: 'Context Window', tag: '前沿', def: '模型一次能「看到」的最大 token 数。从 GPT-3 的 2K 到如今百万级，长上下文是重要竞赛方向。' },
  { term: '推理', en: 'Inference', tag: '前沿', def: '训练完成后用模型实际生成结果的阶段。区别于训练，关注延迟、吞吐和显存占用。' },
]
