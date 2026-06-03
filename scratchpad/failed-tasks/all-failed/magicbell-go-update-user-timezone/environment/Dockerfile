FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        golang && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/app && \
    cd /home/user/app && \
    go mod init app && \
    go get github.com/magicbell/magicbell-go

LABEL Author="generate-harbor-tasks"
LABEL Description="Go environment with MagicBell SDK and CLI installed for timezone update task."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - golang for compiling and running Go code
#   - Node.js v24 and magicbell-cli for verification
#   - /home/user/app: Go project directory initialized with github.com/magicbell/magicbell-go
