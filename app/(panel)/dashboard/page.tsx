"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";


export default function Dashboard() {

  const router =
    useRouter();

  const {
    usuario,
    loading,
  } = useAuth();

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 KPIs

  const [viviendas,
    setViviendas] =
    useState(0);

  const [residentes,
    setResidentes] =
    useState(0);

  const [guardias,
    setGuardias] =
    useState(0);

  const [novedades,
    setNovedades] =
    useState(0);

  const [pagosPendientes,
    setPagosPendientes] =
    useState(0);

  const [pagosVencidos,
    setPagosVencidos] =
    useState(0);

  const [pagosValidar,
    setPagosValidar] =
    useState(0);

  const [recaudado,
    setRecaudado] =
    useState(0);

  const [gastos,
    setGastos] =
    useState(0);

  const [saldo,
    setSaldo] =
    useState(0);

  const [visitasHoy,
    setVisitasHoy] =
    useState(0);

  const [reservasHoy,
    setReservasHoy] =
    useState(0);

    const [solicitudesPendientes,
  setSolicitudesPendientes] =
  useState(0);

const [limiteGastoAdmin,
  setLimiteGastoAdmin] =
  useState(0);

  // 🔥 CARGAR DATOS

  const cargarDatos =
    async () => {

      const hoy =
  new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone:
          "America/Guayaquil",
      }
    );

      // 🔥 VIVIENDAS

      const {
        data: viviendasData,
      } = await supabase
        .from("viviendas")
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        );

      setViviendas(
        viviendasData?.length || 0
      );

      // 🔥 RESIDENTES

      const {
        data: residentesData,
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

      setResidentes(
        residentesData?.length || 0
      );

      // 🔥 GUARDIAS

      const {
        data: guardiasData,
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
        );

      setGuardias(
        guardiasData?.length || 0
      );

      // 🔥 NOVEDADES HOY

      const inicioHoy =
        `${hoy}T00:00:00`;

      const finHoy =
        `${hoy}T23:59:59`;

      const {
        data: novedadesData,
      } = await supabase
        .from("novedades")
        .select("*")
        .eq(
        "condominio_id",
         usuario.condominio_id
         )
        .gte(
          "fecha",
          inicioHoy
        )
        .lte(
          "fecha",
          finHoy
        )
        .neq(
          "estado",
          "cerrado"
        );

      setNovedades(
        novedadesData?.length || 0
      );

      // 🔥 RESERVAS HOY

      const {
        data: reservasData,
      } = await supabase
        .from("reservas_areas")
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        )
        .eq(
          "fecha",
          hoy
        );

      setReservasHoy(
        reservasData?.length || 0
      );

      // 🔥 VISITAS HOY

const {
  data: visitasData,
} = await supabase
  .from("visitas")
  .select("*");

const visitasDelDia =
  visitasData?.filter(
    (v) =>
      v.fecha_visita === hoy
  ) || [];

setVisitasHoy(
  visitasDelDia.length
);
     
      // 🔥 PAGOS

      const {
        data: pagosData,
      } = await supabase
        .from("pagos_residentes")
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        );

      const pendientes =
        pagosData?.filter(
          (p) =>
            p.estado ===

  "PENDIENTE" ||

p.estado ===
  "PARCIAL" ||

p.estado ===
  "POR_VALIDAR"
            
) || [];

      setPagosPendientes(
        pendientes.length
      );

      const hoyFecha =
  new Date();

const vencidos =
  pagosData?.filter(
    (p) => {

      if (
        !p.fecha_vencimiento
      ) {
        return false;
      }

      const fechaVencimiento =
        new Date(
          p.fecha_vencimiento
        );

      return (
        p.estado !==
          "PAGADO" &&

        p.estado !==
          "ANULADO" &&

        fechaVencimiento <
          hoyFecha
      );

    }
  ) || [];

      setPagosVencidos(
        vencidos.length
      );

      // 🔥 POR VALIDAR

      const validar =
        pagosData?.filter(
          (p) =>
            p.estado ===
            "POR_VALIDAR"
        ) || [];

      setPagosValidar(
        validar.length
      );

      // 🔥 INGRESOS

      let totalIngresos = 0;

      pagosData?.forEach((p) => {

  if (
    p.estado ===
    "PAGADO"
  ) {

    totalIngresos +=
      Number(
        p.valor_pagado || 0
      );

  }

});

      setRecaudado(
        totalIngresos
      );

      // 🔥 GASTOS

      const {
        data: gastosData,
      } = await supabase
        .from(
          "gastos_administrativos"
        )
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        );

      let totalGastos = 0;

      gastosData?.forEach((g) => {

        totalGastos +=
          Number(
            g.total || 0
          );

      });

      setGastos(
        totalGastos
      );

      // ==========================================
