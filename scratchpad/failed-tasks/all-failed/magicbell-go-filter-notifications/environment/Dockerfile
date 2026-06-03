FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang-go && \
    pip3 install --break-system-packages pytest-json-ctrf PyJWT requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-task && \
    cd /home/user/magicbell-task && \
    go mod init magicbell-task

LABEL Author="generate-harbor-tasks"
LABEL Description="Go environment for MagicBell Go SDK task."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - golang-go installed via apt-get for Go tasks
#   - PyJWT, requests installed via pip3 for verification tests
#   - /home/user/magicbell-task: pre-initialized Go module directory
