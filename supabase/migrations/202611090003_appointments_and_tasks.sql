-- Gestão Imobiliária — Fase 4: agenda de visitas e pendências.

create type public.appointment_status as enum ('agendada', 'realizada', 'cancelada', 'reagendada');
create type public.task_priority as enum ('baixa', 'media', 'alta');
create type public.task_status as enum ('pendente', 'concluida', 'cancelada');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 480),
  notes text,
  status public.appointment_status not null default 'agendada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3),
  description text,
  due_at timestamptz not null,
  priority public.task_priority not null default 'media',
  status public.task_status not null default 'pendente',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_completion check ((status = 'concluida' and completed_at is not null) or status <> 'concluida')
);

create index appointments_user_scheduled_idx on public.appointments(user_id, scheduled_at);
create index appointments_client_idx on public.appointments(client_id, scheduled_at desc);
create index appointments_property_idx on public.appointments(property_id, scheduled_at desc);
create index tasks_user_status_due_idx on public.tasks(user_id, status, due_at);
create index tasks_client_idx on public.tasks(client_id, due_at);
create index tasks_property_idx on public.tasks(property_id, due_at);

create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;
alter table public.tasks enable row level security;

create policy "appointments_select_own" on public.appointments for select using ((select auth.uid()) = user_id);
create policy "appointments_insert_own" on public.appointments for insert with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
  and exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid()))
);
create policy "appointments_update_own" on public.appointments for update
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
  and exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid()))
);
create policy "appointments_delete_own" on public.appointments for delete using ((select auth.uid()) = user_id);

create policy "tasks_select_own" on public.tasks for select using ((select auth.uid()) = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (
  (select auth.uid()) = user_id
  and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())))
  and (property_id is null or exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid())))
);
create policy "tasks_update_own" on public.tasks for update
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())))
  and (property_id is null or exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid())))
);
create policy "tasks_delete_own" on public.tasks for delete using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.appointments, public.tasks to authenticated;
