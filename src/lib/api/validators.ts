import { z } from "zod";

/**
 * Zod schemas for validating all API route inputs.
 * Used in route handlers to provide structured validation errors.
 */

/** Validates a Stellar asset in CODE:ISSUER format. */
export const assetParamSchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (val) => {
      if (val === "XLM" || val === "native") return true;
      const parts = val.split(":");
      return (
        parts.length === 2 &&
        parts[0]!.length >= 1 &&
        parts[0]!.length <= 12 &&
        parts[1]!.length === 56 &&
        parts[1]!.startsWith("G")
      );
    },
    { message: "Must be 'XLM' or 'CODE:G...' (56-char issuer)" }
  );

/** Validates a positive decimal amount string. */
export const amountParamSchema = z
  .string()
  .min(1)
  .refine(
    (val) => {
      const n = Number(val);
      return !Number.isNaN(n) && n > 0 && Number.isFinite(n);
    },
    { message: "Must be a positive number" }
  );

/** Validates slippage percentage (0–100). */
export const slippageParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    const n = Number(val ?? "1");
    return Number.isNaN(n) ? 1 : n;
  })
  .pipe(z.number().min(0.01).max(100));

/** Validates a Stellar public key (G...). */
export const addressParamSchema = z
  .string()
  .length(56)
  .refine((val) => val.startsWith("G"), {
    message: "Must be a valid Stellar public key starting with 'G'",
  });

/** Validates a positive integer limit parameter. */
export const limitParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    const n = Number(val ?? "20");
    return Number.isNaN(n) ? 20 : n;
  })
  .pipe(z.number().int().min(1).max(200));

/** Validates candle resolution (1m, 5m, 15m, 1h, 4h, 1d). */
export const resolutionParamSchema = z.enum([
  "60000",
  "300000",
  "900000",
  "3600000",
  "14400000",
  "86400000",
]);

/** Validates candle range in milliseconds (positive). */
export const rangeParamSchema = z
  .string()
  .optional()
  .transform((val) => {
    const n = Number(val ?? "86400000");
    return Number.isNaN(n) ? 86400000 : n;
  })
  .pipe(z.number().int().positive());
