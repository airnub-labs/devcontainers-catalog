# syntax=docker/dockerfile:1.7

# Build-time args make it easy to change Ubuntu or swap base image later.
ARG UBUNTU_VERSION=24.04
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/base:ubuntu-${UBUNTU_VERSION}

FROM ${BASE_IMAGE}

# Keep a trace of chosen Ubuntu in the image:
ARG UBUNTU_VERSION
ENV UBUNTU_VERSION=${UBUNTU_VERSION}

# Best practice: minimal, no Node/Python/PNPM here.
# Add only tiny, broadly-useful tools; remove apt lists after.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates curl git less iproute2 procps gnupg && \
    rm -rf /var/lib/apt/lists/*

# devcontainers/base already provides 'vscode' user with sudo; keep it non-root.
USER vscode
