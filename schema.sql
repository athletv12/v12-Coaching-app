-- ============================================================
-- V12 COACHING APP — Datenbankschema für Supabase
-- ============================================================
-- Anwendung: Im Supabase-Projekt unter "SQL Editor" komplett
-- einfügen und ausführen (einmalig).
-- ============================================================

-- ---------- 1. PROFILE (erweitert Supabase Auth um Rolle) ----------
create type user_role as enum ('coach', 'client');
create type client_status as enum ('pending', 'approved', 'declined');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  name text not null,
  email text not null,
  status client_status not null default 'pending',
  start_date date default current_date,
  zoom_link text,
  sex text check (sex in ('m','w')),
  age int,
  height_cm numeric,
  weight_kg numeric,
  pal numeric default 1.6,
  goal_fatloss boolean default true,
  goal_muscle boolean default true,
  cal_target int default 2200,
  protein_target int default 180,
  carb_target int default 220,
  fat_target int default 70,
  created_at timestamptz default now()
);

-- ---------- 2. TAGESWERTE (Wasser/Schritte/Schlaf/Plan) ----------
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  water_l numeric,
  steps int,
  sleep_hours numeric,
  plan text check (plan in ('A','B','C','kondition','rest')),
  unique(user_id, log_date)
);

-- ---------- 3. ERNÄHRUNG ----------
create table food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  description text not null,
  source text check (source in ('text','foto')) default 'text',
  kcal int, protein int, carbs int, fat int
);

-- ---------- 4. TRAINING ----------
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  session_date date not null default current_date,
  plan_key text not null,             -- 'A' | 'B' | 'C' | 'kondition'
  duration_min int,
  exercises jsonb not null default '[]'::jsonb  -- [{name, variante, saetze:[{gewicht,wdh}]}]
);

-- ---------- 5. GEWICHT ----------
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  weight_kg numeric not null,
  unique(user_id, log_date)
);

-- ---------- 6. GEWOHNHEITEN & SUPPLEMENTS ----------
create table habit_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  item_key text not null,
  checked boolean default false,
  unique(user_id, log_date, item_key)
);

-- ---------- 7. FORTSCHRITTSFOTOS (Storage-Bucket "progress-photos" separat anlegen) ----------
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  storage_path text not null
);

-- ---------- 8. COACH-CHAT ----------
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  question text not null,
  answer text
);

-- ---------- 9. POSTFACH (Coach-Benachrichtigungen) ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  icon text, text_content text not null,
  read boolean default false
);

-- ---------- 10. COACH-NOTIZEN (pro Klient, nur für Coach) ----------
create table coach_notes (
  user_id uuid references profiles(id) on delete cascade primary key,
  notes text
);

-- ============================================================
-- ROW LEVEL SECURITY — DAS IST DAS KERNSTÜCK DER RECHTETRENNUNG
-- ============================================================
alter table profiles enable row level security;
alter table daily_logs enable row level security;
alter table food_entries enable row level security;
alter table workout_sessions enable row level security;
alter table weight_logs enable row level security;
alter table habit_checks enable row level security;
alter table progress_photos enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;
alter table coach_notes enable row level security;

-- Hilfsfunktion: prüft, ob der aktuell eingeloggte Nutzer Coach ist
create or replace function is_coach() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'coach' and status = 'approved');
$$ language sql security definer stable;

-- ---- profiles: Klient sieht/bearbeitet nur sich selbst, Coach sieht/bearbeitet alle ----
create policy "eigenes Profil lesen" on profiles for select using (id = auth.uid() or is_coach());
create policy "eigenes Profil aktualisieren" on profiles for update using (id = auth.uid() or is_coach());
create policy "Registrierung erlaubt" on profiles for insert with check (id = auth.uid());

-- ---- Gleiche Regel für alle Klientendaten-Tabellen: eigene Zeilen ODER Coach ----
create policy "eigene Tageswerte" on daily_logs for all using (user_id = auth.uid() or is_coach());
create policy "eigene Ernährung" on food_entries for all using (user_id = auth.uid() or is_coach());
create policy "eigenes Training" on workout_sessions for all using (user_id = auth.uid() or is_coach());
create policy "eigenes Gewicht" on weight_logs for all using (user_id = auth.uid() or is_coach());
create policy "eigene Gewohnheiten" on habit_checks for all using (user_id = auth.uid() or is_coach());
create policy "eigene Fotos" on progress_photos for all using (user_id = auth.uid() or is_coach());
create policy "eigener Chat" on chat_messages for all using (user_id = auth.uid() or is_coach());

-- ---- Nur der Coach darf Zielwerte (Kalorien/Makros) ändern ----
create policy "Zielwerte nur Coach" on profiles for update using (
  id = auth.uid() and (
    -- Klient darf alles außer die Zielwerte ändern; erzwungen über eine Trigger-Funktion (siehe unten)
    true
  )
);
create or replace function protect_targets() returns trigger as $$
begin
  if not is_coach() then
    new.cal_target := old.cal_target;
    new.protein_target := old.protein_target;
    new.carb_target := old.carb_target;
    new.fat_target := old.fat_target;
  end if;
  return new;
end;
$$ language plpgsql security definer;
create trigger protect_targets_trigger before update on profiles
  for each row execute function protect_targets();

-- ---- notifications & coach_notes: nur der Coach ----
create policy "Postfach nur Coach" on notifications for all using (is_coach());
create policy "Notizen nur Coach" on coach_notes for all using (is_coach());

-- ============================================================
-- ERSTEN COACH-ACCOUNT ANLEGEN
-- ============================================================
-- 1. In Supabase unter Authentication -> Users manuell deinen Account
--    per E-Mail anlegen (oder über die App registrieren).
-- 2. Danach EINMALIG diesen Befehl ausführen (deine E-Mail einsetzen):
--
-- update profiles set role = 'coach', status = 'approved'
-- where email = 'DEINE-EMAIL@BEISPIEL.DE';
