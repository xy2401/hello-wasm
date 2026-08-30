# Shell runtime preparation

`base/` 与 `multi/` 是从 Hello Shell 当前 RISC-V 64 container2wasm 配置复制的准备材料。`package-c2w.reference.js` 是当前打包器的冻结参考，未接入 Hello WASM 工作流。

`.github/workflows/build-shell-runtimes.yml` 提供独立的手动准备入口，只构建 `base` 与 `multi` 两个 RISC-V 64 目标。它不会被 Lang 的 `all` 选项带上，也不会由 push 自动触发。

Hello Shell 的页面、工作流和既有资产仍保持不变。x64 PowerShell 配置不进入 Hello WASM。手动构建后资产位于：

```text
/runtime/shell/base/riscv64/
/runtime/shell/multi/riscv64/
```
