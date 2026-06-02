FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf PyJWT requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/myproject && \
    cd /home/user/myproject && \
    npm init -y >/dev/null && \
    npm install --no-audit --no-fund --silent jsonwebtoken@9

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js v24 environment with jsonwebtoken pre-installed for generating MagicBell User JWTs."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 + npm (via nodesource) for the task execution environment
#   - pip3 packages required by tests: PyJWT (decode/verify HS256 JWTs), requests (call MagicBell REST API)
#   - /home/user/myproject: pre-initialized npm project with jsonwebtoken installed
