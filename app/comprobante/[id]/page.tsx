import { supabase } from "@/lib/supabase";
import BotonesComprobante from "@/app/components/BotonesComprobante";

export default async function Comprobante({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const resolvedParams =
    await params;

  const numero =
    decodeURIComponent(
      resolvedParams.id
    ).trim();

  const {
    data: pago,
  } = await supabase
    .from("pagos_residentes")
    .select("*")
    .eq(
      "numero_comprobante",
      numero
    )
    .maybeSingle();

  if (!pago) {

    return (

      <main
        style={{
          minHeight:
            "100vh",
          background:
            "#f3f4f6",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          padding: 10,
          fontFamily:
            "Arial",
        }}
      >

        <div
          style={{
            background:
              "#fff",
            borderRadius: 14,
            padding: 22,
            maxWidth: 520,
            width: "100%",
            textAlign:
              "center",
            boxShadow:
              "0 8px 18px rgba(0,0,0,0.08)",
          }}
        >

          <h1
            style={{
              color:
                "#dc2626",
              marginBottom: 10,
              fontSize: 22,
            }}
          >
            Comprobante no encontrado
          </h1>

          <p
            style={{
              color:
                "#6b7280",
              lineHeight: 1.5,
              fontSize: 13,
            }}
          >
            El comprobante solicitado no existe
            o todavía no ha sido generado.
          </p>

          <div
            style={{
              marginTop: 14,
              background:
                "#f9fafb",
              border:
                "1px solid #e5e7eb",
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
            }}
          >

            <b>
              Número solicitado:
            </b>

            <br />
            <br />

            {numero}

          </div>

        </div>

      </main>

    );

  }

  const {
    data: residente
  } = await supabase
    .from("usuarios")
    .select("*")
    .eq(
      "id",
      pago.residente_id
    )
    .maybeSingle();

  const {
    data: vivienda
  } = await supabase
    .from("viviendas")
    .select("*")
    .eq(
      "id",
      pago.vivienda_id
    )
    .maybeSingle();

  const {
    data: condominio
  } = await supabase
    .from("condominios")
    .select("*")
    .eq(
      "id",
      pago.condominio_id
    )
    .maybeSingle();

  const estilosPrint = `
    @media print {

      button {
        display: none !important;
      }

      body {
        background: white !important;
      }

      main {
        padding: 0 !important;
      }

      * {
        page-break-inside: avoid !important;
      }

    }
  `;

  return (

    <main
      style={{
        background:
          "#eef2ff",
        minHeight:
          "100vh",
        padding: 8,
        fontFamily:
          "Arial",
      }}
    >

      <style>
        {estilosPrint}
      </style>

      <div
        style={{
          maxWidth: 720,
          margin:
            "0 auto",
          background:
            "#fff",
          borderRadius: 16,
          overflow:
            "hidden",
          boxShadow:
            "0 8px 22px rgba(0,0,0,0.08)",
        }}
      >

        {/* 🔥 HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#1e3a8a,#2563eb)",
            color:
              "#fff",
            padding:
              "16px 18px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              flexWrap:
                "wrap",
              gap: 8,
            }}
          >

            <div>

              <div
                style={{
                  opacity: 0.9,
                  marginBottom: 4,
                  fontSize: 10,
                }}
              >
                SISTEMA FINANCIERO RESIDENCIAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  lineHeight: 1.2,
                }}
              >
                {
                  condominio?.nombre ||
                  "Condominio"
                }
              </h1>

              <p
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  opacity: 0.9,
                  fontSize: 11,
                }}
              >
                Comprobante Oficial
              </p>

            </div>

            <div
              style={{
                background:
                  "rgba(255,255,255,0.15)",
                padding:
                  "8px 12px",
                borderRadius: 10,
                textAlign:
                  "right",
              }}
            >

              <div
                style={{
                  fontSize: 9,
                  marginBottom: 2,
                }}
              >
                NÚMERO
              </div>

              <div
                style={{
                  fontWeight:
                    "bold",
                  fontSize: 14,
                }}
              >
                {
                  pago.numero_comprobante
                }
              </div>

            </div>

          </div>

        </div>

        {/* 🔥 BODY */}

        <div
          style={{
            padding:
              "16px",
          }}
        >

          {/* 🔥 ESTADO */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              marginBottom: 14,
            }}
          >

            <div
              style={{
                background:
                  "#dcfce7",
                color:
                  "#166534",
                border:
                  "1px solid #16a34a",
                padding:
                  "5px 12px",
                borderRadius: 999,
                fontWeight:
                  "bold",
                fontSize: 11,
              }}
            >
              ✔ PAGO VALIDADO
            </div>

          </div>

          {/* 🔥 DATOS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: 8,
              marginBottom: 14,
            }}
          >

            <Card
              titulo="Residente"
              valor={`${residente?.nombre || ""} ${residente?.apellido || ""}`}
            />

            <Card
              titulo="Vivienda"
              valor={
                vivienda?.codigo_vivienda ||
                "-"
              }
            />

            <Card
              titulo="Periodo"
              valor={
                pago.periodo
              }
            />

            <Card
              titulo="Fecha"
              valor={
                pago.fecha_pago
              }
            />

            <Card
              titulo="Método"
              valor={
                pago.metodo_pago
              }
            />

            <Card
              titulo="Banco"
              valor={
                pago.banco || "-"
              }
            />

          </div>

          {/* 🔥 TABLA */}

          <div
            style={{
              background:
                "#f9fafb",
              border:
                "1px solid #e5e7eb",
              borderRadius: 12,
              overflow:
                "hidden",
              marginBottom: 14,
            }}
          >

            <div
              style={{
                background:
                  "#111827",
                color:
                  "#fff",
                padding:
                  "10px 14px",
                fontWeight:
                  "bold",
                fontSize: 13,
              }}
            >
              Resumen financiero
            </div>

            <div
              style={{
                padding:
                  "10px 14px",
              }}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  fontSize: 12,
                }}
              >

                <tbody>

                  <Fila
                    concepto="Concepto"
                    valor={
                      pago.tipo_pago
                    }
                  />

                  <Fila
                    concepto="Periodo"
                    valor={
                      pago.periodo
                    }
                  />

                  <Fila
                    concepto="Valor"
                    valor={`$${Number(
                      pago.valor || 0
                    ).toFixed(2)}`}
                  />

                  <Fila
                    concepto="Pagado"
                    valor={`$${Number(
                      pago.valor_pagado || 0
                    ).toFixed(2)}`}
                  />

                  <Fila
                    concepto="Saldo"
                    valor={`$${Number(
                      pago.saldo_pendiente || 0
                    ).toFixed(2)}`}
                  />

                </tbody>

              </table>

            </div>

          </div>

          {/* 🔥 DETALLE */}

          <div
            style={{
              background:
                "#eff6ff",
              border:
                "1px solid #bfdbfe",
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
              fontSize: 12,
            }}
          >

            <h2
              style={{
                marginTop: 0,
                color:
                  "#1e3a8a",
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              Detalle del pago
            </h2>

            <p
              style={{
                lineHeight: 1.4,
                marginBottom: 6,
              }}
            >

              Pago correspondiente a:

              {" "}

              <b>
                {
                  pago.tipo_pago
                }
              </b>

              {" "}

              período

              {" "}

              <b>
                {
                  pago.periodo
                }
              </b>

            </p>

            <p
              style={{
                marginBottom: 5,
              }}
            >

              <b>
                Referencia:
              </b>

              {" "}

              {
                pago.referencia_pago ||
                "-"
              }

            </p>

            <p
              style={{
                marginBottom: 0,
              }}
            >

              <b>
                Estado:
              </b>

              {" "}

              <span
                style={{
                  color:
                    "#16a34a",
                  fontWeight:
                    "bold",
                }}
              >
                PAGADO
              </span>

            </p>

          </div>

          {/* 🔥 TOTAL */}

          <div
            style={{
              background:
                "linear-gradient(135deg,#16a34a,#15803d)",
              borderRadius: 14,
              padding:
                "16px 14px",
              textAlign:
                "center",
              color:
                "#fff",
            }}
          >

            <div
              style={{
                opacity: 0.9,
                marginBottom: 4,
                fontSize: 11,
              }}
            >
              VALOR PAGADO
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight:
                  "bold",
                lineHeight: 1,
              }}
            >
              $
              {Number(
                pago.valor_pagado || 0
              ).toFixed(2)}
            </div>

          </div>

          {/* 🔥 FOOTER */}

          <div
            style={{
              marginTop: 14,
              borderTop:
                "1px solid #e5e7eb",
              paddingTop: 10,
              textAlign:
                "center",
              color:
                "#6b7280",
              lineHeight: 1.4,
              fontSize: 10,
            }}
          >

            Documento generado automáticamente por el sistema financiero residencial.

          </div>

          {/* 🔥 BOTONES */}

          <BotonesComprobante />

        </div>

      </div>

    </main>

  );

}

function Card({
  titulo,
  valor,
}: any) {

  return (

    <div
      style={{
        background:
          "#fff",
        border:
          "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 10,
      }}
    >

      <div
        style={{
          fontSize: 9,
          color:
            "#6b7280",
          marginBottom: 4,
          fontWeight:
            "bold",
          textTransform:
            "uppercase",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight:
            "bold",
          color:
            "#111827",
          lineHeight: 1.3,
        }}
      >
        {valor}
      </div>

    </div>

  );

}

function Fila({
  concepto,
  valor,
}: any) {

  return (

    <tr>

      <td
        style={{
          padding:
            "7px 0",
          borderBottom:
            "1px solid #e5e7eb",
          fontWeight:
            "bold",
          color:
            "#374151",
        }}
      >
        {concepto}
      </td>

      <td
        style={{
          padding:
            "7px 0",
          borderBottom:
            "1px solid #e5e7eb",
          textAlign:
            "right",
          color:
            "#111827",
        }}
      >
        {valor}
      </td>

    </tr>

  );

}