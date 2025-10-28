ARG BASE_IMAGE=ghcr.io/airnub-labs/devcontainer-images/dev-base:latest
FROM ${BASE_IMAGE}

# Pre-seed the Google Chrome repository on amd64 so the chrome-cdp feature can reuse it quickly.
RUN set -eux; \
    install -d /usr/share/keyrings; \
    arch="$(dpkg --print-architecture)"; \
    if [ "$arch" = "amd64" ]; then \
      curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor >/usr/share/keyrings/google-chrome.gpg; \
      echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main' \
        >/etc/apt/sources.list.d/google-chrome.list; \
    else \
      echo "# Google Chrome repo not available for ${arch}" >/etc/apt/sources.list.d/google-chrome.list; \
    fi
