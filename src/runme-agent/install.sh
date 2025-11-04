#!/usr/bin/env bash
set -euo pipefail

ARCH="$(uname -m)"
case "${ARCH}" in
  x86_64)
    RM_ARCH="x86_64"
    ;;
  aarch64|arm64)
    RM_ARCH="arm64"
    ;;
  *)
    echo "[runme-agent] Unsupported architecture: ${ARCH}" >&2
    exit 1
    ;;
esac

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

RUNME_TARBALL_URL="https://download.stateful.com/runme_linux_${RM_ARCH}.tar.gz"
echo "[runme-agent] Fetching Runme CLI from ${RUNME_TARBALL_URL}"
curl -fsSL "${RUNME_TARBALL_URL}" -o "${TMP_DIR}/runme.tgz"
tar -xzf "${TMP_DIR}/runme.tgz" -C "${TMP_DIR}"
install -m 0755 "${TMP_DIR}/runme" /usr/local/bin/runme

if ! runme --version >/dev/null 2>&1; then
  echo "[runme-agent] Runme installation verification failed" >&2
  exit 1
fi

auto_run_default="${AUTO_RUN:-false}"
readme_file_default="${README_FILE:-README.md}"
blocks_default="${BLOCKS:-setup,dev}"
confirm_plan_default="${CONFIRM_PLAN:-true}"
agent_default="${AGENT:-none}"

install -d /usr/local/etc
cat <<CONFIG >/usr/local/etc/airnub-autosetup.env
README_FILE_DEFAULT=$(printf '%q' "${readme_file_default}")
BLOCKS_DEFAULT=$(printf '%q' "${blocks_default}")
CONFIRM_PLAN_DEFAULT=$(printf '%q' "${confirm_plan_default}")
AGENT_DEFAULT=$(printf '%q' "${agent_default}")
CONFIG
chmod 0644 /usr/local/etc/airnub-autosetup.env

cat <<'SCRIPT' >/usr/local/bin/airnub-autosetup
#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="/usr/local/etc/airnub-autosetup.env"
if [[ -f "${CONFIG_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${CONFIG_FILE}"
fi

usage() {
  cat <<'USAGE'
Usage: airnub-autosetup [options]

Options:
  --readme <path>        Markdown file to scan for Runme blocks (default: README_FILE or README_FILE_DEFAULT)
  --blocks <csv>         Comma-separated Runme block names (default: BLOCKS or BLOCKS_DEFAULT)
  --confirm-plan <bool>  Prompt before executing (default: CONFIRM_PLAN or CONFIRM_PLAN_DEFAULT)
  --agent <name>         Agent integration to use on failure (none/openhands)
  -h, --help             Show this help and exit

Environment overrides:
  README_FILE, BLOCKS, CONFIRM_PLAN, AGENT
  AIRNUB_CONFIRM=1 disables confirmation prompts (non-interactive opt-in)
USAGE
}

READ_ME="${README_FILE:-${README_FILE_DEFAULT:-README.md}}"
BLOCKS_CSV="${BLOCKS:-${BLOCKS_DEFAULT:-setup,dev}}"
CONFIRM_VALUE="${CONFIRM_PLAN:-${CONFIRM_PLAN_DEFAULT:-true}}"
AGENT_CHOICE="${AGENT:-${AGENT_DEFAULT:-none}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --readme)
      [[ $# -ge 2 ]] || { echo "[autosetup] Missing value for --readme" >&2; exit 2; }
      READ_ME="$2"
      shift 2
      ;;
    --blocks)
      [[ $# -ge 2 ]] || { echo "[autosetup] Missing value for --blocks" >&2; exit 2; }
      BLOCKS_CSV="$2"
      shift 2
      ;;
    --confirm-plan)
      [[ $# -ge 2 ]] || { echo "[autosetup] Missing value for --confirm-plan" >&2; exit 2; }
      CONFIRM_VALUE="$2"
      shift 2
      ;;
    --agent)
      [[ $# -ge 2 ]] || { echo "[autosetup] Missing value for --agent" >&2; exit 2; }
      AGENT_CHOICE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[autosetup] Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

shopt -s nocasematch
case "${CONFIRM_VALUE}" in
  true|1|yes|on)
    CONFIRM_VALUE="true"
    ;;
  false|0|no|off)
    CONFIRM_VALUE="false"
    ;;
  *)
    echo "[autosetup] Invalid confirm-plan value: ${CONFIRM_VALUE}" >&2
    exit 2
    ;;
esac
case "${AGENT_CHOICE}" in
  none|openhands)
    ;;
  *)
    echo "[autosetup] Unsupported agent: ${AGENT_CHOICE}" >&2
    exit 2
    ;;
esac
shopt -u nocasematch

if ! command -v runme >/dev/null 2>&1; then
  echo "[autosetup] runme CLI not found in PATH" >&2
  exit 127
fi

if [[ ! -f "${READ_ME}" ]]; then
  echo "[autosetup] README file '${READ_ME}' not found in current directory." >&2
  exit 0
fi

echo "[autosetup] Discovering Runme cells in ${READ_ME}..."
runme list || true

IFS=',' read -r -a CELLS <<<"${BLOCKS_CSV}"

if [[ ${#CELLS[@]} -eq 0 ]]; then
  echo "[autosetup] No blocks specified." >&2
  exit 1
fi

echo "[autosetup] Plan (in order):"
FILTERED_CELLS=()
for raw_cell in "${CELLS[@]}"; do
  cell="${raw_cell## }"
  cell="${cell%% }"
  if [[ -z "${cell}" ]]; then
    continue
  fi
  echo "  - runme run ${cell}"
  FILTERED_CELLS+=("${cell}")
done

if [[ ${#FILTERED_CELLS[@]} -eq 0 ]]; then
  echo "[autosetup] No valid blocks supplied after trimming." >&2
  exit 1
fi

if [[ "${CONFIRM_VALUE}" == "true" && "${AIRNUB_CONFIRM:-0}" != "1" ]]; then
  if [[ -t 0 ]]; then
    read -r -p "Proceed with executing the plan? [y/N] " answer
    if [[ ! "${answer}" =~ ^[Yy]$ ]]; then
      echo "[autosetup] Aborted by user."
      exit 0
    fi
  else
    echo "[autosetup] Confirmation required but no TTY available. Set AIRNUB_CONFIRM=1 to proceed non-interactively." >&2
    exit 1
  fi
fi

for cell in "${FILTERED_CELLS[@]}"; do
  echo "[autosetup] >>> runme run ${cell}"
  if ! runme run "${cell}"; then
    status=$?
    echo "[autosetup] Block '${cell}' failed with exit code ${status}." >&2
    if [[ "${AGENT_CHOICE}" == "openhands" ]]; then
      if command -v openhands >/dev/null 2>&1; then
        echo "[autosetup] Delegating failure to OpenHands agent..."
        openhands -t "Fix failing setup for block '${cell}' described in ${READ_ME}."
      else
        echo "[autosetup] OpenHands requested but not installed." >&2
      fi
    fi
    exit "${status}"
  fi
  echo "[autosetup] Block '${cell}' completed successfully."
done

echo "[autosetup] All blocks completed."
SCRIPT
chmod +x /usr/local/bin/airnub-autosetup

if [[ "${auto_run_default}" == "true" ]]; then
  echo "[runme-agent] Auto-run requested. Add to your devcontainer.json:"
  echo '  "postCreateCommand": "airnub-autosetup"'
fi

echo "[runme-agent] Installation complete. Run 'airnub-autosetup --help' for usage."
