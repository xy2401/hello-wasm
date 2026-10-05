# container2wasm

本项目固定使用 `container2wasm 0.8.4`，把精简 Alpine Linux 镜像转换为浏览器可加载的 WebAssembly。

## 构建链

```text
Dockerfile
  → linux/riscv64 容器镜像（Shell PowerShell 使用 linux/amd64）
  → container2wasm
  → runtime.wasm
  → 10 MiB 原始切片
  → gzip + SHA-256 + manifest
```

## 为什么选择 RISC-V 64

Lang 与 Shell 基础环境选择 RISC-V 64；Shell PowerShell 延续既有 AMD64 容器方案。页面严格核对清单里的运行时身份和指定架构，拒绝加载另一个目标的资产。

## 镜像原则

每个语言镜像只安装 Alpine 基础命令和一套语言工具链。没有明确 LTS 的语言使用 Alpine 当前受支持稳定线，实际版本由构建后的 manifest 记录。
