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

    // 1. Buscar al usuario desde el servidor.
    // La clave service role nunca se envía al navegador.
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

    // 2. Autenticar con Supabase Auth.
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

    // 3. Verificar que Auth y RENALIX correspondan
    // exactamente a la misma cuenta.
    if (
      usuarioDB.auth_user_id !== data.user.id ||
      !usuarioDB.activo
    ) {
      await supabaseAuth.auth.signOut();

      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    // 4. Devolver únicamente los datos necesarios
    // para establecer la sesión y cargar el perfil.
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
      { error: "No se pudo procesar el inicio de sesión." },
      { status: 500 }
    );
  }
}

