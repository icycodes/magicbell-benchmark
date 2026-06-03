FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-nodejs-list-inbox-tokens && \
    cd /home/user/magicbell-nodejs-list-inbox-tokens && \
    npm init -y && \
    npm install magicbell-js jsonwebtoken

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell Node.js UserClient task environment with Node v24, magicbell-js, and jsonwebtoken installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 for the Node.js task environment
#   - requests installed via pip3 for test_final_state.py API verification
#   - /home/user/magicbell-nodejs-list-inbox-tokens: directory for the project, initialized with npm packages
