#!/usr/bin/env bash
# ── TarshishDEX — quality gates verification ───────────────────────────
# Runs every quality gate in order: formatting, linting, typecheck,
# frontend tests, and (when available) Rust contract tests.
#
# Usage:
#   bash scripts/quality-gates.sh           # all gates
#   bash scripts/quality-gates.sh --quick   # skip contract tests
#   bash scripts/quality-gates.sh --fix     # auto-fix formatting/lint
#
# Exit code: 0 when all gates pass, 1 on first failure.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
MODE="full"

for arg in "$@"; do
  case "$arg" in
    --quick) MODE="quick" ;;
    --fix) MODE="fix" ;;
  esac
done

header() {
  echo ""
  echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

pass() {
  echo -e "  ${GREEN}✓ PASS${NC}  $1"
  PASSED=$((PASSED + 1))
}

fail() {
  echo -e "  ${RED}✗ FAIL${NC}  $1"
  FAILED=$((FAILED + 1))
}

# ── Prettier ────────────────────────────────────────────────────────────
header "Prettier (formatting)"
if [[ "$MODE" == "fix" ]]; then
  npx prettier --write . 2>/dev/null && pass "Formatted all files" || fail "Prettier fix failed"
else
  npx prettier --check . 2>/dev/null && pass "All files formatted" || fail "Formatting issues"
fi

# ── ESLint ──────────────────────────────────────────────────────────────
header "ESLint"
if [[ "$MODE" == "fix" ]]; then
  npx eslint --fix . 2>/dev/null && pass "Linting fixed" || fail "ESLint fix failed"
else
  npx eslint . 2>/dev/null && pass "No lint errors" || fail "Lint issues found"
fi

# ── TypeScript ──────────────────────────────────────────────────────────
header "TypeScript (strict)"
npx tsc --noEmit && pass "TypeScript OK" || fail "Type errors"

# ── Frontend tests ──────────────────────────────────────────────────────
header "Frontend tests (Vitest)"
npx vitest run 2>/dev/null && pass "All frontend tests pass" || fail "Frontend test failures"

# ── Rust contracts (optional) ────────────────────────────────────────────
if [[ "$MODE" != "quick" ]] && command -v cargo &>/dev/null; then
  header "Rust contracts (fmt + clippy + test)"
  (
    cd src/contracts
    cargo fmt --all -- --check 2>/dev/null && pass "Rust formatting OK" || fail "Rust fmt issues"
    cargo clippy --all-targets -- -D warnings 2>/dev/null && pass "Clippy OK" || fail "Clippy warnings"
    cargo test --workspace 2>/dev/null && pass "All contract tests pass" || fail "Contract test failures"
  )
elif [[ "$MODE" != "quick" ]]; then
  echo -e "  ${YELLOW}⚠ SKIP${NC}  Rust toolchain not installed (cargo not found)"
fi

# ── Build ───────────────────────────────────────────────────────────────
header "Next.js build"
if [[ "$MODE" != "fix" ]]; then
  npx next build 2>/dev/null && pass "Production build OK" || fail "Build failed"
fi

# ── Summary ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Passed: ${GREEN}${PASSED}${NC}  |  Failed: ${RED}${FAILED}${NC}"
echo ""

if [[ $FAILED -gt 0 ]]; then
  echo -e "${RED}Some quality gates failed.${NC}"
  echo "  Run with --fix to auto-fix formatting and lint issues."
  exit 1
fi

echo -e "${GREEN}All quality gates passed. Ship it! 🚀${NC}"
