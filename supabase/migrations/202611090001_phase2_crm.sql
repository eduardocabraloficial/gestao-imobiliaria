-- Gestão Imobiliária — Fase 2
-- Execute com `supabase db push` ou no SQL Editor de um projeto novo.

create extension if not exists pgcrypto;

create type public.client_stage as enum (
  'novo_lead', 'primeiro_contato', 'qualificacao', 'imoveis_enviados',
  'visita_agendada', 'visita_realizada', 'negociacao', 'proposta',
  'documentacao', 'concluido', 'perdido'
);

create type public.interaction_type as enum (
  'ligacao', 'whatsapp', 'email', 'reuniao', 'visita', 'observacao'
);

create type public.follow_up_status as enum ('pendente', 'concluido', 'cancelado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  phone text not null,
  whatsapp text,
  email text,
  source text not null default 'Outro',
  purpose text,
  property_type text,
  neighborhoods text[] not null default '{}',
  min_price numeric(14,2) check (min_price is null or min_price >= 0),
  max_price numeric(14,2) check (max_price is null or max_price >= 0),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  notes text,
  stage public.client_stage not null default 'novo_lead',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_price_range check (min_price is null or max_price is null or min_price <= max_price)
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.interaction_type not null,
  description text not null check (char_length(trim(description)) >= 2),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  notes text,
  status public.follow_up_status not null default 'pendente',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_ups_completion check (
    (status = 'concluido' and completed_at is not null)
    or (status <> 'concluido')
  )
);

create index clients_user_id_idx on public.clients(user_id);
create index clients_user_stage_idx on public.clients(user_id, stage);
create index interactions_client_occurred_idx on public.interactions(client_id, occurred_at desc);
create index interactions_user_id_idx on public.interactions(user_id);
create index follow_ups_client_scheduled_idx on public.follow_ups(client_id, scheduled_at);
create index follow_ups_user_status_scheduled_idx on public.follow_ups(user_id, status, scheduled_at);
create unique index one_pending_follow_up_per_client_idx
  on public.follow_ups(client_id) where status = 'pendente';

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();
create trigger follow_ups_set_updated_at before update on public.follow_ups
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.interactions enable row level security;
alter table public.follow_ups enable row level security;

create policy "profiles_select_own" on public.profiles for select
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "clients_select_own" on public.clients for select
using ((select auth.uid()) = user_id);
create policy "clients_insert_own" on public.clients for insert
with check ((select auth.uid()) = user_id);
create policy "clients_update_own" on public.clients for update
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "clients_delete_own" on public.clients for delete
using ((select auth.uid()) = user_id);

create policy "interactions_select_own" on public.interactions for select
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "interactions_insert_own" on public.interactions for insert
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "interactions_update_own" on public.interactions for update
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "interactions_delete_own" on public.interactions for delete
using ((select auth.uid()) = user_id);

create policy "follow_ups_select_own" on public.follow_ups for select
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "follow_ups_insert_own" on public.follow_ups for insert
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "follow_ups_update_own" on public.follow_ups for update
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "follow_ups_delete_own" on public.follow_ups for delete
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.clients, public.interactions, public.follow_ups to authenticated;
