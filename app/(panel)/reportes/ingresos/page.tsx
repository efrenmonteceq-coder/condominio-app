"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Menu from "@/app/components/Menu";

export default function ReporteIngresos() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [ingresos,
    setIngresos] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR INGRESOS

  const cargarIngresos =
    async () => {

    // 🔥 PAGOS

    const {
      data: pagosData,
      error,
    } = await supabase
      .from("pagos_residentes")
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

      console.error(error);

      return;

    }

    // 🔥 USUARIOS

    const {
      data: usuariosData
    } = await supabase
      .from("usuarios")
      .select("*")
      .eq(
        "condominio_id",
        usuario.condominio_id
      );

    // 🔥 VIVIENDAS

    const {
      data: viviendasData
    } = await supabase
      .from("viviendas")
      .select("*")
      .eq(
        "condominio_id",
        usuario.condominio_id
      );

    // 🔥 RELACIONAR

    const ingresosFinales =

      pagosData?.map(
        (p) => {

          const residente =
            usuariosData?.find(
              (u) =>
                u.id ===
                p.residente_id
            );

          const vivienda =
            viviendasData?.find(
              (v) =>
                v.residente_id ===
                residente?.id
            );

          return {

            ...p,

            residenteNombre:

              residente

                ? `${residente.nombre || ""} ${residente.apellido || ""}`

                : "-",

            codigoVivienda:

              vivienda?.codigo_vivienda || "-",

          };

        }
      ) || [];

    setIngresos(
      ingresosFinales
    );

  };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarIngresos();

    }

  }, [usuario]);

  // 🔥 FILTRO

  const ingresosFiltrados =
    ingresos.filter((i) => {

      const texto =
        `
        ${i.residenteNombre || ""}
        ${i.codigoVivienda || ""}
        ${i.periodo || ""}
        ${i.estado || ""}
        ${i.observacion || ""}
      `
          .toLowerCase();

      return texto.includes(
        busqueda.toLowerCase()
      );

    });

  // 🔥 TOTAL

  const totalIngresos =

    ingresosFiltrados.reduce(
      (acc, item) =>

        acc +
        Number(
          item.valor_pagado || 0
        ),

      0
    );

  // 🔥 IMPRIMIR

  const imprimir =
    () => {

      window.print();

    };

  // 🔥 EXPORTAR PDF

  const exportarPDF =
    () => {

      window.print();

    };

  // 🔥 EXPORTAR EXCEL

  const exportarExcel =
    () => {

      let contenido =
        `
Residente,Vivienda,Periodo,Valor,Estado,Fecha Pago,Observación
`;

      ingresosFiltrados.forEach(
        (i) => {

          contenido +=
            `
"${i.residenteNombre || ""}",
"${i.codigoVivienda || ""}",
"${i.periodo || ""}",
"${Number(i.valor_pagado || 0).toFixed(2)}",
"${i.estado || ""}",
"${i.fecha_pago || ""}",
"${i.observacion || ""}"
`;

        }
      );

      contenido +=
        `
TOTAL INGRESOS,,,,${totalIngresos.toFixed(2)}
`;

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

      link.setAttribute(
        "href",
        url
      );

      link.setAttribute(
        "download",
        "reporte_ingresos.csv"
      );

      link.style.visibility =
        "hidden";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

    };

  // 🔒 LOADING

  if (loading || !usuario) {

    return <p>Cargando...</p>;

  }

  return (

    <>

      {/* 🔥 ESTILOS IMPRESIÓN */}

      <style jsx global>{`

        @media print {

          aside {
            display: none !important;
          }

          button {
            display: none !important;
          }

          input {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

        }

      `}</style>

      <div
        style={{
          display: "flex",
        }}
      >

        {/* 🔥 MENÚ */}

        <aside>

        </aside>

        {/* 🔥 CONTENIDO */}

        <main
          style={{
            padding: 30,
            width: "100%",
            background:
              "#f5f7fa",
            minHeight: "100vh",
          }}
        >

          {/* 🔥 HEADER */}

          <div
            style={{
              background: "#fff",
              borderRadius: 15,
              padding: 25,
              marginBottom: 25,
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >

            <h1
              style={{
                margin: 0,
                fontSize: 32,
              }}
            >
              INFORME GENERAL DE INGRESOS
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: 10,
              }}
            >
              Reporte ejecutivo general
              de ingresos y pagos de
              residentes registrados.
            </p>

          </div>

          {/* 🔥 ACCIONES */}

          <div
            style={{
              background: "#fff",
              borderRadius: 15,
              padding: 20,
              marginBottom: 25,
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
              display: "flex",
              gap: 15,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >

            {/* 🔥 FILTRO */}

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

            {/* 🔥 BOTONES */}

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
              background: "#fff",
              borderRadius: 15,
              padding: 20,
              overflowX: "auto",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
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
                    Residente
                  </th>

                  <th align="left">
                    Vivienda
                  </th>

                  <th align="left">
                    Periodo
                  </th>

                  <th align="left">
                    Valor
                  </th>

                  <th align="left">
                    Estado
                  </th>

                  <th align="left">
                    Fecha Pago
                  </th>

                  <th align="left">
                    Observación
                  </th>

                </tr>

              </thead>

              <tbody>

                {ingresosFiltrados.map(
                  (i) => (

                    <tr
                      key={i.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >

                      <td>
                        {
                          i.residenteNombre
                        }
                      </td>

                      <td>
                        {
                          i.codigoVivienda
                        }
                      </td>

                      <td>
                        {i.periodo || "-"}
                      </td>

                      <td>
                        $
                        {Number(
                          i.valor_pagado || 0
                        ).toFixed(2)}
                      </td>

                      <td>
                        {i.estado || "-"}
                      </td>

                      <td>
                        {
                          i.fecha_pago || "-"
                        }
                      </td>

                      <td>
                        {
                          i.observacion || "-"
                        }
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* 🔥 TOTAL */}

          <div
            style={{
              marginTop: 20,
              background: "#fff",
              borderRadius: 15,
              padding: 20,
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
              display: "flex",
              justifyContent:
                "flex-end",
            }}
          >

            <h2
              style={{
                margin: 0,
              }}
            >
              TOTAL INGRESOS:
              {" "}
              $
              {totalIngresos.toFixed(2)}
            </h2>

          </div>

        </main>

      </div>

    </>

  );

}

// 🔥 ESTILO BOTONES

const botonStyle = {

  padding:
    "12px 18px",

  borderRadius: 10,

  border: "none",

  cursor: "pointer",

  background: "#111827",

  color: "#fff",

  fontWeight: "bold",

};