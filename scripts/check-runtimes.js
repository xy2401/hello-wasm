import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const root = process.cwd()
const supported = ['jvm', 'node', 'python', 'cpp', 'go', 'rust', 'php', 'ruby']
const productAssets = {
  java: 'jvm', kotlin: 'jvm', groovy: 'jvm', scala: 'jvm', clojure: 'jvm',
  javascript: 'node', typescript: 'node', html: 'node', css: 'node',
  python: 'python', cpp: 'cpp', go: 'go', rust: 'rust', php: 'php', ruby: 'ruby', csharp: 'csharp',
}
const maxFileBytes = 24 * 1024 * 1024
const failures = []
const expect = (condition, message) => { if (!condition) failures.push(message) }
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const workflow = read('.github/workflows/build-lang-runtimes.yml')
const shellWorkflow = read('.github/workflows/build-shell-runtimes.yml')
const dockerfile = read('runtimes/lang/Dockerfile')
const catalog = read('docs/.vitepress/theme/data/languageContainerRuntimes.ts')
const nodePackage = JSON.parse(read('runtimes/lang/node/package.json'))
const nodeLock = JSON.parse(read('runtimes/lang/node/package-lock.json'))
const component = read('docs/.vitepress/theme/components/LanguageContainerWorkbench.vue')
const headers = read('docs/public/_headers')
const viteConfig = read('docs/vite.config.ts')
const manifestSchema = JSON.parse(read('docs/public/schemas/runtime-manifest.schema.json'))

expect(workflow.includes('workflow_dispatch:'), '运行时工作流必须仅提供手动入口')
expect(!/^\s*(push|pull_request):/m.test(workflow), '运行时工作流不得由 push 或 pull_request 自动触发')
expect(workflow.includes('--platform linux/riscv64'), 'Docker 镜像必须构建为 linux/riscv64')
expect(workflow.includes('--target-arch=riscv64'), 'container2wasm 必须生成 riscv64')
expect(!/--target-arch=(amd64|x86_64)/i.test(workflow), 'Lang 工作流不得生成 x64 资产')
expect(shellWorkflow.includes('workflow_dispatch:'), 'Shell 运行时工作流必须仅提供手动入口')
expect(!/^\s*(push|pull_request):/m.test(shellWorkflow), 'Shell 运行时工作流不得自动触发')
expect(shellWorkflow.includes('--platform linux/riscv64'), 'Shell Docker 镜像必须构建为 linux/riscv64')
expect(shellWorkflow.includes('--target-arch=riscv64'), 'Shell container2wasm 必须生成 riscv64')
expect(!/(?:--target-arch=(?:amd64|x86_64)|--platform linux\/(?:amd64|x86_64)|powershell)/i.test(shellWorkflow), 'Shell 准备工作流不得生成 x64 或 PowerShell 运行时')
expect(shellWorkflow.includes('--family shell'), 'Shell 工作流必须生成 shell/* manifest')
expect(shellWorkflow.includes('docs/public/runtime/shell/$RUNTIME/riscv64'), 'Shell 运行时路径不正确')
expect(component.includes('runtime/lang/${runtime.value.assetId}/riscv64'), '实验台必须按 assetId 使用共享 Lang 运行时路径')
expect(component.includes('manifest.runtimeId !== `lang/${runtime.value.assetId}`'), '实验台必须按 assetId 校验 manifest')
expect(headers.includes('Access-Control-Allow-Origin: *'), '运行时资产缺少 CORS 响应头')
expect(headers.includes('Cross-Origin-Resource-Policy: cross-origin'), '运行时资产缺少 CORP 响应头')
expect(viteConfig.includes("'Cross-Origin-Opener-Policy': 'same-origin'") && viteConfig.includes("'Cross-Origin-Embedder-Policy': 'require-corp'"), '本地 Vite 服务缺少 Cross-Origin Isolation 响应头')
expect(viteConfig.includes("'Access-Control-Allow-Origin': '*'") && viteConfig.includes("'Cross-Origin-Resource-Policy': 'cross-origin'"), '本地 Vite 服务缺少跨站运行时资产响应头')
expect(headers.includes('/runtime/*.gz'), 'gzip 分片缓存规则必须使用单个 Cloudflare splat')
expect(!/\/runtime\/\*\/\*\.gz/.test(headers), 'Cloudflare Pages 每条 _headers 路径只能使用一个 splat')
expect(manifestSchema.$id === 'https://hello-wasm.pages.dev/schemas/runtime-manifest.schema.json', '公开 manifest Schema 地址错误')
expect(manifestSchema.required.includes('totalRawSize'), 'manifest Schema 必须要求 totalRawSize')
expect(fs.existsSync(path.join(root, 'runtimes/shell/base/Dockerfile')), '缺少 Shell 基础容器准备配置')
expect(fs.existsSync(path.join(root, 'runtimes/shell/multi/Dockerfile')), '缺少 Shell 多环境准备配置')
expect(fs.existsSync(path.join(root, 'runtimes/shell/package-c2w.reference.js')), '缺少 Shell 打包配置准备')
for (const runtime of ['base', 'multi']) {
  expect(shellWorkflow.includes(`- ${runtime}`) || shellWorkflow.includes(`"${runtime}"`), `Shell 工作流缺少 ${runtime}`)
}

