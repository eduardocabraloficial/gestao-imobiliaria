-- Gestão Imobiliária — Fase 5: portal público, leads, captações e imagens.

create type public.lead_status as enum ('novo', 'em_atendimento', 'convertido', 'descartado');
create type public.property_submission_status as enum ('novo', 'em_analise', 'aprovado', 'recusado');

alter table public.properties
  add column slug text,
  add column is_public boolean not null default true,
  add column characteristics text[] not null default '{}';

update public.properties
set slug = trim(both '-' from regexp_replace(
  translate(lower(title || '-' || code || '-' || left(id::text, 8)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
  '[^a-z0-9]+', '-', 'g'
));

alter table public.properties alter column slug set not null;
create unique index properties_slug_unique_idx on public.properties(slug);
create index properties_public_catalog_idx on public.properties(is_public, status, featured, created_at desc);

create or replace function public.set_property_slug()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title or new.code is distinct from old.code then
    new.slug := trim(both '-' from regexp_replace(
      translate(lower(new.title || '-' || new.code || '-' || left(new.id::text, 8)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
      '[^a-z0-9]+', '-', 'g'
    ));
  end if;
  return new;
end;
$$;

create trigger properties_set_slug before insert or update of title, code on public.properties
for each row execute function public.set_property_slug();

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  is_cover boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create unique index property_images_one_cover_idx on public.property_images(property_id) where is_cover;
create index property_images_property_order_idx on public.property_images(property_id, sort_order, created_at);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 100),
  phone text not null check (char_length(trim(phone)) between 8 and 30),
  whatsapp text check (whatsapp is null or char_length(trim(whatsapp)) between 8 and 30),
  email text not null check (char_length(trim(email)) between 5 and 160),
  message text not null check (char_length(trim(message)) between 3 and 1000),
  source text not null default 'site' check (source = 'site'),
  status public.lead_status not null default 'novo',
  created_at timestamptz not null default now(),
  converted_at timestamptz,
  converted_client_id uuid references public.clients(id) on delete set null,
  constraint leads_conversion_state check (
    (status = 'convertido' and converted_at is not null and converted_client_id is not null)
    or status <> 'convertido'
  )
);

create index leads_user_status_created_idx on public.leads(user_id, status, created_at desc);
create index leads_property_idx on public.leads(property_id, created_at desc);

create table public.property_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null check (char_length(trim(owner_name)) between 2 and 100),
  phone text not null check (char_length(trim(phone)) between 8 and 30),
  email text not null check (char_length(trim(email)) between 5 and 160),
  purpose public.property_purpose not null,
  property_type text not null check (char_length(trim(property_type)) between 2 and 60),
  neighborhood text not null check (char_length(trim(neighborhood)) between 2 and 100),
  city text not null check (char_length(trim(city)) between 2 and 100),
  desired_price numeric(14,2) check (desired_price is null or desired_price >= 0),
  description text check (description is null or char_length(description) <= 1500),
  status public.property_submission_status not null default 'novo',
  created_at timestamptz not null default now()
);

create index property_submissions_status_created_idx on public.property_submissions(status, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public.property_images enable row level security;
alter table public.leads enable row level security;
alter table public.property_submissions enable row level security;

create policy "properties_public_catalog" on public.properties for select to anon
using (is_public and status = 'disponivel');

create policy "property_images_public_read" on public.property_images for select to anon, authenticated
using (exists (
  select 1 from public.properties p
  where p.id = property_id and p.is_public and p.status = 'disponivel'
) or (select auth.uid()) = user_id);
create policy "property_images_insert_own" on public.property_images for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid())
));
create policy "property_images_update_own" on public.property_images for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "property_images_delete_own" on public.property_images for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "leads_select_own" on public.leads for select to authenticated using ((select auth.uid()) = user_id);
create policy "leads_update_own" on public.leads for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "leads_delete_own" on public.leads for delete to authenticated using ((select auth.uid()) = user_id);

create policy "submissions_admin_read" on public.property_submissions for select to authenticated using (true);
create policy "submissions_admin_update" on public.property_submissions for update to authenticated using (true) with check (true);

