
CREATE UNIQUE INDEX IF NOT EXISTS
  renalix_actualizaciones_una_pendiente_por_instalacion_idx
ON public.renalix_actualizaciones (solicitud_instalacion_id)
WHERE estado IN ('PLANIFICADA', 'PENDIENTE', 'EN_PROCESO');
