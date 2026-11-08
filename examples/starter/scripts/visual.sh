#!/usr/bin/env bash
# Runs the visual tests inside the pinned Playwright Docker image, the same image CI uses, so
# screenshots match across machines. Needs Docker.
#
#   scripts/visual.sh            compare against the committed baselines
#   scripts/visual.sh --update   regenerate the baselines in e2e/__screenshots__
#
# The repo is mounted read-write (baselines are written back); node_modules and .next stay in
# Docker volumes so the host's own installs are untouched.
set -euo pipefail

cd "$(dirname "$0")/.."

version=$(node -p "require('./package.json').devDependencies['@playwright/test']")
image="mcr.microsoft.com/playwright:v${version}-noble"

update=""
if [ "${1:-}" = "--update" ]; then
  update="--update-snapshots=all"
fi

docker run --rm --ipc=host \
  -v "$PWD":/work \
  -v starter-visual-node-modules:/work/node_modules \
  -v starter-visual-next:/work/.next \
  -w /work \
  "$image" \
  bash -c "corepack enable && pnpm install --frozen-lockfile && pnpm run build && PLAYWRIGHT_SERVER=start pnpm exec playwright test --project=chromium --grep @visual $update"
