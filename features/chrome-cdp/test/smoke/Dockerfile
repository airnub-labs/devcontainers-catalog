# syntax=docker/dockerfile:1.4
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/base:ubuntu
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh

RUN /tmp/install.sh
RUN /tmp/install.sh

RUN if command -v google-chrome >/dev/null 2>&1; then \
      google-chrome --version; \
    else \
      chromium --version; \
    fi
