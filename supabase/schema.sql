-- Judo Uruguay: base de datos del dojo (cuentas, perfiles, avisos y asistencia).
-- Es el estado actual del proyecto de Supabase. En un proyecto nuevo: SQL Editor > New query > pegar todo > Run.
-- Seguridad: todo con RLS. Las reglas finas viven acá, no en la app.

-- =====================================================================
-- 1) Perfiles
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  belt text not null default 'blanco',
  belt_by_sensei boolean not null default false,      -- true: el sensei fijó el cinturón (la persona ya no lo cambia)
  done text[] not null default '{}',
  learning text[] not null default '{}',
  is_sensei boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint profiles_belt_valid check (belt in ('blanco','amarillo','naranja','verde','azul','marron','negro')),
  constraint profiles_name_len check (char_length(name) <= 40),
  constraint profiles_listas_len check (cardinality(done) <= 100 and cardinality(learning) <= 100)
);
alter table public.profiles enable row level security;

-- Permisos de tabla: solo usuarios con sesión, y solo lo necesario.
-- (Sin estos GRANT la API responde "permission denied for table profiles".)
grant usage on schema public to authenticated;
revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- Todos los que iniciaron sesión ven a los demás del dojo.
create policy "ver perfiles" on public.profiles
  for select to authenticated using (true);

-- Cada persona crea su perfil (nunca como sensei ni con cinturón "fijado").
create policy "crear mi perfil" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and is_sensei = false and belt_by_sensei = false);

-- Cada persona edita el suyo; el sensei puede editar el de cualquiera (la guardia de abajo limita qué).
create policy "editar perfiles" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id
         or exists (select 1 from public.profiles s where s.id = (select auth.uid()) and s.is_sensei))
  with check ((select auth.uid()) = id
         or exists (select 1 from public.profiles s where s.id = (select auth.uid()) and s.is_sensei));

-- Guardia: qué puede cambiar cada quien.
--  * Nadie cambia is_sensei desde la app.
--  * El sensei, sobre otra persona, solo fija el cinturón oficial.
--  * Quien tiene el cinturón fijado por el sensei no lo cambia solo.
-- (Desde el panel de Supabase, auth.uid() es null y no hay restricciones.)
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_sensei boolean := false;
begin
  if caller is null then
    return new;
  end if;
  select coalesce(p.is_sensei, false) into caller_sensei from public.profiles p where p.id = caller;
  new.is_sensei := old.is_sensei;
  if caller_sensei and caller <> old.id then
    new.name := old.name;
    new.done := old.done;
    new.learning := old.learning;
    new.belt_by_sensei := true;
  elsif caller = old.id then
    new.belt_by_sensei := old.belt_by_sensei;
    if old.belt_by_sensei and not caller_sensei then
      new.belt := old.belt;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- =====================================================================
-- 2) Senseis por email (sin políticas a propósito: la app no la puede leer ni editar)
-- =====================================================================
create table if not exists public.sensei_emails (
  email text primary key
);
alter table public.sensei_emails enable row level security;
revoke all on public.sensei_emails from anon, authenticated;

-- Al registrarse se crea el perfil solo (y queda como sensei si su email está en la lista).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, is_sensei)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    exists (select 1 from public.sensei_emails s where lower(s.email) = lower(new.email))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 3) Avisos del sensei: lo lee todo el dojo, solo el sensei publica y borra
-- =====================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 400),
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists announcements_created_idx on public.announcements (created_at desc);
create index if not exists announcements_author_idx on public.announcements (author_id);
alter table public.announcements enable row level security;
revoke all on table public.announcements from anon, authenticated;
grant select, insert, delete on table public.announcements to authenticated;

create policy "ver avisos" on public.announcements
  for select to authenticated using (true);
create policy "el sensei publica avisos" on public.announcements
  for insert to authenticated
  with check (exists (select 1 from public.profiles s where s.id = (select auth.uid()) and s.is_sensei));
create policy "el sensei borra avisos" on public.announcements
  for delete to authenticated
  using (exists (select 1 from public.profiles s where s.id = (select auth.uid()) and s.is_sensei));

-- =====================================================================
-- 4) Asistencia: un registro por persona y día (hora de Montevideo).
--    Cada uno anota o quita solo la suya, y solo la de hoy.
-- =====================================================================
create table if not exists public.attendance (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'America/Montevideo')::date),
  primary key (user_id, day)
);
create index if not exists attendance_day_idx on public.attendance (day);
alter table public.attendance enable row level security;
revoke all on table public.attendance from anon, authenticated;
grant select, insert, delete on table public.attendance to authenticated;

create policy "ver asistencia" on public.attendance
  for select to authenticated using (true);
create policy "anotar mi asistencia de hoy" on public.attendance
  for insert to authenticated
  with check (user_id = (select auth.uid()) and day = ((now() at time zone 'America/Montevideo')::date));
create policy "quitar mi asistencia de hoy" on public.attendance
  for delete to authenticated
  using (user_id = (select auth.uid()) and day = ((now() at time zone 'America/Montevideo')::date));

-- =====================================================================
-- Administración (SQL Editor)
-- =====================================================================
-- Marcar un sensei por email (antes o después de que se registre):
--   insert into public.sensei_emails (email) values ('email@ejemplo.com');
--   update public.profiles set is_sensei = true
--     where id = (select id from auth.users where lower(email) = lower('email@ejemplo.com'));
