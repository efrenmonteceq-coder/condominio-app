"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
export default function ReporteViviendas() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [viviendas,
    setViviendas] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR VIVIENDAS

  const cargarViviendas =
    async () => {

      const {
        data: viviendasData,
        error,
      } = await supabase
        .from("viviendas")
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        )
        .order(
          "codigo_vivienda",
          {
            ascending: true,
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

      // 🔥 RELACIONAR RESIDENTES

      const viviendasFinales =

        viviendasData?.map(
          (v) => {

            const residente =
              usuariosData?.find(
                (u) =>
                  u.id ===
                  v.residente_id
              );

            return {

              ...v,

              residenteNombre:

                residente

                  ? `${residente.nombre || ""} ${residente.apellido || ""}`

                  : "Sin residente",

            };

          }
        ) || [];

      setViviendas(
        viviendasFinales
      );

    };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarViviendas();

    }

  }, [usuario]);

  // 🔥 FILTRO

  const viviendasFiltradas =
    viviendas.filter((v) => {

      const texto =
        `
        ${v.codigo_vivienda || ""}
        ${v.estado || ""}
        ${v.residenteNombre || ""}
      `
          .toLowerCase();

      return texto.includes(
        busqueda.toLowerCase()
      );

    });

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
Código Vivienda,Estado,Residente
`;

      viviendasFiltradas.forEach(
        (v) => {

          contenido +=
            `
"${v.codigo_vivienda || ""}",
"${v.estado || ""}",
"${v.residenteNombre || ""}"
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

      link.setAttribute(
        "href",
        url
      );

      link.setAttribute(
        "download",
        "reporte_viviendas.csv"
      );

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

        }

      `}</style>

      <div
        style={{
          display: "flex",
          width: "100%",
          minHeight: "100vh",
          background: "#f5f7fa",
        }}
      >

        {/* 🔥 CONTENIDO */}

        <main
          style={{
            flex: 1,
            padding: 30,
width: "100%",
maxWidth: "100%",
overflowX: "auto",
boxSizing: "border-box",
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
                fontWeight: "bold",
              }}
            >
              INFORME GENERAL DE VIVIENDAS
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: 10,
              }}
            >
              Reporte ejecutivo general
              de viviendas registradas
              en la urbanización.
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
                fontSize: 14,
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
                    Código Vivienda
                  </th>

                  <th align="left">
                    Estado
                  </th>

                  <th align="left">
                    Residente
                  </th>

                </tr>

              </thead>

              <tbody>

                {viviendasFiltradas.map(
                  (v) => (

                    <tr
                      key={v.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >

                      <td>
                        {
                          v.codigo_vivienda || "-"
                        }
                      </td>

                      <td>
                        {v.estado || "-"}
                      </td>

                      <td>
                        {
                          v.residenteNombre
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
                fontSize: 22,
              }}
            >
              TOTAL VIVIENDAS:
              {" "}
              {viviendasFiltradas.length}
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