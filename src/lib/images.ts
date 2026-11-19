export function isValidImageSource(src: unknown): src is string {
  return typeof src === "string" && src.trim().length > 0;
}

export function normalizeImageSource(src: unknown): string | null {
  return isValidImageSource(src) ? src.trim() : null;
}

export function validImageSources(sources: readonly unknown[]): string[] {
  return sources.filter(isValidImageSource).map((src) => src.trim());
}
