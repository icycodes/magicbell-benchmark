FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep && \
    pip3 install --break-system-packages pytest-json-ctrf PyJWT requests && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user
RUN mkdir -p /home/user/myproject && chmod 0755 /home/user/myproject

LABEL Author="generate-harbor-tasks"
LABEL Description="Python environment for the MagicBell generate_user_jwt_python task. Includes PyJWT and requests for signing the User JWT and calling MagicBell REST APIs."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - always required pip3 packages: pytest-json-ctrf
#   - Python libraries for the task and verifier: PyJWT (HS256 sign/verify), requests (MagicBell REST API calls)
#   - /home/user: user home directory
#   - /home/user/myproject: target project directory for the Python script and output.log
