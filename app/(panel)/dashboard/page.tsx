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

  const [cargandoCondominio, setCargandoCondominio] =
    useState(true);

  const [codigoVivienda, setCodigoVivienda] =
    useState("");

  // 🔔 AVISOS PENDIENTES DEL RESIDENTE
  const [avisosImportantesPendientes, setAvisosImportantesPendientes] =
    useState(0);

  const [avisoUrgentePendiente, setAvisoUrgentePendiente] =
    useState<any | null>(null);

  // 📢 RESUMEN DE AVISOS PARA ADMIN
  const [avisosPublicadosAdmin, setAvisosPublicadosAdmin] = useState(0);
  const [lecturasPendientesAdmin, setLecturasPendientesAdmin] = useState(0);

  // ⏳ CARGA COMPLETA DEL DASHBOARD
  // Evita mostrar KPIs en cero mientras las consultas de Supabase terminan.
  const [cargandoDashboard, setCargandoDashboard] = useState(true);

  // 🏘️ CARGAR NOMBRE DE LA URBANIZACIÓN
  // Esta consulta es independiente de la carga de KPIs.
  // Así el encabezado puede mostrar el nombre apenas exista el condominio_id,
  // sin esperar a que terminen viviendas, pagos, gastos, avisos, etc.
  useEffect(() => {

    if (loading) {
      return;
    }

    if (!usuario?.condominio_id) {
      setCargandoCondominio(false);
      return;
    }

    let activo = true;

    const cargarNombreCondominio = async () => {
      setCargandoCondominio(true);

      const {
        data: condominioNombreData,
        error: errorCondominioNombre,
      } = await supabase
        .from("condominios")
        .select("nombre")
        .eq("id", usuario.condominio_id)
        .single();

      if (!activo) {
        return;
      }

      if (errorCondominioNombre) {
        console.error(
          "❌ Error cargando nombre de urbanización:",
          errorCondominioNombre
        );
        setNombreCondominio("");
      } else {
        setNombreCondominio(condominioNombreData?.nombre || "");
      }

      setCargandoCondominio(false);
    };

    cargarNombreCondominio();

    return () => {
      activo = false;
    };
  }, [loading, usuario?.condominio_id]);

  // 🔥 CARGAR DATOS
  // La carga de KPIs es independiente del nombre de la urbanización.

  const cargarDatos =
    async () => {

      if (!usuario?.condominio_id) {
        setCargandoDashboard(false);
        return;
      }

      setCargandoDashboard(true);

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

      // 🔔 AVISOS PENDIENTES DEL RESIDENTE
      // Solo consideramos avisos publicados, vigentes y no leídos.
      const ahoraAvisos = new Date().toISOString();

      if (rol === "RESIDENTE") {
        const {
          data: avisosData,
          error: errorAvisos,
        } = await supabase
          .from("avisos")
          .select(
            "id, titulo, contenido, prioridad, fecha_inicio, fecha_fin"
          )
          .eq("condominio_id", usuario.condominio_id)
          .eq("estado", "PUBLICADO")
          .lte("fecha_inicio", ahoraAvisos)
          .or(`fecha_fin.is.null,fecha_fin.gte.${ahoraAvisos}`)
          .order("fecha_inicio", { ascending: false });

        if (errorAvisos) {
          console.error(
            "❌ Error cargando avisos del dashboard:",
            errorAvisos
          );
        } else {
          const {
            data: lecturasData,
            error: errorLecturas,
          } = await supabase
            .from("avisos_lecturas")
            .select("aviso_id")
            .eq("usuario_id", usuario.id);

          if (errorLecturas) {
            console.error(
              "❌ Error cargando lecturas de avisos:",
              errorLecturas
            );
          } else {
            const avisosLeidos = new Set(
              (lecturasData || []).map((lectura) => lectura.aviso_id)
            );

            const avisosPendientes = (avisosData || []).filter(
              (aviso) => !avisosLeidos.has(aviso.id)
            );

            setAvisosImportantesPendientes(
              avisosPendientes.filter(
                (aviso) => aviso.prioridad === "IMPORTANTE"
              ).length
            );

            setAvisoUrgentePendiente(
              avisosPendientes.find(
                (aviso) => aviso.prioridad === "URGENTE"
              ) || null
            );
          }
        }
      }

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

      // 📢 RESUMEN DE AVISOS PARA ADMIN

      if (rol === "ADMIN") {
        const ahoraAvisosAdmin = new Date().toISOString();

        const { data: avisosAdminData, error: errorAvisosAdmin } = await supabase
          .from("avisos")
          .select("id")
          .eq("condominio_id", usuario.condominio_id)
          .eq("estado", "PUBLICADO")
          .lte("fecha_inicio", ahoraAvisosAdmin)
          .or(`fecha_fin.is.null,fecha_fin.gte.${ahoraAvisosAdmin}`);

        if (errorAvisosAdmin) {
          console.error("❌ Error cargando resumen de avisos:", errorAvisosAdmin);
          setAvisosPublicadosAdmin(0);
          setLecturasPendientesAdmin(0);
        } else {
          const idsAvisos = (avisosAdminData || []).map((aviso) => aviso.id);
          setAvisosPublicadosAdmin(idsAvisos.length);

          if (idsAvisos.length === 0) {
            setLecturasPendientesAdmin(0);
          } else {
            // El Dashboard del ADMIN muestra únicamente las lecturas pendientes
            // del último aviso publicado vigente. Los avisos anteriores no se acumulan.
            const { data: ultimoAvisoData, error: errorUltimoAviso } = await supabase
              .from("avisos")
              .select("id")
              .eq("condominio_id", usuario.condominio_id)
              .eq("estado", "PUBLICADO")
              .lte("fecha_inicio", ahoraAvisosAdmin)
              .or(`fecha_fin.is.null,fecha_fin.gte.${ahoraAvisosAdmin}`)
              .order("fecha_inicio", { ascending: false })
              .limit(1);

            if (errorUltimoAviso) {
              console.error("❌ Error cargando el último aviso:", errorUltimoAviso);
              setLecturasPendientesAdmin(0);
            } else if (!ultimoAvisoData || ultimoAvisoData.length === 0) {
              setLecturasPendientesAdmin(0);
            } else {
              const ultimoAvisoId = ultimoAvisoData[0].id;

              const { data: lecturasAdminData, error: errorLecturasAdmin } = await supabase
                .from("avisos_lecturas")
                .select("usuario_id")
                .eq("aviso_id", ultimoAvisoId);

              if (errorLecturasAdmin) {
                console.error("❌ Error cargando lecturas del último aviso:", errorLecturasAdmin);
                setLecturasPendientesAdmin(0);
              } else {
                const totalLecturas = (lecturasAdminData || []).length;
                const totalResidentes = residentesData?.length || 0;
                setLecturasPendientesAdmin(
                  Math.max(totalResidentes - totalLecturas, 0)
                );
              }
            }
          }
        }
      } else {
        setAvisosPublicadosAdmin(0);
        setLecturasPendientesAdmin(0);
      }

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

      setCargandoDashboard(false);

    };

  // 🔥 INIT
  // Esperamos explícitamente a que termine la carga de autenticación
  // y a que el usuario tenga su condominio_id antes de consultar Supabase.
  // La dependencia del condominio_id también cubre el caso en que useAuth
  // complete ese dato después de la primera renderización.

  useEffect(() => {

    if (loading) {
      return;
    }

    if (!usuario?.condominio_id) {
      return;
    }

    if (rol === "TECNICO") {

      router.replace(
        "/panel-tecnico"
      );

      return;
    }

    cargarDatos();

  }, [loading, usuario?.condominio_id, rol]);


  // 🔒 LOADING

  if (
    loading ||
    !usuario
  ) {

    return <p>Cargando...</p>;

  }

  if (cargandoDashboard) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <div style={{ textAlign: "center", color: "#475569", fontSize: 16, fontWeight: 600 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>⏳</div>
          Cargando información de la urbanización...
        </div>
      </div>
    );
  }

 // 🔥 DASHBOARD RESIDENTE

