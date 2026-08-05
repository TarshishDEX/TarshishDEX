#!/usr/bin/env bash
# ── TarshishDEX — semantic version bump ────────────────────────────────
# Bumps the version in package.json and creates a version tag.
#
# Usage:
#   ./scripts/version.sh patch   # 0.1.0 → 0.1.1
#   ./scripts/version.sh minor   # 0.1.1 → 0.2.0
#   ./scripts/version.sh major   # 0.2.0 → 1.0.0
#
# The tag is then pushed to trigger the release process.

set -euo pipefail

BUMP="${1:-patch}"

if [[ ! "$BUMP" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: $0 {patch|minor|major}" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CURRENT="$(node -e "process.stdout.write(require('./package.json').version)")"
NEW="$(node -e "
  const [major, minor, patch] = '${CURRENT}'.split('.').map(Number);
  if ('${BUMP}' === 'major') process.stdout.write(\`\${major+1}.0.0\`);
  else if ('${BUMP}' === 'minor') process.stdout.write(\`\${major}.\${minor+1}.0\`);
  else process.stdout.write(\`\${major}.\${minor}.\${patch+1}\`);
")"

echo "Bumping ${CURRENT} → ${NEW} (${BUMP})"

# Update package.json and package-lock.json
npm version "$BUMP" --no-git-tag-version

# Also update the CHANGELOG header placeholder
if [[ -f CHANGELOG.md ]]; then
  sed -i "1s/## \\[.*\\]/## [${NEW}]/" CHANGELOG.md 2>/dev/null || true
fi

git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): bump version to ${NEW}"
git tag "v${NEW}"

echo ""
echo "Done! Version bumped to ${NEW}."
echo "Run: git push --follow-tags origin main"
