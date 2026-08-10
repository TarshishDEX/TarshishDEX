/**
 * Environment configuration validation.
 * Validates all required environment variables at startup to fail fast
 * rather than encountering cryptic runtime errors.
 */

const requiredVars = ["NEXT_PUBLIC_STELLAR_NETWORK"] as const;

const optionalVars = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID",
  "NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID",
  "NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID",
  "NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS",
  "LOG_LEVEL",
  "HORIZON_URL",
] as const;

/** Stellar contract ID format: 56-char base32 starting with C. */
const CONTRACT_ID_PATTERN = /^C[A-Z2-7]{55}$/;

/** Stellar public key format: 56-char base32 starting with G. */
const PUBLIC_KEY_PATTERN = /^G[A-Z2-7]{55}$/;

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`[env] Missing required environment variables: ${missing.join(", ")}`);
  }

  // Log warnings for optional but recommended vars
  for (const key of optionalVars) {
    if (!process.env[key]) {
      console.warn(`[env] Optional environment variable not set: ${key}`);
    }
  }

  // Validate contract ID format if set
  const contractIdVars = [
    "NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID",
    "NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID",
    "NEXT_PUBLIC_LIMIT_ORDER_CONTRACT_ID",
  ];
  for (const key of contractIdVars) {
    const value = process.env[key];
    if (value && !CONTRACT_ID_PATTERN.test(value)) {
      console.error(
        `[env] Invalid contract ID format for ${key}: expected 56-char base32 starting with C, got "${value}"`
      );
    }
  }

  // Validate fee collector address format if set
  const feeAddr = process.env.NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS;
  if (feeAddr && !PUBLIC_KEY_PATTERN.test(feeAddr)) {
    console.error(
      `[env] Invalid fee collector address: expected 56-char Stellar public key starting with G`
    );
  }

  return { valid: missing.length === 0, missing };
}

/** Get a validated environment variable or throw. */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }
  return value;
}

/** Get an optional environment variable with a default fallback. */
export function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}
