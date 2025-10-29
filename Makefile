REGISTRY ?= ghcr.io/airnub-labs/templates
TAG      ?= ubuntu-24.04

LESSON_MANIFEST ?= examples/lesson-manifests/intro-ai-week02.yaml

# Optional: derive a stable lesson slug from the manifest metadata using `yq` when available.
# Provide LESSON_SLUG explicitly if `yq` is unavailable or you prefer a custom slug.

ifeq (,$(LESSON_SLUG))
  LESSON_SLUG := $(shell yq -r '.metadata.org + "-" + .metadata.course + "-" + .metadata.lesson' $(LESSON_MANIFEST) 2>/dev/null | tr '/ ' '--')
endif

ifeq (,$(LESSON_SLUG))
  LESSON_SLUG := generated-lesson
endif

LESSON_IMAGE ?= $(REGISTRY)/lessons/$(LESSON_SLUG):$(TAG)

.PHONY: gen lesson-build lesson-push build-full push-full build-node push-node build-python push-python

gen:
	PYTHONPATH=tools/generate-lesson python -m generate_lesson.cli --manifest $(LESSON_MANIFEST)

lesson-build:
	devcontainer build \
	  --workspace-folder images/presets/generated/$(LESSON_SLUG) \
	  --image-name $(LESSON_IMAGE)

lesson-push:
	devcontainer build \
	  --workspace-folder images/presets/generated/$(LESSON_SLUG) \
	  --image-name $(LESSON_IMAGE) \
	  --push

build-full:
	devcontainer build --workspace-folder images/presets/full --image-name $(REGISTRY)/full:$(TAG)

push-full:
	devcontainer build --workspace-folder images/presets/full --image-name $(REGISTRY)/full:$(TAG) --push

build-node:
	devcontainer build --workspace-folder images/presets/node-pnpm --image-name $(REGISTRY)/node-pnpm:$(TAG)

push-node:
	devcontainer build --workspace-folder images/presets/node-pnpm --image-name $(REGISTRY)/node-pnpm:$(TAG) --push

build-python:
	devcontainer build --workspace-folder images/presets/python --image-name $(REGISTRY)/python:$(TAG)

push-python:
	devcontainer build --workspace-folder images/presets/python --image-name $(REGISTRY)/python:$(TAG) --push
