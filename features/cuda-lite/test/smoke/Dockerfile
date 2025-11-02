# syntax=docker/dockerfile:1.4
ARG BASE_IMAGE=mcr.microsoft.com/devcontainers/base:ubuntu
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh

RUN /tmp/install.sh
RUN /tmp/install.sh

RUN grep -q 'status=skipped' /usr/local/share/devcontainer/features/cuda-lite/feature-installed.txt
RUN grep -q 'CUDA_AVAILABLE="false"' /etc/profile.d/cuda-lite.sh
