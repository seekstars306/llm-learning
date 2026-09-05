# LLM 修炼之路 · 从零开始的大模型学习平台

一个纯前端的中文交互式学习平台：从机器学习基础 → 神经网络 → 深度学习 → NLP → Transformer/GPT → 大模型训练调优 → 前沿应用，共 **7 大模块、36 节课、21 个可动手玩的交互演示**。风格为「直觉优先 + 公式逐项解释 + 算例带真实数字」，零后端、浏览器直接访问、进度自动保存。

## ✨ 特性

- 📚 **36 节系统课程**：每个概念都有 生活化比喻 → 公式逐项拆解 → ✏️ 算例（真实数字一步步算）→ ❓ 自问自答
- 🕹 **21 个交互演示**：猫狗分类、K-Means、梯度下降地形图、神经网络 Playground、现场训练手写识别、注意力热力图、BPE 分词器、LoRA 计算器、RLHF 流程等，全部纯 Canvas/JS 实现
- 🎯 **105 道随堂测验**：选项确定性洗牌、即时反馈、成绩计入学习进度
- 📱 **移动端适配**：抽屉式侧栏、触控拖拽、无横向溢出
- 🔐 **登录门禁**：内置管理员账号（见下方），注册入口保留未开放
- 🚫 **零后端**：全部内容为结构化数据文件，构建后是纯静态站点，任何静态服务器可跑

## 🚀 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 开发模式（热更新）
npm run build    # 构建生产版本到 dist/
npm run preview  # 本地预览构建产物（默认 4173 端口）
```

## 🌐 部署（任意静态服务器）

构建产物在 `dist/`，由于使用 Hash 路由，**不需要任何服务端路由配置**：

```bash
# nginx 示例（监听 8002）
server {
    listen 8002;
    root /var/www/llm-learning;
    index index.html;
    location /assets/ { expires 30d; add_header Cache-Control "public, immutable"; }
    location = /index.html { add_header Cache-Control "no-cache"; }
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml font/woff2;
}
```

更新内容 = 重新 `npm run build` + 覆盖 `dist/` 到服务器目录，无需重启 nginx。

## 🔑 登录账号

- 内置管理员：`admin` / `admin123`（纯前端本地门禁，账号存于浏览器 localStorage）
- 注册功能预留未开放（`src/lib/auth.js`）

## 🗂 项目结构

```
src/
├── lib/          # tinyNN 神经网络引擎、字符级语言模型、BPE 分词器、auth、progress、绘图工具
├── data/         # 课程数据（m1~m7.js，每课 = 结构化 block 数组）、curriculum、glossary
├── components/
│   ├── demos/    # 21 个交互演示组件
│   ├── lesson/   # BlockRenderer（算例/公式/测验/自问自答等块渲染器）、DemoShell、Quiz
│   └── pages/    # Roadmap（首页路线图）、LoginPage、GlossaryPage
└── App.jsx       # 路由 + 侧栏 + 登录门禁
```

## 🛠 技术栈

React 19 + Vite 8 + react-router-dom 7（HashRouter）+ KaTeX —— 纯 JavaScript (JSX)，无 TypeScript。
