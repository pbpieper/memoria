-- Feedback notes: one shared list from everyone using Memoria, signed in or not.
-- Applied by hand in Supabase (project Shuji) only after Patrick's OK.

create table public.mem_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000 and body ~ '\S'),
  context jsonb not null default '{}'::jsonb
    check (jsonb_typeof(context) = 'object' and pg_column_size(context) < 4000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.mem_feedback enable row level security;

-- Only what the app needs: anyone can add a note (just its text and context),
-- signed-in people can read back their own. Nothing can be changed or removed from the app.
revoke all on public.mem_feedback from anon, authenticated;
grant insert (body, context) on public.mem_feedback to anon, authenticated;
grant select on public.mem_feedback to authenticated;

-- A signed-in note is always tagged with its own account; a note sent without an
-- account has none. Nobody can tag a note with someone else's account.
create policy "mem_feedback: send" on public.mem_feedback
  for insert to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));

-- In the app you only ever see your own notes. Patrick reads all of them in Supabase.
create policy "mem_feedback: read own" on public.mem_feedback
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Switch off sending (keeps every note):
--   drop policy "mem_feedback: send" on public.mem_feedback;
-- Switch back on: run the "mem_feedback: send" create policy above again.
-- Remove completely (DELETES ALL NOTES, ask Patrick first):
--   drop table public.mem_feedback;
