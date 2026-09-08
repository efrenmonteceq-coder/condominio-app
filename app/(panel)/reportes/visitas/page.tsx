"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ReporteVisitasHoy() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [visitas,
    setVisitas] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");


  // 🔥 FECHA HOY

  const hoy =
    new Date()
      .toISOString()
      .split("T")[0];

      const [
  filtroEstado,
  setFiltroEstado
] = useState("");

const [
  fechaDesde,
  setFechaDesde
] = useState(hoy);

const [
  fechaHasta,
  setFechaHasta
] = useState(hoy);

  // 🔥 CARGAR VISITAS

  const cargarVisitas =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("visitas")
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
          "ERROR VISITAS:",
          error
        );

        return;

      }

      setVisitas(
        data || []
      );

    };

  // 🔥 INIT

  useEffect(() => {

    cargarVisitas();

  }, []);

  // 🔥 FILTRO

  const visitasFiltradas =
  useMemo(() => {

    return visitas.filter(
      (v) => {

        const viviendaCodigo =

          Array.isArray(
            v.viviendas
          )

            ? v.viviendas[0]
                ?.codigo_vivienda || ""

            : v.viviendas
                ?.codigo_vivienda || "";

        const texto =
          `
          ${v.visitante_nombre || ""}
          ${v.visitante_identificacion || ""}
          ${v.pin || ""}
          ${v.estado || ""}
          ${viviendaCodigo}
        `
            .toLowerCase();

        const coincideBusqueda =

          texto.includes(
            busqueda.toLowerCase()
          );

        const coincideEstado =

          filtroEstado
            ? v.estado ===
              filtroEstado
            : true;

        const fechaVisita =
          v.fecha_visita || "";

        const coincideFecha =

          fechaVisita >=
            fechaDesde

          &&

          fechaVisita <=
            fechaHasta;

        return (

          coincideBusqueda
          && coincideEstado
          && coincideFecha

        );

      }
    );

  }, [

    visitas,
    busqueda,
    filtroEstado,
    fechaDesde,
    fechaHasta,

  ]);

  // 🔥 KPIs

  const totalVisitas =
    visitasFiltradas.length;

  const activas =
    visitasFiltradas.filter(
      (v) =>
        (
          v.estado || ""
        )
          .toLowerCase()
          .includes(
            "activa"
          )
    ).length;

  const expiradas =
    visitasFiltradas.filter(
      (v) =>
        (
          v.estado || ""
        )
          .toLowerCase()
          .includes(
            "expirada"
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
`Fecha,Vivienda,Visitante,Cédula,PIN,Estado
`;

      visitasFiltradas.forEach(
        (v) => {

          const viviendaCodigo =

            Array.isArray(
              v.viviendas
            )

              ? v.viviendas[0]
                  ?.codigo_vivienda || ""

              : v.viviendas
                  ?.codigo_vivienda || "";

          contenido +=
`"${v.created_at || ""}","${viviendaCodigo}","${v.visitante_nombre || ""}","${v.visitante_identificacion || ""}","${v.pin || ""}","${v.estado || ""}"
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
        "reporte_visitas_hoy.csv";

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

          th,
          td {
            border: 1px solid #d1d5db !important;
            padding: 6px !important;
            text-align: left !important;
            vertical-align: top !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }

          tr {
            page-break-inside: avoid !important;
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
                INFORME DE VISITAS DE HOY
              </h1>

              <p
                style={{
                  color: "#666",
                  marginTop: 10,
                }}
              >
                Reporte ejecutivo
                de visitas registradas
                el día de hoy.
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

              <div style={kpiStyle}>

                <h3 style={kpiTitle}>
                  TOTAL
                </h3>

                <h1 style={kpiValue}>
                  {totalVisitas}
                </h1>

              </div>

              <div style={kpiStyle}>

                <h3 style={kpiTitle}>
                  ACTIVAS
                </h3>

                <h1 style={kpiValue}>
                  {activas}
                </h1>

              </div>

              <div style={kpiStyle}>

                <h3 style={kpiTitle}>
                  EXPIRADAS
                </h3>

                <h1 style={kpiValue}>
                  {expiradas}
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
  placeholder="Buscar visitante, vivienda, PIN..."
  value={busqueda}
  onChange={(e) =>
    setBusqueda(
      e.target.value
    )
  }
  style={{
    flex: 1,
    minWidth: 260,
    padding: 12,
    borderRadius: 10,
    border:
      "1px solid #ccc",
  }}
/>

<select
  value={filtroEstado}
  onChange={(e) =>
    setFiltroEstado(
      e.target.value
    )
  }
  style={{
    padding: 12,
    borderRadius: 10,
    border:
      "1px solid #ccc",
  }}
>

  <option value="">
    Todos estados
  </option>

  <option value="PENDIENTE">
    Pendiente
  </option>

  <option value="INGRESÓ">
    Ingresó
  </option>

  <option value="FINALIZADA">
    Finalizada
  </option>

</select>

<input
  type="date"
  value={fechaDesde}
  onChange={(e) =>
    setFechaDesde(
      e.target.value
    )
  }
  style={{
    padding: 12,
    borderRadius: 10,
    border:
      "1px solid #ccc",
  }}
/>

<input
  type="date"
  value={fechaHasta}
  onChange={(e) =>
    setFechaHasta(
      e.target.value
    )
  }
  style={{
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
                      Fecha ingreso
                    </th>

                    <th align="left">
                      Hora ingreso
                    </th>

                    <th align="left">
                      Salida
                    </th>

                    <th align="left">
                      Vivienda
                    </th>

                    <th align="left">
                      Visitante
                    </th>

                    <th align="left">
                      Cédula
                    </th>

                    <th align="left">
                      PIN
                    </th>

                    <th align="left">
                      Estado
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {visitasFiltradas
                    .filter((v) => v)
                    .map(
                      (
                        v,
                        index
                      ) => {

                        const viviendaCodigo =

                          Array.isArray(
                            v.viviendas
                          )

                            ? v.viviendas[0]
                                ?.codigo_vivienda || "-"

                            : v.viviendas
                                ?.codigo_vivienda || "-";

                        return (

                          <tr
                            key={
                              v.id ||
                              index
                            }
                            style={{
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >

                            <td>
                              {v.fecha_visita || "-"}
                            </td>

                            <td>
                              {v.hora_ingreso || "-"}
                            </td>

                            <td>
                              {v.fecha_salida
                                ? (() => {
                                    const fecha =
                                      new Date(
                                        v.fecha_salida
                                      );

                                    fecha.setHours(
                                      fecha.getHours() - 5
                                    );

                                    return fecha.toLocaleString(
                                      "es-EC"
                                    );
                                  })()
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
                                v.visitante_nombre || "-"
                              }
                            </td>

                            <td>
                              {
                                v.visitante_identificacion || "-"
                              }
                            </td>

                            <td>
                              {
                                v.pin || "-"
                              }
                            </td>

                            <td>
                              {
                                v.estado || "-"
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