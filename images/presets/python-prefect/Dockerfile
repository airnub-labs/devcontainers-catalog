# syntax=docker/dockerfile:1.7

ARG BASE_IMAGE="ghcr.io/airnub-labs/devcontainer-images/dev-base:ubuntu-24.04"
ARG GIT_SHA="dev"

FROM ${BASE_IMAGE}

ARG BASE_IMAGE
ARG GIT_SHA

LABEL org.opencontainers.image.source="https://github.com/airnub-labs/devcontainers-catalog" \
      org.opencontainers.image.description="airnub preset: python + prefect" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      io.airnub.base_image="${BASE_IMAGE}" \
      io.airnub.preset="python-prefect"
