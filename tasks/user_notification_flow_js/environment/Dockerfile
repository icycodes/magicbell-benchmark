FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-api-python-client google-auth && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/magicbell-flow && chmod 0755 /home/user/magicbell-flow

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell Node.js SDK task environment with Node.js v24, requests, and google-api-python-client installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - Node.js v24 for Node.js task execution
#   - always required pip3 packages: pytest-json-ctrf
#   - verification dependencies: requests, google-api-python-client, google-auth
#   - /home/user/magicbell-flow: project directory for the task
