FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang && \
    pip3 install --break-system-packages pytest-json-ctrf requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-go && \
    cd /home/user/magicbell-go && \
    go mod init magicbell-go

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell Go SDK workflow management task environment."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - golang installed via apt-get for Go SDK task
#   - requests installed via pip3 for test_final_state.py API verification
#   - /home/user/magicbell-go: project directory with initialized go module
