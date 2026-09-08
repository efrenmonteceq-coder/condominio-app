"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Menu from "@/app/components/Menu";

export default function ReporteGastos() {

  const {
    usuario,
    loading,
  } = useAuth();

  const [gastos,
    setGastos] =
    useState<any[]>([]);

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 CARGAR GASTOS

  const cargarGastos =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from(
          "gastos_administrativos"
        )
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

      setGastos(data || []);

    };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarGastos();

    }

  }, [usuario]);

  // 🔥 FILTRO

  const gastosFiltrados =
    gastos.filter((g) => {

      const texto =
        `
        ${g.categoria || ""}
        ${g.proveedor || ""}
        ${g.ruc || ""}
        ${g.observacion || ""}
      `
          .toLowerCase();

      return texto.includes(
        busqueda.toLowerCase()
      );

    });

  // 🔥 TOTAL

  const totalGastos =

    gastosFiltrados.reduce(
      (acc, item) =>

        acc +
        Number(
          item.total || 0
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
Fecha,Categoría,Proveedor,RUC,Subtotal,IVA,Total,Observación
`;

      gastosFiltrados.forEach(
        (g) => {

          contenido +=
            `
"${g.fecha_gasto || ""}",
"${g.categoria || ""}",
"${g.proveedor || ""}",
"${g.ruc_proveedor || ""}",
"${Number(g.subtotal || 0).toFixed(2)}",
"${g.iva || ""}",
"${Number(g.total || 0).toFixed(2)}",
"${g.observacion || ""}"
`;

        }
      );

      contenido +=
        `
TOTAL GASTOS,,,,,,${totalGastos.toFixed(2)}
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
        "reporte_gastos.csv"
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
              INFORME GENERAL DE GASTOS
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: 10,
              }}
            >
              Reporte ejecutivo general
              de gastos administrativos
              registrados.
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
                    Fecha
                  </th>

                  <th align="left">
                    Categoría
                  </th>

                  <th align="left">
                    Proveedor
                  </th>

                  <th align="left">
                    RUC
                  </th>

                  <th align="left">
                    Subtotal
                  </th>

                  <th align="left">
                    IVA
                  </th>

                  <th align="left">
                    Total
                  </th>

                  <th align="left">
                    Observación
                  </th>

                </tr>

              </thead>

              <tbody>

                {gastosFiltrados.map(
                  (g) => (

                    <tr
                      key={g.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >

                      <td>
                        {g.fecha_gasto || "-"}
                      </td>

                      <td>
                        {g.categoria || "-"}
                      </td>

                      <td>
                        {g.proveedor || "-"}
                      </td>

                      <td>
                        {g.ruc_proveedor || "-"}
                      </td>

                      <td>
                        $
                        {Number(
                          g.subtotal || 0
                        ).toFixed(2)}
                      </td>

                      <td>
                        {g.iva || 0}%
                      </td>

                      <td>
                        $
                        {Number(
                          g.total || 0
                        ).toFixed(2)}
                      </td>

                      <td>
                        {
                          g.observacion || "-"
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
              TOTAL GASTOS:
              {" "}
              $
              {totalGastos.toFixed(2)}
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