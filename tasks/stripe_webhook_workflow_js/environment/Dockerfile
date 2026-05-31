FROM ubuntu:24.04

# Install basic development tools and Node.js v24
RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-api-python-client google-auth pytest-xprocess && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up user directory
RUN mkdir -p /home/user && chmod 0755 /home/user

# Create and pre-initialize the Express project directory
RUN mkdir -p /home/user/stripe-webhook-app && \
    cd /home/user/stripe-webhook-app && \
    cat >package.json <<'EOF'
{
  "name": "stripe-webhook-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "magicbell-js": "^1.0.3"
  }
}
EOF

# Pre-install npm dependencies to make task execution faster and robust
RUN cd /home/user/stripe-webhook-app && npm install

LABEL Author="generate-harbor-tasks"
LABEL Description="Node.js environment with Express and magicbell-js pre-installed for Stripe webhook tasks."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - Node.js v24
#   - always required pip3 packages: pytest-json-ctrf, requests, google-api-python-client, google-auth, pytest-xprocess
#   - /home/user/stripe-webhook-app: pre-configured Express project with magicbell-js dependency pre-installed
