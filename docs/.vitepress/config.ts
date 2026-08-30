import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  title: 'Hello WASM',
  titleTemplate: ':title | WebAssembly 手册',
  description: 'WebAssembly、WASI、浏览器执行模型与 RISC-V 64 运行时手册',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  vite: { configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)) },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: '基础概念', link: '/concepts/' },
      { text: 'WASI', link: '/wasi/' },
      { text: '工具链', link: '/toolchains/' },
      { text: 'container2wasm', link: '/container2wasm/' },
      { text: '运行时', link: '/runtimes/' },
      { text: '实验台', link: '/playground/' },
    ],
    sidebar: [
      {
        text: 'WebAssembly 手册',
        items: [
          { text: '手册总览', link: '/' },
          { text: '基础概念', link: '/concepts/' },
          { text: '浏览器执行模型', link: '/concepts/browser-runtime' },
          { text: 'WASI', link: '/wasi/' },
          { text: '工具链', link: '/toolchains/' },
          { text: 'container2wasm', link: '/container2wasm/' },
          { text: '运行时目录', link: '/runtimes/' },
          { text: '浏览器实验台', link: '/playground/' },
        ],
      },
    ],
    outline: { level: [2, 3], label: '本页目录' },
    lastUpdated: { text: '最后更新' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/xy2401/hello-wasm' }],
    search: { provider: 'local' },
  },
})
