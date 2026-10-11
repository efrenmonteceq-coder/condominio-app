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
      .select("id, rol, condominio_id, activo")
      .eq("auth_user_id", authData.user.id)
      .eq("activo", true)
      .maybeSingle();

    if (
      actorError ||
      !actor ||
      String(actor.rol ?? "").toUpperCase().trim() !== "ADMIN" ||
      !actor.condominio_id
    ) {
      return NextResponse.json(
        { error: "Solo un administrador activo puede editar residentes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const residenteId = String(body.residente_id ?? "").trim();
    const nombre = String(body.nombre ?? "").trim();
    const apellido = String(body.apellido ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telefono = String(body.telefono ?? "").trim();
    const identificacion = String(body.identificacion ?? "").trim();

    if (
      !residenteId ||
      !nombre ||
      !apellido ||
      !email ||
      !identificacion
    ) {
      return NextResponse.json(
        { error: "Completa nombre, apellido, correo e identificación." },
        { status: 400 }
      );
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_user_id, email, condominio_id, rol")
      .eq("id", residenteId)
      .eq("condominio_id", actor.condominio_id)
      .eq("rol", "RESIDENTE")
      .maybeSingle();

    if (targetError || !target) {
      return NextResponse.json(
        { error: "No se encontró ese residente en tu condominio." },
        { status: 404 }
      );
    }

    // Actualizar el correo de autenticación también, para que coincida
    // con el correo que aparece en el perfil.
    if (target.auth_user_id && target.email?.toLowerCase() !== email) {
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
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({
        nombre,
        apellido,
        email,
        telefono,
        identificacion,
      })
      .eq("id", target.id)
      .eq("condominio_id", actor.condominio_id)
      .eq("rol", "RESIDENTE")
      .select("id")
      .maybeSingle();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: updateError?.message || "No se pudo guardar el perfil del residente." },
        { status: 400 }
      );
    }

    // Mantener sincronizada la ficha de residentes vinculada al usuario.
    const { error: residentUpdateError } = await supabaseAdmin
      .from("residentes")
      .update({
        nombre: `${nombre} ${apellido}`,
        email,
        telefono,
        identificacion,
      })
      .eq("usuario_id", target.id)
      .eq("condominio_id", String(actor.condominio_id));

    if (residentUpdateError) {
      console.error("Perfil actualizado, pero falló la sincronización de residentes:", residentUpdateError);
      return NextResponse.json(
        {
          success: true,
          warning: "El perfil se actualizó, pero no se pudo sincronizar la ficha del residente.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Residente actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar residente:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al actualizar el residente." },
      { status: 500 }
    );
  }
}
