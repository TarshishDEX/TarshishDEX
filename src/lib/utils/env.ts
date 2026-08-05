/**
 * Runtime environment detection utilities.
 */

/** True when running on the server (Node.js). */
export const isServer = typeof window === "undefined";

/** True when running in the browser. */
export const isBrowser = typeof window !== "undefined";

/** True in development mode. */
export const isDev = process.env.NODE_ENV === "development";

/** True in production mode. */
export const isProd = process.env.NODE_ENV === "production";

/** True in test mode. */
export const isTest = process.env.NODE_ENV === "test";

/** True when the app is running in a Vercel deployment. */
export const isVercel = Boolean(process.env.VERCEL);

/** The application version from package.json (set at build time). */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
