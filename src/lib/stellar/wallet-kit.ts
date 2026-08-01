import { getActiveNetwork } from "@/lib/stellar/config";

/**
 * The StellarWalletsKit v2.5 API is a static, browser-only singleton
 * (`StellarWalletsKit.init / authModal / signTransaction / on`). It must never
 * be evaluated during SSR, so we lazy-load it via dynamic import and expose a
 * tiny async facade. All calls below run exclusively on the client.
 */

type KitModule = typeof import("@creit.tech/stellar-wallets-kit");

let initPromise: Promise<void> | null = null;
let loadedKit: KitModule | null = null;

async function ensureKit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const [kit, moduleUtils] = await Promise.all([
        import("@creit.tech/stellar-wallets-kit"),
        import("@creit.tech/stellar-wallets-kit/modules/utils"),
      ]);
      loadedKit = kit;
      const network = getActiveNetwork();
      kit.StellarWalletsKit.init({
        modules: moduleUtils.defaultModules(),
        network: network.name === "testnet" ? kit.Networks.TESTNET : kit.Networks.PUBLIC,
      });
    })();
  }
  await initPromise;
}

/** Load the kit and initialize it exactly once for the active network. */
export async function getWalletKit(): Promise<KitModule> {
  await ensureKit();
  // ensureKit always resolves before returning, so this is safe.
  return loadedKit!;
}

/** Open the kit's wallet-picker modal and return the connected address. */
export async function connectWallet(): Promise<string> {
  const kit = await getWalletKit();
  const { address } = await kit.StellarWalletsKit.authModal();
  return address;
}

/** Disconnect the active wallet module. */
export async function disconnectWallet(): Promise<void> {
  const kit = await getWalletKit();
  await kit.StellarWalletsKit.disconnect();
}

/**
 * Subscribe to wallet lifecycle events. Returns an unsubscribe function.
 * Fired whenever the kit's internal state changes (connect, account switch,
 * network change, disconnect).
 */
export async function subscribeWalletEvents(callbacks: {
  onStateUpdated?: (address: string | undefined, networkPassphrase: string) => void;
  onDisconnect?: () => void;
}): Promise<() => void> {
  const kit = await getWalletKit();
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    kit.StellarWalletsKit.on(kit.KitEventType.STATE_UPDATED, (event) => {
      callbacks.onStateUpdated?.(event.payload.address, event.payload.networkPassphrase);
    })
  );
  unsubscribers.push(
    kit.StellarWalletsKit.on(kit.KitEventType.DISCONNECT, () => {
      callbacks.onDisconnect?.();
    })
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Detect whether a wallet extension is installed and reachable.
 *
 * Presence of the Freighter browser global is the primary signal — an
 * installed-but-not-yet-approved extension is still "available" (the user can
 * approve from the picker), so we must not conflate it with "not installed".
 * When the global is absent we fall back to the freighter-api handshake, and
 * only resolve `false` when the extension truly isn't present.
 */
export async function isWalletAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // @ts-expect-error — Freighter injects a `window.freighter` global.
  if (typeof window.freighter !== "undefined") {
    return true;
  }

  // Fallback: ask the freighter-api module directly. The handshake rejects
  // only when the extension is genuinely missing.
  try {
    const { isConnected } = await import("@stellar/freighter-api");
    await isConnected();
    return true;
  } catch {
    return false;
  }
}

/** Sign a transaction XDR string with the connected wallet. */
export async function signTransactionXdr(
  transactionXdr: string,
  opts: { networkPassphrase: string; address: string }
): Promise<string> {
  const kit = await getWalletKit();
  const { signedTxXdr } = await kit.StellarWalletsKit.signTransaction(transactionXdr, {
    networkPassphrase: opts.networkPassphrase,
    address: opts.address,
  });
  return signedTxXdr;
}
