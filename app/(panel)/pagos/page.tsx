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

  // 🔥 ALICUOTAS

  const generarAlicuotasMasivas =
    async () => {

    if (!periodoMasivo) {

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
      `${periodoMasivo}-${String(
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
          periodoMasivo
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
            periodoMasivo,

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

  // 🔥 FILTRO: ÚLTIMOS 2 + BÚSQUEDA + HISTORIAL

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

  // 🔥 RESUMEN

  const resumen =
    useMemo(() => {

      let total =
        0;

      let pendiente =
        0;

      let vencido =
        0;

      let recaudado =
        0;

      pagos.forEach((p) => {

        total +=
          Number(
            p.valor || 0
          );

        recaudado +=
          Number(
            p.valor_pagado || 0
          );

        pendiente +=
          Number(
            p.saldo_pendiente || 0
          );

        if (
          p.estado ===
          "VENCIDO"
        ) {

          vencido +=
            Number(
              p.saldo_pendiente || 0
            );

        }

      });

      return {

        total,

        pendiente,

        vencido,

        recaudado,

      };

    }, [pagos]);

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

        <Card
  titulo={
    rol === "RESIDENTE"
      ? "💰 Total Adeudado"
      : "Total Facturado"
  }
  valor={`$${resumen.total.toFixed(2)}`}
/>

<Card
  titulo={
    rol === "RESIDENTE"
      ? "✅ Total Pagado"
      : "Total Recaudado"
  }
  valor={`$${resumen.recaudado.toFixed(2)}`}
/>

<Card
  titulo={
    rol === "RESIDENTE"
      ? "⏳ Saldo Pendiente"
      : "Pendiente"
  }
  valor={`$${resumen.pendiente.toFixed(2)}`}
/>

<Card
  titulo={
    rol === "RESIDENTE"
      ? "🚨 Valores Vencidos"
      : "Vencido"
  }
  valor={`$${resumen.vencido.toFixed(2)}`}
/>

      </div>

      {/* 🔥 GENERAR */}

      {rol === "ADMIN" && (

        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow:
              "0 8px 20px rgba(0,0,0,0.06)",
            marginBottom: 30,
          }}
        >

          <h2
            style={{
              marginTop: 0,
            }}
          >
            Generar Alícuotas
          </h2>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap:
                "wrap",
            }}
          >

            <input
              placeholder="2026-05"
              value={periodoMasivo}
              onChange={(e) =>
                setPeriodoMasivo(
                  e.target.value
                )
              }
              style={inputStyle}
            />

            <button
              onClick={
                generarAlicuotasMasivas
              }
              style={primaryButton}
            >
              Generar
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
                        placeholder="Referencia"
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
                        placeholder="Banco"
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

                      <input
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
                      />

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