FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf PyJWT requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/myproject && chmod 0755 /home/user/myproject

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js v24 and Python environment for the MagicBell mark_notification_read_js task. The verifier mints a fresh User JWT (PyJWT, HS256) and queries the MagicBell v2 notifications endpoint to confirm read_at is set."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Node.js v24 + npm (via nodesource) for running the magicbell-js project-client and user-client scripts
#   - pip3 packages required by tests: PyJWT (mint HS256 User JWT for verification), requests (call MagicBell REST API)
#   - /home/user: user home directory
#   - /home/user/myproject: target project directory for the Node.js script and output.log
