"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Pagos() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [residentes, setResidentes] =
    useState<any[]>([]);

  const [viviendas, setViviendas] =
    useState<any[]>([]);

  const [pagos, setPagos] =
    useState<any[]>([]);

  const [configuracion,
    setConfiguracion] =
    useState<any>(null);

  const [periodoMasivo,
    setPeriodoMasivo] =
    useState("");

  // 📅 PERÍODO DE CONSULTA FINANCIERA
  const [periodoGestion, setPeriodoGestion] =
    useState("");

  const [referenciaPago,
    setReferenciaPago] =
    useState("");

  const [banco,
    setBanco] =
    useState("");

  const [fechaTransferencia,
    setFechaTransferencia] =
    useState("");

  const [comprobante,
    setComprobante] =
    useState<any>(null);

  const [busqueda,
    setBusqueda] =
    useState("");

  const [mostrarHistorial,
    setMostrarHistorial] =
    useState(false);

  // 💰 OTROS INGRESOS
  const [otrosIngresos, setOtrosIngresos] =
    useState<any[]>([]);

  const [mostrarFormularioOtroIngreso,
    setMostrarFormularioOtroIngreso] =
    useState(false);

  const [otroIngresoCategoria,
    setOtroIngresoCategoria] =
    useState("");

  const [otroIngresoSubcategoria,
    setOtroIngresoSubcategoria] =
    useState("");

  const [otroIngresoConcepto,
    setOtroIngresoConcepto] =
    useState("");

  const [otroIngresoDescripcion,
    setOtroIngresoDescripcion] =
    useState("");

  const [otroIngresoSubtotal,
    setOtroIngresoSubtotal] =
    useState("");

  const [otroIngresoIvaPorcentaje,
    setOtroIngresoIvaPorcentaje] =
    useState("15");

  const [otroIngresoFecha,
    setOtroIngresoFecha] =
    useState(
      new Date().toISOString().split("T")[0]
    );

  const [otroIngresoMetodoPago,
    setOtroIngresoMetodoPago] =
    useState("");

  const [otroIngresoReferencia,
    setOtroIngresoReferencia] =
    useState("");

  const [otroIngresoTipoDocumento,
    setOtroIngresoTipoDocumento] =
    useState("COMPROBANTE_INTERNO");

  const [otroIngresoNumeroDocumento,
    setOtroIngresoNumeroDocumento] =
    useState("");

  const [otroIngresoComprobanteUrl,
    setOtroIngresoComprobanteUrl] =
    useState("");

  const [otroIngresoAutorizacionSri,
    setOtroIngresoAutorizacionSri] =
    useState("");

  const [otroIngresoClaveAccesoSri,
    setOtroIngresoClaveAccesoSri] =
    useState("");

  const [otroIngresoNombreTercero,
    setOtroIngresoNombreTercero] =
    useState("");

  const [otroIngresoTipoIdentificacion,
    setOtroIngresoTipoIdentificacion] =
    useState("RUC");

  const [otroIngresoIdentificacion,
    setOtroIngresoIdentificacion] =
    useState("");

  const [otroIngresoDireccion,
    setOtroIngresoDireccion] =
    useState("");

  const [otroIngresoTelefono,
    setOtroIngresoTelefono] =
    useState("");

  const [otroIngresoEmail,
    setOtroIngresoEmail] =
    useState("");

  const [otroIngresoObservacion,
    setOtroIngresoObservacion] =
    useState("");

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  useEffect(() => {

    if (usuario?.condominio_id) {

      cargarConfiguracion();

      cargarResidentes();

      cargarViviendas();

      cargarPagos();

      cargarOtrosIngresos();

    }

  }, [usuario]);

  // 🔥 CONFIGURACION

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

    if (!error) {

      setConfiguracion(data);

    }

  };

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

    if (!error) {

      setResidentes(data || []);

    }

  };

  // 🔥 VIVIENDAS

  const cargarViviendas =
    async () => {

    const {
      data,
      error,
    } = await supabase
      .from("viviendas")
      .select("*")
      .eq(
        "condominio_id",
        usuario.condominio_id
      );

    if (!error) {

      setViviendas(data || []);

    }

  };

  // 🔥 PAGOS

  const cargarPagos =
    async () => {

    const hoy =
      new Date()
        .toISOString()
        .split("T")[0];

    let query = supabase
      .from("pagos_residentes")
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

    if (rol === "RESIDENTE") {

      const {
        data: residenteDB
      } = await supabase
        .from("usuarios")
        .select("*")
        .eq(
          "email",
          usuario.email
        )
        .single();

      if (residenteDB) {

        query = query.eq(
          "residente_id",
          residenteDB.id
        );

      }

    }

    const {
      data,
      error,
    } = await query;

    if (!error) {

      setPagos(data || []);

    }

  };

  // 💰 OTROS INGRESOS

  const cargarOtrosIngresos =
    async () => {

    if (!usuario?.condominio_id) return;

    let query = supabase
      .from("movimientos_otros_ingresos")
      .select("*")
      .eq(
        "condominio_id",
        usuario.condominio_id
      )
      .order(
        "fecha_movimiento",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    const {
      data,
      error,
    } = await query;

    if (!error) {

      setOtrosIngresos(data || []);

    } else {

      console.error(
        "Error cargando otros ingresos:",
        error
      );

    }

  };

  const limpiarFormularioOtroIngreso =
    () => {

    setOtroIngresoCategoria("");
    setOtroIngresoSubcategoria("");
    setOtroIngresoConcepto("");
    setOtroIngresoDescripcion("");
    setOtroIngresoSubtotal("");
    setOtroIngresoIvaPorcentaje("0");
    setOtroIngresoFecha(
      new Date().toISOString().split("T")[0]
    );
    setOtroIngresoMetodoPago("");
    setOtroIngresoReferencia("");
    setOtroIngresoTipoDocumento(
      "COMPROBANTE_INTERNO"
    );
    setOtroIngresoNumeroDocumento("");
    setOtroIngresoComprobanteUrl("");
    setOtroIngresoAutorizacionSri("");
    setOtroIngresoClaveAccesoSri("");
    setOtroIngresoNombreTercero("");
    setOtroIngresoTipoIdentificacion("RUC");
    setOtroIngresoIdentificacion("");
    setOtroIngresoDireccion("");
    setOtroIngresoTelefono("");
    setOtroIngresoEmail("");
    setOtroIngresoObservacion("");

  };

  const registrarOtroIngreso =
    async () => {

    if (rol !== "ADMIN") return;

    if (
      !otroIngresoCategoria.trim() ||
      !otroIngresoConcepto.trim() ||
      !otroIngresoFecha ||
      !otroIngresoSubtotal
    ) {

      alert(
        "Complete categoría, concepto, fecha y subtotal"
      );

      return;

    }

    const subtotal = Number(
      otroIngresoSubtotal
    );

    const esComprobanteInterno =
      otroIngresoTipoDocumento === "COMPROBANTE_INTERNO";

    // Los comprobantes internos no calculan ni cobran IVA.
    const ivaPorcentaje = esComprobanteInterno
      ? 0
      : Number(otroIngresoIvaPorcentaje || 0);

    if (!Number.isFinite(subtotal) || subtotal < 0) {

      alert("Ingrese un subtotal válido");

      return;

    }

    if (
      !Number.isFinite(ivaPorcentaje) ||
      ivaPorcentaje < 0
    ) {

      alert("Ingrese un IVA válido");

      return;

    }

    const ivaValor =
      Number(
        (
          subtotal *
          ivaPorcentaje /
          100
        ).toFixed(2)
      );

    const total =
      Number(
        (subtotal + ivaValor).toFixed(2)
      );

    const numeroDocumento =
      esComprobanteInterno
        ? (otroIngresoNumeroDocumento.trim() ||
          `CI-${new Date().getFullYear()}-${Date.now()}`)
        : (otroIngresoNumeroDocumento.trim() || null);

    const { error } =
      await supabase
        .from("movimientos_otros_ingresos")
        .insert([{

          condominio_id:
            usuario.condominio_id,

          registrado_por:
            usuario.id,

          categoria:
            otroIngresoCategoria.trim(),

          subcategoria:
            otroIngresoSubcategoria.trim() || null,

          concepto:
            otroIngresoConcepto.trim(),

          descripcion:
            otroIngresoDescripcion.trim() || null,

          subtotal,

          iva_porcentaje:
            ivaPorcentaje,

          iva_valor:
            ivaValor,

          total,

          fecha_movimiento:
            otroIngresoFecha,

          metodo_pago:
            otroIngresoMetodoPago.trim() || null,

          referencia:
            otroIngresoReferencia.trim() || null,

          tipo_documento:
            otroIngresoTipoDocumento || null,

          numero_documento:
            numeroDocumento,

          comprobante_url:
            otroIngresoComprobanteUrl.trim() || null,

          autorizacion_sri:
            otroIngresoAutorizacionSri.trim() || null,

          clave_acceso_sri:
            otroIngresoClaveAccesoSri.trim() || null,

          estado:
            "REGISTRADO",

          modulo_origen:
            "GESTION_FINANCIERA",

          observacion:
            otroIngresoObservacion.trim() || null,

          nombre_tercero:
            otroIngresoNombreTercero.trim() || null,

          tipo_identificacion_tercero:
            otroIngresoTipoIdentificacion || null,

          identificacion_tercero:
            otroIngresoIdentificacion.trim() || null,

          direccion_tercero:
            otroIngresoDireccion.trim() || null,

          telefono_tercero:
            otroIngresoTelefono.trim() || null,

          email_tercero:
            otroIngresoEmail.trim() || null,

        }]);

    if (error) {

      console.error(
        "Error registrando otro ingreso:",
        error
      );

      alert(
        "No se pudo registrar el otro ingreso"
      );

      return;

    }

    alert(
      "Otro ingreso registrado correctamente"
    );

    limpiarFormularioOtroIngreso();
    setMostrarFormularioOtroIngreso(false);
    cargarOtrosIngresos();

  };

  // 📅 PERÍODO DE CONSULTA: MES + AÑO
  // Los años se generan dinámicamente a partir de los datos existentes,
  // el año actual y varios años futuros. No se debe modificar el código
  // cuando llegue un nuevo año.
  const aniosDisponiblesGestion =
    useMemo(() => {
      const aniosConDatos = new Set<number>();

      pagos.forEach((p) => {
        const periodo = String(p.periodo || "");
        const anio = Number(periodo.slice(0, 4));
        if (Number.isFinite(anio) && anio > 0) {
          aniosConDatos.add(anio);
        }

        const fechaVencimiento = String(
          p.fecha_vencimiento || ""
        );
        const anioVencimiento = Number(
          fechaVencimiento.slice(0, 4)
        );
        if (
          Number.isFinite(anioVencimiento) &&
          anioVencimiento > 0
        ) {
          aniosConDatos.add(anioVencimiento);
        }
      });

      otrosIngresos.forEach((ingreso) => {
        const anio = Number(
          String(ingreso.fecha_movimiento || "").slice(0, 4)
        );
        if (Number.isFinite(anio) && anio > 0) {
          aniosConDatos.add(anio);
        }
      });

      const hoy = new Date();
      const anioActual = hoy.getFullYear();

      // Incluye el año actual y 5 años futuros.
      // Así 2027 aparecerá automáticamente al llegar 2027,
      // y también puede seleccionarse desde ahora.
      const anioMinimo = aniosConDatos.size
        ? Math.min(...Array.from(aniosConDatos))
        : anioActual;

      const resultado: number[] = [];

      for (
        let anio = anioMinimo;
        anio <= anioActual + 5;
        anio++
      ) {
        resultado.push(anio);
      }

      return resultado;
    }, [pagos, otrosIngresos]);

  const mesesDelAnioGestion = [
    { valor: "01", nombre: "Enero" },
    { valor: "02", nombre: "Febrero" },
    { valor: "03", nombre: "Marzo" },
    { valor: "04", nombre: "Abril" },
    { valor: "05", nombre: "Mayo" },
    { valor: "06", nombre: "Junio" },
    { valor: "07", nombre: "Julio" },
    { valor: "08", nombre: "Agosto" },
    { valor: "09", nombre: "Septiembre" },
    { valor: "10", nombre: "Octubre" },
    { valor: "11", nombre: "Noviembre" },
    { valor: "12", nombre: "Diciembre" },
  ];

  const obtenerMesActualGestion = () => {
    const hoy = new Date();
    return String(hoy.getMonth() + 1).padStart(2, "0");
  };

  const obtenerAnioActualGestion = () =>
    String(new Date().getFullYear());

  const formatearMesGestion = (periodo: string) => {
    if (!periodo) return "";

    const [anio, mes] = periodo.split("-").map(Number);
    if (!anio || !mes) return periodo;

    const fecha = new Date(anio, mes - 1, 1);

    return fecha.toLocaleDateString("es-EC", {
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (rol !== "ADMIN") return;
    if (!aniosDisponiblesGestion.length) return;

    // Solo establecer el período inicial cuando todavía no existe.
    // Después, el mes y año seleccionados por el administrador
    // permanecen sin ser reemplazados automáticamente.
    if (!periodoGestion) {
      const anioInicial = obtenerAnioActualGestion();
      const mesInicial = obtenerMesActualGestion();

      setPeriodoGestion(
        `${anioInicial}-${mesInicial}`
      );
    }
  }, [
    rol,
    aniosDisponiblesGestion,
    periodoGestion,
  ]);

  const otrosIngresosDelPeriodo =
    useMemo(() => {
      if (rol !== "ADMIN") return otrosIngresos;

      return otrosIngresos.filter((ingreso) =>
        String(ingreso.fecha_movimiento || "").startsWith(periodoGestion)
      );
    }, [otrosIngresos, periodoGestion, rol]);

  const resumenOtrosIngresos =
    useMemo(() => {

      return otrosIngresosDelPeriodo.reduce(
        (acumulado, ingreso) =>
          acumulado +
          (ingreso?.tipo_documento === "COMPROBANTE_INTERNO"
            ? Number(ingreso?.subtotal || 0)
            : Number(ingreso?.total || 0)),
        0
      );

    }, [otrosIngresosDelPeriodo]);

  // 🔥 ALICUOTAS

  const generarAlicuotasMasivas =
    async (periodoSolicitado?: string) => {

    const periodoGeneracion =
      periodoSolicitado || periodoGestion;

    if (!periodoGeneracion) {

      alert(
        "Ingrese el período"
      );

      return;

    }

    if (
      !configuracion?.alicuota_base
    ) {

      alert(
        "Configure la alícuota base"
      );

      return;

    }

    if (
      !configuracion?.vencimiento_defecto
    ) {

      alert(
        "Configure vencimiento"
      );

      return;

    }

    const fechaVencimiento =
      `${periodoGeneracion}-${String(
        configuracion
          .vencimiento_defecto
      ).padStart(2, "0")}`;

    for (
      const vivienda of viviendas
    ) {

      if (
        !vivienda.residente_id
      ) continue;

      const valorAlicuota =
        vivienda
          .alicuota_personalizada ||
        configuracion
          .alicuota_base;

      const {
        data: existente
      } = await supabase
        .from("pagos_residentes")
        .select("*")
        .eq(
          "residente_id",
          vivienda.residente_id
        )
        .eq(
          "periodo",
          periodoGeneracion
        )
        .eq(
          "tipo_pago",
          "ALICUOTA"
        );

      if (
        existente &&
        existente.length > 0
      ) continue;

      await supabase
        .from("pagos_residentes")
        .insert([{

          residente_id:
            vivienda.residente_id,

          vivienda_id:
            vivienda.id,

          condominio_id:
            usuario.condominio_id,

          tipo_pago:
            "ALICUOTA",

          periodo:
            periodoGeneracion,

          valor:
            Number(
              valorAlicuota
            ),

          valor_pagado: 0,

          saldo_pendiente:
            Number(
              valorAlicuota
            ),

          fecha_vencimiento:
            fechaVencimiento,

          estado:
            "PENDIENTE",

        }]);

    }

    alert(
      "Alícuotas generadas"
    );

    cargarPagos();

  };

  // 🔥 APROBAR

  const marcarPagado =
    async (pago: any) => {

    const valorAbono =
      prompt(
        "Valor pagado"
      );

    if (!valorAbono)
      return;

    const metodo =
      prompt(
        "Método de pago"
      );

    if (!metodo)
      return;

    const abono =
      Number(valorAbono);

    const pagadoActual =
      Number(
        pago.valor_pagado || 0
      );

    const nuevoPagado =
      pagadoActual + abono;

    const saldo =
      Number(pago.valor) -
      nuevoPagado;

    let nuevoEstado =
      "PAGADO";

    if (saldo > 0) {

      nuevoEstado =
        "PARCIAL";

    }

    const anio =
      new Date()
        .getFullYear();

    const timestamp =
      Date.now();

    const numeroComprobante =
      `COMP-${anio}-${timestamp}`;

    const { error } =
      await supabase
        .from(
          "pagos_residentes"
        )
        .update({

          numero_comprobante:
            numeroComprobante,

          estado:
            nuevoEstado,

          fecha_pago:
            new Date()
              .toISOString()
              .split("T")[0],

          metodo_pago:
            metodo,

          valor_pagado:
            nuevoPagado,

          saldo_pendiente:
            saldo,

          fecha_validacion:
            new Date()
              .toISOString()
              .split("T")[0],

          validado_por:
            usuario.id,

        })
        .eq("id", pago.id);

    if (error) {

      alert(
        "Error actualizando pago"
      );

      return;

    }

    alert(
      "Pago aprobado"
    );

    cargarPagos();

  };

  // 🔥 REPORTAR

  const reportarPagoResidente =
    async (
      pago: any
    ) => {

    if (
      !referenciaPago ||
      !banco ||
      !fechaTransferencia ||
      !comprobante
    ) {

      alert(
        "Complete todos los campos"
      );

      return;

    }

    const nombreArchivo =
      `${Date.now()}-${comprobante.name}`;

    const {
      error: errorUpload
    } = await supabase
      .storage
      .from("comprobantes")
      .upload(
        nombreArchivo,
        comprobante
      );

    if (errorUpload) {

      alert(
        "Error subiendo comprobante"
      );

      return;

    }

    const {
      data: urlData
    } = supabase
      .storage
      .from("comprobantes")
      .getPublicUrl(
        nombreArchivo
      );

    const comprobanteUrl =
      urlData.publicUrl;

    await supabase
      .from("pagos_residentes")
      .update({

        estado:
          "POR_VALIDAR",

        comprobante_url:
          comprobanteUrl,

        referencia_pago:
          referenciaPago,

        banco,

        fecha_transferencia:
          fechaTransferencia,

      })
      .eq("id", pago.id);

    alert(
      "Pago enviado"
    );

    setReferenciaPago("");

    setBanco("");

    setFechaTransferencia("");

    setComprobante(null);

    cargarPagos();

  };

  // 🔥 HELPERS

  const obtenerResidente =
    (id: string) => {

    return residentes.find(
      (r) => r.id === id
    );

  };

  const obtenerVivienda =
    (id: string) => {

    return viviendas.find(
      (v) => v.id === id
    );

  };

  // 🔎 BÚSQUEDA E HISTORIAL: conserva TODOS los pagos existentes.
  // El período seleccionado se utiliza únicamente para calcular los KPI.
  // Se normaliza el período para que funcione con YYYY-MM, YYYY-MM-DD,
  // YYYY/MM y, como respaldo, con las fechas del pago.
  const obtenerPeriodoFinanciero = (p: any) => {
    const candidatos = [
      p.periodo,
      p.fecha_vencimiento,
      p.fecha_pago,
      p.created_at,
    ];

    for (const candidato of candidatos) {
      const valor = String(candidato || "").trim();

      const formatoAnioMes = valor.match(
        /^(\d{4})[-/](\d{1,2})/
      );

      if (formatoAnioMes) {
        return `${formatoAnioMes[1]}-${String(
          Number(formatoAnioMes[2])
        ).padStart(2, "0")}`;
      }

      const formatoMesAnio = valor.match(
        /^(\d{1,2})[-/](\d{4})/
      );

      if (formatoMesAnio) {
        return `${formatoMesAnio[2]}-${String(
          Number(formatoMesAnio[1])
        ).padStart(2, "0")}`;
      }
    }

    return "";
  };

  const pagosDelPeriodo =
    useMemo(() => {
      if (rol !== "ADMIN" || !periodoGestion) return pagos;

      return pagos.filter(
        (p) =>
          obtenerPeriodoFinanciero(p) ===
          periodoGestion
      );
    }, [pagos, periodoGestion, rol]);

  const terminoBusqueda =
    busqueda.trim().toLowerCase();

  const pagosFiltrados =
    terminoBusqueda
      ? pagos.filter((p) => {

          const residente =
            obtenerResidente(
              p.residente_id
            );

          const textoBusqueda = [
            residente?.nombre,
            residente?.apellido,
            p.estado,
            p.periodo,
            p.tipo_pago,
            p.numero_comprobante,
            p.metodo_pago,
            p.referencia_pago,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return textoBusqueda.includes(
            terminoBusqueda
          );

        })
      : mostrarHistorial
        ? pagos
        : pagos.slice(0, 2);

  // 🔥 RESUMEN DEL PERÍODO SELECCIONADO
  // Los cuatro bloques se calculan automáticamente con los pagos
  // correspondientes al mes y año seleccionados.
  const resumen =
    useMemo(() => {

      let total = 0;
      let pendiente = 0;
      let vencido = 0;
      let recaudado = 0;

      pagosDelPeriodo.forEach((p) => {

        const valor = Number(p.valor || 0);
        const valorPagado = Number(
          p.valor_pagado || 0
        );

        // Total facturado del período.
        total += valor;

        // Total efectivamente recaudado.
        recaudado += valorPagado;

        // Pendiente = facturado - pagado.
        const saldoPendiente = Math.max(
          valor - valorPagado,
          0
        );

        pendiente += saldoPendiente;

        const fechaVencimiento =
          p.fecha_vencimiento
            ? new Date(
                `${String(p.fecha_vencimiento).slice(0, 10)}T23:59:59`
              )
            : null;

        const estaVencidoPorFecha =
          fechaVencimiento &&
          !Number.isNaN(
            fechaVencimiento.getTime()
          ) &&
          fechaVencimiento < new Date() &&
          saldoPendiente > 0;

        // Vencido = saldo pendiente cuyo vencimiento
        // ya pasó, o cuyo estado ya está marcado como VENCIDO.
        if (
          p.estado === "VENCIDO" ||
          estaVencidoPorFecha
        ) {
          vencido += saldoPendiente;
        }

      });

      return {
        total,
        pendiente,
        vencido,
        recaudado,
      };

    }, [pagosDelPeriodo]);

  // 💰 Total recaudado financiero del período: alícuotas + otros ingresos.
  // Los comprobantes internos aportan únicamente su valor real registrado,
  // sin sumar IVA.
  const totalRecaudadoFinanciero =
    resumen.recaudado + resumenOtrosIngresos;

  // 🔒

  if (loading) {

    return (
      <p>
        Cargando...
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
          marginBottom: 25,
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              color:
                "#111827",
            }}
          >
            {rol === "RESIDENTE"
             ? "Pago de Alícuotas"
             : "Gestión Financiera"}
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            {rol === "RESIDENTE"
              ? "Consulte sus obligaciones y registre sus pagos."
              : "Control administrativo y financiero del condominio"}
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
          }}
        >
          Cerrar sesión
        </button>

      </div>

      {/* 📅 PERÍODO DE CONSULTA */}
      {rol === "ADMIN" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 18,
            marginBottom: 22,
            boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong style={{ color: "#111827", fontSize: 16 }}>
              📅 Período de consulta
            </strong>
            <div
              style={{
                marginTop: 5,
                color: "#6b7280",
                fontSize: 13,
              }}
            >
              Seleccione el mes que desea consultar. Los valores financieros mostrados corresponden únicamente a este período.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={periodoGestion.split("-")[0] || ""}
              onChange={(e) => {
                const nuevoAnio = e.target.value;
                const mesActual =
                  periodoGestion.split("-")[1] ||
                  obtenerMesActualGestion();
                const nuevoPeriodo =
                  nuevoAnio
                    ? `${nuevoAnio}-${mesActual}`
                    : "";

                setPeriodoGestion(nuevoPeriodo);
                setPeriodoMasivo(nuevoPeriodo);
                setMostrarHistorial(false);
                setBusqueda("");
              }}
              style={{
                ...inputStyle,
                minWidth: 120,
                cursor: "pointer",
              }}
            >
              <option value="">Año</option>
              {aniosDisponiblesGestion.map((anio) => (
                <option key={anio} value={String(anio)}>
                  {anio}
                </option>
              ))}
            </select>

            <select
              value={periodoGestion.split("-")[1] || ""}
              onChange={(e) => {
                const nuevoMes = e.target.value;
                const anioActual =
                  periodoGestion.split("-")[0] ||
                  obtenerAnioActualGestion();
                const nuevoPeriodo =
                  nuevoMes
                    ? `${anioActual}-${nuevoMes}`
                    : "";

                setPeriodoGestion(nuevoPeriodo);
                setPeriodoMasivo(nuevoPeriodo);
                setMostrarHistorial(false);
                setBusqueda("");
              }}
              style={{
                ...inputStyle,
                minWidth: 145,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              <option value="">Mes</option>
              {mesesDelAnioGestion.map((mes) => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 🔥 DASHBOARD */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(240px,1fr))",
          gap: 18,
          marginBottom: 30,
        }}
      >

        {rol === "ADMIN" ? (
          <>
            <Card
              titulo="🏠 Ingresos por alícuotas"
              valor={`$${resumen.recaudado.toFixed(2)}`}
              nota="Valor efectivamente recaudado por concepto de alícuotas de los residentes durante el período consultado."
            />

            <Card
              titulo="💰 Otros ingresos"
              valor={`$${resumenOtrosIngresos.toFixed(2)}`}
              nota="Ingresos del condominio diferentes de las alícuotas, como alquileres, servicios, reciclaje u otros conceptos."
            />

            <Card
              titulo="⏳ Alícuotas pendientes de pago"
              valor={`$${resumen.pendiente.toFixed(2)}`}
              nota="Valor de las alícuotas generadas que aún tienen saldo pendiente de pago, estén o no vencidas."
            />

            <Card
              titulo="🚨 Alícuotas vencidas"
              valor={`$${resumen.vencido.toFixed(2)}`}
              nota="Parte de las alícuotas pendientes cuyo plazo de pago ya terminó y mantienen un saldo pendiente."
            />
          </>
        ) : (
          <>
            <Card
              titulo="💰 Total Adeudado"
              valor={`$${resumen.total.toFixed(2)}`}
            />

            <Card
              titulo="✅ Total Pagado"
              valor={`$${resumen.recaudado.toFixed(2)}`}
            />

            <Card
              titulo="⏳ Saldo Pendiente"
              valor={`$${resumen.pendiente.toFixed(2)}`}
            />

            <Card
              titulo="🚨 Valores Vencidos"
              valor={`$${resumen.vencido.toFixed(2)}`}
            />
          </>
        )}

      </div>

      {/* 💰 OTROS INGRESOS */}

      {rol === "ADMIN" && (

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow:
              "0 8px 20px rgba(0,0,0,0.06)",
            marginBottom: 30,
            border:
              "1px solid #d1fae5",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
              marginBottom:
                mostrarFormularioOtroIngreso ? 20 : 0,
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                  color: "#065f46",
                }}
              >
                💰 Otros ingresos
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Registre ingresos diferentes a las alícuotas, como alquileres, servicios, reciclaje u otros conceptos.
              </p>

              {mostrarFormularioOtroIngreso && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    color: "#475569",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  <strong>¿Qué significa cada campo?</strong>
                  <div>
                    <b>Categoría:</b> clasifica el tipo general de ingreso. <b>Obligatoria.</b>
                  </div>
                  <div>
                    <b>Subcategoría:</b> permite detallar la categoría. <b>Opcional.</b>
                  </div>
                  <div>
                    <b>Concepto:</b> indica qué se está cobrando. <b>Obligatorio.</b>
                  </div>
                  <div>
                    <b>Descripción:</b> agrega información adicional del ingreso. <b>Opcional.</b>
                  </div>
                </div>
              )}

            </div>

            <button
              type="button"
              onClick={() =>
                setMostrarFormularioOtroIngreso(
                  !mostrarFormularioOtroIngreso
                )
              }
              style={{
                ...primaryButton,
                background:
                  "linear-gradient(135deg,#059669,#047857)",
              }}
            >
              {mostrarFormularioOtroIngreso
                ? "✖️ Cerrar registro"
                : "➕ Registrar otro ingreso"}
            </button>

          </div>

          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 18,
              background: "#ecfdf5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >

            <span
              style={{
                color: "#065f46",
                fontWeight: "bold",
              }}
            >
              Total registrado en otros ingresos
            </span>

            <strong
              style={{
                fontSize: 24,
                color: "#047857",
              }}
            >
              ${resumenOtrosIngresos.toFixed(2)}
            </strong>

          </div>

          {mostrarFormularioOtroIngreso && (

            <div
              style={{
                marginTop: 22,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(240px,1fr))",
                gap: 14,
              }}
            >

              <input
                placeholder="Categoría: tipo general de ingreso *"
                value={otroIngresoCategoria}
                onChange={(e) =>
                  setOtroIngresoCategoria(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Subcategoría: detalle de la categoría (opcional)"
                value={otroIngresoSubcategoria}
                onChange={(e) =>
                  setOtroIngresoSubcategoria(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Concepto: qué se está cobrando *"
                value={otroIngresoConcepto}
                onChange={(e) =>
                  setOtroIngresoConcepto(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Descripción: detalle adicional (opcional)"
                value={otroIngresoDescripcion}
                onChange={(e) =>
                  setOtroIngresoDescripcion(e.target.value)
                }
                style={inputStyle}
              />

              <input
                type="date"
                value={otroIngresoFecha}
                onChange={(e) =>
                  setOtroIngresoFecha(e.target.value)
                }
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Subtotal *"
                value={otroIngresoSubtotal}
                onChange={(e) =>
                  setOtroIngresoSubtotal(e.target.value)
                }
                style={inputStyle}
              />

              <select
                value={otroIngresoIvaPorcentaje}
                disabled={otroIngresoTipoDocumento === "COMPROBANTE_INTERNO"}
                onChange={(e) =>
                  setOtroIngresoIvaPorcentaje(e.target.value)
                }
                style={{
                  ...inputStyle,
                  background:
                    otroIngresoTipoDocumento === "COMPROBANTE_INTERNO"
                      ? "#f3f4f6"
                      : "#fff",
                  color:
                    otroIngresoTipoDocumento === "COMPROBANTE_INTERNO"
                      ? "#6b7280"
                      : "#111827",
                  cursor:
                    otroIngresoTipoDocumento === "COMPROBANTE_INTERNO"
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {otroIngresoTipoDocumento === "COMPROBANTE_INTERNO" ? (
                  <option value="0">IVA no aplicado</option>
                ) : (
                  <>
                    <option value="0">IVA 0%</option>
                    <option value="5">IVA 5%</option>
                    <option value="8">IVA 8%</option>
                    <option value="13">IVA 13%</option>
                    <option value="15">IVA 15%</option>
                    <option value="20">IVA 20%</option>
                  </>
                )}
              </select>

              <select
                value={otroIngresoMetodoPago}
                onChange={(e) =>
                  setOtroIngresoMetodoPago(e.target.value)
                }
                style={inputStyle}
              >
                <option value="">Método de pago</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="DEPOSITO">Depósito</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="OTRO">Otro</option>
              </select>

              <div
                style={{
                  gridColumn: "1 / -1",
                  marginTop: 2,
                  marginBottom: -4,
                  color: "#6b7280",
                  fontSize: 12,
                }}
              >
                Elija el tipo de documento que respalda este ingreso. “Comprobante interno” no es una factura electrónica SRI.
              </div>

              <select
                value={otroIngresoTipoDocumento}
                onChange={(e) => {
                  const tipo = e.target.value;
                  setOtroIngresoTipoDocumento(tipo);
                  if (tipo === "COMPROBANTE_INTERNO") {
                    setOtroIngresoIvaPorcentaje("0");
                  }
                }}
                style={inputStyle}
              >
                <option value="COMPROBANTE_INTERNO">
                  Comprobante interno
                </option>
                <option value="FACTURA" disabled>
                  Factura
                </option>
                <option value="NOTA_CREDITO" disabled>
                  Nota de crédito
                </option>
                <option value="OTRO_DOCUMENTO" disabled>
                  Otro documento
                </option>
              </select>

              <input
                placeholder="Número de documento"
                value={otroIngresoNumeroDocumento}
                onChange={(e) =>
                  setOtroIngresoNumeroDocumento(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Referencia"
                value={otroIngresoReferencia}
                onChange={(e) =>
                  setOtroIngresoReferencia(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="URL del comprobante"
                value={otroIngresoComprobanteUrl}
                onChange={(e) =>
                  setOtroIngresoComprobanteUrl(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Autorización SRI"
                value={otroIngresoAutorizacionSri}
                onChange={(e) =>
                  setOtroIngresoAutorizacionSri(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Clave de acceso SRI"
                value={otroIngresoClaveAccesoSri}
                onChange={(e) =>
                  setOtroIngresoClaveAccesoSri(e.target.value)
                }
                style={inputStyle}
              />

              <div
                style={{
                  gridColumn: "1 / -1",
                  marginTop: 4,
                  marginBottom: -4,
                  color: "#065f46",
                  fontWeight: "bold",
                  fontSize: 15,
                }}
              >
                👤 Datos del cliente
              </div>

              <input
                placeholder="Cliente: nombre / razón social"
                value={otroIngresoNombreTercero}
                onChange={(e) =>
                  setOtroIngresoNombreTercero(e.target.value)
                }
                style={inputStyle}
              />

              <select
                value={otroIngresoTipoIdentificacion}
                onChange={(e) =>
                  setOtroIngresoTipoIdentificacion(e.target.value)
                }
                style={inputStyle}
              >
                <option value="RUC">RUC</option>
                <option value="CEDULA">Cédula</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="OTRO">Otro</option>
              </select>

              <input
                placeholder="Cliente: identificación"
                value={otroIngresoIdentificacion}
                onChange={(e) =>
                  setOtroIngresoIdentificacion(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Cliente: dirección"
                value={otroIngresoDireccion}
                onChange={(e) =>
                  setOtroIngresoDireccion(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Cliente: teléfono"
                value={otroIngresoTelefono}
                onChange={(e) =>
                  setOtroIngresoTelefono(e.target.value)
                }
                style={inputStyle}
              />

              <input
                type="email"
                placeholder="Cliente: correo electrónico"
                value={otroIngresoEmail}
                onChange={(e) =>
                  setOtroIngresoEmail(e.target.value)
                }
                style={inputStyle}
              />

              <input
                placeholder="Observación"
                value={otroIngresoObservacion}
                onChange={(e) =>
                  setOtroIngresoObservacion(e.target.value)
                }
                style={{
                  ...inputStyle,
                  gridColumn: "1 / -1",
                }}
              />

              <div
                style={{
                  gridColumn: "1 / -1",
                  background: "#f9fafb",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  IVA: {otroIngresoTipoDocumento === "COMPROBANTE_INTERNO"
                    ? "No aplicado · $0.00"
                    : `$${(
                        Number(otroIngresoSubtotal || 0) *
                        Number(otroIngresoIvaPorcentaje || 0) /
                        100
                      ).toFixed(2)}`}
                </span>
                <strong>
                  Total: $
                  {(
                    Number(otroIngresoSubtotal || 0) +
                    (otroIngresoTipoDocumento === "COMPROBANTE_INTERNO"
                      ? 0
                      : Number(otroIngresoSubtotal || 0) *
                        Number(otroIngresoIvaPorcentaje || 0) /
                        100)
                  ).toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={registrarOtroIngreso}
                  style={{
                    ...primaryButton,
                    background:
                      "linear-gradient(135deg,#059669,#047857)",
                  }}
                >
                  💾 Registrar ingreso
                </button>

                <button
                  type="button"
                  onClick={() => {
                    limpiarFormularioOtroIngreso();
                    setMostrarFormularioOtroIngreso(false);
                  }}
                  style={secondaryButton}
                >
                  Cancelar
                </button>
              </div>

            </div>

          )}

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(300px,1fr))",
              gap: 16,
            }}
          >

            {otrosIngresos.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 20,
                  borderRadius: 16,
                  background: "#f9fafb",
                  color: "#6b7280",
                  textAlign: "center",
                }}
              >
                No hay otros ingresos registrados todavía.
              </div>
            )}

            {otrosIngresos.map((ingreso) => (

              <div
                key={ingreso.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 18,
                  background: "#f9fafb",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: "#111827",
                      }}
                    >
                      {ingreso.concepto}
                    </strong>
                    <div
                      style={{
                        marginTop: 5,
                        color: "#6b7280",
                        fontSize: 13,
                      }}
                    >
                      {ingreso.categoria}
                      {ingreso.subcategoria
                        ? ` · ${ingreso.subcategoria}`
                        : ""}
                    </div>
                  </div>

                  <strong
                    style={{
                      color: "#047857",
                      fontSize: 20,
                    }}
                  >
                    ${(ingreso.tipo_documento === "COMPROBANTE_INTERNO"
                      ? Number(ingreso.subtotal || 0)
                      : Number(ingreso.total || 0)).toFixed(2)}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 6,
                    fontSize: 13,
                    color: "#4b5563",
                  }}
                >
                  <span>
                    📅 {ingreso.fecha_movimiento || "-"}
                  </span>
                  <span>
                    🧾 {ingreso.tipo_documento || "-"}
                    {ingreso.numero_documento
                      ? ` · ${ingreso.numero_documento}`
                      : ""}
                  </span>
                  <span>
                    💵 Subtotal: $
                    {Number(ingreso.subtotal || 0).toFixed(2)}
                    {" · "}
                    {ingreso.tipo_documento === "COMPROBANTE_INTERNO"
                      ? "IVA no aplicado: $0.00"
                      : `IVA ${Number(ingreso.iva_porcentaje || 0)}%: $${Number(ingreso.iva_valor || 0).toFixed(2)}`}
                  </span>
                  {ingreso.nombre_tercero && (
                    <span>
                      👤 {ingreso.nombre_tercero}
                      {ingreso.identificacion_tercero
                        ? ` · ${ingreso.identificacion_tercero}`
                        : ""}
                    </span>
                  )}
                  {ingreso.metodo_pago && (
                    <span>
                      💳 {ingreso.metodo_pago}
                    </span>
                  )}
                </div>

                {ingreso.tipo_documento ===
                  "COMPROBANTE_INTERNO" && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <a
                      href={`/comprobante-otros-ingresos/${encodeURIComponent(
                        ingreso.id
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...successButton,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        background: "linear-gradient(135deg,#16a34a,#15803d)",
                      }}
                    >
                      Ver comprobante
                    </a>
                  </div>
                )}

              </div>

            ))}

          </div>

        </div>

      )}

      {/* 🏠 INGRESOS POR ALÍCUOTAS */}

      <div
        style={{
          margin: "10px 0 18px",
          padding: "12px 18px",
          borderRadius: 16,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e3a8a",
          fontWeight: "bold",
          fontSize: 18,
        }}
      >
        🏠 Ingresos por alícuotas
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            fontWeight: "normal",
            color: "#475569",
          }}
        >
          Aquí se muestran los pagos de las alícuotas generadas para los residentes.
        </div>
      </div>

      {/* 🔥 GENERAR ALÍCUOTAS */}

      {rol === "ADMIN" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            marginBottom: 30,
            border: "1px solid #bfdbfe",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              color: "#1e3a8a",
            }}
          >
            ⚙️ Generar alícuotas
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "#475569",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Genere automáticamente las alícuotas correspondientes al período seleccionado para todos los residentes que tengan una vivienda registrada en el condominio.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                background: "#eff6ff",
                color: "#1e3a8a",
                fontWeight: "bold",
              }}
            >
              📅 Período: {periodoGestion || "Cargando períodos disponibles..."}
            </div>

            <button
              onClick={() => {
                generarAlicuotasMasivas(periodoGestion);
              }}
              style={primaryButton}
            >
              Generar alícuotas
            </button>
          </div>
        </div>
      )}


      {/* 🔥 BUSCADOR */}

      <div
        style={{
          background:
            "#fff",
          borderRadius: 24,
          padding: 22,
          marginBottom: 25,
          boxShadow:
            "0 8px 20px rgba(0,0,0,0.06)",
        }}
      >

        <h2
          style={{
            marginTop: 0,
          }}
        >
          Buscar Pagos
        </h2>

        <input
          placeholder="Buscar residente, estado, periodo o comprobante"
          value={busqueda}
          onChange={(e) => {
            const valor =
              e.target.value;

            setBusqueda(valor);

            if (valor.trim()) {
              setMostrarHistorial(true);
            }
          }}
          style={{
            ...inputStyle,
            width: "100%",
            maxWidth: 420,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >

          <span
            style={{
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            {terminoBusqueda
              ? `Resultados encontrados: ${pagosFiltrados.length}`
              : mostrarHistorial
                ? `Historial completo: ${pagos.length} pagos`
                : `Últimos pagos: ${Math.min(pagos.length, 2)}`}
          </span>

          {!terminoBusqueda && (
            <button
              type="button"
              onClick={() =>
                setMostrarHistorial(
                  !mostrarHistorial
                )
              }
              style={{
                ...secondaryButton,
                border: "none",
                cursor: "pointer",
              }}
            >
              {mostrarHistorial
                ? "⬆️ Ver solo los 2 últimos"
                : "📂 Ver historial completo"}
            </button>
          )}

        </div>

      </div>


      {/* 🔥 PAGOS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(360px,1fr))",
          gap: 22,
        }}
      >

        {pagosFiltrados.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#fff",
              borderRadius: 24,
              padding: 30,
              textAlign: "center",
              color: "#6b7280",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.06)",
            }}
          >
            🔎 No se encontraron pagos con ese criterio.
          </div>
        )}

        {pagosFiltrados.map(
          (p) => {

          const residente =
            obtenerResidente(
              p.residente_id
            );

          const vivienda =
            obtenerVivienda(
              p.vivienda_id
            );

          return (

            <div
              key={p.id}
              style={{
                background:
                  "#fff",
                borderRadius: 24,
                padding: 22,
                boxShadow:
                  "0 10px 22px rgba(0,0,0,0.06)",
                border:
                  "1px solid #e5e7eb",
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
                  marginBottom: 18,
                }}
              >

                <div>

                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#111827",
                    }}
                  >
                    {p.tipo_pago}
                  </h2>

                  <p
                    style={{
                      marginTop: 6,
                      color:
                        "#6b7280",
                    }}
                  >
                    {p.periodo}
                  </p>

                </div>

                <EstadoBadge
                  estado={p.estado}
                />

              </div>

              {/* 🔥 INFO */}

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 10,
                  fontSize: 14,
                  color:
                    "#4b5563",
                }}
              >

                <span>
                  💰 Valor:
                  {" "}
                  <b>
                    ${p.valor}
                  </b>
                </span>

                <span>
                  ✅ Pagado:
                  {" "}
                  <b>
                    ${p.valor_pagado}
                  </b>
                </span>

                <span>
                  ⏳ Pendiente:
                  {" "}
                  <b>
                    ${p.saldo_pendiente}
                  </b>
                </span>

                {rol === "ADMIN" && (

                  <>
                    <span>
                      👤 Residente:
                      {" "}
                      <b>
                        {residente?.nombre}
                        {" "}
                        {residente?.apellido}
                      </b>
                    </span>

                    <span>
                      🏠 Vivienda:
                      {" "}
                      <b>
                        {
                          vivienda?.codigo_vivienda
                        }
                      </b>
                    </span>
                  </>

                )}

              </div>

              {/* 🔥 RESIDENTE */}

              {rol === "RESIDENTE" && (

                <>
                  {(p.estado ===
                    "PENDIENTE" ||

                    p.estado ===
                    "PARCIAL" ||

                    p.estado ===
                    "VENCIDO") && (

                    <div
                      style={{
                        marginTop: 22,
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: 12,
                      }}
                    >

                      <input
                        placeholder="Número de referencia bancaria de la transacción"
                        value={
                          referenciaPago
                        }
                        onChange={(e) =>
                          setReferenciaPago(
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      />

                      <input
                        placeholder="Nombre del banco donde realizó la transferencia o depósito"
                        value={banco}
                        onChange={(e) =>
                          setBanco(
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      />

                      <input
                        type="date"
                        value={
                          fechaTransferencia
                        }
                        onChange={(e) =>
                          setFechaTransferencia(
                            e.target.value
                          )
                        }
                        style={inputStyle}
                      />

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <input
                          id={`comprobante-pago-${p.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {

                            if (
                              e.target.files &&
                              e.target.files[0]
                            ) {

                              setComprobante(
                                e.target.files[0]
                              );

                            }

                          }}
                          style={{ display: "none" }}
                        />

                        <label
                          htmlFor={`comprobante-pago-${p.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: "11px 16px",
                            borderRadius: 12,
                            border: "1px solid #93c5fd",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: 700,
                            cursor: "pointer",
                            width: "fit-content",
                            maxWidth: "100%",
                          }}
                        >
                          📎 Adjuntar comprobante de pago
                        </label>

                        <div
                          style={{
                            color: "#64748b",
                            fontSize: 13,
                          }}
                        >
                          {comprobante
                            ? `Archivo seleccionado: ${comprobante.name}`
                            : "Seleccione la imagen del comprobante de transferencia o depósito."}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          reportarPagoResidente(
                            p
                          )
                        }
                        style={primaryButton}
                      >
                        Enviar comprobante
                      </button>

                    </div>

                  )}

                  {p.estado ===
                    "POR_VALIDAR" && (

                    <div
                      style={{
                        marginTop: 20,
                        background:
                          "#dbeafe",
                        color:
                          "#1d4ed8",
                        padding: 14,
                        borderRadius: 14,
                        fontWeight:
                          "bold",
                      }}
                    >
                      Pago enviado para validación
                    </div>

                  )}

                </>

              )}

              {/* 🔥 ADMIN */}

              {rol === "ADMIN" && (

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap:
                      "wrap",
                    marginTop: 22,
                  }}
                >
 
                   {(p.estado ===
                    "POR_VALIDAR" ||

                    p.estado ===
                    "PARCIAL") && (

                    <button
                      onClick={() =>
                        marcarPagado(
                          p
                        )
                      }
                      style={primaryButton}
                    >
                      Aprobar Pago
                    </button>

                  )}

                  {p.comprobante_url && (

                    <a
                      href={
                        p.comprobante_url
                      }
                      target="_blank"
                      style={
                        secondaryButton
                      }
                    >
                      Ver transferencia
                    </a>

                  )}

                  {p.numero_comprobante && (

                    <a
                      href={`/comprobante/${encodeURIComponent(
                        p.numero_comprobante
                      )}`}
                      target="_blank"
                      style={
                        successButton
                      }
                    >
                      Ver comprobante
                    </a>

                  )}

                </div>

              )}

              {/* 🔥 RESIDENTE COMPROBANTE */}

              {rol ===
                "RESIDENTE" &&
                p.estado ===
                "PAGADO" &&
                p.numero_comprobante && (

                <div
                  style={{
                    marginTop: 22,
                  }}
                >

                  <a
                    href={`/comprobante/${encodeURIComponent(
                      p.numero_comprobante
                    )}`}
                    target="_blank"
                    style={
                      successButton
                    }
                  >
                    Ver comprobante oficial
                  </a>

                </div>

              )}

            </div>

          );

        })}

      </div>

    </main>

  );

}

// 🔥 CARD KPI

function Card({
  titulo,
  valor,
  nota,
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
      }}
    >

      <div
        style={{
          color:
            "#6b7280",
          marginBottom: 10,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight:
            "bold",
          color:
            "#111827",
        }}
      >
        {valor}
      </div>

      {nota && (
        <div
          style={{
            marginTop: 10,
            color: "#6b7280",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {nota}
        </div>
      )}

    </div>

  );

}

// 🔥 BADGE

function EstadoBadge({
  estado,
}: any) {

  const colores: any = {

    PAGADO: {
      bg: "#dcfce7",
      color: "#166534",
    },

    VENCIDO: {
      bg: "#fee2e2",
      color: "#991b1b",
    },

    PARCIAL: {
      bg: "#fef3c7",
      color: "#92400e",
    },

    POR_VALIDAR: {
      bg: "#dbeafe",
      color: "#1d4ed8",
    },

    PENDIENTE: {
      bg: "#e5e7eb",
      color: "#374151",
    },

  };

  return (

    <div
      style={{
        background:
          colores[estado]?.bg,
        color:
          colores[estado]?.color,
        padding:
          "8px 14px",
        borderRadius:
          999,
        fontSize: 12,
        fontWeight:
          "bold",
      }}
    >
      {estado}
    </div>

  );

}

// 🔥 ESTILOS

const inputStyle = {

  padding:
    "14px 16px",

  borderRadius: 14,

  border:
    "1px solid #d1d5db",

  fontSize: 15,

  background:
    "#fff",

};

const primaryButton = {

  background:
    "linear-gradient(135deg,#2563eb,#1d4ed8)",

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

  textDecoration:
    "none",

};

const secondaryButton = {

  background:
    "#111827",

  color:
    "#fff",

  padding:
    "12px 18px",

  borderRadius: 14,

  textDecoration:
    "none",

  fontWeight:
    "bold",

};

const successButton = {

  background:
    "#16a34a",

  color:
    "#fff",

  padding:
    "12px 18px",

  borderRadius: 14,

  textDecoration:
    "none",

  fontWeight:
    "bold",

};
