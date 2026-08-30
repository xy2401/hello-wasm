<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import type { Terminal } from '@xterm/xterm'
import type { FitAddon } from '@xterm/addon-fit'
import { languageContainerRuntime, type LanguageRuntimeId } from '../data/languageContainerRuntimes'
import WorkbenchExampleMenu from './WorkbenchExampleMenu.vue'
import '@xterm/xterm/css/xterm.css'

type RuntimeStatus = 'idle' | 'downloading' | 'initializing' | 'running' | 'error' | 'unavailable'
interface RuntimeChunk { filename: string; rawSize: number; compressedSize: number; sha256: string }
interface RuntimeManifest {
  schemaVersion: 1
  targetArch: 'riscv64'
  runtimeId: string
  runtimeVersion: string
  systemVersion: string
  container2wasmVersion: string
  chunks: RuntimeChunk[]
}

const props = defineProps<{
  runtimeId: LanguageRuntimeId
  runtimeIds?: LanguageRuntimeId[]
  title?: string
  toolchain?: string
}>()
const runtime = computed(() => languageContainerRuntime(props.runtimeId)!)
const memberRuntimes = computed(() => {
  const ids = props.runtimeIds?.length ? props.runtimeIds : [props.runtimeId]
  return ids.map((id) => languageContainerRuntime(id)).filter((item) => item?.supported)
})
const displayName = computed(() => props.title || runtime.value.name)
const examples = computed(() => memberRuntimes.value.flatMap((member) =>
  member!.examples.map((example, index) => ({
    id: `${member!.id}-${index}`,
    title: memberRuntimes.value.length > 1 ? `${member!.name} · ${example.title}` : example.title,
    summary: example.command.split('\n', 1)[0],
    source: example.command,
  })),
))
const { isDark } = useData()
const terminalHost = ref<HTMLElement>()
const status = ref<RuntimeStatus>(runtime.value.supported ? 'idle' : 'unavailable')
const message = ref(runtime.value.note ?? '运行时按需加载，不会在打开页面时下载。')
const runtimeVersion = ref(runtime.value.baseline)
const toolchainDisplay = computed(() => props.toolchain || runtimeVersion.value)
const systemVersion = ref('Alpine Linux 3.23')
const chunkDisplay = ref(runtime.value.supported ? '等待清单' : '不适用')
const progress = ref(0)
const errorText = ref('')
let terminal: Terminal | undefined
let fitAddon: FitAddon | undefined
let resizeObserver: ResizeObserver | undefined
let worker: Worker | undefined
let ttyServer: { start(worker: Worker): void; stop?(): void } | undefined

const actionLabel = computed(() => {
  if (status.value === 'downloading') return `正在下载 · ${progress.value}%`
  if (status.value === 'initializing') return '正在启动…'
  if (status.value === 'running') return '运行中 · 重新启动'
  if (status.value === 'error') return '启动失败 · 重试'
  if (status.value === 'unavailable') return '暂无 RISC-V 64 运行时'
  return '未启动 · 启动容器'
})

function terminalTheme(dark: boolean) {
  return dark
    ? { background: '#0b1020', foreground: '#e2e8f0', cursor: '#a5b4fc', selectionBackground: '#3730a3', green: '#4ade80', red: '#f87171', yellow: '#facc15', blue: '#60a5fa' }
    : { background: '#f8fafc', foreground: '#1e293b', cursor: '#4f46e5', selectionBackground: '#c7d2fe', green: '#15803d', red: '#dc2626', yellow: '#a16207', blue: '#2563eb' }
}

async function ensureTerminal() {
  if (terminal || !terminalHost.value) return
  const [{ Terminal: XTerm }, { FitAddon: XTermFit }] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit'),
  ])
  terminal = new XTerm({ cursorBlink: true, convertEol: true, fontSize: 13, lineHeight: 1.25, theme: terminalTheme(isDark.value), fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' })
  fitAddon = new XTermFit()
  terminal.loadAddon(fitAddon)
  terminal.open(terminalHost.value)
  fitAddon.fit()
  resizeObserver = new ResizeObserver(() => fitAddon?.fit())
  resizeObserver.observe(terminalHost.value)
}

async function decompress(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b || typeof DecompressionStream === 'undefined') return buffer
  return new Response(new Response(buffer).body!.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
}

async function verifyChunk(buffer: ArrayBuffer, expected?: string) {
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) throw new Error('运行时清单缺少有效的 SHA-256。')
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (actual !== expected) throw new Error('运行时分片哈希校验失败。')
}

async function fetchManifest(url: string) {
  try {
    const response = await fetch(url)
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error(`运行时清单请求失败（HTTP ${response.status}）。`)
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('运行时清单响应不是 JSON。')
    try { return await response.json() as RuntimeManifest } catch { throw new Error('运行时清单 JSON 已损坏。') }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('运行时')) throw error
    throw new Error('无法访问 Hello WASM 运行时资产；请检查本地服务或部署状态。')
  }
}

