import { gzipSync, brotliCompressSync } from "zlib";

type CompressionEncoding = "gzip" | "br" | "identity";

/**
 * Select the best compression encoding based on Accept-Encoding header.
 */
export function selectEncoding(acceptEncoding: string | null): CompressionEncoding {
  if (!acceptEncoding) return "identity";
  if (acceptEncoding.includes("br")) return "br";
  if (acceptEncoding.includes("gzip")) return "gzip";
  return "identity";
}

/**
 * Compress a response body string using the selected encoding.
 * Returns [compressedBuffer, contentEncoding] or null if compression
 * isn't beneficial (small payloads).
 */
export function compressResponse(
  body: string,
  encoding: CompressionEncoding
): [Buffer, string] | null {
  const input = Buffer.from(body, "utf-8");

  // Don't compress already-small payloads
  if (input.length < 1024) return null;

  try {
    if (encoding === "br") {
      const compressed = brotliCompressSync(input);
      if (compressed.length < input.length) return [compressed, "br"];
      return null;
    }
    if (encoding === "gzip") {
      const compressed = gzipSync(input);
      if (compressed.length < input.length) return [compressed, "gzip"];
      return null;
    }
  } catch {
    // Compression failed — fall back to uncompressed
  }

  return null;
}
