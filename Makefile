SHELL := /bin/bash
.ONESHELL:

REGISTRY ?= ghcr.io/airnub-labs/templates
TAG      ?= ubuntu-24.04

PYTHON ?= python

LESSON_MANIFEST ?= examples/lesson-manifests/intro-ai-week02.yaml

PRESETS := full node-pnpm python python-prefect python-airflow python-dagster ts-temporal

MANIFESTS_YML  := $(wildcard examples/lesson-manifests/*.yml)
MANIFESTS_YAML := $(wildcard examples/lesson-manifests/*.yaml)
LESSON_MANIFESTS := $(sort $(MANIFESTS_YML) $(MANIFESTS_YAML))

# Optional: derive a stable lesson slug from the manifest metadata using `yq` when available.
# Provide LESSON_SLUG explicitly if `yq` is unavailable or you prefer a custom slug.

ifeq (,$(LESSON_SLUG))
  LESSON_SLUG := $(shell yq -r '.metadata.org + "-" + .metadata.course + "-" + .metadata.lesson' $(LESSON_MANIFEST) 2>/dev/null | tr '/ ' '--')
endif

ifeq (,$(LESSON_SLUG))
  LESSON_SLUG := generated-lesson
endif

LESSON_IMAGE ?= $(REGISTRY)/lessons/$(LESSON_SLUG):$(TAG)

.PHONY: gen gen-all lesson-build lesson-push check $(addprefix build-,$(PRESETS)) $(addprefix push-,$(PRESETS))

gen:
	PYTHONPATH=tools/generate-lesson $(PYTHON) -m generate_lesson.cli --manifest $(LESSON_MANIFEST)

gen-all:
	if [ -z "$(strip $(LESSON_MANIFESTS))" ]; then \
	echo "No lesson manifests found under examples/lesson-manifests"; \
	exit 0; \
	fi; \
	for manifest in $(LESSON_MANIFESTS); do \
	echo "[gen] $$manifest"; \
	PYTHONPATH=tools/generate-lesson $(PYTHON) -m generate_lesson.cli --manifest $$manifest; \
	done

lesson-build:
	devcontainer build \
	  --workspace-folder images/presets/generated/$(LESSON_SLUG) \
	  --image-name $(LESSON_IMAGE)

lesson-push:
	devcontainer build \
	  --workspace-folder images/presets/generated/$(LESSON_SLUG) \
	  --image-name $(LESSON_IMAGE) \
	  --push

$(addprefix build-,$(PRESETS)):
	devcontainer build --workspace-folder images/presets/$(@:build-%=%) --image-name $(REGISTRY)/$(@:build-%=%):$(TAG)

$(addprefix push-,$(PRESETS)):
	devcontainer build --workspace-folder images/presets/$(@:push-%=%) --image-name $(REGISTRY)/$(@:push-%=%):$(TAG) --push

check:
	set -euo pipefail
	$(PYTHON) scripts/validate_lessons.py
	$(MAKE) gen-all
	if ! command -v docker >/dev/null 2>&1; then \
	echo "docker not available; skipping docker compose validation"; \
	else \
	for manifest in $(LESSON_MANIFESTS); do \
	slug=$$($(PYTHON) scripts/manifest_slug.py $$manifest); \
	compose_file="images/presets/generated/$$slug/docker-compose.classroom.yml"; \
	if [ -f "$$compose_file" ]; then \
	echo "[check] docker compose config $$compose_file"; \
	docker compose -f "$$compose_file" config >/dev/null; \
	fi; \
	done; \
	fi
