"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { calcularDistanciaMetros } from "../../../lib/gps";
import { useAuth } from "../../../hooks/useAuth";
import { GPS_CONFIG } from "../../../lib/config";

export default function RondasGuardiaPage() {
  const {
  usuario,
  loading,
} = useAuth();

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [sector, setSector] = useState("");
    const [nuevoSector, setNuevoSector] = useState("");
    const [observacion, setObservacion] = useState("");
    const [rondas, setRondas] = useState<any[]>([]);
    const [sectores, setSectores] = useState<any[]>([]);
    const [latitud, setLatitud] = useState<number | null>(null);
    const [longitud, setLongitud] = useState<number | null>(null);
    const [precisionGPS, setPrecisionGPS] = useState<number | null>(null);
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [fotoModal, setFotoModal] = useState<string | null>(null);


    const verFotografia = async (fotoPath: string) => {

  if (!fotoPath) {
    alert("📷 Esta ronda no tiene una fotografía registrada.");
    return;
  }

  const { data, error } =
    await supabase.storage
      .from("rondas-fotos")
      .createSignedUrl(
        fotoPath,
        300
      );

  if (error || !data?.signedUrl) {

    console.error(
      "❌ Error obteniendo fotografía:",
      error
    );

    alert(
      "❌ No fue posible visualizar la fotografía."
    );

    return;
  }

  setFotoModal(data.signedUrl);
};
  
const registrarRonda = async () => {

  if (!sector) {
    alert("Seleccione un sector.");
    return;
  }

  if (
    sector === "Otro..." &&
    nuevoSector.trim() === ""
  ) {
    alert("Ingrese el nombre del nuevo sector.");
    return;
  }

  if (!foto) {
    alert("📷 Debe tomar una fotografía antes de registrar la ronda.");
    return;
  }

  if (
    precisionGPS == null ||
    precisionGPS > GPS_CONFIG.PRECISION_MAXIMA
  ) {
    alert(
      "📍 No se puede registrar la ronda porque la precisión GPS no es suficiente."
    );
    return;
  }

  const sectorFinal =
    sector === "Otro..."
      ? nuevoSector.trim()
      : sector;

  // ==========================================
  // 1. CREAR NOMBRE ÚNICO DE LA FOTOGRAFÍA
  // ==========================================

  const extension =
    foto.name.split(".").pop()?.toLowerCase() || "jpg";

  const nombreArchivo =
    `${usuario.condominio_id}/${usuario.id}/${Date.now()}.${extension}`;

  console.log("📷 Fotografía seleccionada:", foto.name);
  console.log("📤 Ruta de almacenamiento:", nombreArchivo);

  // ==========================================
  // 2. SUBIR FOTOGRAFÍA AL STORAGE
  // ==========================================

  const { error: errorFoto } =
    await supabase.storage
      .from("rondas-fotos")
      .upload(
        nombreArchivo,
        foto,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: foto.type || "image/jpeg",
        }
      );

  if (errorFoto) {

    console.error(
      "❌ Error subiendo fotografía:",
      errorFoto
    );

    alert(
      "❌ No fue posible guardar la fotografía."
    );

    return;
  }

  console.log(
    "✅ Fotografía guardada correctamente en Storage."
  );

  // ==========================================
  // 3. GUARDAR LA RONDA
  // ==========================================

  const { data: rondaCreada, error } =
    await supabase
      .from("rondas_guardia")
      .insert({

        usuario_id: usuario.id,

        condominio_id:
          usuario.condominio_id,

        sector: sectorFinal,

        observacion:
          observacion.trim(),

        latitud: latitud,

        longitud: longitud,

        precision_gps:
          precisionGPS,

        foto_url:
          nombreArchivo,

      })
      .select()
      .single();

  // ==========================================
  // 4. SI FALLA LA RONDA
  // ==========================================

  if (error) {

    console.error(
      "❌ Error registrando ronda:",
      error
    );

    // Eliminamos la fotografía porque
    // la ronda no llegó a crearse.
    await supabase.storage
      .from("rondas-fotos")
      .remove([nombreArchivo]);

    alert(
      "❌ No fue posible registrar la ronda."
    );

    return;
  }

  console.log(
    "✅ Ronda creada:",
    rondaCreada
  );

  console.log(
    "📷 Foto asociada:",
    rondaCreada.foto_url
  );

  // ==========================================
  // 5. LIMPIAR FORMULARIO
  // ==========================================

  alert(
    "✅ Ronda registrada correctamente."
  );

  setMostrarFormulario(false);

  setSector("");

  setNuevoSector("");

  setObservacion("");

  setFoto(null);

  setFotoPreview(null);

  setLatitud(null);

  setLongitud(null);

  setPrecisionGPS(null);

  await cargarRondas();
};



