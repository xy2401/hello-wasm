// One-time local asset transfer. No downloads, image builds, or Git mutations.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'))
const sourceRoot = fs.realpathSync(process.argv[2] || path.join(root, '../hello-shell'))
const execute = process.argv.includes('--move')
const targets = [['c2w', 'base', 'riscv64'], ['c2w-shell', 'multi', 'riscv64'], ['c2w-powershell', 'powershell', 'amd64']]
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const capturedCommit = spawnSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).stdout.trim()
if (!/^[a-f0-9]{40}$/.test(capturedCommit)) throw new Error('Cannot identify source checkout')
const inside = (candidate, base) => {
  const absolute = path.resolve(candidate)
  if (!absolute.startsWith(base + path.sep)) throw new Error(`Path escapes repository: ${candidate}`)
  let ancestor = absolute
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor)
  const resolved = fs.realpathSync(ancestor)
  if (resolved !== base && !resolved.startsWith(base + path.sep)) throw new Error(`Symlink escapes repository: ${candidate}`)
  return absolute
}

// Validate all sources before copying or removing any file. Only one raw chunk
// (at most 10 MiB) is decompressed at a time; the full WASM is never allocated.
const plans = targets.map(([legacyId, assetId, arch]) => {
  const source = inside(path.join(sourceRoot, 'docs/public/runtime', legacyId), sourceRoot)
  const destination = inside(path.join(root, 'docs/public/runtime/shell', assetId, arch), root)
  const manifestFile = inside(path.join(source, 'manifest.json'), sourceRoot)
  const manifestBytes = fs.readFileSync(manifestFile)
  const old = JSON.parse(manifestBytes)
  if (old.targetArch !== arch || !old.chunks?.length) throw new Error(`Invalid source manifest: ${legacyId}`)
  if (fs.existsSync(destination) && fs.readdirSync(destination).length) throw new Error(`Destination already contains assets: ${destination}`)
  const rawHash = crypto.createHash('sha256')
  const filenames = new Set()
  let total = 0
  for (const [index, chunk] of old.chunks.entries()) {
    if (chunk.filename !== `c2w-runtime.part_${String(index).padStart(2, '0')}.gz` || filenames.has(chunk.filename) || !/^[a-f0-9]{64}$/.test(chunk.sha256)) throw new Error('Invalid source chunk identity')
    const filename = inside(path.join(source, chunk.filename), sourceRoot)
    if (fs.lstatSync(filename).isSymbolicLink()) throw new Error('Source chunks cannot be symlinks')
    const compressed = fs.readFileSync(filename)
    if (compressed.length !== chunk.compressedSize || compressed.length > 24 * 1024 * 1024 || hash(compressed) !== chunk.sha256) throw new Error(`Source chunk changed: ${filename}`)
    const raw = zlib.gunzipSync(compressed, { maxOutputLength: 10 * 1024 * 1024 })
    if (raw.length !== chunk.rawSize || raw.length < 1) throw new Error(`Raw chunk size mismatch: ${filename}`)
    if (index === 0 && raw.subarray(0, 8).toString('hex') !== '0061736d01000000') throw new Error('Source has no WASM v1 header')
    rawHash.update(raw)
    total += raw.length
    filenames.add(chunk.filename)
  }
  if (total !== old.totalRawSize) throw new Error(`Source total size mismatch: ${legacyId}`)
  const wasmSha256 = rawHash.digest('hex')
  const manifest = {
    schemaVersion: 1, runtimeId: `shell/${assetId}`, targetArch: arch,
    runtimeVersion: '历史资产：原清单未记录实际工具版本', systemVersion: 'Alpine Linux 3.22', container2wasmVersion: '0.8.4',
    createdAt: old.createdAt, totalRawSize: total,
    provenance: { kind: 'legacy-migration', sourceRepository: 'xy2401/hello-shell', capturedSourceCommit: capturedCommit, sourceDirectory: `docs/public/runtime/${legacyId}`, sourceManifestSha256: hash(manifestBytes), wasmSha256, migratedAt: new Date().toISOString() },
    chunks: old.chunks.map((chunk, index) => ({ ...chunk, filename: `runtime-${wasmSha256.slice(0, 12)}-part-${String(index).padStart(2, '0')}.gz` })),
  }
  return { legacyId, source, destination, manifestFile, old, manifest, sourceManifestSha256: hash(manifestBytes) }
})

if (execute) {
  // Preserve gzip bytes exactly. Complete and verify every target before deleting
  // the enumerated legacy assets; existing engine files and demos are untouched.
  for (const plan of plans) {
    fs.mkdirSync(plan.destination, { recursive: true })
    for (const [index, chunk] of plan.manifest.chunks.entries()) {
      const source = inside(path.join(plan.source, plan.old.chunks[index].filename), sourceRoot)
      const destination = inside(path.join(plan.destination, chunk.filename), root)
      fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL)
      if (hash(fs.readFileSync(destination)) !== chunk.sha256) throw new Error('Copied chunk failed validation')
    }
    fs.writeFileSync(path.join(plan.destination, 'manifest.json'), JSON.stringify(plan.manifest, null, 2) + '\n', { flag: 'wx' })
  }
  for (const plan of plans) {
    if (hash(fs.readFileSync(plan.manifestFile)) !== plan.sourceManifestSha256) throw new Error('Source manifest changed during migration')
    for (const chunk of plan.old.chunks) if (hash(fs.readFileSync(path.join(plan.source, chunk.filename))) !== chunk.sha256) throw new Error('Source chunk changed during migration')
  }
  for (const plan of plans) {
    for (const chunk of plan.old.chunks) fs.unlinkSync(inside(path.join(plan.source, chunk.filename), sourceRoot))
    fs.unlinkSync(plan.manifestFile)
  }
}
console.log(JSON.stringify({ executed: execute, capturedSourceCommit: capturedCommit, runtimes: plans.map(plan => ({ legacyId: plan.legacyId, destination: path.relative(root, plan.destination).replaceAll('\\', '/'), manifest: plan.manifest, compressedBytes: plan.manifest.chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0) })) }, null, 2))
