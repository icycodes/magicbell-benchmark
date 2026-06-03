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

RUN mkdir -p /home/user/magicbell-task && \
    cd /home/user/magicbell-task && \
    cat >package.json <<'EOF'
{
  "name": "magicbell-task",
  "version": "1.0.0",
  "description": "MagicBell Task",
  "main": "index.js",
  "dependencies": {
    "magicbell-js": "^2.0.0"
  }
}
EOF

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment for fetching MagicBell system events."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - requests pip3 package for verification
#   - Node.js v24 installed
#   - /home/user/magicbell-task: task directory with package.json containing magicbell-js dependency
