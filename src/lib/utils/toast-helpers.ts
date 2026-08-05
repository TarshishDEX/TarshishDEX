import { toast } from "@/components/ui/toast";

/**
 * Convenience toast wrappers for common app scenarios.
 */

/** Notify the user of a successful swap. */
export function notifySwapSuccess(txHash: string): void {
  toast.success(`Swap completed! Tx: ${txHash.slice(0, 12)}…`);
}

/** Notify the user of a failed swap. */
export function notifySwapFailed(reason: string): void {
  toast.error(`Swap failed: ${reason}`);
}

/** Notify the user that their wallet connected. */
export function notifyWalletConnected(): void {
  toast.success("Wallet connected");
}

/** Notify the user that their wallet disconnected. */
export function notifyWalletDisconnected(): void {
  toast.info("Wallet disconnected");
}

/** Notify about a price alert trigger. */
export function notifyPriceAlert(asset: string, price: number, direction: string): void {
  toast.info(`${asset} is now ${direction} ${price.toFixed(6)}`);
}
