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