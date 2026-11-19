import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error("Supabase staging não configurado.");

const runId = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const password = `Rls!${randomBytes(18).toString("hex")}`;
const accounts = {
  A: { email: `rls-a-${runId}@rls.test`, userId: randomUUID(), submissionId: randomUUID() },
  B: { email: `rls-b-${runId}@rls.test`, userId: randomUUID(), submissionId: randomUUID() },
};
let provisioned = false;
let cleaning = false;
const publicSubmissionIds = [];

function client() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

process.on("uncaughtException", fatal);
process.on("unhandledRejection", fatal);

await provisionTestAccounts();
provisioned = true;

for (const account of Object.values(accounts)) {
  const supabase = client();
  const { data, error } = await supabase.auth.signInWithPassword({ email: account.email, password });
  if (error || !data.session) throw new Error(`Login de teste falhou: ${error?.message ?? "sem sessão"}`);
  account.supabase = supabase;
}

const anon = client();
const datasets = {};
for (const [label, account] of Object.entries(accounts)) {
  const suffix = `${label}-${runId}`;
  const clientRow = await insertOne(account.supabase, "clients", {
    user_id: account.userId,
    name: `Cliente RLS ${suffix}`,
    phone: "82999999999",
    email: `cliente-${suffix}@example.com`,
    notes: `owner-${label}`,
  });
  const privateProperty = await insertOne(account.supabase, "properties", {
    user_id: account.userId,
    code: `RLS-PRIV-${suffix}`,
    title: `Imóvel privado RLS ${suffix}`,
    purpose: "venda",
    property_type: "Apartamento",
    description: `owner-${label}`,
    price: 100000,
    neighborhood: "Teste RLS",
    city: "Maceió",
    state: "AL",
    status: "disponivel",
    is_public: false,
  }, "id,slug");
  const publicProperty = await insertOne(account.supabase, "properties", {
    user_id: account.userId,
    code: `RLS-PUB-${suffix}`,
    title: `Imóvel público RLS ${suffix}`,
    purpose: "venda",
    property_type: "Apartamento",
    description: `public-owner-${label}`,
    price: 110000,
    neighborhood: "Teste RLS",
    city: "Maceió",
    state: "AL",
    status: "disponivel",
    is_public: true,
  }, "id,slug");
  const followUp = await insertOne(account.supabase, "follow_ups", {
    user_id: account.userId,
    client_id: clientRow.id,
    scheduled_at: "2030-01-15T12:00:00.000Z",
    notes: `owner-${label}`,
  });
  const interaction = await insertOne(account.supabase, "interactions", {
    user_id: account.userId,
    client_id: clientRow.id,
    type: "observacao",
    description: `owner-${label}`,
  });
  const appointment = await insertOne(account.supabase, "appointments", {
    user_id: account.userId,
    client_id: clientRow.id,
    property_id: privateProperty.id,
    scheduled_at: "2030-02-15T12:00:00.000Z",
    notes: `owner-${label}`,
  });
  const task = await insertOne(account.supabase, "tasks", {
    user_id: account.userId,
    client_id: clientRow.id,
    property_id: privateProperty.id,
    title: `Tarefa RLS ${suffix}`,
    description: `owner-${label}`,
    due_at: "2030-03-15T12:00:00.000Z",
  });
  const interest = await insertOne(account.supabase, "client_property_interests", {
    user_id: account.userId,
    client_id: clientRow.id,
    property_id: privateProperty.id,
    notes: `owner-${label}`,
  });
  const privateImage = await insertOne(account.supabase, "property_images", {
    user_id: account.userId,
    property_id: privateProperty.id,
    storage_path: `${account.userId}/${privateProperty.id}/rls-private-${runId}.jpg`,
    is_cover: true,
    sort_order: 0,
  });
  const publicImage = await insertOne(account.supabase, "property_images", {
    user_id: account.userId,
    property_id: publicProperty.id,
    storage_path: `${account.userId}/${publicProperty.id}/rls-public-${runId}.jpg`,
    is_cover: true,
    sort_order: 0,
  });
  const { data: leadId, error: leadError } = await anon.rpc("submit_property_lead", {
    p_slug: publicProperty.slug,
    p_name: `Lead RLS ${suffix}`,
    p_phone: "82999999999",
    p_whatsapp: "82999999999",
    p_email: `lead-${suffix}@example.com`,
    p_message: `owner-${label}`,
  });
  if (leadError || !leadId) throw new Error(`Seed leads/${label}: ${leadError?.message ?? "sem ID"}`);
  const { error: stageError } = await account.supabase.from("clients").update({ stage: "qualificacao" }).eq("id", clientRow.id);
  if (stageError) throw new Error(`Seed stage/${label}: ${stageError.message}`);
  const { data: history, error: historyError } = await account.supabase.from("client_stage_history").select("id,new_stage").eq("client_id", clientRow.id).single();
  if (historyError || !history) throw new Error(`Seed history/${label}: ${historyError?.message ?? "sem histórico"}`);

  datasets[label] = {
    clients: clientRow,
    properties: privateProperty,
    publicProperties: publicProperty,
    follow_ups: followUp,
    interactions: interaction,
    appointments: appointment,
    tasks: task,
    leads: { id: leadId },
    client_property_interests: interest,
    client_stage_history: history,
    property_images: privateImage,
    publicPropertyImages: publicImage,
    property_submissions: { id: account.submissionId },
  };
}

