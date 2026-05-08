#!/bin/bash
while true; do
  node node_modules/.bin/next dev -p 3000 2>&1
  echo "[$(date)] Server exited, restarting in 3s..."
  sleep 3
done
