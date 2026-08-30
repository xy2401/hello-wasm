# 浏览器执行模型

## 主线程与 Worker

大型 WebAssembly 运行时应在 Web Worker 中执行，避免阻塞文档页面。终端通过 PTY 协议在页面与 Worker 之间传递输入、输出和窗口尺寸。

## SharedArrayBuffer

同步系统调用和终端桥接依赖共享内存。页面必须进入 Cross-Origin Isolation 状态，通常需要：

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

跨站加载的运行时分片还必须返回允许跨源读取的 CORS 与 CORP 响应头。

## 按需加载

页面打开时只读取小型 manifest。用户点击启动后才并发下载 gzip 分片，逐片校验 SHA-256，解压并重新组合为 WebAssembly 二进制。