const cargarRondas = async () => {

  const { data, error } = await supabase
    .from("rondas_guardia")
    .select("*")
    .eq("condominio_id", usuario.condominio_id)
    .order("created_at", { ascending: false });

  if (error) {

    console.error(error);

    return;

  }


  setRondas(data ?? []);

};

const cargarSectores = async () => {

  const { data, error } = await supabase
    .from("sectores_ronda")
    .select("*")
    .eq("condominio_id", usuario.condominio_id)
    .eq("activo", true)
    .order("nombre");

  if (error) {

    console.error(error);

    return;

  }

  setSectores(data ?? []);

};

const obtenerUbicacion = () => {

  if (!navigator.geolocation) {

    alert("Este dispositivo no soporta GPS.");

    return;

  }

  let watchId: number;

  watchId = navigator.geolocation.watchPosition(

    (position) => {

      const lat = position.coords.latitude;

      const lng = position.coords.longitude;

      const precision = position.coords.accuracy;

      setLatitud(lat);

      setLongitud(lng);

      setPrecisionGPS(precision);

      // Todavía no abrimos el formulario.
      // Esperamos una precisión adecuada.

      if (precision <= GPS_CONFIG.PRECISION_MAXIMA) {

        navigator.geolocation.clearWatch(watchId);

        const resultado = detectarSectorMasCercano(lat, lng);

if (resultado) {

  setSector(resultado.sector.nombre);

}
      }

    },

    (error) => {

      navigator.geolocation.clearWatch(watchId);

      console.error(error);

      if (error.code === 1) {

        alert(
          "📍 RENALIX necesita acceder a tu ubicación para validar la ronda.\n\nPor favor habilita el permiso de ubicación."
        );

      } else if (error.code === 2) {

        alert(
          "No fue posible determinar la ubicación."
        );

      } else if (error.code === 3) {

        alert(
          "La ubicación tardó demasiado en obtenerse."
        );

      } else {

        alert(
          "Ocurrió un error inesperado."
        );

      }

    },

    {

      enableHighAccuracy: true,

      maximumAge: 0,

      timeout: 30000,

    }

  );

};

const detectarSectorMasCercano = (
  latActual: number,
  lngActual: number
) => {

  if (
    latitud == null ||
    longitud == null ||
    sectores.length === 0
  ) {
    return;
  }

  let mejorSector: any = null;

  let menorDistancia = Number.MAX_VALUE;

  for (const s of sectores) {

    const distancia = calcularDistanciaMetros(
      latActual,
      lngActual,
      s.latitud,
      s.longitud
    );

    if (distancia < menorDistancia) {

      menorDistancia = distancia;

      mejorSector = s;

    }

  }

  if (!mejorSector) {

  return null;

}

if (menorDistancia > mejorSector.radio_permitido) {

  return null;

}

return {
  sector: mejorSector,
  distancia: menorDistancia,
};
};

useEffect(() => {

  if (usuario) {

    cargarRondas();

    cargarSectores();

  }

}, [usuario]);


