.PHONY: build-full push-full build-node push-node build-python push-python

REGISTRY ?= ghcr.io/airnub-labs/templates
TAG      ?= ubuntu-24.04

build-full:
	devcontainer build --workspace-folder images/presets/full --image-name $(REGISTRY)/full:$(TAG)

push-full: build-full
	devcontainer build --workspace-folder images/presets/full --image-name $(REGISTRY)/full:$(TAG) --push

build-node:
	devcontainer build --workspace-folder images/presets/node-pnpm --image-name $(REGISTRY)/node-pnpm:$(TAG)

push-node: build-node
	devcontainer build --workspace-folder images/presets/node-pnpm --image-name $(REGISTRY)/node-pnpm:$(TAG) --push

build-python:
	devcontainer build --workspace-folder images/presets/python --image-name $(REGISTRY)/python:$(TAG)

push-python: build-python
	devcontainer build --workspace-folder images/presets/python --image-name $(REGISTRY)/python:$(TAG) --push
