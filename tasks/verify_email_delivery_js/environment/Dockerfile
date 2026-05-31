FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf google-auth google-api-python-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/magicbell-email-delivery && \
    cd /home/user/magicbell-email-delivery && \
    npm init -y

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js and MagicBell environment for verifying email delivery with the Gmail API."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 environment for MagicBell Node.js SDK scripts
#   - google-auth and google-api-python-client installed via pip3 for verifying Gmail API deliveries
#   - /home/user/magicbell-email-delivery: project directory with initialized package.json
