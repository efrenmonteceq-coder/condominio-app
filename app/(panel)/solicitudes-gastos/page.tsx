"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function SolicitudesGastos() {
  const { usuario } = useAuth();

  const [categoria, setCategoria] =
    useState("");

  const [proveedor, setProveedor] =
    useState("");

  const [valorSolicitado, setValorSolicitado] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [observacion, setObservacion] =
    useState("");

  const [cotizacion1, setCotizacion1] =
    useState<any>(null);

  const [cotizacion2, setCotizacion2] =
    useState<any>(null);

  const [cotizacion3, setCotizacion3] =
    useState<any>(null);

    const enviarSolicitud =
  async () => {

    const subirArchivo =
  async (
    archivo: File | null
  ) => {

    if (!archivo)
      return null;

    const nombreArchivo =
      `${Date.now()}-${archivo.name}`;

    const {
      error: uploadError
    } = await supabase
      .storage
      .from(
        "solicitudes-gastos"
      )
      .upload(
        nombreArchivo,
        archivo
      );

    if (
      uploadError
    ) {

      console.error(
        uploadError
      );

      throw new Error(
        "Error subiendo archivo"
      );

    }

    const {
      data
    } = supabase
      .storage
      .from(
        "solicitudes-gastos"
      )
      .getPublicUrl(
        nombreArchivo
      );

    return data.publicUrl;

  };

    try {

      if (
        !categoria ||
        !descripcion ||
        !valorSolicitado
      ) {

        alert(
          "Complete los campos obligatorios"
        );

        return;

      }

      if (
        Number(
          valorSolicitado
        ) <= 200
      ) {

        alert(
          "Las solicitudes de gasto son únicamente para valores mayores a $200."
        );

        return;

      }

      const urlCotizacion1 =
  await subirArchivo(
    cotizacion1
  );

const urlCotizacion2 =
  await subirArchivo(
    cotizacion2
  );

const urlCotizacion3 =
  await subirArchivo(
    cotizacion3
  );

const {
  error
} = await supabase
  .from(
    "solicitudes_gastos"
  )
  .insert([{

    condominio_id:
      usuario
        ?.condominio_id,

    solicitado_por:
      usuario?.id,

    categoria,

    descripcion,

    observacion,

    proveedor_sugerido:
      proveedor,

    valor_solicitado:
      Number(
        valorSolicitado
      ),

    cotizacion_1_url:
      urlCotizacion1,

    cotizacion_2_url:
      urlCotizacion2,

    cotizacion_3_url:
      urlCotizacion3,

    estado:
      "PENDIENTE",

  }]);

if (error) {

  console.error(
    error
  );

  alert(
    error.message
  );

  return;

}

alert(
  "Solicitud enviada correctamente"
);

setCategoria("");
setProveedor("");
setValorSolicitado("");
setDescripcion("");
setObservacion("");

setCotizacion1(null);
setCotizacion2(null);
setCotizacion3(null);


    } catch (error) {

      console.error(
        error
      );

      alert(
        "Error inesperado"
      );

    }

  };

  return (

    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >

      <h1>
        📋 Solicitudes de Gastos
      </h1>

      <p>
        Solicitudes que requieren aprobación de la Directiva
      </p>

      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          marginTop: 20,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >

        <h2>
          Nueva Solicitud
        </h2>

        <br />

        <label>
          Categoría
        </label>

        <input
          value={categoria}
          onChange={(e) =>
            setCategoria(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <br />
        <br />

        <label>
          Proveedor sugerido
        </label>

        <input
          value={proveedor}
          onChange={(e) =>
            setProveedor(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <br />
        <br />

        <label>
          Valor solicitado
        </label>

        <input
          type="number"
          value={valorSolicitado}
          onChange={(e) =>
            setValorSolicitado(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <br />
        <br />

        <label>
          Descripción
        </label>

        <textarea
          value={descripcion}
          onChange={(e) =>
            setDescripcion(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            minHeight: 120,
          }}
        />

        <br />
        <br />

        <label>
          Observación
        </label>

        <textarea
          value={observacion}
          onChange={(e) =>
            setObservacion(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            minHeight: 120,
          }}
        />

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginTop: 25,
        }}
      >

        <UploadCard
          titulo="Cotización 1"
          archivo={cotizacion1}
          setArchivo={setCotizacion1}
          inputId="cotizacion1"
        />

        <UploadCard
          titulo="Cotización 2"
          archivo={cotizacion2}
          setArchivo={setCotizacion2}
          inputId="cotizacion2"
        />

        <UploadCard
          titulo="Cotización 3"
          archivo={cotizacion3}
          setArchivo={setCotizacion3}
          inputId="cotizacion3"
        />

      </div>

      <div
        style={{
          marginTop: 30,
          textAlign: "center",
        }}
      >

        <button
  type="button"
  onClick={
    enviarSolicitud
  }
  style={{
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "14px 28px",
    borderRadius: 12,
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
  }}
>
  📤 Enviar Solicitud
</button>

      </div>

    </div>

  );

}

function UploadCard({
  titulo,
  archivo,
  setArchivo,
  inputId,
}: any) {

  return (

    <label
      htmlFor={inputId}
      style={{
        border:
          "2px dashed #2563eb",

        borderRadius: 16,

        padding: 24,

        background:
          "#eff6ff",

        textAlign:
          "center",

        cursor:
          "pointer",

        minHeight: 220,

        display:
          "flex",

        flexDirection:
          "column",

        justifyContent:
          "center",
      }}
    >

      <input
        id={inputId}
        type="file"
        accept=".pdf,image/*"
        style={{
          display: "none",
        }}
        onChange={(e) => {

          if (
            e.target.files &&
            e.target.files[0]
          ) {

            setArchivo(
              e.target.files[0]
            );

          }

        }}
      />

      <div
        style={{
          fontSize: 48,
        }}
      >
        📄
      </div>

      <h3>
        {titulo}
      </h3>

      <p
        style={{
          color: "#6b7280",
        }}
      >
        Haga clic para adjuntar PDF o imagen
      </p>

      <div
        style={{
          marginTop: 10,
          background:
            "#2563eb",

          color:
            "#fff",

          padding:
            "10px 16px",

          borderRadius:
            10,

          fontWeight:
            "bold",

          display:
            "inline-block",
        }}
      >
        📤 Subir Cotización
      </div>

      {archivo && (

        <div
          style={{
            marginTop: 15,
            color: "#16a34a",
            fontWeight: "bold",
            wordBreak: "break-word",
          }}
        >
          ✅ {archivo.name}
        </div>

      )}

    </label>

  );

}

const inputStyle = {

  width: "100%",

  padding: 12,

  border:
    "1px solid #d1d5db",

  borderRadius: 8,

  marginTop: 6,

  boxSizing:
    "border-box" as const,

};