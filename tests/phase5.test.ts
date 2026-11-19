import assert from "node:assert/strict";
import test from "node:test";
import { demoAdminProperties } from "../src/lib/demo-properties.ts";
import { filterPublicProperties, isPubliclyVisible, toPublicProperty } from "../src/lib/public-properties.ts";
import { validateInterest, validateSubmission } from "../src/lib/public-forms.ts";
import { canConvertLead, convertedInterestLink, leadBelongsToUser } from "../src/lib/leads.ts";

test("exibe somente imóvel público e disponível", () => {
  const visible = filterPublicProperties(demoAdminProperties, {});
  assert.ok(visible.every(isPubliclyVisible));
  assert.ok(!visible.some((property) => property.status === "vendido" || property.status === "inativo" || !property.isPublic));
});

test("aplica filtros públicos de finalidade, bairro, preço, quartos e código", () => {
  const result = filterPublicProperties(demoAdminProperties, { purpose: "venda", neighborhood: "jardim", maxPrice: 1_200_000, bedrooms: 3, code: "1042" });
  assert.equal(result.length, 1); assert.equal(result[0].code, "AP-1042");
});

test("imóvel real sem imagem não recebe fallback demonstrativo", () => {
  const property = toPublicProperty({ ...demoAdminProperties[0], imageUrl: "https://example.com/demo.jpg", images: [] });
  assert.equal(property.image, "");
  assert.deepEqual(property.images, []);
});

test("imóvel real usa a única imagem válida do Storage", () => {
  const property = toPublicProperty({
    ...demoAdminProperties[0],
    images: [{ id: "image-1", propertyId: "property-1", storagePath: "owner/property/image-1.jpg", url: " https://storage.example/image-1.jpg ", isCover: true, sortOrder: 0 }],
  });
  assert.equal(property.image, "https://storage.example/image-1.jpg");
  assert.equal(property.images.length, 1);
});

test("imóvel real ordena capa antes das demais imagens e ignora URL inválida", () => {
  const property = toPublicProperty({
    ...demoAdminProperties[0],
    images: [
      { id: "image-2", propertyId: "property-1", storagePath: "owner/property/image-2.jpg", url: "https://storage.example/image-2.jpg", isCover: false, sortOrder: 1 },
      { id: "image-3", propertyId: "property-1", storagePath: "owner/property/image-3.jpg", url: "https://storage.example/image-3.jpg", isCover: true, sortOrder: 2 },
      { id: "image-empty", propertyId: "property-1", storagePath: "owner/property/image-empty.jpg", url: "   ", isCover: false, sortOrder: 0 },
      { id: "image-1", propertyId: "property-1", storagePath: "owner/property/image-1.jpg", url: "https://storage.example/image-1.jpg", isCover: false, sortOrder: 0 },
    ],
  });
  assert.equal(property.image, "https://storage.example/image-3.jpg");
  assert.deepEqual(property.images.map((image) => image.id), ["image-3", "image-1", "image-2"]);
});

test("após excluir a capa, a próxima imagem válida assume o thumbnail", () => {
  const property = toPublicProperty({
    ...demoAdminProperties[0],
    images: [
      { id: "image-1", propertyId: "property-1", storagePath: "owner/property/image-1.jpg", url: "https://storage.example/image-1.jpg", isCover: true, sortOrder: 0 },
      { id: "image-2", propertyId: "property-1", storagePath: "owner/property/image-2.jpg", url: "https://storage.example/image-2.jpg", isCover: false, sortOrder: 1 },
    ].filter((image) => image.id !== "image-1"),
  });
  assert.equal(property.image, "https://storage.example/image-2.jpg");
});

test("somente imóvel demo pode reutilizar sua imagem fictícia", () => {
  const property = toPublicProperty({ ...demoAdminProperties[0], images: [] }, true);
  assert.equal(property.image, demoAdminProperties[0].imageUrl);
});

test("valida formulário de interesse e bloqueia honeypot", () => {
  const valid = { propertySlug: "apartamento-ap-001", name: "Ana Silva", phone: "(11) 99999-9999", whatsapp: "", email: "ana@example.com", message: "Tenho interesse.", website: "" };
  assert.equal(validateInterest(valid), null);
  assert.equal(validateInterest({ ...valid, website: "spam.example" }), "invalid");
  assert.equal(validateInterest({ ...valid, email: "invalido" }), "invalid");
});

test("valida captação de imóvel", () => {
  assert.equal(validateSubmission({ ownerName: "Carlos", phone: "11999999999", email: "carlos@example.com", purpose: "venda", propertyType: "Casa", neighborhood: "Centro", city: "Recife", desiredPrice: 500000, description: "Casa ampla", website: "" }), null);
});

test("impede conversão duplicada e cria vínculo lead-imóvel", () => {
  const lead = { id: "lead-1", propertyId: "property-1", status: "novo" as const, convertedClientId: null };
  assert.equal(canConvertLead(lead), true);
  assert.equal(canConvertLead({ status: "convertido", convertedClientId: "client-1" }), false);
  assert.deepEqual(convertedInterestLink(lead, "client-1").propertyId, "property-1");
});

test("isola leads por usuário", () => {
  assert.equal(leadBelongsToUser("user-a", "user-a"), true);
  assert.equal(leadBelongsToUser("user-a", "user-b"), false);
});