if (loading) {
  return <p>Cargando...</p>;
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
        🛡️ Rondas de Vigilancia
      </h1>

      <p
        style={{
          color: "#6b7280",
          marginBottom: 25,
        }}
      >
        Registre las rondas de vigilancia realizadas por el personal de seguridad.
      </p>

        <button

onClick={() => {

    setMostrarFormulario(true);

    obtenerUbicacion();

}}

  style={{
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 15,
  }}
>
  ➕ Nueva Ronda
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

    <h2>🛡 Nueva Ronda</h2>

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
    Sector
  </label>

  <select
    value={sector}
    onChange={(e) =>
      setSector(e.target.value)
    }
    style={{
      width: "100%",
      marginTop: 8,
      padding: 12,
      borderRadius: 10,
      border: "1px solid #d1d5db",
    }}
  >

    <option value="">
      Seleccione...
    </option>

    {sectores.map((s) => (

  <option
    key={s.id}
    value={s.nombre}
  >
    {s.nombre}
  </option>

))}

  </select>

  {sector === "Otro..." && (

  <div
    style={{
      marginTop: 15,
    }}
  >

    <label
      style={{
        fontWeight: "bold",
      }}
    >
      Nuevo sector
    </label>

    <input
      value={nuevoSector}
      onChange={(e) =>
        setNuevoSector(e.target.value)
      }
      placeholder="Ej. Cancha de Tenis"
      style={{
        width: "100%",
        marginTop: 8,
        padding: 12,
        borderRadius: 10,
        border: "1px solid #d1d5db",
      }}
    />

  </div>

)}

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
    Observación
  </label>

  <textarea
    value={observacion}
    onChange={(e) =>
      setObservacion(e.target.value)
    }
    rows={4}
    placeholder="Observación (opcional)"
    style={{
      width: "100%",
      marginTop: 8,
      padding: 12,
      borderRadius: 10,
      border: "1px solid #d1d5db",
      resize: "vertical",
    }}
  />

  <div
  style={{
    marginTop: 18,
    padding: 15,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background:
      precisionGPS == null
        ? "#f3f4f6"
        : precisionGPS <= 5
        ? "#dcfce7"
        : precisionGPS <= 10
        ? "#fef9c3"
        : "#fee2e2",
  }}
>

  <div
    style={{
      fontWeight: "bold",
      fontSize: 16,
      marginBottom: 8,
    }}
  >
    📍 Estado del GPS
  </div>

  <div
    style={{
      fontSize: 15,
      fontWeight: "bold",
      color:
        precisionGPS == null
          ? "#6b7280"
          : precisionGPS <= 5
          ? "#166534"
          : precisionGPS <= 10
          ? "#92400e"
          : "#991b1b",
    }}
  >
    {precisionGPS == null
      ? "📡 Obteniendo ubicación..."
      : precisionGPS <= 5
      ? "🟢 GPS Excelente"
      : precisionGPS <= 10
      ? "🟡 GPS Bueno"
      : "🔴 GPS Insuficiente"}
  </div>

  {precisionGPS != null && (
    <div
      style={{
        marginTop: 6,
        color: "#374151",
        fontSize: 14,
      }}
    >
      Precisión: {Math.round(precisionGPS)} metros
    </div>
  )}

  {precisionGPS != null && precisionGPS > GPS_CONFIG.PRECISION_MAXIMA && (
    <div
      style={{
        marginTop: 10,
        color: "#b91c1c",
        fontWeight: "bold",
      }}
    >
      ⚠️ Espere unos segundos hasta obtener una mejor precisión antes de registrar la ronda.
    </div>
  )}

</div>

</div>


</div>

<div
  style={{
    marginTop: 20,
    padding: 15,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    background: "#f9fafb",
  }}
>
  <div
    style={{
      fontWeight: "bold",
      marginBottom: 10,
    }}
  >
    📷 Fotografía de la ronda
  </div>

  <input
    type="file"
    accept="image/*"
    capture="environment"
    onChange={(e) => {

      const archivo = e.target.files?.[0];

      if (!archivo) return;

      setFoto(archivo);

      setFotoPreview(
        URL.createObjectURL(archivo)
      );

    }}
  />

  {fotoPreview && (
    <div
      style={{
        marginTop: 15,
      }}
    >
      <img
        src={fotoPreview}
        alt="Vista previa de la ronda"
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 12,
          border: "1px solid #d1d5db",
        }}
      />
    </div>
  )}

  {!foto && (
    <div
      style={{
        marginTop: 10,
        color: "#b91c1c",
        fontWeight: "bold",
      }}
    >
      ⚠️ La fotografía es obligatoria.
    </div>
  )}

</div>

    <div
  style={{
    display: "flex",
    gap: 10,
    marginTop: 25,
  }}
