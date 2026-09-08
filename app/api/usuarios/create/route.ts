import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      identificacion,
      nombres,
      apellidos,
      email,
      telefono,
      rol,
      condominio_id,
      vivienda_id,
      cargo_directiva,
      puede_votar,
    } = body;

    // ==========================================
    // VALIDACIÓN DIRECTIVA
    // ==========================================

    if (rol === "DIRECTIVA") {
      const cargosPermitidos = [
        "PRESIDENTE",
        "VICEPRESIDENTE",
        "SECRETARIO",
        "VOCAL",
      ];

      if (!cargo_directiva) {
        return NextResponse.json(
          {
            error:
              "Debe seleccionar el cargo de la Directiva.",
          },
          { status: 400 }
        );
      }

      if (
        !cargosPermitidos.includes(
          cargo_directiva
        )
      ) {
        return NextResponse.json(
          {
            error:
              "El cargo de Directiva no es válido.",
          },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // CREAR USUARIO AUTH
    // ==========================================

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,

        password: identificacion,

        email_confirm: true,

        user_metadata: {
          rol,
          identificacion,
        },
      });

    // ==========================================
    // ERROR AUTH
    // ==========================================

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // UUID AUTH
    // ==========================================

    const authUserId =
      data.user.id;

    // ==========================================
    // INSERTAR TABLA USUARIOS
    // ==========================================

    const { error: dbError } =
      await supabaseAdmin
        .from("usuarios")
        .insert({
          auth_user_id:
            authUserId,

          identificacion,

          nombre:
            nombres,

          apellido:
            apellidos,

          email,

          telefono,

          rol,

          condominio_id,

          activo: true,

          password_temporal: true,

          puede_votar:
            rol === "ADMIN" || rol === "DIRECTIVA"
              ? Boolean(puede_votar)
              : false,

          // DIRECTIVA
          cargo_directiva:
            rol === "DIRECTIVA"
              ? cargo_directiva
              : null,
        });

    // ==========================================
    // SI FALLA DB
    // ELIMINAR AUTH
    // ==========================================

    if (dbError) {
      await supabaseAdmin
        .auth
        .admin
        .deleteUser(
          authUserId
        );

      return NextResponse.json(
        {
          error:
            dbError.message,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CREAR RESIDENTE
    // ==========================================

    if (rol === "RESIDENTE") {
      const {
        error: residenteError,
      } =
        await supabaseAdmin
          .from("residentes")
          .insert({
            nombre:
              `${nombres} ${apellidos}`,

            identificacion,

            telefono,

            email,

            tipo: "PROPIETARIO",

            estado: "ACTIVO",

            fecha_ingreso:
              new Date(),

            vivienda_id,

            condominio_id,
          });

      if (residenteError) {
        console.error(
          "ERROR COMPLETO RESIDENTE:",
          JSON.stringify(
            residenteError,
            null,
            2
          )
        );

        // Eliminar usuario Auth
        await supabaseAdmin
          .auth
          .admin
          .deleteUser(
            authUserId
          );

        // Eliminar usuario DB
        await supabaseAdmin
          .from("usuarios")
          .delete()
          .eq(
            "id",
            authUserId
          );

        return NextResponse.json(
          {
            error:
              residenteError.message,
          },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // RESPUESTA
    // ==========================================

    return NextResponse.json({
      success: true,

      message:
        "Usuario creado correctamente",
    });

  } catch (error) {
    console.error(
      "ERROR API CREAR USUARIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}