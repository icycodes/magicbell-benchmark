FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep jq && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/magicbell-task

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell CLI task environment with Node.js v24, magicbell-cli, jq, and the Python requests library for verification."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - jq for parsing CLI JSON output
#   - Node.js v24 and magicbell-cli installed globally via npm
#   - requests installed via pip3 for final state MagicBell REST verification
#   - /home/user/magicbell-task: MagicBell task directory
