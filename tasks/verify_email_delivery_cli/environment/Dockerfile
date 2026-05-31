FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g magicbell-cli && \
    pip3 install --break-system-packages pytest-json-ctrf google-api-python-client google-auth && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/magicbell-cli-task && chmod 0755 /home/user/magicbell-cli-task

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell CLI task environment with Node.js, MagicBell CLI, and Google API Python client installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - Node.js v24 and magicbell-cli installed globally
#   - python libraries: google-api-python-client, google-auth for Gmail API verification
#   - always required pip3 packages: pytest-json-ctrf
#   - /home/user/magicbell-cli-task: Project directory
