# WebAssembly 工具链

## Emscripten

面向 C/C++ 和浏览器生态，提供 libc、JavaScript 胶水代码、虚拟文件系统与大量 Web API 适配。

## wasi-sdk

面向标准 WASI 目标，适合生成不依赖 DOM 的命令行模块，并可在 Wasmtime、Wasmer 等独立 Runtime 中运行。

## 语言专用运行时

Pyodide、Ruby.wasm 和 PHP-WASM 将语言解释器或运行时编译为 WebAssembly；它们比完整 Linux 容器轻，但只能提供各自明确实现的能力。

## container2wasm

container2wasm 把容器镜像及其用户空间转换为可在浏览器执行的 WebAssembly 虚拟机，兼容性更高，体积和启动成本也更大。

