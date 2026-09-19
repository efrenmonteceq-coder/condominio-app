"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Pago = {
  estado?: string | null;
  valor_pagado?: number | string | null;
  valor?: number | string | null;
  fecha_pago?: string | null;
  fecha_vencimiento?: string | null;
  condominio_id?: string | null;
};

type Gasto = {
  total?: number | string | null;
  fecha_gasto?: string | null;
  condominio_id?: string | null;
};

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

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mes, setMes] = useState("");

  useEffect(() => {
    if (loading || !usuario?.condominio_id) return;

    const cargarFinanzas = async () => {
      setCargando(true);

      const [{ data: pagosData }, { data: gastosData }] =
        await Promise.all([
          supabase
            .from("pagos_residentes")
            .select("*")
            .eq("condominio_id", usuario.condominio_id),
          supabase
            .from("gastos_administrativos")
            .select("*")
            .eq("condominio_id", usuario.condominio_id),
        ]);

      setPagos((pagosData || []) as Pago[]);
      setGastos((gastosData || []) as Gasto[]);
      setCargando(false);
    };

    cargarFinanzas();
  }, [loading, usuario?.condominio_id]);

  const meses = useMemo(() => {
    const encontrados = new Set<string>();

    pagos.forEach((pago) => {
      if (pago.fecha_pago) {
        encontrados.add(pago.fecha_pago.slice(0, 7));
      }
      if (pago.fecha_vencimiento) {
        encontrados.add(pago.fecha_vencimiento.slice(0, 7));
      }
    });

    gastos.forEach((gasto) => {
      if (gasto.fecha_gasto) {
        encontrados.add(gasto.fecha_gasto.slice(0, 7));
      }
    });

    const mesesEncontrados = Array.from(encontrados).sort();

    // Mantener el selector mensual continuo hasta el mes actual,
    // aunque un mes todavía no tenga movimientos registrados.
    if (mesesEncontrados.length) {
      const inicio = mesesEncontrados[0];
      const hoy = new Date();
      const fin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

      const resultado: string[] = [];
      const [anioInicio, mesInicio] = inicio.split("-").map(Number);
      let cursor = new Date(anioInicio, mesInicio - 1, 1);
      const fechaFin = new Date(
        Number(fin.slice(0, 4)),
        Number(fin.slice(5, 7)) - 1,
        1
      );

      while (cursor <= fechaFin) {
        resultado.push(
          `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
        );
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }

      return resultado;
    }

    return [];
  }, [pagos, gastos]);

  useEffect(() => {
    if (!meses.length) return;

    setMes((actual) =>
      actual && meses.includes(actual) ? actual : meses[meses.length - 1]
    );
  }, [meses]);

  const informacion = useMemo(() => {
    const indiceMes = meses.indexOf(mes);

    const ingresosPorMes = meses.map((mesActual) =>
      pagos.reduce((total, pago) => {
        if (
          pago.estado === "PAGADO" &&
          pago.fecha_pago?.slice(0, 7) === mesActual
        ) {
          return total + Number(pago.valor_pagado || 0);
        }
        return total;
      }, 0)
    );

    const gastosPorMes = meses.map((mesActual) =>
      gastos.reduce((total, gasto) => {
        if (gasto.fecha_gasto?.slice(0, 7) === mesActual) {
          return total + Number(gasto.total || 0);
        }
        return total;
      }, 0)
    );

    const ingresosDelMes =
      indiceMes >= 0 ? ingresosPorMes[indiceMes] || 0 : 0;
    const gastosDelMes =
      indiceMes >= 0 ? gastosPorMes[indiceMes] || 0 : 0;

    const saldoAcumulado = meses
      .slice(0, indiceMes + 1)
      .reduce(
        (saldo, _, indice) =>
          saldo + ingresosPorMes[indice] - gastosPorMes[indice],
        0
      );

    const pagosVencidos = pagos.filter((pago) => {
      if (!pago.fecha_vencimiento || pago.estado === "PAGADO") return false;
      return (
        pago.fecha_vencimiento.slice(0, 7) <= mes
      );
    }).length;

    return {
      ingresosDelMes,
      gastosDelMes,
      resultado: ingresosDelMes - gastosDelMes,
      saldoAcumulado,
      pagosVencidos,
    };
  }, [mes, meses, pagos, gastos]);

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
          }}
        >
          <button
            type="button"
            disabled={
              !mes || meses.indexOf(mes) <= 0
            }
            onClick={() => {
              const indice = meses.indexOf(mes);
              if (indice > 0) setMes(meses[indice - 1]);
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
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            disabled={!meses.length}
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
            disabled={
              !mes ||
              meses.indexOf(mes) === meses.length - 1
            }
            onClick={() => {
              const indice = meses.indexOf(mes);
              if (
                indice >= 0 &&
                indice < meses.length - 1
              ) {
                setMes(meses[indice + 1]);
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
          marginBottom: 20,
          color: "#475569",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Período: {mes ? formatoMes(mes) : "Sin información"}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 20,
          }}
        >
          {tarjeta(
            "💰 Recaudado del mes",
            `$${informacion.ingresosDelMes.toFixed(2)}`,
            "#16a34a"
          )}

          {tarjeta(
            "🧾 Gastos del mes",
            `$${informacion.gastosDelMes.toFixed(2)}`,
            "#dc2626"
          )}

          {tarjeta(
            "📊 Resultado del mes",
            `$${informacion.resultado.toFixed(2)}`,
            informacion.resultado >= 0
              ? "#16a34a"
              : "#dc2626"
          )}

          {tarjeta(
            "📊 Saldo acumulado",
            `$${informacion.saldoAcumulado.toFixed(2)}`,
            "#2563eb"
          )}

          {tarjeta(
            "🔴 Cartera Vencida",
            String(informacion.pagosVencidos),
            "#dc2626",
            "Pagos pendientes vencidos al período seleccionado."
          )}
        </div>
      )}
    </div>
  );
}