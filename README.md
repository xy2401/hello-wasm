# Hello WASM

WebAssembly 手册、浏览器运行时目录与 `container2wasm` 构建中心，为 Hello Lang 和 Hello Shell 集中管理大型资产。

```powershell
npm install
npm run docs:dev
```

本地地址：<http://127.0.0.1:24044/>。

Lang 运行时通过 `build-lang-runtimes` 工作流手动构建。15 个可运行产品映射到 JVM、Node 和六套独立工具链，共 8 份 RISC-V 64 物理资产。Shell 使用 `build-shell-runtimes`：`base`、`multi` 为 RISC-V 64，`powershell` 保留 AMD64；三个 Shell 页面读取共享清单与分片。

生成的 gzip 分片保存在 `docs/public/runtime/`，由 Cloudflare Workers Static Assets 作为普通静态文件发布。两个运行时工作流都只支持 `workflow_dispatch`，站点部署时只构建文档并发布已有分片。

## Cloudflare Workers 部署

仓库根目录的 [wrangler.jsonc](wrangler.jsonc) 声明了构建命令和静态资源目录。Wrangler 在部署阶段执行 `npm run docs:build`，随后发布 `docs/.vitepress/dist`；页面使用静态 HTML 路由和 VitePress 的 404 页面。

在 Cloudflare Workers 中导入本仓库，Worker 名称使用 `hello-wasm`（与配置中的 `name` 一致），根目录使用仓库根目录，**构建命令留空**，部署命令保留默认的 `npx wrangler deploy`。构建环境使用 Node.js 22.16+，站点默认部署到域名根路径 `/`，无需设置 `DOCS_BASE`。

构建命令由 Wrangler 执行，不依赖控制台自动填充构建命令字段。配置方式见 [Wrangler 自定义构建](https://developers.cloudflare.com/workers/wrangler/custom-builds/)和 [Workers 静态站点路由](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)。

## 文档入口

- [container2wasm 总览](docs/container2wasm/index.md)：构建链、架构选择与镜像原则。
- [浏览器接入与排障](docs/container2wasm/browser-integration.md)：分片校验、Worker/PTY、跨域隔离与复用步骤。
- [运行时目录](docs/runtimes/index.md)：实际版本、下载体积与资产来源。

## Shell 资产维护

- 镜像配置：`runtimes/shell/{base,multi,powershell}/Dockerfile`。
- 共享清单：`docs/public/runtime/shell/<目标>/<架构>/manifest.json`。
- 定向检查：`node scripts/check-runtimes.js --family=shell --require-shell=base,multi,powershell`（逐片解压，约 495.4 MiB 原始数据）。
- 更新目录尺寸：`node scripts/report-runtime-sizes.js --shell --write`；仅更新 Shell 表格。
- 小数据测试：`node --test scripts/test-package-runtime.mjs`。

现有 Shell 分片已迁入，未重新编译；历史清单没有实际工具版本，详情见 `provenance`。本地联调时启动本站，再在 Shell 设置 `VITE_WASM_RUNTIME_BASE=http://127.0.0.1:24044/runtime`。公共站新增资产须先发布，随后发布 Shell 的共享加载入口。
