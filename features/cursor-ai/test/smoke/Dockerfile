# syntax=docker/dockerfile:1.4
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/javascript-node:1-22-bullseye
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

RUN npm install -g pnpm@latest

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh

RUN /tmp/install.sh
RUN /tmp/install.sh

RUN cursor --version
