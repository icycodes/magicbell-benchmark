FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-auth google-auth-httplib2 google-auth-oauthlib google-api-python-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-unsubscribe && \
    cd /home/user/magicbell-unsubscribe && \
    npm init -y && \
    npm install magicbell-js jsonwebtoken

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment for MagicBell unsubscribe task, pre-installed with magicbell-js and jsonwebtoken."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - additional pip3 packages for verification: requests google-auth google-auth-httplib2 google-auth-oauthlib google-api-python-client
#   - Node.js v24 installed
#   - /home/user/magicbell-unsubscribe: project directory initialized with package.json, magicbell-js, and jsonwebtoken
