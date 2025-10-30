# syntax=docker/dockerfile:1.7

ARG BASE_TAG="ubuntu-24.04"
ARG BASE_IMAGE="ghcr.io/airnub-labs/devcontainer-images/dev-base:${BASE_TAG}"
ARG GIT_SHA="dev"

FROM ${BASE_IMAGE}

ARG BASE_TAG
ARG BASE_IMAGE
ARG GIT_SHA

LABEL org.opencontainers.image.source="https://github.com/airnub-labs/devcontainers-catalog" \
      org.opencontainers.image.description="Thin web base with cached Chrome repo" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      io.airnub.base_image="${BASE_IMAGE}" \
      io.airnub.base_tag="${BASE_TAG}"

# Pre-seed the Google Chrome repository on amd64 so the chrome-cdp feature can reuse it quickly.
USER root
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
USER vscode
