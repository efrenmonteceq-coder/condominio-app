import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CARGOS_DIRECTIVA = [
  "PRESIDENTE",
  "VICEPRESIDENTE",
  "SECRETARIO",
  "VOCAL",
] as const;

export async function POST(req: Request) {
  let authUserId: string | null = null;
  let usuarioId: string | null = null;
  let residenteId: string | null = null;
  let viviendaAsignadaId: string | null = null;

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
      .select("id, rol, condominio_id, activo")
      .eq("auth_user_id", authData.user.id)
      .eq("activo", true)
      .maybeSingle();

    if (actorError || !actor) {
      return NextResponse.json(
        { error: "No se encontró un perfil activo para esta sesión." },
        { status: 403 }
      );
    }

    const actorRol = String(actor.rol ?? "").toUpperCase().trim();
    const body = await req.json();

    const identificacion = String(body.identificacion ?? "").trim();
    const nombres = String(body.nombres ?? "").trim();
    const apellidos = String(body.apellidos ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telefono = String(body.telefono ?? "").trim();
    const rol = String(body.rol ?? "").trim().toUpperCase();
    const viviendaId = body.vivienda_id ? String(body.vivienda_id) : null;
    const tiposResidente = ["PROPIETARIO", "INQUILINO", "FAMILIAR", "OTRO_OCUPANTE"] as const;
    const tipoResidente = String(body.tipo_residente ?? "PROPIETARIO").trim().toUpperCase();
    const pagaAlicuota = body.paga_alicuota === true;

    if (!identificacion || !nombres || !apellidos || !email) {
      return NextResponse.json(
        { error: "Completa identificación, nombres, apellidos y correo." },
        { status: 400 }
      );
    }

    // ADMIN puede crear RESIDENTE, GUARDIA y DIRECTIVA solo en su condominio.
    // SUPER_ADMIN puede crear ADMIN para el condominio seleccionado.
    let condominioId: string | null = null;

    if (actorRol === "ADMIN") {
      if (!actor.condominio_id) {
        return NextResponse.json(
          { error: "El administrador no tiene un condominio asignado." },
          { status: 403 }
        );
      }

      if (!["RESIDENTE", "GUARDIA", "DIRECTIVA"].includes(rol)) {
        return NextResponse.json(
          { error: "Un administrador solo puede crear residentes, guardias o directiva." },
          { status: 403 }
        );
      }

      condominioId = String(actor.condominio_id);
    } else if (actorRol === "SUPER_ADMIN") {
      if (rol !== "ADMIN") {
        return NextResponse.json(
          { error: "SUPER_ADMIN solo puede crear administradores desde esta ruta." },
          { status: 403 }
        );
      }

      condominioId = body.condominio_id ? String(body.condominio_id) : null;

      if (!condominioId) {
        return NextResponse.json(
          { error: "Selecciona el condominio para el administrador." },
          { status: 400 }
        );
      }

      const { data: condominio, error: condominioError } = await supabaseAdmin
        .from("condominios")
        .select("id")
        .eq("id", condominioId)
        .maybeSingle();

      if (condominioError || !condominio) {
        return NextResponse.json(
          { error: "El condominio seleccionado no existe." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "No tienes permisos para crear usuarios." },
        { status: 403 }
      );
    }

    const cargoDirectiva = String(body.cargo_directiva ?? "")
      .trim()
      .toUpperCase();

    if (
      rol === "DIRECTIVA" &&
      !CARGOS_DIRECTIVA.includes(
        cargoDirectiva as (typeof CARGOS_DIRECTIVA)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Selecciona un cargo válido para la directiva." },
        { status: 400 }
      );
    }

    if (rol === "RESIDENTE") {
      if (!tiposResidente.includes(tipoResidente as (typeof tiposResidente)[number])) {
        return NextResponse.json(
          { error: "Selecciona un tipo de ocupante válido." },
          { status: 400 }
        );
      }

      if (!viviendaId) {
        return NextResponse.json(
          { error: "Selecciona una vivienda para el residente." },
          { status: 400 }
        );
      }

      const { data: vivienda, error: viviendaError } = await supabaseAdmin
        .from("viviendas")
        .select("id, residente_id")
        .eq("id", viviendaId)
        .eq("condominio_id", condominioId)
        .maybeSingle();

      if (viviendaError || !vivienda) {
        return NextResponse.json(
          { error: "La vivienda no pertenece a tu condominio." },
          { status: 403 }
        );
      }

    }

    const { data: createdAuth, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: identificacion,
        email_confirm: true,
        user_metadata: { rol, identificacion },
      });

    if (createAuthError || !createdAuth.user) {
      return NextResponse.json(
        { error: createAuthError?.message ?? "No se pudo crear la cuenta." },
        { status: 400 }
      );
    }

    authUserId = createdAuth.user.id;

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        auth_user_id: authUserId,
        identificacion,
        nombre: nombres,
        apellido: apellidos,
        email,
        telefono,
        rol,
        condominio_id: condominioId,
        activo: true,
        password_temporal: true,
        puede_votar: rol === "DIRECTIVA" ? Boolean(body.puede_votar) : false,
        cargo_directiva: rol === "DIRECTIVA" ? cargoDirectiva : null,
      })
      .select("id")
      .single();

    if (perfilError || !perfil) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      authUserId = null;

      return NextResponse.json(
        { error: perfilError?.message ?? "No se pudo guardar el perfil." },
        { status: 400 }
      );
    }

    usuarioId = perfil.id;

    if (rol === "RESIDENTE" && viviendaId) {
      const { data: residente, error: residenteError } = await supabaseAdmin
        .from("residentes")
        .insert({
          nombre: `${nombres} ${apellidos}`,
          identificacion,
          telefono,
          email,
          tipo: tipoResidente,
          paga_alicuota: pagaAlicuota,
          estado: "ACTIVO",
          fecha_ingreso: new Date().toISOString().slice(0, 10),
          vivienda_id: viviendaId,
          condominio_id: condominioId,
          usuario_id: usuarioId,
        })
        .select("id")
        .single();

      if (residenteError || !residente) {
        await supabaseAdmin.from("usuarios").delete().eq("id", usuarioId);
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        usuarioId = null;
        authUserId = null;

        return NextResponse.json(
          { error: residenteError?.message ?? "No se pudo crear la ficha del residente." },
          { status: 400 }
        );
      }

      residenteId = residente.id;

      // viviendas.residente_id es una referencia histórica a un solo usuario.
      // La relación real de múltiples ocupantes se guarda en residentes.vivienda_id.
      // Solo completar la referencia histórica si todavía está vacía; no bloquear
      // la creación de otros residentes en la misma vivienda.
      const { data: viviendaActualizada, error: viviendaUpdateError } =
        await supabaseAdmin
          .from("viviendas")
          .update({ residente_id: usuarioId })
          .eq("id", viviendaId)
          .eq("condominio_id", condominioId)
          .is("residente_id", null)
          .select("id")
          .maybeSingle();

      if (viviendaUpdateError) {
        console.error("No se pudo actualizar la referencia histórica de vivienda:", viviendaUpdateError);
      } else if (viviendaActualizada) {
        viviendaAsignadaId = viviendaId;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Usuario creado correctamente.",
      usuario_id: usuarioId,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    if (viviendaAsignadaId && usuarioId) {
      await supabaseAdmin
        .from("viviendas")
        .update({ residente_id: null })
        .eq("id", viviendaAsignadaId)
        .eq("residente_id", usuarioId);
    }

    if (residenteId) {
      await supabaseAdmin.from("residentes").delete().eq("id", residenteId);
    }

    if (usuarioId) {
      await supabaseAdmin.from("usuarios").delete().eq("id", usuarioId);
    }

    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }

    return NextResponse.json(
      { error: "Ocurrió un error interno al crear el usuario." },
      { status: 500 }
    );
  }
}
