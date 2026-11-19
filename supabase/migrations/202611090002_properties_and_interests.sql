-- Gestão Imobiliária — Fase 3: imóveis e interesses cliente-imóvel.

create type public.property_purpose as enum ('venda', 'aluguel');
create type public.property_status as enum ('disponivel', 'reservado', 'vendido', 'alugado', 'inativo');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null check (char_length(trim(title)) >= 3),
  purpose public.property_purpose not null,
  property_type text not null,
  description text,
  price numeric(14,2) not null check (price >= 0),
  condominium_fee numeric(14,2) check (condominium_fee is null or condominium_fee >= 0),
  iptu numeric(14,2) check (iptu is null or iptu >= 0),
  address text,
  neighborhood text not null,
  city text not null,
  state char(2) not null,
  zip_code text,
  area numeric(10,2) check (area is null or area >= 0),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  suites integer check (suites is null or suites >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  parking_spaces integer check (parking_spaces is null or parking_spaces >= 0),
  furnished boolean not null default false,
  pets_allowed boolean not null default false,
  featured boolean not null default false,
  status public.property_status not null default 'disponivel',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_user_code_unique unique (user_id, code)
);

create table public.client_property_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  constraint client_property_interest_unique unique (client_id, property_id)
);

create index properties_user_status_idx on public.properties(user_id, status);
create index properties_user_purpose_idx on public.properties(user_id, purpose);
create index properties_user_neighborhood_idx on public.properties(user_id, neighborhood);
create index interests_user_id_idx on public.client_property_interests(user_id);
create index interests_client_id_idx on public.client_property_interests(client_id);
create index interests_property_id_idx on public.client_property_interests(property_id);

create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();

alter table public.properties enable row level security;
alter table public.client_property_interests enable row level security;

create policy "properties_select_own" on public.properties for select
using ((select auth.uid()) = user_id);
create policy "properties_insert_own" on public.properties for insert
with check ((select auth.uid()) = user_id);
create policy "properties_update_own" on public.properties for update
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "properties_delete_own" on public.properties for delete
using ((select auth.uid()) = user_id);

create policy "interests_select_own" on public.client_property_interests for select
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
  and exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid()))
);
create policy "interests_insert_own" on public.client_property_interests for insert
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
  and exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid()))
);
create policy "interests_update_own" on public.client_property_interests for update
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
  and exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid()))
);
create policy "interests_delete_own" on public.client_property_interests for delete
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.properties, public.client_property_interests to authenticated;
