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
    if (!identificacion.trim() || !password) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      // 1. Buscar y validar la cuenta desde el servidor.
      const response = await fetch(
        "/api/auth/login-identificacion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identificacion: identificacion.trim(),
            password,
          }),
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        alert(resultado.error || "No se pudo iniciar sesión.");
        return;
      }

      const { session, usuario } = resultado;

      if (
        !session?.access_token ||
        !session?.refresh_token ||
        !usuario?.id ||
        !usuario?.rol
      ) {
        alert("La respuesta de inicio de sesión no es válida.");
        return;
      }

      // 2. Establecer la sesión oficial de Supabase en el navegador.
      const { error: errorSesion } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (errorSesion) {
        console.error(
          "Error estableciendo sesión:",
          errorSesion.message
        );
        alert("No se pudo establecer la sesión. Intenta nuevamente.");
        return;
      }

      // 3. Guardar el perfil utilizado por la interfaz de RENALIX.
      localStorage.removeItem("usuario");
      localStorage.setItem("usuario", JSON.stringify(usuario));

      // 4. Conservar el flujo de contraseña temporal y las redirecciones.
      if (usuario.password_temporal === true) {
        window.location.href = "/cambiar-password";
        return;
      }

      if (usuario.rol === "SUPER_ADMIN") {
        window.location.href = "/superadmin";
      } else if (usuario.rol === "TECNICO") {
        window.location.href = "/panel-tecnico";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      alert("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(15,23,42,.72), rgba(37,99,235,.55)), url('/branding/renalix-login-bg.jpg') center/cover no-repeat",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(15,23,42,.12), rgba(15,23,42,.48))",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(430px, 100%)",
          background: "rgba(255,255,255,.97)",
          borderRadius: 24,
          padding: "30px",
          boxShadow: "0 24px 70px rgba(15,23,42,.30)",
          border: "1px solid rgba(255,255,255,.65)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <img
            src="/branding/renalix-horizontal.png"
            alt="RENALIX"
            style={{
              width: "min(270px, 82%)",
              maxHeight: 125,
              objectFit: "contain",
              display: "block",
              margin: "0 auto 10px",
            }}
          />

          <div
            style={{
              color: "#334155",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            TU URBANIZACIÓN EN ORDEN
          </div>

          <div
            style={{
              marginTop: 6,
              color: "#64748b",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Administración · Comunidad · Seguridad
          </div>
        </div>

        <h2
          style={{
            textAlign: "center",
            margin: "0 0 20px",
            color: "#0f172a",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          Iniciar Sesión
        </h2>

        {/* IDENTIFICACIÓN */}

        <input
          type="text"
          placeholder="Usuario"
          autoComplete="new-password"
          value={identificacion}
          onChange={(e) =>
            setIdentificacion(e.target.value)
          }
          style={{
            width: "100%",
            marginBottom: 12,
            padding: "13px 14px",
            boxSizing: "border-box",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            outline: "none",
            fontSize: 15,
            background: "#fff",
          }}
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            marginBottom: 16,
            padding: "13px 14px",
            boxSizing: "border-box",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            outline: "none",
            fontSize: 15,
            background: "#fff",
          }}
        />

        {/* BOTÓN */}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 16px",
            background:
              "linear-gradient(135deg,#2563eb,#1d4ed8)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            cursor: loading ? "wait" : "pointer",
            fontWeight: 800,
            fontSize: 15,
            boxShadow: "0 8px 20px rgba(37,99,235,.25)",
          }}
        >
          {loading
            ? "Ingresando..."
            : "Ingresar"}
        </button>

        {/* RECUPERAR PASSWORD */}

        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
            textAlign: "center",
          }}
        >
          <a
            href="/reset-password"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ¿Olvidó su contraseña?
          </a>
        </p>
      </div>
    </main>
  );
}
