-- Gestão Imobiliária — Fase 6: funil, histórico e configurações.

alter table public.clients
  add column estimated_value numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  add column loss_reason text check (loss_reason is null or char_length(loss_reason) <= 300);

create table public.client_stage_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  previous_stage public.client_stage not null,
  new_stage public.client_stage not null,
  changed_at timestamptz not null default now()
);

create index client_stage_history_user_changed_idx on public.client_stage_history(user_id, changed_at desc);
create index client_stage_history_client_changed_idx on public.client_stage_history(client_id, changed_at desc);

create or replace function public.record_client_stage_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.client_stage_history (user_id, client_id, previous_stage, new_stage)
    values (new.user_id, new.id, old.stage, new.stage);
  end if;
  return new;
end;
$$;

create trigger clients_record_stage_change after update of stage on public.clients
for each row execute function public.record_client_stage_change();

create table public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text,
  trade_name text,
  creci text,
  phone text,
  whatsapp text,
  email text,
  address text,
  instagram text,
  website text,
  description text,
  logo_path text,
  primary_color text default '#173f35',
  secondary_color text default '#d7bd94',
  hero_title text,
  hero_subtitle text,
  footer_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_colors_valid check (
    (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$')
    and (secondary_color is null or secondary_color ~ '^#[0-9A-Fa-f]{6}$')
  )
);

create trigger organization_settings_set_updated_at before update on public.organization_settings
for each row execute function public.set_updated_at();

alter table public.client_stage_history enable row level security;
alter table public.organization_settings enable row level security;

create policy "stage_history_select_own" on public.client_stage_history for select to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())));

create policy "settings_select_own" on public.organization_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings_insert_own" on public.organization_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings_update_own" on public.organization_settings for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "settings_delete_own" on public.organization_settings for delete to authenticated using ((select auth.uid()) = user_id);

grant select on public.client_stage_history to authenticated;
grant select, insert, update, delete on public.organization_settings to authenticated;
