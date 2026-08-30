import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'

const base = process.env.DOCS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  base,
  title: 'Hello WASM',
  titleTemplate: ':title | WebAssembly 手册',
  description: 'WebAssembly、WASI、浏览器执行模型与 RISC-V 64 运行时手册',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }]],
  vite: { configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)) },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: '基础概念', link: '/concepts/' },
      { text: 'WASI', link: '/wasi/' },
      { text: '工具链', link: '/toolchains/' },
      { text: 'container2wasm', link: '/container2wasm/' },
      { text: '📦 运行时', link: '/runtimes/' },
      { text: '🧪 Playground', link: '/playground/' },
    ],
    sidebar: {
      '/playground/': [
        {
          text: 'Playground',
          items: [{ text: '总览', link: '/playground/' }],
        },
        {
          text: 'Lang',
          items: [
            { text: 'JVM', link: '/playground/jvm' },
            { text: 'Node', link: '/playground/node' },
            { text: 'Python', link: '/playground/python' },
            { text: 'C & C++', link: '/playground/cpp' },
            { text: 'Go', link: '/playground/go' },
            { text: 'Rust', link: '/playground/rust' },
            { text: 'PHP', link: '/playground/php' },
            { text: 'Ruby', link: '/playground/ruby' },
          ],
        },
      ],
      '/': [
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
            { text: 'Playground', link: '/playground/' },
          ],
        },
      ],
    },
    outline: false,
    lastUpdated: { text: '最后更新' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    footer: {
      message: 'WebAssembly、WASI 与浏览器运行时手册',
      copyright: 'Copyright © 2026 Hello WASM',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/xy2401/hello-wasm' }],
    search: { provider: 'local' },
  },
})
