import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(req: Request) {
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
      .eq("activo", true)
      .maybeSingle();

    if (
      actorError ||
      !actor ||
      String(actor.rol ?? "").toUpperCase().trim() !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Solo un SUPER_ADMIN activo puede editar administradores." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const usuarioId = String(body.usuario_id ?? "").trim();
    const nombre = String(body.nombre ?? "").trim();
    const apellido = String(body.apellido ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telefono = String(body.telefono ?? "").trim();
    const identificacion = String(body.identificacion ?? "").trim();
    const condominioId = String(body.condominio_id ?? "").trim();
    const puedeVotar = body.puede_votar;

    if (!usuarioId || !nombre || !apellido || !email || !telefono || !identificacion || !condominioId) {
      return NextResponse.json(
        { error: "Completa todos los campos del administrador." },
        { status: 400 }
      );
    }

    if (typeof puedeVotar !== "boolean") {
      return NextResponse.json(
        { error: "Indica si el administrador puede votar." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_user_id, email, condominio_id, rol, activo")
      .eq("id", usuarioId)
      .eq("rol", "ADMIN")
      .maybeSingle();

    if (targetError || !target) {
      return NextResponse.json(
        { error: "No se encontró el administrador seleccionado." },
        { status: 404 }
      );
    }

    if (target.activo === false) {
      return NextResponse.json(
        { error: "No se puede editar un administrador inactivo. Reactívalo primero." },
        { status: 409 }
      );
    }

    const { data: condominio, error: condominioError } = await supabaseAdmin
      .from("condominios")
      .select("id")
      .eq("id", condominioId)
      .maybeSingle();

    if (condominioError || !condominio) {
      return NextResponse.json(
        { error: "La urbanización seleccionada no existe." },
        { status: 400 }
      );
    }

    const correoAnterior = String(target.email ?? "").toLowerCase();
    let authEmailActualizado = false;

    if (target.auth_user_id && correoAnterior !== email) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, {
          email,
          email_confirm: true,
        });

      if (authUpdateError) {
        return NextResponse.json(
          { error: authUpdateError.message || "No se pudo actualizar el correo de acceso." },
          { status: 400 }
        );
      }
      authEmailActualizado = true;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({
        nombre,
        apellido,
        email,
        telefono,
        identificacion,
        condominio_id: condominioId,
        puede_votar: puedeVotar,
      })
      .eq("id", target.id)
      .eq("rol", "ADMIN")
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      if (authEmailActualizado && target.auth_user_id && correoAnterior) {
        const { error: rollbackError } =
          await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, {
            email: correoAnterior,
            email_confirm: true,
          });
        if (rollbackError) {
          console.error("No se pudo restaurar el correo anterior en Auth:", rollbackError);
        }
      }

      return NextResponse.json(
        { error: updateError?.message || "No se pudo actualizar el administrador." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Administrador actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar administrador:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al actualizar el administrador." },
      { status: 500 }
    );
  }
}
