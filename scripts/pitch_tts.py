#!/usr/bin/env python3
"""Generate per-scene narration audio for the 3-minute TarshishDEX pitch video.

Uses edge-tts (free neural voices) — warm, confident female (en-US-AriaNeural).
Outputs MP3 clips + a JSON manifest of scene durations to .pitch-work/audio/.
"""

import asyncio
import json
import os

import edge_tts

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, ".pitch-work")
AUDIO_DIR = os.path.join(WORK, "audio")
VOICE = "en-US-AriaNeural"
RATE = "-3%"  # ~2:55 total incl. scene pauses; tuned for the 3-min target

# Scene number -> narration text (verbatim from scripts/pitch-video-script.md)
SCENES = {
    1: "Every day, billions of dollars move through decentralized exchanges. But most traders still fly blind — signing transactions they can't preview, paying fees they can't see, and trusting bridges that add risk. What if trading on Stellar could be intelligent, transparent, and nearly free?",
    2: "Today's trading experience is broken. Swap interfaces hide the real cost of a trade. Bridges wrap assets and introduce counterparty risk. And the on-chain automation that should protect you rarely exists. Traders deserve a terminal that shows exactly what will happen — before they sign.",
    3: "Meet TarshishDEX. A professional decentralized trading platform built exclusively on Stellar's native order book and Soroban smart contracts. No bridges. No wrapped assets. No middlemen. Just the raw speed, liquidity, and near-zero cost of the Stellar network — with intelligent routing, pre-execution simulation, and on-chain limit orders. Trade Stellar's native DEX, intelligently.",
    4: "Every swap is simulated before you sign — expected output, price impact, minimum received, and fees, all visible up front. TarshishDEX finds the best route across the order book — direct, multi-hop, or Horizon path-finding, evaluated in parallel. Store your slippage and routing preferences on-chain. Place, cancel, and track limit orders with Soroban persistence. Manage multiple wallets, follow live order books and trades over real-time streams, and analyze markets with professional charts.",
    5: "Under the hood, this is production-grade engineering. Three Soroban smart contracts — trading preferences, a market oracle, and a limit-order registry — are live on Stellar Testnet, with three hundred structured error codes and gas benchmarks enforced in CI. The frontend runs two thousand and eighty-three tests at ninety-nine point seven-seven percent coverage, plus one hundred and seventy-one end-to-end tests. Zero critical vulnerabilities. A formal security audit. And reads cost about one hundred-thousandth of an XLM.",
    6: "It isn't just code — it's shipped. Deployed on Vercel, live on Stellar Testnet, with a read-only developer API and real-time streams for builders. Every quality gate passes at zero tolerance.",
    7: "TarshishDEX. Trade Stellar's native DEX — intelligently. Live on Testnet today. Try it, and trade with full transparency.",
}


async def synth(n: int, text: str) -> str:
    out = os.path.join(AUDIO_DIR, f"scene_{n:02d}.mp3")
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(out)
    return out


def main() -> None:
    os.makedirs(AUDIO_DIR, exist_ok=True)
    from mutagen.mp3 import MP3

    manifest = {}
    total = 0.0
    for n, text in SCENES.items():
        path = asyncio.run(synth(n, text))
        dur = MP3(path).info.length
        manifest[n] = {"file": path, "duration": round(dur, 3), "chars": len(text)}
        total += dur
        print(f"  scene {n}: {dur:.2f}s  ({len(text)} chars)")

    manifest_path = os.path.join(AUDIO_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nTotal narration: {total:.2f}s  ({total/60:.2f} min)")
    print(f"Manifest written to {manifest_path}")


if __name__ == "__main__":
    main()
