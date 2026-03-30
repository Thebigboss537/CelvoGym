#!/bin/bash
set -e

MINIO_URL="${MINIO_ENDPOINT:-http://localhost:9000}"
ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
BUCKET="celvogym-videos"

docker run --rm \
  --entrypoint mc \
  minio/mc:latest \
  alias set s3 "$MINIO_URL" "$ACCESS_KEY" "$SECRET_KEY" && \
  mc mb --ignore-existing "s3/$BUCKET" && \
  mc anonymous set download "s3/$BUCKET"

echo "Bucket '$BUCKET' created with public read access."
