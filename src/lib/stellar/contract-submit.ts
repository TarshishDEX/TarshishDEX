"use client";

import { TransactionBuilder } from "@stellar/stellar-sdk";
import { signTransactionXdr } from "@/lib/stellar/wallet-kit";
import { getHorizonServer } from "@/lib/stellar/horizon";

/**
 * Sign a Soroban contract invocation XDR with the user's wallet and submit it.
 * Used by limit-order form and table for place_order, cancel_order, mark_executed.
 *
 * Returns { success: true, hash } or { success: false, error }.
 */
export async function signAndSubmitContractTx(
  txXdr: string,
  userAddress: string,
  networkPassphrase: string
): Promise<{ success: true; hash: string } | { success: false; error: string }> {
  try {
    const signedXdr = await signTransactionXdr(txXdr, {
      networkPassphrase,
      address: userAddress,
    });

    const parsed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const server = getHorizonServer();
    const result = await server.submitTransaction(parsed);

    return { success: true, hash: result.hash };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction failed";
    return { success: false, error: message };
  }
}
