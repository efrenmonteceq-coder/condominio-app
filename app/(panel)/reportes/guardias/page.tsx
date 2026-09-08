"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Menu from "@/app/components/Menu";

export default function ReporteGuardias() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [guardias,
    setGuardias] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR GUARDIAS

  const cargarGuardias =
    async () => {

    const {
      data,
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
        "GUARDIA"
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

    setGuardias(data || []);

  };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarGuardias();

    }

  }, [usuario]);

  // 🔥 FILTRO

  const guardiasFiltrados =
    guardias.filter((g) => {

      const texto =
        `
        ${g.nombre || ""}
        ${g.apellido || ""}
        ${g.identificacion || ""}
        ${g.telefono || ""}
        ${g.email || ""}
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
Nombre Completo,Identificación,Teléfono,Email
`;

      guardiasFiltrados.forEach(
        (g) => {

          contenido +=
            `
"${g.nombre || ""} ${g.apellido || ""}",
"${g.identificacion || ""}",
"${g.telefono || ""}",
"${g.email || ""}"
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
        "reporte_guardias.csv"
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
              INFORME GENERAL DE GUARDIAS
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: 10,
              }}
            >
              Reporte ejecutivo general
              de guardias registrados
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

                </tr>

              </thead>

              <tbody>

                {guardiasFiltrados.map(
                  (g) => (

                    <tr
                      key={g.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >

                      {/* 🔥 NOMBRE */}

                      <td>
                        {g.nombre || ""}
                        {" "}
                        {g.apellido || ""}
                      </td>

                      {/* 🔥 IDENTIFICACIÓN */}

                      <td>
                        {
                          g.identificacion || "-"
                        }
                      </td>

                      {/* 🔥 TELÉFONO */}

                      <td>
                        {g.telefono || "-"}
                      </td>

                      {/* 🔥 EMAIL */}

                      <td>
                        {g.email || "-"}
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