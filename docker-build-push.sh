#!/bin/bash

show_usage() {
    echo "Usage: ./docker-build.sh <version-tag> [dockerfile-path]"
    echo "Example: ./docker-build.sh 1.0.0"
    echo "Example with custom Dockerfile and args: ./docker-build.sh 1.0.0 Dockerfile --build-arg XXX=YYY"
}

if [ -z "$1" ]
then
    echo "Error: Please provide a version tag"
    show_usage
    exit 1
fi

# Variables
VERSION=$1
DOCKERFILE=${2:-"Dockerfile"}
USERNAME="dockerdemo786"
IMAGE_NAME="k8s-connectivity-test"
FULL_IMAGE_NAME="$USERNAME/$IMAGE_NAME"

# Collect build args if provided
BUILD_ARGS=()

if [ $# -gt 2 ]; then
    shift 2
    for arg in "$@"; do
        BUILD_ARGS+=("$arg")
    done
fi

if [ ! -f "$DOCKERFILE" ]; then
    echo "Error: Dockerfile not found at path: $DOCKERFILE"
    exit 1
fi

echo "🚀 Building and pushing $FULL_IMAGE_NAME:$VERSION"

echo "Build args: ${BUILD_ARGS[@]}"

echo "📦 Building Docker image..."
docker build --platform linux/amd64 \
    -f "$DOCKERFILE" \
    -t $IMAGE_NAME \
    --no-cache . \
    "${BUILD_ARGS[@]}"
    

# Tag the image with version and latest
echo "🏷️ Tagging images..."
docker tag $IMAGE_NAME:latest $FULL_IMAGE_NAME:$VERSION
#docker tag $IMAGE_NAME:latest $FULL_IMAGE_NAME:latest

# Push the images
echo "⬆️ Pushing images to Docker Hub..."
docker push $FULL_IMAGE_NAME:$VERSION
#docker push $FULL_IMAGE_NAME:latest

echo "✅ Successfully built and pushed $FULL_IMAGE_NAME:$VERSION and $FULL_IMAGE_NAME:latest"