const specs = {
  clients: { field: "notes", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  properties: { field: "description", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  follow_ups: { field: "notes", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  interactions: { field: "description", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  appointments: { field: "notes", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  tasks: { field: "description", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  leads: { field: "message", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  client_property_interests: { field: "notes", attackValue: "cross-update", expected: (label) => `owner-${label}` },
  client_stage_history: { field: "new_stage", attackValue: "proposta", expected: () => "qualificacao" },
  property_images: { field: "sort_order", attackValue: 77, expected: () => 0 },
  property_submissions: { field: "description", attackValue: "cross-update", expected: (label) => `owner-${label}` },
};

const results = Object.fromEntries(Object.keys(specs).map((table) => [table, {
  select: true,
  update: true,
  delete: true,
  insertOwnership: true,
  evidence: [],
}]));
const directions = [
  { attacker: "A", owner: "B" },
  { attacker: "B", owner: "A" },
];

for (const [table, result] of Object.entries(results)) {
  for (const direction of directions) {
    const attackClient = accounts[direction.attacker].supabase;
    const targetId = datasets[direction.owner][table].id;
    const { data, error } = await attackClient.from(table).select("id").eq("id", targetId);
    const blocked = Boolean(error) || (data?.length ?? 0) === 0;
    result.select &&= blocked;
    result.evidence.push(`SELECT ${direction.attacker}->${direction.owner}:${blocked ? "blocked" : "visible"}${error?.code ? `(${error.code})` : ""}`);
  }
}

for (const [table, spec] of Object.entries(specs)) {
  const result = results[table];
  for (const direction of directions) {
    const attackClient = accounts[direction.attacker].supabase;
    const ownerClient = accounts[direction.owner].supabase;
    const targetId = datasets[direction.owner][table].id;
    const { data, error } = await attackClient.from(table).update({ [spec.field]: spec.attackValue }).eq("id", targetId).select("id");
    const ownerValue = await selectValue(ownerClient, table, targetId, spec.field);
    const blocked = (Boolean(error) || (data?.length ?? 0) === 0) && ownerValue === spec.expected(direction.owner);
    result.update &&= blocked;
    result.evidence.push(`UPDATE ${direction.attacker}->${direction.owner}:${blocked ? "blocked" : "mutated"}${error?.code ? `(${error.code})` : ""}`);
  }
}

for (const direction of directions) {
  const attackClient = accounts[direction.attacker].supabase;
  const ownerClient = accounts[direction.owner].supabase;
  const publicProperty = datasets[direction.owner].publicProperties;
  const publicImage = datasets[direction.owner].publicPropertyImages;
  const propertyUpdate = await attackClient.from("properties").update({ description: "cross-public-update" }).eq("id", publicProperty.id).select("id");
  const propertyValue = await selectValue(ownerClient, "properties", publicProperty.id, "description");
  results.properties.update &&= (Boolean(propertyUpdate.error) || (propertyUpdate.data?.length ?? 0) === 0) && propertyValue === `public-owner-${direction.owner}`;
  const imageUpdate = await attackClient.from("property_images").update({ sort_order: 88 }).eq("id", publicImage.id).select("id");
  const imageValue = await selectValue(ownerClient, "property_images", publicImage.id, "sort_order");
  results.property_images.update &&= (Boolean(imageUpdate.error) || (imageUpdate.data?.length ?? 0) === 0) && imageValue === 0;
}

for (const [table, result] of Object.entries(results)) {
  for (const direction of directions) {
    const spoofId = randomUUID();
    const intendedOwner = accounts[direction.owner];
    const payload = spoofPayload(table, spoofId, direction.owner);
    const { error } = await accounts[direction.attacker].supabase.from(table).insert(payload).select("id");
    const { data: visibleToOwner } = await intendedOwner.supabase.from(table).select("id").eq("id", spoofId);
    const blocked = Boolean(error) && (visibleToOwner?.length ?? 0) === 0;
    result.insertOwnership &&= blocked;
    result.evidence.push(`INSERT ${direction.attacker}->${direction.owner}:${blocked ? "blocked" : "created"}${error?.code ? `(${error.code})` : ""}`);
  }
}

const deleteOrder = [
  "client_stage_history", "follow_ups", "interactions", "appointments", "tasks",
  "client_property_interests", "property_images", "leads", "property_submissions", "clients", "properties",
];
for (const table of deleteOrder) {
  const result = results[table];
  for (const direction of directions) {
    const attackClient = accounts[direction.attacker].supabase;
    const ownerClient = accounts[direction.owner].supabase;
    const targetId = datasets[direction.owner][table].id;
    const { data, error } = await attackClient.from(table).delete().eq("id", targetId).select("id");
    const { data: ownerData } = await ownerClient.from(table).select("id").eq("id", targetId);
    const blocked = (Boolean(error) || (data?.length ?? 0) === 0) && (ownerData?.length ?? 0) === 1;
    result.delete &&= blocked;
    result.evidence.push(`DELETE ${direction.attacker}->${direction.owner}:${blocked ? "blocked" : "deleted"}${error?.code ? `(${error.code})` : ""}`);
  }
}

for (const direction of directions) {
  const attackClient = accounts[direction.attacker].supabase;
  const ownerClient = accounts[direction.owner].supabase;
  const publicProperty = datasets[direction.owner].publicProperties;
  const publicImage = datasets[direction.owner].publicPropertyImages;
  const propertyDelete = await attackClient.from("properties").delete().eq("id", publicProperty.id).select("id");
  const propertyStillExists = await ownerClient.from("properties").select("id").eq("id", publicProperty.id);
  results.properties.delete &&= (Boolean(propertyDelete.error) || (propertyDelete.data?.length ?? 0) === 0) && propertyStillExists.data?.length === 1;
  const imageDelete = await attackClient.from("property_images").delete().eq("id", publicImage.id).select("id");
  const imageStillExists = await ownerClient.from("property_images").select("id").eq("id", publicImage.id);
  results.property_images.delete &&= (Boolean(imageDelete.error) || (imageDelete.data?.length ?? 0) === 0) && imageStillExists.data?.length === 1;
}

const publicPropertyIds = [datasets.A.publicProperties.id, datasets.B.publicProperties.id];
const publicImageIds = [datasets.A.publicPropertyImages.id, datasets.B.publicPropertyImages.id];
const publicProperties = await anon.from("properties").select("id").in("id", publicPropertyIds);
const publicImages = await anon.from("property_images").select("id").in("id", publicImageIds);
const authenticatedPublicImage = await accounts.A.supabase.from("property_images").select("id").eq("id", datasets.B.publicPropertyImages.id);

const profileCheck = await accounts.A.supabase.from("profiles").select("id").eq("id", accounts.A.userId).single();
const authenticatedLead = await accounts.A.supabase.rpc("submit_property_lead", {
  p_slug: datasets.A.publicProperties.slug,
  p_name: `Lead funcional ${runId}`,
  p_phone: "82999999999",
  p_whatsapp: "82999999999",
  p_email: `lead-functional-${runId}@example.com`,
  p_message: "Teste funcional de conversão",
});
const convertedLead = authenticatedLead.data
  ? await accounts.A.supabase.rpc("convert_lead_to_client", { p_lead_id: authenticatedLead.data })
  : { data: null, error: authenticatedLead.error };
const convertedClient = convertedLead.data
  ? await accounts.A.supabase.from("clients").select("id").eq("id", convertedLead.data).single()
  : { data: null, error: convertedLead.error };

const submissionPayload = {
  p_owner_name: `Captação funcional ${runId}`,
  p_phone: "82999999999",
  p_email: `submission-functional-${runId}@example.com`,
  p_purpose: "venda",
  p_property_type: "Apartamento",
  p_neighborhood: "Teste RLS",
  p_city: "Maceió",
  p_desired_price: 200000,
  p_description: "Teste funcional descartável",
};
const anonymousSubmission = await anon.rpc("submit_property_submission", submissionPayload);
if (anonymousSubmission.data) publicSubmissionIds.push(anonymousSubmission.data);
const authenticatedSubmission = await accounts.A.supabase.rpc("submit_property_submission", submissionPayload);
if (authenticatedSubmission.data) publicSubmissionIds.push(authenticatedSubmission.data);

const functionalChecks = {
  userCreationProfile: !profileCheck.error && profileCheck.data?.id === accounts.A.userId,
  login: Object.values(accounts).every((account) => Boolean(account.supabase)),
  publicLeadAnonymous: Boolean(datasets.A.leads.id),
  publicLeadAuthenticated: !authenticatedLead.error && Boolean(authenticatedLead.data),
  publicSubmissionAnonymous: !anonymousSubmission.error && Boolean(anonymousSubmission.data),
  publicSubmissionAuthenticated: !authenticatedSubmission.error && Boolean(authenticatedSubmission.data),
  leadConversion: !convertedLead.error && Boolean(convertedLead.data) && convertedClient.data?.id === convertedLead.data,
  funnelMovement: Boolean(datasets.A.client_stage_history.id),
  publicPortal: !publicProperties.error && (publicProperties.data?.length ?? 0) === 2,
};

const summary = Object.fromEntries(Object.entries(results).map(([table, value]) => [table, {
  select: value.select ? "PASS" : "FAIL",
  update: value.update ? "PASS" : "FAIL",
  delete: value.delete ? "PASS" : "FAIL",
  insertOwnership: value.insertOwnership ? "PASS" : "FAIL",
  result: value.select && value.update && value.delete && value.insertOwnership ? "PASS" : "FAIL",
  evidence: value.evidence,
}]));
const failed = Object.values(summary).some((item) => item.result === "FAIL") || Object.values(functionalChecks).some((value) => !value);
await cleanupTestAccounts();
provisioned = false;
console.log(JSON.stringify({
  phase: "complete",
  runId,
  accounts: Object.fromEntries(Object.entries(accounts).map(([label, value]) => [label, { userId: value.userId, email: value.email }])),
  publicExceptions: {
    anonymousProperties: { count: publicProperties.data?.length ?? 0, error: publicProperties.error?.code ?? null },
    anonymousPropertyImages: { count: publicImages.data?.length ?? 0, error: publicImages.error?.code ?? null },
    authenticatedCrossPropertyImage: { count: authenticatedPublicImage.data?.length ?? 0, error: authenticatedPublicImage.error?.code ?? null },
  },
  functionalChecks: Object.fromEntries(Object.entries(functionalChecks).map(([name, passed]) => [name, passed ? "PASS" : "FAIL"])),
  cleanup: "PASS",
  summary,
}));
process.exitCode = failed ? 1 : 0;

async function insertOne(supabase, table, payload, columns = "id") {
  const { data, error } = await supabase.from(table).insert(payload).select(columns).single();
  if (error || !data) throw new Error(`Seed ${table}: ${error?.message ?? "sem dados"}`);
  return data;
}

async function selectValue(supabase, table, id, field) {
  const { data, error } = await supabase.from(table).select(field).eq("id", id).single();
  if (error) return Symbol("unreadable");
  return data[field];
}

function spoofPayload(table, id, ownerLabel) {
  const owner = accounts[ownerLabel];
  const data = datasets[ownerLabel];
  const suffix = `${ownerLabel}-${runId}-${id.slice(0, 6)}`;
  const common = { id, user_id: owner.userId };
  const payloads = {
    clients: { ...common, name: `Spoof Cliente ${suffix}`, phone: "82999999999", notes: "spoof" },
    properties: { ...common, code: `SPOOF-${suffix}`, title: `Spoof imóvel ${suffix}`, purpose: "venda", property_type: "Apartamento", price: 1, neighborhood: "Teste", city: "Maceió", state: "AL", is_public: false },
    follow_ups: { ...common, client_id: data.clients.id, scheduled_at: "2031-01-01T12:00:00.000Z", notes: "spoof" },
    interactions: { ...common, client_id: data.clients.id, type: "observacao", description: "spoof" },
    appointments: { ...common, client_id: data.clients.id, property_id: data.properties.id, scheduled_at: "2031-02-01T12:00:00.000Z", notes: "spoof" },
    tasks: { ...common, client_id: data.clients.id, property_id: data.properties.id, title: `Spoof tarefa ${suffix}`, due_at: "2031-03-01T12:00:00.000Z" },
    leads: { ...common, property_id: data.publicProperties.id, name: `Spoof Lead ${suffix}`, phone: "82999999999", email: `spoof-${suffix}@example.com`, message: "spoof" },
    client_property_interests: { ...common, client_id: data.clients.id, property_id: data.properties.id, notes: "spoof" },
    client_stage_history: { ...common, client_id: data.clients.id, previous_stage: "novo_lead", new_stage: "qualificacao" },
    property_images: { ...common, property_id: data.properties.id, storage_path: `${owner.userId}/${data.properties.id}/spoof-${id}.jpg`, sort_order: 10 },
    property_submissions: { ...common, owner_name: `Spoof ${suffix}`, phone: "82999999999", email: `spoof-${suffix}@example.com`, purpose: "venda", property_type: "Apartamento", neighborhood: "Teste", city: "Maceió", description: "spoof" },
  };
  return payloads[table];
}

async function provisionTestAccounts() {
  const values = Object.entries(accounts).map(([label, account]) => `(
    '00000000-0000-0000-0000-000000000000',
    ${sql(account.userId)}::uuid,
    'authenticated',
    'authenticated',
    ${sql(account.email)},
    crypt(${sql(password)}, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    ${sql(JSON.stringify({ full_name: `RLS Test ${label}` }))}::jsonb,
    now(),
    now(),
    '', '', '', ''
  )`).join(",");
  const identities = Object.values(accounts).map((account) => `(
    ${sql(account.userId)},
    ${sql(account.userId)}::uuid,
    jsonb_build_object('sub', ${sql(account.userId)}, 'email', ${sql(account.email)}, 'email_verified', true),
    'email',
    now(), now(), now()
  )`).join(",");
  const submissions = Object.entries(accounts).map(([label, account]) => `(
    ${sql(account.submissionId)}::uuid,
    ${sql(account.userId)}::uuid,
    ${sql(`Proprietário RLS ${label}`)},
    '82999999999',
    ${sql(`submission-${label}-${runId}@rls.test`)},
    'venda',
    'Apartamento',
    'Teste RLS',
    'Maceió',
    100000,
    ${sql(`owner-${label}`)}
  )`).join(",");
  await remoteSql(`
    begin;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values ${values};
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values ${identities};
    insert into public.property_submissions (
      id, user_id, owner_name, phone, email, purpose, property_type,
      neighborhood, city, desired_price, description
    ) values ${submissions};
    commit;
  `);
}

async function cleanupTestAccounts() {
  if (!provisioned || cleaning) return;
  cleaning = true;
  const ids = Object.values(accounts).map((account) => `${sql(account.userId)}::uuid`).join(",");
  const submissionCleanup = publicSubmissionIds.length
    ? `delete from public.property_submissions where id in (${publicSubmissionIds.map((id) => `${sql(id)}::uuid`).join(",")});`
    : "";
  await remoteSql(`
    begin;
    ${submissionCleanup}
    delete from public.leads where user_id in (${ids});
    delete from auth.users where id in (${ids});
    commit;
  `);
  cleaning = false;
}

async function remoteSql(statement) {
  const cli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
  const child = spawn(process.execPath, [cli, "db", "query", "--remote", "--yes"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdin.end(statement);
  const exitCode = await new Promise((resolve) => child.once("close", resolve));
  if (exitCode !== 0) throw new Error(`Supabase CLI falhou: ${stderr}\n${stdout}`);
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function fatal(error) {
  try { await cleanupTestAccounts(); } catch (cleanupError) { console.error(`Cleanup falhou: ${cleanupError.message}`); }
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

