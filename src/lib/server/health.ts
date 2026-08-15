import { contract, scValToNative } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";
import { getLimitOrderContractId, getSorobanRpcServer } from "@/lib/soroban/config";

/**
 * Dependency health probes for the /api/health endpoint.
 *
 * Each probe returns a per-check status plus latency/error detail. The
 * overall status is the worst of all checks (ok > degraded > down).
 *
 * "not_configured" is informational: the app is designed to run without
 * deployed contracts (the UI shows a "not configured" state), so a missing
 * contract ID does not downgrade the overall status.
 */

export type CheckStatus = "ok" | "degraded" | "down" | "not_configured";
export type OverallStatus = "ok" | "degraded" | "down";

export interface HealthCheckResult {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
  detail?: string;
}

export interface HealthChecks {
  horizon: HealthCheckResult;
  soroban_rpc: HealthCheckResult;
  limit_order_contract: HealthCheckResult;
}

/** Null account used to simulate read-only contract calls. */
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

/** Per-probe timeout so a hung dependency cannot stall the health endpoint. */
const PROBE_TIMEOUT_MS = 5000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Check that the active network's Horizon endpoint is reachable. */
export async function probeHorizon(): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  try {
    const response = await fetch(getActiveNetwork().horizonUrl, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const latencyMs = Date.now() - startedAt;
    if (response.ok) {
      return { status: "ok", latencyMs };
    }
    return { status: "degraded", latencyMs, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { status: "down", latencyMs: Date.now() - startedAt, error: errorMessage(error) };
  }
}

/** Check that the active network's Soroban RPC endpoint responds to getHealth. */
export async function probeSorobanRpc(): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  try {
    const health = await getSorobanRpcServer().getHealth();
    const latencyMs = Date.now() - startedAt;
    if (health.status === "healthy") {
      return { status: "ok", latencyMs };
    }
    return { status: "degraded", latencyMs, detail: `status=${health.status}` };
  } catch (error) {
    return { status: "down", latencyMs: Date.now() - startedAt, error: errorMessage(error) };
  }
}

/**
 * Check that the limit-order contract is deployed and responds to the
 * read-only get_version call. Returns "not_configured" when no contract ID
 * has been configured for this environment.
 */
export async function probeContract(): Promise<HealthCheckResult> {
  const contractId = getLimitOrderContractId();
  if (!contractId) {
    return {
      status: "not_configured",
      detail: "NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID is not set",
    };
  }
  const { passphrase: networkPassphrase, rpcUrl } = getActiveNetwork();
  const startedAt = Date.now();
  try {
    const transaction = await contract.AssembledTransaction.build({
      contractId,
      method: "get_version",
      args: [],
      publicKey: NULL_ACCOUNT,
      networkPassphrase,
      rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: (scv) => Number(scValToNative(scv)),
    });
    const { result } = await transaction.simulate();
    return { status: "ok", latencyMs: Date.now() - startedAt, detail: `version=${result}` };
  } catch (error) {
    return { status: "down", latencyMs: Date.now() - startedAt, error: errorMessage(error) };
  }
}

/** Reduce per-check statuses to the overall status (worst wins). */
export function overallStatus(checks: HealthCheckResult[]): OverallStatus {
  if (checks.some((check) => check.status === "down")) return "down";
  if (checks.some((check) => check.status === "degraded")) return "degraded";
  return "ok";
}

/** Run all dependency probes concurrently and derive the overall status. */
export async function runHealthChecks(): Promise<{ status: OverallStatus; checks: HealthChecks }> {
  const [horizon, sorobanRpc, limitOrderContract] = await Promise.all([
    probeHorizon(),
    probeSorobanRpc(),
    probeContract(),
  ]);
  return {
    status: overallStatus([horizon, sorobanRpc, limitOrderContract]),
    checks: { horizon, soroban_rpc: sorobanRpc, limit_order_contract: limitOrderContract },
  };
}
