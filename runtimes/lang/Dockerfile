FROM alpine:3.23

ARG RUNTIME
ARG OPENJDK25_PACKAGE=25.0.4_p7-r0
ARG KOTLIN_VERSION=2.3.20
ARG KOTLIN_SHA256=222ba516cdc4052ce0be9d2ec6adf3c5c64fc53156d7dd91d1f5317809431b98
ARG GROOVY_VERSION=5.1.0
ARG GROOVY_SHA256=c0d709a36d95a5576e06c5d2163d86f747d0006b12b499d7c198943288102f40
ARG SCALA_VERSION=3.3.8
ARG SCALA_SHA256=17a03dd9c2a790b4230a7d03b741cdedca6514096e50e7189bc5e2d299db250a
ARG CLOJURE_TOOLS_VERSION=1.12.5.1664
ARG CLOJURE_TOOLS_SHA256=77dd6868948074adcc93e83a796f8e8f15a1a92bcb1b9002d715fd2210e476f3

ENV HELLO_LANG_RUNTIME=${RUNTIME} \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    NODE_PATH=/opt/node-tools/node_modules \
    PATH=/opt/kotlinc/bin:/opt/groovy/bin:/opt/scala/bin:/opt/node-tools/node_modules/.bin:${PATH}

COPY runtimes/lang/node/package.json runtimes/lang/node/package-lock.json /opt/node-tools/
COPY runtimes/lang/node/pug-build.mjs /usr/local/bin/pug-build

