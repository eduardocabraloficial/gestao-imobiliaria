import type { AdminProperty, Property } from "@/types";
import { normalizeImageSource } from "./images.ts";

export interface PublicPropertyFilters {
  purpose?: string; propertyType?: string; neighborhood?: string; city?: string;
  minPrice?: number | null; maxPrice?: number | null; bedrooms?: number | null; code?: string; sort?: string;
}

export function isPubliclyVisible(property: Pick<AdminProperty, "isPublic" | "status">) {
  return property.isPublic && property.status === "disponivel";
}

export function formatPropertyPrice(value: number, purpose: AdminProperty["purpose"]) {
  const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return purpose === "aluguel" ? `${price}/mês` : price;
}

export function toPublicProperty(property: AdminProperty, demoMode = false): Property {
  const images = property.images
    .flatMap((image) => {
      const url = normalizeImageSource(image.url);
      return url ? [{ ...image, url }] : [];
    })
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
  const cover = images[0];
  const demoImage = demoMode ? normalizeImageSource(property.imageUrl) : null;
  return {
    id: property.id, slug: property.slug, code: property.code, title: property.title,
    neighborhood: property.neighborhood, city: property.city, price: formatPropertyPrice(property.price, property.purpose),
    purpose: property.purpose === "venda" ? "Venda" : "Aluguel", area: property.area ?? 0,
    bedrooms: property.bedrooms ?? 0, bathrooms: property.bathrooms ?? 0, parking: property.parkingSpaces ?? 0,
    image: cover?.url ?? demoImage ?? "",
    propertyType: property.propertyType, description: property.description, condominiumFee: property.condominiumFee,
    iptu: property.iptu, suites: property.suites ?? 0, characteristics: property.characteristics,
    images, createdAt: property.createdAt, featured: property.featured,
  };
}

export function filterPublicProperties(properties: AdminProperty[], filters: PublicPropertyFilters) {
  const normalized = (value?: string) => value?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const result = properties.filter(isPubliclyVisible).filter((property) => {
    if (filters.purpose && property.purpose !== filters.purpose) return false;
    if (filters.propertyType && normalized(property.propertyType) !== normalized(filters.propertyType)) return false;
    if (filters.neighborhood && !normalized(property.neighborhood).includes(normalized(filters.neighborhood))) return false;
    if (filters.city && !normalized(property.city).includes(normalized(filters.city))) return false;
    if (filters.code && !normalized(property.code).includes(normalized(filters.code))) return false;
    if (filters.minPrice !== null && filters.minPrice !== undefined && property.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && filters.maxPrice !== undefined && property.price > filters.maxPrice) return false;
    if (filters.bedrooms !== null && filters.bedrooms !== undefined && (property.bedrooms ?? 0) < filters.bedrooms) return false;
    return true;
  });
  return result.sort((a, b) => filters.sort === "price_asc" ? a.price - b.price : filters.sort === "price_desc" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt));
}

export function slugifyProperty(title: string, code: string) {
  return `${title}-${code}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
