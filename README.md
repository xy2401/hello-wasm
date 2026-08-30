# Hello WASM

WebAssembly 手册、浏览器运行时目录与 RISC-V 64 `container2wasm` 构建中心。

```powershell
npm install
npm run docs:dev
```

本地地址：<http://127.0.0.1:5177/>。

Lang 运行时通过 `build-lang-runtimes` 工作流手动构建。15 个可运行产品映射到 JVM、Node 和六套独立工具链，共 8 份 RISC-V 64 物理资产。Shell 另有 `build-shell-runtimes` 手动准备工作流，仅生成 `base` 和 `multi` 资产，不供当前 Hello Shell 站点读取。

生成的 gzip 分片保存在 `docs/public/runtime/`，由 Cloudflare Pages 作为普通静态文件发布。两个工作流都只支持 `workflow_dispatch`，不会自动构建。
