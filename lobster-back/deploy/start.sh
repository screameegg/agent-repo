#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Edit .env passwords, then run this script again."
  exit 1
fi

docker compose up -d --build
docker compose ps
