SHELL := /usr/bin/env bash
.SHELLFLAGS := -Eeuo pipefail -c
.SHELL := /usr/bin/env bash
.ONESHELL:
MAKEFLAGS += --no-builtin-rules
.SUFFIXES:

REGISTRY ?= ghcr.io/airnub-labs/templates
TAG      ?= ubuntu-24.04

PYTHON ?= python

DEFAULT_LESSON_MANIFEST := examples/lesson-manifests/intro-ai-week02.yaml
LESSON_MANIFEST ?= $(DEFAULT_LESSON_MANIFEST)
L ?=

ACTIVE_MANIFEST := $(strip $(if $(L),$(L),$(LESSON_MANIFEST)))

PRESETS := full node-pnpm python python-prefect python-airflow python-dagster ts-temporal

MANIFESTS_YML  := $(wildcard examples/lesson-manifests/*.yml)
MANIFESTS_YAML := $(wildcard examples/lesson-manifests/*.yaml)
LESSON_MANIFESTS := $(sort $(MANIFESTS_YML) $(MANIFESTS_YAML))

# Optional: derive a stable lesson slug from the manifest metadata using `yq` when available.
# Provide LESSON_SLUG explicitly if `yq` is unavailable or you prefer a custom slug.

ifeq ($(strip $(ACTIVE_MANIFEST)),)
  LESSON_SLUG ?= generated-lesson
else
  ifeq (,$(LESSON_SLUG))
    LESSON_SLUG := $(shell $(PYTHON) scripts/manifest_slug.py $(ACTIVE_MANIFEST) 2>/dev/null)
  endif
  ifeq (,$(LESSON_SLUG))
    LESSON_SLUG := generated-lesson
  endif
endif

LESSON_IMAGE ?= $(REGISTRY)/lessons/$(LESSON_SLUG):$(TAG)

GIT_SHA ?= $(shell git rev-parse --verify HEAD 2>/dev/null)

COMPOSE_BUNDLE ?= dist/$(LESSON_SLUG)/classroom

.PHONY: gen gen-all lesson-build lesson-push lesson-scaffold compose-aggregate check $(addprefix build-,$(PRESETS)) $(addprefix push-,$(PRESETS))

gen:
	@if [ -z "$(ACTIVE_MANIFEST)" ]; then \
		echo "[error] Set L=<manifest> or LESSON_MANIFEST before running make gen"; \
		exit 1; \
	fi
	PYTHONPATH=tools/generate-lesson $(PYTHON) -m generate_lesson.cli --manifest $(ACTIVE_MANIFEST)

gen-all:
	if [ -z "$(strip $(LESSON_MANIFESTS))" ]; then \
		echo "No lesson manifests found under examples/lesson-manifests"; \
		exit 0; \
	fi
	for manifest in $(LESSON_MANIFESTS); do \
		echo "[gen] $$manifest"; \
		PYTHONPATH=tools/generate-lesson $(PYTHON) -m generate_lesson.cli --manifest $$manifest; \
	done

lesson-build: gen
	export BUILDKIT_COLLECT_BUILD_INFO=1; \
	export BUILDKIT_SBOM_SCAN_STAGE=export; \
	devcontainer build \
	  --workspace-folder images/presets/generated/$(LESSON_SLUG) \
	  --image-name $(LESSON_IMAGE) \
	  --build-arg GIT_SHA=$(GIT_SHA)

lesson-push: gen
	export BUILDKIT_COLLECT_BUILD_INFO=1; \
	export BUILDKIT_SBOM_SCAN_STAGE=export; \
	devcontainer build \
	  --workspace-folder images/presets/generated/$(LESSON_SLUG) \
	  --image-name $(LESSON_IMAGE) \
	  --build-arg GIT_SHA=$(GIT_SHA) \
	  --platform linux/amd64,linux/arm64 \
	  --push

lesson-scaffold: gen
	@if [ -z "$(DEST)" ]; then \
		echo "[error] Provide DEST=/path/to/output"; \
		exit 1; \
	fi
	rm -rf "$(DEST)"
	install -d "$(DEST)"
	cp -a templates/generated/$(LESSON_SLUG)/. "$(DEST)/"
	@echo "[ok] Scaffold copied to $(DEST)"


compose-aggregate: gen
	src="images/presets/generated/$(LESSON_SLUG)"; \
	bundle="${DEST:-$(COMPOSE_BUNDLE)}"; \
	if [ ! -f "$$src/docker-compose.classroom.yml" ]; then \
	        echo "[warn] No aggregate compose emitted for $(LESSON_SLUG)"; \
	        exit 0; \
	fi; \
	install -d "$$bundle"; \
	cp "$$src/docker-compose.classroom.yml" "$$bundle/"; \
	find "$$src" -maxdepth 1 -type f -name '.env.example-*' -exec cp {} "$$bundle/" \;; \
	@echo "[ok] Aggregate compose bundle ready at $$bundle"

$(addprefix build-,$(PRESETS)):
	devcontainer build --workspace-folder images/presets/$(@:build-%=%) --image-name $(REGISTRY)/$(@:build-%=%):$(TAG)

$(addprefix push-,$(PRESETS)):
	devcontainer build --workspace-folder images/presets/$(@:push-%=%) --image-name $(REGISTRY)/$(@:push-%=%):$(TAG) --push


check:
	@echo "Schema + lints + generator dry-run"
	@command -v jq >/dev/null 2>&1 || echo "[warn] jq not installed"
	@command -v yq >/dev/null 2>&1 || echo "[warn] yq not installed"
	@[ -f schemas/lesson-env.schema.json ] || (echo "[fail] schema missing" && exit 1)
	$(PYTHON) scripts/validate_lessons.py
	$(MAKE) gen-all
	if command -v npm >/dev/null 2>&1; then \
		npm --prefix tools/airnub-devc ci; \
		npm --prefix tools/airnub-devc test; \
	else \
		echo "[warn] npm not available; skipping CLI unit tests"; \
	fi
	if command -v shellcheck >/dev/null 2>&1; then \
		SHELL_FILES="$$(git ls-files '*.sh' '*.bash' 2>/dev/null)"; \
		if [ -n "$$SHELL_FILES" ]; then \
			shellcheck $$SHELL_FILES; \
		fi; \
	else \
		echo "[warn] shellcheck not installed; skipping shell lint"; \
	fi
	if ! command -v docker >/dev/null 2>&1; then \\
		echo "docker not available; skipping docker compose validation"; \\
	else \\
		for manifest in $(LESSON_MANIFESTS); do \\
			slug=$$($(PYTHON) scripts/manifest_slug.py $$manifest); \\
			compose_file="images/presets/generated/$$slug/docker-compose.classroom.yml"; \\
			if [ -f "$$compose_file" ]; then \\
				echo "[check] docker compose config $$compose_file"; \\
				docker compose -f "$$compose_file" config >/dev/null; \\
			fi; \\
			done; \\
	fi

.PHONY: stack-up stack-down
stack-up:
	REDIS?=0 SUPABASE?=0 KAFKA?=0 AIRFLOW?=0 PREFECT?=0 DAGSTER?=0 TEMPORAL?=0 WEBTOP?=0 CHROME_CDP?=0 \\
	bash scripts/compose_aggregate.sh

stack-down:
	docker compose down || true
