-- Security-advisor hardening (matches what was applied to the live project).
--
-- 1. Remove public/REST EXECUTE on the privileged event-trigger helper so it is
--    not callable via /rest/v1/rpc/rls_auto_enable. The event trigger keeps
--    working (it fires through Postgres DDL internals, not the REST grant).
-- 2. Pin a non-mutable search_path on the updated_at trigger helper.

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

alter function public.touch_updated_at() set search_path = pg_catalog;
