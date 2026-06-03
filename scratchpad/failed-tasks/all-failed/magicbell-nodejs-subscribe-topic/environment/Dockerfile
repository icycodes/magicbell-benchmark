FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-api-python-client google-auth-httplib2 google-auth-oauthlib && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/myproject && \
    cd /home/user/myproject && \
    npm init -y && \
    npm install magicbell-js tslib jsonwebtoken

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment with magicbell-js and jsonwebtoken pre-installed for MagicBell topic subscription."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - test dependencies: requests google-api-python-client google-auth-httplib2 google-auth-oauthlib
#   - Node.js v24
#   - /home/user/myproject: pre-initialized Node project with magicbell-js, tslib, and jsonwebtoken
