#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
clang --target=wasm32 -O3 -nostdlib \
  -Wl,--no-entry -Wl,--import-undefined -Wl,--export=vk_step -Wl,--export=vk_obstacles -Wl,--export-memory \
  -Wl,--initial-memory=131072 -Wl,--max-memory=131072 \
  -Wl,--strip-all physics-core.c -o physics-core.wasm
echo 'Compilado: wasm/physics-core.wasm'
