import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const CHUNK_BYTES = 10 * 1024 * 1024
const MAX_DEPLOYED_FILE_BYTES = 24 * 1024 * 1024

function parseArgs() {
  const values = { input: '', dest: '', family: 'lang', runtime: '', runtimeVersion: '', systemVersion: 'Alpine Linux 3.23' }
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index]
    if (key === '--input') values.input = args[++index] ?? ''
    else if (key === '--dest') values.dest = args[++index] ?? ''
    else if (key === '--family') values.family = args[++index] ?? ''
    else if (key === '--runtime') values.runtime = args[++index] ?? ''
    else if (key === '--runtime-version') values.runtimeVersion = args[++index] ?? ''
    else if (key === '--system-version') values.systemVersion = args[++index] ?? ''
  }
  return values
}

const options = parseArgs()
if (!options.input || !options.dest || !options.runtime || !options.runtimeVersion.trim() || !options.systemVersion.trim()) {
  throw new Error('必须提供 --input、--dest、--runtime、--runtime-version 和有效的系统版本')
}
if (!['lang', 'shell'].includes(options.family)) throw new Error(`无效运行时家族：${options.family}`)
if (!/^[a-z0-9-]+$/.test(options.runtime)) throw new Error(`无效运行时 ID：${options.runtime}`)
if (!fs.existsSync(options.input)) throw new Error(`找不到 WebAssembly 文件：${options.input}`)

const source = fs.readFileSync(options.input)
const contentHash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 12)
fs.mkdirSync(options.dest, { recursive: true })
for (const filename of fs.readdirSync(options.dest)) {
  if (filename.endsWith('.gz') || filename === 'manifest.json') fs.unlinkSync(path.join(options.dest, filename))
}

const chunks = []
for (let offset = 0, index = 0; offset < source.length; offset += CHUNK_BYTES, index += 1) {
  const raw = source.subarray(offset, Math.min(offset + CHUNK_BYTES, source.length))
  const compressed = zlib.gzipSync(raw, { level: 9 })
  if (compressed.length > MAX_DEPLOYED_FILE_BYTES) {
    throw new Error(`压缩分片 ${index} 超过 Cloudflare Pages 安全上限：${compressed.length} bytes`)
  }
  const filename = `runtime-${contentHash}-part-${String(index).padStart(2, '0')}.gz`
  fs.writeFileSync(path.join(options.dest, filename), compressed)
  chunks.push({
    filename,
    rawSize: raw.length,
    compressedSize: compressed.length,
    sha256: crypto.createHash('sha256').update(compressed).digest('hex'),
  })
}

const manifest = {
  schemaVersion: 1,
  runtimeId: `${options.family}/${options.runtime}`,
  targetArch: 'riscv64',
  runtimeVersion: options.runtimeVersion.trim(),
  systemVersion: options.systemVersion.trim(),
  container2wasmVersion: '0.8.4',
  createdAt: new Date().toISOString(),
  totalRawSize: source.length,
  chunks,
}
fs.writeFileSync(path.join(options.dest, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`${manifest.runtimeId}: ${chunks.length} chunks, ${(source.length / 1024 / 1024).toFixed(1)} MiB raw`)
