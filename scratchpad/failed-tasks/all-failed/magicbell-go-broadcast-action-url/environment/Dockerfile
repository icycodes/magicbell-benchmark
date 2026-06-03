FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang-go && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-auth google-api-python-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/project && \
    cd /home/user/project && \
    go mod init project

LABEL Author="generate-harbor-tasks"
LABEL Description="Go task environment for MagicBell SDK broadcast creation with action URL."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - golang-go installed via apt-get for Go task environment
#   - python dependencies for verification: requests google-auth google-api-python-client
#   - /home/user/project: project directory initialized with go mod
