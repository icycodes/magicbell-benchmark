FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf pytest-xprocess requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/myproject && \
    cd /home/user/myproject && \
    cat >package.json <<'EOF'
{
  "name": "github-webhook-receiver",
  "version": "1.0.0",
  "description": "Express app to receive GitHub webhooks and trigger MagicBell broadcasts",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "magicbell-js": "^2.1.0"
  }
}
EOF

# Pre-install dependencies to speed up execution and ensure they are cached
RUN cd /home/user/myproject && npm install

LABEL Author="generate-harbor-tasks"
LABEL Description="Express.js webhook receiver environment with Node.js v24 and magicbell-js installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 for running Express.js applications
#   - python libraries: pytest-xprocess and requests for final-state verification
#   - /home/user/myproject: Express project directory pre-configured with package.json and npm install completed