// 🔥 DATOS DIRECTIVA
// ==========================================

if (rol === "DIRECTIVA") {

  // SOLICITUDES DE GASTO PENDIENTES

  const {
    data: solicitudesData,
    error: errorSolicitudes,
  } = await supabase
    .from("solicitudes_gastos")
    .select("id")
    .eq(
      "condominio_id",
      usuario.condominio_id
    )
    .eq(
      "estado",
      "PENDIENTE"
    );

  if (errorSolicitudes) {
    console.error(
      "❌ Error cargando solicitudes:",
      errorSolicitudes
    );
  }

  setSolicitudesPendientes(
    solicitudesData?.length || 0
  );

  // LÍMITE DE GASTO DEL ADMINISTRADOR

  const {
    data: condominioData,
    error: errorCondominio,
  } = await supabase
    .from("condominios")
    .select(
      "monto_maximo_gasto_admin"
    )
    .eq(
      "id",
      usuario.condominio_id
    )
    .single();

  if (errorCondominio) {
    console.error(
      "❌ Error cargando límite financiero:",
      errorCondominio
    );
  }

  setLimiteGastoAdmin(
    Number(
      condominioData
        ?.monto_maximo_gasto_admin || 0
    )
  );
}

      // 🔥 SALDO

      setSaldo(
        totalIngresos -
        totalGastos
      );

    };

  // 🔥 INIT

  useEffect(() => {

  if (!usuario) {
    return;
  }

  if (rol === "TECNICO") {

    router.replace(
      "/panel-tecnico"
    );

    return;
  }

  cargarDatos();

}, [usuario, rol]);


  // 🔒 LOADING

  if (
    loading ||
    !usuario
  ) {

    return <p>Cargando...</p>;

  }

  // 🔥 DASHBOARD RESIDENTE

  if (rol === "RESIDENTE") {

  return (

    <>
    
        <div
  style={{
    background:
      "linear-gradient(135deg,#2563eb,#1d4ed8)",
    borderRadius: 28,
    padding:
      "35px 40px",
    marginBottom: 30,
    color:
      "#fff",
  }}
>  

            <h1
              style={{
                fontSize: 36,
                margin: 0,
              }}
            >
              Bienvenido residente
            </h1>

            <p
              style={{
                marginTop: 12,
                color:
                  "#dbeafe",
              }}
            >
              Consulta tu estado financiero,
              reservas y comprobantes.
            </p>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: 20,
            }}
          >

            <CardPremium
              titulo="💰 Estado de Cuenta"
              valor="Ver"
              color="#16a34a"
              onClick={() =>
                router.push(
                  "/estado-cuenta"
                )
              }
            />

            <CardPremium
              titulo="📄 Mis Comprobantes"
              valor="Ver"
              color="#2563eb"
              onClick={() =>
                router.push(
                  "/pagos"
                )
              }
            />

            <CardPremium
              titulo="📅 Mis Reservas"
              valor="Ver"
              color="#7c3aed"
              onClick={() =>
                router.push(
                  "/reservas?solo=historial"
                )
              }
            />

            <CardPremium
              titulo="🚗 Mis Visitas"
              valor="Ver"
              color="#f59e0b"
              onClick={() =>
                router.push(
                  "/visitas?solo=historial"
                )
              }
            />

            <CardPremium
              titulo="📢 Novedades"
              valor="Ver"
              color="#dc2626"
              onClick={() =>
                router.push(
                  "/novedades?solo=historial"
                )
              }
            />

                   </div>
      </>

    );

}



  // 🔥 DASHBOARD GUARDIA

  if (rol === "GUARDIA") {

    return (

      <>
      
          <div
            style={{
              background:
                "linear-gradient(135deg,#111827,#1f2937)",
              borderRadius: 28,
              padding:
                "35px 40px",
              marginBottom: 30,
              color:
                "#fff",
            }}
          >

            <h1
              style={{
                fontSize: 36,
                margin: 0,
              }}
            >
              Panel de Guardia
            </h1>

            <p
              style={{
                marginTop: 12,
                color:
                  "#d1d5db",
              }}
            >
              Gestión de visitas,
              accesos y novedades.
            </p>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: 20,
            }}
          >

            <CardPremium
              titulo="🚗 Visitas"
              valor="Gestionar"
              color="#2563eb"
              onClick={() =>
                router.push(
                  "/visitas"
                )
              }
            />

            <CardPremium
              titulo="📢 Novedades"
              valor="Gestionar"
              color="#dc2626"
              onClick={() =>
                router.push(
                  "/novedades"
                )
              }
            />

          </div>

          </>

);

}

