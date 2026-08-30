FROM alpine:3.22

LABEL maintainer="hello-shell"
LABEL description="Prebuilt multi-shell & Python environment for browser container workbench"

# Install essential Shells, Python, and Unix tooling
RUN apk add --no-cache \
    bash \
    zsh \
    fish \
    elvish \
    dash \
    mksh \
    yash \
    oksh \
    tcsh \
    ion-shell \
    python3 \
    py3-pip \
    jq \
    coreutils \
    util-linux \
    diffutils \
    grep \
    sed \
    gawk \
    curl \
    wget \
    tree \
    less \
    nano \
    tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /workspace

# Set default environment
ENV TERM=xterm-256color \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    SHELL=/bin/bash

# Create welcome banner
RUN echo '[ -f /etc/motd ] && cat /etc/motd' >> /root/.bashrc && \
    echo '[ -f /etc/motd ] && cat /etc/motd' >> /root/.zshrc && \
    mkdir -p /root/.config/fish && \
    echo 'if test -f /etc/motd; cat /etc/motd; end' >> /root/.config/fish/config.fish && \
    printf "\n=======================================================\n  Welcome to hello-shell Browser Multi-Shell Container\n  Available Shells: ash, bash, zsh, fish, elvish, dash, mksh, yash, oksh, tcsh, ion, python3\n  Workspace: /workspace\n=======================================================\n\n" > /etc/motd

CMD ["/bin/bash", "-l"]
