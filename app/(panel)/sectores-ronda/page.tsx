"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

export default function SectoresRondaPage() {

  const {
    usuario,
    loading,
  } = useAuth();

  /* ===========================
   ESTADOS
=========================== */

const [nombre, setNombre] = useState("");

const [descripcion, setDescripcion] = useState("");

const [radioPermitido, setRadioPermitido] = useState(5);

const [sectores, setSectores] = useState<any[]>([]);

const [mostrarFormulario, setMostrarFormulario] = useState(false);

const [modoEdicion, setModoEdicion] = useState(false);

const [sectorEditandoId, setSectorEditandoId] = useState<string | null>(null);

const [latitud, setLatitud] = useState<number | null>(null);

const [longitud, setLongitud] = useState<number | null>(null);

const [precisionGPS, setPrecisionGPS] = useState<number | null>(null);

const obtenerUbicacion = () => {

  if (!navigator.geolocation) {

    alert("Este dispositivo no soporta GPS.");

    return;

  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      setLatitud(position.coords.latitude);

      setLongitud(position.coords.longitude);

      setPrecisionGPS(position.coords.accuracy);

      alert("✅ Ubicación capturada correctamente.");

    },

    (error) => {

      console.error(error);

      if (error.code === 1) {

        alert(
          "📍 RENALIX necesita acceder a tu ubicación para registrar este punto de control.\n\n" +
          "Por favor, permite el acceso a la ubicación e inténtalo nuevamente."
        );

      } else if (error.code === 2) {

        alert(
          "📍 No fue posible determinar la ubicación del dispositivo."
        );

      } else if (error.code === 3) {

        alert(
          "⏳ La ubicación tardó demasiado en obtenerse."
        );

      } else {

        alert(
          "❌ Ocurrió un error obteniendo la ubicación."
        );

      }

    },

    {

      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 0,

    }

  );

};

const guardarSector = async () => {

  if (nombre.trim() === "") {

    alert("Ingrese el nombre del sector.");

    return;

  }

  if (!latitud || !longitud) {

    alert("Primero capture la ubicación.");

    return;

  }

  const { data: sectorExistente } = await supabase
  .from("sectores_ronda")
  .select("id")
  .eq("condominio_id", usuario.condominio_id)
  .ilike("nombre", nombre.trim())
  .maybeSingle();

if (sectorExistente) {

  alert("⚠️ Ya existe un sector con ese nombre.");

  return;

}

  let error = null;

if (modoEdicion) {

  const resultado = await supabase
    .from("sectores_ronda")
    .update({

      nombre: nombre.trim(),

      descripcion: descripcion.trim(),

      latitud,

      longitud,

      radio_permitido: radioPermitido,

    })
    .eq("id", sectorEditandoId);

  error = resultado.error;

} else {

  const resultado = await supabase
    .from("sectores_ronda")
    .insert({

      condominio_id: usuario.condominio_id,

      nombre: nombre.trim(),

      descripcion: descripcion.trim(),

      latitud,

      longitud,

      radio_permitido: radioPermitido,

      activo: true,

    });

  error = resultado.error;

}

  if (error) {

    console.error(error);

    alert("Error guardando el sector.");

    return;

  }

  alert("✅ Sector registrado correctamente.");

  setNombre("");

  setDescripcion("");

  setRadioPermitido(5);

  setLatitud(null);

  setLongitud(null);

  setPrecisionGPS(null);

  await cargarSectores();

  setMostrarFormulario(false);

};

const cargarSectores = async () => {

  const { data, error } = await supabase
    .from("sectores_ronda")
    .select("*")
    .eq("condominio_id", usuario.condominio_id)
    .order("created_at", { ascending: false });

  if (error) {

    console.error(error);

    return;

  }

  setSectores(data ?? []);

};

