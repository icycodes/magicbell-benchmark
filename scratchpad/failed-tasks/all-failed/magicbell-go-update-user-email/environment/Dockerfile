FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep \
        golang-go && \
    pip3 install --break-system-packages pytest-json-ctrf requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/magicbell-go-update-user-email

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell Go SDK task environment for updating a user email address."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - golang-go for Go SDK execution
#   - always required pip3 packages: pytest-json-ctrf
#   - pip3 packages for testing: requests
#   - /home/user/magicbell-go-update-user-email: project directory
