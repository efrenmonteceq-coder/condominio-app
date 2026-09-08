"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function SolicitudesAprobadas() {

  const router = useRouter();

  const { usuario } = useAuth();

  const [solicitudes,
    setSolicitudes] =
    useState<any[]>([]);

  useEffect(() => {

    if (
      usuario?.condominio_id
    ) {

      cargarSolicitudes();

    }

  }, [usuario]);

  async function cargarSolicitudes() {

    const {
      data,
      error,
    } = await supabase
      .from(
        "solicitudes_gastos"
      )
      .select("*")
      .eq(
        "condominio_id",
        usuario?.condominio_id
      )
      .eq(
        "estado",
        "APROBADO"
      )
      .eq(
        "ejecutado",
        false
      )
      .order(
        "fecha_aprobacion",
        {
          ascending: false,
        }
      );

    if (error) {

      console.error(
        error
      );

      return;

    }

    setSolicitudes(
      data || []
    );

  }

  function registrarFactura(
    solicitudId: string
  ) {

    router.push(
      `/gastos?solicitud=${solicitudId}`
    );

  }

  return (

    <div
      style={{
        padding: 24,
      }}
    >

      <h1>
        ✅ Solicitudes Aprobadas
      </h1>

      <p>
        Solicitudes aprobadas por la Directiva y pendientes de ejecución.
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

            No existen solicitudes aprobadas pendientes.

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
                padding: 24,
                borderRadius: 16,
                marginBottom: 20,
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >

              <h2>
                {
                  solicitud.descripcion
                }
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(250px,1fr))",
                  gap: 10,
                }}
              >

                <p>
                  💰
                  <strong>
                    Valor aprobado:
                  </strong>
                  {" "}
                  $
                  {Number(
                    solicitud.valor_solicitado
                  ).toFixed(2)}
                </p>

                <p>
                  📂
                  <strong>
                    Categoría:
                  </strong>
                  {" "}
                  {
                    solicitud.categoria
                  }
                </p>

                <p>
                  🏢
                  <strong>
                    Proveedor:
                  </strong>
                  {" "}
                  {
                    solicitud.proveedor_sugerido
                  }
                </p>

                <p>
                  📅
                  <strong>
                    Fecha aprobación:
                  </strong>
                  {" "}
                  {
                    solicitud.fecha_aprobacion
                      ? new Date(
                          solicitud.fecha_aprobacion
                        ).toLocaleDateString()
                      : "-"
                  }
                </p>

              </div>

              <div
                style={{
                  marginTop: 15,
                  padding: 16,
                  background:
                    "#f8fafc",
                  borderRadius: 12,
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <strong>
                  📝 Observación de la Directiva
                </strong>

                <div
                  style={{
                    marginTop: 8,
                    color:
                      "#374151",
                  }}
                >

                  {
                    solicitud.comentario_aprobacion ||
                    "Sin observaciones."
                  }

                </div>

              </div>

              <div
                style={{
                  marginTop: 15,
                }}
              >

                <span
                  style={{
                    background:
                      "#dcfce7",
                    color:
                      "#166534",
                    padding:
                      "6px 12px",
                    borderRadius:
                      20,
                    fontWeight:
                      "bold",
                  }}
                >
                  APROBADO
                </span>

              </div>

              <div
                style={{
                  marginTop: 20,
                }}
              >

                <button
                  onClick={() =>
                    registrarFactura(
                      solicitud.id
                    )
                  }
                  style={{
                    background:
                      "#2563eb",
                    color:
                      "#fff",
                    border:
                      "none",
                    padding:
                      "12px 20px",
                    borderRadius:
                      10,
                    cursor:
                      "pointer",
                    fontWeight:
                      "bold",
                  }}
                >
                  🧾 Registrar Factura
                </button>

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}