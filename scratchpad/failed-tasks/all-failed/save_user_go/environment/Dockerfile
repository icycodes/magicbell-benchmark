FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang && \
    pip3 install --break-system-packages pytest-json-ctrf requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

LABEL Author="generate-harbor-tasks"
LABEL Description="Go SDK environment for MagicBell save-user task with Go toolchain installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - golang installed via apt for the Go SDK task environment
#   - required pip3 packages: pytest-json-ctrf, requests (used by tests/test_final_state.py to call MagicBell REST API)
#   - /home/user: home directory for the task executor
