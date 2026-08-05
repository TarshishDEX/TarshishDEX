import type { Metadata } from "next";

interface SeoInput {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tarshishdex.vercel.app";
const SITE_NAME = "TarshishDEX";
const DEFAULT_DESC =
  "A production-grade decentralized trading interface built exclusively on Stellar's native DEX and Soroban smart contracts.";

/**
 * Build page metadata for SEO and social sharing.
 * Provides sensible defaults for all Open Graph and Twitter tags.
 */
export function buildSeo(input: SeoInput): Metadata {
  const title = input.title.includes(SITE_NAME) ? input.title : `${input.title} · ${SITE_NAME}`;
  const description = input.description ?? DEFAULT_DESC;
  const url = input.path ? `${BASE_URL}${input.path}` : BASE_URL;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(input.image ? { images: [{ url: input.image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(input.image ? { images: [input.image] } : {}),
    },
  };
}
