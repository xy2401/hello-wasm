---
layout: home
title: "Hello WASM"

hero:
  name: "🧩 Hello WASM"
  text: "WebAssembly 手册"
  tagline: "执行模型 · WASI 系统接口 · RISC-V 64 浏览器容器 · 运行时资产"
  image:
    src: /favicon.svg
    alt: Hello WASM
  actions:
    - theme: brand
      text: 理解执行模型
      link: /concepts/
    - theme: alt
      text: 🧪 Playground
      link: /playground/
    - theme: alt
      text: 📦 运行时目录
      link: /runtimes/

features:
  - icon: 🧠
    title: 执行模型
    details: 从模块、线性内存和导入导出，理解 WebAssembly 如何在浏览器与独立运行时中执行。
  - icon: 🔌
    title: WASI
    details: 说明文件系统、环境变量和系统调用能力如何被显式授权，并与浏览器沙箱保持边界。
  - icon: 🐧
    title: 浏览器容器
    details: 用 container2wasm 将 RISC-V 64 Linux 用户态带进浏览器，保留真实工具链与命令体验。
  - icon: 📦
    title: 运行时资产
    details: 统一构建、分片、校验并发布 Hello Lang 使用的 JVM、Node 与独立语言运行时。
---

## 内容入口

| 主题 | 解决的问题 |
| --- | --- |
| [基础概念](/concepts/) | WebAssembly 模块是什么，内存、函数、导入和导出怎样协作 |
| [浏览器执行模型](/concepts/browser-runtime) | Worker、SharedArrayBuffer、COOP/COEP 与终端交互如何配合 |
| [WASI](/wasi/) | WebAssembly 如何获得受限的系统能力 |
| [工具链](/toolchains/) | Emscripten、wasi-sdk 与相关构建工具分别负责什么 |
| [container2wasm](/container2wasm/) | Linux 容器如何转换为可在浏览器启动的 RISC-V 64 虚拟机 |

## 运行时体系

Hello WASM 将文档和大型运行时资产放在同一套可追溯结构中。产品页面仍属于 Hello Lang，物理工具链则在这里集中构建，避免每门语言重复保存相同的基础系统。

- **JVM 家族**：Java、Kotlin、Groovy、Scala、Clojure 共用一份 JDK 与语言工具链。
- **Node 家族**：JavaScript、TypeScript、HTML/Pug、CSS/Sass/PostCSS 共用一份 Node.js 工具链。
- **独立运行时**：Python、C/C++、Go、Rust、PHP、Ruby 各自保留完整环境。
- **暂不提供**：C# 尚无经过验证的 Linux RISC-V 64 SDK，因此不伪装成可运行环境。

[运行时目录](/runtimes/)列出真实版本、gzip 下载量、分片数量和校验信息。浏览器读取 manifest 后逐片校验 SHA-256，不回退到 x64 资产。

## Playground

[Playground](/playground/)直接使用已经构建的 RISC-V 64 运行时。每个页面对应一份物理资产，页面负责下载、校验和启动；容器镜像仍由 GitHub Actions 构建，不在用户浏览器中临时打包。

同一物理资产可以呈现不同产品体验：例如 Java 与 Scala 读取同一份 JVM 资产，但进入各自页面时使用独立标题、命令和示例。这样既保留语言辨识度，也避免重复下载基础工具链。

## 构建与发布

- 运行时由手动触发的 GitHub Actions 构建，仅生成 `linux/riscv64` 资产。
- gzip 分片作为普通 Git 文件保存，每门语言家族只保留当前版本。
- 静态站点可以部署到 Cloudflare Pages 等普通静态托管；仓库本身不代表线上站点已经配置或发布。
- Hello Lang 通过可配置的运行时基址读取远程 manifest，地址不可用时显示明确错误，不切换到另一种架构。

## 当前边界

- 只提供 RISC-V 64 容器运行时，不提供 x64 回退。
- 浏览器运行已构建资产，不在客户端构建容器。
- WebAssembly 文档、构建配置和资产由 Hello WASM 管理；各语言教程仍由 Hello Lang 管理。
