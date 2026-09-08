"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function EstadoCuenta() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [movimientos,
    setMovimientos] =
    useState<any[]>([]);

  const [residentes,
    setResidentes] =
    useState<any[]>([]);

  const [residenteSeleccionado,
    setResidenteSeleccionado] =
    useState("");

  // 🔥 TOTALES

  const [totalDeuda,
    setTotalDeuda] =
    useState(0);

  const [totalPagado,
    setTotalPagado] =
    useState(0);

  const [saldoPendiente,
    setSaldoPendiente] =
    useState(0);

  // 🔥 ROL

  const rol =
    (
      usuario?.rol || ""
    )
      .toUpperCase()
      .trim();

  // 🔥 INIT

  useEffect(() => {

    if (usuario?.condominio_id) {

      cargarResidentes();

      cargarEstadoCuenta();

    }

  }, [usuario]);

  // 🔥 RECARGAR AL CAMBIAR RESIDENTE

  useEffect(() => {

    if (
      rol === "ADMIN"
    ) {

      cargarEstadoCuenta();

    }

  }, [residenteSeleccionado]);

  // 🔥 RESIDENTES

  const cargarResidentes =
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
          "RESIDENTE"
        );

      if (error) {

        console.error(
          error
        );

        return;

      }

      setResidentes(
        data || []
      );

    };

  // 🔥 ESTADO CUENTA

  const cargarEstadoCuenta =
    async () => {

      let residenteId = "";

      // 🔥 RESIDENTE

      if (
        rol === "RESIDENTE"
      ) {

        const {
          data: residenteDB,
          error: errorResidente,
        } = await supabase
          .from("usuarios")
          .select("*")
          .eq(
            "email",
            usuario.email
          )
          .single();

        if (
          errorResidente ||
          !residenteDB
        ) {

          console.error(
            errorResidente
          );

          return;

        }

        residenteId =
          residenteDB.id;

      }

      // 🔥 CONSULTA DINÁMICA PAGOS

      let consultaPagos =
        supabase
          .from(
            "pagos_residentes"
          )
          .select("*")
          .eq(
            "condominio_id",
            usuario.condominio_id
          );

      // 🔥 ADMIN CON FILTRO

      if (
        rol === "ADMIN" &&
        residenteSeleccionado
      ) {

        consultaPagos =
          consultaPagos.eq(
            "residente_id",
            residenteSeleccionado
          );

      }

      // 🔥 RESIDENTE

      if (
        rol === "RESIDENTE"
      ) {

        consultaPagos =
          consultaPagos.eq(
            "residente_id",
            residenteId
          );

      }

      // 🔥 CONSULTAR PAGOS

      const {
        data: pagos,
        error: errorPagos,
      } = await consultaPagos;

      if (errorPagos) {

        console.error(
          errorPagos
        );

        return;

      }

      // 🔥 CONSULTA MOVIMIENTOS

      let consultaMovimientos =
        supabase
          .from(
            "movimientos_financieros"
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

      // 🔥 ADMIN CON FILTRO

      if (
        rol === "ADMIN" &&
        residenteSeleccionado
      ) {

        consultaMovimientos =
          consultaMovimientos.eq(
            "residente_id",
            residenteSeleccionado
          );

      }

      // 🔥 RESIDENTE

      if (
        rol === "RESIDENTE"
      ) {

        consultaMovimientos =
          consultaMovimientos.eq(
            "residente_id",
            residenteId
          );

      }

      // 🔥 CONSULTAR MOVIMIENTOS

      const {
        data: movimientosData,
        error: errorMovimientos,
      } = await consultaMovimientos;

      if (
        errorMovimientos
      ) {

        console.error(
          errorMovimientos
        );

        return;

      }

      setMovimientos(
        movimientosData || []
      );

      // 🔥 CALCULAR TOTALES

      let deuda = 0;

      let pagado = 0;

      let pendiente = 0;

      pagos?.forEach((p) => {

        // 🔥 IGNORAR ANULADOS

        if (
          p.estado ===
          "ANULADO"
        ) {

          return;

        }

        deuda +=
          Number(
            p.valor || 0
          );

        pagado +=
          Number(
            p.valor_pagado || 0
          );

        pendiente +=
          Number(
            p.saldo_pendiente || 0
          );

      });

      setTotalDeuda(
        deuda
      );

      setTotalPagado(
        pagado
      );

      setSaldoPendiente(
        pendiente
      );

    };

  // 🔒 VALIDACIONES

  if (loading) {

    return <p>Cargando...</p>;

  }

  return (

    <main
      style={{
        padding: 40,
        background:
          "#f5f7fa",
        minHeight:
          "100vh",
      }}
    >

      {/* 🔥 HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom: 30,
        }}
      >

        <h1
          style={{
            margin: 0,
          }}
        >
          Estado de Cuenta
        </h1>

        <button
          onClick={logout}
          style={{
            padding:
              "10px 16px",
            border: "none",
            borderRadius: 10,
            background:
              "#111827",
            color: "#fff",
            cursor:
              "pointer",
            fontWeight:
              "bold",
          }}
        >
          Cerrar sesión
        </button>

      </div>

      {/* 🔥 FILTRO ADMIN */}

      {rol === "ADMIN" && (

        <div
          style={{
            background:
              "#fff",
            padding: 20,
            borderRadius: 15,
            marginBottom: 30,
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >

          <h3>
            Filtrar residente
          </h3>

          <select
            value={
              residenteSeleccionado
            }
            onChange={(e) => {

              setResidenteSeleccionado(
                e.target.value
              );

            }}
            style={{
              width: 350,
              padding: 12,
              borderRadius: 10,
              border:
                "1px solid #ccc",
            }}
          >

            <option value="">
              Todos los residentes
            </option>

            {residentes.map((r) => (

              <option
                key={r.id}
                value={r.id}
              >
                {r.nombre}
                {" "}
                {r.apellido}
              </option>

            ))}

          </select>

        </div>

      )}

      {/* 🔥 KPIs */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
          marginBottom: 30,
        }}
      >

        <Card
          titulo="💰 Total deuda"
          valor={`$${totalDeuda.toFixed(2)}`}
        />

        <Card
          titulo="✅ Total pagado"
          valor={`$${totalPagado.toFixed(2)}`}
        />

        <Card
          titulo="⚠️ Saldo pendiente"
          valor={`$${saldoPendiente.toFixed(2)}`}
        />

      </div>

      {/* 🔥 MOVIMIENTOS */}

      <div
        style={{
          background:
            "#fff",
          padding: 25,
          borderRadius: 15,
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >

        <h2>
          Movimientos Financieros
        </h2>

        {movimientos.length === 0 ? (

          <p>
            No existen movimientos
          </p>

        ) : (

          movimientos.map((m) => (

            <div
              key={m.id}
              style={{
                border:
                  "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 20,
                marginTop: 15,
                background:
                  "#fafafa",
              }}
            >

              <b
                style={{
                  fontSize: 16,
                }}
              >
                {
                  m.tipo_movimiento
                }
              </b>

              <br />
              <br />

              <div>
                <b>
                  Descripción:
                </b>
                {" "}
                {m.descripcion}
              </div>

              <div>
                <b>
                  Valor:
                </b>
                {" "}
                $
                {Number(
                  m.valor || 0
                ).toFixed(2)}
              </div>

              <div>
                <b>
                  Fecha:
                </b>
                {" "}
                {
                  m.fecha_movimiento
                }
              </div>

            </div>

          ))

        )}

      </div>

    </main>

  );

}

// 🔥 CARD KPI

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: any;
}) {

  return (

    <div
      style={{
        background:
          "#fff",
        borderRadius: 15,
        padding: 25,
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >

      <h3
        style={{
          marginTop: 0,
          color: "#666",
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          fontSize: 34,
          fontWeight: "bold",
          marginBottom: 0,
          color: "#111827",
        }}
      >
        {valor}
      </p>

    </div>

  );

}