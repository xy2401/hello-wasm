# container2wasm

本项目固定使用 `container2wasm 0.8.4`，把精简 Alpine Linux 镜像转换为 RISC-V 64 WebAssembly。

## 构建链

```text
Dockerfile
  → linux/riscv64 容器镜像
  → container2wasm
  → runtime.wasm
  → 10 MiB 原始切片
  → gzip + SHA-256 + manifest
```

## 为什么选择 RISC-V 64

RISC-V 64 使用更适合该项目的轻量模拟路径。运行时目录拒绝非 `riscv64` manifest，避免页面静默加载 x64 资产。

## 镜像原则

每个语言镜像只安装 Alpine 基础命令和一套语言工具链。没有明确 LTS 的语言使用 Alpine 当前受支持稳定线，实际版本由构建后的 manifest 记录。

