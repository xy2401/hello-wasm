# 运行时目录

运行时由 GitHub Actions 手动构建。产品页面可以保持独立，但共享同一工具链和操作系统的产品只发布一份物理资产。

| 物理运行时 | 提供的产品 | 架构 | 状态 |
| --- | --- | --- | --- |
| JVM | Java、Kotlin、Groovy、Scala、Clojure | riscv64 | 已构建 |
| Node | JavaScript、TypeScript、HTML/Pug、CSS/Sass/PostCSS | riscv64 | 已构建 |
| Python | CPython | riscv64 | 已构建 |
| C & C++ | GCC / Clang | riscv64 | 已构建 |
| Go | Go | riscv64 | 已构建 |
| Rust | Rust / Cargo | riscv64 | 已构建 |
| PHP | PHP CLI | riscv64 | 已构建 |
| Ruby | Ruby / Bundler | riscv64 | 已构建 |
| C# | .NET SDK | riscv64 | 无可验证 SDK，不生成资产 |

## 实测体积

“原始”是 container2wasm 生成的完整 `runtime.wasm`；“gzip 下载”是浏览器首次启动该环境时取得全部分片的字节总量。页面只下载当前产品映射到的一套运行时。

<!-- runtime-size-report:start -->
> 运行时实测报告：8/8 套物理资产，依据各目录 `manifest.json` 生成。

| 运行时 | 实际工具版本 | 原始 | gzip 下载 | 分片 | 下载 / 原始 |
| --- | --- | ---: | ---: | ---: | ---: |
| JVM | OpenJDK 25.0.4 · Kotlin 2.3.20 · Groovy 5.1.0 · Scala 3.3.8 · Clojure 1.12.5 · CLI 1.12.5.1664 | 578.9 MiB | 367.9 MiB | 58 | 63.6% |
| Node | Node v24.18.1 · TypeScript 7.0.2 · Pug 3.0.4 · html-validate 11.10.0 · Sass 1.103.1 · PostCSS 8.5.26 · postcss-cli 11.0.1 · Autoprefixer 10.5.4 · Stylelint 17.14.1 | 202.8 MiB | 76.2 MiB | 21 | 37.6% |
| Python | Python 3.12.14 | 126.8 MiB | 54.5 MiB | 13 | 43.0% |
| C & C++ | gcc (Alpine 15.2.0) 15.2.0 | 658.5 MiB | 255.6 MiB | 66 | 38.8% |
| Go | go version go1.25.10 linux/riscv64 | 446.3 MiB | 153.2 MiB | 45 | 34.3% |
| Rust | rustc 1.91.1 (ed61e7d7e 2025-11-07) (Alpine Linux Rust 1.91.1-r2) | 650.1 MiB | 255.4 MiB | 66 | 39.3% |
| PHP | PHP 8.4.21 (cli) (built: May 7 2026 16:01:59) (NTS) | 77.0 MiB | 36.9 MiB | 8 | 47.9% |
| Ruby | ruby 3.4.9 (2026-03-11 revision 76cca827ab) +PRISM [riscv64-linux-musl] | 87.5 MiB | 40.0 MiB | 9 | 45.7% |
| **合计** | **8 套运行时** | **2827.9 MiB** | **1239.8 MiB** | **286** | **43.8%** |

核对时间：2026-08-30。逐分片字节数与 SHA-256 以 manifest 为准。
<!-- runtime-size-report:end -->

分片按 10 MiB 原始数据切割后分别使用 gzip level 9 压缩，单个部署文件必须小于 24 MiB。表中总量是当前 gzip 文件之和，不等同于 Git pack 或 Cloudflare 构建时的最终占用。

## 为什么按家族合并

container2wasm 保存的是可启动的 RISC-V 64 Linux 用户空间和容器文件系统，而不是单个语言命令。每套资产都会重复携带 Alpine、Bash、Git、coreutils、jq 和终端工具，因此共享 JDK 或 Node.js 的语言没有必要分别保存完整 Linux。

- **JVM** 只保留一份 OpenJDK，同时提供 Java、Kotlin、Groovy、Scala 和 Clojure。Groovy、Scala、Clojure主要增加 JAR 与命令脚本。
- **Node** 只保留一份 Node.js 与 npm，同时提供 TypeScript、Pug、html-validate、Sass、PostCSS、Autoprefixer 和 Stylelint。
- **HTML/CSS** 本身仍由浏览器解析；Pug 与 Sass/PostCSS 演示的是工程源码到标准 HTML/CSS 产物的构建过程。
- **独立工具链** 无法共享核心编译器，继续分别发布。

## 如何理解这些数字

- 网络成本看“gzip 下载”；浏览器缓存命中后不重复获取未变化的哈希分片。
- 内存与启动压力不能只看下载量；分片还要解压并重组 WASM，实际峰值会高于原始文件大小。
- 普通 Git 会保留旧提交中的大文件。合并资产验证后将整理首次拆分构建的历史，只让当前八套资产进入主分支克隆历史。
- 压缩率不代表运行效率。JAR 等内容已经压缩，外层 gzip 收益通常小于源码和普通二进制文件。

## Shell 准备运行时

- `shell/base`：Alpine 3.22、BusyBox ash 和基础文件命令。
- `shell/multi`：Alpine 3.22、Bash、Zsh、Fish 以及 Hello Shell 当前的多 Shell 工具集。

这两个目标由独立的手动 Action 构建，不会随 Lang 的 `all` 构建，当前 Hello Shell 也不会读取它们。
