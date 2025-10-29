# syntax=docker/dockerfile:1.7

ARG UBUNTU_VERSION=24.04
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/base:ubuntu-${UBUNTU_VERSION}

FROM ${BASE_IMAGE}

ARG UBUNTU_VERSION
ARG BASE_IMAGE
LABEL org.opencontainers.image.source="https://github.com/airnub-labs/devcontainers-catalog" \
      org.opencontainers.image.description="Thin wrapper on devcontainers/base with overridable build args" \
      org.opencontainers.image.licenses="MIT" \
      io.airnub.base_image="${BASE_IMAGE}" \
      io.airnub.ubuntu_version="${UBUNTU_VERSION}"
ENV UBUNTU_VERSION=${UBUNTU_VERSION}

SHELL ["/bin/bash", "-lc"]

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      gnupg \
      iproute2 \
      less \
      procps && \
    rm -rf /var/lib/apt/lists/*

USER vscode