RUN apk add --no-cache \
      bash ca-certificates coreutils file findutils gawk git grep jq less nano sed tree \
    && case "${RUNTIME}" in \
      jvm) \
        apk add --no-cache curl "openjdk25-jdk=${OPENJDK25_PACKAGE}" rlwrap tar unzip \
        && curl -fsSL "https://github.com/JetBrains/kotlin/releases/download/v${KOTLIN_VERSION}/kotlin-compiler-${KOTLIN_VERSION}.zip" -o /tmp/kotlin.zip \
        && echo "${KOTLIN_SHA256}  /tmp/kotlin.zip" | sha256sum -c - \
        && unzip -q /tmp/kotlin.zip -d /opt \
        && curl -fsSL "https://archive.apache.org/dist/groovy/${GROOVY_VERSION}/distribution/apache-groovy-binary-${GROOVY_VERSION}.zip" -o /tmp/groovy.zip \
        && echo "${GROOVY_SHA256}  /tmp/groovy.zip" | sha256sum -c - \
        && unzip -q /tmp/groovy.zip -d /opt \
        && ln -s "/opt/groovy-${GROOVY_VERSION}" /opt/groovy \
        && curl -fsSL "https://github.com/scala/scala3/releases/download/${SCALA_VERSION}/scala3-${SCALA_VERSION}.tar.gz" -o "/tmp/scala3-${SCALA_VERSION}.tar.gz" \
        && echo "${SCALA_SHA256}  /tmp/scala3-${SCALA_VERSION}.tar.gz" | sha256sum -c - \
        && tar -xzf "/tmp/scala3-${SCALA_VERSION}.tar.gz" -C /opt \
        && ln -s "/opt/scala3-${SCALA_VERSION}" /opt/scala \
        && curl -fsSL "https://github.com/clojure/brew-install/releases/download/${CLOJURE_TOOLS_VERSION}/clojure-tools-${CLOJURE_TOOLS_VERSION}.tar.gz" -o /tmp/clojure.tar.gz \
        && echo "${CLOJURE_TOOLS_SHA256}  /tmp/clojure.tar.gz" | sha256sum -c - \
        && tar -xzf /tmp/clojure.tar.gz -C /tmp \
        && mkdir -p /usr/local/lib/clojure/libexec /usr/local/share/man/man1 \
        && install -m644 /tmp/clojure-tools/deps.edn /usr/local/lib/clojure/deps.edn \
        && install -m644 /tmp/clojure-tools/example-deps.edn /usr/local/lib/clojure/example-deps.edn \
        && install -m644 /tmp/clojure-tools/tools.edn /usr/local/lib/clojure/tools.edn \
        && install -m644 /tmp/clojure-tools/exec.jar /usr/local/lib/clojure/libexec/exec.jar \
        && install -m644 "/tmp/clojure-tools/clojure-tools-${CLOJURE_TOOLS_VERSION}.jar" "/usr/local/lib/clojure/libexec/clojure-tools-${CLOJURE_TOOLS_VERSION}.jar" \
        && sed -i 's@PREFIX@/usr/local/lib/clojure@g' /tmp/clojure-tools/clojure \
        && sed -i 's@BINDIR@/usr/local/bin@g' /tmp/clojure-tools/clj \
        && install -m755 /tmp/clojure-tools/clojure /usr/local/bin/clojure \
        && install -m755 /tmp/clojure-tools/clj /usr/local/bin/clj \
        && install -m644 /tmp/clojure-tools/clojure.1 /usr/local/share/man/man1/clojure.1 \
        && install -m644 /tmp/clojure-tools/clj.1 /usr/local/share/man/man1/clj.1 \
        && mkdir -p /workspace \
        && printf '{:deps {org.clojure/clojure {:mvn/version "1.12.5"}}}\n' > /workspace/deps.edn \
        && cd /workspace && clojure -P \
        && rm -rf /tmp/kotlin.zip /tmp/groovy.zip* /tmp/scala* /tmp/clojure* ;; \
      node) \
        apk add --no-cache nodejs npm \
        && npm ci --prefix /opt/node-tools --omit=dev --ignore-scripts \
        && chmod +x /usr/local/bin/pug-build \
        && npm cache clean --force ;; \
      python) apk add --no-cache python3 py3-pip ;; \
      cpp) apk add --no-cache build-base clang cmake ;; \
      go) apk add --no-cache go ;; \
      rust) apk add --no-cache cargo rust ;; \
      php) apk add --no-cache php84 && ln -sf /usr/bin/php84 /usr/local/bin/php ;; \
      ruby) apk add --no-cache ruby ruby-bundler ;; \
      *) echo "Unsupported RUNTIME=${RUNTIME}" >&2; exit 64 ;; \
    esac \
    && printf '%s\n' \
      '#!/bin/sh' \
      'set -e' \
      'case "$HELLO_LANG_RUNTIME" in' \
      '  jvm)' \
      '    java --version 2>&1 | head -n 1' \
      '    kotlinc -version 2>&1' \
      '    groovy --version' \
      '    scala -version 2>&1' \
      '    clojure --version' \
      '    clojure -M -e '\''(println "Clojure" (clojure-version))'\''' \
      '    ;;' \
      '  node)' \
      '    printf "Node %s\\n" "$(node --version)"' \
      '    node -e "const fs=require(\"node:fs\"); const root=\"/opt/node-tools/node_modules\"; for (const item of [[\"TypeScript\",\"typescript\"],[\"Pug\",\"pug\"],[\"html-validate\",\"html-validate\"],[\"Sass\",\"sass\"],[\"PostCSS\",\"postcss\"],[\"postcss-cli\",\"postcss-cli\"],[\"Autoprefixer\",\"autoprefixer\"],[\"Stylelint\",\"stylelint\"]]) console.log(item[0]+\" \"+JSON.parse(fs.readFileSync(root+\"/\"+item[1]+\"/package.json\",\"utf8\")).version)"' \
      '    ;;' \
      '  python) python3 --version ;;' \
      '  cpp) gcc --version | head -n 1 ;;' \
      '  go) go version ;;' \
      '  rust) rustc --version ;;' \
      '  php) php --version | head -n 1 ;;' \
      '  ruby) ruby --version ;;' \
      'esac' > /usr/local/bin/hello-lang-version \
    && chmod +x /usr/local/bin/hello-lang-version \
    && printf '%s\n' \
      'export PATH="/opt/kotlinc/bin:/opt/groovy/bin:/opt/scala/bin:/opt/node-tools/node_modules/.bin:$PATH"' \
      'export NODE_PATH="/opt/node-tools/node_modules"' \
      'export PS1="lang-rv64:\\w$ "' \
      'cd /workspace' > /etc/profile.d/hello-lang.sh \
    && mkdir -p /workspace

WORKDIR /workspace
CMD ["/bin/bash", "-l"]
