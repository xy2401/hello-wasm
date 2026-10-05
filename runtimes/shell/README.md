# Shell shared runtimes

`base/` 与 `multi/` 维护 Hello Shell 的 RISC-V 64 容器配置，`powershell/` 保留原 AMD64 配置。统一使用 `scripts/package-runtime.js`，不再保留 Shell 的独立构建工作流、打包器或本地重型编译入口。

`.github/workflows/build-shell-runtimes.yml` 提供独立手动入口，可选择 `base`、`multi`、`powershell` 或 `all`。它不会被 Lang 的 `all` 选项带上，也不会由 push 自动触发。PowerShell 必须传入 `--target-arch amd64`；其余目标保持 `riscv64`。

Hello Shell 管理页面、实验素材和本地轻量 Worker/PTy 桥接；本仓库负责镜像、编译、分片、校验和发布。资产位于：

```text
/runtime/shell/base/riscv64/
/runtime/shell/multi/riscv64/
/runtime/shell/powershell/amd64/
```

现有 51 个分片从 Shell 原样迁入，manifest 的 `provenance` 标记历史来源。旧清单没有工具版本或原构建提交，不能把迁移提交当作构建证据。后续重建会记录实际工具版本。
