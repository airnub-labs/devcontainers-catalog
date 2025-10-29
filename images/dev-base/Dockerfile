# syntax=docker/dockerfile:1.5

ARG BASE_IMAGE_REPOSITORY="mcr.microsoft.com/devcontainers/base"
ARG BASE_IMAGE_VARIANT="ubuntu-24.04"
FROM ${BASE_IMAGE_REPOSITORY}:${BASE_IMAGE_VARIANT}

# Re-declare build arguments for later stages if the Dockerfile is extended.
ARG BASE_IMAGE_REPOSITORY
ARG BASE_IMAGE_VARIANT

ENV DEVCONTAINER_BASE_IMAGE=${BASE_IMAGE_REPOSITORY} \
    DEVCONTAINER_BASE_VARIANT=${BASE_IMAGE_VARIANT}

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

CMD ["/bin/bash"]
