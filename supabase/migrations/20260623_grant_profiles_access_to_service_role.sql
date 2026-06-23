-- Allow webhook server-side updates via Supabase service role API key.

begin;

grant usage on schema public to service_role;
grant select, insert, update on table public.profiles to service_role;

commit;
