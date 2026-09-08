"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function AprobacionesDirectiva() {

  const { usuario } = useAuth();

  const [solicitudes, setSolicitudes] =
    useState<any[]>([]);

  const [comentarios, setComentarios] =
    useState<Record<string, string>>({});

  useEffect(() => {

    if (usuario?.condominio_id) {
      cargarSolicitudes();
    }

  }, [usuario]);

  async function cargarSolicitudes() {

    const {
      data,
      error,
    } = await supabase
      .from("solicitudes_gastos")
      .select("*")
      .eq(
        "condominio_id",
        usuario?.condominio_id
      )
      .eq(
        "estado",
        "PENDIENTE"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {

      console.error(error);

      return;

    }

    setSolicitudes(data || []);

  }

  async function aprobarSolicitud(
    id: string
  ) {

    const comentario =
      comentarios[id] || "";

    const { error } =
      await supabase
        .from(
          "solicitudes_gastos"
        )
        .update({

          estado:
            "APROBADO",

          comentario_aprobacion:
            comentario,

          aprobado_por:
            usuario?.id,

          fecha_aprobacion:
            new Date(),

        })
        .eq(
          "id",
          id
        );

    if (error) {

      alert(
        error.message
      );

      return;

    }

    alert(
      "Solicitud aprobada correctamente"
    );

    cargarSolicitudes();

  }

  async function rechazarSolicitud(
    id: string
  ) {

    const comentario =
      comentarios[id] || "";

    if (
      !comentario.trim()
    ) {

      alert(
        "Debe ingresar una observación para rechazar la solicitud."
      );

      return;

    }

    const { error } =
      await supabase
        .from(
          "solicitudes_gastos"
        )
        .update({

          estado:
            "RECHAZADO",

          comentario_aprobacion:
            comentario,

          aprobado_por:
            usuario?.id,

          fecha_aprobacion:
            new Date(),

        })
        .eq(
          "id",
          id
        );

    if (error) {

      alert(
        error.message
      );

      return;

    }

    alert(
      "Solicitud rechazada correctamente"
    );

    cargarSolicitudes();

  }

  return (

    <div
      style={{
        padding: 24,
      }}
    >

      <h1>
        📋 Aprobaciones Directiva
      </h1>

      <p>
        Solicitudes pendientes de aprobación
      </p>

      <div
        style={{
          marginTop: 20,
        }}
      >

        {solicitudes.length === 0 && (

          <div
            style={{
              background:
                "#fff",
              padding: 20,
              borderRadius: 12,
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            No existen solicitudes pendientes.
          </div>

        )}

        {solicitudes.map(
          (solicitud) => (

            <div
              key={
                solicitud.id
              }
              style={{
                background:
                  "#fff",
                padding: 20,
                borderRadius: 12,
                marginBottom: 15,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >

              <h3>
                {solicitud.descripcion}
              </h3>

              <p>
                💰 Valor:
                $
                {Number(
                  solicitud.valor_solicitado
                ).toFixed(2)}
              </p>

              <p>
                📂 Categoría:
                {solicitud.categoria}
              </p>

              <p>
                🏢 Proveedor:
                {solicitud.proveedor_sugerido}
              </p>

              <div
                style={{
                  marginTop: 15,
                }}
              >

                <label
                  style={{
                    fontWeight:
                      "bold",
                    display:
                      "block",
                    marginBottom: 8,
                  }}
                >
                  📝 Observaciones de la Directiva
                </label>

                <textarea
                  value={
                    comentarios[
                      solicitud.id
                    ] || ""
                  }
                  onChange={(e) =>
                    setComentarios(
                      (prev) => ({
                        ...prev,
                        [solicitud.id]:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Ingrese observaciones"
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: 12,
                    border:
                      "1px solid #d1d5db",
                    borderRadius: 8,
                    boxSizing:
                      "border-box",
                  }}
                />

              </div>

              <div
                style={{
                  marginTop: 15,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >

                {solicitud.cotizacion_1_url && (

                  <a
                    href={
                      solicitud.cotizacion_1_url
                    }
                    target="_blank"
                    style={linkStyle}
                  >
                    📄 Cotización 1
                  </a>

                )}

                {solicitud.cotizacion_2_url && (

                  <a
                    href={
                      solicitud.cotizacion_2_url
                    }
                    target="_blank"
                    style={linkStyle}
                  >
                    📄 Cotización 2
                  </a>

                )}

                {solicitud.cotizacion_3_url && (

                  <a
                    href={
                      solicitud.cotizacion_3_url
                    }
                    target="_blank"
                    style={linkStyle}
                  >
                    📄 Cotización 3
                  </a>

                )}

              </div>

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >

                <button
                  onClick={() =>
                    aprobarSolicitud(
                      solicitud.id
                    )
                  }
                  style={{
                    background:
                      "#16a34a",
                    color:
                      "#fff",
                    border:
                      "none",
                    padding:
                      "12px 18px",
                    borderRadius:
                      10,
                    cursor:
                      "pointer",
                    fontWeight:
                      "bold",
                  }}
                >
                  ✅ Aprobar
                </button>

                <button
                  onClick={() =>
                    rechazarSolicitud(
                      solicitud.id
                    )
                  }
                  style={{
                    background:
                      "#dc2626",
                    color:
                      "#fff",
                    border:
                      "none",
                    padding:
                      "12px 18px",
                    borderRadius:
                      10,
                    cursor:
                      "pointer",
                    fontWeight:
                      "bold",
                  }}
                >
                  ❌ Rechazar
                </button>

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}

const linkStyle = {

  background:
    "#2563eb",

  color:
    "#fff",

  padding:
    "10px 14px",

  borderRadius:
    8,

  textDecoration:
    "none",

  fontWeight:
    "bold",

};