create policy "storage_property_images_read" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'property-images'
  and exists (
    select 1 from public.property_images pi
    join public.properties p on p.id = pi.property_id
    where pi.storage_path = name
      and ((p.is_public and p.status = 'disponivel') or p.user_id = (select auth.uid()))
  )
);
create policy "storage_property_images_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.properties p
    where p.id::text = (storage.foldername(name))[2] and p.user_id = (select auth.uid())
  )
);
create policy "storage_property_images_update" on storage.objects for update to authenticated
using (bucket_id = 'property-images' and owner_id = (select auth.uid())::text)
with check (bucket_id = 'property-images' and owner_id = (select auth.uid())::text);
create policy "storage_property_images_delete" on storage.objects for delete to authenticated
using (bucket_id = 'property-images' and owner_id = (select auth.uid())::text);

create or replace function public.submit_property_lead(
  p_slug text, p_name text, p_phone text, p_whatsapp text, p_email text, p_message text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_property public.properties%rowtype; v_id uuid;
begin
  select * into v_property from public.properties
  where slug = p_slug and is_public and status = 'disponivel';
  if not found then raise exception 'property_not_available'; end if;
  insert into public.leads (user_id, property_id, name, phone, whatsapp, email, message)
  values (v_property.user_id, v_property.id, trim(p_name), trim(p_phone), nullif(trim(p_whatsapp), ''), lower(trim(p_email)), trim(p_message))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.submit_property_submission(
  p_owner_name text, p_phone text, p_email text, p_purpose public.property_purpose,
  p_property_type text, p_neighborhood text, p_city text, p_desired_price numeric, p_description text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.property_submissions (owner_name, phone, email, purpose, property_type, neighborhood, city, desired_price, description)
  values (trim(p_owner_name), trim(p_phone), lower(trim(p_email)), p_purpose, trim(p_property_type), trim(p_neighborhood), trim(p_city), p_desired_price, nullif(trim(p_description), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.convert_lead_to_client(p_lead_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_lead public.leads%rowtype; v_property public.properties%rowtype; v_client_id uuid;
begin
  select * into v_lead from public.leads where id = p_lead_id and user_id = auth.uid() for update;
  if not found then raise exception 'lead_not_found'; end if;
  if v_lead.status = 'convertido' or v_lead.converted_client_id is not null then raise exception 'lead_already_converted'; end if;
  select * into v_property from public.properties where id = v_lead.property_id and user_id = auth.uid();
  if not found then raise exception 'property_not_found'; end if;
  insert into public.clients (user_id, name, phone, whatsapp, email, source, purpose, property_type, neighborhoods, stage, notes)
  values (auth.uid(), v_lead.name, v_lead.phone, v_lead.whatsapp, v_lead.email, 'Site', v_property.purpose::text, v_property.property_type, array[v_property.neighborhood], 'novo_lead', 'Convertido de interesse recebido pelo site.')
  returning id into v_client_id;
  insert into public.client_property_interests (user_id, client_id, property_id, notes)
  values (auth.uid(), v_client_id, v_property.id, 'Interesse originado pelo portal público.');
  update public.leads set status = 'convertido', converted_at = now(), converted_client_id = v_client_id where id = v_lead.id;
  return v_client_id;
end;
$$;

revoke all on function public.submit_property_lead(text,text,text,text,text,text) from public;
revoke all on function public.submit_property_submission(text,text,text,public.property_purpose,text,text,text,numeric,text) from public;
revoke all on function public.convert_lead_to_client(uuid) from public;
grant execute on function public.submit_property_lead(text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.submit_property_submission(text,text,text,public.property_purpose,text,text,text,numeric,text) to anon, authenticated;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;

grant select (id, code, title, purpose, property_type, description, price, condominium_fee, iptu, neighborhood, city, state, area, bedrooms, suites, bathrooms, parking_spaces, furnished, pets_allowed, featured, status, image_url, slug, is_public, characteristics, created_at, updated_at) on public.properties to anon;
grant select (id, property_id, storage_path, is_cover, sort_order, created_at) on public.property_images to anon;
grant select, insert, update, delete on public.property_images, public.leads to authenticated;
grant select, update on public.property_submissions to authenticated;
