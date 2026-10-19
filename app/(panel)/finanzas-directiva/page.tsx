"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Pago = {
  estado?: string | null;
  fecha_vencimiento?: string | null;
  condominio_id?: string | null;
  saldo_pendiente?: number | string | null;
  valor?: number | string | null;
  valor_pagado?: number | string | null;
};

type MovimientoMensual = {
  mes?: string | null;
  ingresos_alicuotas?: number | string | null;
  otros_ingresos?: number | string | null;
  egresos?: number | string | null;
};

const OPCIONES_PERIODO = [
  { valor: "mes", etiqueta: "Por mes" },
  { valor: "trimestre", etiqueta: "Por trimestre" },
  { valor: "semestre", etiqueta: "Por semestre" },
  { valor: "anio", etiqueta: "Año completo" },
  { valor: "personalizado", etiqueta: "Rango personalizado" },
];

function formatoMes(mes: string) {
  if (!mes) return "Sin información";
  const [anio, numero] = mes.split("-");
  const fecha = new Date(Number(anio), Number(numero) - 1, 1);
  return fecha.toLocaleDateString("es-EC", {
    month: "long",
    year: "numeric",
  });
}

export default function FinanzasDirectiva() {
  const { usuario, loading } = useAuth();

  const [movimientosMensuales, setMovimientosMensuales] = useState<MovimientoMensual[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mesReferencia, setMesReferencia] = useState("");
  const [tipoPeriodo, setTipoPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorCartera, setErrorCartera] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!usuario?.condominio_id) {
      setMovimientosMensuales([]);
      setPagos([]);
      setCargando(false);
      return;
    }

    let activo = true;

    const cargarFinanzas = async () => {
      setCargando(true);
      setErrorCarga("");
      setErrorCartera("");

      // La transparencia mensual es la misma fuente que utiliza el Dashboard Ejecutivo.
      const [resumen, pagosResult] = await Promise.all([
        supabase.rpc("transparencia_financiera_mensual"),
        supabase
          .from("pagos_residentes")
          .select("*")
          .eq("condominio_id", usuario.condominio_id),
      ]);

      if (!activo) return;

      if (resumen.error) {
        console.error("Error cargando transparencia financiera para DIRECTIVA:", resumen.error);
        setErrorCarga("No se pudo cargar el resumen financiero. Verifica la función de transparencia financiera.");
        setMovimientosMensuales([]);
      } else {
        setMovimientosMensuales((resumen.data || []) as MovimientoMensual[]);
      }

      if (pagosResult.error) {
        console.error("Error cargando cartera vencida para DIRECTIVA:", pagosResult.error);
        setErrorCartera("No se pudo consultar la cartera vencida. No se mostrará cero como si no existieran deudas; revisa el error de consulta en la consola.");
        setPagos([]);
      } else {
        setPagos((pagosResult.data || []) as Pago[]);
      }

      setCargando(false);
    };

    cargarFinanzas();

    return () => {
      activo = false;
    };
  }, [loading, usuario?.condominio_id]);

  // Normalizamos los importes mensuales usando la misma fórmula del Dashboard.
  const resumenMensual = useMemo(() => {
    let acumulado = 0;

    return movimientosMensuales
      .map((fila) => {
        const mes = String(fila.mes || "").slice(0, 7);
        const ingresosAlicuotas = Number(fila.ingresos_alicuotas || 0);
        const otrosIngresos = Number(fila.otros_ingresos || 0);
        const egresos = Number(fila.egresos || 0);
        const ingresos = ingresosAlicuotas + otrosIngresos;
        const resultado = ingresos - egresos;

        acumulado += resultado;

        return {
          mes,
          ingresos,
          ingresosAlicuotas,
          otrosIngresos,
          egresos,
          resultado,
          saldoAcumulado: acumulado,
        };
      })
      .filter((fila) => /^\d{4}-\d{2}$/.test(fila.mes))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [movimientosMensuales]);

  const meses = useMemo(
    () => resumenMensual.map((fila) => fila.mes),
    [resumenMensual]
  );

  useEffect(() => {
    if (!meses.length) {
      setMesReferencia("");
      return;
    }

    setMesReferencia((actual) =>
      actual && meses.includes(actual) ? actual : meses[meses.length - 1]
    );
  }, [meses]);

  const informacion = useMemo(() => {
    let inicio = mesReferencia;
    let fin = mesReferencia;

    if (/^\d{4}-\d{2}$/.test(mesReferencia)) {
      const [anio, numeroMes] = mesReferencia.split("-").map(Number);

      if (tipoPeriodo === "trimestre") {
        const mesInicio = Math.floor((numeroMes - 1) / 3) * 3 + 1;
        inicio = `${anio}-${String(mesInicio).padStart(2, "0")}`;
        fin = `${anio}-${String(mesInicio + 2).padStart(2, "0")}`;
      } else if (tipoPeriodo === "semestre") {
        inicio = `${anio}-${numeroMes <= 6 ? "01" : "07"}`;
        fin = `${anio}-${numeroMes <= 6 ? "06" : "12"}`;
      } else if (tipoPeriodo === "anio") {
        inicio = `${anio}-01`;
        fin = `${anio}-12`;
      }
    }

    if (tipoPeriodo === "personalizado") {
      inicio = fechaInicio;
      fin = fechaFin;
    }

    const rangoValido =
      /^\d{4}-\d{2}$/.test(inicio) &&
      /^\d{4}-\d{2}$/.test(fin) &&
      inicio <= fin;

    const detalleMensual = rangoValido
      ? resumenMensual.filter((fila) => fila.mes >= inicio && fila.mes <= fin)
      : [];

    const filaAnterior = resumenMensual
      .filter((fila) => fila.mes < inicio)
      .slice(-1)[0];
    const saldoInicial = filaAnterior?.saldoAcumulado || 0;
    const ingresos = detalleMensual.reduce((total, fila) => total + fila.ingresos, 0);
    const ingresosAlicuotas = detalleMensual.reduce((total, fila) => total + fila.ingresosAlicuotas, 0);
    const otrosIngresos = detalleMensual.reduce((total, fila) => total + fila.otrosIngresos, 0);
    const egresos = detalleMensual.reduce((total, fila) => total + fila.egresos, 0);
    const resultado = ingresos - egresos;
    const ultimoMes = detalleMensual[detalleMensual.length - 1];
    const saldoAcumulado = ultimoMes?.saldoAcumulado ?? saldoInicial;

    const etiquetaPeriodo = tipoPeriodo === "personalizado"
      ? (fechaInicio && fechaFin ? `${fechaInicio} al ${fechaFin}` : "Selecciona las fechas")
      : inicio && fin && inicio !== fin
        ? `${formatoMes(inicio)} – ${formatoMes(fin)}`
        : formatoMes(inicio);

    // Cartera vencida: sumar el saldo real pendiente de cada alícuota cuyo
    // vencimiento sea anterior o igual al cierre del período seleccionado.
    // Se compara por mes para que incluya todas las alícuotas vencidas hasta ese cierre.
    const cierreCartera = fin || mesReferencia;
    const carteraVencida = pagos.reduce((total, pago) => {
      const fechaVencimiento = String(pago.fecha_vencimiento || "").slice(0, 10);
      const mesVencimiento = fechaVencimiento.slice(0, 7);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento) || !cierreCartera || mesVencimiento > cierreCartera) {
        return total;
      }

      const estado = String(pago.estado || "").trim().toUpperCase();
      if (estado === "ANULADO") return total;

      // El saldo_pendiente es la cifra que utiliza el Estado de Cuenta.
      // Si no viene informado, derivarlo del valor menos lo pagado.
      const saldoInformado = pago.saldo_pendiente;
      const saldo = saldoInformado !== null && saldoInformado !== undefined && String(saldoInformado).trim() !== ""
        ? Number(saldoInformado)
        : Math.max(0, Number(pago.valor || 0) - Number(pago.valor_pagado || 0));

      if (!Number.isFinite(saldo) || saldo <= 0) return total;
      // No contar como deuda un registro marcado PAGADO si tiene saldo inconsistente.
      if (estado === "PAGADO" && saldo <= 0) return total;

      return total + saldo;
    }, 0);

    return {
      inicio,
      fin,
      detalleMensual,
      ingresos,
      ingresosAlicuotas,
      otrosIngresos,
      egresos,
      resultado,
      saldoInicial,
      saldoAcumulado,
      etiquetaPeriodo,
      carteraVencida,
    };
  }, [resumenMensual, mesReferencia, tipoPeriodo, fechaInicio, fechaFin, pagos]);

  const tarjeta = (
    titulo: string,
    valor: string,
    color: string,
    descripcion?: string
  ) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 22,
        borderTop: `4px solid ${color}`,
        boxShadow: "0 4px 14px rgba(15,23,42,0.07)",
      }}
    >
      <div
        style={{
          color: "#475569",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          color,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {valor}
      </div>
      {descripcion && (
        <div
          style={{
            marginTop: 6,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          {descripcion}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1250,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              marginBottom: 6,
              color: "#0f172a",
            }}
          >
            💰 Resumen Financiero
          </h1>
          <div
            style={{
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Resumen financiero mensual de la urbanización.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          <label
            htmlFor="mes-referencia-directiva"
            style={{ color: "#475569", fontSize: 13, fontWeight: 700 }}
          >
            Mes de referencia:
          </label>

          <button
            type="button"
            onClick={() => {
              const indice = meses.indexOf(mesReferencia);
              if (indice > 0) setMesReferencia(meses[indice - 1]);
            }}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              borderRadius: 10,
              padding: "9px 12px",
              cursor: "pointer",
            }}
          >
            ←
          </button>

          <select
            id="mes-referencia-directiva"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            style={{
              minWidth: 190,
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "10px 12px",
              background: "#fff",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {!meses.length ? (
              <option value="">Sin información</option>
            ) : (
              meses.map((mesItem) => (
                <option key={mesItem} value={mesItem}>
                  {formatoMes(mesItem)}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={() => {
              const indice = meses.indexOf(mesReferencia);
              if (indice >= 0 && indice < meses.length - 1) {
                setMesReferencia(meses[indice + 1]);
              }
            }}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              borderRadius: 10,
              padding: "9px 12px",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>

      <div
        style={{
          margin: "10px 0 14px",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 10,
          background: "#fff",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={() => setSelectorAbierto((abierto) => !abierto)}
          aria-expanded={selectorAbierto}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 10,
            border: 0,
            background: "transparent",
            padding: "5px 2px",
            color: "#0f172a",
            fontWeight: 700,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span>
            Período de consulta: {OPCIONES_PERIODO.find((opcion) => opcion.valor === tipoPeriodo)?.etiqueta || "Por mes"}
          </span>
          <span aria-hidden="true">{selectorAbierto ? "▴" : "▾"}</span>
        </button>

        {selectorAbierto && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginTop: 10 }}>
            {OPCIONES_PERIODO.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={tipoPeriodo === opcion.valor}
                onClick={() => {
                  setTipoPeriodo(opcion.valor);
                  if (opcion.valor !== "personalizado") {
                    setFechaInicio("");
                    setFechaFin("");
                  }
                  setSelectorAbierto(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 12px",
                  border: tipoPeriodo === opcion.valor ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                  borderRadius: 9,
                  background: tipoPeriodo === opcion.valor ? "#eff6ff" : "#fff",
                  color: "#0f172a",
                  fontWeight: tipoPeriodo === opcion.valor ? 700 : 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>{opcion.etiqueta}</span>
                {tipoPeriodo === opcion.valor && <span aria-hidden="true">✓</span>}
              </button>
            ))}

            {tipoPeriodo === "personalizado" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginTop: 6 }}>
                <label style={{ fontSize: 13, color: "#475569" }}>
                  Desde mes
                  <input
                    type="month"
                    value={fechaInicio}
                    onChange={(e) => {
                      const nuevoInicio = e.target.value;
                      setFechaInicio(nuevoInicio);
                      if (fechaFin && nuevoInicio && fechaFin < nuevoInicio) setFechaFin("");
                    }}
                    style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 4, border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 8px", background: "#fff", color: "#0f172a" }}
                  />
                </label>
                <label style={{ fontSize: 13, color: "#475569" }}>
                  Hasta mes
                  <input
                    type="month"
                    min={fechaInicio || undefined}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 4, border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 8px", background: "#fff", color: "#0f172a" }}
                  />
                </label>
                {(!fechaInicio || !fechaFin) && (
                  <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#64748b" }}>
                    Selecciona el mes inicial y el mes final para consultar el rango.
                  </div>
                )}
              </div>
            )}

            {tipoPeriodo !== "personalizado" && (
              <div style={{ fontSize: 12, color: "#64748b", padding: "4px 2px" }}>
                Elige el mes de referencia para definir el período.
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginBottom: 20,
          color: "#475569",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Período: {informacion.etiquetaPeriodo}
      </div>

      {cargando ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 30,
            color: "#64748b",
          }}
        >
          Cargando información financiera...
        </div>
      ) : (
        <>
        {errorCarga ? (
          <div
            role="alert"
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 12,
              padding: 16,
              color: "#9a3412",
            }}
          >
            {errorCarga}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 20,
              }}
            >
              {tarjeta(
                "💰 Ingresos del período",
                `$${informacion.ingresos.toFixed(2)}`,
                "#16a34a",
                `Alícuotas: $${informacion.ingresosAlicuotas.toFixed(2)} · Otros ingresos: $${informacion.otrosIngresos.toFixed(2)}`
              )}

              {tarjeta(
                "🧾 Gastos del período",
                `$${informacion.egresos.toFixed(2)}`,
                "#dc2626"
              )}

              {tarjeta(
                "📊 Resultado del período",
                `$${informacion.resultado.toFixed(2)}`,
                informacion.resultado >= 0 ? "#16a34a" : "#dc2626",
                "Ingresos menos gastos del período."
              )}

              {tarjeta(
                "📊 Saldo acumulado",
                `$${informacion.saldoAcumulado.toFixed(2)}`,
                "#2563eb",
                "Resultado acumulado hasta el período seleccionado."
              )}

              {tarjeta(
                "🔴 Cartera vencida",
                errorCartera ? "—" : `$${informacion.carteraVencida.toFixed(2)}`,
                "#dc2626",
                errorCartera || "Importe total de saldos pendientes vencidos al cierre del período."
              )}
            </div>

            <details
              style={{
                marginTop: 16,
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 12,
                background: "#fff",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#334155" }}>
                Ver detalle mes a mes
              </summary>
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
                  <thead>
                    <tr>
                      {["Mes", "Ingresos", "Gastos", "Resultado", "Saldo acumulado"].map((titulo) => (
                        <th
                          key={titulo}
                          style={{ textAlign: titulo === "Mes" ? "left" : "right", padding: 8, borderBottom: "1px solid #cbd5e1", color: "#475569" }}
                        >
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {informacion.detalleMensual.map((fila) => (
                      <tr key={fila.mes}>
                        <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{formatoMes(fila.mes)}</td>
                        <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>${fila.ingresos.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>${fila.egresos.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>${fila.resultado.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>${fila.saldoAcumulado.toFixed(2)}</td>
                      </tr>
                    ))}
                    {informacion.detalleMensual.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 10, color: "#64748b" }}>
                          No hay movimientos mensuales para el período seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
        </>
      )}
    </div>
  );
}
