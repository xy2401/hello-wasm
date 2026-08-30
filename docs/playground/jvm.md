---
aside: false
---

# JVM Playground

一份 RISC-V 64 资产同时提供 Java、Kotlin、Groovy、Scala 与 Clojure。各语言示例从工具栏选择，启动容器时只下载一次 JVM 工具链。

<LanguageContainerWorkbench
  title="JVM 工具链"
  toolchain="JDK 25 · Kotlin 2.3 · Groovy 5.1 · Scala 3.3 · Clojure 1.12"
  runtime-id="java"
  :runtime-ids="['java', 'kotlin', 'groovy', 'scala', 'clojure']"
/>

## 包含工具

- OpenJDK、`java`、`javac` 与 JShell
- Kotlin 编译器与 REPL
- Groovy、Groovy Shell
- Scala 编译器与 REPL
- Clojure 与 Clojure CLI 离线基础依赖
