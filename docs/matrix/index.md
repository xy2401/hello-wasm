# ⚖️ 对比矩阵

先确定要运行的是 WebAssembly 模块、依赖 WASI 的程序，还是已有 Linux 用户空间，再比较工具链与宿主能力。版本和下载量统一查阅[运行时目录](/runtimes/)，本页按职责、接口和运行条件对照。

## 执行方式

| 路径 | 运行对象 | 宿主提供什么 | 适合的任务 | 接入时先确认 |
| --- | --- | --- | --- | --- |
| 浏览器直接加载模块 | 编译后的 `.wasm` 与配套 JavaScript | JavaScript 导入函数及 Web API 适配 | 把算法、解析器或库接入网页 | 导入导出、内存布局、异步调用与 Worker 分工 |
| WASI 程序 | 面向指定 WASI 接口编译的程序 | 对应版本的系统接口与能力授权 | 运行依赖文件、参数或标准输入输出的程序 | WASI 版本、所需接口与宿主实际支持情况 |
| container2wasm 浏览器容器 | 从容器镜像转换的虚拟机与 Linux 用户空间 | 虚拟机、系统适配层及终端桥接 | 复用已有命令行工具链，观察完整用户环境 | 镜像架构、分片体积、跨域隔离和终端交互 |

模块执行规则由 [WebAssembly 规范](https://webassembly.github.io/spec/core/)定义，系统接口见 [WASI 项目](https://github.com/WebAssembly/WASI)，容器转换方式见 [container2wasm](https://github.com/container2wasm/container2wasm)。浏览器中的 WASI 程序需要宿主适配，不能仅凭 `.wasm` 扩展名判断是否可以直接启动。

## 工具链与输入产物

| 工具链 | 主要输入 | 产物与接入方式 | 需要准备的内容 |
| --- | --- | --- | --- |
| Emscripten | C/C++ 等基于 LLVM 的项目 | WebAssembly 与配套 JavaScript；接入网页或其他支持的环境 | 移植所需系统接口，处理文件、线程与 Web API 适配 |
| wasi-sdk | 面向 WASI 的 C/C++ 项目 | 面向所选 WASI 目标的产物，交给匹配的宿主执行 | 编译目标、sysroot 与宿主支持的 WASI 接口 |
| container2wasm | 指定架构的容器镜像 | 转换后的 WebAssembly 虚拟机及配套运行文件 | 固定镜像、转换配置、资产发布与加载器 |

工具职责分别依据 [Emscripten 介绍](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html)、[wasi-sdk](https://github.com/WebAssembly/wasi-sdk)和 [container2wasm](https://github.com/container2wasm/container2wasm)。本站的构建入口与配置分工见[工具链](/toolchains/)及 [container2wasm 手册](/container2wasm/)。

## 本站运行时对照

| 资产组 | 当前架构约定 | 共用方式 | 体验与核对入口 |
| --- | --- | --- | --- |
| Lang JVM | RISC-V 64 | Java、Kotlin、Groovy、Scala、Clojure 共用 JVM 资产 | [JVM 实验](/playground/jvm) |
| Lang Node | RISC-V 64 | JavaScript、TypeScript 与相关 Web 工具共用 Node 资产 | [Node 实验](/playground/node) |
| Lang 独立工具链 | RISC-V 64 | Python、C/C++、Go、Rust、PHP、Ruby 各有物理资产 | [🧪 实验台](/playground/) |
| Shell 基础与多 Shell | RISC-V 64 | 由 Hello Shell 对应页面读取共享资产 | [运行时目录](/runtimes/) |
| Shell PowerShell | AMD64 | 独立目标，按自己的架构加载 | [运行时目录](/runtimes/) |

这些架构是本仓库的资产约定。具体工具版本、gzip 下载量与历史清单缺项，以运行时目录和对应 manifest 为准。

## 如何验证选择

1. 只需调用某个函数或库时，先核对模块接口与网页集成方式。
2. 程序依赖系统接口时，逐项确认 WASI 版本和宿主支持；需要完整 Linux 工具环境时，再核对容器转换路径。
3. 使用本站容器资产时，先读取 manifest，核对运行时 ID、架构和分片大小，再由加载器验证 SHA-256、解压与启动状态。

跨域隔离、gzip 响应头与 Worker 排错见[浏览器接入与排障](/container2wasm/browser-integration)；规范和官方文档集中在 [📚 参考资料](/reference/)。
