const extensionsByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function imageExtension(mime: string) {
  return extensionsByMime[mime] ?? null;
}

export function hasValidImageSignature(mime: string, bytes: Uint8Array) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mime === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function isSafeImageFile(file: File) {
  const extension = imageExtension(file.type);
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !fileExtension) return false;
  if (file.type === "image/jpeg" ? !["jpg", "jpeg"].includes(fileExtension) : fileExtension !== extension) return false;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return hasValidImageSignature(file.type, bytes);
}