if (rol === "RESIDENTE") {
  return (
    <>
      {/* ==========================================
          RESIDENTE - ESCRITORIO
          ========================================== */}

      <div className="residente-desktop">

        {avisoUrgentePendiente && (
          <div
            style={{
              background: "#fee2e2",
              border: "2px solid #dc2626",
              borderRadius: 20,
              padding: "18px 22px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold", color: "#991b1b", fontSize: 18 }}>
                🚨 Aviso urgente pendiente
              </div>
              <div style={{ color: "#7f1d1d", marginTop: 5 }}>
                {avisoUrgentePendiente.titulo}
              </div>
            </div>
            <button
              onClick={() => router.push("/avisos")}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Leer aviso
            </button>
          </div>
        )}

        {avisosImportantesPendientes > 0 && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #f59e0b",
              borderRadius: 18,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#92400e", fontWeight: "bold" }}>
              🟠 Tienes {avisosImportantesPendientes} aviso{avisosImportantesPendientes === 1 ? "" : "s"} importante{avisosImportantesPendientes === 1 ? "" : "s"} pendiente{avisosImportantesPendientes === 1 ? "" : "s"}.
            </div>
            <button
              onClick={() => router.push("/avisos")}
              style={{
                background: "#f59e0b",
                color: "#111827",
                border: "none",
                borderRadius: 12,
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Ver avisos
            </button>
          </div>
        )}

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

        {/* 🔔 AVISOS PENDIENTES */}
        {(avisoUrgentePendiente || avisosImportantesPendientes > 0) && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 18,
              padding: 16,
              background: avisoUrgentePendiente ? "#fee2e2" : "#fff7ed",
              border: avisoUrgentePendiente ? "2px solid #dc2626" : "1px solid #f59e0b",
              boxShadow: "0 5px 16px rgba(15,23,42,0.08)",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                color: avisoUrgentePendiente ? "#991b1b" : "#92400e",
                fontSize: 16,
              }}
            >
              {avisoUrgentePendiente
                ? "🚨 Tienes un aviso urgente pendiente"
                : `🟠 Tienes ${avisosImportantesPendientes} aviso${avisosImportantesPendientes === 1 ? "" : "s"} importante${avisosImportantesPendientes === 1 ? "" : "s"} pendiente${avisosImportantesPendientes === 1 ? "" : "s"}.`}
            </div>

            {avisoUrgentePendiente && (
              <div
                style={{
                  color: "#7f1d1d",
                  marginTop: 6,
                  fontSize: 14,
                }}
              >
                {avisoUrgentePendiente.titulo}
              </div>
            )}

            <button
              onClick={() => router.push("/avisos")}
              style={{
                width: "100%",
                marginTop: 12,
                border: "none",
                borderRadius: 12,
                padding: "12px 14px",
                background: avisoUrgentePendiente ? "#dc2626" : "#f59e0b",
                color: avisoUrgentePendiente ? "#fff" : "#111827",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {avisoUrgentePendiente ? "Leer aviso" : "Ver avisos"}
            </button>
          </div>
        )}

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
                {cargandoCondominio
                  ? "Cargando urbanización..."
                  : nombreCondominio || "Urbanización no disponible"}
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