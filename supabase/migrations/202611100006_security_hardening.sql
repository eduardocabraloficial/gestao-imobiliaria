-- Fase 8: isolamento de captações e privilégios mínimos.

alter table public.property_submissions
  add column user_id uuid references auth.users(id) on delete cascade;

update public.property_submissions submission
set user_id = owner.id
from (
  select user_id as id from public.organization_settings order by created_at limit 1
) owner
where submission.user_id is null;

update public.property_submissions submission
set user_id = owner.id
from (
  select id from public.profiles order by created_at limit 1
) owner
where submission.user_id is null;

create index property_submissions_user_status_idx
  on public.property_submissions(user_id, status, created_at desc);

drop policy if exists "submissions_admin_read" on public.property_submissions;
drop policy if exists "submissions_admin_update" on public.property_submissions;

create policy "submissions_select_own" on public.property_submissions
for select to authenticated using ((select auth.uid()) = user_id);

create policy "submissions_update_own" on public.property_submissions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.submit_property_submission(
  p_owner_name text, p_phone text, p_email text, p_purpose public.property_purpose,
  p_property_type text, p_neighborhood text, p_city text, p_desired_price numeric, p_description text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_user_id uuid;
begin
  select user_id into v_user_id from public.organization_settings order by created_at limit 1;
  if v_user_id is null then
    select id into v_user_id from public.profiles order by created_at limit 1;
  end if;
  if v_user_id is null then raise exception 'submission_unavailable'; end if;

  insert into public.property_submissions
    (user_id, owner_name, phone, email, purpose, property_type, neighborhood, city, desired_price, description)
  values
    (v_user_id, trim(p_owner_name), trim(p_phone), lower(trim(p_email)), p_purpose, trim(p_property_type), trim(p_neighborhood), trim(p_city), p_desired_price, nullif(trim(p_description), ''))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_property_submission(text,text,text,public.property_purpose,text,text,text,numeric,text) from public;
grant execute on function public.submit_property_submission(text,text,text,public.property_purpose,text,text,text,numeric,text) to anon, authenticated;

revoke all on public.property_submissions from anon;
revoke all on public.property_submissions from authenticated;
grant select, update on public.property_submissions to authenticated;

