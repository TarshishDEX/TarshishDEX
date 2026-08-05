import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tarshishdex.vercel.app";
  const lastModified = new Date().toISOString();

  const routes = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/swap`, priority: 0.9 },
    { url: `${baseUrl}/markets`, priority: 0.8 },
    { url: `${baseUrl}/portfolio`, priority: 0.8 },
    { url: `${baseUrl}/assets`, priority: 0.7 },
    { url: `${baseUrl}/analytics`, priority: 0.7 },
  ];

  return routes.map((route) => ({
    url: route.url,
    lastModified,
    changeFrequency: "daily" as const,
    priority: route.priority,
  }));
}
