"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ReporteNovedades() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [novedades,
    setNovedades] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR NOVEDADES

  const cargarNovedades =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("novedades")
        .select(`
          *,
          viviendas (
            codigo_vivienda
          )
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {

        console.log(
          "ERROR NOVEDADES:",
          error
        );

        return;

      }

      setNovedades(
        data || []
      );

    };

  // 🔥 INIT

  useEffect(() => {

    cargarNovedades();

  }, []);

  // 🔥 FILTRO

  const novedadesFiltradas =
    useMemo(() => {

      return novedades.filter(
        (n) => {

          const viviendaCodigo =

            Array.isArray(
              n.viviendas
            )

              ? n.viviendas[0]
                  ?.codigo_vivienda || ""

              : n.viviendas
                  ?.codigo_vivienda || "";

          const texto =
            `
            ${n.tipo || ""}
            ${n.descripcion || ""}
            ${n.estado || ""}
            ${n.registrado_por || ""}
            ${viviendaCodigo}
          `
              .toLowerCase();

          return texto.includes(
            busqueda.toLowerCase()
          );

        }
      );

    }, [
      novedades,
      busqueda,
    ]);

  // 🔥 KPIs

  const totalNovedades =
    novedadesFiltradas.length;

  const pendientes =
    novedadesFiltradas.filter(
      (n) =>
        (
          n.estado || ""
        )
          .toLowerCase()
          .includes(
            "pendiente"
          )
    ).length;

  const resueltas =
    novedadesFiltradas.filter(
      (n) =>
        (
          n.estado || ""
        )
          .toLowerCase()
          .includes(
            "resuelta"
          )
    ).length;

  // 🔥 IMPRIMIR

  const imprimir =
    () => {

      window.print();

    };

  // 🔥 PDF

  const exportarPDF =
    () => {

      window.print();

    };

  // 🔥 EXCEL

  const exportarExcel =
    () => {

      let contenido =
`Fecha,Vivienda,Tipo,Estado,Registrado Por,Descripción
`;

      novedadesFiltradas.forEach(
        (n) => {

          const viviendaCodigo =

            Array.isArray(
              n.viviendas
            )

              ? n.viviendas[0]
                  ?.codigo_vivienda || ""

              : n.viviendas
                  ?.codigo_vivienda || "";

          contenido +=
`"${n.fecha || ""}","${viviendaCodigo}","${n.tipo || ""}","${n.estado || ""}","${n.registrado_por || ""}","${n.descripcion || ""}"
`;

        }
      );

      const blob =
        new Blob(
          [contenido],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const link =
        document.createElement("a");

      const url =
        URL.createObjectURL(blob);

      link.href = url;

      link.download =
        "reporte_novedades.csv";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

    };

  // 🔒 LOADING

  if (loading) {

    return <p>Cargando...</p>;

  }

  if (!usuario) {

    return <p>No autorizado</p>;

  }

  return (

    <>

      {/* 🔥 ESTILOS PDF / IMPRESIÓN */}

      <style jsx global>{`

        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {

          html,
          body {
            width: 100%;
            height: auto;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          aside,
          button,
          input {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid !important;
          }

          th,
          td {
            border: 1px solid #d1d5db !important;
            padding: 6px !important;
            text-align: left !important;
            vertical-align: top !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }

          div {
            box-shadow: none !important;
          }

        }

      `}</style>

      <div>

        <div
          style={{
            padding: 30,
          }}
        >

          <div className="print-area">

            {/* 🔥 HEADER */}

            <div
              style={cardStyle}
            >

              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight:
                    "bold",
                }}
              >
                INFORME GENERAL DE NOVEDADES
              </h1>

              <p
                style={{
                  color: "#666",
                  marginTop: 10,
                }}
              >
                Reporte ejecutivo
                general de novedades
                registradas en la
                urbanización.
              </p>

            </div>

            {/* 🔥 KPIs */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
                marginBottom: 25,
              }}
            >

              <div
                style={kpiStyle}
              >

                <h3 style={kpiTitle}>
                  TOTAL
                </h3>

                <h1 style={kpiValue}>
                  {totalNovedades}
                </h1>

              </div>

              <div
                style={kpiStyle}
              >

                <h3 style={kpiTitle}>
                  PENDIENTES
                </h3>

                <h1 style={kpiValue}>
                  {pendientes}
                </h1>

              </div>

              <div
                style={kpiStyle}
              >

                <h3 style={kpiTitle}>
                  RESUELTAS
                </h3>

                <h1 style={kpiValue}>
                  {resueltas}
                </h1>

              </div>

            </div>

            {/* 🔥 ACCIONES */}

            <div
              style={{
                ...cardStyle,
                display: "flex",
                gap: 15,
                flexWrap: "wrap",
                alignItems:
                  "center",
              }}
            >

              <input
                placeholder="Filtrar reporte..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                style={{
                  flex: 1,
                  minWidth: 250,
                  padding: 12,
                  borderRadius: 10,
                  border:
                    "1px solid #ccc",
                }}
              />

              <button
                onClick={imprimir}
                style={botonStyle}
              >
                🖨️ Imprimir
              </button>

              <button
                onClick={exportarPDF}
                style={botonStyle}
              >
                📄 PDF
              </button>

              <button
                onClick={exportarExcel}
                style={botonStyle}
              >
                📊 Excel
              </button>

            </div>

            {/* 🔥 TABLA */}

            <div
              style={{
                ...cardStyle,
                overflowX:
                  "auto",
              }}
            >

              <table
                width="100%"
                cellPadding={12}
                style={{
                  borderCollapse:
                    "collapse",
                }}
              >

                <thead>

                  <tr
                    style={{
                      background:
                        "#f0f2f5",
                    }}
                  >

                    <th align="left">
                      Fecha
                    </th>

                    <th align="left">
                      Vivienda
                    </th>

                    <th align="left">
                      Tipo
                    </th>

                    <th align="left">
                      Estado
                    </th>

                    <th align="left">
                      Registrado Por
                    </th>

                    <th align="left">
                      Descripción
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {novedadesFiltradas
                    .filter((n) => n)
                    .map(
                      (
                        n,
                        index
                      ) => {

                        const viviendaCodigo =

                          Array.isArray(
                            n.viviendas
                          )

                            ? n.viviendas[0]
                                ?.codigo_vivienda || "-"

                            : n.viviendas
                                ?.codigo_vivienda || "-";

                        return (

                          <tr
                            key={
                              n.id_uuid ||
                              index
                            }
                            style={{
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >

                            <td>
                              {
                                n.fecha
                                  ? new Date(
                                      n.fecha
                                    ).toLocaleDateString()
                                  : "-"
                              }
                            </td>

                            <td>
                              {
                                viviendaCodigo
                              }
                            </td>

                            <td>
                              {
                                n.tipo || "-"
                              }
                            </td>

                            <td>
                              {
                                n.estado || "-"
                              }
                            </td>

                            <td>
                              {
                                n.registrado_por || "-"
                              }
                            </td>

                            <td>
                              {
                                n.descripcion || "-"
                              }
                            </td>

                          </tr>

                        );

                      }
                    )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </>

  );

}

// 🔥 CARD

const cardStyle = {

  background: "#fff",

  borderRadius: 15,

  padding: 25,

  marginBottom: 25,

  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",

};

// 🔥 KPI

const kpiStyle = {

  background: "#fff",

  borderRadius: 15,

  padding: 25,

  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",

};

const kpiTitle = {

  margin: 0,

  color: "#666",

  fontSize: 14,

};

const kpiValue = {

  margin:
    "10px 0 0 0",

  fontSize: 38,

  fontWeight:
    "bold",

};

// 🔥 BOTÓN

const botonStyle = {

  padding:
    "12px 18px",

  borderRadius: 10,

  border: "none",

  cursor: "pointer",

  background:
    "#111827",

  color: "#fff",

  fontWeight:
    "bold",

};