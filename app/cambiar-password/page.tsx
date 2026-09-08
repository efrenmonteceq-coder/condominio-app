"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CambiarPassword() {
  const [password, setPassword] =
    useState("");

  const [confirmar, setConfirmar] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleCambiarPassword =
    async () => {
      if (
        !password ||
        !confirmar
      ) {
        alert(
          "Completa todos los campos"
        );

        return;
      }

      if (
        password !== confirmar
      ) {
        alert(
          "Las contraseñas no coinciden"
        );

        return;
      }

      if (
        password.length < 4
      ) {
        alert(
          "La contraseña es muy corta"
        );

        return;
      }

      setLoading(true);

      // 🔥 VALIDAR SESIÓN
      const {
        data: sessionData,
      } =
        await supabase.auth.getSession();

      if (
        !sessionData.session
      ) {
        alert(
          "Sesión inválida"
        );

        window.location.href =
          "/login";

        return;
      }

      // 🔥 CAMBIAR PASSWORD
      const { error } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      if (error) {
        console.error(
          "ERROR PASSWORD:",
          error.message
        );

        alert(
          "Error cambiando contraseña: " +
            error.message
        );

        setLoading(false);

        return;
      }

      // 🔥 USUARIO LOCAL
      const data =
        localStorage.getItem(
          "usuario"
        );

      // 🔥 SI EXISTE LOGIN LOCAL
      if (data) {
        const usuario =
          JSON.parse(data);

        // 🔥 ACTUALIZAR PASSWORD TEMPORAL
        await supabase
          .from("usuarios")
          .update({
            password_temporal:
              false,
          })
          .eq(
            "identificacion",
            usuario.identificacion
          );

        alert(
          "Contraseña actualizada correctamente"
        );

        // 🔥 REDIRECCIÓN
        if (
          usuario.rol ===
          "SUPER_ADMIN"
        ) {
          window.location.href =
            "/superadmin";
        } else {
          window.location.href =
            "/dashboard";
        }

        return;
      }

      // 🔥 RECOVERY EMAIL
      alert(
        "Contraseña recuperada correctamente"
      );

      window.location.href =
        "/login";
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
          width: 350,
          boxShadow:
            "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
          }}
        >
          Recuperar Contraseña
        </h2>

        <p>
          Ingrese su nueva
          contraseña.
        </p>

        {/* 🔥 PASSWORD */}
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 10,
          }}
        />

        {/* 🔥 CONFIRMAR */}
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) =>
            setConfirmar(
              e.target.value
            )
          }
          style={{
            width: "100%",
            marginBottom: 15,
            padding: 10,
          }}
        />

        {/* 🔥 BOTÓN */}
        <button
          onClick={
            handleCambiarPassword
          }
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
            ? "Actualizando..."
            : "Actualizar contraseña"}
        </button>
      </div>
    </main>
  );
}