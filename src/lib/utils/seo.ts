import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tarshishdex.vercel.app";
const OG_IMAGE = `${BASE_URL}/og-image.svg`;

interface PageSeoOptions {
  title: string;
  description: string;
  /** Relative path (e.g. "/swap"). Defaults to BASE_URL. */
  path?: string;
}

/**
 * Build consistent SEO metadata for any page.
 * Falls back to sensible defaults for the TarshishDEX brand.
 */
export function buildPageMetadata({ title, description, path = "/" }: PageSeoOptions): Metadata {
  const url = `${BASE_URL}${path}`;
  const fullTitle = `${title} · TarshishDEX`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "TarshishDEX",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}
