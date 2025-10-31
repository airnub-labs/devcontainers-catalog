FROM ghcr.io/linuxserver/chrome:latest

ENV NODE_ENV=production \
    SIDECAR_AGENT_SERVICE=linux-chrome \
    SIDECAR_AGENT_PORT=4318

RUN apt-get update \
  && apt-get install -y --no-install-recommends nodejs npm \
  && rm -rf /var/lib/apt/lists/*

COPY packages/sidecar-agent/dist /opt/sidecar-agent
COPY services/linux-chrome/entrypoint-with-agent.sh /usr/local/bin/sidecar-agent-entrypoint
RUN chmod +x /usr/local/bin/sidecar-agent-entrypoint

ENTRYPOINT ["/usr/local/bin/sidecar-agent-entrypoint"]
CMD ["/init"]
