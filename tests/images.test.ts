import assert from "node:assert/strict";
import test from "node:test";
import { isValidImageSource, normalizeImageSource, validImageSources } from "../src/lib/images.ts";

test("rejeita fontes de imagem ausentes ou vazias", () => {
  assert.equal(isValidImageSource(""), false);
  assert.equal(isValidImageSource("   \n\t"), false);
  assert.equal(isValidImageSource(null), false);
  assert.equal(isValidImageSource(undefined), false);
});

test("normaliza e preserva somente URLs de imagem válidas", () => {
  assert.equal(normalizeImageSource("  https://example.com/imovel.jpg  "), "https://example.com/imovel.jpg");
  assert.deepEqual(
    validImageSources(["", null, undefined, "   ", " /brand/imovel.webp "]),
    ["/brand/imovel.webp"],
  );
});
