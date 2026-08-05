/**
 * Fetch asset metadata from stellar.toml files.
 * Many Stellar issuers publish a stellar.toml with token metadata
 * (name, icon, description, etc.). This utility fetches and caches
 * that data for richer token displays.
 */

interface TomlMetadata {
  name?: string;
  code?: string;
  issuer?: string;
  image?: string;
  description?: string;
  domain?: string;
}

const cache = new Map<string, TomlMetadata | null>();

/**
 * Fetch and parse the stellar.toml for a domain.
 * Results are cached in memory for the session.
 */
export async function fetchTomlMetadata(domain: string): Promise<TomlMetadata | null> {
  if (cache.has(domain)) return cache.get(domain) ?? null;

  try {
    const tomlUrl = `https://${domain}/.well-known/stellar.toml`;
    const response = await fetch(tomlUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    // Minimal TOML parser for the CURRENCIES section only
    const metadata = parseCurrenciesToml(text);
    cache.set(domain, metadata);
    return metadata;
  } catch {
    cache.set(domain, null);
    return null;
  }
}

/**
 * Minimal TOML string parser for Stellar CURRENCIES section.
 * Extracts [[CURRENCIES]] entries. Not a full TOML parser — just
 * enough to read the relevant fields.
 */
function parseCurrenciesToml(toml: string): TomlMetadata | null {
  const lines = toml.split("\n");
  let inCurrencies = false;
  const result: TomlMetadata = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\[\[?CURRENCIES\]\]?$/i.test(trimmed)) {
      inCurrencies = true;
      continue;
    }
    if (inCurrencies && /^\[/.test(trimmed)) {
      break; // Next section
    }
    if (!inCurrencies) continue;

    const match = trimmed.match(/^(\w+)\s*=\s*["'](.+)["']/);
    if (match) {
      const [, key, value] = match;
      const keyLower = key.toLowerCase();
      if (keyLower === "code") result.code = value;
      if (keyLower === "name") result.name = value;
      if (keyLower === "image") result.image = value;
      if (keyLower === "desc" || keyLower === "description") result.description = value;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}
