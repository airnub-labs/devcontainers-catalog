FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ARG NODE_VERSION=24
ENV NODE_VERSION=${NODE_VERSION}
ENV PNPM_HOME=/home/vscode/.local/share/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      ca-certificates \
      curl \
      git \
      gnupg \
      python3 \
      python3-pip \
      python3-venv \
      unzip \
      wget \
      xz-utils \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libatspi2.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libexpat1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libx11-6 \
      libx11-xcb1 \
      libxau6 \
      libxcb1 \
      libxcb-dri3-0 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      libxrender1 \
      libxshmfence1 \
      libxtst6 \
      lsb-release \
      xdg-utils \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && corepack enable pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p "${PNPM_HOME}" && chown -R vscode:vscode "${PNPM_HOME}"

USER vscode
RUN pnpm config set store-dir /home/vscode/.pnpm-store
USER root

CMD ["/bin/bash"]
