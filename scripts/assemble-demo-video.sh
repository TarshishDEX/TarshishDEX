#!/usr/bin/env bash
# TarshishDEX — assemble the ~2 minute demo video from the Playwright captures.
#
# Expects docs/videos/desktop.webm (1280x720) and docs/videos/mobile.webm
# (390x844) from scripts/capture-demo-video.mjs. Produces:
#   docs/videos/tarshishdex-demo.mp4  (H.264, 1280x720, ~2:00)
#
# Segment-aware budget: title (4s) + desktop + mobile + outro (4s) should land
# at ~2:00. The desktop walkthrough is the flexible segment — if it overshoots
# the budget its TAIL is trimmed, so the mobile segment and the outro card are
# never cut (a hard `-t 120` on the concat used to delete them entirely).
#
# Usage: bash scripts/assemble-demo-video.sh
#   FFMPEG=/path/to/ffmpeg  (defaults to a system ffmpeg)

set -euo pipefail

FFMPEG="${FFMPEG:-$(command -v ffmpeg || true)}"
if [ -z "$FFMPEG" ]; then
  echo "error: no system ffmpeg found — install one first (e.g. apt-get install -y ffmpeg)" >&2
  echo "       the Playwright-bundled build is too minimal (no lavfi/libx264/mp4) for this script" >&2
  exit 1
fi
OUT_DIR="docs/videos"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT_DIR"

DESKTOP="$OUT_DIR/desktop.webm"
MOBILE="$OUT_DIR/mobile.webm"
if [ ! -f "$DESKTOP" ] || [ ! -f "$MOBILE" ]; then
  echo "error: expected docs/videos/desktop.webm and mobile.webm — run capture-demo-video.mjs first" >&2
  exit 1
fi

# Probe a media file's duration in seconds (float).
probe_duration() {
  "$FFMPEG" -i "$1" 2>&1 \
    | grep -oE 'Duration: [0-9:.]+' | head -1 \
    | awk '{print $2}' | awk -F: '{print $1*3600+$2*60+$3}' || true
}

echo "segments: desktop=$DESKTOP mobile=$MOBILE"

# ── Title card (4s) ─────────────────────────────────────────────────────
"$FFMPEG" -y -f lavfi -i "color=c=0x0B1020:s=1280x720:d=4:r=30" \
  -vf "drawtext=fontfile=$FONT:text='TarshishDEX':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-60,drawtext=fontfile=$FONT:text='Stellar Native DEX':fontsize=28:fontcolor=0x7DD3FC:x=(w-text_w)/2:y=(h)/2+20,drawtext=fontfile=$FONT:text='Swap | Portfolio | Analytics':fontsize=20:fontcolor=0x94A3B8:x=(w-text_w)/2:y=(h)/2+70" \
  -c:v libx264 -pix_fmt yuv420p "$TMP/title.mp4"

# ── Outro card (4s) ─────────────────────────────────────────────────────
"$FFMPEG" -y -f lavfi -i "color=c=0x0B1020:s=1280x720:d=4:r=30" \
  -vf "drawtext=fontfile=$FONT:text='Thank you for watching':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40,drawtext=fontfile=$FONT:text='Live on Stellar Testnet':fontsize=24:fontcolor=0x7DD3FC:x=(w-text_w)/2:y=(h)/2+30" \
  -c:v libx264 -pix_fmt yuv420p "$TMP/outro.mp4"

# ── Segment-aware desktop budget ────────────────────────────────────────
# Keep title(4) + mobile + outro(4) intact; give the remainder to desktop.
# (`|| true` at the call site, not inside the function — with pipefail the
# function can still exit non-zero when grep finds no Duration line, and the
# assignment would abort under set -e before the guard below runs.)
MOBILE_DUR="$(probe_duration "$MOBILE" || true)"
DESKTOP_DUR="$(probe_duration "$DESKTOP" || true)"
if [ -z "${MOBILE_DUR:-}" ] || [ -z "${DESKTOP_DUR:-}" ]; then
  echo "error: could not probe segment durations (desktop=${DESKTOP_DUR:-<empty>} mobile=${MOBILE_DUR:-<empty>})" >&2
  exit 1
fi
DESKTOP_BUDGET="$(awk -v m="$MOBILE_DUR" 'BEGIN{print 118 - 8 - m}')"
echo "durations: desktop=${DESKTOP_DUR}s mobile=${MOBILE_DUR}s → desktop budget=${DESKTOP_BUDGET}s"

DESKTOP_TRIM=()
if awk -v d="${DESKTOP_DUR:-0}" -v b="${DESKTOP_BUDGET:-0}" 'BEGIN{exit !(d > b)}'; then
  echo "desktop exceeds budget — trimming desktop tail (mobile + outro kept)"
  DESKTOP_TRIM=(-t "$DESKTOP_BUDGET")
fi

# ── Normalize segments to 1280x720 CFR 30 ───────────────────────────────
"$FFMPEG" -y -i "$DESKTOP" "${DESKTOP_TRIM[@]}" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0B1020,fps=30,format=yuv420p" \
  -c:v libx264 -preset veryfast -crf 20 "$TMP/desktop.mp4"

# Scale to fit WITHIN 1280x720 first (portrait 390x844 → ~332x720), then pad.
# (Padding cannot shrink, so targeting 390:844 then padding to 1280:720 fails.)
"$FFMPEG" -y -i "$MOBILE" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0B1020,fps=30,format=yuv420p" \
  -c:v libx264 -preset veryfast -crf 20 "$TMP/mobile.mp4"

# ── Concatenate (no trim yet) ───────────────────────────────────────────
cat > "$TMP/list.txt" <<EOF
file '$TMP/title.mp4'
file '$TMP/desktop.mp4'
file '$TMP/mobile.mp4'
file '$TMP/outro.mp4'
EOF

"$FFMPEG" -y -f concat -safe 0 -i "$TMP/list.txt" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/raw.mp4"

# ── Probe duration, then fade + cap at 120s ─────────────────────────────
# `|| true` at the call site keeps the probe from aborting under
# `set -euo pipefail`, so the empty-duration guard below is reachable.
DUR="$(probe_duration "$TMP/raw.mp4" || true)"
if [ -z "${DUR:-}" ]; then
  echo "error: could not probe duration of raw.mp4" >&2
  exit 1
fi
TARGET="$(echo "$DUR" | awk '{if ($1>120) print 120; else print $1}')"
FADE_START="$(echo "$TARGET" | awk '{if ($1-2.5 < 0) print 0; else print $1-2.5}')"
echo "raw duration=${DUR}s → target=${TARGET}s, fade-out at ${FADE_START}s"

"$FFMPEG" -y -i "$TMP/raw.mp4" \
  -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=${FADE_START}:d=2" \
  -t "$TARGET" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -movflags +faststart \
  "$OUT_DIR/tarshishdex-demo.mp4"

DURATION="$("$FFMPEG" -i "$OUT_DIR/tarshishdex-demo.mp4" 2>&1 | grep -oE 'Duration: [0-9:.]+' | head -1 || true)"
SIZE="$(du -h "$OUT_DIR/tarshishdex-demo.mp4" | cut -f1)"
echo "✓ $OUT_DIR/tarshishdex-demo.mp4 — $DURATION ($SIZE)"
