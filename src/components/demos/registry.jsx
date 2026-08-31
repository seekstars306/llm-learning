import React from 'react'
// 所有交互演示在此注册，课件里通过 { t:'demo', id:'...' } 引用
import CatDogLab from './m1/CatDogLab.jsx'
import KMeansLab from './m1/KMeansLab.jsx'
import LineFitLab from './m1/LineFitLab.jsx'
import GradientDescentLab from './m1/GradientDescentLab.jsx'
import OverfitLab from './m1/OverfitLab.jsx'
import DataSplitLab from './m1/DataSplitLab.jsx'
import PerceptronLab from './m2/PerceptronLab.jsx'
import ActivationLab from './m2/ActivationLab.jsx'
import ForwardLab from './m2/ForwardLab.jsx'
import BackpropLab from './m2/BackpropLab.jsx'
import PlaygroundLab from './m2/PlaygroundLab.jsx'
import MnistLab from './m2/MnistLab.jsx'
import ConvLab from './m3/ConvLab.jsx'
import RnnLab from './m3/RnnLab.jsx'
import OptimizerLab from './m3/OptimizerLab.jsx'
import TokenizerLab from './m4/TokenizerLab.jsx'
import EmbeddingLab from './m4/EmbeddingLab.jsx'
import Seq2seqLab from './m4/Seq2seqLab.jsx'
import AttentionLab from './m5/AttentionLab.jsx'
import QKVLab from './m5/QKVLab.jsx'
import TransformerMap from './m5/TransformerMap.jsx'
import SamplingLab from './m5/SamplingLab.jsx'
import ScalingLab from './m6/ScalingLab.jsx'
import LoraCalc from './m6/LoraCalc.jsx'
import RlhfLab from './m6/RlhfLab.jsx'
import RagLab from './m7/RagLab.jsx'
import AgentLab from './m7/AgentLab.jsx'
import InferenceLab from './m7/InferenceLab.jsx'
import MoeLab from './m7/MoeLab.jsx'

const registry = {
  catDog: CatDogLab,
  kmeans: KMeansLab,
  lineFit: LineFitLab,
  gradientDescent: GradientDescentLab,
  overfit: OverfitLab,
  dataSplit: DataSplitLab,
  perceptron: PerceptronLab,
  activation: ActivationLab,
  forwardPass: ForwardLab,
  backprop: BackpropLab,
  playground: PlaygroundLab,
  mnist: MnistLab,
  conv: ConvLab,
  rnn: RnnLab,
  optimizer: OptimizerLab,
  tokenizer: TokenizerLab,
  embedding: EmbeddingLab,
  seq2seq: Seq2seqLab,
  attention: AttentionLab,
  qkv: QKVLab,
  transformerMap: TransformerMap,
  sampling: SamplingLab,
  scaling: ScalingLab,
  lora: LoraCalc,
  rlhf: RlhfLab,
  rag: RagLab,
  agent: AgentLab,
  inference: InferenceLab,
  moe: MoeLab,
}

export function getDemo(id) {
  return registry[id] || null
}
