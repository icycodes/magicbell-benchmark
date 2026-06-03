FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf google-api-python-client google-auth-httplib2 google-auth-oauthlib && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-nodejs-custom-template && \
    cd /home/user/magicbell-nodejs-custom-template && \
    npm init -y && \
    npm install magicbell-js

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment for MagicBell broadcast with custom email template"

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 for running the script
#   - Python packages for Gmail API verification: google-api-python-client google-auth-httplib2 google-auth-oauthlib
#   - /home/user/magicbell-nodejs-custom-template: project directory with magicbell-js installed
