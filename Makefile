REGISTRY ?= ghcr.io/airnub-labs/templates
TAG      ?= ubuntu-24.04

.PHONY: gen lesson-build lesson-push build-full push-full build-node push-node build-python push-python

gen:
	PYTHONPATH=tools/generate-lesson python -m generate_lesson.cli --manifest examples/lesson-manifests/intro-ai-week02.yaml

lesson-build:
	devcontainer build --workspace-folder images/presets/generated/my-school/intro-ai/week02-prompts --image-name $(REGISTRY)/full:$(TAG)

lesson-push:
	devcontainer build --workspace-folder images/presets/generated/my-school/intro-ai/week02-prompts --image-name $(REGISTRY)/full:$(TAG) --push

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
