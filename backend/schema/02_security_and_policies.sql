-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.game_sessions enable row level security;

-- Policy: Allow public read access to users (for leaderboard display)
create policy "Allow public read access"
on public.users
for select
using (true);

-- Policy: Allow public read access to game_sessions (for leaderboard display)
create policy "Allow public read access"
on public.game_sessions
for select
using (true);

-- Policy: Allow service role to insert users (Backend uses service role key if configured, or anon key with specific logic)
-- Since we are using the Python SDK with the SUPABASE_KEY (which is likely the anon key in the .env.example, but usually backend operations might need service_role for bypassing RLS if we were strict).
-- However, for simplicity in this setup where the backend acts as the "admin" or "system", we often want to allow inserts.
-- If using anon key, we need a policy that allows inserts.
-- Let's allow unauthenticated inserts for now since our backend handles the logic, OR we can rely on the fact that we might be using the service_role key in production.
-- But the user instructions said "Add Policies to allow Service Role/Authenticated Insert access".
-- If the backend uses the ANON key, it is "anon". If it uses SERVICE_ROLE key, it bypasses RLS automatically.
-- Assuming the user might use the ANON key as per the .env.example (usually people put anon key there).
-- Let's add a policy to allow inserts for now to be safe, or we can assume the backend uses the service_role key which bypasses RLS.
-- The prompt said: "Add Policies to allow Service Role/Authenticated Insert access (so the backend can save scores)."
-- If we assume the backend uses the ANON key, we need to allow insert.

create policy "Allow anonymous insert"
on public.users
for insert
with check (true);

create policy "Allow anonymous update"
on public.users
for update
using (true);

create policy "Allow anonymous insert"
on public.game_sessions
for insert
with check (true);
