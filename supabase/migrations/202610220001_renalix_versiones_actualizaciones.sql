-- RENALIX Core: catalogo de versiones e historial de actualizaciones.
-- VERSION REVISADA: validar en un entorno de prueba antes de produccion.
-- No ejecutar hasta confirmar respaldo y revisar el diff con el archivo original.
-- Esta migracion NO despliega codigo ni ejecuta migraciones en las urbanizaciones;
-- solamente prepara el catalogo y el registro de seguimiento.

BEGIN;

-- 1. Catalogo central de versiones.
CREATE TABLE IF NOT EXISTS public.renalix_versiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE
    CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  nombre text NOT NULL
    CHECK (length(btrim(nombre)) BETWEEN 1 AND 150),
  notas_liberacion text,
  estado text NOT NULL DEFAULT 'BORRADOR'
    CHECK (estado IN ('BORRADOR', 'PILOTO', 'DISPONIBLE', 'RETIRADA')),
  version_minima text
    CHECK (version_minima IS NULL OR version_minima ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  referencia_codigo text,
  publicada_at timestamptz,
  creado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS renalix_versiones_estado_created_idx
  ON public.renalix_versiones (estado, created_at DESC);

-- 2. Historial de intentos de actualizacion por solicitud de instalacion.
CREATE TABLE IF NOT EXISTS public.renalix_actualizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_instalacion_id uuid NOT NULL
    REFERENCES public.solicitudes_instalacion(id) ON DELETE RESTRICT,
  version_origen text,
  version_destino text NOT NULL
    CHECK (version_destino ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  estado text NOT NULL DEFAULT 'PLANIFICADA'
    CHECK (estado IN (
      'PLANIFICADA', 'PENDIENTE', 'EN_PROCESO', 'EXITOSA',
      'ERROR', 'CANCELADA', 'REVERSADA'
    )),
  etapa_actual text NOT NULL DEFAULT 'PLANIFICACION'
    CHECK (etapa_actual IN (
      'PLANIFICACION', 'RESPALDO', 'DESPLIEGUE', 'MIGRACION',
      'VALIDACION', 'COMPLETADO', 'REVERSA'
    )),
  intentos integer NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  iniciado_at timestamptz,
  completado_at timestamptz,
  error_etapa text,
  detalle_error text,
  ejecutado_por uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS renalix_actualizaciones_instalacion_created_idx
  ON public.renalix_actualizaciones (solicitud_instalacion_id, created_at DESC);

CREATE INDEX IF NOT EXISTS renalix_actualizaciones_estado_created_idx
  ON public.renalix_actualizaciones (estado, created_at DESC);

-- 3. Versiones instalada y objetivo en cada solicitud de instalacion.
ALTER TABLE public.solicitudes_instalacion
  ADD COLUMN IF NOT EXISTS version_instalada text;

ALTER TABLE public.solicitudes_instalacion
  ADD COLUMN IF NOT EXISTS version_objetivo text;

-- 4. RLS y privilegios.
-- Sin politicas para anon/authenticated: el acceso de la aplicacion debe pasar
-- por rutas de servidor que autentiquen y autoricen al usuario.
ALTER TABLE public.renalix_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renalix_actualizaciones ENABLE ROW LEVEL SECURITY;

-- REVOKE explicito para contrarrestar privilegios predeterminados amplios.
REVOKE ALL PRIVILEGES ON TABLE public.renalix_versiones
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.renalix_actualizaciones
  FROM PUBLIC, anon, authenticated;

-- Conceder solo los permisos de datos que necesitan las rutas de servidor.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.renalix_versiones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.renalix_actualizaciones TO service_role;

-- 5. Funciones y triggers para updated_at.
-- search_path fijo y referencias cualificadas para reducir riesgos de resolucion.
CREATE OR REPLACE FUNCTION public.actualizar_renalix_versiones_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_renalix_versiones_updated_at
  ON public.renalix_versiones;

CREATE TRIGGER trg_renalix_versiones_updated_at
BEFORE UPDATE ON public.renalix_versiones
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_renalix_versiones_updated_at();

CREATE OR REPLACE FUNCTION public.actualizar_renalix_actualizaciones_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_renalix_actualizaciones_updated_at
  ON public.renalix_actualizaciones;

CREATE TRIGGER trg_renalix_actualizaciones_updated_at
BEFORE UPDATE ON public.renalix_actualizaciones
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_renalix_actualizaciones_updated_at();

-- Las funciones de trigger no deben invocarse directamente desde clientes.
REVOKE ALL PRIVILEGES ON FUNCTION public.actualizar_renalix_versiones_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.actualizar_renalix_actualizaciones_updated_at()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_renalix_versiones_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.actualizar_renalix_actualizaciones_updated_at() TO service_role;

COMMIT;

-- Verificaciones posteriores recomendadas (ejecutar por separado y solo lectura):
-- 1) Confirmar tablas y columnas en information_schema.
-- 2) Confirmar rowsecurity en pg_tables.
-- 3) Confirmar ausencia de privilegios para anon/authenticated y permisos necesarios
--    para service_role en information_schema.role_table_grants / has_table_privilege.
-- 4) Confirmar triggers en information_schema.triggers.

