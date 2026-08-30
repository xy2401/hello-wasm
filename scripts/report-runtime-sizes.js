import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const runtimeRoot = path.join(root, 'docs/public/runtime/lang')
const documentPath = path.join(root, 'docs/runtimes/index.md')
const runtimeIds = ['jvm', 'node', 'python', 'cpp', 'go', 'rust', 'php', 'ruby']
const labels = { jvm: 'JVM', node: 'Node', python: 'Python', cpp: 'C & C++', go: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby' }

const rows = []
for (const id of runtimeIds) {
  const manifestPath = path.join(runtimeRoot, id, 'riscv64/manifest.json')
  if (!fs.existsSync(manifestPath)) continue
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const compressed = manifest.chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0)
  rows.push({ id, manifest, compressed })
}

const mib = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MiB`
const escapeCell = (value) => String(value).replaceAll('|', '\\|').replaceAll(/\s+/g, ' ').trim()
const match = (value, pattern) => String(value).match(pattern)?.[1]
const formatRuntimeVersion = (id, value) => {
  if (id === 'jvm') {
    const versions = [
      ['OpenJDK', match(value, /openjdk\s+(\S+)/i)],
      ['Kotlin', match(value, /kotlinc-jvm\s+(\S+)/i)],
      ['Groovy', match(value, /Groovy Version:\s*(\S+)/i)],
      ['Scala', match(value, /Scala code runner version\s+(\S+)/i)],
      ['Clojure', match(value, /Clojure\s+(\d+\.\d+\.\d+)\s*$/i)],
      ['CLI', match(value, /Clojure CLI version\s+(\S+)/i)],
    ].filter(([, version]) => version)
    if (versions.length === 6) return versions.map(([tool, version]) => `${tool} ${version}`).join(' · ')
  }
  if (id === 'node') {
    const tools = ['Node', 'TypeScript', 'Pug', 'html-validate', 'Sass', 'PostCSS', 'postcss-cli', 'Autoprefixer', 'Stylelint']
    const versions = tools.map((tool) => [tool, match(value, new RegExp(`${tool.replace('-', '\\-')}\\s+(v?\\S+)`, 'i'))]).filter(([, version]) => version)
    if (versions.length === tools.length) return versions.map(([tool, version]) => `${tool} ${version}`).join(' · ')
  }
  return escapeCell(value)
}
const totalRaw = rows.reduce((sum, row) => sum + row.manifest.totalRawSize, 0)
const totalCompressed = rows.reduce((sum, row) => sum + row.compressed, 0)
const totalChunks = rows.reduce((sum, row) => sum + row.manifest.chunks.length, 0)
const body = [
  '<!-- runtime-size-report:start -->',
  `> 运行时实测报告：${rows.length}/${runtimeIds.length} 套物理资产，依据各目录 \`manifest.json\` 生成。`,
  '',
  '| 运行时 | 实际工具版本 | 原始 | gzip 下载 | 分片 | 下载 / 原始 |',
  '| --- | --- | ---: | ---: | ---: | ---: |',
  ...rows.map(({ id, manifest, compressed }) => `| ${labels[id]} | ${formatRuntimeVersion(id, manifest.runtimeVersion)} | ${mib(manifest.totalRawSize)} | ${mib(compressed)} | ${manifest.chunks.length} | ${(compressed * 100 / manifest.totalRawSize).toFixed(1)}% |`),
  `| **合计** | **${rows.length} 套运行时** | **${mib(totalRaw)}** | **${mib(totalCompressed)}** | **${totalChunks}** | **${totalRaw ? (totalCompressed * 100 / totalRaw).toFixed(1) : '0.0'}%** |`,
  '',
  `核对时间：${new Date().toISOString().slice(0, 10)}。逐分片字节数与 SHA-256 以 manifest 为准。`,
  '<!-- runtime-size-report:end -->',
].join('\n')

if (process.argv.includes('--write')) {
  const document = fs.readFileSync(documentPath, 'utf8')
  const updated = document.replace(/<!-- runtime-size-report:start -->[\s\S]*?<!-- runtime-size-report:end -->/, body)
  if (updated === document) throw new Error('运行时文档缺少尺寸报告标记')
  fs.writeFileSync(documentPath, updated)
} else {
  console.log(body)
}
