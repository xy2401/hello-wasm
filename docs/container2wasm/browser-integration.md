# container2wasm 浏览器接入与排障

本页说明如何把 Hello WASM 已构建的 Linux 运行时接入浏览器终端。构建链和架构选择见 [container2wasm 总览](./)，实际工具版本与下载体积见 [运行时目录](/runtimes/)。

## 适用边界

container2wasm 适合需要 Linux 用户空间和真实命令行工具的实验，例如多 Shell、语言编译器与离线 CLI。运行时在浏览器设备上执行，下载、内存和启动成本都由用户设备承担。

轻量语法练习或已有专用 WASM 引擎的功能，可以先使用对应解释器或引擎。需要外部数据库、消息代理或网络服务的实验，还要单独设计连接方式；镜像中安装客户端不会自动提供外部服务。

运行时体积取决于镜像和工具链，启动耗时取决于网络、缓存与设备。按当前 manifest 展示下载量，不承诺固定的体积或启动秒数。分片解压并重组后，内存峰值还会高于下载量。

## 构建与静态资产的归属

Hello WASM 集中维护镜像、构建工作流、清单和大型分片；Hello Lang、Hello Shell 维护各自的教程、终端组件和实验素材。

```text
hello-wasm/
├── .github/workflows/
│   ├── build-lang-runtimes.yml
│   └── build-shell-runtimes.yml
├── runtimes/
│   ├── lang/
│   └── shell/{base,multi,powershell}/
├── scripts/package-runtime.js
└── docs/public/
    ├── schemas/runtime-manifest.schema.json
    └── runtime/
        ├── engine/
        ├── lang/<运行时>/riscv64/
        └── shell/<运行时>/<架构>/
```

两个工作流固定使用 container2wasm `0.8.4`，只通过 `workflow_dispatch` 手动触发。构建先采集实际工具版本，再转换和打包资产。Shell PowerShell 使用 `amd64`；Lang 与 Shell 的 `base`、`multi` 使用 `riscv64`，接入页面应拒绝其他架构的清单。

复用现有 `scripts/package-runtime.js`，不要维护另一份切片脚本。打包器按 10 MiB 原始数据切片，以 gzip level 9 压缩，拒绝超过 24 MiB 的压缩分片。文件名包含完整 WASM 内容摘要的前 12 位：

```text
runtime-<摘要>-part-00.gz
runtime-<摘要>-part-01.gz
manifest.json
```

## 清单与加载顺序

清单格式以 `docs/public/schemas/runtime-manifest.schema.json` 为准。

| 字段 | 接入时的用途 |
| --- | --- |
| `schemaVersion` | 当前格式为 `1`，拒绝未知版本 |
| `runtimeId` | 核对页面指定的物理运行时，例如 `lang/jvm` 或 `shell/base` |
| `targetArch` | 核对 `riscv64` 或 PowerShell 的 `amd64`，不自动切换架构 |
| `runtimeVersion`、`systemVersion`、`container2wasmVersion` | 显示实际工具、系统与构建器版本；历史缺失信息保持明确标注 |
| `totalRawSize` | 完整 WASM 的字节数，可用于重组后的总量核对 |
| `chunks[].filename` | 按清单顺序获取分片，不能按请求完成顺序拼接 |
| `chunks[].compressedSize`、`sha256` | 核对收到的 gzip 字节数与 SHA-256 |
| `chunks[].rawSize` | 核对解压后的分片长度 |

页面打开时可以读取小型 manifest，完整分片在用户点击启动后才加载：

1. 读取并核对清单版本、运行时身份与架构。404 表示资产尚未发布；其他 HTTP 或 JSON 错误应显示具体原因。
2. 按清单下载分片，核对压缩字节数和 SHA-256。
3. 解压 gzip，核对各片原始长度。
4. 按清单顺序重组 WASM，使用 `WebAssembly.validate` 检查二进制是否有效。
5. 创建 PTY 与 Worker，把完整缓冲区通过 Transferable 交给 Worker。
6. Worker 实例化 WASM，回传状态，然后开始 Linux 引导。

SHA-256 用于核对文件是否与清单一致；`WebAssembly.validate` 用于检查模块格式，不能代替哈希校验。

## gzip 分片与 HTTP 压缩

这里的 `.gz` 文件是应用数据。清单的 `sha256` 和 `compressedSize` 都描述压缩文件本身，因此浏览器必须先取得 gzip 字节，校验后再解压。

若静态服务器对这些文件发送 `Content-Encoding: gzip`，浏览器可能已经在 `fetch()` 返回前自动解压，导致压缩体积或哈希校验失败。若直接把仍然压缩的字节送给 WASM，则会出现魔数错误。

Hello WASM 的 `docs/vite.config.ts` 在本地开发与预览中移除运行时 `.gz` 响应的 `Content-Encoding`，并使用 `Content-Type: application/octet-stream`。静态部署规则位于 `docs/public/_headers`。排查时检查实际响应和收到的字节，不能仅凭文件后缀判断是否已经解压。

下面只演示校验完成后的解压步骤，完整下载流程仍需处理清单、字节数与哈希：

```typescript
async function decompressGzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    throw new Error('分片不是预期的 gzip 数据，请检查响应头和缓存')
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持 gzip 流式解压')
  }
  const stream = new Response(buffer).body!.pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).arrayBuffer()
}
```

