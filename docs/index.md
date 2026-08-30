# WebAssembly 手册

Hello WASM 统一说明 WebAssembly 的执行模型、WASI 系统接口、浏览器安全边界以及由 `container2wasm` 生成的 RISC-V 64 Linux 运行时。

## 两类内容

- **知识手册**：从模块、线性内存和导入导出讲到 WASI、Worker、SharedArrayBuffer 与容器转换。
- **运行时中心**：统一构建、校验并发布 Hello Lang 使用的浏览器容器分片。

大型运行时以普通 gzip 文件保存在本仓库，共用 JDK 或 Node.js 的产品按工具链家族共享资产。构建由 GitHub Actions 手动触发，Cloudflare Pages 只负责普通静态部署。

## 当前边界

- 运行时架构固定为 RISC-V 64，不提供 x64 回退。
- 浏览器只回放已构建资产，不在客户端构建容器。
- C# 暂无可验证的 Linux riscv64 .NET SDK，因此不生成运行时。