const cambiarEstadoSector = async (
  id: string,
  estadoActual: boolean
) => {

  const accion = estadoActual ? "desactivar" : "activar";

  const confirmar = window.confirm(
    `¿Está seguro que desea ${accion} este sector?`
  );

  if (!confirmar) return;

  const { error } = await supabase
    .from("sectores_ronda")
    .update({
      activo: !estadoActual,
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    alert("Ocurrió un error al actualizar el estado.");

    return;

  }

  await cargarSectores();

  alert(
    estadoActual
      ? "✅ Sector desactivado correctamente."
      : "✅ Sector activado correctamente."
  );

};

useEffect(() => {

  if (usuario) {

    cargarSectores();

  }

}, [usuario]);


  if (loading) {

    return <p>Cargando...</p>;

  }

  if (usuario?.rol !== "ADMIN") {

    return <p>No tiene permisos para acceder a este módulo.</p>;

  }

  return (

    <div
      style={{
        padding: 25,
      }}
    >

      <h1
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        📍 Sectores de Ronda
      </h1>

      <p
        style={{
          color: "#6b7280",
          marginBottom: 25,
        }}
      >
        Configure los puntos de control que utilizarán los guardias durante las rondas de vigilancia.
      </p>

      <button
  onClick={() =>
    setMostrarFormulario(true)
  }
  style={{
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 15,
    marginBottom: 25,
  }}
>
  ➕ Nuevo Sector
</button>

{mostrarFormulario && (

  <div
    style={{
      marginTop: 25,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 20,
    }}
  >

    <h2>📍 Nuevo Sector de Ronda</h2>

    <div
      style={{
        marginTop: 20,
      }}
    >

      <label
        style={{
          fontWeight: "bold",
        }}
      >
        Nombre del Sector
      </label>

      <input
        value={nombre}
        onChange={(e) =>
          setNombre(e.target.value)
        }
        placeholder="Ej. Bloque A"
        style={{
          width: "100%",
          marginTop: 8,
          padding: 12,
          borderRadius: 10,
          border: "1px solid #d1d5db",
        }}
      />

    </div>

    <div
      style={{
        marginTop: 20,
      }}
    >

      <label
        style={{
          fontWeight: "bold",
        }}
      >
        Descripción
      </label>

      <textarea
        value={descripcion}
        onChange={(e) =>
          setDescripcion(e.target.value)
        }
        rows={3}
        placeholder="Descripción opcional..."
        style={{
          width: "100%",
          marginTop: 8,
          padding: 12,
          borderRadius: 10,
          border: "1px solid #d1d5db",
        }}
      />

    </div>

    <div
      style={{
        marginTop: 20,
      }}
    >

      <label
        style={{
          fontWeight: "bold",
        }}
      >
        Radio permitido (metros)
      </label>

      <input
        type="number"
        value={radioPermitido}
        onChange={(e) =>
          setRadioPermitido(Number(e.target.value))
        }
        min={1}
        max={20}
        style={{
          width: 120,
          marginTop: 8,
          padding: 12,
          borderRadius: 10,
          border: "1px solid #d1d5db",
        }}
      />

    </div>

    <div
      style={{
        marginTop: 25,
        display: "flex",
        gap: 10,
      }}
    >

      <button
        onClick={obtenerUbicacion}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 20px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📍 Capturar ubicación

      </button>

      <button
        style={{
          background: "#7c3aed",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 20px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        📷 Capturar fotografía
      </button>

    </div>

    {latitud && longitud && (

  <div
    style={{
      marginTop: 20,
      marginBottom: 20,
      padding: 15,
      background: "#ecfdf5",
      border: "1px solid #bbf7d0",
      borderRadius: 12,
    }}
  >

    <div
      style={{
        fontWeight: "bold",
        color: "#166534",
        marginBottom: 10,
      }}
    >
      ✅ Ubicación capturada correctamente
    </div>

    <div>
      📍 Latitud: {latitud.toFixed(8)}
    </div>

    <div>
      📍 Longitud: {longitud.toFixed(8)}
    </div>

    <div
  style={{
    marginTop: 10,
    fontWeight: "bold",
    color:
      (precisionGPS ?? 999) <= 5
        ? "#166534"
        : (precisionGPS ?? 999) <= 10
        ? "#92400e"
        : "#991b1b",
  }}
>
  {(precisionGPS ?? 999) <= 5
    ? "🟢 GPS Excelente"
    : (precisionGPS ?? 999) <= 10
    ? "🟡 GPS Bueno"
    : "🔴 GPS Insuficiente"}

  {" - "}

  Precisión: {Math.round(precisionGPS ?? 0)} metros

</div>

  </div>

)}
    
    <div
      style={{
        marginTop: 25,
        display: "flex",
        gap: 10,
      }}
    >

      <button
      onClick={guardarSector}

      disabled={
  !latitud ||
  !longitud ||
  precisionGPS == null ||
  precisionGPS > 10 ||
  nombre.trim() === ""
}

        style={{
          background:
  !latitud ||
  !longitud ||
  precisionGPS == null ||
  precisionGPS > 10 ||
  nombre.trim() === ""
    ? "#9ca3af"
    : "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 22px",
          cursor:
  !latitud ||
  !longitud ||
  precisionGPS == null ||
  precisionGPS > 10 ||
  nombre.trim() === ""
    ? "not-allowed"
    : "pointer",
          fontWeight: "bold",
        }}
      >
        💾 Guardar
      </button>

      <button
        onClick={() =>
          setMostrarFormulario(false)
        }
        style={{
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 22px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Cancelar
      </button>

    </div>

  </div>

)}

<h2
  style={{
    marginTop: 35,
    marginBottom: 20,
    fontSize: 22,
    fontWeight: "bold",
  }}
>
  📍 Sectores configurados
</h2>

{sectores.length === 0 ? (

  <p
    style={{
      color: "#6b7280",
    }}
  >
    Aún no existen sectores registrados.
  </p>

) : (

  sectores.map((sector) => (

    <div
      key={sector.id}
      style={{
        border: "1px solid #e5e7eb",
        borderLeft: "6px solid #2563eb",
        borderRadius: 16,
        padding: 20,
        marginBottom: 18,
        background: "#ffffff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >

      <h3
        style={{
          margin: 0,
          fontSize: 20,
        }}
      >
        📍 {sector.nombre}
      </h3>

      <p
        style={{
          marginTop: 10,
          color: "#6b7280",
        }}
      >
        {sector.descripcion || "Sin descripción"}
      </p>

      <div
        style={{
          marginTop: 15,
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
        }}
      >

        <span>
          📏 Radio: {sector.radio_permitido} metros
        </span>

        <span
  style={{
    fontWeight: "bold",
    color: sector.activo ? "#16a34a" : "#dc2626",
  }}
>
  {sector.activo ? "🟢 Activo" : "🔴 Inactivo"}
</span>

      </div>

      <div
  style={{
    marginTop: 18,
    display: "flex",
    gap: 10,
  }}
>

  <button
    onClick={() => {

      setModoEdicion(true);

      setSectorEditandoId(sector.id);

      setNombre(sector.nombre);

      setDescripcion(sector.descripcion ?? "");

      setRadioPermitido(sector.radio_permitido);

      setLatitud(sector.latitud);

      setLongitud(sector.longitud);

      setPrecisionGPS(5);

      setMostrarFormulario(true);

    }}
    style={{
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "10px 18px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    ✏ Editar
  </button>

  <button
  onClick={() =>
    cambiarEstadoSector(
      sector.id,
      sector.activo
    )
  }
  style={{
    background: sector.activo
      ? "#dc2626"
      : "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  {sector.activo
    ? "🚫 Desactivar"
    : "🟢 Activar"}
</button>

</div>

    </div>

  ))

)}


    </div>

  );

}