// ==========================================
// 🏛️ DASHBOARD DIRECTIVA
// ==========================================

if (rol === "DIRECTIVA") {

  return (
    <>
      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#1e3a8a,#2563eb)",
          borderRadius: 28,
          padding: "35px 40px",
          marginBottom: 30,
          color: "#fff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            opacity: 0.8,
            marginBottom: 10,
            fontSize: 14,
          }}
        >
          RENALIX · GOBERNANZA
        </div>

        <h1
          style={{
            fontSize: 38,
            margin: 0,
          }}
        >
          Dashboard Directiva
        </h1>

        <p
          style={{
            marginTop: 12,
            color: "#dbeafe",
            fontSize: 16,
          }}
        >
          Resumen financiero y de supervisión
          del condominio.
        </p>
      </div>

      {/* ==================================
          RESUMEN FINANCIERO
          ================================== */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <h2
          style={{
            marginBottom: 20,
          }}
        >
          💰 Resumen Financiero
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: 20,
          }}
        >

          <CardPremium
            titulo="💰 Ingresos"
            valor={`$${recaudado.toFixed(2)}`}
            color="#16a34a"
            onClick={() =>
              router.push(
                "/reportes/ingresos"
              )
            }
          />

          <CardPremium
            titulo="🧾 Gastos"
            valor={`$${gastos.toFixed(2)}`}
            color="#dc2626"
            onClick={() =>
              router.push(
                "/reportes/gastos"
              )
            }
          />

          <CardPremium
            titulo="💵 Saldo"
            valor={`$${saldo.toFixed(2)}`}
            color="#2563eb"
          />

          <CardPremium
            titulo="🔴 Cartera Vencida"
            valor={pagosVencidos}
            color="#dc2626"
            onClick={() =>
              router.push(
                "/reportes/ingresos"
              )
            }
          />

        </div>
      </div>

      {/* ==================================
          CONTROL FINANCIERO
          ================================== */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <h2
          style={{
            marginBottom: 20,
          }}
        >
          🏛️ Control Financiero
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: 20,
          }}
        >

          <CardPremium
            titulo="📋 Solicitudes Pendientes"
            valor={solicitudesPendientes}
            color="#f59e0b"
            onClick={() =>
              router.push(
                "/aprobaciones-directiva"
              )
            }
          />

          <CardPremium
            titulo="💰 Límite Administrador"
            valor={`$${limiteGastoAdmin.toFixed(2)}`}
            color="#7c3aed"
            onClick={() =>
              router.push(
                "/configuracion-financiera"
              )
            }
          />

        </div>
      </div>

      {/* ==================================
          SUPERVISIÓN
          ================================== */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <h2
          style={{
            marginBottom: 20,
          }}
        >
          📝 Supervisión
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: 20,
          }}
        >

          <CardPremium
            titulo="📋 Aprobaciones"
            valor="Revisar"
            color="#f59e0b"
            onClick={() =>
              router.push(
                "/aprobaciones-directiva"
              )
            }
          />

          <CardPremium
            titulo="⚙️ Configuración Financiera"
            valor="Consultar"
            color="#7c3aed"
            onClick={() =>
              router.push(
                "/configuracion-financiera"
              )
            }
          />

         <CardPremium
  titulo="📝 Sesiones y Acuerdos"
  valor="Gestionar"
  color="#2563eb"
  onClick={() =>
    router.push("/sesiones-acuerdos")
  }
