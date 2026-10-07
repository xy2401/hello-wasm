import { sharedThemeLabels } from './shared-ui'
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
    ...sharedThemeLabels,
    logo: '/favicon.svg',
    nav: [
      { text: '基础概念', link: '/concepts/' },
      { text: 'WASI', link: '/wasi/' },
      { text: '工具链', link: '/toolchains/' },
      { text: 'container2wasm', link: '/container2wasm/' },
      { text: '📦 运行时', link: '/runtimes/' },
      { text: '浏览器运行时实验台', link: '/playground/' },
    ],
    sidebar: {
      '/concepts/': [
        { text: '基础概念', items: [
          { text: 'WebAssembly 基础概念', link: '/concepts/' },
          { text: '浏览器执行模型', link: '/concepts/browser-runtime' },
        ] },
      ],
      '/wasi/': [
        { text: 'WASI', items: [
          { text: '总览', link: '/wasi/' },
        ] },
      ],
      '/toolchains/': [
        { text: '工具链', items: [
          { text: 'WebAssembly 工具链', link: '/toolchains/' },
        ] },
      ],
      '/container2wasm/': [
        { text: 'container2wasm', items: [
          { text: '总览', link: '/container2wasm/' },
          { text: '浏览器接入与排障', link: '/container2wasm/browser-integration' },
        ] },
      ],
      '/runtimes/': [
        { text: '运行时', items: [
          { text: '运行时目录', link: '/runtimes/' },
        ] },
      ],
      '/playground/': [
        {
          text: '实验台',
          items: [{ text: '浏览器运行时实验台', link: '/playground/' }],
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
    },
    outline: { level: [2, 3], label: '本页目录' },
    lastUpdated: { text: '最后更新' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    footer: {
      message: 'WebAssembly、WASI 与浏览器运行时手册',
      copyright: 'Copyright © 2026 Hello WASM',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/xy2401/hello-wasm' }],
  },
})
