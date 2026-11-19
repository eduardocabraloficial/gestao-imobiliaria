-- Restrict direct execution of internal SECURITY DEFINER functions while
-- preserving the roles required by the public portal and authenticated CRM.

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

revoke all on function public.record_client_stage_change() from public;
revoke all on function public.record_client_stage_change() from anon, authenticated;

revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon, authenticated;

-- Public forms run with the browser's current role. Keep both roles so the
-- forms continue to work for anonymous visitors and authenticated brokers.
revoke all on function public.submit_property_lead(text, text, text, text, text, text) from public;
grant execute on function public.submit_property_lead(text, text, text, text, text, text) to anon, authenticated;

revoke all on function public.submit_property_submission(text, text, text, public.property_purpose, text, text, text, numeric, text) from public;
grant execute on function public.submit_property_submission(text, text, text, public.property_purpose, text, text, text, numeric, text) to anon, authenticated;

-- CRM conversion is authenticated-only and enforces ownership with auth.uid().
revoke all on function public.convert_lead_to_client(uuid) from public;
revoke all on function public.convert_lead_to_client(uuid) from anon;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;