function loadScript(url: string) {
  if (document.querySelector(`script[src="${url}"]`)) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`终端协议脚本加载失败：${url}`))
    document.head.appendChild(script)
  })
}

async function loadRuntime(manifest: RuntimeManifest, assetBase: string) {
  const buffers: ArrayBuffer[] = new Array(manifest.chunks.length)
  let completed = 0
  await Promise.all(manifest.chunks.map(async (chunk, index) => {
    const assetUrl = `${assetBase}/${chunk.filename}?sha256=${chunk.sha256.slice(0, 12)}`
    const response = await fetch(assetUrl)
    if (!response.ok) throw new Error(`分片 ${chunk.filename} 下载失败（${response.status}）`)
    const compressed = await response.arrayBuffer()
    if (chunk.compressedSize !== undefined && compressed.byteLength !== chunk.compressedSize) throw new Error(`分片 ${chunk.filename} 压缩体积与清单不一致。`)
    await verifyChunk(compressed, chunk.sha256)
    buffers[index] = await decompress(compressed)
    if (chunk.rawSize !== undefined && buffers[index].byteLength !== chunk.rawSize) throw new Error(`分片 ${chunk.filename} 解压体积与清单不一致。`)
    completed += 1
    progress.value = Math.round(completed / manifest.chunks.length * 100)
  }))
  const size = buffers.reduce((total, buffer) => total + buffer.byteLength, 0)
  const result = new Uint8Array(size)
  let offset = 0
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }
  return result
}

function stopRuntime() {
  worker?.terminate()
  worker = undefined
  ttyServer?.stop?.()
  ttyServer = undefined
}

async function startRuntime() {
  if (!runtime.value.supported) return
  try {
    stopRuntime()
    errorText.value = ''
    progress.value = 0
    status.value = 'downloading'
    message.value = '正在读取运行时清单…'
    await nextTick()
    await ensureTerminal()
    if (typeof SharedArrayBuffer === 'undefined') throw new Error('当前站点未开启 Cross-Origin Isolation，无法使用多线程容器终端。')

    const baseUrl = import.meta.env.BASE_URL || '/'
    const assetBase = `${baseUrl}runtime/lang/${runtime.value.assetId}/riscv64`
    const manifest = await fetchManifest(`${assetBase}/manifest.json`)
    if (!manifest) {
      status.value = 'unavailable'
      message.value = 'RISC-V 64 运行时尚未由 GitHub Actions 构建。'
      chunkDisplay.value = '尚未构建'
      return
    }
    if (manifest.schemaVersion !== 1) throw new Error(`不支持的运行时清单版本：${manifest.schemaVersion}`)
    await loadScript(`${baseUrl}runtime/engine/xterm-pty.js`)
    if (manifest.targetArch !== 'riscv64') throw new Error(`拒绝加载非 RISC-V 64 资产：${manifest.targetArch}`)
    if (manifest.runtimeId !== `lang/${runtime.value.assetId}`) throw new Error(`运行时目录不匹配：${manifest.runtimeId}`)
    message.value = `正在并发下载 ${manifest.chunks.length} 个分片…`
    const wasm = await loadRuntime(manifest, assetBase)
    if (!WebAssembly.validate(wasm)) throw new Error('WebAssembly 运行时完整性校验失败。')

    status.value = 'initializing'
    message.value = `已加载 ${(wasm.byteLength / 1024 / 1024).toFixed(1)} MB，正在启动 RISC-V 64 Linux…`
    terminal?.reset()
    terminal?.writeln('\x1b[32m✔\x1b[0m WebAssembly 分片已验证，正在引导容器。')

    const { openpty, TtyServer, Termios } = window as typeof window & Record<string, any>
    if (!openpty || !TtyServer || !Termios) throw new Error('终端协议组件未正确初始化。')
    const { master, slave } = openpty()
    const termios = slave.ioctl('TCGETS')
    termios.iflag &= ~(32 | 64 | 128 | 256 | 1024)
    termios.oflag &= ~1
    termios.lflag &= ~(2 | 64 | 8 | 16 | 32768)
    slave.ioctl('TCSETS', new Termios(termios.iflag, termios.oflag, termios.cflag, termios.lflag, termios.cc))
    terminal?.loadAddon(master)

    worker = new Worker(`${baseUrl}runtime/engine/worker.js?t=${Date.now()}`)
    worker.addEventListener('message', (event: MessageEvent) => {
      if (event.data?.type === 'runtime-started') {
        status.value = 'running'
        message.value = `${displayName.value} RISC-V 64 环境已启动。`
        terminal?.focus()
      } else if (event.data?.type === 'runtime-error') {
        throwRuntimeError(event.data.stack || event.data.message)
      }
    })
    worker.addEventListener('error', (event) => throwRuntimeError(event.error || event.message))
    worker.postMessage({ type: 'init', wasmBuffer: wasm.buffer }, [wasm.buffer])
    ttyServer = new TtyServer(slave)
    ttyServer.start(worker)
  } catch (error) {
    throwRuntimeError(error)
  }
}

