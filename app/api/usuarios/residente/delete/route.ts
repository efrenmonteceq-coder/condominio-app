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
        { error: "Solo un administrador activo puede eliminar residentes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const residenteId = String(body.residente_id ?? "").trim();

    if (!residenteId) {
      return NextResponse.json(
        { error: "No se recibió el residente que deseas eliminar." },
        { status: 400 }
      );
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_user_id, condominio_id, rol")
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

    // Guardar los registros vinculados para poder restaurarlos si otra tabla
    // impide borrar el perfil por una relación de clave foránea.
    const { data: fichas, error: fichasError } = await supabaseAdmin
      .from("residentes")
      .select("*")
      .eq("usuario_id", target.id)
      .eq("condominio_id", String(actor.condominio_id));

    if (fichasError) {
      return NextResponse.json(
        { error: "No se pudo comprobar la ficha del residente." },
        { status: 500 }
      );
    }

    const { data: viviendas, error: viviendasError } = await supabaseAdmin
      .from("viviendas")
      .select("id")
      .eq("residente_id", target.id)
      .eq("condominio_id", actor.condominio_id);

    if (viviendasError) {
      return NextResponse.json(
        { error: "No se pudo comprobar la vivienda asignada." },
        { status: 500 }
      );
    }

    // Primero liberar las viviendas vinculadas.
    if (viviendas?.length) {
      const { error: liberarError } = await supabaseAdmin
        .from("viviendas")
        .update({ residente_id: null })
        .eq("residente_id", target.id)
        .eq("condominio_id", actor.condominio_id);

      if (liberarError) {
        return NextResponse.json(
          { error: "No se pudo liberar la vivienda: " + liberarError.message },
          { status: 400 }
        );
      }
    }

    // Después quitar la ficha secundaria del residente.
    if (fichas?.length) {
      const { error: borrarFichaError } = await supabaseAdmin
        .from("residentes")
        .delete()
        .eq("usuario_id", target.id)
        .eq("condominio_id", String(actor.condominio_id));

      if (borrarFichaError) {
        // Intentar restaurar las asignaciones originales.
        if (viviendas?.length) {
          await supabaseAdmin
            .from("viviendas")
            .update({ residente_id: target.id })
            .in("id", viviendas.map((v) => v.id));
        }

        return NextResponse.json(
          { error: "No se pudo eliminar la ficha del residente: " + borrarFichaError.message },
          { status: 400 }
        );
      }
    }

    // El borrado del perfil puede estar impedido por pagos, visitas,
    // asistencias u otros registros históricos relacionados.
    const { error: borrarUsuarioError } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", target.id)
      .eq("condominio_id", actor.condominio_id)
      .eq("rol", "RESIDENTE");

    if (borrarUsuarioError) {
      // Restaurar la ficha y la vivienda para no dejar datos desconectados.
      if (fichas?.length) {
        const { error: restaurarFichaError } = await supabaseAdmin
          .from("residentes")
          .insert(fichas);

        if (restaurarFichaError) {
          console.error("No se pudo restaurar la ficha del residente:", restaurarFichaError);
        }
      }

      if (viviendas?.length) {
        const { error: restaurarViviendaError } = await supabaseAdmin
          .from("viviendas")
          .update({ residente_id: target.id })
          .in("id", viviendas.map((v) => v.id));

        if (restaurarViviendaError) {
          console.error("No se pudo restaurar la vivienda:", restaurarViviendaError);
        }
      }

      return NextResponse.json(
        {
          error:
            "No se eliminó el usuario porque existen registros relacionados. No se confirmó la eliminación; revisa las relaciones de pagos, visitas u otros historiales. Detalle: " +
            borrarUsuarioError.message,
        },
        { status: 409 }
      );
    }

    // El perfil ya se eliminó de la base; ahora quitar la cuenta de Auth.
    if (target.auth_user_id) {
      const { error: borrarAuthError } =
        await supabaseAdmin.auth.admin.deleteUser(target.auth_user_id);

      if (borrarAuthError) {
        console.error("Perfil eliminado, pero no se pudo eliminar la cuenta Auth:", borrarAuthError);
        return NextResponse.json(
          {
            success: true,
            warning:
              "El perfil y la vivienda se actualizaron, pero la cuenta de acceso no se pudo eliminar automáticamente.",
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Residente eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar residente:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al eliminar el residente." },
      { status: 500 }
    );
  }
}