/>

        </div>
      </div>
    </>
  );
}


  // 🔥 DASHBOARD ADMIN

 return (

  <>
        {/* 🔥 HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#111827,#1f2937)",
            borderRadius: 28,
            padding:
              "35px 40px",
            marginBottom: 30,
            color:
              "#fff",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.18)",
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
              gap: 20,
            }}
          >

            <div>

              <div
                style={{
                  opacity: 0.8,
                  marginBottom: 10,
                  fontSize: 14,
                }}
              >
                ERP FINANCIERO RESIDENCIAL
              </div>

              <h1
                style={{
                  fontSize: 38,
                  margin: 0,
                }}
              >
                Dashboard Ejecutivo
              </h1>

              <p
                style={{
                  marginTop: 12,
                  color:
                    "#d1d5db",
                  fontSize: 16,
                }}
              >
                Resumen operativo,
                financiero y administrativo
                de la urbanización.
              </p>

            </div>

            {pagosValidar > 0 && (

              <div
                style={{
                  background:
                    "#f59e0b",
                  color:
                    "#111827",
                  padding:
                    "18px 24px",
                  borderRadius: 20,
                  fontWeight:
                    "bold",
                }}
              >

                ⚠ {pagosValidar}
                {" "}
                pagos por validar

              </div>

            )}

          </div>

        </div>

        {/* 🔥 FINANCIERO */}

        <div
          style={{
            marginBottom: 30,
          }}
        >

          <h2
            style={{
              marginBottom: 20,
            }}
          >
            Resumen Financiero
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: 20,
            }}
          >

            <CardPremium
              titulo="💰 Recaudado"
              valor={`$${recaudado.toFixed(2)}`}
              color="#16a34a"
              onClick={() =>
                router.push(
                  "/reportes/ingresos"
                )
              }
            />

            <CardPremium
              titulo="🧾 Gastos"
              valor={`$${gastos.toFixed(2)}`}
              color="#dc2626"
              onClick={() =>
                router.push(
                  "/reportes/gastos"
                )
              }
            />

            <CardPremium
              titulo="📊 Saldo"
              valor={`$${saldo.toFixed(2)}`}
              color="#2563eb"
            />

            <CardPremium
              titulo="⚠ Pendientes"
              valor={pagosPendientes}
              color="#f59e0b"
              onClick={() =>
                router.push(
                  "/reportes/ingresos"
                )
              }
            />

            <CardPremium
              titulo="🚨 Vencidos"
              valor={pagosVencidos}
              color="#dc2626"
              onClick={() =>
                router.push(
                  "/reportes/ingresos"
                )
              }
            />

            <CardPremium
              titulo="⏳ Por validar"
              valor={pagosValidar}
              color="#7c3aed"
              onClick={() =>
                router.push(
                  "/pagos"
                )
              }
            />

          </div>

        </div>

        {/* 🔥 OPERATIVO */}

        <div>

          <h2
            style={{
              marginBottom: 20,
            }}
          >
            Resumen Operativo
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 20,
            }}
          >

            <Card
              titulo="🏠 Viviendas"
              valor={viviendas}
              onClick={() =>
                router.push(
                  "/reportes/viviendas"
                )
              }
            />

            <Card
              titulo="👨‍👩‍👧 Residentes"
              valor={residentes}
              onClick={() =>
                router.push(
                  "/reportes/residentes"
                )
              }
            />

            <Card
              titulo="🛡️ Guardias"
              valor={guardias}
              onClick={() =>
                router.push(
                  "/reportes/guardias"
                )
              }
            />

            <Card
              titulo="📢 Novedades Hoy"
              valor={novedades}
              onClick={() =>
                router.push(
                  "/reportes/novedades"
                )
              }
            />

            <Card
              titulo="🚗 Visitas Hoy"
              valor={visitasHoy}
              onClick={() =>
                router.push(
                  "/reportes/visitas"
                )
              }
            />

            <Card
              titulo="📅 Reservas Hoy"
              valor={reservasHoy}
              onClick={() =>
                router.push(
                  "/reportes/reservas"
                )
              }
            />

          </div>

        </div>

      </>

      );
      }

// 🔥 CARD PREMIUM

function CardPremium({
  titulo,
  valor,
  color,
  onClick,
}: any) {

  return (

    <div
      onClick={onClick}
      style={{
        background:
          "#fff",
        borderRadius: 24,
        padding: 28,
        boxShadow:
          "0 6px 20px rgba(0,0,0,0.08)",
        cursor:
          onClick
            ? "pointer"
            : "default",
        borderTop:
          `6px solid ${color}`,
      }}
    >

      <div
        style={{
          fontSize: 15,
          color:
            "#6b7280",
          marginBottom: 14,
          fontWeight:
            "bold",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 38,
          fontWeight:
            "bold",
          color:
            color,
        }}
      >
        {valor}
      </div>

    </div>

  );

}

// 🔥 CARD NORMAL

function Card({
  titulo,
  valor,
  onClick,
}: {
  titulo: string;
  valor: any;
  onClick?: any;
}) {

  return (

    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 24,
        boxShadow:
          "0 4px 14px rgba(0,0,0,0.08)",
        cursor:
          onClick
            ? "pointer"
            : "default",
      }}
    >

      <h3
        style={{
          marginBottom: 14,
          fontSize: 16,
          color: "#6b7280",
        }}
      >
        {titulo}
      </h3>

      <p
        style={{
          fontSize: 34,
          fontWeight: "bold",
          margin: 0,
          color: "#111827",
        }}
      >
        {valor}
      </p>

    </div>

  );

}