function throwRuntimeError(error: unknown) {
  stopRuntime()
  status.value = 'error'
  errorText.value = error instanceof Error ? (error.stack || error.message) : String(error || '未知错误')
  message.value = '容器启动失败，错误详情已保留。'
}

function runExample(command: string) {
  if (status.value !== 'running' || !terminal) return
  terminal.input(`${command}\r`.replace(/\r?\n/g, '\r'), true)
  terminal.focus()
}

function clearTerminal() { terminal?.clear() }

onMounted(async () => {
  if (!runtime.value.supported) return
  try {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const manifest = await fetchManifest(`${baseUrl}runtime/lang/${runtime.value.assetId}/riscv64/manifest.json`)
    if (!manifest) {
      chunkDisplay.value = '尚未构建'
      return
    }
    if (manifest.targetArch !== 'riscv64') {
      chunkDisplay.value = `已拒绝 ${manifest.targetArch}`
      return
    }
    const compressed = manifest.chunks.reduce((total, chunk) => total + (chunk.compressedSize ?? 0), 0)
    chunkDisplay.value = `${manifest.chunks.length} 个分片 · ${(compressed / 1024 / 1024).toFixed(1)} MB`
    runtimeVersion.value = manifest.runtimeVersion
    systemVersion.value = manifest.systemVersion
  } catch { chunkDisplay.value = '清单读取失败' }
})

onBeforeUnmount(() => {
  stopRuntime()
  resizeObserver?.disconnect()
  terminal?.dispose()
})

watch(isDark, (dark) => {
  if (terminal) terminal.options.theme = terminalTheme(dark)
})
</script>

<template>
  <ClientOnly>
    <section class="shell-workbench shell-workbench--wasm" :aria-label="`${displayName} RISC-V 64 浏览器容器`">
      <header class="workbench-header">
        <div class="workbench-identity">
          <strong>{{ displayName }}</strong>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/container2wasm/container2wasm" target="_blank" rel="noopener noreferrer">container2wasm 0.8.4</a>
        </div>
        <button
          type="button"
          class="workbench-status"
          :class="status"
          :disabled="status === 'downloading' || status === 'initializing' || !runtime.supported"
          @click="startRuntime"
        ><i></i>{{ actionLabel }}</button>
      </header>
      <dl class="workbench-specs">
        <div><dt>系统</dt><dd><a href="https://alpinelinux.org/" target="_blank" rel="noopener noreferrer">{{ systemVersion }}</a></dd></div>
        <div><dt>架构</dt><dd>RISC-V 64</dd></div>
        <div><dt>工具链</dt><dd :title="runtimeVersion">{{ toolchainDisplay }}</dd></div>
        <div><dt>加载</dt><dd>{{ chunkDisplay }}</dd></div>
      </dl>

      <div v-if="errorText" class="workbench-error" role="alert" aria-live="assertive">
        <strong>容器启动失败</strong>
        <pre>{{ errorText }}</pre>
      </div>

      <div class="workbench-terminal">
        <div class="workbench-toolbar">
          <div class="workbench-toolbar-message">
            <strong>容器终端</strong><span>{{ message }}</span>
            <div v-if="status === 'downloading'" class="workbench-progress" :title="`已加载 ${progress}%`">
              <i :style="{ width: `${progress}%` }" />
            </div>
          </div>
          <div class="workbench-controls">
            <WorkbenchExampleMenu
              :examples="examples"
              :disabled="status !== 'running'"
              :compact="examples.length > 6"
              :hint="status === 'running' ? '选择并执行示例' : '请先启动容器'"
              @select="runExample"
            />
            <button type="button" class="workbench-button" :disabled="status !== 'running'" @click="clearTerminal">清屏</button>
          </div>
        </div>
        <div v-if="status === 'idle' || status === 'unavailable' || status === 'error'" class="workbench-idle">
          <div class="workbench-preview" aria-hidden="true"><span>lang-rv64:~$</span><code>{{ runtime.command }}</code></div>
          <p>{{ status === 'idle' ? '容器尚未加载。点击右上角“未启动 · 启动容器”后下载运行时分片。' : message }}</p>
        </div>
        <div v-show="status === 'downloading' || status === 'initializing' || status === 'running'" ref="terminalHost" class="workbench-terminal-host" />
      </div>
    </section>
  </ClientOnly>
</template>
