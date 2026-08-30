FROM alpine:3.22

LABEL maintainer="hello-shell"
LABEL description="Minimal Alpine environment for browser container workbench"

# Install absolute minimum
RUN apk add --no-cache \
    coreutils \
    nano \
    && rm -rf /var/cache/apk/*

WORKDIR /workspace

# Set default environment
ENV TERM=xterm-256color \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    SHELL=/bin/sh

# Create welcome banner
RUN printf "\n=======================================================\n  Welcome to hello-shell Minimal Alpine Container\n  Available: ash (sh)\n  Workspace: /workspace\n=======================================================\n\n" > /etc/motd && \
    echo '[ -f /etc/motd ] && cat /etc/motd' >> /root/.profile

CMD ["/bin/sh", "-l"]
