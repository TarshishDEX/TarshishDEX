# Screenshots

Product and submission-checklist captures for TarshishDEX — all captured against
the live deploy and referenced from the README. PNG, 1280×800 (desktop) /
390×844 (mobile).

## Product pages

| #   | Filename        | What is captured                                          |
| --- | --------------- | --------------------------------------------------------- |
| 1   | `swap.png`      | Swap widget — token pair, amount, route quote              |
| 2   | `markets.png`   | Live market table with orderbook depth                    |
| 3   | `portfolio.png` | Portfolio dashboard — balances, allocation, trade history |
| 4   | `analytics.png` | Candlestick + volume analytics charts                     |
| 5   | `assets.png`    | Asset discovery browser                                   |
| 6   | `orders.png`    | On-chain limit order form + order table                   |

## Wallet, transactions & CI checklist

| #   | Filename                             | What is captured                                                     |
| --- | ------------------------------------ | -------------------------------------------------------------------- |
| 7   | `wallet-options.png`                 | Wallet picker modal with Freighter and other options visible         |
| 8   | `wallet-connected.png`               | Header showing the connected address chip with green indicator       |
| 9   | `balance-displayed.png`              | Connected wallet dropdown showing the XLM balance                    |
| 10  | `successful-testnet-transaction.png` | Real contract-call tx on stellar.expert (testnet) — verified SUCCESS |
| 11  | `transaction-result.png`             | Second real on-chain tx (publish → PricePublished)                   |
| 12  | `mobile-responsive.png`              | Swap page at 390×844 viewport — layout intact                        |
| 13  | `ci-pipeline.png`                    | GitHub Actions run showing the `quality` + `contracts` jobs passing  |
| 14  | `test-output.png`                    | Coverage report — 2,083 tests passing (119 files)                    |

## Automated capture

- **Product pages** (`swap`, `markets`, `portfolio`, `analytics`, `assets`,
  `orders`): captured with `scripts/capture-product-screenshots.mjs`.
- **Wallet/UI checklist**: captured with `scripts/capture-screenshots.mjs`.

Both run headlessly with Playwright against the live URL, using a **Freighter
stub** (see `scripts/lib/freighter-stub.mjs`):

- freighter-api v6 `isConnected()` short-circuits on a truthy `window.freighter`
  so the wallet picker opens without an extension;
- `getAddress()`/`requestAccess()`/`getNetwork()` use a `window.postMessage`
  protocol (FREIGHTER_EXTERNAL_MSG_REQUEST/RESPONSE) — the stub answers it
  with a real friendbot-funded Testnet account, so the kit's connect flow
  resolves and the WalletProvider keeps the session (real Horizon balance).

```bash
BASE_URL=https://tarshishdex.vercel.app node scripts/capture-product-screenshots.mjs
BASE_URL=https://tarshishdex.vercel.app node scripts/capture-screenshots.mjs
```

Transaction shots open the verified contract-call hashes on stellar.expert
(Testnet); CI captures the public GitHub Actions page; tests render the local
`coverage/index.html` from `npm run test:coverage`.

## Manual capture guide

If you ever need to re-capture by hand:

1. **Run locally**: `npm run dev` → http://localhost:3000 (Freighter installed, account funded on Testnet).
2. **Product pages**: visit `/swap`, `/markets`, `/portfolio`, `/analytics`, `/assets`, `/orders` and capture at 1280×800.
3. **Wallet captures**: connect Freighter, open the picker, then the connected dropdown.
4. **Transaction captures**: perform a small XLM→USDC swap on Testnet; capture the success panel and then open the hash on stellar.expert.
5. **Mobile**: DevTools device toolbar → iPhone 14 Pro (390×844), capture the Swap page.
6. **CI**: GitHub → Actions → select the latest run → expand both jobs.
7. **Tests**: `npm test` terminal output; optionally `cd src/contracts && cargo test`.
