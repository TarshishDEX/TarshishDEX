# Screenshots

Submission checklist captures for TarshishDEX — all **captured** (see the table
below) against the live deploy and referenced from the README. PNG, 1280×800
(desktop) / 390×844 (mobile).

| #   | Filename                             | What is captured                                                     |
| --- | ------------------------------------ | -------------------------------------------------------------------- |
| 1   | `wallet-options.png`                 | Wallet picker modal with Freighter and other options visible         |
| 2   | `wallet-connected.png`               | Header showing the connected address chip with green indicator       |
| 3   | `balance-displayed.png`              | Connected wallet dropdown showing the XLM balance                    |
| 4   | `successful-testnet-transaction.png` | Real contract-call tx on stellar.expert (testnet) — verified SUCCESS |
| 5   | `transaction-result.png`             | Second real on-chain tx (publish → PricePublished)                   |
| 6   | `mobile-responsive.png`              | Swap page at 390×844 viewport — layout intact                        |
| 7   | `ci-pipeline.png`                    | GitHub Actions run showing the `quality` + `contracts` jobs passing  |
| 8   | `test-output.png`                    | Coverage report — 70 passing tests (9 files)                         |

## Automated capture

All wallet/UI shots are captured headlessly with Playwright against the live
URL, using a **Freighter stub** (see `scripts/lib/freighter-stub.mjs`):

- freighter-api v6 `isConnected()` short-circuits on a truthy `window.freighter`
  so the wallet picker opens without an extension;
- `getAddress()`/`requestAccess()`/`getNetwork()` use a `window.postMessage`
  protocol (FREIGHTER_EXTERNAL_MSG_REQUEST/RESPONSE) — the stub answers it
  with a real friendbot-funded Testnet account, so the kit's connect flow
  resolves and the WalletProvider keeps the session (real Horizon balance).

```bash
BASE_URL=https://tarshishdex.vercel.app node scripts/capture-screenshots.mjs
```

Transaction shots (#4–5) open the verified contract-call hashes on
stellar.expert (Testnet); CI (#7) captures the public GitHub Actions page;
tests (#8) render the local `coverage/index.html` from `npm run test:coverage`.

## Manual capture guide

If you ever need to re-capture by hand:

1. **Run locally**: `npm run dev` → http://localhost:3000 (Freighter installed, account funded on Testnet).
2. **Wallet captures (1–3)**: connect Freighter, open the picker, then the connected dropdown.
3. **Transaction captures (4–5)**: perform a small XLM→USDC swap on Testnet; capture the success panel and then open the hash on stellar.expert.
4. **Mobile (6)**: DevTools device toolbar → iPhone 14 Pro (390×844), capture the Swap page.
5. **CI (7)**: GitHub → Actions → select the latest run → expand both jobs.
6. **Tests (8)**: `npm test` terminal output; optionally `cd src/contracts && cargo test`.