>

    <button
  onClick={registrarRonda}
  disabled={
  precisionGPS == null ||
  precisionGPS > GPS_CONFIG.PRECISION_MAXIMA
}
  style={{
    background:
  precisionGPS == null ||
  precisionGPS > GPS_CONFIG.PRECISION_MAXIMA
    ? "#9ca3af"
    : "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 22px",
    cursor:
  precisionGPS == null ||
  precisionGPS > GPS_CONFIG.PRECISION_MAXIMA
    ? "not-allowed"
    : "pointer",
    fontWeight: "bold",
  }}
>
  🟢 Registrar Ronda
</button>

  <button
    onClick={() => {

      setMostrarFormulario(false);

      setSector("");

      setNuevoSector("");

      setObservacion("");
      
    }}
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
    🔴 Cancelar
  </button>

</div>

  </div>

)}

      <div
        style={{
          marginTop: 35,
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          border: "1px solid #e5e7eb",
        }}
      >

        <h2
          style={{
            marginTop: 0,
          }}
        >
          📋 Últimas rondas
        </h2>

        {rondas.length === 0 ? (

  <p
    style={{
      color: "#6b7280",
    }}
  >
    Aún no existen rondas registradas.
  </p>

) : (

  rondas.map((ronda) => (

    <div
      key={ronda.id}
      style={{
  border: "1px solid #e5e7eb",
  borderLeft: "6px solid #22c55e",
  borderRadius: 16,
  padding: 20,
  marginTop: 18,
  background: "#ffffff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
}}
    >

      <div
  style={{
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
  }}
>

  {/* Escudo */}

  <div
    style={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: "#dcfce7",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: 32,
      flexShrink: 0,
    }}
  >
    🛡️
  </div>

  {/* Información */}

  <div
    style={{
      flex: 1,
    }}
  >

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}
    >

      <h3
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {ronda.sector}
      </h3>

      <span
        style={{
          background: "#dcfce7",
          color: "#166534",
          padding: "6px 14px",
          borderRadius: 30,
          fontWeight: "bold",
          fontSize: 13,
        }}
      >
        ✅ Normal
      </span>

    </div>

    <div
      style={{
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        marginTop: 14,
        color: "#6b7280",
        fontSize: 14,
      }}
    >

      <span>
        📅 {new Date(ronda.created_at).toLocaleDateString("es-EC")}
      </span>

      <span>
        🕒 {new Date(ronda.created_at).toLocaleTimeString("es-EC")}
      </span>

      <span>
        👮 {usuario.nombre} {usuario.apellido}
      </span>

    </div>

    <div
      style={{
        marginTop: 18,
        background: "#f9fafb",
        borderRadius: 12,
        padding: 16,
        border: "1px solid #e5e7eb",
      }}
    >

      <div
        style={{
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        📝 Observación
      </div>

      <div
        style={{
          color: "#374151",
          lineHeight: 1.5,
        }}
      >
        {ronda.observacion || "Sin observaciones"}
      </div>

    </div>

    <div
      style={{
        marginTop: 15,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}
    >

     {ronda.foto_url ? (

  <button
    type="button"
    onClick={() =>
      verFotografia(ronda.foto_url)
    }
    style={{
      border: "none",
      background: "#eff6ff",
      color: "#2563eb",
      padding: "8px 12px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: 13,
    }}
  >
    📷 Ver fotografía
  </button>

) : (

  <span
    style={{
      color: "#9ca3af",
      fontSize: 13,
    }}
  >
    📷 Sin fotografía
  </span>

)}
      <span
        style={{
          color: "#9ca3af",
          fontSize: 12,
        }}
      >
        Registro #{ronda.id.substring(0,8)}
      </span>

    </div>

  </div>

</div>


    </div>

  ))

)}

      </div>

      {/* =========================================
          MODAL PARA VER FOTOGRAFÍA
          ========================================= */}

      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#ffffff",
              borderRadius: 16,
              padding: 15,
              maxWidth: 800,
              width: "100%",
              maxHeight: "90vh",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >

            <button
              type="button"
              onClick={() => setFotoModal(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: 20,
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              ×
            </button>

            <img
              src={fotoModal}
              alt="Fotografía de la ronda"
              style={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 12,
                display: "block",
              }}
            />

          </div>

        </div>
      )}

    </div>
  );

}