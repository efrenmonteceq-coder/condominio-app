"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Configuracion() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  // 🔥 CONFIGURACIÓN FINANCIERA

  const [alicuotaBase,
    setAlicuotaBase] =
    useState("");

  const [vencimientoDefecto,
    setVencimientoDefecto] =
    useState("");

  const [observacionFinanciera,
    setObservacionFinanciera] =
    useState("");

  // 🔥 INIT

  useEffect(() => {

    if (usuario?.condominio_id) {

      cargarConfiguracion();

    }

  }, [usuario]);

  // 🔥 CARGAR CONFIG

  const cargarConfiguracion =
    async () => {

    const {
      data,
      error,
    } = await supabase
      .from("condominios")
      .select("*")
      .eq(
        "id",
        usuario.condominio_id
      )
      .single();

    if (error || !data) {

      console.error(error);

      return;

    }

    setAlicuotaBase(
      data.alicuota_base || ""
    );

    setVencimientoDefecto(
      data.vencimiento_defecto || ""
    );

    setObservacionFinanciera(
      data.observacion_financiera || ""
    );

  };

  // 🔥 GUARDAR

  const guardarConfiguracion =
    async () => {

    const { error } =
      await supabase
        .from("condominios")
        .update({

          alicuota_base:
            Number(
              alicuotaBase
            ),

          vencimiento_defecto:
            vencimientoDefecto,

          observacion_financiera:
            observacionFinanciera,

        })
        .eq(
          "id",
          usuario.condominio_id
        );

    if (error) {

      console.error(error);

      alert(
        "Error guardando configuración"
      );

      return;

    }

    alert(
      "Configuración guardada correctamente"
    );

  };

  // 🔒 VALIDACIONES

  if (loading) {

    return (
      <p>
        Cargando...
      </p>
    );

  }

  if (
    usuario?.rol !== "ADMIN"
  ) {

    return (
      <p>
        No autorizado
      </p>
    );

  }

  return (

    <main
      style={{
        padding: 25,
        background:
          "#f3f4f6",
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
          flexWrap:
            "wrap",
          gap: 15,
          marginBottom: 30,
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: 36,
              color:
                "#111827",
            }}
          >
            Configuración
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
              fontSize: 15,
            }}
          >
            Parámetros generales y financieros del condominio
          </p>

        </div>

        <button
          onClick={logout}
          style={{
            background:
              "#dc2626",
            color:
              "#fff",
            border:
              "none",
            padding:
              "12px 18px",
            borderRadius: 14,
            cursor:
              "pointer",
            fontWeight:
              "bold",
            boxShadow:
              "0 6px 16px rgba(220,38,38,0.2)",
          }}
        >
          Cerrar sesión
        </button>

      </div>

      {/* 🔥 DASHBOARD */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
          marginBottom: 30,
        }}
      >

        <Card
          titulo="Alícuota Base"
          valor={`$${alicuotaBase || 0}`}
          icono="💰"
        />

        <Card
          titulo="Día Vencimiento"
          valor={
            vencimientoDefecto || "-"
          }
          icono="📅"
        />

        <Card
          titulo="Estado Sistema"
          valor="ACTIVO"
          icono="✅"
        />

      </div>

      {/* 🔥 CONFIG FINANCIERA */}

      <div
        style={{
          background:
            "#fff",
          borderRadius: 28,
          padding: 28,
          maxWidth: 900,
          boxShadow:
            "0 10px 24px rgba(0,0,0,0.06)",
          border:
            "1px solid #e5e7eb",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 14,
            marginBottom: 25,
          }}
        >

          <div
            style={{
              width: 70,
              height: 70,
              borderRadius:
                "50%",
              background:
                "linear-gradient(135deg,#2563eb,#1d4ed8)",
              display: "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              fontSize: 30,
              color:
                "#fff",
            }}
          >
            ⚙️
          </div>

          <div>

            <h2
              style={{
                margin: 0,
                color:
                  "#111827",
                fontSize: 28,
              }}
            >
              Configuración Financiera
            </h2>

            <p
              style={{
                marginTop: 6,
                color:
                  "#6b7280",
              }}
            >
              Administración de parámetros económicos y vencimientos
            </p>

          </div>

        </div>

        {/* 🔥 FORM */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
          }}
        >

          <div>

            <label
              style={labelStyle}
            >
              💰 Alícuota base
            </label>

            <input
              type="number"
              value={
                alicuotaBase
              }
              onChange={(e) =>
                setAlicuotaBase(
                  e.target.value
                )
              }
              style={inputStyle}
            />

          </div>

          <div>

            <label
              style={labelStyle}
            >
              📅 Día vencimiento
            </label>

            <input
              type="number"
              value={
                vencimientoDefecto
              }
              onChange={(e) =>
                setVencimientoDefecto(
                  e.target.value
                )
              }
              placeholder="Ejemplo: 10"
              style={inputStyle}
            />

          </div>

        </div>

        {/* 🔥 OBSERVACIONES */}

        <div
          style={{
            marginTop: 24,
          }}
        >

          <label
            style={labelStyle}
          >
            📝 Observaciones financieras
          </label>

          <textarea
            value={
              observacionFinanciera
            }
            onChange={(e) =>
              setObservacionFinanciera(
                e.target.value
              )
            }
            rows={6}
            style={{
              ...inputStyle,
              resize:
                "vertical",
              minHeight: 140,
            }}
          />

        </div>

        {/* 🔥 BOTON */}

        <div
          style={{
            marginTop: 28,
          }}
        >

          <button
            onClick={
              guardarConfiguracion
            }
            style={{
              background:
                "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color:
                "#fff",
              border:
                "none",
              padding:
                "16px 26px",
              borderRadius: 16,
              cursor:
                "pointer",
              fontWeight:
                "bold",
              fontSize: 15,
              boxShadow:
                "0 10px 20px rgba(37,99,235,0.25)",
            }}
          >
            Guardar Configuración
          </button>

        </div>

      </div>

    </main>

  );

}

// 🔥 KPI CARD

function Card({
  titulo,
  valor,
  icono,
}: any) {

  return (

    <div
      style={{
        background:
          "#fff",
        borderRadius: 24,
        padding: 22,
        boxShadow:
          "0 8px 20px rgba(0,0,0,0.06)",
        border:
          "1px solid #e5e7eb",
      }}
    >

      <div
        style={{
          fontSize: 28,
          marginBottom: 12,
        }}
      >
        {icono}
      </div>

      <div
        style={{
          color:
            "#6b7280",
          marginBottom: 8,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight:
            "bold",
          color:
            "#111827",
        }}
      >
        {valor}
      </div>

    </div>

  );

}

// 🔥 ESTILOS

const inputStyle = {

  width: "100%",

  padding:
    "14px 16px",

  borderRadius: 16,

  border:
    "1px solid #d1d5db",

  fontSize: 15,

  background:
    "#fff",

  marginTop: 8,

};

const labelStyle = {

  fontWeight:
    "bold",

  color:
    "#111827",

  fontSize: 14,

};