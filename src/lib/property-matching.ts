import type { AdminProperty, Client } from "@/types";

export function propertyCompatibilityScore(property: AdminProperty, client: Client) {
  let score = 0;
  const desiredPurpose = client.purpose?.toLowerCase().startsWith("comp") ? "venda" : client.purpose ? "aluguel" : null;
  if (desiredPurpose && property.purpose === desiredPurpose) score += 2;
  if (client.propertyType && property.propertyType.toLowerCase() === client.propertyType.toLowerCase()) score += 2;
  if (client.neighborhoods.some((item) => item.toLowerCase() === property.neighborhood.toLowerCase())) score += 2;
  if (!client.minPrice || property.price >= client.minPrice) score += 1;
  if (!client.maxPrice || property.price <= client.maxPrice) score += 1;
  if (!client.bedrooms || (property.bedrooms ?? 0) >= client.bedrooms) score += 1;
  return score;
}
