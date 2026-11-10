
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
        { error: "Solo SUPER_ADMIN puede administrar las versiones." },
        { status: 403 }
      ),
    };
  }

  return { actor };
}

function normalizarTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

const estadosPermitidos = [
  "BORRADOR",
  "PILOTO",
  "DISPONIBLE",
  "RETIRADA",
];

function validarVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export async function GET(req: Request) {
  try {
    const acceso = await validarSuperAdmin(req);

    if ("error" in acceso) {
      return acceso.error;
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado")?.trim().toUpperCase();

    let consulta = supabaseAdmin
      .from("renalix_versiones")
      .select(
        "id, version, nombre, notas_liberacion, estado, version_minima, referencia_codigo, publicada_at, creado_por, created_at, updated_at"
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

    const { data: versiones, error } = await consulta;

    if (error) {
      console.error("Error consultando versiones:", error);
      return NextResponse.json(
        { error: "No se pudieron consultar las versiones." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: versiones?.length ?? 0,
      versiones: versiones ?? [],
    });
  } catch (error) {
    console.error("Error en GET de versiones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al consultar las versiones." },
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

    const version = normalizarTexto(body.version);
    const nombre = normalizarTexto(body.nombre);
    const notasLiberacion = normalizarTexto(body.notas_liberacion);
    const versionMinima = normalizarTexto(body.version_minima);
    const referenciaCodigo = normalizarTexto(body.referencia_codigo);

    if (!validarVersion(version)) {
      return NextResponse.json(
        { error: "La versión debe tener el formato X.Y.Z, por ejemplo 1.0.0." },
        { status: 400 }
      );
    }

    if (!nombre || nombre.length > 150) {
      return NextResponse.json(
        { error: "El nombre es obligatorio y no debe superar 150 caracteres." },
        { status: 400 }
      );
    }

    if (
      notasLiberacion.length > 5000 ||
      referenciaCodigo.length > 500 ||
      (versionMinima && !validarVersion(versionMinima))
    ) {
      return NextResponse.json(
        { error: "Revisa las notas, referencia de código o versión mínima." },
        { status: 400 }
      );
    }

    const { data: existente, error: consultaError } = await supabaseAdmin
      .from("renalix_versiones")
      .select("id")
      .eq("version", version)
      .maybeSingle();

    if (consultaError) {
      console.error("Error comprobando versión:", consultaError);
      return NextResponse.json(
        { error: "No se pudo comprobar si la versión ya existe." },
        { status: 500 }
      );
    }

    if (existente) {
      return NextResponse.json(
        { error: "Esa versión ya está registrada." },
        { status: 409 }
      );
    }

    const { data: nuevaVersion, error: insercionError } = await supabaseAdmin
      .from("renalix_versiones")
      .insert({
        version,
        nombre,
        notas_liberacion: notasLiberacion || null,
        version_minima: versionMinima || null,
        referencia_codigo: referenciaCodigo || null,
        estado: "BORRADOR",
        creado_por: acceso.actor.id,
      })
      .select(
        "id, version, nombre, notas_liberacion, estado, version_minima, referencia_codigo, publicada_at, created_at, updated_at"
      )
      .single();

    if (insercionError || !nuevaVersion) {
      console.error("Error creando versión:", insercionError);

      if (insercionError?.code === "23505") {
        return NextResponse.json(
          { error: "Esa versión ya está registrada." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "No se pudo registrar la versión." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Versión registrada como borrador.",
        version: nuevaVersion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST de versiones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al registrar la versión." },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request) {
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

    const id = normalizarTexto(body.id);
    const nuevoEstado = normalizarTexto(body.estado).toUpperCase();
    const uuidValido =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!uuidValido) {
      return NextResponse.json(
        { error: "El identificador de la versión no es válido." },
        { status: 400 }
      );
    }

    if (!["PILOTO", "DISPONIBLE", "RETIRADA"].includes(nuevoEstado)) {
      return NextResponse.json(
        { error: "El nuevo estado solicitado no es válido." },
        { status: 400 }
      );
    }

    const { data: versionActual, error: consultaError } = await supabaseAdmin
      .from("renalix_versiones")
      .select("id, version, estado, publicada_at")
      .eq("id", id)
      .maybeSingle();

    if (consultaError) {
      console.error("Error consultando versión para cambio de estado:", consultaError);
      return NextResponse.json(
        { error: "No se pudo consultar la versión seleccionada." },
        { status: 500 }
      );
    }

    if (!versionActual) {
      return NextResponse.json(
        { error: "La versión seleccionada no existe." },
        { status: 404 }
      );
    }

    const transicionesPermitidas: Record<string, string[]> = {
      BORRADOR: ["PILOTO"],
      PILOTO: ["DISPONIBLE"],
      DISPONIBLE: ["RETIRADA"],
      RETIRADA: [],
    };

    const estadosSiguientes = transicionesPermitidas[versionActual.estado] ?? [];
    if (!estadosSiguientes.includes(nuevoEstado)) {
      return NextResponse.json(
        {
          error: `No se permite cambiar una versión de ${versionActual.estado} a ${nuevoEstado}.`,
          estado_actual: versionActual.estado,
        },
        { status: 409 }
      );
    }

    const cambios: Record<string, unknown> = {
      estado: nuevoEstado,
    };

    if (nuevoEstado === "DISPONIBLE") {
      cambios.publicada_at = new Date().toISOString();
    }

    // Compare-and-set: evita sobrescribir un cambio concurrente de estado.
    const { data: versionActualizada, error: actualizacionError } = await supabaseAdmin
      .from("renalix_versiones")
      .update(cambios)
      .eq("id", id)
      .eq("estado", versionActual.estado)
      .select(
        "id, version, nombre, notas_liberacion, estado, version_minima, referencia_codigo, publicada_at, creado_por, created_at, updated_at"
      )
      .maybeSingle();

    if (actualizacionError) {
      console.error("Error actualizando estado de versión:", actualizacionError);
      return NextResponse.json(
        { error: "No se pudo actualizar el estado de la versión." },
        { status: 500 }
      );
    }

    if (!versionActualizada) {
      return NextResponse.json(
        { error: "La versión cambió mientras se procesaba la solicitud. Actualiza el catálogo e inténtalo nuevamente." },
        { status: 409 }
      );
    }

    const mensajes: Record<string, string> = {
      PILOTO: "La versión pasó a pruebas piloto.",
      DISPONIBLE: "La versión se publicó y ya puede seleccionarse para planificar actualizaciones.",
      RETIRADA: "La versión fue retirada del catálogo disponible.",
    };

    return NextResponse.json({
      success: true,
      message: mensajes[nuevoEstado],
      version: versionActualizada,
    });
  } catch (error) {
    console.error("Error en PATCH de versiones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al cambiar el estado de la versión." },
      { status: 500 }
    );
  }
}
