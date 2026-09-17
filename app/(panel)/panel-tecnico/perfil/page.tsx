"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 4px 14px rgba(15,23,42,.06)",
};

function IconoPerfil() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
    </svg>
  );
}

export default function PerfilTecnico() {
  const [tecnico, setTecnico] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const identificacion = usuario?.identificacion;

    if (!identificacion) {
      setCargando(false);
      return;
    }

    const { data: tecnicoDB } = await supabase
      .from("tecnicos")
      .select("*")
      .eq("cedula", identificacion)
      .single();

    if (!tecnicoDB) {
      setCargando(false);
      return;
    }

    setTecnico(tecnicoDB);
    setCargando(false);
  };

  useEffect(() => {
    cargar();

    const interval = setInterval(cargar, 3000);
    return () => clearInterval(interval);
  }, []);

  if (cargando) return <p style={{ padding: 30 }}>Cargando...</p>;
  if (!tecnico) return <p style={{ padding: 30 }}>No autorizado</p>;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "30px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 14,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            Ecosistema de Servicios
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <IconoPerfil />
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                color: "#0f172a",
              }}
            >
              Mi Perfil
            </h1>
          </div>

          <p
            style={{
              margin: "7px 0 0",
              color: "#64748b",
            }}
          >
            Información de tu perfil profesional.
          </p>
        </div>

        <div style={{ ...card, marginBottom: 18 }}>
          <h2
            style={{
              marginTop: 0,
              color: "#0f172a",
              fontSize: 20,
            }}
          >
            Datos del profesional
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 14,
              marginTop: 18,
            }}
          >
            <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Nombre</div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{tecnico.nombre || "-"}</div>
            </div>

            <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Cédula</div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{tecnico.cedula || "-"}</div>
            </div>

            <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Teléfono</div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{tecnico.telefono || "-"}</div>
            </div>

            <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 15 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Dirección</div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{tecnico.direccion || "-"}</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ marginTop: 0, color: "#0f172a", fontSize: 20 }}>
            Servicios que presto
          </h2>

          <div
            style={{
              marginTop: 14,
              padding: 15,
              borderRadius: 14,
              border: "1px solid #eef2f7",
              color: "#334155",
              lineHeight: 1.6,
            }}
          >
            {tecnico.especialidad || "No registrada"}
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <Link
            href="/panel-tecnico"
            style={{
              textDecoration: "none",
              color: "#2563eb",
              fontWeight: 700,
            }}
          >
            ← Volver al Panel Técnico
          </Link>
        </div>
      </div>
    </main>
  );
}
