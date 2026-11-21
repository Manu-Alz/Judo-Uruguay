-- Judo Uruguay: base de datos de cuentas y perfiles del dojo.
-- Estado actual del proyecto. Pegar en Supabase > SQL Editor > Run (en un proyecto nuevo).

-- 1) Perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  belt text not null default 'blanco',
  done text[] not null default '{}',
  learning text[] not null default '{}',
  is_sensei boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Permisos de tabla: solo usuarios con sesión, y solo lo necesario.
-- (Sin estos GRANT la API responde "permission denied for table profiles".)
grant usage on schema public to authenticated;
revoke all on table public.profiles from anon;
grant select, insert, update on table public.profiles to authenticated;

-- 2) Reglas de seguridad (RLS)
-- Cualquier persona con sesión iniciada puede ver a los demás del dojo.
create policy "ver perfiles" on public.profiles
  for select to authenticated using (true);

-- Cada persona crea su propio perfil (nunca como sensei).
create policy "crear mi perfil" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and is_sensei = false);

-- Cada persona edita solo el suyo y no puede ascenderse a sensei.
create policy "editar mi perfil" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and is_sensei = (select p.is_sensei from public.profiles p where p.id = (select auth.uid()))
  );

-- 3) Senseis por email: sin políticas a propósito (la app no puede leerla ni editarla).
create table if not exists public.sensei_emails (
  email text primary key
);
alter table public.sensei_emails enable row level security;
revoke all on public.sensei_emails from anon, authenticated;

-- 4) Al registrarse, se crea el perfil solo (y se marca sensei si su email está en la lista)
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

-- Agregar un sensei (antes o después de que se registre):
--   insert into public.sensei_emails (email) values ('email@ejemplo.com');
--   update public.profiles set is_sensei = true
--     where id = (select id from auth.users where lower(email) = lower('email@ejemplo.com'));
