FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user/task && chmod 0755 /home/user/task && \
    cd /home/user/task && \
    npm init -y && \
    npm install magicbell-js

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment with magicbell-js and magicbell-cli for deleting a workflow definition."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24
#   - magicbell-cli installed globally
#   - /home/user/task: initialized Node.js project directory with magicbell-js installed
