import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'

const script = fileURLToPath(new URL('./package-runtime.js', import.meta.url))
const wasm = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0])
const fixture = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hello-wasm-package-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const input = path.join(root, 'fixture.wasm')
  fs.writeFileSync(input, wasm)
  const dest = path.join(root, 'assets')
  const args = ['--input', input, '--dest', dest, '--runtime-version', 'fixture 1.0']
  return { input, dest, run: extra => spawnSync(process.execPath, [script, ...args, ...extra], { encoding: 'utf8' }) }
}

test('base, multi and PowerShell publish verifiable gzip with explicit architectures', t => {
  const { dest, run } = fixture(t)
  for (const [runtime, arch] of [['base', 'riscv64'], ['multi', 'riscv64'], ['powershell', 'amd64']]) {
    const result = run(['--family', 'shell', '--runtime', runtime, '--target-arch', arch, '--system-version', 'Alpine Linux 3.22'])
    assert.equal(result.status, 0, result.stderr)
    const manifest = JSON.parse(fs.readFileSync(path.join(dest, 'manifest.json')))
    assert.equal(manifest.runtimeId, `shell/${runtime}`)
    assert.equal(manifest.targetArch, arch)
    assert.equal(manifest.totalRawSize, wasm.length)
    assert.equal(manifest.chunks.length, 1)
    const chunk = manifest.chunks[0]
    const gzip = fs.readFileSync(path.join(dest, chunk.filename))
    assert.equal(gzip.length, chunk.compressedSize)
    assert.equal(createHash('sha256').update(gzip).digest('hex'), chunk.sha256)
    assert.deepEqual(gunzipSync(gzip), wasm)
    assert.equal(fs.readdirSync(dest).length, 2, 'only current manifest and chunk remain')
  }
})
test('architecture mistakes and unknown arguments fail before replacing existing evidence', t => {
  const { dest, run } = fixture(t)
  fs.mkdirSync(dest)
  fs.writeFileSync(path.join(dest, 'manifest.json'), 'existing evidence')
  for (const args of [
    ['--family', 'shell', '--runtime', 'base', '--target-arch', 'amd64'],
    ['--family', 'shell', '--runtime', 'powershell'],
    ['--family', 'lang', '--runtime', 'python', '--target-arch', 'amd64'],
    ['--runtime', 'python', '--unexpected'],
  ]) {
    assert.notEqual(run(args).status, 0)
    assert.equal(fs.readFileSync(path.join(dest, 'manifest.json'), 'utf8'), 'existing evidence')
  }
})
test('empty and non-WASM inputs cannot create successful manifests', t => {
  const { input, dest, run } = fixture(t)
  for (const bytes of [Buffer.alloc(0), Buffer.from('not wasm')]) {
    fs.writeFileSync(input, bytes)
    const result = run(['--runtime', 'python'])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /WebAssembly v1/)
    assert(!fs.existsSync(dest))
  }
})
