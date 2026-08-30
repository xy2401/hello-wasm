export type LanguageRuntimeId =
  | 'java' | 'javascript' | 'typescript' | 'python' | 'cpp' | 'go' | 'rust'
  | 'csharp' | 'kotlin' | 'groovy' | 'scala' | 'clojure' | 'php' | 'ruby' | 'html' | 'css'

export interface LanguageRuntimeExample {
  title: string
  command: string
}

export interface LanguageContainerRuntime {
  id: LanguageRuntimeId
  assetId: 'jvm' | 'node' | 'python' | 'cpp' | 'go' | 'rust' | 'php' | 'ruby' | 'csharp'
  name: string
  baseline: string
  command: string
  supported: boolean
  note?: string
  examples: LanguageRuntimeExample[]
}

export const languageContainerRuntimes: LanguageContainerRuntime[] = [
  { id: 'java', assetId: 'jvm', name: 'Java', baseline: 'OpenJDK 25 LTS', command: 'java --version', supported: true, examples: [
    { title: '版本', command: 'java --version && javac --version' },
    { title: '编译运行', command: `printf 'class Hello { public static void main(String[] a) { System.out.println("Hello Java"); } }\n' > Hello.java\njavac Hello.java && java Hello` },
    { title: 'JShell', command: 'jshell' },
  ] },
  { id: 'javascript', assetId: 'node', name: 'JavaScript', baseline: 'Node.js 24 LTS', command: 'node --version', supported: true, examples: [
    { title: '版本', command: 'node --version && npm --version' },
    { title: '运行文件', command: `printf 'console.log("Hello JavaScript", process.arch)\n' > hello.js\nnode hello.js` },
    { title: 'REPL', command: 'node' },
  ] },
  { id: 'typescript', assetId: 'node', name: 'TypeScript', baseline: 'Node.js 24 LTS + TypeScript', command: 'tsc --version', supported: true, examples: [
    { title: '版本', command: 'node --version && tsc --version' },
    { title: '编译运行', command: `printf 'const message: string = "Hello TypeScript"; console.log(message);\n' > hello.ts\ntsc hello.ts && node hello.js` },
    { title: '类型检查', command: `printf 'const count: number = "wrong";\n' > check.ts\ntsc --noEmit check.ts` },
  ] },
  { id: 'python', assetId: 'python', name: 'Python', baseline: 'CPython（Alpine 稳定线）', command: 'python3 --version', supported: true, examples: [
    { title: '版本', command: 'python3 --version && pip3 --version' },
    { title: '运行文件', command: `printf 'import platform\nprint("Hello Python", platform.machine())\n' > hello.py\npython3 hello.py` },
    { title: 'REPL', command: 'python3' },
  ] },
  { id: 'cpp', assetId: 'cpp', name: 'C & C++', baseline: 'GCC / Clang（Alpine 稳定线）', command: 'g++ --version | head -n 1', supported: true, examples: [
    { title: '版本', command: 'gcc --version | head -n 1; clang --version | head -n 1' },
    { title: '编译 C', command: `printf '#include <stdio.h>\nint main(void){puts("Hello C");}\n' > hello.c\ngcc hello.c -o hello-c && ./hello-c` },
    { title: '编译 C++', command: `printf '#include <iostream>\nint main(){std::cout << "Hello C++\\n";}\n' > hello.cpp\ng++ -std=c++23 hello.cpp -o hello-cpp && ./hello-cpp` },
  ] },
  { id: 'go', assetId: 'go', name: 'Go', baseline: 'Go（Alpine 受支持稳定线）', command: 'go version', supported: true, examples: [
    { title: '版本', command: 'go version' },
    { title: '运行文件', command: `printf 'package main\nimport ("fmt"; "runtime")\nfunc main(){fmt.Println("Hello Go", runtime.GOARCH)}\n' > hello.go\ngo run hello.go` },
    { title: '编译产物', command: 'go build -o hello-go hello.go && file hello-go && ./hello-go' },
  ] },
  { id: 'rust', assetId: 'rust', name: 'Rust', baseline: 'Rust stable + Cargo', command: 'rustc --version', supported: true, examples: [
    { title: '版本', command: 'rustc --version && cargo --version' },
    { title: '编译运行', command: `printf 'fn main() { println!("Hello Rust {}", std::env::consts::ARCH); }\n' > hello.rs\nrustc hello.rs && ./hello` },
    { title: '新建项目', command: 'cargo new hello-cargo && cd hello-cargo && cargo run' },
  ] },
  { id: 'csharp', assetId: 'csharp', name: 'C#', baseline: '.NET 10 LTS', command: 'dotnet --info', supported: false,
    note: '.NET 10 当前没有可验证的 Linux riscv64 SDK 软件包。本实验台不使用 x64 模拟回退。', examples: [] },
  { id: 'kotlin', assetId: 'jvm', name: 'Kotlin', baseline: 'Kotlin 2.3.20 + OpenJDK 25 LTS', command: 'kotlinc -version', supported: true, examples: [
    { title: '版本', command: 'java --version && kotlinc -version' },
    { title: '编译运行', command: `printf 'fun main() = println("Hello Kotlin " + System.getProperty("os.arch"))\n' > hello.kt\nkotlinc hello.kt -include-runtime -d hello.jar && java -jar hello.jar` },
    { title: 'REPL', command: 'kotlinc-jvm' },
  ] },
  { id: 'groovy', assetId: 'jvm', name: 'Groovy', baseline: 'Groovy 5.1 + OpenJDK 25 LTS', command: 'groovy --version', supported: true, examples: [
    { title: '版本', command: 'java --version && groovy --version' },
    { title: '运行脚本', command: `printf 'println "Hello Groovy \${System.getProperty("os.arch")}"\n' > hello.groovy\ngroovy hello.groovy` },
    { title: '交互环境', command: 'groovysh' },
  ] },
  { id: 'scala', assetId: 'jvm', name: 'Scala', baseline: 'Scala 3.3 LTS + OpenJDK 25 LTS', command: 'scala -version', supported: true, examples: [
    { title: '版本', command: 'java --version && scala -version && scalac -version' },
    { title: '编译运行', command: `printf '@main def hello() = println("Hello Scala " + System.getProperty("os.arch"))\n' > hello.scala\nscalac hello.scala && scala hello` },
    { title: 'REPL', command: 'scala' },
  ] },
  { id: 'clojure', assetId: 'jvm', name: 'Clojure', baseline: 'Clojure 1.12.5 + CLI 1.12.5.1664 + OpenJDK 25.0.4', command: `clojure -M -e '(println (clojure-version))'`, supported: true, examples: [
    { title: '版本', command: `java --version && clojure --version && clojure -M -e '(println (clojure-version))'` },
    { title: '运行表达式', command: `clojure -M -e '(println "Hello Clojure" (System/getProperty "os.arch"))'` },
    { title: 'REPL', command: 'clojure' },
  ] },
  { id: 'php', assetId: 'php', name: 'PHP', baseline: 'PHP 8.4（Alpine 3.23 稳定线）', command: 'php --version | head -n 1', supported: true, examples: [
    { title: '版本', command: 'php --version | head -n 1' },
    { title: '运行文件', command: `printf '<?php echo "Hello PHP ", php_uname("m"), PHP_EOL;\n' > hello.php\nphp hello.php` },
    { title: '交互模式', command: 'php -a' },
  ] },
  { id: 'ruby', assetId: 'ruby', name: 'Ruby', baseline: 'Ruby 3.4 stable', command: 'ruby --version', supported: true, examples: [
    { title: '版本', command: 'ruby --version && gem --version' },
    { title: '运行文件', command: `printf 'puts "Hello Ruby #{RUBY_PLATFORM}"\n' > hello.rb\nruby hello.rb` },
    { title: 'IRB', command: 'irb' },
  ] },
  { id: 'html', assetId: 'node', name: 'HTML', baseline: 'Node.js 24 LTS + Pug + html-validate', command: 'pug-build --version', supported: true, examples: [
    { title: '工具版本', command: 'node --version && pug-build --version && html-validate --version' },
    { title: 'Pug 构建', command: `printf 'doctype html\nhtml(lang="zh-CN")\n  head\n    title Hello\n  body\n    h1 Hello HTML\n' > index.pug\npug-build index.pug dist/index.html && html-validate dist/index.html && cat dist/index.html` },
    { title: '原生 HTML', command: `printf '<!doctype html><html lang="zh-CN"><title>Hello</title><h1>Hello HTML</h1></html>\n' > index.html\nhtml-validate index.html` },
  ] },
  { id: 'css', assetId: 'node', name: 'CSS', baseline: 'Node.js 24 LTS + Sass + PostCSS + Stylelint', command: 'sass --version', supported: true, examples: [
    { title: '工具版本', command: 'node --version && sass --version && postcss --version && stylelint --version' },
    { title: 'SCSS 构建', command: `printf '$accent: #336699;\n.box { color: $accent; display: flex; }\n' > style.scss\nsass style.scss style.css && postcss style.css --use autoprefixer -o dist/style.css && cat dist/style.css` },
    { title: '制造错误', command: `printf 'body { color: #12zz99; }\n' > broken.css\nstylelint broken.css` },
  ] },
]

export function languageContainerRuntime(id: LanguageRuntimeId) {
  return languageContainerRuntimes.find((runtime) => runtime.id === id)
}
