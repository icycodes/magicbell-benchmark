FROM ubuntu:24.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep golang && \
    pip3 install --break-system-packages pytest-json-ctrf requests google-api-python-client google-auth-httplib2 google-auth-oauthlib && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user && chmod 0755 /home/user

RUN mkdir -p /home/user/myproject && \
    cd /home/user/myproject && \
    go mod init myproject && \
    go get github.com/magicbell/magicbell-go

LABEL Author="generate-harbor-tasks"
LABEL Description="MagicBell Go workflow email delivery task environment with Go and Python dependencies installed."

CMD ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Container contents:
#   - always required apt packages: curl wget ca-certificates git python3 python3-pip python3-pytest bash ripgrep
#   - Go compiler and tools installed via golang apt package
#   - always required pip3 packages: pytest-json-ctrf
#   - verification pip3 packages: requests, google-api-python-client, google-auth-httplib2, google-auth-oauthlib
#   - /home/user/myproject: initialized Go module pre-configured with github.com/magicbell/magicbell-go SDK
