"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Sesion = {
  id: string;
  condominio_id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  lugar: string;
  estado: string;
  creado_por: string | null;
  qr_activo: boolean;
  qr_activo_desde: string | null;
  qr_activo_hasta: string | null;
  created_at: string;
};


export default function SesionesAcuerdos() {
  const router = useRouter();

  const { usuario, loading } = useAuth();

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const rol = (usuario?.rol || "").toUpperCase().trim();

  const cargarSesiones = async () => {
    if (!usuario?.condominio_id) return;

    setCargando(true);
    setError("");

    // Cerrar automáticamente las sesiones cuya fecha y hora de fin ya pasaron.
    // Esto actualiza la BD para que la sesión no permanezca ABIERTA.
    const ahora = new Date();

    const { data: sesionesActuales, error: errorSesionesActuales } =
      await supabase
        .from("sesiones")
        .select("id, fecha, hora_fin, estado, qr_activo, qr_activo_hasta")
        .eq("condominio_id", usuario.condominio_id)
        .eq("estado", "ABIERTA");

    if (errorSesionesActuales) {
      console.error(
        "Error verificando sesiones vencidas:",
        errorSesionesActuales
      );
    } else {
      const sesionesVencidas = (sesionesActuales || []).filter((sesion) => {
        if (!sesion.fecha || !sesion.hora_fin) return false;

        const fechaHoraFin = new Date(
          `${sesion.fecha}T${sesion.hora_fin.slice(0, 8)}`
        );

        return fechaHoraFin <= ahora;
      });

      if (sesionesVencidas.length > 0) {
        const idsVencidas = sesionesVencidas.map((sesion) => sesion.id);

        const { error: errorCierre } = await supabase
          .from("sesiones")
          .update({
            estado: "FINALIZADA",
            qr_activo: false,
            qr_activo_hasta: ahora.toISOString(),
          })
          .in("id", idsVencidas)
          .eq("estado", "ABIERTA");

        if (errorCierre) {
          console.error(
            "Error cerrando automáticamente sesiones vencidas:",
            errorCierre
          );
        }
      }
    }

    const { data, error } = await supabase
      .from("sesiones")
      .select("*")
      .eq("condominio_id", usuario.condominio_id)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false });

    if (error) {
      console.error("Error cargando sesiones:", error);
      setError("No fue posible cargar las sesiones.");
      setSesiones([]);
    } else {
      setSesiones(data || []);
    }

    setCargando(false);
  };

  useEffect(() => {
    if (!loading && usuario) {
      cargarSesiones();
    }
  }, [loading, usuario]);

  if (loading || !usuario) {
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

  if (rol !== "DIRECTIVA" && rol !== "ADMIN") {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>Acceso restringido</h2>
        <p>No tienes permisos para acceder a este módulo.</p>

        <button
          onClick={() => router.push("/dashboard")}
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
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px 35px",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#1e3a8a,#2563eb)",
          borderRadius: 28,
          padding: "35px 40px",
          marginBottom: 30,
          color: "#fff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            opacity: 0.8,
            marginBottom: 10,
            fontSize: 14,
          }}
        >
          RENALIX · GOBERNANZA
        </div>

        <h1
          style={{
            fontSize: 36,
            margin: 0,
          }}
        >
          🏛️ Sesiones y Acuerdos
        </h1>

        <p
          style={{
            marginTop: 12,
            color: "#dbeafe",
            fontSize: 16,
          }}
        >
          Gestión de sesiones, asistencia,
          votaciones y acuerdos del condominio.
        </p>
      </div>

      {/* ACCIONES */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
          marginBottom: 25,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#111827",
            }}
          >
            📅 Sesiones
          </h2>

          <p
            style={{
              marginTop: 6,
              color: "#6b7280",
            }}
          >
            Consulta las sesiones del condominio.
          </p>
        </div>

        {(rol === "ADMIN" ||
          (rol === "DIRECTIVA" &&
            usuario.cargo_directiva === "PRESIDENTE")) && (
          <button
            onClick={() =>
              router.push(
                "/sesiones-acuerdos/nueva"
              )
            }
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "13px 20px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 15,
              boxShadow:
                "0 5px 15px rgba(37,99,235,0.25)",
            }}
          >
            ➕ Nueva sesión
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* CARGANDO */}

      {cargando && (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 35,
            textAlign: "center",
            boxShadow:
              "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          Cargando sesiones...
        </div>
      )}

      {/* SIN SESIONES */}

      {!cargando && sesiones.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
            boxShadow:
              "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 50,
              marginBottom: 15,
            }}
          >
            📅
          </div>

          <h3
            style={{
              marginBottom: 8,
            }}
          >
            No existen sesiones registradas
          </h3>

          <p
            style={{
              color: "#6b7280",
              margin: 0,
            }}
          >
            Cuando se cree una sesión aparecerá
            aquí.
          </p>
        </div>
      )}

      {/* LISTADO */}

      {!cargando && sesiones.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(320px,1fr))",
            gap: 20,
          }}
        >
          {sesiones.map((sesion) => (
            <SesionCard
              key={sesion.id}
              sesion={sesion}
              onClick={() =>
                router.push(
                  `/sesiones-acuerdos/${sesion.id}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SesionCard({
  sesion,
  onClick,
}: {
  sesion: Sesion;
  onClick: () => void;
}) {
  const estado = (
    sesion.estado || ""
  ).toUpperCase();

  const estadoConfig: Record<
    string,
    {
      texto: string;
      color: string;
      fondo: string;
    }
  > = {
    PROGRAMADA: {
      texto: "PROGRAMADA",
      color: "#92400e",
      fondo: "#fef3c7",
    },

    ABIERTA: {
      texto: "ABIERTA",
      color: "#166534",
      fondo: "#dcfce7",
    },

    FINALIZADA: {
      texto: "FINALIZADA",
      color: "#374151",
      fondo: "#e5e7eb",
    },

    CANCELADA: {
      texto: "CANCELADA",
      color: "#991b1b",
      fondo: "#fee2e2",
    },
  };

  const config =
    estadoConfig[estado] ||
    {
      texto: estado || "SIN ESTADO",
      color: "#374151",
      fondo: "#e5e7eb",
    };

  const fecha = new Date(
    `${sesion.fecha}T00:00:00`
  );

  const fechaTexto =
    fecha.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const horaInicio =
    sesion.hora_inicio?.slice(0, 5) || "";

  const horaFin =
    sesion.hora_fin?.slice(0, 5) || "";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 25,
        boxShadow:
          "0 5px 18px rgba(0,0,0,0.08)",
        borderTop:
          "5px solid #2563eb",
        cursor: "pointer",
        transition: "transform 0.15s ease",
      }}
    >
      {/* ESTADO */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <span
          style={{
            background: config.fondo,
            color: config.color,
            padding: "6px 11px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: "bold",
          }}
        >
          {config.texto}
        </span>

        {sesion.qr_activo && (
          <span
            style={{
              color: "#166534",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            📱 QR ACTIVO
          </span>
        )}
      </div>

      {/* TITULO */}

      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 21,
          color: "#111827",
        }}
      >
        {sesion.titulo}
      </h3>

      {/* DESCRIPCION */}

      {sesion.descripcion && (
        <p
          style={{
            color: "#6b7280",
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          {sesion.descripcion}
        </p>
      )}

      {/* INFORMACION */}

      <div
        style={{
          display: "grid",
          gap: 9,
          color: "#374151",
          fontSize: 14,
        }}
      >
        <div>
          📅 <strong>Fecha:</strong>{" "}
          {fechaTexto}
        </div>

        <div>
          🕐 <strong>Hora:</strong>{" "}
          {horaInicio}
          {horaFin
            ? ` - ${horaFin}`
            : ""}
        </div>

        <div>
          📍 <strong>Lugar:</strong>{" "}
          {sesion.lugar}
        </div>
      </div>

      {/* BOTON */}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          width: "100%",
          marginTop: 22,
          padding: "11px 15px",
          border: "none",
          borderRadius: 10,
          background: "#eff6ff",
          color: "#1d4ed8",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        👁️ Ver sesión
      </button>
    </div>
  );
}