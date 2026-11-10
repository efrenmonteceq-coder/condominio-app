-- RENALIX: registro central de solicitudes de instalacion.
-- Esta migracion es local; no ejecutar en produccion sin revision.

create table if not exists public.solicitudes_instalacion (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,
  direccion text not null,
  slug text not null unique,
  dominio text,

  nombre_administrador text not null,
  email_administrador text not null,
  identificacion_administrador text not null,
  telefono_administrador text,

  estado text not null default 'PENDIENTE'
    check (estado in (
      'PENDIENTE',
      'EN_PROCESO',
      'ERROR',
      'LISTA',
      'CANCELADA'
    )),

  etapa_actual text not null default 'REGISTRO'
    check (etapa_actual in (
      'REGISTRO',
      'SUPABASE',
      'VERCEL',
      'CONFIGURACION',
      'VALIDACION',
      'COMPLETADO'
    )),

  proyecto_supabase_id text,
  proyecto_vercel_id text,
  url_produccion text,

  intentos integer not null default 0
    check (intentos >= 0),
  ultimo_intento_at timestamptz,
  completado_at timestamptz,

  error_etapa text,
  detalle_error text,
  metadata jsonb not null default '{}'::jsonb,

  creado_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitudes_instalacion_estado_created_idx
  on public.solicitudes_instalacion (estado, created_at desc);

alter table public.solicitudes_instalacion enable row level security;

revoke all on table public.solicitudes_instalacion
  from anon, authenticated;

grant all on table public.solicitudes_instalacion
  to service_role;

create or replace function public.actualizar_solicitudes_instalacion_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_solicitudes_instalacion_updated_at
  on public.solicitudes_instalacion;

create trigger trg_solicitudes_instalacion_updated_at
before update on public.solicitudes_instalacion
for each row
execute function public.actualizar_solicitudes_instalacion_updated_at();
