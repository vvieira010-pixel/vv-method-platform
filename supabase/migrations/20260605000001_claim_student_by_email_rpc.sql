-- Reliable student self-claim via SECURITY DEFINER RPC.
--
-- The RLS "students self-claim by email" UPDATE policy proved unreliable in
-- practice (a valid authenticated PATCH matched 0 rows), so self-registered
-- students never linked their roster row and resolved as teachers. This
-- function runs as the table owner (bypassing that policy) but is safe: it only
-- claims a roster row whose email equals the CALLER'S OWN verified JWT email,
-- and only while that row is still unclaimed. The app calls it via
-- POST /rest/v1/rpc/claim_student_by_email (see src/lib/supabase-db.js).
--
-- Guarded so it's a no-op on a database that doesn't have public.students yet
-- (e.g. a fresh Supabase preview built from an incomplete migration set),
-- instead of failing.

do $mig$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'students'
  ) then
    execute $fn$
      create or replace function public.claim_student_by_email()
      returns table(id uuid, local_id text)
      language plpgsql
      security definer
      set search_path = public, pg_catalog
      as $body$
      declare
        caller_uid   uuid := auth.uid();
        caller_email text := lower(auth.jwt() ->> 'email');
      begin
        if caller_uid is null or caller_email is null or caller_email = '' then
          return;
        end if;

        -- Claim an unclaimed roster row matching the caller's verified email.
        update public.students s
           set auth_user_id = caller_uid
         where lower(s.email) = caller_email
           and s.auth_user_id is null;

        -- Return the caller's row (freshly claimed, or already theirs).
        return query
          select s.id, s.local_id
            from public.students s
           where s.auth_user_id = caller_uid
           limit 1;
      end;
      $body$;
    $fn$;

    execute 'revoke all on function public.claim_student_by_email() from public, anon';
    execute 'grant execute on function public.claim_student_by_email() to authenticated';
  end if;
end $mig$;
