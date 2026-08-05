import { z } from "zod";

/**
 * Zod validation schemas for API route parameters.
 * These mirror the hand-rolled validation in params.ts but add richer
 * error messages, refinements, and reusability across routes.
 */

/** Parse "CODE:ISSUER" or "XLM" into {code, issuer?}. */
export const assetSchema = z
  .string()
  .trim()
  .min(1, "Asset identifier is required")
  .transform((val, ctx) => {
    const upper = val.toUpperCase();
    if (upper === "XLM" || upper === "NATIVE") {
      return { code: "XLM", isNative: true as const };
    }
    const parts = val.split(":");
    if (parts.length !== 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expected CODE:ISSUER format" });
      return z.NEVER;
    }
    const [code, issuer] = parts;
    if (!code || code.length < 1 || code.length > 12 || !/^[a-zA-Z0-9]+$/.test(code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Asset code must be 1-12 alphanumeric characters",
      });
      return z.NEVER;
    }
    if (!issuer || !/^G[A-Z2-7]{55}$/.test(issuer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Issuer must be a valid Stellar public key (starts with G)",
      });
      return z.NEVER;
    }
    return { code: code.toUpperCase(), issuer };
  });

/** Positive decimal amount string. */
export const amountSchema = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Amount must be a positive number");

/** Slippage percentage (0-50). */
export const slippageSchema = z.coerce
  .number()
  .min(0, "Slippage must be ≥ 0")
  .max(50, "Slippage must be ≤ 50%")
  .default(1);

/** Positive integer limit. */
export const limitSchema = z.coerce
  .number()
  .int("Limit must be an integer")
  .min(1)
  .max(200)
  .default(20);

/** Duration in milliseconds (positive). */
export const durationMsSchema = z.coerce
  .number()
  .int()
  .min(1_000, "Duration must be ≥ 1 second")
  .max(90 * 86_400_000, "Duration must be ≤ 90 days");

/** Valid Stellar public key. */
export const addressSchema = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar public key (must start with G, 56 chars)");

/** Swap quote query params. */
export const swapQuoteParamsSchema = z.object({
  input: assetSchema,
  output: assetSchema,
  amount: amountSchema,
  slippage: slippageSchema,
});

/** Market stats query params. */
export const marketStatsParamsSchema = z.object({
  limit: limitSchema,
});

/** Candles query params. */
export const candlesParamsSchema = z.object({
  base: assetSchema,
  counter: assetSchema,
  resolution: durationMsSchema.default(3_600_000),
  range: durationMsSchema.default(86_400_000),
});

/** Orderbook query params. */
export const orderbookParamsSchema = z.object({
  selling: assetSchema,
  buying: assetSchema,
  limit: limitSchema,
});

/** Assets query params. */
export const assetsParamsSchema = z.object({
  limit: limitSchema,
  code: z.string().optional(),
  issuer: z.string().optional(),
});

/** Events query params. */
export const eventsParamsSchema = z.object({
  base: assetSchema.optional(),
  counter: assetSchema,
});
