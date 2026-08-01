/**
 * Shared Freighter extension stub for the capture scripts.
 *
 * Two mechanisms matter when stubbing the extension for StellarWalletsKit:
 * 1. freighter-api v6 `isConnected()` short-circuits on a truthy
 *    `window.freighter`, so presence alone makes `isAvailable()` true and the
 *    wallet picker opens.
 * 2. `getAddress()`/`requestAccess()`/`getNetwork()` talk to the extension
 *    over a `window.postMessage` protocol (FREIGHTER_EXTERNAL_MSG_REQUEST →
 *    FREIGHTER_EXTERNAL_MSG_RESPONSE echoing the messageId) — the methods on
 *    `window.freighter` are never called by v6. Without a responder the kit's
 *    connect hangs and the WalletProvider wipes the persisted session, so we
 *    answer every request with the funded Testnet account.
 *
 * Inject via `context.addInitScript(FREIGHTER_STUB, { acct, session })`.
 */

export const ACCOUNT =
  process.env.ACCOUNT ?? "GC7J7IBB6FY55R4ZFA2UNCBNEF466CHD2R7RQRH2NHC2YPY6M355XURR";

export const PASSPHRASE = "Test SDF Network ; September 2015";

// Persisted wallet-store shape (zustand persist JSON under the store name).
export const SESSION = {
  state: { address: ACCOUNT, networkPassphrase: PASSPHRASE },
  version: 0,
};

export const FREIGHTER_STUB = ({ acct, session }) => {
  const storeKey = "tarshishdex-wallet";
  const passphrase = "Test SDF Network ; September 2015";
  // Legacy surface (kept truthy so isConnected() short-circuits).
  window.freighter = {
    isConnected: () => Promise.resolve({ isConnected: true }),
    isAllowed: () => Promise.resolve({ isAllowed: true }),
    getPublicKey: () => Promise.resolve(acct),
    getAddress: () => Promise.resolve({ address: acct }),
    requestAccess: () => Promise.resolve(acct),
    signTransaction: (tx) => Promise.resolve(tx),
  };
  // Answer the extension-messaging protocol the kit actually uses.
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;
    const id = data.messageId ?? data.messagedId;
    window.postMessage(
      {
        source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
        messagedId: id,
        messageId: id,
        isConnected: true,
        isAllowed: true,
        publicKey: acct,
        address: acct,
        network: "TESTNET",
        networkPassphrase: passphrase,
        networkDetails: { network: "TESTNET", networkPassphrase: passphrase },
      },
      window.location.origin
    );
  });
  try {
    localStorage.setItem(storeKey, JSON.stringify(session));
  } catch {}
};