## Worker、WASI 与 PTY

Linux 虚拟机及阻塞式终端 I/O 在 Worker 中执行，页面主线程负责界面和 xterm.js。PTY 通过共享内存连接两端，输入、输出与终端尺寸走同一套协议。

构建器和浏览器 WASI 兼容层应按同一版本维护。当前引擎以 container2wasm `0.8.4` 为基线，升级时核对完整引擎及 WASI 导入，不能只复制一个 `worker.js`，或用空函数补齐缺失的 socket ABI。

项目的预加载逻辑放在 `docs/public/runtime/engine/worker-preload-adapter.js`。页面先下载、解压并校验 WASM，再发送以下消息；Worker 随后的 PTY 初始化会取出该缓冲区并启动运行时：

```typescript
worker.postMessage({
  type: 'init',
  wasmBuffer,
}, [wasmBuffer])

ttyServer.start(worker)
```

`wasmBuffer` 应是完整模块的 `ArrayBuffer`。Transferable 移交后，主线程不能继续读取该缓冲区。完整接入实现可参照本站的 `docs/.vitepress/theme/components/LanguageContainerWorkbench.vue`；Shell 终端由 Hello Shell 的 `BrowserContainerWorkbench.vue` 管理。

### 启动状态与错误回传

| 事件或阶段 | 应如何解释 |
| --- | --- |
| 分片加载中 | 显示下载进度，尚未运行 WASM |
| `runtime-started` | Worker 已完成 WASM 实例化，即将执行 `wasi.start()`；Linux 与工具仍可能继续引导 |
| Shell 或工具就绪信号 | 才能确认目标环境可接收实验命令；PowerShell 需要等待自身就绪 |
| `runtime-error` | 保留 Worker 回传的 `message`、`stack`，结束失败实例 |

主线程应监听 `message`、`error` 和 `messageerror`。错误放在独立的 `role="alert"` 区域中，保留到用户主动重试，避免终端被隐藏或重建后丢失信息。

重试或卸载时终止旧 Worker、停止 PTY，并忽略或取消旧下载结果。向终端导入多份文件时，按就绪或完成信号推进，避免用固定 `setTimeout` 猜测处理进度。

## 跨域隔离与跨站分发

使用 SharedArrayBuffer 的页面需要安全上下文和跨域隔离。部署时为宿主页面配置：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

当 Lang 或 Shell 从独立的 Hello WASM 域名读取资产时，资产服务还需允许跨源读取。本站 `docs/public/_headers` 为 `/runtime/*` 配置：

```http
Access-Control-Allow-Origin: *
Cross-Origin-Resource-Policy: cross-origin
```

接入站点仍需配置自己的隔离头；资产服务返回隔离头不会自动让另一站点进入隔离状态。Worker 和终端协议脚本的地址也要遵守宿主的同源与资源加载规则。

检查真实 HTML、Worker 和资产响应，然后在页面确认 `crossOriginIsolated === true` 与 `SharedArrayBuffer` 可用。代理预览或 iframe 的限制也可能使隔离失败。基础执行模型见 [浏览器执行模型](/concepts/browser-runtime)。

## 其他项目如何复用

1. 先选择 [运行时目录](/runtimes/)中已有的物理工具链，共享 JVM、Node 等环境，避免重复发布整套 Linux。
2. 确需新运行时时，在 Hello WASM 维护镜像和手动工作流，复用打包器与清单格式，记录实际版本。
3. 资产通过检查并发布后，再接入产品页面；产品页面保留身份、架构、哈希与错误检查。
4. 产品站维护终端组件、匹配的引擎适配、隔离头和实验素材；先明确离线运行或外部服务的边界。

Shell 的 `VITE_WASM_RUNTIME_BASE` 指向 Hello WASM 服务的 `/runtime`。在 hello-wasm 仓库根目录运行 `npm run docs:dev`，默认服务地址为 `http://127.0.0.1:5177/runtime`。接入站点根据实际服务地址设置该环境变量；修改后需重启接入站点。

## 常见故障

| 现象 | 优先检查 |
| --- | --- |
| manifest 404 | 运行时是否已发布，家族、ID、架构和资产基址是否正确 |
| 清单响应不是 JSON | 请求是否落入站点 HTML 回退页，URL 与部署路径是否匹配 |
| 压缩体积或 SHA-256 不符 | 响应是否被自动解压、清单与分片是否来自同一版本、缓存是否过期 |
| `failed to match magic number` | 是否误把 gzip 或 HTML 当作 WASM，是否按清单顺序完成解压和拼接 |
| `sock_accept` 不是函数 | 构建器与整套 WASI 引擎的版本、导入是否一致，不以空函数掩盖不兼容 |
| `SharedArrayBuffer` 不可用 | 安全上下文、宿主页隔离头、跨站资源头以及 iframe/代理限制 |
| 已显示运行状态但无提示符 | `runtime-started` 只表示 WASM 实例化；继续检查引导输出和目标工具就绪信号 |
| Worker 报错但页面没有详情 | 是否监听 Worker 异常与消息错误，错误面板是否独立于终端显示 |
| 重试后出现旧实例输出 | 是否终止旧 Worker、停止 PTY，并取消或忽略旧请求结果 |
