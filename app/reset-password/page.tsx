"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const enviarRecuperacion =
    async () => {
      if (!email) {
        alert(
          "Ingrese su correo"
        );

        return;
      }

      setLoading(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              "http://localhost:3000/cambiar-password",
          }
        );

      if (error) {
        console.error(
          "ERROR RESET:",
          error.message
        );

        alert(
          "Error enviando recuperación"
        );

        setLoading(false);

        return;
      }

      alert(
        "Se envió un enlace de recuperación a su correo"
      );

      setLoading(false);
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
          Ingrese su correo
          electrónico para
          recuperar su
          contraseña.
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 15,
          }}
        />

        <button
          onClick={
            enviarRecuperacion
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
            ? "Enviando..."
            : "Enviar recuperación"}
        </button>
      </div>
    </main>
  );
}