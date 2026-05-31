FROM ubuntu:24.04

# Install system packages, Node.js v24, MagicBell CLI, and Python packages
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf requests PyJWT && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up user directory and project directory
RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/myproject

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell CLI task environment with Node.js v24, magicbell-cli, and required python verifier dependencies."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 for running and installing magicbell-cli
#   - magicbell-cli installed globally via npm
#   - python verifier libraries: requests, PyJWT
#   - /home/user/myproject: project directory
