# Hello WASM

WebAssembly 手册、浏览器运行时目录与 `container2wasm` 构建中心，为 Hello Lang 和 Hello Shell 集中管理大型资产。

```powershell
npm install
npm run docs:dev
```

本地地址：<http://127.0.0.1:5177/>。

Lang 运行时通过 `build-lang-runtimes` 工作流手动构建。15 个可运行产品映射到 JVM、Node 和六套独立工具链，共 8 份 RISC-V 64 物理资产。Shell 使用 `build-shell-runtimes`：`base`、`multi` 为 RISC-V 64，`powershell` 保留 AMD64；三个 Shell 页面读取共享清单与分片。

生成的 gzip 分片保存在 `docs/public/runtime/`，由 Cloudflare Pages 作为普通静态文件发布。两个工作流都只支持 `workflow_dispatch`，不会自动构建。

## Shell 资产维护

- 镜像配置：`runtimes/shell/{base,multi,powershell}/Dockerfile`。
- 共享清单：`docs/public/runtime/shell/<目标>/<架构>/manifest.json`。
- 定向检查：`node scripts/check-runtimes.js --family=shell --require-shell=base,multi,powershell`（逐片解压，约 495.4 MiB 原始数据）。
- 更新目录尺寸：`node scripts/report-runtime-sizes.js --shell --write`；仅更新 Shell 表格。
- 小数据测试：`node --test scripts/test-package-runtime.mjs`。

现有 Shell 分片已迁入，未重新编译；历史清单没有实际工具版本，详情见 `provenance`。本地联调时启动本站，再在 Shell 设置 `VITE_WASM_RUNTIME_BASE=http://127.0.0.1:5177/runtime`。公共站新增资产须先发布，随后发布 Shell 的共享加载入口。
