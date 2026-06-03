FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/magicbell-go-delete-user && \
    cd /home/user/magicbell-go-delete-user && \
    go mod init magicbell-go-delete-user

LABEL Author="generate-harbor-tasks"
LABEL Description="Task environment for deleting a MagicBell user via Go SDK. Includes Go, Node.js, and MagicBell CLI."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - golang: for Go SDK execution
#   - Node.js v24 & magicbell-cli: for task verification and environment setup
#   - /home/user/magicbell-go-delete-user: project directory with go.mod initialized
