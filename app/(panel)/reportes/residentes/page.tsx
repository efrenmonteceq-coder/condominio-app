"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Menu from "@/app/components/Menu";

export default function ReporteResidentes() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [residentes,
    setResidentes] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR RESIDENTES

  const cargarResidentes =
    async () => {

    // 🔥 RESIDENTES

    const {
      data: residentesData,
      error,
    } = await supabase
      .from("usuarios")
      .select("*")
      .eq(
        "condominio_id",
        usuario.condominio_id
      )
      .eq(
        "rol",
        "RESIDENTE"
      )
      .order(
        "nombre",
        {
          ascending: true,
        }
      );

    if (error) {

      console.error(error);

      return;

    }

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

    const residentesFinales =

      residentesData?.map(
        (r) => {

          // 🔥 BUSCAR VIVIENDA

          const vivienda =
            viviendasData?.find(
              (v) =>

                v.residente_id ===
                r.id

            );

          return {

            ...r,

            manzanaVilla:

             vivienda?.codigo_vivienda || "-",

          };

        }
      ) || [];

    setResidentes(
      residentesFinales
    );

  };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarResidentes();

    }

  }, [usuario]);

  // 🔥 FILTRO

  const residentesFiltrados =
    residentes.filter((r) => {

      const texto =
        `
        ${r.nombre || ""}
        ${r.apellido || ""}
        ${r.identificacion || ""}
        ${r.telefono || ""}
        ${r.email || ""}
        ${r.manzanaVilla || ""}
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
Nombre Completo,Identificación,Teléfono,Email,Manzana Villa
`;

      residentesFiltrados.forEach(
        (r) => {

          contenido +=
            `
"${r.nombre || ""} ${r.apellido || ""}",
"${r.identificacion || ""}",
"${r.telefono || ""}",
"${r.email || ""}",
"${r.manzanaVilla || ""}"
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
        "reporte_residentes.csv"
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
              INFORME GENERAL DE RESIDENTES
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: 10,
              }}
            >
              Reporte ejecutivo general
              de residentes registrados
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
                    Nombre Completo
                  </th>

                  <th align="left">
                    Identificación
                  </th>

                  <th align="left">
                    Teléfono
                  </th>

                  <th align="left">
                    Email
                  </th>

                  <th align="left">
                    Manzana / Villa
                  </th>

                </tr>

              </thead>

              <tbody>

                {residentesFiltrados.map(
                  (r) => (

                    <tr
                      key={r.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >

                      {/* 🔥 NOMBRE */}

                      <td>
                        {r.nombre || ""}
                        {" "}
                        {r.apellido || ""}
                      </td>

                      {/* 🔥 IDENTIFICACIÓN */}

                      <td>
                        {
                          r.identificacion || "-"
                        }
                      </td>

                      {/* 🔥 TELÉFONO */}

                      <td>
                        {r.telefono || "-"}
                      </td>

                      {/* 🔥 EMAIL */}

                      <td>
                        {r.email || "-"}
                      </td>

                      {/* 🔥 MANZANA VILLA */}

                      <td>
                        {
                          r.manzanaVilla
                        }
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

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