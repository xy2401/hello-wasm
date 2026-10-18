# 📚 参考资料

按模块规范、系统接口、工具链与浏览器接入查找资料。官方链接用于核对接口和支持范围，本站页面用于理解当前运行时的配置、资产和验证方法。

## 规范与浏览器接口

| 资料 | 用途 | 本站对应章节 |
| --- | --- | --- |
| [WebAssembly Core Specification](https://webassembly.github.io/spec/core/) | 查阅模块结构、验证规则、执行语义与二进制格式 | [基础概念](/concepts/) |
| [WebAssembly System Interface](https://github.com/WebAssembly/WASI) | 查阅 WASI 接口、版本与提案入口 | [WASI](/wasi/) |
| [MDN：crossOriginIsolated](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) | 核对跨域隔离状态、响应头与共享内存使用条件 | [浏览器执行模型](/concepts/browser-runtime) |

阅读规范时，同时核对目标浏览器、编译器和宿主运行时实际支持的功能。本站容器终端的接入条件与纯模块调用不同，具体说明见[浏览器接入与排障](/container2wasm/browser-integration)。

## 官方工具链

| 工具 | 官方入口 | 优先查阅的问题 |
| --- | --- | --- |
| Emscripten | [介绍与文档](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html) | 源码移植、JavaScript 交互、文件系统与线程适配 |
| wasi-sdk | [工具链仓库](https://github.com/WebAssembly/wasi-sdk) | 所选编译目标、sysroot 与支持的 WASI 版本 |
| container2wasm | [转换器仓库](https://github.com/container2wasm/container2wasm) | 容器镜像输入、目标架构与运行示例 |

工具链的输入和产物对照见 [⚖️ 对比矩阵](/matrix/)。本站配置使用的 container2wasm 基线记录在 [container2wasm 手册](/container2wasm/)，已生成资产的实际版本由 manifest 记录。

## 本站资料入口

| 目标 | 阅读入口 |
| --- | --- |
| 理解模块、内存与宿主导入 | [基础概念](/concepts/) |
| 理解受限系统能力 | [WASI](/wasi/) |
| 确认构建工具的分工 | [工具链](/toolchains/) |
| 查看容器转换和打包流程 | [container2wasm](/container2wasm/) |
| 排查清单、gzip、Worker 与终端问题 | [浏览器接入与排障](/container2wasm/browser-integration) |
| 核对版本、架构和下载体积 | [运行时目录](/runtimes/) |
| 选择已有运行时体验 | [🧪 实验台](/playground/) |

## 资产核对顺序

先从目录确认物理资产和目标架构，再读取对应 `manifest.json`。核对 `runtimeId`、`targetArch`、`runtimeVersion`、`systemVersion`、`createdAt` 和 `chunks`；下载后由加载器检查分片字节数及 SHA-256，再执行解压和启动。

本地服务地址与部署地址应分别核对。例如本项目开发服务的清单入口位于 `http://127.0.0.1:24044/runtime/` 下；其他站点通过 `VITE_WASM_RUNTIME_BASE` 指定运行时地址，修改环境变量后需重启接入站点。

资料入口核对日期：2026-10-18。官方文档可能覆盖比本站固定配置更新的版本，复现时请对照清单与构建配置中的具体版本。
