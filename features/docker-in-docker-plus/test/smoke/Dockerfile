# syntax=docker/dockerfile:1.4
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/docker:1
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh

RUN /tmp/install.sh
RUN /tmp/install.sh

RUN docker buildx version