for (const runtime of supported) {
  expect(workflow.includes(`- ${runtime}`) || workflow.includes(`"${runtime}"`), `工作流缺少 ${runtime}`)
  expect(dockerfile.includes(`${runtime})`), `Lang Dockerfile 缺少 ${runtime}`)
}
for (const [product, asset] of Object.entries(productAssets)) {
  expect(catalog.includes(`id: '${product}'`), `产品目录缺少 ${product}`)
  expect(catalog.includes(`assetId: '${asset}'`), `产品 ${product} 缺少共享资产 ${asset}`)
}
for (const tool of ['typescript', 'pug', 'html-validate', 'sass', 'postcss', 'postcss-cli', 'autoprefixer', 'stylelint']) {
  expect(typeof nodePackage.dependencies?.[tool] === 'string', `Node 工具链缺少固定依赖 ${tool}`)
}
expect(nodeLock.lockfileVersion === 3, 'Node 工具链必须提交 npm lockfile v3')
expect(workflow.includes('rm -rf docs/public/runtime/lang/java docs/public/runtime/lang/kotlin'), 'JVM 发布必须清理旧 Java/Kotlin 资产')
expect(workflow.includes('rm -rf docs/public/runtime/lang/javascript docs/public/runtime/lang/typescript docs/public/runtime/lang/html docs/public/runtime/lang/css'), 'Node 发布必须清理旧拆分资产')
expect(workflow.includes('node scripts/report-runtime-sizes.js --write'), '发布工作流必须更新真实尺寸报告')
expect(dockerfile.includes('clojure -P'), 'JVM 镜像必须预取 Clojure 基础依赖')
for (const checksum of ['KOTLIN_SHA256', 'GROOVY_SHA256', 'SCALA_SHA256', 'CLOJURE_TOOLS_SHA256']) {
  expect(dockerfile.includes(checksum), `JVM 固定下载缺少 ${checksum} 校验`)
}
expect(dockerfile.includes('OPENJDK25_PACKAGE=25.0.4_p7-r0'), 'JVM 镜像必须固定 Alpine riscv64 的 OpenJDK 25.0.4 包')
expect(dockerfile.includes('org.clojure/clojure {:mvn/version "1.12.5"}'), 'JVM 镜像必须固定并预取 Clojure 1.12.5')
expect(dockerfile.includes('https://archive.apache.org/dist/groovy/${GROOVY_VERSION}/distribution/'), 'Groovy 固定旧版本必须使用 Apache 永久归档地址')
expect(dockerfile.includes('export PATH="/opt/kotlinc/bin:/opt/groovy/bin:/opt/scala/bin:/opt/node-tools/node_modules/.bin:$PATH"'), '登录 Shell 必须保留 JVM 与 Node 工具目录')
expect(dockerfile.includes('php84') && !dockerfile.includes('php85'), 'Alpine 3.23 riscv64 运行时必须使用稳定仓库的 php84')

const runtimeRoot = path.join(root, 'docs/public/runtime/lang')
const requiredArg = process.argv.find((arg) => arg.startsWith('--require='))
const required = requiredArg ? requiredArg.slice('--require='.length).split(',').filter(Boolean) : []
for (const runtime of required) {
  expect(supported.includes(runtime), `要求校验未知运行时：${runtime}`)
  expect(fs.existsSync(path.join(runtimeRoot, runtime, 'riscv64', 'manifest.json')), `缺少已构建运行时：${runtime}`)
}

const shellRuntimeRoot = path.join(root, 'docs/public/runtime/shell')
const requiredShellArg = process.argv.find((arg) => arg.startsWith('--require-shell='))
const requiredShell = requiredShellArg ? requiredShellArg.slice('--require-shell='.length).split(',').filter(Boolean) : []
for (const runtime of requiredShell) {
  expect(['base', 'multi'].includes(runtime), `要求校验未知 Shell 运行时：${runtime}`)
  expect(fs.existsSync(path.join(shellRuntimeRoot, runtime, 'riscv64', 'manifest.json')), `缺少已构建 Shell 运行时：${runtime}`)
}

