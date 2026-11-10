import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function normalizarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function generarSlug(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Sesión no válida. Inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "La sesión no es válida o ha expirado." },
        { status: 401 }
      );
    }

    const { data: actor, error: actorError } = await supabaseAdmin
      .from("usuarios")
      .select("id, rol, activo")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (actorError) {
      console.error("Error verificando SUPER_ADMIN:", actorError);
      return NextResponse.json(
        { error: "No se pudo validar el perfil." },
        { status: 500 }
      );
    }

    if (!actor || actor.activo !== true) {
      return NextResponse.json(
        { error: "La cuenta no está activa." },
        { status: 403 }
      );
    }

    if (String(actor.rol ?? "").toUpperCase().trim() !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Solo SUPER_ADMIN puede registrar instalaciones." },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 }
      );
    }

    const nombre = normalizarTexto(body.nombre);
    const direccion = normalizarTexto(body.direccion);
    const nombreAdministrador = normalizarTexto(body.nombre_administrador);
    const emailAdministrador = normalizarTexto(
      body.email_administrador
    ).toLowerCase();
    const identificacionAdministrador = normalizarTexto(
      body.identificacion_administrador
    );
    const telefonoAdministrador = normalizarTexto(
      body.telefono_administrador
    );

    if (
      !nombre ||
      !direccion ||
      !nombreAdministrador ||
      !emailAdministrador ||
      !identificacionAdministrador
    ) {
      return NextResponse.json(
        {
          error:
            "Completa el nombre y dirección de la urbanización, y los datos obligatorios del administrador.",
        },
        { status: 400 }
      );
    }

    if (
      nombre.length > 150 ||
      direccion.length > 250 ||
      nombreAdministrador.length > 150 ||
      emailAdministrador.length > 254 ||
      identificacionAdministrador.length > 30 ||
      telefonoAdministrador.length > 30
    ) {
      return NextResponse.json(
        { error: "Uno o más campos superan la longitud permitida." },
        { status: 400 }
      );
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailAdministrador
    );

    if (!emailValido) {
      return NextResponse.json(
        { error: "El correo del administrador no es válido." },
        { status: 400 }
      );
    }

    const slugSolicitado = generarSlug(
      normalizarTexto(body.slug) || nombre
    );

    if (!slugSolicitado) {
      return NextResponse.json(
        { error: "No se pudo generar un identificador válido." },
        { status: 400 }
      );
    }

    const { data: existente, error: consultaError } =
      await supabaseAdmin
        .from("solicitudes_instalacion")
        .select("id, estado")
        .eq("slug", slugSolicitado)
        .maybeSingle();

    if (consultaError) {
      console.error("Error consultando solicitud:", consultaError);
      return NextResponse.json(
        { error: "No se pudo comprobar el identificador de instalación." },
        { status: 500 }
      );
    }

    if (existente) {
      return NextResponse.json(
        {
          error: "Ya existe una solicitud con ese identificador.",
          solicitud_id: existente.id,
          estado: existente.estado,
        },
        { status: 409 }
      );
    }

    const { data: solicitud, error: insercionError } =
      await supabaseAdmin
        .from("solicitudes_instalacion")
        .insert({
          nombre,
          direccion,
          slug: slugSolicitado,
          nombre_administrador: nombreAdministrador,
          email_administrador: emailAdministrador,
          identificacion_administrador:
            identificacionAdministrador,
          telefono_administrador: telefonoAdministrador || null,
          creado_por: actor.id,
          estado: "PENDIENTE",
          etapa_actual: "REGISTRO",
        })
        .select(
          "id, nombre, slug, estado, etapa_actual, created_at"
        )
        .single();

    if (insercionError || !solicitud) {
      console.error("Error creando solicitud:", insercionError);

      if (insercionError?.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe una solicitud con ese identificador." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "No se pudo registrar la solicitud de instalación." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud de instalación registrada.",
        solicitud,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en API de instalaciones:", error);

    return NextResponse.json(
      { error: "Ocurrió un error interno al registrar la instalación." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Sesión no válida." },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "La sesión no es válida o ha expirado." },
        { status: 401 }
      );
    }

    const { data: actor, error: actorError } = await supabaseAdmin
      .from("usuarios")
      .select("id, rol, activo")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (actorError) {
      console.error("Error verificando acceso a instalaciones:", actorError);
      return NextResponse.json(
        { error: "No se pudo validar el perfil." },
        { status: 500 }
      );
    }

    if (!actor || actor.activo !== true) {
      return NextResponse.json(
        { error: "La cuenta no está activa." },
        { status: 403 }
      );
    }

    if (String(actor.rol ?? "").toUpperCase().trim() !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Solo SUPER_ADMIN puede consultar las instalaciones." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado")?.trim().toUpperCase();
    const estadosPermitidos = [
      "PENDIENTE",
      "EN_PROCESO",
      "ERROR",
      "LISTA",
      "CANCELADA",
    ];

    let consulta = supabaseAdmin
      .from("solicitudes_instalacion")
      .select(
        "id, nombre, direccion, slug, nombre_administrador, email_administrador, telefono_administrador, estado, etapa_actual, proyecto_supabase_id, proyecto_vercel_id, url_produccion, intentos, ultimo_intento_at, completado_at, error_etapa, detalle_error, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (estado) {
      if (!estadosPermitidos.includes(estado)) {
        return NextResponse.json(
          { error: "El filtro de estado no es válido." },
          { status: 400 }
        );
      }

      consulta = consulta.eq("estado", estado);
    }

    const { data: solicitudes, error: consultaError } = await consulta;

    if (consultaError) {
      console.error("Error consultando instalaciones:", consultaError);
      return NextResponse.json(
        { error: "No se pudieron consultar las solicitudes." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: solicitudes?.length ?? 0,
      solicitudes: solicitudes ?? [],
    });
  } catch (error) {
    console.error("Error en GET de instalaciones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al consultar las instalaciones." },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request) {
  try {
    // 1. Validar token de sesión
    const authorization = req.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Sesión no válida. Inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "La sesión no es válida o ha expirado." },
        { status: 401 }
      );
    }

    // 2. Verificar que el usuario sea SUPER_ADMIN activo
    const { data: actor, error: actorError } = await supabaseAdmin
      .from("usuarios")
      .select("id, rol, activo")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (actorError) {
      console.error("Error verificando SUPER_ADMIN:", actorError);
      return NextResponse.json(
        { error: "No se pudo validar el perfil." },
        { status: 500 }
      );
    }

    if (!actor || actor.activo !== true) {
      return NextResponse.json(
        { error: "La cuenta no está activa." },
        { status: 403 }
      );
    }

    if (String(actor.rol ?? "").toUpperCase().trim() !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Solo SUPER_ADMIN puede modificar solicitudes." },
        { status: 403 }
      );
    }

    // 3. Validar el cuerpo de la petición
    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 }
      );
    }

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    const estadosPermitidos = [
      "PENDIENTE",
      "EN_PROCESO",
      "ERROR",
      "LISTA",
      "CANCELADA",
    ];

    const etapasPermitidas = [
      "REGISTRO",
      "SUPABASE",
      "VERCEL",
      "CONFIGURACION",
      "VALIDACION",
      "COMPLETADO",
    ];

    const estado =
      typeof body.estado === "string"
        ? body.estado.trim().toUpperCase()
        : "";

    const etapaActual =
      typeof body.etapa_actual === "string"
        ? body.etapa_actual.trim().toUpperCase()
        : "";

    const errorEtapa =
      typeof body.error_etapa === "string"
        ? body.error_etapa.trim()
        : "";

    const detalleError =
      typeof body.detalle_error === "string"
        ? body.detalle_error.trim()
        : "";

    // Datos de infraestructura que el SUPER_ADMIN registra manualmente
    // después de crear los proyectos en Supabase y Vercel.
    const camposInfraestructura = [
      "proyecto_supabase_id",
      "proyecto_vercel_id",
      "url_produccion",
      "dominio",
    ] as const;

    const infraestructura: Record<string, string | null> = {};
    for (const campo of camposInfraestructura) {
      if (Object.prototype.hasOwnProperty.call(body, campo)) {
        const valor = body[campo];

        if (valor !== null && typeof valor !== "string") {
          return NextResponse.json(
            { error: `El campo ${campo} debe ser texto o null.` },
            { status: 400 }
          );
        }

        infraestructura[campo] =
          typeof valor === "string" && valor.trim()
            ? valor.trim()
            : null;
      }
    }

    if (
      infraestructura.proyecto_supabase_id &&
      infraestructura.proyecto_supabase_id.length > 150
    ) {
      return NextResponse.json(
        { error: "El identificador del proyecto Supabase es demasiado largo." },
        { status: 400 }
      );
    }

    if (
      infraestructura.proyecto_vercel_id &&
      infraestructura.proyecto_vercel_id.length > 200
    ) {
      return NextResponse.json(
        { error: "El identificador del proyecto Vercel es demasiado largo." },
        { status: 400 }
      );
    }

    if (infraestructura.url_produccion) {
      if (infraestructura.url_produccion.length > 500) {
        return NextResponse.json(
          { error: "La URL de producción es demasiado larga." },
          { status: 400 }
        );
      }

      try {
        const urlProduccion = new URL(infraestructura.url_produccion);
        if (!["https:", "http:"].includes(urlProduccion.protocol)) {
          throw new Error("Protocolo no permitido");
        }
      } catch {
        return NextResponse.json(
          { error: "La URL de producción no es válida." },
          { status: 400 }
        );
      }
    }

    if (infraestructura.dominio && infraestructura.dominio.length > 253) {
      return NextResponse.json(
        { error: "El dominio supera la longitud permitida." },
        { status: 400 }
      );
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "El identificador de la solicitud no es válido." },
        { status: 400 }
      );
    }

    if (!estadosPermitidos.includes(estado)) {
      return NextResponse.json(
        { error: "El estado indicado no es válido." },
        { status: 400 }
      );
    }

    if (!etapasPermitidas.includes(etapaActual)) {
      return NextResponse.json(
        { error: "La etapa indicada no es válida." },
        { status: 400 }
      );
    }

    if (errorEtapa.length > 100 || detalleError.length > 2000) {
      return NextResponse.json(
        { error: "La información del error supera la longitud permitida." },
        { status: 400 }
      );
    }

    if (estado === "ERROR" && !detalleError) {
      return NextResponse.json(
        { error: "Debes indicar el detalle del error." },
        { status: 400 }
      );
    }

    // 4. Consultar el estado actual antes de modificar
    const { data: actual, error: actualError } = await supabaseAdmin
      .from("solicitudes_instalacion")
      .select(
        "id, estado, etapa_actual, proyecto_supabase_id, proyecto_vercel_id, url_produccion, dominio"
      )
      .eq("id", id)
      .maybeSingle();

    if (actualError) {
      console.error("Error consultando solicitud:", actualError);
      return NextResponse.json(
        { error: "No se pudo consultar la solicitud." },
        { status: 500 }
      );
    }

    if (!actual) {
      return NextResponse.json(
        { error: "La solicitud no existe." },
        { status: 404 }
      );
    }

    
    // 5. Validar transiciones de estado
    const transiciones: Record<string, string[]> = {
      PENDIENTE: ["PENDIENTE", "EN_PROCESO", "CANCELADA"],
      EN_PROCESO: ["EN_PROCESO", "LISTA", "ERROR", "CANCELADA"],
      ERROR: ["ERROR", "EN_PROCESO", "CANCELADA"],
      LISTA: ["LISTA"],
      CANCELADA: ["CANCELADA"],
    };

    if (!transiciones[actual.estado]?.includes(estado)) {
      return NextResponse.json(
        {
          error: `No se permite cambiar de ${actual.estado} a ${estado}.`,
        },
        { status: 409 }
      );
    }


    // Evaluar los datos nuevos si vienen en esta petición; si no, usar los actuales.
    const proyectoSupabaseFinal = Object.prototype.hasOwnProperty.call(
      infraestructura,
      "proyecto_supabase_id"
    )
      ? infraestructura.proyecto_supabase_id
      : actual.proyecto_supabase_id;

    const proyectoVercelFinal = Object.prototype.hasOwnProperty.call(
      infraestructura,
      "proyecto_vercel_id"
    )
      ? infraestructura.proyecto_vercel_id
      : actual.proyecto_vercel_id;

    const urlProduccionFinal = Object.prototype.hasOwnProperty.call(
      infraestructura,
      "url_produccion"
    )
      ? infraestructura.url_produccion
      : actual.url_produccion;

    // LISTA requiere evidencias de que la instalación se completó.
    if (estado === "LISTA") {
      const tieneProyectoSupabase =
        typeof proyectoSupabaseFinal === "string" &&
        proyectoSupabaseFinal.trim().length > 0;

      const tieneProyectoVercel =
        typeof proyectoVercelFinal === "string" &&
        proyectoVercelFinal.trim().length > 0;

      const tieneUrlProduccion =
        typeof urlProduccionFinal === "string" &&
        urlProduccionFinal.trim().length > 0;

      if (
        etapaActual !== "COMPLETADO" ||
        !tieneProyectoSupabase ||
        !tieneProyectoVercel ||
        !tieneUrlProduccion
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede marcar como LISTA: se requiere etapa COMPLETADO, identificador del proyecto Supabase, identificador del proyecto Vercel y URL de producción.",
          },
          { status: 409 }
        );
      }
    }

    // 6. Preparar únicamente los campos autorizados
    const actualizacion: Record<string, unknown> = {
      estado,
      etapa_actual: etapaActual,
      error_etapa: estado === "ERROR" ? errorEtapa || etapaActual : null,
      detalle_error: estado === "ERROR" ? detalleError : null,
      updated_at: new Date().toISOString(),
    };

    if (estado === "LISTA") {
      actualizacion.completado_at = new Date().toISOString();
    }

    // Solo se escriben los campos de infraestructura que el cliente envió.
    for (const campo of camposInfraestructura) {
      if (Object.prototype.hasOwnProperty.call(infraestructura, campo)) {
        actualizacion[campo] = infraestructura[campo];
      }
    }

    const { data: solicitud, error: actualizacionError } =
      await supabaseAdmin
        .from("solicitudes_instalacion")
        .update(actualizacion)
        .eq("id", id)
        .eq("estado", actual.estado)
        .select(
          "id, nombre, slug, estado, etapa_actual, error_etapa, detalle_error, proyecto_supabase_id, proyecto_vercel_id, url_produccion, dominio, completado_at, updated_at"
        )
        .maybeSingle();

    if (actualizacionError) {
      console.error("Error actualizando solicitud:", actualizacionError);
      return NextResponse.json(
        { error: "No se pudo actualizar la solicitud." },
        { status: 500 }
      );
    }

    if (!solicitud) {
      return NextResponse.json(
        {
          error:
            "La solicitud cambió durante la operación. Actualiza el listado e inténtalo nuevamente.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud actualizada correctamente.",
      solicitud,
    });
  } catch (error) {
    console.error("Error en PATCH de instalaciones:", error);

    return NextResponse.json(
      { error: "Ocurrió un error interno al actualizar la solicitud." },
      { status: 500 }
    );
  }
}

