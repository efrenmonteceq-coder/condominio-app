
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function validarSuperAdmin(req: Request) {
  const authorization = req.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Sesión no válida. Inicia sesión nuevamente." },
        { status: 401 }
      ),
    };
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.getUser(token);

  if (authError || !authData.user) {
    return {
      error: NextResponse.json(
        { error: "La sesión no es válida o ha expirado." },
        { status: 401 }
      ),
    };
  }

  const { data: actor, error: actorError } = await supabaseAdmin
    .from("usuarios")
    .select("id, rol, activo")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (actorError) {
    console.error("Error verificando SUPER_ADMIN:", actorError);
    return {
      error: NextResponse.json(
        { error: "No se pudo validar el perfil." },
        { status: 500 }
      ),
    };
  }

  if (!actor || actor.activo !== true) {
    return {
      error: NextResponse.json(
        { error: "La cuenta no está activa." },
        { status: 403 }
      ),
    };
  }

  if (String(actor.rol ?? "").toUpperCase().trim() !== "SUPER_ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Solo SUPER_ADMIN puede administrar las actualizaciones." },
        { status: 403 }
      ),
    };
  }

  return { actor };
}

function normalizarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function validarVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

const estadosPermitidos = [
  "PLANIFICADA",
  "PENDIENTE",
  "EN_PROCESO",
  "EXITOSA",
  "ERROR",
  "CANCELADA",
  "REVERSADA",
];

export async function GET(req: Request) {
  try {
    const acceso = await validarSuperAdmin(req);

    if ("error" in acceso) {
      return acceso.error;
    }

    const { searchParams } = new URL(req.url);
    const estado = normalizarTexto(
      searchParams.get("estado")
    ).toUpperCase();
    const instalacionId = normalizarTexto(
      searchParams.get("solicitud_instalacion_id")
    );

    let consulta = supabaseAdmin
      .from("renalix_actualizaciones")
      .select(
        "id, solicitud_instalacion_id, version_origen, version_destino, estado, etapa_actual, intentos, iniciado_at, completado_at, error_etapa, detalle_error, ejecutado_por, metadata, created_at, updated_at"
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

    if (instalacionId) {
      consulta = consulta.eq(
        "solicitud_instalacion_id",
        instalacionId
      );
    }

    const { data: actualizaciones, error } = await consulta;

    if (error) {
      console.error("Error consultando actualizaciones:", error);
      return NextResponse.json(
        { error: "No se pudo consultar el historial de actualizaciones." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: actualizaciones?.length ?? 0,
      actualizaciones: actualizaciones ?? [],
    });
  } catch (error) {
    console.error("Error en GET de actualizaciones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al consultar las actualizaciones." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const acceso = await validarSuperAdmin(req);

    if ("error" in acceso) {
      return acceso.error;
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

    const instalacionId = normalizarTexto(
      body.solicitud_instalacion_id
    );
    const versionOrigen = normalizarTexto(
      body.version_origen
    );
    const versionDestino = normalizarTexto(
      body.version_destino
    );

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        instalacionId
      )
    ) {
      return NextResponse.json(
        { error: "El identificador de instalación no es válido." },
        { status: 400 }
      );
    }

    if (!validarVersion(versionDestino)) {
      return NextResponse.json(
        {
          error:
            "La versión destino debe tener formato X.Y.Z, por ejemplo 1.0.0.",
        },
        { status: 400 }
      );
    }

    if (versionOrigen && !validarVersion(versionOrigen)) {
      return NextResponse.json(
        { error: "La versión de origen debe tener formato X.Y.Z." },
        { status: 400 }
      );
    }

    if (versionOrigen && versionOrigen === versionDestino) {
      return NextResponse.json(
        {
          error:
            "La versión de origen y la versión destino no pueden ser iguales.",
        },
        { status: 400 }
      );
    }

    const { data: instalacion, error: instalacionError } =
      await supabaseAdmin
        .from("solicitudes_instalacion")
        .select("id, version_instalada, version_objetivo")
        .eq("id", instalacionId)
        .maybeSingle();

    if (instalacionError) {
      console.error("Error consultando instalación:", instalacionError);
      return NextResponse.json(
        { error: "No se pudo validar la instalación." },
        { status: 500 }
      );
    }

    if (!instalacion) {
      return NextResponse.json(
        { error: "La instalación indicada no existe." },
        { status: 404 }
      );
    }

    const origenReal = instalacion.version_instalada
      ? String(instalacion.version_instalada).trim()
      : null;

    if (
      versionOrigen &&
      origenReal &&
      versionOrigen !== origenReal
    ) {
      return NextResponse.json(
        {
          error:
            "La versión de origen enviada no coincide con la versión instalada registrada.",
          version_instalada: origenReal,
        },
        { status: 409 }
      );
    }

    
    const { data: versionDestinoRegistrada, error: versionError } =
      await supabaseAdmin
        .from("renalix_versiones")
        .select("version, estado")
        .eq("version", versionDestino)
        .maybeSingle();

    if (versionError) {
      console.error("Error validando versión destino:", versionError);
      return NextResponse.json(
        { error: "No se pudo validar la versión destino." },
        { status: 500 }
      );
    }

    if (
      !versionDestinoRegistrada ||
      versionDestinoRegistrada.estado !== "DISPONIBLE"
    ) {
      return NextResponse.json(
        {
          error:
            "La versión destino no existe en el catálogo o no está disponible para actualización.",
        },
        { status: 400 }
      );
    }


    const { data: pendiente, error: pendienteError } =
      await supabaseAdmin
        .from("renalix_actualizaciones")
        .select("id, estado")
        .eq("solicitud_instalacion_id", instalacionId)
        .in("estado", ["PLANIFICADA", "PENDIENTE", "EN_PROCESO"])
        .limit(1);

    if (pendienteError) {
      console.error(
        "Error comprobando actualizaciones pendientes:",
        pendienteError
      );
      return NextResponse.json(
        { error: "No se pudo comprobar si existe otra actualización pendiente." },
        { status: 500 }
      );
    }

    if (pendiente && pendiente.length > 0) {
      return NextResponse.json(
        {
          error:
            "La instalación ya tiene una actualización planificada o en proceso.",
          actualizacion_existente: pendiente[0],
        },
        { status: 409 }
      );
    }

    const { data: actualizacion, error: insercionError } =
      await supabaseAdmin
        .from("renalix_actualizaciones")
        .insert({
          solicitud_instalacion_id: instalacionId,
          version_origen: origenReal || versionOrigen || null,
          version_destino: versionDestino,
          estado: "PLANIFICADA",
          etapa_actual: "PLANIFICACION",
          intentos: 0,
          ejecutado_por: acceso.actor.id,
          metadata: {
            origen: "PANEL_SUPERADMIN",
            tipo: "PLANIFICACION_MANUAL",
          },
        })
        .select(
          "id, solicitud_instalacion_id, version_origen, version_destino, estado, etapa_actual, intentos, ejecutado_por, metadata, created_at, updated_at"
        )
        .single();

   
    if (insercionError || !actualizacion) {
      if (insercionError?.code === "23505") {
        return NextResponse.json(
          {
            error:
              "La instalación ya tiene una actualización planificada o en proceso.",
          },
          { status: 409 }
        );
      }

      console.error(
        "Error registrando actualización:",
        insercionError
      );

      return NextResponse.json(
        { error: "No se pudo registrar la actualización planificada." },
        { status: 500 }
      );
    }
      } catch (error) {
    console.error("Error en POST de actualizaciones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al registrar la actualización." },
      { status: 500 }
    );
  }
}
