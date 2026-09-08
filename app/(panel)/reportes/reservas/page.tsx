"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ReporteReservas() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [reservas,
    setReservas] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR RESERVAS

  const cargarReservas =
    async () => {

      if (!usuario?.condominio_id)
        return;

      // 🔥 CONSULTAR RESERVAS

      const {
        data,
        error,
      } = await supabase
        .from("reservas_areas")
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {

        console.log(
          "ERROR RESERVAS:",
          error
        );

        return;

      }

      // 🔥 IDS USUARIOS

      const usuariosIds =
        data?.map(
          (r) =>
            r.usuario_id
        ) || [];

      // 🔥 IDS ÁREAS

      const areasIds =
        data?.map(
          (r) =>
            r.area_id
        ) || [];

      // 🔥 CONSULTAR USUARIOS

      const {
        data: usuariosData,
        error: usuariosError,
      } = await supabase
        .from("usuarios")
        .select(`
          id,
          nombre,
          apellido
        `)
        .in(
          "id",
          usuariosIds
        );

      if (usuariosError) {

        console.log(
          "ERROR USUARIOS:",
          usuariosError
        );

      }

      // 🔥 CONSULTAR ÁREAS

      const {
        data: areasData,
        error: areasError,
      } = await supabase
        .from("areas_comunes")
        .select(`
          id,
          nombre
        `)
        .in(
          "id",
          areasIds
        );

      if (areasError) {

        console.log(
          "ERROR AREAS:",
          areasError
        );

      }

      // 🔥 UNIR DATOS

      const reservasFinales =
        data?.map((r) => {

          const usuarioReserva =
            usuariosData?.find(
              (u) =>
                u.id ===
                r.usuario_id
            );

          const areaReserva =
            areasData?.find(
              (a) =>
                a.id ===
                r.area_id
            );

          return {

            ...r,

            usuario_nombre:

              usuarioReserva

                ? `${usuarioReserva.nombre || ""} ${usuarioReserva.apellido || ""}`

                : "Sin usuario",

            area_nombre:

              areaReserva
                ?.nombre || "Sin área",

          };

        });

      setReservas(
        reservasFinales || []
      );

    };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarReservas();

    }

  }, [usuario]);

  // 🔥 FILTRAR

  const reservasFiltradas =
    useMemo(() => {

      return reservas.filter(
        (r) => {

          const texto =
            `
            ${r.usuario_nombre || ""}
            ${r.area_nombre || ""}
            ${r.estado || ""}
            ${r.fecha || ""}
            ${r.hora_inicio || ""}
            ${r.hora_fin || ""}
          `
              .toLowerCase();

          return texto.includes(
            busqueda.toLowerCase()
          );

        }
      );

    }, [
      reservas,
      busqueda,
    ]);

  // 🔥 KPIs

  const totalReservas =
    reservasFiltradas.length;

  const aprobadas =
  reservasFiltradas.filter(
    (r) => {

      const estado =
        (
          r.estado || ""
        ).toLowerCase();

      return (
        estado.includes("aprobada") ||
        estado.includes("reservada")
      );

    }
  ).length;

  const pendientes =
    reservasFiltradas.filter(
      (r) =>
        (
          r.estado || ""
        )
          .toLowerCase()
          .includes(
            "pendiente"
          )
    ).length;

  const canceladas =
    reservasFiltradas.filter(
      (r) =>
        (
          r.estado || ""
        )
          .toLowerCase()
          .includes(
            "cancelada"
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
`Fecha,Usuario,Área,Hora Inicio,Hora Final,Estado
`;

      reservasFiltradas.forEach(
        (r) => {

          contenido +=
`"${r.fecha || ""}","${r.usuario_nombre || ""}","${r.area_nombre || ""}","${r.hora_inicio || ""}","${r.hora_fin || ""}","${r.estado || ""}"
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
        "reporte_reservas.csv";

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

      {/* 🔥 ESTILOS PDF */}

      <style jsx global>{`

        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {

          html,
          body {
            width: 100%;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
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
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 11px !important;
          }

          th,
          td {
            border: 1px solid #d1d5db !important;
            padding: 6px !important;
            word-wrap: break-word !important;
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

            <div style={cardStyle}>

              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight:
                    "bold",
                }}
              >
                INFORME GENERAL DE RESERVAS
              </h1>

              <p
                style={{
                  color: "#666",
                  marginTop: 10,
                }}
              >
                Reporte ejecutivo
                general de reservas
                registradas en el
                sistema residencial.
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
                  {totalReservas}
                </h1>
              </div>

              <div style={kpiStyle}>
                <h3 style={kpiTitle}>
                  APROBADAS
                </h3>

                <h1 style={kpiValue}>
                  {aprobadas}
                </h1>
              </div>

              <div style={kpiStyle}>
                <h3 style={kpiTitle}>
                  PENDIENTES
                </h3>

                <h1 style={kpiValue}>
                  {pendientes}
                </h1>
              </div>

              <div style={kpiStyle}>
                <h3 style={kpiTitle}>
                  CANCELADAS
                </h3>

                <h1 style={kpiValue}>
                  {canceladas}
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
                      Usuario
                    </th>

                    <th align="left">
                      Área
                    </th>

                    <th align="left">
                      Hora Inicio
                    </th>

                    <th align="left">
                      Hora Final
                    </th>

                    <th align="left">
                      Estado
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {reservasFiltradas
                    .filter((r) => r)
                    .map(
                      (
                        r,
                        index
                      ) => (

                        <tr
                          key={
                            r.id_uuid ||
                            index
                          }
                          style={{
                            borderBottom:
                              "1px solid #eee",
                          }}
                        >

                          <td>
                            {r.fecha || "-"}
                          </td>

                          <td>
                            {
                              r.usuario_nombre || "-"
                            }
                          </td>

                          <td>
                            {
                              r.area_nombre || "-"
                            }
                          </td>

                          <td>
                            {
                              r.hora_inicio || "-"
                            }
                          </td>

                          <td>
                            {
                              r.hora_fin || "-"
                            }
                          </td>

                          <td>
                            {
                              r.estado || "-"
                            }
                          </td>

                        </tr>

                      )
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

// 🔥 ESTILOS

const cardStyle = {

  background: "#fff",

  borderRadius: 15,

  padding: 25,

  marginBottom: 25,

  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",

};

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