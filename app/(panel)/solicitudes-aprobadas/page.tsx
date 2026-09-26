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

  // 🧾 GASTOS YA REGISTRADOS
  // Se consulta el módulo de gastos para reconocer también
  // facturas que fueron registradas antes de este control visual.
  const [gastosRegistrados,
    setGastosRegistrados] =
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

    // 🧾 Cargar los gastos registrados para reconocer
    // también solicitudes antiguas cuya factura ya fue ingresada.
    const {
      data: gastosData,
      error: errorGastos,
    } = await supabase
      .from("gastos_administrativos")
      .select("categoria, proveedor, descripcion, subtotal, total, valor, numero_factura, fecha_gasto, solicitud_id")
      .eq("condominio_id", usuario?.condominio_id);

    if (errorGastos) {
      console.error(
        "❌ Error cargando gastos registrados:",
        errorGastos
      );
      setGastosRegistrados([]);
    } else {
      const gastosEncontrados = gastosData || [];

      setGastosRegistrados(
        gastosEncontrados
      );

      // 🔄 Regulariza solicitudes antiguas que ya tienen un gasto registrado.
      // Antes de existir este control, esas solicitudes podían permanecer con
      // ejecutado=false aunque la factura ya hubiese sido ingresada.
      const solicitudesYaRegistradas = (data || []).filter((solicitud) =>
        solicitud?.ejecutado !== true &&
        facturaRegistradaConGastos(
          solicitud,
          gastosEncontrados
        )
      );

      if (solicitudesYaRegistradas.length > 0) {
        for (const solicitudRegistrada of solicitudesYaRegistradas) {
          const { error: errorActualizacion } = await supabase
            .from("solicitudes_gastos")
            .update({ ejecutado: true })
            .eq("id", solicitudRegistrada.id)
            .eq("condominio_id", usuario?.condominio_id);

          if (errorActualizacion) {
            console.error(
              "❌ No se pudo actualizar ejecutado de la solicitud:",
              solicitudRegistrada.id,
              errorActualizacion
            );
          }
        }

        setSolicitudes(
          (data || []).map((solicitud) =>
            solicitudesYaRegistradas.some((item) => item.id === solicitud.id)
              ? { ...solicitud, ejecutado: true }
              : solicitud
          )
        );
      }
    }

  }

  function normalizarTexto(
    valor: any
  ) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function coincideTexto(
    valorA: any,
    valorB: any
  ) {
    const a = normalizarTexto(valorA);
    const b = normalizarTexto(valorB);

    if (!a || !b) {
      return false;
    }

    return (
      a === b ||
      a.includes(b) ||
      b.includes(a)
    );
  }

  function mismoValorAprobado(
    solicitud: any,
    gasto: any
  ) {
    const valorAprobado = Number(
      solicitud?.valor_solicitado || 0
    );

    if (!Number.isFinite(valorAprobado) || valorAprobado <= 0) {
      return false;
    }

    const subtotal = Number(gasto?.subtotal || 0);
    const total = Number(gasto?.total || 0);
    const valor = Number(gasto?.valor || 0);

    const valores = [subtotal, total, valor].filter((v) =>
      Number.isFinite(v) && v > 0
    );

    return valores.some((v) =>
      Math.abs(v - valorAprobado) < 0.01 ||
      Math.abs(v - valorAprobado * 1.15) < 0.01 ||
      Math.abs(v - valorAprobado / 1.15) < 0.01
    );
  }

  function facturaRegistradaConGastos(
    solicitud: any,
    gastosDisponibles: any[]
  ) {
    if (solicitud?.ejecutado === true) {
      return true;
    }

    // ✅ Relación contable exacta. Una factura solo pertenece a esta solicitud
    // cuando gastos_administrativos.solicitud_id coincide exactamente con
    // solicitudes_gastos.id. No se usan montos, textos ni similitudes.
    return gastosDisponibles.some((gasto) => {
      const mismaSolicitud =
        gasto?.solicitud_id != null &&
        String(gasto.solicitud_id) === String(solicitud?.id);

      if (!mismaSolicitud) {
        return false;
      }

      // Se conserva la estructura anterior del archivo, pero estas comprobaciones
      // ya no deciden si la factura corresponde o no a la solicitud.
      const comprobacionLegada = mismoValorAprobado(
        solicitud,
        gasto
      );
      void comprobacionLegada;

      const categoriaSolicitud = normalizarTexto(
        solicitud?.categoria
      );
      const proveedorSolicitud = normalizarTexto(
        solicitud?.proveedor_sugerido
      );
      const descripcionSolicitud = normalizarTexto(
        solicitud?.descripcion
      );

      const coincideProveedor = coincideTexto(
        proveedorSolicitud,
        gasto?.proveedor
      );
      const coincideCategoria = coincideTexto(
        categoriaSolicitud,
        gasto?.categoria
      );
      const coincideDescripcion = coincideTexto(
        descripcionSolicitud,
        gasto?.descripcion
      );

      const coincidencias = [
        coincideProveedor,
        coincideCategoria,
        coincideDescripcion,
      ].filter(Boolean).length;

      // Estas variables se mantienen para no alterar la estructura del archivo.
      // La identidad exacta de solicitud_id es la única condición determinante.
      return (
        mismaSolicitud &&
        coincidencias >= 0
      );
    });
  }

  function facturaRegistrada(
    solicitud: any
  ) {
    return facturaRegistradaConGastos(
      solicitud,
      gastosRegistrados
    );
  }

  function registrarFactura(
    solicitud: any
  ) {

    if (facturaRegistrada(solicitud)) {
      return;
    }

    router.push(
      `/gastos?solicitud=${solicitud.id}`
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

                {facturaRegistrada(solicitud) ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: 10,
                      cursor: "not-allowed",
                      fontWeight: "bold",
                      opacity: 0.95,
                    }}
                  >
                    ✅ Factura registrada
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      registrarFactura(
                        solicitud
                      )
                    }
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    🧾 Registrar Factura
                  </button>
                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}