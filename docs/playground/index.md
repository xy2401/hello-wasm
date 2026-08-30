# Playground

每个页面对应一份实际发布的 RISC-V 64 运行时资产。打开页面不会下载容器；只有点击“启动容器”后，才会读取 manifest、校验 gzip 分片并启动环境。

## Lang

- [JVM](/playground/jvm)：Java、Kotlin、Groovy、Scala、Clojure，共用 OpenJDK 与 JVM 工具链。
- [Node](/playground/node)：JavaScript、TypeScript、Pug、Sass、PostCSS 与前端验证工具。
- [Python](/playground/python)：CPython 与 pip。
- [C & C++](/playground/cpp)：GCC、G++ 与 Clang。
- [Go](/playground/go)：Go 编译器与基础工具链。
- [Rust](/playground/rust)：rustc 与 Cargo。
- [PHP](/playground/php)：PHP CLI。
- [Ruby](/playground/ruby)：Ruby、RubyGems 与 Bundler。

JVM 和 Node 内部包含多门语言或工程工具，但下载时始终是一份物理资产，因此不再拆成重复页面。C# 当前没有可验证的 Linux RISC-V 64 SDK，不生成空实验页。
