"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const dashboardCargaIniciadaRef = useRef<string | null>(null);

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

  // 💰 TRANSPARENCIA FINANCIERA - ADMIN PC
  // Conservamos los movimientos financieros para generar cortes mensuales
  // sobre los mismos datos que alimentan los KPIs actuales.
  const [pagosTransparencia, setPagosTransparencia] =
    useState<any[]>([]);

  const [gastosTransparencia, setGastosTransparencia] =
    useState<any[]>([]);

  // 💰 OTROS INGRESOS · resumen financiero mensual
  // Se mantiene separado de pagos_residentes porque corresponde a
  // movimientos_otros_ingresos.
  const [otrosIngresosTransparencia, setOtrosIngresosTransparencia] =
    useState<any[]>([]);

  const [mesTransparencia, setMesTransparencia] =
    useState("");

  // 💰 ADMIN MÓVIL · selector financiero independiente
  // Evita que el selector compartido con otras vistas afecte la actualización
  // inmediata de los bloques financieros del ADMIN en móvil.
  const [mesTransparenciaAdminMovil, setMesTransparenciaAdminMovil] =
    useState("");

  // 💰 RESIDENTE MÓVIL · selector financiero independiente
  // Mantiene el selector móvil del RESIDENTE separado del selector PC.
  const [mesTransparenciaResidenteMovil, setMesTransparenciaResidenteMovil] =
    useState("");

  // 💰 DIRECTIVA MÓVIL · selector financiero independiente
  const [mesTransparenciaDirectivaMovil, setMesTransparenciaDirectivaMovil] =
    useState("");

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

  const [avisosPendientesResidente, setAvisosPendientesResidente] =
    useState(0);

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

            setAvisosPendientesResidente(avisosPendientes.length);

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

      setPagosTransparencia(
        pagosData || []
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

      setGastosTransparencia(
        gastosData || []
      );

      // 💰 OTROS INGRESOS
      // Ingresos distintos de las alícuotas para el resumen financiero.
      const {
        data: otrosIngresosData,
        error: errorOtrosIngresos,
      } = await supabase
        .from("movimientos_otros_ingresos")
        .select(
          "fecha_movimiento, subtotal, total, tipo_documento, estado"
        )
        .eq(
          "condominio_id",
          usuario.condominio_id
        );

      if (errorOtrosIngresos) {
        console.error(
          "❌ Error cargando otros ingresos para el resumen financiero:",
          errorOtrosIngresos
        );
        setOtrosIngresosTransparencia([]);
      } else {
        setOtrosIngresosTransparencia(
          otrosIngresosData || []
        );
      }

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

    const claveCarga = `${usuario.id || "usuario"}:${usuario.condominio_id}`;

    if (dashboardCargaIniciadaRef.current === claveCarga) {
      return;
    }

    dashboardCargaIniciadaRef.current = claveCarga;
    cargarDatos();

  }, [loading, usuario?.condominio_id, usuario?.id, rol]);

  // 💰 TRANSPARENCIA FINANCIERA - CORTES MENSUALES
  // Los meses se construyen desde el primer movimiento financiero disponible
  // hasta el mes actual. Así también se pueden consultar meses sin movimientos.
  const mesesTransparencia = useMemo(() => {
    const meses = new Set<string>();

    pagosTransparencia.forEach((pago) => {
      if (pago.fecha_pago && pago.estado === "PAGADO") {
        meses.add(String(pago.fecha_pago).slice(0, 7));
      }
    });

    gastosTransparencia.forEach((gasto) => {
      if (gasto.fecha_gasto) {
        meses.add(String(gasto.fecha_gasto).slice(0, 7));
      }
    });

    otrosIngresosTransparencia.forEach((ingreso) => {
      const estado = String(
        ingreso.estado || ""
      ).toUpperCase();

      if (
        ingreso.fecha_movimiento &&
        estado !== "ANULADO"
      ) {
        meses.add(
          String(ingreso.fecha_movimiento).slice(0, 7)
        );
      }
    });

    const mesesOrdenados = Array.from(meses).sort();

    if (mesesOrdenados.length === 0) {
      return [];
    }

    const inicio = new Date(`${mesesOrdenados[0]}-01T00:00:00`);
    const hoy = new Date();
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const resultado: string[] = [];

    let cursor = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      1
    );

    while (cursor <= fin) {
      resultado.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
      );

      cursor = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1
      );
    }

    return resultado;
  }, [
    pagosTransparencia,
    gastosTransparencia,
    otrosIngresosTransparencia,
  ]);

  useEffect(() => {
    if (mesesTransparencia.length === 0) {
      setMesTransparencia("");
      return;
    }

    setMesTransparencia((mesActual) => {
      if (mesActual && mesesTransparencia.includes(mesActual)) {
        return mesActual;
      }

      return mesesTransparencia[mesesTransparencia.length - 1];
    });
  }, [mesesTransparencia]);

  const transparenciaMensual = useMemo(() => {
    const meses = mesesTransparencia.map((mes) => {
      const ingresosAlicuotas = pagosTransparencia.reduce(
        (total, pago) => {
          if (
            pago.estado !== "PAGADO" ||
            !pago.fecha_pago ||
            String(pago.fecha_pago).slice(0, 7) !== mes
          ) {
            return total;
          }

          return total + Number(pago.valor_pagado || 0);
        },
        0
      );

      const otrosIngresos = otrosIngresosTransparencia.reduce(
        (total, ingreso) => {
          if (
            !ingreso.fecha_movimiento ||
            String(ingreso.fecha_movimiento).slice(0, 7) !== mes
          ) {
            return total;
          }

          const estado = String(
            ingreso.estado || ""
          ).toUpperCase();

          if (estado === "ANULADO") {
            return total;
          }

          const tipoDocumento = String(
            ingreso.tipo_documento || ""
          ).toUpperCase();

          const valorIngreso =
            tipoDocumento === "COMPROBANTE_INTERNO"
              ? Number(ingreso.subtotal || 0)
              : Number(ingreso.total || 0);

          return total + valorIngreso;
        },
        0
      );

      const egresos = gastosTransparencia.reduce(
        (total, gasto) => {
          if (
            !gasto.fecha_gasto ||
            String(gasto.fecha_gasto).slice(0, 7) !== mes
          ) {
            return total;
          }

          return total + Number(gasto.total || 0);
        },
        0
      );

      const ingresos = ingresosAlicuotas + otrosIngresos;

      return {
        mes,
        ingresos,
        ingresosAlicuotas,
        otrosIngresos,
        egresos,
        resultado: ingresos - egresos,
      };
    });

    let acumulado = 0;

    return meses.map((item) => {
      acumulado += item.resultado;

      return {
        ...item,
        saldoAcumulado: acumulado,
      };
    });
  }, [
    mesesTransparencia,
    pagosTransparencia,
    gastosTransparencia,
    otrosIngresosTransparencia,
  ]);

  const transparenciaSeleccionada =
    transparenciaMensual.find(
      (item) => item.mes === mesTransparencia
    ) || {
      mes: mesTransparencia,
      ingresos: 0,
      ingresosAlicuotas: 0,
      otrosIngresos: 0,
      egresos: 0,
      resultado: 0,
      saldoAcumulado: 0,
    };

  // 👤 RESIDENTE PC · resumen personal inmediato
  // Se construye únicamente con la información del residente autenticado.
  const resumenPersonalResidente = useMemo(() => {
    if (rol !== "RESIDENTE") {
      return {
        saldoPendiente: 0,
        proximaAlicuota: null as any,
        pagosPorValidar: 0,
      };
    }

    const pagosPersonales = pagosTransparencia.filter(
      (pago) =>
        pago.residente_id === usuario?.id &&
        String(pago.estado || "").toUpperCase() !== "ANULADO"
    );

    const saldoPendiente = pagosPersonales.reduce(
      (total, pago) =>
        total + Math.max(Number(pago.saldo_pendiente || 0), 0),
      0
    );

    const pagosPorValidar = pagosPersonales.filter(
      (pago) => String(pago.estado || "").toUpperCase() === "POR_VALIDAR"
    ).length;

    const alicuotasPendientes = pagosPersonales
      .filter(
        (pago) =>
          String(pago.tipo_pago || "").toUpperCase() === "ALICUOTA" &&
          Number(pago.saldo_pendiente || 0) > 0
      )
      .sort((a, b) => {
        const fechaA = a.fecha_vencimiento
          ? new Date(String(a.fecha_vencimiento)).getTime()
          : Number.POSITIVE_INFINITY;
        const fechaB = b.fecha_vencimiento
          ? new Date(String(b.fecha_vencimiento)).getTime()
          : Number.POSITIVE_INFINITY;

        if (fechaA !== fechaB) {
          return fechaA - fechaB;
        }

        return String(a.periodo || "").localeCompare(
          String(b.periodo || "")
        );
      });

    return {
      saldoPendiente,
      proximaAlicuota: alicuotasPendientes[0] || null,
      pagosPorValidar,
    };
  }, [rol, pagosTransparencia, usuario?.id]);

  // 💰 ADMIN MÓVIL · sincronización inicial del período
  useEffect(() => {
    if (mesesTransparencia.length === 0) {
      setMesTransparenciaAdminMovil("");
      return;
    }

    setMesTransparenciaAdminMovil((mesActual) => {
      if (mesActual && mesesTransparencia.includes(mesActual)) {
        return mesActual;
      }

      return mesesTransparencia[mesesTransparencia.length - 1];
    });
  }, [mesesTransparencia]);

  const transparenciaSeleccionadaAdminMovil = useMemo(() => {
    return (
      transparenciaMensual.find(
        (item) => item.mes === mesTransparenciaAdminMovil
      ) || {
        mes: mesTransparenciaAdminMovil,
        ingresos: 0,
        ingresosAlicuotas: 0,
        otrosIngresos: 0,
        egresos: 0,
        resultado: 0,
        saldoAcumulado: 0,
      }
    );
  }, [transparenciaMensual, mesTransparenciaAdminMovil]);

  // 💰 RESIDENTE MÓVIL · sincronización inicial del período
  useEffect(() => {
    if (mesesTransparencia.length === 0) {
      setMesTransparenciaResidenteMovil("");
      return;
    }

    setMesTransparenciaResidenteMovil((mesActual) => {
      if (mesActual && mesesTransparencia.includes(mesActual)) {
        return mesActual;
      }

      return mesesTransparencia[mesesTransparencia.length - 1];
    });
  }, [mesesTransparencia]);

  const transparenciaSeleccionadaResidenteMovil = useMemo(() => {
    return (
      transparenciaMensual.find(
        (item) => item.mes === mesTransparenciaResidenteMovil
      ) || {
        mes: mesTransparenciaResidenteMovil,
        ingresos: 0,
        ingresosAlicuotas: 0,
        otrosIngresos: 0,
        egresos: 0,
        resultado: 0,
        saldoAcumulado: 0,
      }
    );
  }, [transparenciaMensual, mesTransparenciaResidenteMovil]);

  // 💰 DIRECTIVA MÓVIL · sincronización inicial del período
  useEffect(() => {
    if (mesesTransparencia.length === 0) {
      setMesTransparenciaDirectivaMovil("");
      return;
    }
    setMesTransparenciaDirectivaMovil((mesActual) => {
      if (mesActual && mesesTransparencia.includes(mesActual)) return mesActual;
      return mesesTransparencia[mesesTransparencia.length - 1];
    });
  }, [mesesTransparencia]);

  const transparenciaSeleccionadaDirectivaMovil = useMemo(() => {
    return transparenciaMensual.find((item) => item.mes === mesTransparenciaDirectivaMovil) || {
      mes: mesTransparenciaDirectivaMovil, ingresos: 0, ingresosAlicuotas: 0, otrosIngresos: 0, egresos: 0, resultado: 0, saldoAcumulado: 0,
    };
  }, [transparenciaMensual, mesTransparenciaDirectivaMovil]);

  const formatoMesTransparencia = (mes: string) => {
    if (!mes) {
      return "Sin información";
    }

    const [anio, mesNumero] = mes.split("-");
    const fecha = new Date(
      Number(anio),
      Number(mesNumero) - 1,
      1
    );

    return fecha.toLocaleDateString("es-EC", {
      month: "long",
      year: "numeric",
    });
  };

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
            marginBottom: 24,
            padding: "18px 20px",
            borderRadius: 20,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                📊 Mi situación actual
              </div>
              <div
                style={{
                  marginTop: 3,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Resumen inmediato de tu estado personal.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,minmax(0,1fr))",
              gap: 12,
            }}
          >
            <IndicadorResumenResidente
              titulo="💰 Saldo pendiente"
              valor={`$${resumenPersonalResidente.saldoPendiente.toFixed(2)}`}
              detalle={
                resumenPersonalResidente.saldoPendiente > 0
                  ? "Total que tienes pendiente de pago."
                  : "No tienes saldo pendiente."
              }
              color="#16a34a"
            />

            <IndicadorResumenResidente
              titulo="📅 Próxima alícuota"
              valor={
                resumenPersonalResidente.proximaAlicuota
                  ? `$${Number(resumenPersonalResidente.proximaAlicuota.saldo_pendiente || 0).toFixed(2)}`
                  : "Al día"
              }
              detalle={
                resumenPersonalResidente.proximaAlicuota
                  ? `Vence: ${String(resumenPersonalResidente.proximaAlicuota.fecha_vencimiento || "Sin fecha").slice(0, 10)}`
                  : "No tienes alícuotas pendientes."
              }
              color="#2563eb"
            />

            <IndicadorResumenResidente
              titulo="🧾 Pagos por validar"
              valor={String(resumenPersonalResidente.pagosPorValidar)}
              detalle={
                resumenPersonalResidente.pagosPorValidar === 0
                  ? "No tienes pagos pendientes de validación."
                  : resumenPersonalResidente.pagosPorValidar === 1
                    ? "Pago enviado pendiente de validación."
                    : "Pagos enviados pendientes de validación."
              }
              color="#f59e0b"
            />

            <IndicadorResumenResidente
              titulo="📢 Avisos pendientes"
              valor={String(avisosPendientesResidente)}
              detalle={
                avisosPendientesResidente === 0
                  ? "No tienes avisos pendientes."
                  : "Avisos publicados que aún no has leído."
              }
              color="#dc2626"
            />
          </div>
        </div>

        <div
          style={{
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            🧭 Mis servicios
          </div>
          <div
            style={{
              marginTop: 3,
              color: "#64748b",
              fontSize: 13,
            }}
          >
            Accede a las funciones disponibles de tu cuenta.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: 20,
          }}
        >
          <CardPremiumInteractiva
            titulo="💰 Estado de Cuenta"
            color="#16a34a"
            detalle="Consulta tu saldo, alícuotas y movimientos."
            onClick={() =>
              router.push("/estado-cuenta")
            }
          />

          <CardPremiumInteractiva
            titulo="📄 Mis Comprobantes"
            color="#2563eb"
            detalle="Consulta tus alícuotas, registra tus pagos y revisa tus comprobantes."
            onClick={() =>
              router.push("/pagos")
            }
          />

          <CardPremiumInteractiva
            titulo="📅 Mis Reservas"
            color="#7c3aed"
            detalle="Consulta tus reservas y el historial de áreas comunes."
            onClick={() =>
              router.push(
                "/reservas?solo=historial"
              )
            }
          />

          <CardPremiumInteractiva
            titulo="🚗 Mis Visitas"
            color="#f59e0b"
            detalle="Consulta tus visitas y el historial de ingresos."
            onClick={() =>
              router.push(
                "/visitas?solo=historial"
              )
            }
          />

          <CardPremiumInteractiva
            titulo="📢 Novedades"
            color="#dc2626"
            detalle="Consulta avisos y novedades de la urbanización."
            onClick={() =>
              router.push(
                "/novedades?solo=historial"
              )
            }
          />
        </div>

        {/* TRANSPARENCIA FINANCIERA DEL RESIDENTE */}
        <div style={{ marginTop: 30, marginBottom: 30, padding: 24, borderRadius: 24, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 6, fontWeight: 800 }}>Transparencia Financiera de la urbanización</h2>
              <div style={{ color: "#64748b", fontSize: 14 }}>Corte mensual de ingresos, gastos y saldo acumulado.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" disabled={!mesTransparencia || mesesTransparencia.indexOf(mesTransparencia) <= 0} onClick={() => { const indice = mesesTransparencia.indexOf(mesTransparencia); if (indice > 0) setMesTransparencia(mesesTransparencia[indice - 1]); }} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "9px 12px", cursor: "pointer", opacity: !mesTransparencia || mesesTransparencia.indexOf(mesTransparencia) <= 0 ? 0.45 : 1 }}>←</button>
              <select value={mesTransparencia} onChange={(e) => setMesTransparencia(e.target.value)} style={{ minWidth: 190, border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#fff", fontWeight: 600, color: "#0f172a" }}>
                {mesesTransparencia.length === 0 ? <option value="">Sin información</option> : mesesTransparencia.map((mes) => <option key={mes} value={mes}>{formatoMesTransparencia(mes)}</option>)}
              </select>
              <button type="button" disabled={!mesTransparencia || mesesTransparencia.indexOf(mesTransparencia) === mesesTransparencia.length - 1} onClick={() => { const indice = mesesTransparencia.indexOf(mesTransparencia); if (indice >= 0 && indice < mesesTransparencia.length - 1) setMesTransparencia(mesesTransparencia[indice + 1]); }} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "9px 12px", cursor: "pointer", opacity: !mesTransparencia || mesesTransparencia.indexOf(mesTransparencia) === mesesTransparencia.length - 1 ? 0.45 : 1 }}>→</button>
            </div>
          </div>
          <div style={{ marginBottom: 18, color: "#475569", fontSize: 14, fontWeight: 600 }}>Período: {formatoMesTransparencia(transparenciaSeleccionada.mes)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20 }}>
            <CardPremium
              titulo="🏠 Ingresos por alícuotas"
              valor={`$${transparenciaSeleccionada.ingresosAlicuotas.toFixed(2)}`}
              color="#16a34a"
              compact
            />

            <CardPremium
              titulo="💰 Otros ingresos"
              valor={`$${transparenciaSeleccionada.otrosIngresos.toFixed(2)}`}
              color="#059669"
              compact
            />

            <CardPremium
              titulo="💵 Ingresos totales del mes"
              valor={`$${transparenciaSeleccionada.ingresos.toFixed(2)}`}
              color="#0f766e"
              compact
            />

            <CardPremium
              titulo="🧾 Gastos del mes"
              valor={`$${transparenciaSeleccionada.egresos.toFixed(2)}`}
              color="#dc2626"
              compact
            />

            <CardPremium
              titulo="📊 Resultado del mes"
              valor={`$${transparenciaSeleccionada.resultado.toFixed(2)}`}
              color={
                transparenciaSeleccionada.resultado >= 0
                  ? "#16a34a"
                  : "#dc2626"
              }
              compact
            />

            <CardPremium
              titulo="📘 Saldo acumulado anterior"
              valor={`$${(
                transparenciaSeleccionada.saldoAcumulado -
                transparenciaSeleccionada.resultado
              ).toFixed(2)}`}
              color="#2563eb"
              compact
            />

            <CardPremium
              titulo="💼 Nuevo saldo acumulado"
              valor={`$${transparenciaSeleccionada.saldoAcumulado.toFixed(2)}`}
              color="#7c3aed"
              compact
            />
          </div>
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

          <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <div className="residente-mobile-title" style={{ margin: 0 }}>Transparencia Financiera</div>
              <div className="residente-mobile-subtitle" style={{ marginTop: 4 }}>De la urbanización · corte mensual</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button type="button" disabled={!mesTransparenciaResidenteMovil || mesesTransparencia.indexOf(mesTransparenciaResidenteMovil) <= 0} onClick={() => { const indice = mesesTransparencia.indexOf(mesTransparenciaResidenteMovil); if (indice > 0) setMesTransparenciaResidenteMovil(mesesTransparencia[indice - 1]); }} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 9, padding: "8px 11px", cursor: "pointer", opacity: !mesTransparenciaResidenteMovil || mesesTransparencia.indexOf(mesTransparenciaResidenteMovil) <= 0 ? 0.45 : 1 }}>←</button>
              <select
                value={mesTransparenciaResidenteMovil}
                onChange={(e) => setMesTransparenciaResidenteMovil(e.target.value)}
                onInput={(e) => setMesTransparenciaResidenteMovil((e.target as HTMLSelectElement).value)}
                style={{ flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 9, padding: "9px 10px", background: "#fff", fontWeight: 600, color: "#0f172a" }}
              >
                {mesesTransparencia.length === 0 ? <option value="">Sin información</option> : mesesTransparencia.map((mes) => <option key={mes} value={mes}>{formatoMesTransparencia(mes)}</option>)}
              </select>
              <button type="button" disabled={!mesTransparenciaResidenteMovil || mesesTransparencia.indexOf(mesTransparenciaResidenteMovil) === mesesTransparencia.length - 1} onClick={() => { const indice = mesesTransparencia.indexOf(mesTransparenciaResidenteMovil); if (indice >= 0 && indice < mesesTransparencia.length - 1) setMesTransparenciaResidenteMovil(mesesTransparencia[indice + 1]); }} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 9, padding: "8px 11px", cursor: "pointer", opacity: !mesTransparenciaResidenteMovil || mesesTransparencia.indexOf(mesTransparenciaResidenteMovil) === mesesTransparencia.length - 1 ? 0.45 : 1 }}>→</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 10 }}>Período: {formatoMesTransparencia(transparenciaSeleccionadaResidenteMovil.mes)}</div>
            <div key={`residente-finanzas-${mesTransparenciaResidenteMovil}`} style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}>
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 13, padding: 11 }}><div style={{ fontSize: 11, color: "#047857" }}>Ingresos del mes</div><div style={{ fontSize: 18, fontWeight: 800, color: "#065f46", marginTop: 4 }}>${transparenciaSeleccionadaResidenteMovil.ingresos.toFixed(2)}</div></div>
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 13, padding: 11 }}><div style={{ fontSize: 11, color: "#be123c" }}>Gastos del mes</div><div style={{ fontSize: 18, fontWeight: 800, color: "#9f1239", marginTop: 4 }}>${transparenciaSeleccionadaResidenteMovil.egresos.toFixed(2)}</div></div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 13, padding: 11 }}><div style={{ fontSize: 11, color: "#1d4ed8" }}>Resultado del mes</div><div style={{ fontSize: 18, fontWeight: 800, color: transparenciaSeleccionadaResidenteMovil.resultado >= 0 ? "#1e3a8a" : "#dc2626", marginTop: 4 }}>${transparenciaSeleccionadaResidenteMovil.resultado.toFixed(2)}</div></div>
              <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 13, padding: 11 }}><div style={{ fontSize: 11, color: "#6d28d9" }}>Saldo acumulado</div><div style={{ fontSize: 18, fontWeight: 800, color: transparenciaSeleccionadaResidenteMovil.saldoAcumulado >= 0 ? "#5b21b6" : "#dc2626", marginTop: 4 }}>${transparenciaSeleccionadaResidenteMovil.saldoAcumulado.toFixed(2)}</div></div>
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
        <style dangerouslySetInnerHTML={{ __html: guardiaMobileStyles }} />

        {/* ==========================================
            GUARDIA - ESCRITORIO
            ========================================== */}
        <div className="guardia-desktop">
          <div
            style={{
              background:
                "linear-gradient(135deg,#111827,#1f2937)",
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
              Panel de Guardia
            </h1>

            <p
              style={{
                marginTop: 12,
                color: "#d1d5db",
              }}
            >
              Gestión de visitas, accesos y novedades.
            </p>
          </div>

          {/* ACCIONES PRINCIPALES */}
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
              ⚡ Acciones principales
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
                titulo="🚗 Control de Acceso"
                valor="Gestionar"
                color="#2563eb"
                onClick={() =>
                  router.push("/visitas")
                }
              />

              <CardPremium
                titulo="📢 Novedades"
                valor={novedades}
                color="#dc2626"
                onClick={() =>
                  router.push("/novedades")
                }
              />

              <CardPremium
                titulo="🛡️ Rondas de Vigilancia"
                valor="Gestionar"
                color="#16a34a"
                onClick={() =>
                  router.push("/rondas-guardia")
                }
              />

              <CardPremium
                titulo="📦 Paquetería"
                valor="Gestionar"
                color="#f97316"
                onClick={() =>
                  router.push("/paqueteria")
                }
              />
            </div>
          </div>

          {/* INFORMACIÓN DE LA URBANIZACIÓN */}
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
              🏘️ Información de la urbanización
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
                titulo="🏠 Viviendas"
                valor={viviendas}
                color="#4f46e5"
                onClick={() =>
                  router.push("/viviendas")
                }
              />

              <CardPremium
                titulo="👥 Residentes"
                valor={residentes}
                color="#475569"
                onClick={() =>
                  router.push("/residentes")
                }
              />
            </div>
          </div>

          {/* COMUNICACIÓN */}
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
              📢 Comunicación
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
                titulo="📢 Avisos"
                valor="Consultar"
                color="#7c3aed"
                onClick={() =>
                  router.push("/avisos")
                }
              />
            </div>
          </div>

          {/* RESUMEN DE HOY */}
          <div>
            <h2
              style={{
                marginBottom: 20,
              }}
            >
              📊 Resumen de hoy
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",
                gap: 20,
              }}
            >
              <CardPremium
                titulo="🚗 Visitas hoy"
                valor={visitasHoy}
                color="#2563eb"
                onClick={() =>
                  router.push("/visitas")
                }
              />

              <CardPremium
                titulo="📢 Novedades"
                valor={novedades}
                color="#dc2626"
                onClick={() =>
                  router.push("/novedades")
                }
              />

              <CardPremium
                titulo="🏠 Viviendas"
                valor={viviendas}
                color="#4f46e5"
                onClick={() =>
                  router.push("/viviendas")
                }
              />

              <CardPremium
                titulo="👥 Residentes"
                valor={residentes}
                color="#475569"
                onClick={() =>
                  router.push("/residentes")
                }
              />
            </div>
          </div>
        </div>

        {/* ==========================================
            GUARDIA - MÓVIL · EXPERIENCIA TIPO APP
            ========================================== */}
        <div className="guardia-mobile">
          <div className="guardia-mobile-header">
            <div className="guardia-mobile-header-glow" />
            <div className="guardia-mobile-saludo">
              <div className="guardia-mobile-avatar">🛡️</div>
              <div className="guardia-mobile-header-info">
                <div className="guardia-mobile-hola">
                  ¡Hola, {usuario.nombre || "Guardia"}!
                </div>
                <div className="guardia-mobile-condominio">
                  🌐 {cargandoCondominio
                    ? "Cargando urbanización..."
                    : nombreCondominio || "Urbanización no disponible"}
                </div>
                <div className="guardia-mobile-rol">
                  🛡️ Personal de seguridad
                </div>
              </div>
            </div>
          </div>

          <div className="guardia-mobile-section">
            <div className="guardia-mobile-section-title">
              <span>⚡</span> Acciones principales
            </div>

            <div className="guardia-mobile-grid">
              <button
                type="button"
                className="guardia-mobile-card guardia-card-blue"
                onClick={() => router.push("/visitas")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="visitas" />
                </div>
                <div className="guardia-mobile-card-title">Control de Acceso</div>
                <div className="guardia-mobile-card-value">Gestionar</div>
                <div className="guardia-mobile-card-subtitle">
                  Controla visitas, PIN y accesos de la urbanización.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>

              <button
                type="button"
                className="guardia-mobile-card guardia-card-red"
                onClick={() => router.push("/novedades")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="novedades" />
                </div>
                <div className="guardia-mobile-card-title">Novedades</div>
                <div className="guardia-mobile-card-value">{novedades}</div>
                <div className="guardia-mobile-card-subtitle">
                  Registra y consulta situaciones de seguridad.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>

              <button
                type="button"
                className="guardia-mobile-card guardia-card-green"
                onClick={() => router.push("/rondas-guardia")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="acceso" />
                </div>
                <div className="guardia-mobile-card-title">Rondas de Vigilancia</div>
                <div className="guardia-mobile-card-value">Gestionar</div>
                <div className="guardia-mobile-card-subtitle">
                  Realiza y registra las rondas de seguridad.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>

              <button
                type="button"
                className="guardia-mobile-card guardia-card-orange"
                onClick={() => router.push("/paqueteria")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="paqueteria" />
                </div>
                <div className="guardia-mobile-card-title">Paquetería</div>
                <div className="guardia-mobile-card-value">Gestionar</div>
                <div className="guardia-mobile-card-subtitle">
                  Registra y entrega paquetes recibidos.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>
            </div>
          </div>

          <div className="guardia-mobile-section">
            <div className="guardia-mobile-section-title">
              <span>🏘️</span> Información de la urbanización
            </div>

            <div className="guardia-mobile-grid">
              <button
                type="button"
                className="guardia-mobile-card guardia-card-indigo"
                onClick={() => router.push("/viviendas")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="viviendas" />
                </div>
                <div className="guardia-mobile-card-title">Viviendas</div>
                <div className="guardia-mobile-card-value">{viviendas}</div>
                <div className="guardia-mobile-card-subtitle">
                  Consulta las unidades registradas.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>

              <button
                type="button"
                className="guardia-mobile-card guardia-card-slate"
                onClick={() => router.push("/residentes")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="residentes" />
                </div>
                <div className="guardia-mobile-card-title">Residentes</div>
                <div className="guardia-mobile-card-value">{residentes}</div>
                <div className="guardia-mobile-card-subtitle">
                  Consulta los residentes de la urbanización.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>

              <button
                type="button"
                className="guardia-mobile-card guardia-card-purple"
                onClick={() => router.push("/tecnicos")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="servicios" />
                </div>
                <div className="guardia-mobile-card-title">Ecosistema de Servicios</div>
                <div className="guardia-mobile-card-value">Consultar</div>
                <div className="guardia-mobile-card-subtitle">
                  Profesionales y servicios disponibles.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>

              <button
                type="button"
                className="guardia-mobile-card guardia-card-cyan"
                onClick={() => router.push("/activar-por-pagos")}
              >
                <div className="guardia-mobile-icon">
                  <IconoAdminMovil tipo="gestionServicios" />
                </div>
                <div className="guardia-mobile-card-title">Gestión de Servicios</div>
                <div className="guardia-mobile-card-value">Consultar</div>
                <div className="guardia-mobile-card-subtitle">
                  Solicitudes y gestión de servicios.
                </div>
                <div className="guardia-mobile-arrow">→</div>
              </button>
            </div>
          </div>

          <div className="guardia-mobile-section">
            <div className="guardia-mobile-section-title">
              <span>📢</span> Comunicación
            </div>

            <button
              type="button"
              className="guardia-mobile-wide-card guardia-card-violet"
              onClick={() => router.push("/avisos")}
            >
              <div className="guardia-mobile-wide-icon">
                <IconoAdminMovil tipo="avisos" />
              </div>
              <div className="guardia-mobile-wide-text">
                <div className="guardia-mobile-card-title">Avisos</div>
                <div className="guardia-mobile-card-subtitle">
                  Consulta los comunicados publicados por la administración, incluido su historial.
                </div>
              </div>
              <div className="guardia-mobile-arrow">→</div>
            </button>
          </div>

          <div className="guardia-mobile-resumen">
            <div className="guardia-mobile-resumen-title">
              <span>📊</span> Resumen de hoy
            </div>
            <div className="guardia-mobile-resumen-grid">
              <div className="guardia-mobile-mini">
                <span className="guardia-mobile-mini-icon">
                  <IconoAdminMovil tipo="visitas" />
                </span>
                <strong>{visitasHoy}</strong>
                <small>Visitas hoy</small>
              </div>
              <div className="guardia-mobile-mini">
                <span className="guardia-mobile-mini-icon">
                  <IconoAdminMovil tipo="novedades" />
                </span>
                <strong>{novedades}</strong>
                <small>Novedades</small>
              </div>
              <div className="guardia-mobile-mini">
                <span className="guardia-mobile-mini-icon">
                  <IconoAdminMovil tipo="viviendas" />
                </span>
                <strong>{viviendas}</strong>
                <small>Viviendas</small>
              </div>
              <div className="guardia-mobile-mini">
                <span className="guardia-mobile-mini-icon">
                  <IconoAdminMovil tipo="residentes" />
                </span>
                <strong>{residentes}</strong>
                <small>Residentes</small>
              </div>
            </div>
          </div>
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
      <style dangerouslySetInnerHTML={{ __html: directivaMobileStyles }} />
      <div className="directiva-desktop">
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

      {/* 🔥 FINANCIERO */}

      <div
        style={{
          marginBottom: 30,
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
            <h2
              style={{
                margin: 0,
                marginBottom: 6,
              }}
            >
              Resumen Financiero
            </h2>
            <div
              style={{
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Resumen del período seleccionado de la urbanización.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <button
              type="button"
              disabled={
                !mesTransparencia ||
                mesesTransparencia.indexOf(mesTransparencia) <= 0
              }
              onClick={() => {
                const indice = mesesTransparencia.indexOf(
                  mesTransparencia
                );
                if (indice > 0) {
                  setMesTransparencia(
                    mesesTransparencia[indice - 1]
                  );
                }
              }}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: 10,
                padding: "9px 12px",
                cursor: "pointer",
                opacity:
                  !mesTransparencia ||
                  mesesTransparencia.indexOf(mesTransparencia) <= 0
                    ? 0.45
                    : 1,
              }}
            >
              ←
            </button>

            <select
              value={mesTransparencia}
              onChange={(e) =>
                setMesTransparencia(e.target.value)
              }
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
              {mesesTransparencia.length === 0 ? (
                <option value="">Sin información</option>
              ) : (
                mesesTransparencia.map((mes) => (
                  <option key={mes} value={mes}>
                    {formatoMesTransparencia(mes)}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              disabled={
                !mesTransparencia ||
                mesesTransparencia.indexOf(mesTransparencia) ===
                  mesesTransparencia.length - 1
              }
              onClick={() => {
                const indice = mesesTransparencia.indexOf(
                  mesTransparencia
                );
                if (
                  indice >= 0 &&
                  indice < mesesTransparencia.length - 1
                ) {
                  setMesTransparencia(
                    mesesTransparencia[indice + 1]
                  );
                }
              }}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: 10,
                padding: "9px 12px",
                cursor: "pointer",
                opacity:
                  !mesTransparencia ||
                  mesesTransparencia.indexOf(mesTransparencia) ===
                    mesesTransparencia.length - 1
                    ? 0.45
                    : 1,
              }}
            >
              →
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: 16,
            color: "#475569",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Período: {formatoMesTransparencia(
            transparenciaSeleccionada.mes
          )}
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
            titulo="🏠 Ingresos por alícuotas"
            valor={`$${transparenciaSeleccionada.ingresosAlicuotas.toFixed(2)}`}
            color="#16a34a"
          />

          <CardPremium
            titulo="💰 Otros ingresos"
            valor={`$${transparenciaSeleccionada.otrosIngresos.toFixed(2)}`}
            color="#059669"
          />

          <CardPremium
            titulo="💵 Ingresos totales del mes"
            valor={`$${transparenciaSeleccionada.ingresos.toFixed(2)}`}
            color="#0f766e"
          />

          <CardPremium
            titulo="🧾 Gastos del mes"
            valor={`$${transparenciaSeleccionada.egresos.toFixed(2)}`}
            color="#dc2626"
            onClick={() =>
              router.push(
                "/reportes/gastos"
              )
            }
            interactivo={true}
          />

          <CardPremium
            titulo="📊 Resultado del mes"
            valor={`$${transparenciaSeleccionada.resultado.toFixed(2)}`}
            color={
              transparenciaSeleccionada.resultado >= 0
                ? "#16a34a"
                : "#dc2626"
            }
          />

          <CardPremium
            titulo="📘 Saldo acumulado anterior"
            valor={`$${(
              transparenciaSeleccionada.saldoAcumulado -
              transparenciaSeleccionada.resultado
            ).toFixed(2)}`}
            color="#2563eb"
          />

          <CardPremium
            titulo="💼 Nuevo saldo acumulado"
            valor={`$${transparenciaSeleccionada.saldoAcumulado.toFixed(2)}`}
            color="#7c3aed"
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
            titulo="📋 Aprobaciones de gastos"
            valor="Revisar"
            color="#f59e0b"
            onClick={() =>
              router.push(
                "/aprobaciones-directiva"
              )
            }
            interactivo={true}
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
            interactivo={true}
          />

         <CardPremium
  titulo="📝 Sesiones y Acuerdos"
  valor="Gestionar"
  color="#2563eb"
  onClick={() =>
    router.push("/sesiones-acuerdos")
  }
  interactivo={true}
/>

        </div>
      </div>
      </div>

      {/* ==========================================
          DIRECTIVA - MÓVIL · EXPERIENCIA TIPO APP
          ========================================== */}
      <div className="directiva-mobile">
        <div className="directiva-mobile-header">
          <div className="directiva-mobile-header-glow" />
          <div className="directiva-mobile-saludo">
            <div className="directiva-mobile-avatar">🏛️</div>
            <div className="directiva-mobile-header-info">
              <div className="directiva-mobile-hola">¡Hola, {usuario.nombre || "Directiva"}!</div>
              <div className="directiva-mobile-condominio">🌐 {cargandoCondominio ? "Cargando urbanización..." : nombreCondominio || "Urbanización no disponible"}</div>
              <div className="directiva-mobile-rol">🏛️ Miembro de la Directiva</div>
            </div>
          </div>
        </div>

        <div className="directiva-mobile-section">
          <div className="directiva-mobile-section-title">💰 Resumen Financiero</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              disabled={!mesTransparenciaDirectivaMovil || mesesTransparencia.indexOf(mesTransparenciaDirectivaMovil) <= 0}
              onClick={() => {
                const indice = mesesTransparencia.indexOf(mesTransparenciaDirectivaMovil);
                if (indice > 0) setMesTransparenciaDirectivaMovil(mesesTransparencia[indice - 1]);
              }}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: 9,
                padding: "8px 11px",
                cursor: "pointer",
                opacity:
                  !mesTransparenciaDirectivaMovil ||
                  mesesTransparencia.indexOf(mesTransparenciaDirectivaMovil) <= 0
                    ? 0.45
                    : 1,
              }}
            >
              ←
            </button>

            <select
              value={mesTransparenciaDirectivaMovil}
              onChange={(e) => setMesTransparenciaDirectivaMovil(e.target.value)}
              onInput={(e) =>
                setMesTransparenciaDirectivaMovil(
                  (e.target as HTMLSelectElement).value
                )
              }
              style={{
                flex: 1,
                minWidth: 0,
                border: "1px solid #cbd5e1",
                borderRadius: 9,
                padding: "9px 10px",
                background: "#fff",
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              {mesesTransparencia.length === 0 ? (
                <option value="">Sin información</option>
              ) : (
                mesesTransparencia.map((mes) => (
                  <option key={mes} value={mes}>
                    {formatoMesTransparencia(mes)}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              disabled={
                !mesTransparenciaDirectivaMovil ||
                mesesTransparencia.indexOf(mesTransparenciaDirectivaMovil) ===
                  mesesTransparencia.length - 1
              }
              onClick={() => {
                const indice = mesesTransparencia.indexOf(mesTransparenciaDirectivaMovil);
                if (
                  indice >= 0 &&
                  indice < mesesTransparencia.length - 1
                ) {
                  setMesTransparenciaDirectivaMovil(mesesTransparencia[indice + 1]);
                }
              }}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: 9,
                padding: "8px 11px",
                cursor: "pointer",
                opacity:
                  !mesTransparenciaDirectivaMovil ||
                  mesesTransparencia.indexOf(mesTransparenciaDirectivaMovil) ===
                    mesesTransparencia.length - 1
                    ? 0.45
                    : 1,
              }}
            >
              →
            </button>
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#475569",
              marginBottom: 10,
            }}
          >
            Período: {formatoMesTransparencia(transparenciaSeleccionadaDirectivaMovil.mes)}
          </div>

          <div
            key={`directiva-finanzas-${mesTransparenciaDirectivaMovil}`}
            className="directiva-mobile-grid"
          >
            <div className="directiva-mobile-card directiva-card-green">
              <div className="directiva-mobile-icon">
                <IconoAdminMovil tipo="recaudado" />
              </div>
              <div className="directiva-mobile-card-title">Recaudado del mes</div>
              <div className="directiva-mobile-card-value">
                ${transparenciaSeleccionadaDirectivaMovil.ingresos.toFixed(2)}
              </div>
              <div className="directiva-mobile-card-subtitle">
                Ingresos registrados del período.
              </div>
            </div>

            <div className="directiva-mobile-card directiva-card-red">
              <div className="directiva-mobile-icon">
                <IconoAdminMovil tipo="gastos" />
              </div>
              <div className="directiva-mobile-card-title">Gastos del mes</div>
              <div className="directiva-mobile-card-value">
                ${transparenciaSeleccionadaDirectivaMovil.egresos.toFixed(2)}
              </div>
              <div className="directiva-mobile-card-subtitle">
                Gastos registrados del período.
              </div>
            </div>

            <div className="directiva-mobile-card directiva-card-blue">
              <div className="directiva-mobile-icon">
                <IconoAdminMovil tipo="saldo" />
              </div>
              <div className="directiva-mobile-card-title">Resultado del mes</div>
              <div
                className="directiva-mobile-card-value"
                style={{
                  color:
                    transparenciaSeleccionadaDirectivaMovil.resultado >= 0
                      ? "#16a34a"
                      : "#dc2626",
                }}
              >
                ${transparenciaSeleccionadaDirectivaMovil.resultado.toFixed(2)}
              </div>
              <div className="directiva-mobile-card-subtitle">
                Ingresos menos gastos del período.
              </div>
            </div>

            <div className="directiva-mobile-card directiva-card-purple">
              <div className="directiva-mobile-icon">
                <IconoAdminMovil tipo="saldo" />
              </div>
              <div className="directiva-mobile-card-title">Saldo acumulado</div>
              <div
                className="directiva-mobile-card-value"
                style={{
                  color:
                    transparenciaSeleccionadaDirectivaMovil.saldoAcumulado >= 0
                      ? "#7c3aed"
                      : "#dc2626",
                }}
              >
                ${transparenciaSeleccionadaDirectivaMovil.saldoAcumulado.toFixed(2)}
              </div>
              <div className="directiva-mobile-card-subtitle">
                Resultado acumulado hasta el período.
              </div>
            </div>

            <div className="directiva-mobile-card directiva-card-red">
              <div className="directiva-mobile-icon">
                <IconoAdminMovil tipo="vencidos" />
              </div>
              <div className="directiva-mobile-card-title">Cartera Vencida</div>
              <div className="directiva-mobile-card-value">{pagosVencidos}</div>
              <div className="directiva-mobile-card-subtitle">
                Pagos pendientes de recuperación.
              </div>
              <div className="directiva-mobile-arrow">→</div>
            </div>
          </div>
        </div>

        <div className="directiva-mobile-section">
          <div className="directiva-mobile-section-title">📝 Supervisión</div>
          <div className="directiva-mobile-grid">
            <button type="button" className="directiva-mobile-card directiva-card-orange" onClick={() => router.push("/aprobaciones-directiva")}>
              <div className="directiva-mobile-icon"><IconoAdminMovil tipo="aprobadas" /></div>
              <div className="directiva-mobile-card-title">Aprobaciones de gastos</div>
              <div className="directiva-mobile-card-value">Revisar</div>
              <div className="directiva-mobile-card-subtitle">Revisa las solicitudes pendientes.</div>
              <div className="directiva-mobile-arrow">→</div>
            </button>

            <button type="button" className="directiva-mobile-card directiva-card-purple" onClick={() => router.push("/configuracion-financiera")}>
              <div className="directiva-mobile-icon"><IconoAdminMovil tipo="finanzas" /></div>
              <div className="directiva-mobile-card-title">Configuración Financiera</div>
              <div className="directiva-mobile-card-value">Consultar</div>
              <div className="directiva-mobile-card-subtitle">Consulta los parámetros financieros.</div>
              <div className="directiva-mobile-arrow">→</div>
            </button>

            <button type="button" className="directiva-mobile-card directiva-card-blue" onClick={() => router.push("/sesiones-acuerdos")}>
              <div className="directiva-mobile-icon"><IconoAdminMovil tipo="directiva" /></div>
              <div className="directiva-mobile-card-title">Sesiones y Acuerdos</div>
              <div className="directiva-mobile-card-value">Gestionar</div>
              <div className="directiva-mobile-card-subtitle">Consulta sesiones, acuerdos y decisiones.</div>
              <div className="directiva-mobile-arrow">→</div>
            </button>

            <button type="button" className="directiva-mobile-card directiva-card-indigo" onClick={() => router.push("/votaciones")}>
              <div className="directiva-mobile-icon"><IconoAdminMovil tipo="votaciones" /></div>
              <div className="directiva-mobile-card-title">Votaciones</div>
              <div className="directiva-mobile-card-value">Consultar</div>
              <div className="directiva-mobile-card-subtitle">Participa y revisa las votaciones.</div>
              <div className="directiva-mobile-arrow">→</div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


  // 🔥 DASHBOARD ADMIN

 return (

  <>
        <style dangerouslySetInnerHTML={{ __html: adminMobileStyles }} />

        {/* ==========================================
            ADMIN - MÓVIL · EXPERIENCIA TIPO APP
            ========================================== */}
        <div className="admin-mobile">
          <div className="admin-mobile-header">
            <div className="admin-mobile-header-glow" />
            <div className="admin-mobile-saludo">
              <div className="admin-mobile-avatar">👤</div>
              <div className="admin-mobile-header-info">
                <div className="admin-mobile-hola">¡Hola, {usuario.nombre || "Administrador"}!</div>
                <div className="admin-mobile-condominio">🌐 {cargandoCondominio ? "Cargando urbanización..." : nombreCondominio || "Urbanización no disponible"}</div>
                <div className="admin-mobile-rol">🏢 Administrador</div>
              </div>
            </div>
          </div>

          {(pagosValidar > 0 || lecturasPendientesAdmin > 0) && (
            <div className="admin-mobile-alertas">
              <div className="admin-mobile-section-title"><span>⚡</span> Atención inmediata</div>
              {pagosValidar > 0 && (
                <button type="button" className="admin-mobile-alert admin-mobile-alert-warning" onClick={() => router.push("/pagos")}>
                  <div className="admin-mobile-alert-icon"><IconoAdminMovil tipo="validar" /></div>
                  <div className="admin-mobile-alert-text"><strong>{pagosValidar} pago{pagosValidar === 1 ? "" : "s"} por validar</strong><span>Revisa los comprobantes pendientes.</span></div>
                  <div className="admin-mobile-arrow">→</div>
                </button>
              )}
              {lecturasPendientesAdmin > 0 && (
                <button type="button" className="admin-mobile-alert admin-mobile-alert-info" onClick={() => router.push("/avisos")}>
                  <div className="admin-mobile-alert-icon"><IconoAdminMovil tipo="lecturas" /></div>
                  <div className="admin-mobile-alert-text"><strong>{lecturasPendientesAdmin} lectura{lecturasPendientesAdmin === 1 ? "" : "s"} pendiente{lecturasPendientesAdmin === 1 ? "" : "s"}</strong><span>Del último aviso publicado.</span></div>
                  <div className="admin-mobile-arrow">→</div>
                </button>
              )}
            </div>
          )}

          <div className="admin-mobile-section">
            <div className="admin-mobile-section-title"><span>💰</span> Resumen financiero</div>

            <button
              type="button"
              className="admin-mobile-account-card"
              onClick={() => router.push("/estado-cuenta")}
            >
              <div className="admin-mobile-account-icon"><IconoAdminMovil tipo="finanzas" /></div>
              <div className="admin-mobile-account-content">
                <div className="admin-mobile-account-title">📄 Estado de Cuenta del Residente</div>
                <div className="admin-mobile-account-subtitle">Consulta deuda, pagos, saldos y períodos por residente.</div>
              </div>
              <div className="admin-mobile-account-action">Consultar&nbsp;→</div>
            </button>

            <div className="admin-mobile-subsection-title">
              <span>📊</span> Indicadores financieros
            </div>

            <div
              style={{
                marginBottom: 12,
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Período: {formatoMesTransparencia(
                transparenciaSeleccionadaAdminMovil.mes
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <button
                type="button"
                disabled={
                  !mesTransparenciaAdminMovil ||
                  mesesTransparencia.indexOf(mesTransparenciaAdminMovil) <= 0
                }
                onClick={() => {
                  const indice = mesesTransparencia.indexOf(
                    mesTransparenciaAdminMovil
                  );
                  if (indice > 0) {
                    setMesTransparenciaAdminMovil(
                      mesesTransparencia[indice - 1]
                    );
                  }
                }}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "8px 11px",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ←
              </button>

              <select
                value={mesTransparenciaAdminMovil}
                onChange={(e) =>
                  setMesTransparenciaAdminMovil(e.target.value)
                }
                onInput={(e) =>
                  setMesTransparenciaAdminMovil(
                    (e.target as HTMLSelectElement).value
                  )
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "9px 10px",
                  background: "#fff",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {mesesTransparencia.length === 0 ? (
                  <option value="">Sin información</option>
                ) : (
                  mesesTransparencia.map((mes) => (
                    <option key={mes} value={mes}>
                      {formatoMesTransparencia(mes)}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                disabled={
                  !mesTransparenciaAdminMovil ||
                  mesesTransparencia.indexOf(mesTransparenciaAdminMovil) ===
                    mesesTransparencia.length - 1
                }
                onClick={() => {
                  const indice = mesesTransparencia.indexOf(
                    mesTransparenciaAdminMovil
                  );
                  if (
                    indice >= 0 &&
                    indice < mesesTransparencia.length - 1
                  ) {
                    setMesTransparenciaAdminMovil(
                      mesesTransparencia[indice + 1]
                    );
                  }
                }}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "8px 11px",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                →
              </button>
            </div>

            <div
              key={`admin-finanzas-${mesTransparenciaAdminMovil}`}
              className="admin-mobile-grid"
            >
              <div className="admin-mobile-card admin-card-green">
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="recaudado" /></div><div className="admin-mobile-card-title">Ingresos por alícuotas</div><div className="admin-mobile-card-value">${transparenciaSeleccionadaAdminMovil.ingresosAlicuotas.toFixed(2)}</div><div className="admin-mobile-card-subtitle">Recaudación efectiva por alícuotas.</div>
              </div>

              <div className="admin-mobile-card admin-card-green">
                <div className="admin-mobile-icon">💰</div><div className="admin-mobile-card-title">Otros ingresos</div><div className="admin-mobile-card-value">${transparenciaSeleccionadaAdminMovil.otrosIngresos.toFixed(2)}</div><div className="admin-mobile-card-subtitle">Ingresos diferentes de las alícuotas.</div>
              </div>

              <div className="admin-mobile-card admin-card-green">
                <div className="admin-mobile-icon">💵</div><div className="admin-mobile-card-title">Ingresos totales</div><div className="admin-mobile-card-value">${transparenciaSeleccionadaAdminMovil.ingresos.toFixed(2)}</div><div className="admin-mobile-card-subtitle">Alícuotas más otros ingresos.</div>
              </div>

              <button type="button" className="admin-mobile-card admin-card-red" onClick={() => router.push("/reportes/gastos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="gastos" /></div><div className="admin-mobile-card-title">Gastos del mes</div><div className="admin-mobile-card-value">${transparenciaSeleccionadaAdminMovil.egresos.toFixed(2)}</div><div className="admin-mobile-card-subtitle">Gastos del período seleccionado.</div><div className="admin-mobile-arrow">→</div>
              </button>

              <div className="admin-mobile-card admin-card-blue">
                <div className="admin-mobile-icon">📊</div><div className="admin-mobile-card-title">Resultado del mes</div><div className="admin-mobile-card-value">${transparenciaSeleccionadaAdminMovil.resultado.toFixed(2)}</div><div className="admin-mobile-card-subtitle">Ingresos totales del mes menos gastos del mes.</div>
              </div>

              <div className="admin-mobile-card admin-card-blue">
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="saldo" /></div><div className="admin-mobile-card-title">Saldo acumulado anterior</div><div className="admin-mobile-card-value">${(transparenciaSeleccionadaAdminMovil.saldoAcumulado - transparenciaSeleccionadaAdminMovil.resultado).toFixed(2)}</div><div className="admin-mobile-card-subtitle">Saldo existente antes del período seleccionado.</div>
              </div>

              <div className="admin-mobile-card admin-card-purple">
                <div className="admin-mobile-icon">💼</div><div className="admin-mobile-card-title">Nuevo saldo acumulado</div><div className="admin-mobile-card-value">${transparenciaSeleccionadaAdminMovil.saldoAcumulado.toFixed(2)}</div><div className="admin-mobile-card-subtitle">Saldo acumulado anterior más el resultado del mes.</div>
              </div>
            </div>
          </div>

          <div className="admin-mobile-section">
            <div className="admin-mobile-section-title"><span>🏘️</span> Gestión de la urbanización</div>
            <div className="admin-mobile-grid">
              <button type="button" className="admin-mobile-card admin-card-indigo" onClick={() => router.push("/viviendas")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="viviendas" /></div><div className="admin-mobile-card-title">Gestión de Viviendas</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Ingresar, editar y administrar viviendas.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-blue" onClick={() => router.push("/residentes")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="residentes" /></div><div className="admin-mobile-card-title">Gestión de Residentes</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Ingresar, editar y administrar residentes.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-slate" onClick={() => router.push("/guardias")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="guardias" /></div><div className="admin-mobile-card-title">Gestión de Guardias</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Ingresar, editar y administrar guardias.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-purple" onClick={() => router.push("/avisos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="avisos" /></div>
                <div className="admin-mobile-card-title">Gestión de Avisos</div>
                <div className="admin-mobile-card-value">Gestionar</div>
                <div className="admin-mobile-card-subtitle">Publica avisos y controla sus lecturas.</div>
                <div className="admin-mobile-arrow">→</div>
              </button>
            </div>
          </div>

          <div className="admin-mobile-section">
            <div className="admin-mobile-section-title"><span>⚙️</span> Administración</div>
            <div className="admin-mobile-grid">
              <button type="button" className="admin-mobile-card admin-card-indigo" onClick={() => router.push("/directiva")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="directiva" /></div><div className="admin-mobile-card-title">Directiva</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Miembros y gestión de la directiva.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-green" onClick={() => router.push("/pagos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="finanzas" /></div><div className="admin-mobile-card-title">Gestión Financiera</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Pagos, comprobantes y control financiero.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-purple" onClick={() => router.push("/votaciones")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="votaciones" /></div><div className="admin-mobile-card-title">Votaciones</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Procesos de votación de la urbanización.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-orange" onClick={() => router.push("/solicitudes-gastos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="solicitudes" /></div><div className="admin-mobile-card-title">Solicitudes Gastos</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Revisa solicitudes de gastos pendientes.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-blue" onClick={() => router.push("/solicitudes-aprobadas")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="aprobadas" /></div><div className="admin-mobile-card-title">Solicitudes de Gastos Aprobadas</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Consulta las solicitudes ya aprobadas.</div><div className="admin-mobile-arrow">→</div>
              </button>
            </div>
          </div>

          <div className="admin-mobile-section">
            <div className="admin-mobile-section-title"><span>🏛️</span> Control financiero</div>
            <div className="admin-mobile-grid">
              <button type="button" className="admin-mobile-card admin-card-purple" onClick={() => router.push("/pagos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="validar" /></div>
                <div className="admin-mobile-card-title">Pagos de Alícuotas por Validar</div>
                <div className="admin-mobile-card-value">{pagosValidar}</div>
                <div className="admin-mobile-card-subtitle">Comprobantes pendientes de revisión.</div>
                <div className="admin-mobile-arrow">→</div>
              </button>
            </div>
          </div>

          <div className="admin-mobile-section">
            <div className="admin-mobile-section-title"><span>🛡️</span> Acceso y servicios</div>
            <div className="admin-mobile-grid">
              <button type="button" className="admin-mobile-card admin-card-orange" onClick={() => router.push("/visitas")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="acceso" /></div><div className="admin-mobile-card-title">Control de Acceso</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Visitas PIN y control de ingresos.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-cyan" onClick={() => router.push("/areas-comunes")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="areas" /></div><div className="admin-mobile-card-title">Áreas Comunes</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Espacios y configuración de áreas.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-indigo" onClick={() => router.push("/tecnicos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="servicios" /></div><div className="admin-mobile-card-title">Ecosistema de Servicios</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Profesionales y servicios de la comunidad.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-purple" onClick={() => router.push("/activar-por-pagos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="gestionServicios" /></div><div className="admin-mobile-card-title">Gestión de Servicios</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Ingreso y administración de servicios.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-blue" onClick={() => router.push("/paqueteria")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="paqueteria" /></div><div className="admin-mobile-card-title">Paquetería</div><div className="admin-mobile-card-value">Gestionar</div><div className="admin-mobile-card-subtitle">Recepción y control de paquetes.</div><div className="admin-mobile-arrow">→</div>
              </button>
            </div>
          </div>
          <div className="admin-mobile-section">
            <div className="admin-mobile-section-title"><span>📊</span> Informes</div>
            <div className="admin-mobile-grid">
              <button type="button" className="admin-mobile-card admin-card-indigo" onClick={() => router.push("/reportes/viviendas")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="viviendas" /></div><div className="admin-mobile-card-title">Informe de Viviendas</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Resumen de unidades registradas.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-blue" onClick={() => router.push("/reportes/residentes")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="residentes" /></div><div className="admin-mobile-card-title">Informe de Residentes</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Resumen de residentes registrados.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-slate" onClick={() => router.push("/reportes/guardias")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="guardias" /></div><div className="admin-mobile-card-title">Informe de Guardias</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Resumen del personal registrado.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-rose" onClick={() => router.push("/reportes/novedades")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="novedades" /></div><div className="admin-mobile-card-title">Informe de Novedades</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Situaciones registradas para seguimiento.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-orange" onClick={() => router.push("/reportes/visitas")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="visitas" /></div><div className="admin-mobile-card-title">Informe de Visitas</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Ingresos registrados en la urbanización.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-cyan" onClick={() => router.push("/reportes/reservas")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="reservas" /></div><div className="admin-mobile-card-title">Informe de Reservas</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Reservas de áreas comunes.</div><div className="admin-mobile-arrow">→</div>
              </button>
              <button type="button" className="admin-mobile-card admin-card-green" onClick={() => router.push("/reportes/ingresos")}>
                <div className="admin-mobile-icon"><IconoAdminMovil tipo="recaudado" /></div><div className="admin-mobile-card-title">Informe de ingresos: pagados y pendientes</div><div className="admin-mobile-card-value">Consultar</div><div className="admin-mobile-card-subtitle">Detalle de ingresos pagados y pendientes.</div><div className="admin-mobile-arrow">→</div>
              </button>
            </div>
          </div>

        </div>

        {/* 🔥 DASHBOARD ADMIN - ESCRITORIO */}
        <div className="admin-desktop">
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
                Resumen financiero,
                operativo y administrativo
                de la organización.
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
              <h2
                style={{
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                Resumen Financiero
              </h2>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                Resumen del período seleccionado de la urbanización.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                type="button"
                disabled={
                  !mesTransparencia ||
                  mesesTransparencia.indexOf(mesTransparencia) <= 0
                }
                onClick={() => {
                  const indice = mesesTransparencia.indexOf(
                    mesTransparencia
                  );
                  if (indice > 0) {
                    setMesTransparencia(
                      mesesTransparencia[indice - 1]
                    );
                  }
                }}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "9px 12px",
                  cursor: "pointer",
                  opacity:
                    !mesTransparencia ||
                    mesesTransparencia.indexOf(mesTransparencia) <= 0
                      ? 0.45
                      : 1,
                }}
              >
                ←
              </button>

              <select
                value={mesTransparencia}
                onChange={(e) =>
                  setMesTransparencia(e.target.value)
                }
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
                {mesesTransparencia.length === 0 ? (
                  <option value="">Sin información</option>
                ) : (
                  mesesTransparencia.map((mes) => (
                    <option key={mes} value={mes}>
                      {formatoMesTransparencia(mes)}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                disabled={
                  !mesTransparencia ||
                  mesesTransparencia.indexOf(mesTransparencia) ===
                    mesesTransparencia.length - 1
                }
                onClick={() => {
                  const indice = mesesTransparencia.indexOf(
                    mesTransparencia
                  );
                  if (
                    indice >= 0 &&
                    indice < mesesTransparencia.length - 1
                  ) {
                    setMesTransparencia(
                      mesesTransparencia[indice + 1]
                    );
                  }
                }}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "9px 12px",
                  cursor: "pointer",
                  opacity:
                    !mesTransparencia ||
                    mesesTransparencia.indexOf(mesTransparencia) ===
                      mesesTransparencia.length - 1
                      ? 0.45
                      : 1,
                }}
              >
                →
              </button>
            </div>
          </div>

          <div
            style={{
              marginBottom: 16,
              color: "#475569",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Período: {formatoMesTransparencia(
              transparenciaSeleccionada.mes
            )}
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
              titulo="🏠 Ingresos por alícuotas"
              valor={`$${transparenciaSeleccionada.ingresosAlicuotas.toFixed(2)}`}
              color="#16a34a"
            />

            <CardPremium
              titulo="💰 Otros ingresos"
              valor={`$${transparenciaSeleccionada.otrosIngresos.toFixed(2)}`}
              color="#059669"
            />

            <CardPremium
              titulo="💵 Ingresos totales del mes"
              valor={`$${transparenciaSeleccionada.ingresos.toFixed(2)}`}
              color="#0f766e"
            />

            <CardPremium
              titulo="🧾 Gastos del mes"
              valor={`$${transparenciaSeleccionada.egresos.toFixed(2)}`}
              color="#dc2626"
              onClick={() =>
                router.push(
                  "/reportes/gastos"
                )
              }
              interactivo={true}
            />

            <CardPremium
              titulo="📊 Resultado del mes"
              valor={`$${transparenciaSeleccionada.resultado.toFixed(2)}`}
              color={
                transparenciaSeleccionada.resultado >= 0
                  ? "#16a34a"
                  : "#dc2626"
              }
            />

            <CardPremium
              titulo="📘 Saldo acumulado anterior"
              valor={`$${(
                transparenciaSeleccionada.saldoAcumulado -
                transparenciaSeleccionada.resultado
              ).toFixed(2)}`}
              color="#2563eb"
            />

            <CardPremium
              titulo="💼 Nuevo saldo acumulado"
              valor={`$${transparenciaSeleccionada.saldoAcumulado.toFixed(2)}`}
              color="#7c3aed"
            />
          </div>

        </div>

        {/* 🔥 OPERATIVO */}

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

        {/* 🔥 ADMINISTRATIVO */}

        <div>

          <h2
            style={{
              marginBottom: 20,
            }}
          >
            Resumen Administrativo de la Organización
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
              titulo="📢 Avisos Publicados"
              valor={avisosPublicadosAdmin}
              onClick={() =>
                router.push(
                  "/avisos"
                )
              }
            />

            <Card
              titulo="👁️ Lectura pendiente del último aviso"
              valor={lecturasPendientesAdmin}
              onClick={() =>
                router.push(
                  "/avisos"
                )
              }
            />

          </div>

        </div>

        </div>

      </>

      );
      }


// 📱 ESTILOS DE EXPERIENCIA APP PARA GUARDIA EN MÓVIL
const guardiaMobileStyles = `
  .guardia-mobile { display: none; }
  .guardia-desktop { display: block; }
  @media (max-width: 680px) {
    .guardia-desktop { display: none !important; }
    .guardia-mobile { display: block; padding: 0 0 28px; }
    .guardia-mobile-header { position: relative; overflow: hidden; border-radius: 26px; padding: 24px 20px; margin-bottom: 20px; color:#fff; background:linear-gradient(135deg,#111827 0%,#1f2937 52%,#334155 100%); box-shadow:0 10px 28px rgba(15,23,42,.14); }
    .guardia-mobile-header-glow { position:absolute; width:170px; height:170px; border-radius:50%; right:-55px; top:-75px; background:rgba(59,130,246,.20); filter:blur(4px); }
    .guardia-mobile-saludo { position:relative; display:flex; align-items:center; gap:14px; }
    .guardia-mobile-avatar { width:66px; height:66px; min-width:66px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.14); font-size:32px; }
    .guardia-mobile-header-info { min-width:0; }
    .guardia-mobile-hola { font-size:22px; font-weight:800; margin-bottom:8px; }
    .guardia-mobile-condominio,.guardia-mobile-rol { display:flex; align-items:center; gap:6px; font-size:15px; line-height:1.45; color:#e5e7eb; overflow-wrap:anywhere; }
    .guardia-mobile-rol { margin-top:3px; color:#cbd5e1; }
    .guardia-mobile-section { margin-bottom:20px; }
    .guardia-mobile-section-title { display:flex; align-items:center; gap:8px; margin:4px 2px 12px; font-size:17px; font-weight:800; color:#111827; }
    .guardia-mobile-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .guardia-mobile-card { position:relative; min-width:0; min-height:188px; padding:18px 15px 16px; border:none; border-top:3px solid transparent; border-radius:21px; text-align:left; box-shadow:0 7px 20px rgba(15,23,42,.08); cursor:pointer; font-family:inherit; appearance:none; -webkit-tap-highlight-color:transparent; }
    .guardia-mobile-card:focus-visible,.guardia-mobile-wide-card:focus-visible { outline:3px solid rgba(37,99,235,.35); outline-offset:2px; }
    .guardia-mobile-icon { width:58px; height:58px; min-width:58px; border-radius:17px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.72); box-shadow:0 5px 14px rgba(15,23,42,.08); font-size:27px; margin-bottom:13px; }
    .guardia-mobile-card-title { font-size:16.5px; line-height:1.14; font-weight:800; margin-bottom:5px; }
    .guardia-mobile-card-value { font-size:23px; line-height:1.05; font-weight:900; margin-bottom:6px; }
    .guardia-mobile-card-subtitle { font-size:12.5px; line-height:1.35; opacity:.78; max-width:92%; }
    .guardia-mobile-arrow { position:absolute; right:14px; bottom:12px; font-size:25px; line-height:1; font-weight:800; }
    .guardia-card-blue { background:linear-gradient(145deg,#eff6ff 0%,#dbeafe 100%); border-top-color:#3b82f6; color:#1e3a8a; }
    .guardia-card-red { background:linear-gradient(145deg,#fff1f2 0%,#fecdd3 100%); border-top-color:#f43f5e; color:#881337; }
    .guardia-card-green { background:linear-gradient(145deg,#ecfdf5 0%,#d1fae5 100%); border-top-color:#10b981; color:#065f46; }
    .guardia-card-orange { background:linear-gradient(145deg,#fff7ed 0%,#fed7aa 100%); border-top-color:#f97316; color:#9a3412; }
    .guardia-card-indigo { background:linear-gradient(145deg,#eef2ff 0%,#c7d2fe 100%); border-top-color:#6366f1; color:#3730a3; }
    .guardia-card-slate { background:linear-gradient(145deg,#f1f5f9 0%,#cbd5e1 100%); border-top-color:#64748b; color:#334155; }
    .guardia-card-purple { background:linear-gradient(145deg,#f5f3ff 0%,#e9d5ff 100%); border-top-color:#8b5cf6; color:#5b21b6; }
    .guardia-card-cyan { background:linear-gradient(145deg,#ecfeff 0%,#cffafe 100%); border-top-color:#06b6d4; color:#155e75; }
    .guardia-card-violet { background:linear-gradient(145deg,#faf5ff 0%,#e9d5ff 100%); border-top-color:#a855f7; color:#6b21a8; }
    .guardia-mobile-wide-card { width:100%; min-height:92px; display:flex; align-items:center; gap:13px; position:relative; padding:14px 42px 14px 14px; border:1px solid transparent; border-top:3px solid #a855f7; border-radius:20px; text-align:left; box-shadow:0 7px 20px rgba(15,23,42,.08); cursor:pointer; font-family:inherit; appearance:none; -webkit-tap-highlight-color:transparent; }
    .guardia-mobile-wide-icon { width:52px; height:52px; min-width:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.75); box-shadow:0 5px 14px rgba(15,23,42,.08); font-size:25px; }
    .guardia-mobile-wide-text { min-width:0; }
    .guardia-mobile-wide-card .guardia-mobile-card-subtitle { max-width:100%; }
    .guardia-mobile-resumen { padding:17px; border-radius:21px; background:#f8fafc; border:1px solid #e2e8f0; box-shadow:0 6px 18px rgba(15,23,42,.06); }
    .guardia-mobile-resumen-title { display:flex; align-items:center; gap:8px; font-size:17px; font-weight:800; color:#111827; margin-bottom:13px; }
    .guardia-mobile-resumen-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .guardia-mobile-mini { min-width:0; padding:12px; border-radius:16px; background:#fff; border:1px solid #e5e7eb; text-align:center; }
    .guardia-mobile-mini-icon { width:38px; height:38px; margin:0 auto 7px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#f1f5f9; font-size:20px; }
    .guardia-mobile-mini strong { display:block; font-size:22px; line-height:1.1; color:#111827; }
    .guardia-mobile-mini small { display:block; margin-top:4px; font-size:11.5px; color:#64748b; line-height:1.2; }
    @media (max-width:390px) { .guardia-mobile-grid{gap:9px;} .guardia-mobile-card{min-height:178px;padding:16px 13px 14px;} .guardia-mobile-card-title{font-size:15px;} .guardia-mobile-card-value{font-size:21px;} .guardia-mobile-card-subtitle{font-size:11.5px;} .guardia-mobile-icon{width:50px;height:50px;min-width:50px;font-size:24px;} .guardia-mobile-hola{font-size:20px;} .guardia-mobile-avatar{width:60px;height:60px;min-width:60px;font-size:29px;} }
  }
`;

// 📱 ESTILOS DE EXPERIENCIA APP PARA DIRECTIVA EN MÓVIL
const directivaMobileStyles = `
  .directiva-mobile { display: none; }
  .directiva-desktop { display: block; }
  @media (max-width: 680px) {
    .directiva-desktop { display: none !important; }
    .directiva-mobile { display: block; padding: 0 0 28px; }
    .directiva-mobile-header { position: relative; overflow: hidden; border-radius: 26px; padding: 24px 20px; margin-bottom: 20px; color:#fff; background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#1d4ed8 100%); box-shadow:0 10px 28px rgba(15,23,42,.14); }
    .directiva-mobile-header-glow { position:absolute; width:170px; height:170px; border-radius:50%; right:-55px; top:-75px; background:rgba(255,255,255,.13); filter:blur(4px); }
    .directiva-mobile-saludo { position:relative; display:flex; align-items:center; gap:14px; }
    .directiva-mobile-avatar { width:66px; height:66px; min-width:66px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.16); font-size:32px; }
    .directiva-mobile-header-info { min-width:0; }
    .directiva-mobile-hola { font-size:22px; font-weight:800; margin-bottom:8px; }
    .directiva-mobile-condominio,.directiva-mobile-rol { display:flex; align-items:center; gap:7px; color:#dbeafe; font-size:14px; margin-top:4px; }
    .directiva-mobile-section { margin-bottom:18px; }
    .directiva-mobile-section-title { font-size:16px; font-weight:800; color:#111827; margin:0 0 10px; }
    .directiva-mobile-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .directiva-mobile-card { position:relative; width:100%; min-height:148px; border:1px solid rgba(148,163,184,.20); border-radius:20px; padding:16px; text-align:left; cursor:pointer; box-shadow:0 5px 16px rgba(15,23,42,.07); transition:transform .15s ease; }
    .directiva-mobile-card:active { transform:scale(.98); }
    .directiva-mobile-icon { width:48px; height:48px; border-radius:15px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.78); margin-bottom:12px; }
    .directiva-mobile-card-title { font-size:15px; line-height:1.25; font-weight:800; color:#111827; }
    .directiva-mobile-card-value { margin-top:5px; font-size:22px; font-weight:900; color:#1d4ed8; }
    .directiva-mobile-card-subtitle { margin-top:5px; font-size:12px; line-height:1.35; color:#64748b; }
    .directiva-mobile-arrow { position:absolute; right:14px; bottom:13px; font-size:20px; font-weight:800; color:#2563eb; }
    .directiva-card-green { background:linear-gradient(145deg,#ecfdf5 0%,#d1fae5 100%); border-top:3px solid #10b981; }
    .directiva-card-red { background:linear-gradient(145deg,#fff1f2 0%,#fecdd3 100%); border-top:3px solid #f43f5e; }
    .directiva-card-blue { background:linear-gradient(145deg,#eff6ff 0%,#dbeafe 100%); border-top:3px solid #3b82f6; }
    .directiva-card-orange { background:linear-gradient(145deg,#fff7ed 0%,#fed7aa 100%); border-top:3px solid #f97316; }
    .directiva-card-purple { background:linear-gradient(145deg,#f5f3ff 0%,#e9d5ff 100%); border-top:3px solid #8b5cf6; }
    .directiva-card-indigo { background:linear-gradient(145deg,#eef2ff 0%,#e0e7ff 100%); border-top:3px solid #6366f1; }
    .directiva-mobile-resumen { background:#fff; border-radius:20px; padding:16px; box-shadow:0 5px 16px rgba(15,23,42,.07); margin-top:4px; }
    .directiva-mobile-resumen-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:800; color:#111827; margin-bottom:12px; }
    .directiva-mobile-resumen-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .directiva-mobile-mini { min-height:82px; border-radius:16px; background:#f8fafc; padding:12px; display:flex; flex-direction:column; justify-content:center; }
    .directiva-mobile-mini-icon { font-size:20px; margin-bottom:5px; }
    .directiva-mobile-mini strong { font-size:21px; color:#1d4ed8; }
    .directiva-mobile-mini small { color:#64748b; font-size:11px; margin-top:2px; }
    @media (max-width: 380px) {
      .directiva-mobile-grid { grid-template-columns:1fr; }
      .directiva-mobile-card { min-height:132px; }
    }
  }
`;

// 📱 ESTILOS DE EXPERIENCIA APP PARA ADMIN EN MÓVIL
const adminMobileStyles = `
  .admin-mobile { display: none; }
  .admin-desktop { display: block; }

  /* 📱💻 ADMIN · EXPERIENCIA TABLET
     Entre 681px y 1100px se conserva el dashboard de escritorio,
     pero se ajusta automáticamente para aprovechar el ancho disponible
     sin provocar tarjetas comprimidas ni desbordes. */
  @media (min-width: 681px) and (max-width: 1100px) {
    .admin-desktop {
      width: 100%;
      box-sizing: border-box;
      padding: 0 16px 30px;
      overflow-x: hidden;
    }

    .admin-desktop > div:first-child {
      padding: 28px 24px !important;
      border-radius: 24px !important;
    }

    .admin-desktop > div:first-child h1 {
      font-size: 32px !important;
    }

    .admin-desktop h2 {
      font-size: 28px !important;
    }

    .admin-desktop > div:nth-child(2) > div:first-child {
      align-items: flex-start !important;
    }

    .admin-desktop > div:nth-child(2) select {
      min-width: 0 !important;
      width: min(220px, 38vw);
    }

    .admin-desktop > div:nth-child(2) > div:last-child,
    .admin-desktop > div:nth-child(3) > div:last-child,
    .admin-desktop > div:nth-child(4) > div:last-child {
      gap: 16px !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .admin-desktop > div:nth-child(2) > div:last-child > :last-child:nth-child(odd),
    .admin-desktop > div:nth-child(3) > div:last-child > :last-child:nth-child(odd),
    .admin-desktop > div:nth-child(4) > div:last-child > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 901px) and (max-width: 1100px) {
    .admin-desktop > div:nth-child(2) > div:last-child,
    .admin-desktop > div:nth-child(3) > div:last-child,
    .admin-desktop > div:nth-child(4) > div:last-child {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 680px) {
    .admin-desktop { display: none !important; }
    .admin-mobile { display: block; padding: 0 0 28px; }
    .admin-mobile-header { position: relative; overflow: hidden; border-radius: 26px; padding: 24px 20px; margin-bottom: 18px; color:#fff; background:linear-gradient(135deg,#111827 0%,#1f2937 52%,#334155 100%); box-shadow:0 10px 28px rgba(15,23,42,.14); }
    .admin-mobile-header-glow { position:absolute; width:150px; height:150px; border-radius:50%; right:-45px; top:-70px; background:rgba(59,130,246,.22); filter:blur(4px); }
    .admin-mobile-saludo { position:relative; display:flex; align-items:center; gap:14px; }
    .admin-mobile-avatar { width:66px; height:66px; min-width:66px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.14); font-size:34px; }
    .admin-mobile-header-info { min-width:0; }
    .admin-mobile-hola { font-size:22px; font-weight:800; margin-bottom:8px; }
    .admin-mobile-condominio,.admin-mobile-rol { display:flex; align-items:center; gap:6px; font-size:15px; line-height:1.45; color:#e5e7eb; overflow-wrap:anywhere; }
    .admin-mobile-rol { margin-top:3px; color:#cbd5e1; }
    .admin-mobile-section,.admin-mobile-alertas { margin-bottom:18px; }
    .admin-mobile-section-title { display:flex; align-items:center; gap:8px; margin:4px 2px 14px; padding:0 0 9px; font-size:20px; line-height:1.2; font-weight:900; color:#111827; border-bottom:2px solid #dbe3ee; }
    .admin-mobile-subsection-title { display:flex; align-items:center; gap:8px; margin:16px 2px 10px; padding:9px 0 8px; font-size:16px; line-height:1.2; font-weight:850; color:#334155; border-bottom:1px solid #e2e8f0; }
    .admin-mobile-account-card { width:100%; min-height:96px; display:flex; align-items:center; gap:13px; position:relative; padding:14px 18px 14px 14px; margin:0 0 16px; border:1px solid #bfdbfe; border-top:4px solid #2563eb; border-radius:20px; background:linear-gradient(145deg,#eff6ff 0%,#dbeafe 100%); color:#1e3a8a; text-align:left; box-shadow:0 7px 20px rgba(15,23,42,.08); cursor:pointer; font-family:inherit; appearance:none; -webkit-tap-highlight-color:transparent; }
    .admin-mobile-account-card:focus-visible { outline:3px solid rgba(37,99,235,.35); outline-offset:2px; }
    .admin-mobile-account-icon { width:50px; height:50px; min-width:50px; border-radius:15px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.78); box-shadow:0 5px 14px rgba(15,23,42,.08); font-size:24px; }
    .admin-mobile-account-content { min-width:0; flex:1; padding-right:92px; }
    .admin-mobile-account-title { font-size:17px; line-height:1.2; font-weight:900; color:#1e3a8a; }
    .admin-mobile-account-subtitle { margin-top:4px; font-size:12.5px; line-height:1.35; color:#475569; }
    .admin-mobile-account-action { position:absolute; right:15px; bottom:15px; font-size:14px; font-weight:900; color:#2563eb; white-space:nowrap; }
    .admin-mobile-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .admin-mobile-grid > :last-child:nth-child(odd) { grid-column:1 / -1; }
    .admin-mobile-card { position:relative; min-width:0; min-height:190px; padding:18px 15px 16px; border:none; border-top:3px solid transparent; border-radius:21px; text-align:left; box-shadow:0 7px 20px rgba(15,23,42,.08); cursor:pointer; font-family:inherit; appearance:none; -webkit-tap-highlight-color:transparent; }
    .admin-mobile-card:focus-visible,.admin-mobile-alert:focus-visible { outline:3px solid rgba(37,99,235,.35); outline-offset:2px; }
    .admin-mobile-icon { width:58px; height:58px; min-width:58px; border-radius:17px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.72); box-shadow:0 5px 14px rgba(15,23,42,.08); font-size:27px; margin-bottom:13px; }
    .admin-mobile-card-title { font-size:17px; line-height:1.12; font-weight:800; margin-bottom:5px; }
    .admin-mobile-card-value { font-size:25px; line-height:1.05; font-weight:900; margin-bottom:6px; }
    .admin-mobile-card-subtitle { font-size:12.5px; line-height:1.35; opacity:.78; max-width:92%; }
    .admin-mobile-arrow { position:absolute; right:14px; bottom:12px; font-size:25px; line-height:1; font-weight:800; }
    .admin-card-green { background:linear-gradient(145deg,#ecfdf5 0%,#d1fae5 100%); border-top-color:#10b981; color:#065f46; }
    .admin-card-red { background:linear-gradient(145deg,#fff1f2 0%,#fecdd3 100%); border-top-color:#f43f5e; color:#881337; }
    .admin-card-blue { background:linear-gradient(145deg,#eff6ff 0%,#dbeafe 100%); border-top-color:#3b82f6; color:#1e3a8a; }
    .admin-card-orange { background:linear-gradient(145deg,#fff7ed 0%,#fed7aa 100%); border-top-color:#f97316; color:#9a3412; }
    .admin-card-purple { background:linear-gradient(145deg,#f5f3ff 0%,#e9d5ff 100%); border-top-color:#8b5cf6; color:#5b21b6; }
    .admin-card-indigo { background:linear-gradient(145deg,#eef2ff 0%,#c7d2fe 100%); border-top-color:#6366f1; color:#3730a3; }
    .admin-card-slate { background:linear-gradient(145deg,#f1f5f9 0%,#cbd5e1 100%); border-top-color:#64748b; color:#334155; }
    .admin-card-violet { background:linear-gradient(145deg,#faf5ff 0%,#e9d5ff 100%); border-top-color:#a855f7; color:#6b21a8; }
    .admin-card-rose { background:linear-gradient(145deg,#fff1f2 0%,#fecdd3 100%); border-top-color:#e11d48; color:#9f1239; }
    .admin-card-cyan { background:linear-gradient(145deg,#ecfeff 0%,#cffafe 100%); border-top-color:#06b6d4; color:#155e75; }
    .admin-mobile-alert { width:100%; min-height:70px; display:flex; align-items:center; gap:11px; position:relative; padding:12px 38px 12px 12px; margin-bottom:9px; border-radius:17px; border:1px solid transparent; text-align:left; font-family:inherit; cursor:pointer; }
    .admin-mobile-alert-icon { width:42px; height:42px; min-width:42px; border-radius:13px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.75); font-size:21px; }
    .admin-mobile-alert-text { min-width:0; display:flex; flex-direction:column; gap:3px; }
    .admin-mobile-alert-text strong { font-size:14px; line-height:1.2; }
    .admin-mobile-alert-text span { font-size:12px; opacity:.78; line-height:1.25; }
    .admin-mobile-alert .admin-mobile-arrow { right:10px; bottom:22px; font-size:22px; }
    .admin-mobile-alert-warning { background:#fff7ed; border-color:#f59e0b; color:#92400e; }
    .admin-mobile-alert-info { background:#eff6ff; border-color:#60a5fa; color:#1e40af; }
    @media (max-width:390px) { .admin-mobile-grid{gap:9px;} .admin-mobile-card{min-height:178px;padding:16px 13px 14px;} .admin-mobile-card-title{font-size:15px;} .admin-mobile-card-value{font-size:22px;} .admin-mobile-card-subtitle{font-size:11.5px;} .admin-mobile-icon{width:50px;height:50px;min-width:50px;font-size:24px;} .admin-mobile-hola{font-size:20px;} .admin-mobile-avatar{width:60px;height:60px;min-width:60px;font-size:31px;} .admin-mobile-section-title{font-size:18px;} .admin-mobile-subsection-title{font-size:15px;} .admin-mobile-account-card{padding:13px 14px 13px 12px;} .admin-mobile-account-content{padding-right:78px;} .admin-mobile-account-title{font-size:15px;} .admin-mobile-account-subtitle{font-size:11.5px;} .admin-mobile-account-action{right:12px;bottom:12px;font-size:13px;} }
  }
`;

// 🎨 ICONOS ESTÁNDAR RENALIX · ADMIN MÓVIL
function IconoAdminMovil({
  tipo,
}: {
  tipo:
    | "recaudado"
    | "gastos"
    | "saldo"
    | "pendientes"
    | "vencidos"
    | "validar"
    | "viviendas"
    | "residentes"
    | "guardias"
    | "avisos"
    | "lecturas"
    | "novedades"
    | "visitas"
    | "reservas"
    | "acceso"
    | "areas"
    | "servicios"
    | "gestionServicios"
    | "paqueteria"
    | "directiva"
    | "finanzas"
    | "votaciones"
    | "solicitudes"
    | "aprobadas";
}) {
  const paths: Record<string, React.ReactNode> = {
    recaudado: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
        <path d="M16 14v4" />
      </>
    ),
    gastos: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    saldo: (
      <>
        <path d="M4 7h16v12H4z" />
        <path d="M4 9h16" />
        <path d="M16 14h4" />
        <circle cx="16" cy="14" r="1" />
      </>
    ),
    pendientes: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    vencidos: (
      <>
        <path d="M12 3 21 20H3L12 3Z" />
        <path d="M12 9v5" />
        <circle cx="12" cy="17" r="1" />
      </>
    ),
    validar: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M8 8h8" />
        <path d="M8 12h4" />
        <path d="m8 16 2 2 4-4" />
      </>
    ),
    viviendas: (
      <>
        <path d="m3 11 9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    residentes: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M15 15c2.2.3 3.7 2 4 5" />
      </>
    ),
    guardias: (
      <>
        <path d="M12 3 19 6v5c0 4.2-2.5 7.2-7 10-4.5-2.8-7-5.8-7-10V6l7-3Z" />
        <path d="M9 11h6" />
        <path d="M10 15h4" />
      </>
    ),
    avisos: (
      <>
        <path d="M4 15h3l8 4V5l-8 4H4v6Z" />
        <path d="M15 9c1.5.8 2.5 2.2 2.5 4s-1 3.2-2.5 4" />
        <path d="M19 7c2 1.5 3 3.5 3 6s-1 4.5-3 6" />
      </>
    ),
    novedades: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
        <path d="M16 3v3" />
      </>
    ),
    lecturas: (
      <>
        <path d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5Z" />
        <circle cx="12" cy="12" r="2.5" />
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
    reservas: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8 14h3M13 14h3M8 17h3" />
      </>
    ),
    acceso: (
      <>
        <path d="M5 20V5h10v15" />
        <path d="M15 12h6" />
        <path d="m18 9 3 3-3 3" />
        <circle cx="11" cy="12" r="1" />
      </>
    ),
    areas: (
      <>
        <path d="M4 19h16" />
        <path d="M6 19v-8h12v8" />
        <path d="M8 11V7h8v4" />
        <path d="M10 7V4h4v3" />
      </>
    ),
    servicios: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M7 7.5 10 10M17 7.5 14 10M7 16.5 10 14M17 16.5 14 14" />
      </>
    ),
    gestionServicios: (
      <>
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <circle cx="12" cy="12" r="5" />
        <path d="m9.5 12 1.7 1.7 3.4-3.4" />
      </>
    ),
    paqueteria: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5M12 12v9" />
        <path d="M8 5.2 16 10" />
      </>
    ),
    directiva: (
      <>
        <path d="M4 20h16" />
        <path d="M6 17v-7l6-5 6 5v7" />
        <circle cx="12" cy="10" r="1.8" />
        <path d="M9 17v-3h6v3" />
      </>
    ),
    finanzas: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
        <circle cx="17" cy="15" r="1.5" />
      </>
    ),
    votaciones: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="m8 12 2.5 2.5L16 9" />
        <path d="M8 7h8" />
      </>
    ),
    solicitudes: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
        <path d="M9 3v3h6V3" />
      </>
    ),
    aprobadas: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8 12 2.5 2.5L16 9" />
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
  compact = false,
  interactivo = false,
}: any) {

  const [hovered, setHovered] = useState(false);
  const usaInteraccion = interactivo && !!onClick;

  return (

    <div
      onClick={onClick}
      onMouseEnter={() => usaInteraccion && setHovered(true)}
      onMouseLeave={() => usaInteraccion && setHovered(false)}
      style={{
        background:
          usaInteraccion && hovered ? "#f8fafc" : "#fff",
        borderRadius: compact ? 16 : 24,
        padding: compact ? 18 : 28,
        boxShadow:
          usaInteraccion && hovered
            ? "0 14px 30px rgba(0,0,0,0.14)"
            : "0 6px 20px rgba(0,0,0,0.08)",
        cursor:
          usaInteraccion
            ? "pointer"
            : onClick
              ? "pointer"
              : "default",
        borderTop:
          `${compact ? 4 : 6}px solid ${color}`,
        transform:
          usaInteraccion && hovered
            ? "translateY(-5px) scale(1.015)"
            : "translateY(0) scale(1)",
        transition:
          usaInteraccion
            ? "transform 180ms ease, box-shadow 180ms ease, background 180ms ease"
            : "none",
      }}
    >

      <div
        style={{
          fontSize: compact ? 13 : 15,
          color:
            usaInteraccion && hovered
              ? color
              : "#6b7280",
          marginBottom: compact ? 8 : 14,
          fontWeight:
            "bold",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: compact ? 24 : 38,
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

// 📊 INDICADOR RESUMEN · RESIDENTE PC

function IndicadorResumenResidente({
  titulo,
  valor,
  detalle,
  color,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 16,
        padding: "14px 15px",
        border: `1px solid ${color}22`,
        borderLeft: `4px solid ${color}`,
        minHeight: 106,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#475569",
          marginBottom: 7,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontSize: 23,
          fontWeight: 800,
          color,
          lineHeight: 1.1,
        }}
      >
        {valor}
      </div>
      <div
        style={{
          marginTop: 7,
          fontSize: 11.5,
          lineHeight: 1.35,
          color: "#64748b",
        }}
      >
        {detalle}
      </div>
    </div>
  );
}

// ✨ CARD PREMIUM INTERACTIVA · RESIDENTE PC

function CardPremiumInteractiva({
  titulo,
  color,
  detalle,
  onClick,
}: any) {

  const [hovered, setHovered] = useState(false);

  return (

    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#f8fafc" : "#fff",
        borderRadius: 24,
        padding: 28,
        minHeight: 154,
        boxShadow: hovered
          ? "0 14px 30px rgba(0,0,0,0.14)"
          : "0 6px 20px rgba(0,0,0,0.08)",
        cursor: "pointer",
        borderTop: `6px solid ${color}`,
        transform: hovered
          ? "translateY(-5px) scale(1.015)"
          : "translateY(0) scale(1)",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",
      }}
    >

      <div
        style={{
          fontSize: 15,
          color: hovered ? color : "#6b7280",
          marginBottom: 14,
          fontWeight: "bold",
          transition: "color 180ms ease",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 400,
          color: hovered ? "#374151" : "#6b7280",
          minHeight: 44,
          transition: "color 180ms ease",
        }}
      >
        {detalle}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          color,
          fontSize: 13,
          fontWeight: 800,
          opacity: hovered ? 1 : 0.72,
          transition: "opacity 180ms ease",
        }}
      >
        <span>
          {hovered ? "Abrir" : "Acceso disponible"}
        </span>
        <span
          style={{
            fontSize: 24,
            lineHeight: 1,
            transform: hovered ? "translateX(3px)" : "translateX(0)",
            transition: "transform 180ms ease",
          }}
        >
          →
        </span>
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

  const [hovered, setHovered] = useState(false);
  const interactivo = !!onClick;

  return (

    <div
      onClick={onClick}
      onMouseEnter={() => interactivo && setHovered(true)}
      onMouseLeave={() => interactivo && setHovered(false)}
      style={{
        background: hovered ? "#f8fafc" : "#fff",
        borderRadius: 20,
        padding: 24,
        boxShadow:
          hovered
            ? "0 14px 30px rgba(0,0,0,0.14)"
            : "0 4px 14px rgba(0,0,0,0.08)",
        cursor:
          onClick
            ? "pointer"
            : "default",
        transform:
          hovered
            ? "translateY(-5px) scale(1.015)"
            : "translateY(0) scale(1)",
        transition:
          interactivo
            ? "transform 180ms ease, box-shadow 180ms ease, background 180ms ease"
            : "none",
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
