import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    input: './out/c2w-runtime.wasm',
    dest: './docs/public/runtime/c2w',
    arch: 'riscv64',
    chunkSize: '10M',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) params.input = args[++i];
    if (args[i] === '--dest' && args[i + 1]) params.dest = args[++i];
    if (args[i] === '--arch' && args[i + 1]) params.arch = args[++i];
    if (args[i] === '--chunk-size' && args[i + 1]) params.chunkSize = args[++i];
  }
  return params;
}

function parseSize(sizeStr) {
  const unit = sizeStr.slice(-1).toUpperCase();
  const num = parseInt(sizeStr.slice(0, -1), 10);
  if (unit === 'M') return num * 1024 * 1024;
  if (unit === 'K') return num * 1024;
  return parseInt(sizeStr, 10);
}

function main() {
  const { input, dest, arch, chunkSize } = parseArgs();

  if (!fs.existsSync(input)) {
    console.error(`[package-c2w] Error: Input file "${input}" not found.`);
    process.exit(1);
  }

  const chunkSizeBytes = parseSize(chunkSize);
  const inputStat = fs.statSync(input);
  console.log(`[package-c2w] Processing "${input}" (${(inputStat.size / 1024 / 1024).toFixed(2)} MB)...`);
  console.log(`[package-c2w] Target arch: ${arch}, Chunk size: ${chunkSize} (${chunkSizeBytes} bytes)`);

  fs.mkdirSync(dest, { recursive: true });

  // Clean old chunks
  const oldFiles = fs.readdirSync(dest).filter((f) => f.startsWith('c2w-runtime.part_') && f.endsWith('.gz'));
  for (const f of oldFiles) {
    fs.unlinkSync(path.join(dest, f));
  }

  const inputBuffer = fs.readFileSync(input);
  const totalChunks = Math.ceil(inputBuffer.length / chunkSizeBytes);
  const manifestChunks = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSizeBytes;
    const end = Math.min(start + chunkSizeBytes, inputBuffer.length);
    const slice = inputBuffer.subarray(start, end);

    const compressed = zlib.gzipSync(slice, { level: 9 });
    const chunkName = `c2w-runtime.part_${String(i).padStart(2, '0')}.gz`;
    const chunkPath = path.join(dest, chunkName);

    fs.writeFileSync(chunkPath, compressed);

    const sha256 = crypto.createHash('sha256').update(compressed).digest('hex');
    manifestChunks.push({
      filename: chunkName,
      rawSize: slice.length,
      compressedSize: compressed.length,
      sha256,
    });

    console.log(
      `[package-c2w] Generated ${chunkName}: raw ${(slice.length / 1024 / 1024).toFixed(2)}MB -> compressed ${(compressed.length / 1024 / 1024).toFixed(2)}MB`
    );
  }

  const manifest = {
    version: '1.0.0',
    targetArch: arch,
    chunkSize,
    totalRawSize: inputBuffer.length,
    createdAt: new Date().toISOString(),
    chunks: manifestChunks,
  };

  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const readmeContent = `# Container2wasm Prebuilt Multi-Shell Runtime Assets

本目录存放由 GitHub Actions 云端流水线构建并分片的 \`container2wasm\` 浏览器多 Shell 容器底座。

## 构建策略
- **源镜像**：\`Dockerfile.base\` (Alpine 3.22 + bash, zsh, fish, python3, jq 等)
- **编译工具**：\`c2w\` (v0.8.4)
- **切片规则**：${chunkSize} 原始切片后执行 \`gzip -9\` 单片压缩
- **分发协议**：在 \`docs/public/_headers\` 中配置 \`Content-Encoding: gzip\`，由浏览器网络栈并发自动解压。

## 资产清单
详情参见同目录下的 \`manifest.json\`。
`;
  fs.writeFileSync(path.join(dest, 'README.md'), readmeContent, 'utf8');

  console.log(`[package-c2w] Successfully packaged ${totalChunks} chunks into "${dest}"`);
}

main();
