#!/bin/sh
set -e

# Reinstall dependencies inside the container to get correct native bindings
# This is needed because the host node_modules may have different platform bindings
if [ ! -f /app/node_modules/.docker-installed ]; then
  echo "Installing dependencies for container platform..."
  rm -rf /app/node_modules/package-lock.json
  npm install
  touch /app/node_modules/.docker-installed
fi

exec "$@"
