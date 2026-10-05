FROM alpine:3.22

LABEL maintainer="hello-shell"
LABEL description="Prebuilt PowerShell environment for browser container workbench"

# Install PowerShell and essential tooling
RUN apk add --no-cache \
    bash \
    powershell \
    coreutils \
    util-linux \
    curl \
    wget \
    tree \
    nano \
    && rm -rf /var/cache/apk/*

WORKDIR /workspace

# Set default environment
ENV TERM=xterm-256color \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    SHELL=/usr/bin/pwsh

RUN echo '[ -f /etc/motd ] && cat /etc/motd' >> /root/.bashrc && \
    printf "\n=======================================================\n  Welcome to hello-shell PowerShell Container\n  Available: pwsh\n  Workspace: /workspace\n=======================================================\n\n" > /etc/motd

# The pwsh entrypoint
CMD ["/usr/bin/pwsh", "-NoLogo"]
