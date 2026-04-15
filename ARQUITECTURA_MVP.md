# Arquitectura MVP - Sistema de Gestión de Condominios

## 1. Objetivo del MVP

Construir una plataforma web responsive para gestionar procesos clave de condominios y ciudadelas, conectando a administradores, residentes, guardias y proveedores.

El MVP estará orientado a resolver los siguientes problemas principales:

- Registro y validación de pagos de alícuotas
- Control de visitas mediante códigos de acceso
- Registro y seguimiento de novedades e incidencias
- Control de rondas de guardianía
- Directorio de proveedores con sistema de calificación

---

## 2. Tipo de solución tecnológica

La solución será desarrollada como una web app responsive, con posibilidad futura de evolucionar a PWA y posteriormente a aplicación móvil.

### Stack tecnológico
- Frontend: Next.js
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Base de datos: PostgreSQL
- Backend: Supabase
- Hosting: Vercel
- Repositorio: GitHub

---

## 3. Roles del sistema

### 3.1 Superadmin
- Administra toda la plataforma
- Crea condominios
- Gestiona administradores

### 3.2 Administrador
- Gestiona el condominio
- Administra pagos
- Revisa novedades
- Supervisa guardias
- Consulta reportes

### 3.3 Residente
- Consulta estado de cuenta
- Reporta pagos
- Genera accesos para visitas
- Reporta novedades
- Consulta proveedores

### 3.4 Guardia
- Valida accesos
- Registra visitas
- Ejecuta rondas
- Reporta novedades

### 3.5 Proveedor
- Ofrece servicios
- Recibe calificaciones

---

## 4. Módulos del sistema

### 4.1 Módulo de usuarios
- Registro
- Login
- Gestión de roles

### 4.2 Módulo de condominios y viviendas
- Registro de condominios
- Registro de viviendas
- Asociación de residentes

### 4.3 Módulo de pagos
- Registro de alícuotas
- Reporte de pagos
- Subida de comprobantes
- Validación de pagos

### 4.4 Módulo de visitas
- Generación de código de acceso
- Validación por guardia
- Registro de ingreso y salida

### 4.5 Módulo de novedades e incidencias
Permite registrar y dar seguimiento a eventos dentro del condominio.

Incluye:
- Registro por residentes
- Registro por guardias
- Revisión por administradores
- Clasificación por tipo
- Estados de seguimiento
- Adjuntos de evidencia

### 4.6 Módulo de rondas de guardianía
- Registro de rondas
- Puntos de control
- Marcaciones

### 4.7 Módulo de proveedores
- Registro de servicios
- Categorías
- Calificaciones

### 4.8 Módulo de reportes e integración
- Reportes de pagos
- Estado de cuentas
- Exportación a CSV
- Exportación a Excel
- Reportes PDF

---

## 5. Modelo de datos

### 5.1 usuarios
- id
- nombre
- apellido
- email
- telefono
- rol
- activo
- created_at

---

### 5.2 condominios
- id
- nombre
- tipo
- direccion
- ciudad
- provincia
- telefono
- email
- activo
- created_at

---

### 5.3 viviendas
- id
- condominio_id
- codigo_vivienda
- tipo_vivienda
- alicuota_mensual
- estado
- created_at

---

### 5.4 residentes_viviendas
- id
- usuario_id
- vivienda_id
- tipo_relacion
- es_principal
- activo
- created_at

---

### 5.5 pagos
- id
- vivienda_id
- usuario_id
- periodo
- concepto
- monto_esperado
- monto_pagado
- fecha_reporte_pago
- medio_pago
- referencia_pago
- estado
- observacion
- validado_por
- fecha_validacion
- created_at

---

### 5.6 comprobantes_pago
- id
- pago_id
- url_archivo
- nombre_archivo
- tipo_archivo
- created_at

---

### 5.7 visitas
- id
- vivienda_id
- residente_id
- nombre_visitante
- cedula
- codigo_acceso
- tipo_codigo
- fecha_expiracion
- estado
- created_at

---

### 5.8 ingresos_visitas
- id
- visita_id
- guardia_id
- fecha_ingreso
- fecha_salida
- estado

---

### 5.9 rondas_guardia
- id
- guardia_id
- condominio_id
- fecha
- hora_inicio
- hora_fin
- estado

---

### 5.10 puntos_ronda
- id
- condominio_id
- nombre
- codigo
- ubicacion
- activo

---

### 5.11 marcaciones_ronda
- id
- ronda_id
- punto_id
- fecha_hora

---

### 5.12 proveedores
- id
- nombre
- categoria
- telefono
- email
- descripcion
- activo

---

### 5.13 calificaciones_proveedores
- id
- proveedor_id
- usuario_id
- calificacion
- comentario
- created_at

---

### 5.14 novedades
- id
- condominio_id
- vivienda_id
- reportado_por
- rol_reportante
- tipo_novedad
- titulo
- descripcion
- prioridad
- estado
- fecha_reporte
- fecha_cierre
- atendido_por
- observacion_cierre
- created_at

---

### 5.15 archivos_novedades
- id
- novedad_id
- url_archivo
- nombre_archivo
- tipo_archivo
- created_at

---

## 6. Relaciones principales

- Un condominio tiene muchas viviendas
- Una vivienda tiene muchos pagos
- Un pago tiene comprobantes
- Una vivienda genera visitas
- Un guardia ejecuta rondas
- Un proveedor recibe calificaciones
- Una novedad pertenece a un condominio y vivienda

---

## 7. Fases de desarrollo

### Fase 1
- usuarios
- condominios
- viviendas
- pagos
- comprobantes

### Fase 2
- visitas

### Fase 3
- novedades

### Fase 4
- rondas

### Fase 5
- proveedores

### Fase 6
- reportes

---

## 8. Consideraciones técnicas

- No reemplaza sistemas contables
- Exporta información compatible
- Manejo por roles
- Escalable a app móvil

---

## 9. Resultado esperado

El sistema permitirá:

- Registrar pagos
- Validar comprobantes
- Controlar visitas
- Registrar novedades
- Controlar seguridad
- Gestionar proveedores
- Generar reportes

---

## 10. Siguiente paso

- Crear Supabase
- Crear tablas iniciales
- Conectar con Next.js
- Implementar módulo de pagos