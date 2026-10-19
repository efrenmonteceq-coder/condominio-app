
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let supabaseAuth:
    | ReturnType<typeof createClient>
    | null = null;

  try {
    const body = await req.json();

    const identificacion =
      typeof body.identificacion === "string"
        ? body.identificacion.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !identificacion ||
      !password ||
      identificacion.length > 30 ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 400 }
      );
    }

    // 1. Buscar el usuario en RENALIX.
    const { data: usuarioDB, error: errorUsuario } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id, auth_user_id, nombre, apellido, email, identificacion, rol, cargo_directiva, condominio_id, password_temporal, activo"
        )
        .eq("identificacion", identificacion)
        .maybeSingle();

    if (
      errorUsuario ||
      !usuarioDB ||
      !usuarioDB.email ||
      !usuarioDB.auth_user_id ||
      usuarioDB.activo !== true
    ) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    // 2. Comprobar la habilitación de residentes ANTES
    // de autenticar sus credenciales en Supabase Auth.
    const rol = String(usuarioDB.rol ?? "")
      .toUpperCase()
      .trim();

    if (rol === "RESIDENTE") {
      if (!usuarioDB.condominio_id) {
        return NextResponse.json(
          {
            error:
              "Tu acceso no está habilitado. Comunícate con el administrador.",
          },
          { status: 403 }
        );
      }

      const { data: ficha, error: errorFicha } =
        await supabaseAdmin
          .from("residentes")
          .select("paga_alicuota, estado")
          .eq("usuario_id", usuarioDB.id)
          .eq(
            "condominio_id",
            String(usuarioDB.condominio_id)
          )
          .maybeSingle();

      // Si falta la ficha, hay un error o existen varias
      // coincidencias, se deniega el acceso por seguridad.
      if (
        errorFicha ||
        !ficha ||
        ficha.paga_alicuota !== true ||
        String(ficha.estado ?? "")
          .toUpperCase()
          .trim() !== "ACTIVO"
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

    // 3. Autenticar con Supabase Auth.
    // Esta instancia no persiste sesiones en el servidor.
    supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const {
      data,
      error: errorAuth,
    } = await supabaseAuth.auth.signInWithPassword({
      email: usuarioDB.email,
      password,
    });

    if (
      errorAuth ||
      !data.user ||
      !data.session
    ) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    // 4. Confirmar que Supabase Auth y RENALIX
    // corresponden exactamente a la misma cuenta.
    if (
      usuarioDB.auth_user_id !== data.user.id ||
      usuarioDB.activo !== true
    ) {
      await supabaseAuth.auth.signOut();

      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    // 5. Devolver los datos necesarios para la sesión.
    return NextResponse.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      usuario: {
        id: usuarioDB.id,
        nombre: usuarioDB.nombre,
        apellido: usuarioDB.apellido,
        email: usuarioDB.email,
        identificacion: usuarioDB.identificacion,
        rol: usuarioDB.rol,
        cargo_directiva: usuarioDB.cargo_directiva,
        condominio_id: usuarioDB.condominio_id,
        password_temporal: usuarioDB.password_temporal,
      },
    });
  } catch (error) {
    console.error(
      "Error en login por identificación:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo procesar el inicio de sesión.",
      },
      { status: 500 }
    );
  }
}
