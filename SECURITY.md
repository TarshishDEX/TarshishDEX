# Security Policy

## Reporting a Vulnerability

TarshishDEX takes the security of the Stellar ecosystem seriously.

If you discover a security vulnerability — especially one that could affect
funds, private keys, or on-chain contract state — please **do not** open a
public issue. Instead, report it privately:

1. Email the details to the maintainers.
2. Include a clear description, steps to reproduce, and potential impact.
3. Allow up to 72 hours for an initial response.

## Scope

| In scope                                         | Out of scope                         |
| ------------------------------------------------ | ------------------------------------ |
| Soroban smart contracts (`src/contracts/`)       | Frontend cosmetic issues             |
| API routes (`src/app/api/`)                      | Issues in third-party dependencies   |
| Wallet integration (`src/lib/stellar/wallet-*`)  | Phishing attacks on the deployed URL |
| Rate limiting bypass                             | Social engineering                   |
| On-chain preference manipulation                 |                                      |

## Smart Contract Security

Both contracts are deployed on Stellar Testnet and have undergone:

- Unit testing with `mock_all_auths()` for authorization checks
- Slippage validation (max 100% / 10,000 bps)
- Routing mode validation against known values
- TTL-managed persistent storage with automatic expiry
- Admin-gated publisher grants with revocation
- Staleness detection (720 ledger threshold ≈ 1 hour)

### Known Limitations

- **No upgrade mechanism**: Contracts are immutable once deployed. Future
  versions require a new deployment and contract ID.
- **No emergency pause**: There is no circuit-breaker for pausing the oracle
  or preferences contracts.
- **TTL reliance**: Entries expire if not extended; clients must handle
  `NotInitialized` gracefully.

## Dependency Management

- CI runs on every push to `main` and every PR.
- Dependencies are pinned with `package-lock.json`.
- Run `npm audit` periodically or enable Dependabot alerts.

## Responsible Disclosure

We follow a coordinated disclosure process. Once a fix is deployed, we will
credit the reporter (unless anonymity is requested) and publish an advisory.

## Reporting a Vulnerability

If you discover a security vulnerability in TarshishDEX, please report it
responsibly. Do NOT open a public issue.

Email: security@tarshishdex.com

We will acknowledge your report within 48 hours and provide a timeline
for resolution within 5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ |

## Security Model

TarshishDEX is a non-custodial DEX interface. Private keys never leave
the user's wallet. Transactions are signed client-side via the Stellar
Wallets Kit and broadcast directly to the Stellar network.
