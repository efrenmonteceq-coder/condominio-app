"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const MESES = [
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

const obtenerPeriodoRegistro = (registro: any) => {

  const candidatos = [
    registro?.periodo,
    registro?.fecha_vencimiento,
    registro?.fecha_pago,
    registro?.fecha_transferencia,
    registro?.fecha_movimiento,
    registro?.created_at,
  ];

  for (const candidato of candidatos) {

    if (!candidato) continue;

    const texto = String(candidato).trim();

    const iso = texto.match(/(\d{4})[-/](\d{2})/);

    if (iso) {
      return `${iso[1]}-${iso[2]}`;
    }

    const mesAnio = texto.match(/^(\d{2})[\/-](\d{4})$/);

    if (mesAnio) {
      return `${mesAnio[2]}-${mesAnio[1]}`;
    }
  }

  return "";
};


export default function EstadoCuenta() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [movimientos,
    setMovimientos] =
    useState<any[]>([]);

  const [pagosDetalle,
    setPagosDetalle] =
    useState<any[]>([]);

  const [residentes,
    setResidentes] =
    useState<any[]>([]);

  const [residenteSeleccionado,
    setResidenteSeleccionado] =
    useState("");

  // 🔥 FILTROS DE PERÍODO

  // Vacíos por defecto para conservar exactamente la información
  // histórica que ya mostraba el Estado de Cuenta original.
  const [mesDesde,
    setMesDesde] =
    useState("");

  const [mesHasta,
    setMesHasta] =
    useState("");

  const [anioSeleccionado,
    setAnioSeleccionado] =
    useState("");

  const [aniosDisponibles,
    setAniosDisponibles] =
    useState<string[]>([]);

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

  // 🔥 RECARGAR AL CAMBIAR CUALQUIER FILTRO

  useEffect(() => {

    if (
      rol === "ADMIN" ||
      rol === "RESIDENTE"
    ) {

      cargarEstadoCuenta();

    }

  }, [
    residenteSeleccionado,
    mesDesde,
    mesHasta,
    anioSeleccionado,
  ]);

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

      // 🔥 AÑOS DISPONIBLES

      // Siempre incluimos el año actual de la computadora
      // para que aparezca automáticamente aunque todavía
      // no existan registros de ese año.
      const anios =
        new Set<string>([
          String(new Date().getFullYear()),
        ]);

      (pagos || []).forEach(
        (p) => {

          const periodo =
            obtenerPeriodoRegistro(p);

          if (periodo) {
            anios.add(
              periodo.slice(0, 4)
            );
          }

        }
      );

      (movimientosData || []).forEach(
        (m) => {

          const periodo =
            obtenerPeriodoRegistro(m);

          if (periodo) {
            anios.add(
              periodo.slice(0, 4)
            );
          }

        }
      );

      const aniosOrdenados =
        Array.from(anios).sort(
          (a, b) =>
            Number(b) - Number(a)
        );

      setAniosDisponibles(
        aniosOrdenados
      );

      // 🔥 RANGO DE FILTRO

      const filtrarPorPeriodo =
        (
          registro: any
        ) => {

          // Sin ningún filtro de período:
          // mostrar exactamente el histórico original.
          if (
            !anioSeleccionado &&
            !mesDesde &&
            !mesHasta
          ) {
            return true;
          }

          const periodo =
            obtenerPeriodoRegistro(
              registro
            );

          if (!periodo) {
            return false;
          }

          const partes =
            periodo.split("-");

          const anio =
            partes[0];

          const mes =
            partes[1];

          if (
            anioSeleccionado &&
            anio !== anioSeleccionado
          ) {
            return false;
          }

          if (
            mesDesde &&
            Number(mes) <
              Number(mesDesde)
          ) {
            return false;
          }

          if (
            mesHasta &&
            Number(mes) >
              Number(mesHasta)
          ) {
            return false;
          }

          return true;
        };

      // 🔒 RANGO INVÁLIDO

      if (
        mesDesde &&
        mesHasta &&
        Number(mesDesde) >
          Number(mesHasta)
      ) {

        setMovimientos([]);

        setPagosDetalle([]);

        setTotalDeuda(0);

        setTotalPagado(0);

        setSaldoPendiente(0);

        return;

      }

      // 🔥 PAGOS DEL PERÍODO

      const pagosDelPeriodo =
        (pagos || []).filter(
          (p) => {

            if (
              p.estado ===
              "ANULADO"
            ) {
              return false;
            }

            return filtrarPorPeriodo(
              p
            );

          }
        );

      pagosDelPeriodo.sort(
        (a, b) =>
          String(
            obtenerPeriodoRegistro(b)
          ).localeCompare(
            String(
              obtenerPeriodoRegistro(a)
            )
          )
      );

      setPagosDetalle(
        pagosDelPeriodo
      );

      // 🔥 MAPA DE PAGOS

      const mapaPagos =
        new Map(
          (pagos || []).map(
            (p) => [
              p.id,
              p,
            ]
          )
        );

      // 🔥 MOVIMIENTOS DEL PERÍODO

      const movimientosDelPeriodo =
        (movimientosData || [])
          .filter(
            (m) => {

              const pagoRelacionado =
                mapaPagos.get(
                  m.pago_id
                );

              // Si existe pago relacionado,
              // su período contable tiene prioridad.
              const registroPeriodo =
                pagoRelacionado ||
                m;

              if (
                !filtrarPorPeriodo(
                  registroPeriodo
                )
              ) {
                return false;
              }

              return true;

            }
          );

      setMovimientos(
        movimientosDelPeriodo
      );

      // 🔥 CALCULAR TOTALES

      let deuda = 0;

      let pagado = 0;

      let pendiente = 0;

      pagosDelPeriodo.forEach(
        (p) => {

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

        }
      );

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
          Estado de Cuenta del Residente
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

      {/* 🔥 FILTROS DEL ESTADO DE CUENTA */}

      {(rol === "ADMIN" || rol === "RESIDENTE") && (

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

          <h3
            style={{
              marginTop: 0,
            }}
          >
            Consultar estado de cuenta
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >

            <div>

              <label>
                Residente
              </label>

              <select
                value={
                  rol === "RESIDENTE"
                    ? usuario?.id || ""
                    : residenteSeleccionado
                }
                onChange={(e) => {

                  if (rol === "ADMIN") {
                    setResidenteSeleccionado(
                      e.target.value
                    );
                  }

                }}
                style={{
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  borderRadius: 10,
                  border:
                    "1px solid #ccc",
                  background:
                    "#fff",
                }}
              >

                {rol === "RESIDENTE" ? (
                  <option value={usuario?.id || ""}>
                    {usuario?.nombre || "Residente"}
                    {usuario?.apellido ? ` ${usuario.apellido}` : ""}
                  </option>
                ) : (
                  <>
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
                  </>
                )}

              </select>

            </div>

            <div>

              <label>
                Desde mes
              </label>

              <select
                value={
                  mesDesde
                }
                onChange={(e) => {

                  setMesDesde(
                    e.target.value
                  );

                }}
                style={{
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  borderRadius: 10,
                  border:
                    "1px solid #ccc",
                  background:
                    "#fff",
                }}
              >

                <option value="">
                  Todos
                </option>

                {MESES.map((mes) => (

                  <option
                    key={mes.valor}
                    value={mes.valor}
                  >
                    {mes.nombre}
                  </option>

                ))}

              </select>

            </div>

            <div>

              <label>
                Hasta mes
              </label>

              <select
                value={
                  mesHasta
                }
                onChange={(e) => {

                  setMesHasta(
                    e.target.value
                  );

                }}
                style={{
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  borderRadius: 10,
                  border:
                    "1px solid #ccc",
                  background:
                    "#fff",
                }}
              >

                <option value="">
                  Todos
                </option>

                {MESES.map((mes) => (

                  <option
                    key={mes.valor}
                    value={mes.valor}
                  >
                    {mes.nombre}
                  </option>

                ))}

              </select>

            </div>

            <div>

              <label>
                Año
              </label>

              <select
                value={
                  anioSeleccionado
                }
                onChange={(e) => {

                  setAnioSeleccionado(
                    e.target.value
                  );

                }}
                style={{
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  borderRadius: 10,
                  border:
                    "1px solid #ccc",
                  background:
                    "#fff",
                }}
              >

                <option value="">
                  Todos los años
                </option>

                {aniosDisponibles.map(
                  (anio) => (

                    <option
                      key={anio}
                      value={anio}
                    >
                      {anio}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

          {mesDesde &&
            mesHasta &&
            Number(mesDesde) >
              Number(mesHasta) && (

            <p
              style={{
                color: "#b91c1c",
                marginBottom: 0,
                fontWeight: "bold",
              }}
            >
              El mes inicial no puede ser posterior al mes final.
            </p>

          )}

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

      {/* 🔥 DETALLE DEL ESTADO DE CUENTA */}

      <div
        style={{
          background:
            "#fff",
          padding: 25,
          borderRadius: 15,
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: 30,
          overflowX: "auto",
        }}
      >

        <h2>
          Detalle del Estado de Cuenta
        </h2>

        {pagosDetalle.length === 0 ? (

          <p>
            No existen obligaciones para el período seleccionado.
          </p>

        ) : (

          <table
            width="100%"
            cellPadding={10}
            style={{
              borderCollapse:
                "collapse",
              minWidth: 950,
            }}
          >

            <thead>

              <tr
                style={{
                  background:
                    "#f0f2f5",
                }}
              >

                {residenteSeleccionado === "" && (

                  <th align="left">
                    Residente
                  </th>

                )}

                <th align="left">
                  Período
                </th>

                <th align="left">
                  Concepto
                </th>

                <th align="right">
                  Deuda
                </th>

                <th align="right">
                  Pagado
                </th>

                <th align="right">
                  Saldo
                </th>

                <th align="left">
                  Vencimiento
                </th>

                <th align="left">
                  Fecha de pago
                </th>

                <th align="left">
                  Estado
                </th>

              </tr>

            </thead>

            <tbody>

              {pagosDetalle.map(
                (p) => {

                  const residente =
                    residentes.find(
                      (r) =>
                        r.id ===
                        p.residente_id
                    );

                  const periodo =
                    obtenerPeriodoRegistro(
                      p
                    );

                  const concepto =
                    p.tipo_pago ||
                    "Alícuota";

                  return (

                    <tr
                      key={p.id}
                      style={{
                        borderTop:
                          "1px solid #e5e7eb",
                      }}
                    >

                      {residenteSeleccionado === "" && (

                        <td>
                          {residente
                            ? `${residente.nombre} ${residente.apellido}`
                            : p.residente_id}
                        </td>

                      )}

                      <td>
                        {periodo ||
                          "Sin período"}
                      </td>

                      <td>
                        {concepto}
                      </td>

                      <td align="right">
                        ${Number(
                          p.valor || 0
                        ).toFixed(2)}
                      </td>

                      <td align="right">
                        ${Number(
                          p.valor_pagado || 0
                        ).toFixed(2)}
                      </td>

                      <td align="right">
                        ${Number(
                          p.saldo_pendiente || 0
                        ).toFixed(2)}
                      </td>

                      <td>
                        {p.fecha_vencimiento ||
                          "—"}
                      </td>

                      <td>
                        {p.fecha_pago ||
                          "—"}
                      </td>

                      <td>
                        {p.estado ||
                          "—"}
                      </td>

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* 🔥 MOVIMIENTOS FINANCIEROS */}

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

        <p
          style={{
            color: "#666",
            marginTop: 0,
          }}
        >
          Aquí se muestran los movimientos históricos registrados del residente dentro del período seleccionado.
        </p>

        {movimientos.length === 0 ? (

          <p>
            No existen movimientos para el período seleccionado.
          </p>

        ) : (

          movimientos.map((m) => {

            const residente =
              residentes.find(
                (r) =>
                  r.id ===
                  m.residente_id
              );

            return (

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

                {residenteSeleccionado === "" && (

                  <div>
                    <b>
                      Residente:
                    </b>{" "}
                    {residente
                      ? `${residente.nombre} ${residente.apellido}`
                      : m.residente_id}
                  </div>

                )}

                <div>
                  <b>
                    Período:
                  </b>{" "}
                  {obtenerPeriodoRegistro(
                    m
                  ) ||
                    "Histórico"}
                </div>

                <div>
                  <b>
                    Tipo:
                  </b>{" "}
                  {m.tipo_movimiento}
                </div>

                <div>
                  <b>
                    Descripción:
                  </b>{" "}
                  {m.descripcion}
                </div>

                <div>
                  <b>
                    Valor:
                  </b>{" "}
                  $
                  {Number(
                    m.valor || 0
                  ).toFixed(2)}
                </div>

                <div>
                  <b>
                    Fecha:
                  </b>{" "}
                  {m.fecha_movimiento ||
                    m.created_at ||
                    "—"}
                </div>

              </div>

            );

          })

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