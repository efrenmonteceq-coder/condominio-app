"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 4px 14px rgba(15,23,42,.06)",
};

function formatearFecha(fecha: any) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleString("es-EC");
}

export default function PagosComprobantesTecnico() {
  const [tecnico, setTecnico] = useState<any>(null);
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [pagos, setPagos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [banco, setBanco] = useState("");
  const [numeroTransferencia, setNumeroTransferencia] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const identificacion = usuario?.identificacion;

    if (!identificacion) {
      setCargando(false);
      return;
    }

    const { data: tecnicoDB } = await supabase
      .from("tecnicos")
      .select("*")
      .eq("cedula", identificacion)
      .single();

    if (!tecnicoDB) {
      setCargando(false);
      return;
    }

    setTecnico(tecnicoDB);

    const { data: config } = await supabase
      .from("configuracion_saas")
      .select("*")
      .eq("activo", true)
      .single();

    setConfiguracion(config);

    const { data: pagosDB } = await supabase
      .from("pagos_tecnicos")
      .select("*")
      .eq("tecnico_id", tecnicoDB.id)
      .order("fecha_pago", { ascending: false });

    setPagos(pagosDB || []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();

    const interval = setInterval(cargar, 3000);
    return () => clearInterval(interval);
  }, []);

  const subirComprobante = async () => {
    if (!archivo || !tecnico) {
      alert("Seleccione un comprobante");
      return;
    }

    if (!banco.trim()) {
      alert("Ingrese el banco desde donde realizó la transferencia");
      return;
    }

    if (!numeroTransferencia.trim()) {
      alert("Ingrese el número de transferencia");
      return;
    }

    try {
      setSubiendo(true);

      const nombreArchivo =
        `${tecnico.id}-${Date.now()}-${archivo.name}`;

      const { error: uploadError } = await supabase
        .storage
        .from("comprobantes-saas")
        .upload(nombreArchivo, archivo);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase
        .storage
        .from("comprobantes-saas")
        .getPublicUrl(nombreArchivo);

      const { error: insertError } = await supabase
        .from("pagos_tecnicos")
        .insert([{
          tecnico_id: tecnico.id,
          valor: 14,
          porcentaje_iva: 15,
          banco,
          numero_transferencia: numeroTransferencia,
          comprobante_url: data.publicUrl,
          fecha_pago: new Date(),
          estado: "PENDIENTE",
        }]);

      if (insertError) {
        throw insertError;
      }

      setArchivo(null);
      setBanco("");
      setNumeroTransferencia("");

      alert("Comprobante enviado correctamente");
      await cargar();
    } catch (error) {
      console.error(error);
      alert("Error al subir comprobante");
    } finally {
      setSubiendo(false);
    }
  };

  if (cargando) {
    return <p style={{ padding: 30 }}>Cargando...</p>;
  }

  if (!tecnico) {
    return <p style={{ padding: 30 }}>No autorizado</p>;
  }

  const tienePendiente = pagos.some(
    (p) => p.estado === "PENDIENTE"
  );

  const terminoBusqueda = busqueda.trim().toLowerCase();

  const pagosFiltrados = terminoBusqueda
    ? pagos.filter((p) => {
        const textoBusqueda = [
          p.estado,
          p.banco,
          p.numero_transferencia,
          p.valor,
          p.fecha_pago,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return textoBusqueda.includes(terminoBusqueda);
      })
    : mostrarHistorial
      ? pagos
      : pagos.slice(0, 2);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "30px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 5 }}>
            Ecosistema de Servicios
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              color: "#0f172a",
            }}
          >
            💳 Pagos y Comprobantes
          </h1>

          <p style={{ margin: "7px 0 0", color: "#64748b" }}>
            Consulta tu estado de cuenta y envía comprobantes de pago.
          </p>
        </div>

        <div style={{ ...card, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Estado de suscripción
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <strong style={{ fontSize: 18 }}>
              Plan Anual RENALIX — USD 14.00
            </strong>

            <span
              style={{
                padding: "6px 11px",
                borderRadius: 999,
                background:
                  tecnico.estado === "ACTIVO" ? "#dcfce7" : "#fef3c7",
                color:
                  tecnico.estado === "ACTIVO" ? "#166534" : "#92400e",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {tecnico.estado}
            </span>
          </div>

          <p style={{ color: "#64748b", marginBottom: 0 }}>
            IVA incluido.
          </p>
        </div>

        {tecnico.estado !== "ACTIVO" && (
          <div style={{ ...card, marginBottom: 18 }}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>
              Datos para realizar el pago
            </h2>

            {configuracion ? (
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  color: "#334155",
                }}
              >
                <div><b>Empresa:</b> {configuracion.empresa || "-"}</div>
                <div><b>Banco:</b> {configuracion.banco || "-"}</div>
                <div><b>Tipo de cuenta:</b> {configuracion.tipo_cuenta || "-"}</div>
                <div><b>Número de cuenta:</b> {configuracion.numero_cuenta || "-"}</div>
                <div><b>Titular:</b> {configuracion.titular_cuenta || "-"}</div>
                <div><b>Correo de cobros:</b> {configuracion.correo_cobros || "-"}</div>
              </div>
            ) : (
              <p style={{ color: "#64748b" }}>
                No se encontraron los datos de pago configurados.
              </p>
            )}
          </div>
        )}

        {tecnico.estado !== "ACTIVO" && (
          <div style={{ ...card, marginBottom: 18 }}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>
              Enviar comprobante
            </h2>

            {tienePendiente ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "#f0fdf4",
                  color: "#166534",
                  lineHeight: 1.6,
                }}
              >
                ✅ Ya existe un comprobante pendiente de revisión.
                <br />
                RENALIX revisará tu pago y actualizará el estado de tu
                suscripción.
              </div>
            ) : (
              <>
                <input
                  placeholder="Banco desde donde realizó la transferencia"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    width: "100%",
                    marginBottom: 10,
                    boxSizing: "border-box",
                  }}
                />

                <input
                  placeholder="Número de transferencia"
                  value={numeroTransferencia}
                  onChange={(e) =>
                    setNumeroTransferencia(e.target.value)
                  }
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    width: "100%",
                    marginBottom: 15,
                    boxSizing: "border-box",
                  }}
                />

                <label
                  style={{
                    display: "inline-block",
                    padding: "12px 20px",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  {archivo
                    ? "✅ Comprobante cargado"
                    : "📂 Cargar comprobante"}

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setArchivo(e.target.files?.[0] || null)
                    }
                  />
                </label>

                <button
                  onClick={subirComprobante}
                  disabled={subiendo}
                  style={{
                    display: "block",
                    marginTop: 15,
                    padding: "12px 20px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: subiendo ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {subiendo
                    ? "Subiendo..."
                    : "Enviar comprobante"}
                </button>
              </>
            )}
          </div>
        )}

        <div style={card}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Historial de pagos y comprobantes
          </h2>

          <input
            type="text"
            placeholder="🔎 Buscar por banco, transferencia, estado o valor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              border: "1px solid #d1d5db",
              boxSizing: "border-box",
            }}
          />

          {!terminoBusqueda && (
            <button
              type="button"
              onClick={() => setMostrarHistorial((v) => !v)}
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #dbe3ea",
                background: "#fff",
                color: "#172033",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {mostrarHistorial
                ? "⬆️ Ver solo los 2 últimos"
                : "📂 Ver historial completo"}
            </button>
          )}

          {pagos.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              Todavía no tienes pagos registrados.
            </p>
          ) : pagosFiltrados.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No se encontraron pagos con esa búsqueda.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {pagosFiltrados.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 15,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>
                      USD {Number(p.valor || 0).toFixed(2)}
                    </strong>

                    <span style={{ fontWeight: 700 }}>
                      {p.estado || "-"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 9,
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    <div>
                      <b>Fecha:</b> {formatearFecha(p.fecha_pago)}
                    </div>
                    <div>
                      <b>Banco:</b> {p.banco || "-"}
                    </div>
                    <div>
                      <b>Transferencia:</b>{" "}
                      {p.numero_transferencia || "-"}
                    </div>

                    {p.comprobante_url && (
                      <div style={{ marginTop: 7 }}>
                        <a
                          href={p.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#2563eb",
                            fontWeight: 700,
                          }}
                        >
                          📄 Ver comprobante
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 22 }}>
          <Link
            href="/panel-tecnico"
            style={{
              textDecoration: "none",
              color: "#2563eb",
              fontWeight: 700,
            }}
          >
            ← Volver al Panel Técnico
          </Link>
        </div>
      </div>
    </main>
  );
}
