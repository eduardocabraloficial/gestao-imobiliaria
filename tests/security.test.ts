import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { allowRequest, isDemoModeAllowed, isSameOriginRequest, safeInternalPath } from "../src/lib/security.ts";
import { hasValidImageSignature } from "../src/lib/upload-security.ts";

test("aceita apenas redirecionamentos internos", () => {
  assert.equal(safeInternalPath("/admin/clientes?q=ana"), "/admin/clientes?q=ana");
  assert.equal(safeInternalPath("//evil.example"), "/admin");
  assert.equal(safeInternalPath("https://evil.example"), "/admin");
  assert.equal(safeInternalPath("/\\evil.example"), "/admin");
  assert.equal(safeInternalPath("/%2f%2fevil.example"), "/admin");
});

test("bloqueia requisições mutáveis sem origem correspondente", () => {
  assert.equal(isSameOriginRequest(new Request("https://app.example/api/auth/login", { headers: { origin: "https://app.example" } })), true);
  assert.equal(isSameOriginRequest(new Request("https://app.example/api/auth/login", { headers: { origin: "https://evil.example" } })), false);
  assert.equal(isSameOriginRequest(new Request("https://app.example/api/auth/login")), false);
});

test("limita tentativas por janela", () => {
  const key = `test-${Math.random()}`;
  assert.equal(allowRequest(key, 2, 1000, 100), true);
  assert.equal(allowRequest(key, 2, 1000, 101), true);
  assert.equal(allowRequest(key, 2, 1000, 102), false);
  assert.equal(allowRequest(key, 2, 1000, 1200), true);
});

test("desabilita o modo demonstrativo em produção", () => {
  assert.equal(isDemoModeAllowed(false, "production"), false);
  assert.equal(isDemoModeAllowed(false, "development"), true);
  assert.equal(isDemoModeAllowed(true, "development"), false);
});

test("mantém a ordem imutável das migrations", () => {
  const files = [
    "202611090001_phase2_crm.sql",
    "202611090002_properties_and_interests.sql",
    "202611090003_appointments_and_tasks.sql",
    "202611100004_public_portal_leads_and_storage.sql",
    "202611100005_funnel_reports_and_settings.sql",
    "202611100006_security_hardening.sql",
  ];
  for (const file of files) assert.ok(readFileSync(`supabase/migrations/${file}`, "utf8").length > 0);
  assert.deepEqual([...files].sort(), files);
});

test("valida assinaturas reais das imagens", () => {
  assert.equal(hasValidImageSignature("image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(hasValidImageSignature("image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(hasValidImageSignature("image/jpeg", Uint8Array.from([0x3c, 0x73, 0x63, 0x72])), false);
});

test("React escapa conteúdo controlado pelo usuário", () => {
  const html = renderToStaticMarkup(createElement("p", null, '<img src=x onerror="alert(1)">'));
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("<img"));
});

test("migração de segurança restringe captações ao proprietário", () => {
  const migration = readFileSync("supabase/migrations/202611100006_security_hardening.sql", "utf8");
  assert.match(migration, /submissions_select_own/);
  assert.match(migration, /auth\.uid\(\)\) = user_id/);
  assert.doesNotMatch(migration, /using \(true\)/);
});

test("migração restringe execução direta de funções SECURITY DEFINER internas", () => {
  const migration = readFileSync("supabase/migrations/202611190002_restrict_security_definer_execute.sql", "utf8");
  for (const functionName of ["handle_new_user", "record_client_stage_change", "rls_auto_enable"]) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${functionName}\\(\\) from public;`));
    assert.match(migration, new RegExp(`revoke all on function public\\.${functionName}\\(\\) from anon, authenticated;`));
  }
  assert.match(migration, /submit_property_lead[\s\S]+to anon, authenticated;/);
  assert.match(migration, /submit_property_submission[\s\S]+to anon, authenticated;/);
  assert.match(migration, /convert_lead_to_client\(uuid\)[\s\S]+to authenticated;/);
  assert.doesNotMatch(migration, /alter table|insert into|update public\.|delete from/i);
});
