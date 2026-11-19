import type { MetadataRoute } from "next";
import { listPublicProperties } from "@/lib/data/properties";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const properties = await listPublicProperties();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/anuncie-seu-imovel`, changeFrequency: "monthly", priority: 0.6 },
    ...properties.map((property) => ({ url: `${base}/imoveis/${property.slug}`, lastModified: property.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
