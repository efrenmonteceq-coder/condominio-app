"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const [identificacion, setIdentificacion] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    // VALIDAR CAMPOS

    if (!identificacion || !password) {

      alert("Completa todos los campos");

      return;
    }

    setLoading(true);

    // 🔥 BUSCAR USUARIO POR IDENTIFICACIÓN

    const {
      data: usuarioDB,
      error: errorUsuario,
    } = await supabase
      .from("usuarios")
      .select("*")
      .eq(
        "identificacion",
        identificacion.trim()
      )
      .single();

    // USUARIO NO EXISTE

    if (
      errorUsuario ||
      !usuarioDB
    ) {

      alert("Usuario no encontrado");

      setLoading(false);

      return;
    }

    // 🔥 LOGIN REAL EN AUTH

    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({

      email: usuarioDB.email,

      password,

    });

    // PASSWORD INCORRECTO

    if (error) {

      console.error(
        "LOGIN ERROR:",
        error.message
      );

      alert(
        "Contraseña incorrecta"
      );

      setLoading(false);

      return;
    }

    // 🔥 OBJETO USUARIO

    const usuario = {

       id: usuarioDB.id,

      nombre:
        usuarioDB.nombre,

      apellido:
        usuarioDB.apellido,

      email:
        usuarioDB.email,

      identificacion:
        usuarioDB.identificacion,

      rol:
        usuarioDB.rol,

        cargo_directiva:
  usuarioDB.cargo_directiva,

      condominio_id:
        usuarioDB.condominio_id,

      password_temporal:
        usuarioDB.password_temporal,

    };

    // 🔥 LIMPIAR SESIÓN ANTERIOR

    localStorage.removeItem(
      "usuario"
    );

    // 🔥 GUARDAR NUEVO USUARIO

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );


    // 🔥 PASSWORD TEMPORAL

    if (
      usuario.password_temporal === true
    ) {

      window.location.href =
        "/cambiar-password";

      return;
    }

    // 🔥 REDIRECCIONES

if (
  usuario.rol ===
  "SUPER_ADMIN"
) {

  window.location.href =
    "/superadmin";

} else if (

  usuario.rol ===
  "TECNICO"

) {

  window.location.href =
    "/panel-tecnico";

} else {

  window.location.href =
    "/dashboard";
}
 
  };

  return (

    <main
      style={{
        display: "flex",
        justifyContent:
          "center",
        alignItems: "center",
        height: "100vh",
        background: "#f4f4f4",
      }}
    >

      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 10,
          width: 320,
          boxShadow:
            "0 0 10px rgba(0,0,0,0.1)",
        }}
      >

        <h2
          style={{
            textAlign: "center",
          }}
        >
          Iniciar Sesión
        </h2>

        {/* IDENTIFICACIÓN */}

        <input
          type="text"
          placeholder="Número de identificación"
          value={
            identificacion
          }
          onChange={(e) =>
            setIdentificacion(
              e.target.value
            )
          }
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 8,
          }}
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: "100%",
            marginBottom: 15,
            padding: 8,
          }}
        />

        {/* BOTÓN */}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background:
              "#0070f3",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >

          {loading
            ? "Ingresando..."
            : "Ingresar"}

        </button>

        {/* RECUPERAR PASSWORD */}

        <p
          style={{
            marginTop: 15,
            textAlign: "center",
          }}
        >

          <a
            href="/reset-password"
            style={{
              color: "#0070f3",
              textDecoration:
                "none",
            }}
          >
            ¿Olvidó su contraseña?
          </a>

        </p>

      </div>

    </main>

  );

}