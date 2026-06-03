FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf requests PyJWT && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-task && \
    cd /home/user/magicbell-task && \
    cat >package.json <<'EOF'
{
  "name": "magicbell-task",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "magicbell-js": "^1.7.0"
  }
}
EOF

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment with MagicBell CLI and Python test dependencies."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 installed
#   - magicbell-cli installed globally via npm
#   - requests and PyJWT installed via pip3 for testing
#   - /home/user/magicbell-task: task directory with a pre-configured package.json