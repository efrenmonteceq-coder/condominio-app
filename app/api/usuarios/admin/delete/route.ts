import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(req: Request) {
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
        { error: "Solo un SUPER_ADMIN activo puede desactivar administradores." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const usuarioId = String(body.usuario_id ?? "").trim();
    if (!usuarioId) {
      return NextResponse.json(
        { error: "No se recibió el administrador que deseas desactivar." },
        { status: 400 }
      );
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_user_id, rol, activo")
      .eq("id", usuarioId)
      .eq("rol", "ADMIN")
      .maybeSingle();

    if (targetError || !target) {
      return NextResponse.json(
        { error: "No se encontró el administrador seleccionado." },
        { status: 404 }
      );
    }

    if (target.id === actor.id) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propia cuenta SUPER_ADMIN." },
        { status: 400 }
      );
    }

    if (target.activo === false) {
      return NextResponse.json({
        success: true,
        message: "El administrador ya se encontraba inactivo.",
      });
    }

    // Se conserva el perfil y su historial. Primero se desactiva el perfil;
    // si el bloqueo de Auth falla, se revierte el estado del perfil.
    const { error: deactivateError } = await supabaseAdmin
      .from("usuarios")
      .update({ activo: false })
      .eq("id", target.id)
      .eq("rol", "ADMIN");

    if (deactivateError) {
      return NextResponse.json(
        { error: deactivateError.message || "No se pudo desactivar el administrador." },
        { status: 400 }
      );
    }

    if (target.auth_user_id) {
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        target.auth_user_id,
        { ban_duration: "876000h" }
      );

      if (banError) {
        const { error: rollbackError } = await supabaseAdmin
          .from("usuarios")
          .update({ activo: true })
          .eq("id", target.id)
          .eq("rol", "ADMIN");

        if (rollbackError) {
          console.error("No se pudo revertir la desactivación:", rollbackError);
        }

        return NextResponse.json(
          { error: banError.message || "No se pudo bloquear el acceso del administrador." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Administrador desactivado. Su historial y sus registros se conservaron.",
    });
  } catch (error) {
    console.error("Error al desactivar administrador:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al desactivar el administrador." },
      { status: 500 }
    );
  }
}
