import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base:'./' 让打包产物支持直接双击 index.html 打开（配合 HashRouter）
export default defineConfig({
  base: './',
  plugins: [react()],
})
