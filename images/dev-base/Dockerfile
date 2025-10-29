# syntax=docker/dockerfile:1.4
ARG BASE_REGISTRY=mcr.microsoft.com/devcontainers/base
ARG BASE_VARIANT=ubuntu-24.04
FROM ${BASE_REGISTRY}:${BASE_VARIANT}

ARG BASE_REGISTRY
ARG BASE_VARIANT

LABEL org.opencontainers.image.source="https://github.com/airnub-labs/devcontainers-catalog"
LABEL org.opencontainers.image.description="Lean Ubuntu base image for Airnub devcontainers."

ENV AIRNUB_DEVCONTAINER_BASE_IMAGE="${BASE_REGISTRY}:${BASE_VARIANT}"

CMD ["/bin/bash"]
