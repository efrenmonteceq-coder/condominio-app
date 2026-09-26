import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";
import BotonesComprobante from "../../components/BotonesComprobante";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ComprobanteOtrosIngresos({
  params,
}: PageProps) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id).trim();

  const { data: ingreso } = await supabase
    .from("movimientos_otros_ingresos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!ingreso) {
    return (
      <main style={styles.errorMain}>
        <div style={styles.errorCard}>
          <h1 style={styles.errorTitle}>Comprobante no encontrado</h1>
          <p style={styles.errorText}>
            El comprobante de otros ingresos solicitado no existe o ya no está
            disponible.
          </p>

          <div style={styles.errorNumber}>
            <b>Identificador solicitado:</b>
            <br />
            <br />
            {id}
          </div>
        </div>
      </main>
    );
  }

  const { data: condominio } = await supabase
    .from("condominios")
    .select("*")
    .eq("id", ingreso.condominio_id)
    .maybeSingle();

  const fecha = formatDate(ingreso.fecha_movimiento);

  const tipoDocumento =
    ingreso.tipo_documento || "COMPROBANTE INTERNO";

  const estado = String(ingreso.estado || "REGISTRADO").toUpperCase();

  const esInterno =
    String(ingreso.tipo_documento || "").toUpperCase() ===
      "COMPROBANTE_INTERNO" ||
    String(ingreso.modulo_origen || "").toUpperCase() ===
      "OTROS_INGRESOS";

  const subtotal = Number(ingreso.subtotal || 0);

  // Para un comprobante interno no se calcula ni se suma IVA,
  // aunque la fila tenga valores tributarios almacenados.
  const ivaPorcentaje = esInterno
    ? 0
    : Number(ingreso.iva_porcentaje || 0);

  const ivaValor = esInterno
    ? 0
    : Number(ingreso.iva_valor || 0);

  const total = esInterno
    ? subtotal
    : Number(ingreso.total ?? subtotal + ivaValor);

  const estilosPrint = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm;
      }

      html,
      body {
        width: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: visible !important;
      }

      body {
        font-size: 12px !important;
      }

      button,
      .receipt-actions {
        display: none !important;
      }

      main {
        width: 100% !important;
        min-height: 0 !important;
        height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
      }

      .comprobante-otros-ingresos {
        box-sizing: border-box !important;
        width: 100% !important;
        max-width: none !important;
        min-height: calc(100vh - 16mm) !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        zoom: 1 !important;
      }

      .receipt-header {
        padding: 14px 16px !important;
      }

      .receipt-header-top {
        gap: 10px !important;
      }

      .receipt-number-box {
        padding: 8px 12px !important;
      }

      .receipt-body {
        padding: 12px 14px !important;
      }

      .receipt-status {
        margin-bottom: 10px !important;
        gap: 6px !important;
      }

      .receipt-badge {
        padding: 4px 10px !important;
        font-size: 9px !important;
      }

      .receipt-notice {
        padding: 8px 10px !important;
        margin-bottom: 10px !important;
      }

      .receipt-notice .receipt-card-value,
      .receipt-notice div {
        line-height: 1.3 !important;
      }

      .receipt-section-title {
        font-size: 12px !important;
        margin-bottom: 6px !important;
        margin-top: 2px !important;
      }

      .receipt-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin-bottom: 10px !important;
      }

      .receipt-card {
        padding: 7px 8px !important;
        border-radius: 7px !important;
      }

      .receipt-card-label {
        font-size: 8px !important;
        margin-bottom: 3px !important;
      }

      .receipt-card-value {
        font-size: 10px !important;
        line-height: 1.25 !important;
      }

      .receipt-detail,
      .receipt-finance,
      .receipt-observation,
      .receipt-tax {
        padding: 10px !important;
        margin-bottom: 10px !important;
      }

      .receipt-detail h2,
      .receipt-finance h2,
      .receipt-tax h2 {
        font-size: 12px !important;
        margin-bottom: 6px !important;
      }

      .receipt-detail p,
      .receipt-observation div,
      .receipt-tax p {
        font-size: 10px !important;
        line-height: 1.3 !important;
      }

      .receipt-finance table {
        font-size: 10px !important;
      }

      .receipt-finance td {
        padding: 4px 0 !important;
      }

      .receipt-total {
        padding: 11px 12px !important;
        border-radius: 9px !important;
      }

      .receipt-total div:first-child {
        font-size: 9px !important;
        margin-bottom: 3px !important;
      }

      .receipt-total div:last-child {
        font-size: 24px !important;
      }

      .receipt-footer {
        margin-top: 8px !important;
        padding-top: 6px !important;
        font-size: 8px !important;
      }

      .receipt-print-hide {
        display: none !important;
      }

      *,
      *::before,
      *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        break-before: auto !important;
        break-after: auto !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  `;


  return (
    <main style={styles.main}>
      <style>{estilosPrint}</style>

      <div
        className="comprobante-otros-ingresos"
        style={styles.container}
      >
        {/* HEADER */}
        <div className="receipt-header" style={styles.header}>
          <div className="receipt-header-top" style={styles.headerTop}>
            <div>
              <div style={styles.headerKicker}>
                SISTEMA FINANCIERO RESIDENCIAL
              </div>

              <h1 style={styles.headerTitle}>
                {condominio?.nombre || "Condominio"}
              </h1>

              <p style={styles.headerSubtitle}>
                Comprobante de otros ingresos
              </p>
            </div>

            <div className="receipt-number-box" style={styles.numberBox}>
              <div style={styles.numberLabel}>NÚMERO</div>
              <div style={styles.numberValue}>
                {ingreso.numero_documento || ingreso.id}
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="receipt-body" style={styles.body}>
          {/* TIPO / ESTADO */}
          <div className="receipt-status" style={styles.statusRow}>
            <div className="receipt-badge" style={styles.internalBadge}>
              {esInterno
                ? "DOCUMENTO INTERNO"
                : "COMPROBANTE DE INGRESO"}
            </div>

            <div className="receipt-badge" style={styles.statusBadge}>
              ✓ {estado}
            </div>
          </div>

          {/* AVISO DOCUMENTO INTERNO */}
          {esInterno && (
            <div className="receipt-notice" style={styles.notice}>
              <div style={styles.noticeTitle}>
                COMPROBANTE INTERNO — NO ES FACTURA ELECTRÓNICA
              </div>

              <div style={styles.noticeText}>
                Este documento registra internamente un ingreso del
                condominio. No constituye factura electrónica ni comprobante
                tributario emitido por el SRI.
              </div>
            </div>
          )}

          {/* DATOS GENERALES */}
          <SectionTitle titulo="Datos del ingreso" />

          <div className="receipt-grid" style={styles.grid}>
            <Card
              titulo="Fecha"
              valor={fecha}
            />

            <Card
              titulo="Categoría"
              valor={ingreso.categoria || "-"}
            />

            <Card
              titulo="Subcategoría"
              valor={ingreso.subcategoria || "-"}
            />

            <Card
              titulo="Método de pago"
              valor={ingreso.metodo_pago || "-"}
            />

            <Card
              titulo="Tipo de documento"
              valor={tipoDocumento}
            />

            <Card
              titulo="Número de documento"
              valor={ingreso.numero_documento || "-"}
            />

            <Card
              titulo="Referencia"
              valor={ingreso.referencia || "-"}
            />

            <Card
              titulo="Módulo de origen"
              valor={ingreso.modulo_origen || "-"}
            />
          </div>

          {/* TERCERO */}
          <SectionTitle titulo="Datos del tercero" />

          <div className="receipt-grid" style={styles.grid}>
            <Card
              titulo="Nombre / razón social"
              valor={ingreso.nombre_tercero || "-"}
            />

            <Card
              titulo="Tipo de identificación"
              valor={ingreso.tipo_identificacion_tercero || "-"}
            />

            <Card
              titulo="Identificación"
              valor={ingreso.identificacion_tercero || "-"}
            />

            <Card
              titulo="Teléfono"
              valor={ingreso.telefono_tercero || "-"}
            />

            <Card
              titulo="Correo electrónico"
              valor={ingreso.email_tercero || "-"}
            />

            <Card
              titulo="Dirección"
              valor={ingreso.direccion_tercero || "-"}
            />
          </div>

          {/* CONCEPTO */}
          <div className="receipt-detail" style={styles.detailBox}>
            <h2 style={styles.detailTitle}>Detalle del ingreso</h2>

            <div style={styles.concepto}>
              <div style={styles.conceptoLabel}>CONCEPTO</div>
              <div style={styles.conceptoValue}>
                {ingreso.concepto || "-"}
              </div>
            </div>

            <div style={styles.description}>
              <div style={styles.descriptionLabel}>DESCRIPCIÓN</div>
              <div style={styles.descriptionValue}>
                {ingreso.descripcion || "Sin descripción adicional."}
              </div>
            </div>
          </div>

          {/* RESUMEN FINANCIERO */}
          <div className="receipt-finance" style={styles.financeBox}>
            <div style={styles.financeHeader}>
              Resumen financiero
            </div>

            <div style={styles.financeBody}>
              <table style={styles.table}>
                <tbody>
                  <Fila
                    concepto="Concepto"
                    valor={ingreso.concepto || "-"}
                  />

                  <Fila
                    concepto="Subtotal"
                    valor={money(subtotal)}
                  />

                  <Fila
                    concepto={esInterno ? "IVA" : `IVA (${ivaPorcentaje.toFixed(2)}%)`}
                    valor={money(ivaValor)}
                  />

                  <Fila
                    concepto="Total"
                    valor={money(total)}
                    strong
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* INFORMACIÓN TRIBUTARIA / SRI */}
          <div className={esInterno ? "receipt-tax receipt-print-hide" : "receipt-tax"} style={styles.taxBox}>
            <h2 style={styles.taxTitle}>
              Información tributaria / SRI
            </h2>

            <div className="receipt-grid" style={styles.grid}>
              <Card
                titulo="Autorización SRI"
                valor={ingreso.autorizacion_sri || "No aplica"}
              />

              <Card
                titulo="Clave de acceso SRI"
                valor={ingreso.clave_acceso_sri || "No aplica"}
              />

              <Card
                titulo="Tipo de documento"
                valor={tipoDocumento}
              />

              <Card
                titulo="Estado"
                valor={estado}
              />
            </div>

            {esInterno && (
              <p style={styles.taxNote}>
                Para un comprobante interno, los campos de autorización y
                clave de acceso SRI no aplican.
              </p>
            )}
          </div>

          {/* OBSERVACIÓN */}
          {ingreso.observacion && (
            <div className="receipt-observation" style={styles.observation}>
              <div style={styles.observationTitle}>Observación</div>
              <div style={styles.observationText}>
                {ingreso.observacion}
              </div>
            </div>
          )}

          {/* TOTAL */}
          <div className="receipt-total" style={styles.totalBox}>
            <div style={styles.totalLabel}>VALOR TOTAL DEL INGRESO</div>

            <div style={styles.totalValue}>
              {money(total)}
            </div>
          </div>

          {/* FOOTER */}
          <div className="receipt-footer" style={styles.footer}>
            <div>
              Documento generado automáticamente por el sistema financiero
              residencial.
            </div>

            <div style={styles.footerInternal}>
              {esInterno
                ? "Documento interno de control administrativo."
                : "Comprobante registrado en el módulo de otros ingresos."}
            </div>
          </div>

          {/* BOTONES */}
          <div className="receipt-actions">
            <BotonesComprobante />
          </div>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function SectionTitle({
  titulo,
}: {
  titulo: string;
}) {
  return (
    <div className="receipt-section-title" style={styles.sectionTitle}>
      {titulo}
    </div>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: unknown;
}) {
  return (
    <div className="receipt-card" style={styles.card}>
      <div className="receipt-card-label" style={styles.cardLabel}>{titulo}</div>

      <div className="receipt-card-value" style={styles.cardValue}>
        {String(valor ?? "-")}
      </div>
    </div>
  );
}

function Fila({
  concepto,
  valor,
  strong = false,
}: {
  concepto: string;
  valor: unknown;
  strong?: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          ...styles.cell,
          fontWeight: strong ? "bold" : "bold",
        }}
      >
        {concepto}
      </td>

      <td
        style={{
          ...styles.cellRight,
          fontWeight: strong ? "bold" : "normal",
        }}
      >
        {String(valor ?? "-")}
      </td>
    </tr>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    background: "#eef2ff",
    minHeight: "100vh",
    padding: 8,
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: 720,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
  },

  header: {
    background:
      "linear-gradient(135deg,#1e3a8a,#2563eb)",
    color: "#fff",
    padding: "16px 18px",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  headerKicker: {
    opacity: 0.9,
    marginBottom: 4,
    fontSize: 10,
  },

  headerTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
  },

  headerSubtitle: {
    marginTop: 4,
    marginBottom: 0,
    opacity: 0.9,
    fontSize: 11,
  },

  numberBox: {
    background: "rgba(255,255,255,0.15)",
    padding: "8px 12px",
    borderRadius: 10,
    textAlign: "right",
  },

  numberLabel: {
    fontSize: 9,
    marginBottom: 2,
  },

  numberValue: {
    fontWeight: "bold",
    fontSize: 13,
    maxWidth: 230,
    wordBreak: "break-word",
  },

  body: {
    padding: 16,
  },

  statusRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  internalBadge: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #f59e0b",
    padding: "5px 12px",
    borderRadius: 999,
    fontWeight: "bold",
    fontSize: 10,
  },

  statusBadge: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #16a34a",
    padding: "5px 12px",
    borderRadius: 999,
    fontWeight: "bold",
    fontSize: 10,
  },

  notice: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  noticeTitle: {
    color: "#92400e",
    fontWeight: "bold",
    fontSize: 11,
    marginBottom: 5,
  },

  noticeText: {
    color: "#78350f",
    fontSize: 11,
    lineHeight: 1.45,
  },

  sectionTitle: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 2,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: 8,
    marginBottom: 14,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 10,
    minWidth: 0,
  },

  cardLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  cardValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },

  detailBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    fontSize: 12,
  },

  detailTitle: {
    marginTop: 0,
    color: "#1e3a8a",
    fontSize: 14,
    marginBottom: 10,
  },

  concepto: {
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: 9,
    padding: 10,
    marginBottom: 8,
  },

  conceptoLabel: {
    color: "#6b7280",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },

  conceptoValue: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "bold",
  },

  description: {
    padding: "2px 0",
  },

  descriptionLabel: {
    color: "#6b7280",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },

  descriptionValue: {
    color: "#374151",
    fontSize: 11,
    lineHeight: 1.45,
  },

  financeBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },

  financeHeader: {
    background: "#111827",
    color: "#fff",
    padding: "10px 14px",
    fontWeight: "bold",
    fontSize: 13,
  },

  financeBody: {
    padding: "10px 14px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },

  cell: {
    padding: "7px 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
  },

  cellRight: {
    padding: "7px 0",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "right",
    color: "#111827",
  },

  taxBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  taxTitle: {
    marginTop: 0,
    color: "#374151",
    fontSize: 13,
    marginBottom: 10,
  },

  taxNote: {
    margin: "2px 0 0",
    color: "#6b7280",
    fontSize: 10,
    lineHeight: 1.4,
  },

  observation: {
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  observationTitle: {
    color: "#374151",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },

  observationText: {
    color: "#4b5563",
    fontSize: 11,
    lineHeight: 1.45,
  },

  totalBox: {
    background:
      "linear-gradient(135deg,#16a34a,#15803d)",
    borderRadius: 14,
    padding: "16px 14px",
    textAlign: "center",
    color: "#fff",
  },

  totalLabel: {
    opacity: 0.9,
    marginBottom: 4,
    fontSize: 11,
  },

  totalValue: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 1,
  },

  footer: {
    marginTop: 14,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 1.4,
    fontSize: 10,
  },

  footerInternal: {
    marginTop: 3,
    fontWeight: "bold",
  },

  errorMain: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    fontFamily: "Arial, sans-serif",
  },

  errorCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 22,
    maxWidth: 520,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
  },

  errorTitle: {
    color: "#dc2626",
    marginBottom: 10,
    fontSize: 22,
  },

  errorText: {
    color: "#6b7280",
    lineHeight: 1.5,
    fontSize: 13,
  },

  errorNumber: {
    marginTop: 14,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    overflowWrap: "anywhere",
  },
};
