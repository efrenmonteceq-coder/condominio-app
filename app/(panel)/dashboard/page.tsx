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

  const [nombreCondominio, setNombreCondominio] =
    useState("");

  const [codigoVivienda, setCodigoVivienda] =
    useState("");

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

      // 🔥 NOMBRE DE LA URBANIZACIÓN
      const {
        data: condominioNombreData,
      } = await supabase
        .from("condominios")
        .select("*")
        .eq(
          "id",
          usuario.condominio_id
        )
        .single();

      setNombreCondominio(
        condominioNombreData?.nombre ||
        "Tu urbanización"
      );

      // 🔥 VIVIENDA DEL RESIDENTE
      // La relación correcta es: usuarios.id → viviendas.residente_id
      const {
        data: viviendaResidenteData,
      } = await supabase
        .from("viviendas")
        .select("codigo_vivienda")
        .eq("residente_id", usuario.id)
        .eq("condominio_id", usuario.condominio_id)
        .maybeSingle();

      setCodigoVivienda(
        viviendaResidenteData?.codigo_vivienda ||
        "Vivienda no asignada"
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
      {/* ==========================================
          RESIDENTE - ESCRITORIO
          ========================================== */}

      <div className="residente-desktop">
        <div
          style={{
            background:
              "linear-gradient(135deg,#2563eb,#1d4ed8)",
            borderRadius: 28,
            padding: "35px 40px",
            marginBottom: 30,
            color: "#fff",
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
              color: "#dbeafe",
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
              router.push("/estado-cuenta")
            }
          />

          <CardPremium
            titulo="📄 Mis Comprobantes"
            valor="Ver"
            color="#2563eb"
            onClick={() =>
              router.push("/pagos")
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
      </div>

      {/* ==========================================
          RESIDENTE - MÓVIL
          ========================================== */}

      <div className="residente-mobile">

        {/* CABECERA PREMIUM */}

        <div
          className="residente-mobile-header"
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #0f766e 48%, #155e75 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="residente-mobile-header-glow" />

          <div className="residente-mobile-saludo">
            <div className="residente-mobile-avatar">
              <span>👤</span>
            </div>

            <div className="residente-mobile-header-info">
              <div className="residente-mobile-hola">
                ¡Hola, {usuario.nombre || "Residente"}!
              </div>

              <div className="residente-mobile-condominio">
                <span className="residente-mobile-header-icon">🌐</span>
                {nombreCondominio || "Tu urbanización"}
              </div>

              <div className="residente-mobile-vivienda">
                <span className="residente-mobile-header-icon">🏠</span>
                {codigoVivienda}
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES PRINCIPALES */}

        <div className="residente-mobile-grid">

          <button
            className="residente-mobile-card residente-card-verde"
            style={{ background: "linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%)", borderTop: "3px solid #10b981" }}
            onClick={() =>
              router.push("/estado-cuenta")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="cuenta" />
            </div>

            <div className="residente-mobile-title">
              Estado de Cuenta
            </div>

            <div className="residente-mobile-subtitle">
              Consulta tu saldo, alícuotas y movimientos.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-azul"
            style={{ background: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)", borderTop: "3px solid #3b82f6" }}
            onClick={() =>
              router.push("/pagos")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="pagos" />
            </div>

            <div className="residente-mobile-title">
              Mis Pagos y Comprobantes
            </div>

            <div className="residente-mobile-subtitle">
              Consulta tus pagos, registra comprobantes y revisa tu historial.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-naranja"
            style={{ background: "linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%)", borderTop: "3px solid #f97316" }}
            onClick={() =>
              router.push("/reservas")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="areas" />
            </div>

            <div className="residente-mobile-title">
              Reserva Áreas Comunes
            </div>

            <div className="residente-mobile-subtitle">
              Reserva piscinas, canchas y otros espacios de la urbanización.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-morado"
            style={{ background: "linear-gradient(145deg, #f5f3ff 0%, #e9d5ff 100%)", borderTop: "3px solid #8b5cf6" }}
            onClick={() =>
              router.push("/visitas")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="visitas" />
            </div>

            <div className="residente-mobile-title">
              Gestión de Visitas
            </div>

            <div className="residente-mobile-subtitle">
              Registra tus visitas y consulta el historial de ingresos.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-rojo residente-card-novedades"
            style={{ background: "linear-gradient(145deg, #fff1f2 0%, #fecdd3 100%)", borderTop: "3px solid #f43f5e" }}
            onClick={() =>
              router.push("/novedades")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="novedad" />
            </div>

            <div>
              <div className="residente-mobile-title">
                Reporta una Novedad
              </div>

              <div className="residente-mobile-subtitle">
                Informa novedades o situaciones que requieran atención.
              </div>
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-azul"
            style={{ background: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)", borderTop: "3px solid #3b82f6" }}
            onClick={() =>
              router.push("/paqueteria")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="paquetes" />
            </div>

            <div className="residente-mobile-title">
              Mis Paquetes
            </div>

            <div className="residente-mobile-subtitle">
              Consulta y gestiona la recepción de tus paquetes.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-morado"
            style={{ background: "linear-gradient(145deg, #f5f3ff 0%, #e9d5ff 100%)", borderTop: "3px solid #8b5cf6" }}
            onClick={() =>
              router.push("/votaciones")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="votacion" />
            </div>

            <div className="residente-mobile-title">
              Participa y Vota
            </div>

            <div className="residente-mobile-subtitle">
              Participa en las decisiones de tu urbanización.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-verde"
            style={{ background: "linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%)", borderTop: "3px solid #10b981" }}
            onClick={() =>
              router.push("/gastos")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="transparencia" />
            </div>

            <div className="residente-mobile-title">
              Transparencia Financiera
            </div>

            <div className="residente-mobile-subtitle">
              Consulta gastos y movimientos de tu urbanización.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

          <button
            className="residente-mobile-card residente-card-naranja"
            style={{ background: "linear-gradient(145deg, #fff7ed 0%, #fed7aa 100%)", borderTop: "3px solid #f97316" }}
            onClick={() =>
              router.push("/tecnicos")
            }
          >
            <div
              className="residente-mobile-icon residente-icon-svg"
              style={{
                width: 58,
                height: 58,
                minWidth: 58,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
              }}
            >
              <IconoMovil tipo="servicios" />
            </div>

            <div className="residente-mobile-title">
              Ecosistema de Servicios
            </div>

            <div className="residente-mobile-subtitle">
              Encuentra profesionales, servicios y negocios en tu comunidad.
            </div>

            <div className="residente-mobile-arrow">→</div>
          </button>

        </div>

        {/* RESUMEN */}

        <div className="residente-mobile-resumen">
          <div className="residente-mobile-resumen-title">
            <span>📊</span>
            Resumen de hoy
          </div>

          <div className="residente-mobile-resumen-grid">

            <div className="residente-mobile-mini">
              <span className="residente-mobile-mini-icon">
                <IconoMovil tipo="areas" />
              </span>
              <strong>{reservasHoy}</strong>
              <small>Reservas hoy</small>
            </div>

            <div className="residente-mobile-mini">
              <span className="residente-mobile-mini-icon">
                <IconoMovil tipo="visitas" />
              </span>
              <strong>{visitasHoy}</strong>
              <small>Visitas hoy</small>
            </div>

            <div className="residente-mobile-mini">
              <span className="residente-mobile-mini-icon">
                <IconoMovil tipo="novedad" />
              </span>
              <strong>{novedades}</strong>
              <small>Novedades</small>
            </div>

            <div className="residente-mobile-mini">
              <span className="residente-mobile-mini-icon">
                <IconoMovil tipo="cuenta" />
              </span>
              <strong>{pagosPendientes}</strong>
              <small>Pagos pendientes</small>
            </div>

          </div>
        </div>

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

// 🎨 ICONOS MODERNOS PARA EL DASHBOARD MÓVIL

function IconoMovil({
  tipo,
}: {
  tipo:
    | "cuenta"
    | "pagos"
    | "areas"
    | "visitas"
    | "novedad"
    | "paquetes"
    | "votacion"
    | "transparencia"
    | "servicios";
}) {
  const paths: Record<string, React.ReactNode> = {
    cuenta: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </>
    ),
    pagos: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 9h10" />
        <path d="M7 13h6" />
        <path d="M7 16h4" />
      </>
    ),
    areas: (
      <>
        <path d="M4 16c2.5-4 5-6 8-6s5.5 2 8 6" />
        <path d="M5 19h14" />
        <path d="M8 13c0-3 2-6 4-8 2 2 4 5 4 8" />
      </>
    ),
    visitas: (
      <>
        <path d="M5 17h14l-1-6H6l-1 6Z" />
        <path d="M7 11 9 7h6l2 4" />
        <circle cx="8" cy="17" r="1.5" />
        <circle cx="16" cy="17" r="1.5" />
      </>
    ),
    novedad: (
      <>
        <path d="M4 15h3l8 4V5l-8 4H4v6Z" />
        <path d="M15 9c1.5.8 2.5 2.2 2.5 4s-1 3.2-2.5 4" />
        <path d="M19 7c2 1.5 3 3.5 3 6s-1 4.5-3 6" />
      </>
    ),
    paquetes: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5" />
        <path d="M12 12v9" />
        <path d="M8 5.2 16 10" />
      </>
    ),
    votacion: (
      <>
        <path d="M4 6h16v13H4z" />
        <path d="m8 12 2.5 2.5L16 9" />
        <path d="M8 3h8" />
      </>
    ),
    transparencia: (
      <>
        <path d="M4 19V10" />
        <path d="M10 19V6" />
        <path d="M16 19v-9" />
        <path d="M22 19V4" />
        <path d="M3 19h20" />
      </>
    ),
    servicios: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M7 7.5 10 10" />
        <path d="m17 7.5-3 2.5" />
        <path d="M7 16.5 10 14" />
        <path d="m17 16.5-3-2.5" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: "1em", height: "1em" }}
    >
      {paths[tipo]}
    </svg>
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