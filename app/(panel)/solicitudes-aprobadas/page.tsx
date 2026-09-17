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

  const [busqueda,
    setBusqueda] =
    useState("");

  const [mostrarHistorial,
    setMostrarHistorial] =
    useState(false);

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

  // 🔥 ÚLTIMAS 2 + BÚSQUEDA + HISTORIAL
  const terminoBusqueda =
    busqueda.trim().toLowerCase();

  const solicitudesFiltradas =
    solicitudes.filter((solicitud) => {

      const textoBusqueda = [
        solicitud.descripcion,
        solicitud.categoria,
        solicitud.proveedor_sugerido,
        solicitud.valor_solicitado,
        solicitud.fecha_aprobacion,
        solicitud.comentario_aprobacion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return textoBusqueda.includes(
        terminoBusqueda
      );
    });

  const solicitudesVisibles =
    terminoBusqueda ||
    mostrarHistorial
      ? solicitudesFiltradas
      : solicitudesFiltradas.slice(0, 2);

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
          background: "#fff",
          padding: 20,
          borderRadius: 16,
          marginTop: 20,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 15,
          }}
        >

          <strong>
            📚 Solicitudes aprobadas
          </strong>

            <button
              type="button"
              onClick={() =>
                setMostrarHistorial(
                  !mostrarHistorial
                )
              }
              style={{
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {mostrarHistorial
                ? "⬆️ Ver solo las 2 últimas"
                : "📂 Ver historial completo"}
            </button>

        </div>

        <input
          placeholder="🔎 Buscar descripción, categoría, proveedor o fecha..."
          value={busqueda}
          onChange={(e) => {
            const valor =
              e.target.value;

            setBusqueda(valor);

            if (valor.trim()) {
              setMostrarHistorial(true);
            }
          }}
          style={{
            width: "100%",
            padding: 12,
            border:
              "1px solid #d1d5db",
            borderRadius: 10,
            boxSizing:
              "border-box",
            fontSize: 15,
          }}
        />

        <div
          style={{
            marginTop: 10,
            marginBottom: 5,
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          {terminoBusqueda
            ? `Resultados encontrados: ${solicitudesVisibles.length}`
            : mostrarHistorial
              ? `Historial completo: ${solicitudes.length} solicitudes`
              : `Últimas solicitudes: ${Math.min(
                  solicitudes.length,
                  2
                )}`}
        </div>

      </div>

      <div
        style={{
          marginTop: 20,
        }}
      >

        {solicitudesVisibles.length === 0 && (

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

        {solicitudesVisibles.map(
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