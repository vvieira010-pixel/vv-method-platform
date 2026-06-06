-- Security-advisor hardening (matches what was applied to the live project).
--
-- 1. Remove public/REST EXECUTE on the privileged event-trigger helper so it is
--    not callable via /rest/v1/rpc/rls_auto_enable. The event trigger keeps
--    working (it fires through Postgres DDL internals, not the REST grant).
-- 2. Pin a non-mutable search_path on the updated_at trigger helper.
--
-- Guarded so the migration is a no-op on a database that doesn't have these
-- helpers yet (e.g. a fresh Supabase preview built from an incomplete migration
-- set), instead of erroring on a missing function.

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated, public';
  end if;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'touch_updated_at'
  ) then
    execute 'alter function public.touch_updated_at() set search_path = pg_catalog';
  end if;
end $$;
