FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        golang && \
    pip3 install --break-system-packages pytest-json-ctrf requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user/go-task && chmod 0755 /home/user/go-task && \
    cd /home/user/go-task && \
    go mod init go-task && \
    go get github.com/magicbell/magicbell-go

LABEL Author="generate-harbor-tasks"
LABEL Description="Go environment for fetching MagicBell user."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - golang installed via apt-get
#   - requests installed via pip3 for testing
#   - /home/user/go-task: Go project directory initialized with magicbell-go module
