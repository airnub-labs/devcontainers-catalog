# syntax=docker/dockerfile:1.4
ARG BASE_IMAGE=ghcr.io/airnub-labs/devcontainer-images/dev-base:latest
FROM ${BASE_IMAGE}

ARG BASE_IMAGE
ARG NODE_MAJOR=24
ARG PYTHON_VERSION=3.12
ARG PNPM_HOME=/home/vscode/.local/share/pnpm
ARG PNPM_STORE_PATH=/home/vscode/.pnpm-store
ARG USERNAME=vscode

ENV PNPM_HOME=${PNPM_HOME}
ENV PNPM_STORE_PATH=${PNPM_STORE_PATH}
ENV PATH=${PNPM_HOME}:${PATH}

LABEL org.opencontainers.image.source="https://github.com/airnub-labs/devcontainers-catalog"
LABEL org.opencontainers.image.description="Web-focused devcontainer image with Node.js, Python, and browser tooling."
LABEL org.opencontainers.image.base.name="${BASE_IMAGE}"

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

RUN set -eux; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      build-essential \
      ca-certificates \
      curl \
      git \
      gnupg \
      python${PYTHON_VERSION%.*} \
      python${PYTHON_VERSION%.*}-distutils \
      python3-pip \
      python3-venv \
      unzip \
      wget \
      xz-utils \
      fonts-liberation \
      libasound2t64 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libatspi2.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libexpat1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libx11-6 \
      libx11-xcb1 \
      libxau6 \
      libxcb1 \
      libxcb-dri3-0 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      libxrender1 \
      libxshmfence1 \
      libxtst6 \
      lsb-release \
      xdg-utils; \
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -; \
    apt-get install -y --no-install-recommends nodejs; \
    corepack enable pnpm; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    install -d -o "${USERNAME}" -g "${USERNAME}" "${PNPM_HOME}" "${PNPM_STORE_PATH}"; \
    su "${USERNAME}" -c "pnpm config set store-dir ${PNPM_STORE_PATH}"

CMD ["/bin/bash"]
