"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function NuevaSesionPage() {
  const router = useRouter();
  const { usuario, loading } = useAuth();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [lugar, setLugar] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const rol = (usuario?.rol || "").toUpperCase().trim();

  const cargo = (
    usuario?.cargo_directiva || ""
  )
    .toUpperCase()
    .trim();

  const puedeCrear =
    rol === "ADMIN" ||
    (rol === "DIRECTIVA" &&
      cargo === "PRESIDENTE");

  const guardarSesion = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!usuario?.id) {
      setError(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    if (!usuario?.condominio_id) {
      setError(
        "No se pudo identificar el condominio."
      );
      return;
    }

    if (!titulo.trim()) {
      setError(
        "Ingrese el título de la sesión."
      );
      return;
    }

    if (!fecha) {
      setError(
        "Seleccione la fecha de la sesión."
      );
      return;
    }

    if (!horaInicio) {
      setError(
        "Seleccione la hora de inicio."
      );
      return;
    }

    if (!lugar.trim()) {
      setError(
        "Ingrese el lugar de la sesión."
      );
      return;
    }

    if (
      horaFin &&
      horaFin <= horaInicio
    ) {
      setError(
        "La hora de finalización debe ser posterior a la hora de inicio."
      );
      return;
    }

    setGuardando(true);

    const { data, error } = await supabase
      .from("sesiones")
      .insert({
        condominio_id:
          usuario.condominio_id,

        titulo: titulo.trim(),

        descripcion:
          descripcion.trim() || null,

        fecha,

        hora_inicio: horaInicio,

        hora_fin:
          horaFin || null,

        lugar: lugar.trim(),

        estado: "PROGRAMADA",

        creado_por: usuario.id,

        qr_activo: false,

        qr_activo_desde: null,

        qr_activo_hasta: null,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Error creando sesión:",
        error
      );

      setError(
        error.message ||
          "No fue posible crear la sesión."
      );

      setGuardando(false);
      return;
    }

    console.log(
      "Sesión creada:",
      data
    );

    router.push(
      "/sesiones-acuerdos"
    );
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>Sesión no iniciada</h2>

        <button
          onClick={() =>
            router.push("/login")
          }
          style={{
            marginTop: 20,
            padding: "12px 20px",
            border: "none",
            borderRadius: 10,
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Ir al Login
        </button>
      </div>
    );
  }

  if (!puedeCrear) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>
          Acceso restringido
        </h2>

        <p
          style={{
            color: "#6b7280",
          }}
        >
          Solo el Presidente de la
          Directiva o un Administrador
          puede crear una sesión.
        </p>

        <button
          onClick={() =>
            router.push(
              "/sesiones-acuerdos"
            )
          }
          style={{
            marginTop: 20,
            padding: "12px 20px",
            border: "none",
            borderRadius: 10,
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Volver a Sesiones
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px 35px",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#1e3a8a,#2563eb)",
          borderRadius: 28,
          padding: "32px 38px",
          marginBottom: 28,
          color: "#fff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            opacity: 0.8,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          RENALIX · GOBERNANZA
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 34,
          }}
        >
          ➕ Nueva Sesión
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            color: "#dbeafe",
          }}
        >
          Registre una nueva sesión de la
          Directiva.
        </p>
      </div>

      {/* FORMULARIO */}

      <form
        onSubmit={guardarSesion}
        style={{
          background: "#fff",
          borderRadius: 22,
          padding: 30,
          boxShadow:
            "0 5px 18px rgba(0,0,0,0.08)",
        }}
      >
        {/* TITULO */}

        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 8,
              color: "#111827",
            }}
          >
            Título de la sesión *
          </label>

          <input
            type="text"
            value={titulo}
            onChange={(e) =>
              setTitulo(e.target.value)
            }
            placeholder="Ej.: Reunión ordinaria de Directiva"
            style={inputStyle}
          />
        </div>

        {/* DESCRIPCION */}

        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 8,
              color: "#111827",
            }}
          >
            Descripción
          </label>

          <textarea
            value={descripcion}
            onChange={(e) =>
              setDescripcion(
                e.target.value
              )
            }
            placeholder="Indique brevemente el objetivo de la sesión."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </div>

        {/* FECHA */}

        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 8,
              color: "#111827",
            }}
          >
            Fecha *
          </label>

          <input
            type="date"
            value={fecha}
            onChange={(e) =>
              setFecha(e.target.value)
            }
            style={inputStyle}
          />
        </div>

        {/* HORAS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 20,
            marginBottom: 22,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: 8,
                color: "#111827",
              }}
            >
              Hora de inicio *
            </label>

            <input
              type="time"
              value={horaInicio}
              onChange={(e) =>
                setHoraInicio(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: 8,
                color: "#111827",
              }}
            >
              Hora de finalización
            </label>

            <input
              type="time"
              value={horaFin}
              onChange={(e) =>
                setHoraFin(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </div>
        </div>

        {/* LUGAR */}

        <div style={{ marginBottom: 25 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 8,
              color: "#111827",
            }}
          >
            Lugar *
          </label>

          <input
            type="text"
            value={lugar}
            onChange={(e) =>
              setLugar(e.target.value)
            }
            placeholder="Ej.: Salón comunal"
            style={inputStyle}
          />
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 14,
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* BOTONES */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/sesiones-acuerdos"
              )
            }
            style={{
              padding:
                "12px 20px",
              border:
                "1px solid #d1d5db",
              borderRadius: 10,
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={guardando}
            style={{
              padding:
                "12px 22px",
              border: "none",
              borderRadius: 10,
              background:
                guardando
                  ? "#93c5fd"
                  : "#2563eb",
              color: "#fff",
              cursor:
                guardando
                  ? "not-allowed"
                  : "pointer",
              fontWeight: "bold",
            }}
          >
            {guardando
              ? "Guardando..."
              : "💾 Crear sesión"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  color: "#111827",
};