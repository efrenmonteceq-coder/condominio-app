import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

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
        { error: "La sesión ha expirado." },
        { status: 401 }
      );
    }

    const { data: usuario, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id, auth_user_id, nombre, apellido, email, identificacion, rol, cargo_directiva, condominio_id, password_temporal, activo"
        )
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

    if (usuarioError) {
      console.error("Error consultando usuario para validar sesión:", usuarioError);
      return NextResponse.json(
        { error: "No se pudo comprobar el estado de la cuenta." },
        { status: 500 }
      );
    }

    if (!usuario || usuario.activo !== true) {
      return NextResponse.json(
        { error: "La cuenta no está activa." },
        { status: 403 }
      );
    }

    const rol = String(usuario.rol ?? "").toUpperCase().trim();

    if (rol === "RESIDENTE") {
      if (!usuario.condominio_id) {
        return NextResponse.json(
          { error: "El acceso del residente no está habilitado." },
          { status: 403 }
        );
      }

      const { data: ficha, error: fichaError } =
        await supabaseAdmin
          .from("residentes")
          .select("paga_alicuota, estado")
          .eq("usuario_id", usuario.id)
          .eq("condominio_id", String(usuario.condominio_id))
          .maybeSingle();

      if (fichaError) {
        console.error("Error consultando ficha del residente:", fichaError);
        return NextResponse.json(
          { error: "No se pudo comprobar la habilitación del residente." },
          { status: 500 }
        );
      }

      if (
        !ficha ||
        ficha.paga_alicuota !== true ||
        String(ficha.estado ?? "").toUpperCase().trim() !== "ACTIVO"
      ) {
        return NextResponse.json(
          {
            error:
              "Tu acceso no está habilitado. Comunícate con el administrador.",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        identificacion: usuario.identificacion,
        rol: usuario.rol,
        cargo_directiva: usuario.cargo_directiva,
        condominio_id: usuario.condominio_id,
        password_temporal: usuario.password_temporal,
      },
    });
  } catch (error) {
    console.error("Error validando sesión:", error);
    return NextResponse.json(
      { error: "No se pudo validar la sesión." },
      { status: 500 }
    );
  }
}