if (fs.existsSync(runtimeRoot)) {
  for (const runtime of supported) {
    const directory = path.join(runtimeRoot, runtime, 'riscv64')
    if (!fs.existsSync(directory)) continue
    const manifestPath = path.join(directory, 'manifest.json')
    expect(fs.existsSync(manifestPath), `${runtime} 缺少 manifest.json`)
    if (!fs.existsSync(manifestPath)) continue
    let manifest
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch { failures.push(`${runtime} manifest 不是有效 JSON`); continue }
    expect(manifest.schemaVersion === 1, `${runtime} schemaVersion 错误`)
    expect(manifest.runtimeId === `lang/${runtime}`, `${runtime} runtimeId 错误`)
    expect(manifest.targetArch === 'riscv64', `${runtime} 不是 riscv64`)
    expect(manifest.systemVersion === 'Alpine Linux 3.23', `${runtime} 系统版本错误`)
    expect(manifest.container2wasmVersion === '0.8.4', `${runtime} container2wasm 版本错误`)
    expect(typeof manifest.runtimeVersion === 'string' && manifest.runtimeVersion.length > 0, `${runtime} 缺少实际工具链版本`)
    expect(Array.isArray(manifest.chunks) && manifest.chunks.length > 0, `${runtime} 没有分片`)
    let totalRaw = 0
    for (const chunk of manifest.chunks ?? []) {
      const chunkPath = path.join(directory, chunk.filename)
      expect(/^runtime-[a-f0-9]{12}-part-\d{2,}\.gz$/.test(chunk.filename), `${runtime} 分片文件名不规范：${chunk.filename}`)
      expect(fs.existsSync(chunkPath), `${runtime} 缺少 ${chunk.filename}`)
      if (!fs.existsSync(chunkPath)) continue
      const compressed = fs.readFileSync(chunkPath)
      expect(compressed.length === chunk.compressedSize, `${runtime}/${chunk.filename} 压缩体积不一致`)
      expect(compressed.length <= maxFileBytes, `${runtime}/${chunk.filename} 超过 24 MiB`)
      expect(crypto.createHash('sha256').update(compressed).digest('hex') === chunk.sha256, `${runtime}/${chunk.filename} SHA-256 不一致`)
      try {
        const raw = zlib.gunzipSync(compressed)
        expect(raw.length === chunk.rawSize, `${runtime}/${chunk.filename} 原始体积不一致`)
        expect(raw.length <= 10 * 1024 * 1024, `${runtime}/${chunk.filename} 原始分片超过 10 MiB`)
        totalRaw += raw.length
      } catch { failures.push(`${runtime}/${chunk.filename} 不是有效 gzip`) }
    }
    expect(totalRaw === manifest.totalRawSize, `${runtime} totalRawSize 不一致`)
  }
}

if (fs.existsSync(shellRuntimeRoot)) {
  for (const runtime of ['base', 'multi']) {
    const directory = path.join(shellRuntimeRoot, runtime, 'riscv64')
    if (!fs.existsSync(directory)) continue
    const manifestPath = path.join(directory, 'manifest.json')
    expect(fs.existsSync(manifestPath), `shell/${runtime} 缺少 manifest.json`)
    if (!fs.existsSync(manifestPath)) continue
    let manifest
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch { failures.push(`shell/${runtime} manifest 不是有效 JSON`); continue }
    expect(manifest.schemaVersion === 1, `shell/${runtime} schemaVersion 错误`)
    expect(manifest.runtimeId === `shell/${runtime}`, `shell/${runtime} runtimeId 错误`)
    expect(manifest.targetArch === 'riscv64', `shell/${runtime} 不是 riscv64`)
    expect(manifest.systemVersion === 'Alpine Linux 3.22', `shell/${runtime} 系统版本错误`)
    expect(manifest.container2wasmVersion === '0.8.4', `shell/${runtime} container2wasm 版本错误`)
    expect(typeof manifest.runtimeVersion === 'string' && manifest.runtimeVersion.length > 0, `shell/${runtime} 缺少实际工具版本`)
    expect(Array.isArray(manifest.chunks) && manifest.chunks.length > 0, `shell/${runtime} 没有分片`)
    let totalRaw = 0
    for (const chunk of manifest.chunks ?? []) {
      const chunkPath = path.join(directory, chunk.filename)
      expect(/^runtime-[a-f0-9]{12}-part-\d{2,}\.gz$/.test(chunk.filename), `shell/${runtime} 分片文件名不规范：${chunk.filename}`)
      expect(fs.existsSync(chunkPath), `shell/${runtime} 缺少 ${chunk.filename}`)
      if (!fs.existsSync(chunkPath)) continue
      const compressed = fs.readFileSync(chunkPath)
      expect(compressed.length === chunk.compressedSize, `shell/${runtime}/${chunk.filename} 压缩体积不一致`)
      expect(compressed.length <= maxFileBytes, `shell/${runtime}/${chunk.filename} 超过 24 MiB`)
      expect(crypto.createHash('sha256').update(compressed).digest('hex') === chunk.sha256, `shell/${runtime}/${chunk.filename} SHA-256 不一致`)
      try {
        const raw = zlib.gunzipSync(compressed)
        expect(raw.length === chunk.rawSize, `shell/${runtime}/${chunk.filename} 原始体积不一致`)
        expect(raw.length <= 10 * 1024 * 1024, `shell/${runtime}/${chunk.filename} 原始分片超过 10 MiB`)
        totalRaw += raw.length
      } catch { failures.push(`shell/${runtime}/${chunk.filename} 不是有效 gzip`) }
    }
    expect(totalRaw === manifest.totalRawSize, `shell/${runtime} totalRawSize 不一致`)
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exit(1)
}
console.log(`Hello WASM runtime check passed: ${Object.keys(productAssets).length} Lang products map to ${supported.length} physical runtimes; 2 Shell targets are prepared.`)
