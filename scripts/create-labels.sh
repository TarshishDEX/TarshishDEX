#!/usr/bin/env bash
# ── TarshishDEX — create GitHub labels ───────────────────────────────────
# Creates all labels used by the issue tracker.
set -euo pipefail

REPO="TarshishDEX/TarshishDEX"

LABELS=(
  # Priority
  "priority:critical:#ef4444:Critical issues needing immediate attention"
  "priority:high:#f97316:High priority"
  "priority:medium:#eab308:Medium priority"
  "priority:low:#22c55e:Low priority"

  # Difficulty
  "good first issue:#0ea5e9:Great for new contributors"
  "help wanted:#22d3ee:Extra attention needed"
  "epic:#7c3aed:Large feature spanning multiple PRs"

  # Type
  "bug:#ef4444:Something isn't working"
  "enhancement:#8b5cf6:New feature or improvement"
  "documentation:#3b82f6:Documentation improvements"
  "testing:#10b981:Test coverage and quality"
  "performance:#f59e0b:Performance optimization"
  "refactor:#94a3b8:Code restructuring"
  "accessibility:#ec4899:Accessibility improvements"
  "ux:#d946ef:User experience polish"
  "security:#dc2626:Security concerns and hardening"

  # Area
  "area:frontend:#6366f1:Frontend UI components and pages"
  "area:backend:#06b6d4:API routes and server-side logic"
  "area:smart-contracts:#f97316:Soroban smart contracts"
  "area:swap:#a855f7:Swap engine and routing"
  "area:portfolio:#84cc16:Portfolio dashboard"
  "area:markets:#14b8a6:Market data and analytics"
  "area:wallet:#f43f5e:Wallet integration"
  "area:ci-cd:#64748b:CI/CD pipelines"
  "area:docs:#2563eb:Documentation and guides"
  "area:design:#d946ef:UI/UX design system"
  "area:testing:#10b981:Test infrastructure"
  "area:api:#06b6d4:Developer API"
  "area:deps:#94a3b8:Dependencies and tooling"
)

echo "Creating labels for $REPO..."

for label_def in "${LABELS[@]}"; do
  IFS=':' read -r name color description <<< "$label_def"
  echo "  → $name ($color)"
  gh label create "$name" --color "$color" --description "$description" --repo "$REPO" --force 2>/dev/null || true
done

echo ""
echo "Labels created successfully."
