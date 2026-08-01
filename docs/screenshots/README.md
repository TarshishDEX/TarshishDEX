# Screenshots

Submission checklist captures for TarshishDEX. Add each image to this folder
and reference it from the README once captured. Images should be PNG, captured
at 1280×800 (desktop) or 390×844 (mobile) viewport.

| #   | Filename                             | What to capture                                                           |
| --- | ------------------------------------ | ------------------------------------------------------------------------- |
| 1   | `wallet-options.png`                 | Wallet picker modal with Freighter and other options visible              |
| 2   | `wallet-connected.png`               | Header showing the connected address chip with green indicator            |
| 3   | `balance-displayed.png`              | Connected wallet dropdown showing the XLM balance                         |
| 4   | `successful-testnet-transaction.png` | Swap completion panel with transaction hash + explorer link               |
| 5   | `transaction-result.png`             | The transaction on stellar.expert (testnet) — verify tx succeeded         |
| 6   | `mobile-responsive.png`              | Swap page at 390×844 viewport — layout intact                             |
| 7   | `ci-pipeline.png`                    | GitHub Actions run showing the `quality` + `contracts` jobs passing       |
| 8   | `test-output.png`                    | `npm test` output showing 57+ passing tests (and `cargo test` 11 passing) |

## Capture guide

1. **Run locally**: `npm run dev` → http://localhost:3000 (Freighter installed, account funded on Testnet).
2. **Wallet captures (1–3)**: connect Freighter, open the picker, then the connected dropdown.
3. **Transaction captures (4–5)**: perform a small XLM→USDC swap on Testnet; capture the success panel and then open the hash on stellar.expert.
4. **Mobile (6)**: DevTools device toolbar → iPhone 14 Pro (390×844), capture the Swap page.
5. **CI (7)**: GitHub → Actions → select the latest run → expand both jobs.
6. **Tests (8)**: `npm test` terminal output; optionally `cd src/contracts && cargo test`.
