# syntax=docker/dockerfile:1.7

ARG UBUNTU_VERSION=24.04
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/base:ubuntu-${UBUNTU_VERSION}

FROM ${BASE_IMAGE}

ARG UBUNTU_VERSION
ENV UBUNTU_VERSION=${UBUNTU_VERSION}

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
