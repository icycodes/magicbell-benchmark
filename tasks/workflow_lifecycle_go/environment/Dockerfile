FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-api-python-client google-auth && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

LABEL Author="generate-harbor-tasks"
LABEL Description="Go workflow lifecycle task environment with Go compiler, MagicBell SDK compatibility, and Gmail API client libraries."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - golang: Go compiler for compiling and running the Go solution
#   - always required pip3 packages: pytest-json-ctrf
#   - additional pip3 packages: requests, google-api-python-client, google-auth (for final state verification)
#   - /home/user: home directory for task execution
