"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

function VisitasContenido() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const searchParams =
    useSearchParams();

  const fechaQuery =
    searchParams.get("fecha");
   
  const soloHistorial =
  searchParams.get(
    "solo"
  ) === "historial";  

  const hoy =
    new Date()
      .toISOString()
      .split("T")[0];

  
  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 STATES

  const [visitas,
    setVisitas] =
    useState<any[]>([]);

  const [residentes,
    setResidentes] =
    useState<any[]>([]);

  const [viviendas,
    setViviendas] =
    useState<any[]>([]);

  const [visitanteNombre,
    setVisitanteNombre] =
    useState("");

  const [
    visitanteIdentificacion,
    setVisitanteIdentificacion
  ] = useState("");

  const [
  placaVehiculo,
  setPlacaVehiculo
] = useState("");

  const [fechaVisita,
    setFechaVisita] =
    useState(hoy);

  const [horaIngreso,
    setHoraIngreso] =
    useState("");

  const [horasVigencia,
   setHorasVigencia] =
   useState(3);

  const [residenteId,
    setResidenteId] =
    useState("");

  const [observacion,
    setObservacion] =
    useState("");

  const [busqueda,
    setBusqueda] =
    useState("");

  const [filtroEstado,
    setFiltroEstado] =
    useState("");

 const [filtroFecha,
  setFiltroFecha] =
  useState(
    fechaQuery === "hoy"
      ? hoy
      : ""
  );

 const [
  pinIngresado,
  setPinIngresado
] = useState<
  Record<string, string>
>({});

const [
  intentosPin,
  setIntentosPin
] = useState<
  Record<string, number>
>({});

    
  // 🔥 LOAD

  useEffect(() => {

    if (usuario) {

      cargarTodo();

    }

  }, [usuario]);

  // 🔥 CARGAR TODO

  const cargarTodo =
    async () => {

    await Promise.all([

      cargarVisitas(),

      cargarResidentes(),

      cargarViviendas(),

    ]);

  };

  // 🔥 VISITAS

  const cargarVisitas =
    async () => {

      let residenteActualId = null;

if (
  rol === "RESIDENTE"
) {

  residenteActualId = usuario.id;

}

    let query =
  supabase
    .from("visitas")
.select(`
  *,
  residentes:residente_id (
    id,
    nombre,
    apellido
  ),
  viviendas:vivienda_id (
    id,
    codigo_vivienda
  )
`)
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

    if (
  rol === "RESIDENTE" &&
  residenteActualId
) {

  query = query.eq(
    "residente_id",
    residenteActualId
  );

} else {

  query = query.eq(
    "condominio_id",
    usuario.condominio_id
  );

}

const {
  data,
  error,
} = await query;

if (error) {

  console.error(
    "ERROR VISITAS:",
    error
  );

  return;

}

setVisitas(data || []);
  };

  // 🔥 RESIDENTES

  const cargarResidentes =
  async () => {

    const {
      data,
      error,
    } = await supabase
      .from("usuarios")
      .select(`
  id,
  nombre,
  apellido,
  auth_user_id
`)
      .eq(
        "condominio_id",
        usuario.condominio_id
      );

    if (error) {

      console.error(
        "ERROR RESIDENTES:",
        error
      );

      return;

    }

    setResidentes(
      data || []
    );

  };

  // 🔥 VIVIENDAS

  const cargarViviendas =
    async () => {

    const {
      data,
    } = await supabase
      .from("viviendas")
      .select("*");

    setViviendas(
      data || []
    );

  };

  // 🔥 GENERAR PIN

  const generarPin =
    () => {

    return Math.floor(
      100000 +
      Math.random() *
      900000
    ).toString();

  };

  // 🔥 CREAR VISITA

  const crearVisita =
    async () => {

    if (
  !visitanteNombre ||
  !visitanteIdentificacion ||
  !fechaVisita ||
  !horaIngreso ||
  (
    rol === "ADMIN" &&
    !residenteId
  )
) {

  alert(
    "Complete todos los campos"
  );

  return;

}

    const pin =
      generarPin();

      const fechaInicio =
  new Date(
    `${fechaVisita}T${horaIngreso}`
  );

const fechaExpiracion =

  new Date(
    fechaInicio.getTime() +
    horasVigencia *
      60 *
      60 *
      1000
  );

const residenteActual =
  residentes.find(
    (r) =>
      r.id ===
      usuario.id
  );

    const vivienda =
  viviendas.find(
    (v) =>
      String(
        v.residente_id
      ) ===
      String(
        rol === "RESIDENTE"
          ? residenteActual?.id
          : residenteId
      )
  );

console.log(
  "VIVIENDA ENCONTRADA:",
  vivienda
);

console.log(
  "VIVIENDAS:",
  viviendas
);

console.log(
  "VIVIENDA ENCONTRADA:",
  vivienda
);
  viviendas.find(
    (v) =>
      String(
        v.residente_id
      ) ===
      String(
        rol ===
        "RESIDENTE"
          ? usuario.id
          : residenteId
      )
  );

const payload = {

  visitante_nombre:
    visitanteNombre,

  visitante_identificacion:
    visitanteIdentificacion,

  placa_vehiculo:
    placaVehiculo,

  fecha_visita:
    fechaVisita,

  hora_ingreso:
    horaIngreso,
    horas_vigencia:
  horasVigencia,

fecha_expiracion:
  fechaExpiracion,

  residente_id:
  rol === "RESIDENTE"
    ? residenteActual?.id
    : residenteId,

  vivienda_id:
    vivienda?.id,

  observacion,

  estado:
  "PENDIENTE",

condominio_id:
  usuario.condominio_id,

pin,

};

console.log(payload);
const { error } =
      await supabase
        .from("visitas")
        .insert([payload]);

    if (error) {

  console.error(
    "ERROR CREANDO VISITA:",
    error
  );

  alert(
    JSON.stringify(error)
  );

  return;

}

    alert(
      `Visita creada. PIN: ${pin}`
    );

    limpiarFormulario();

    cargarVisitas();

  };

// 🔥 VALIDAR PIN

const validarPin =
  (visita: any) => {

  return (
    pinIngresado[
      visita.id
    ]?.trim() ===
    visita.pin?.trim()
  );

};

// 🔥 AUDITORÍA PIN INCORRECTO

const registrarPinIncorrecto =
  async (
    visita: any
  ) => {

  const nuevosIntentos: Record<string, number> = {

  ...intentosPin,

  [String(visita.id)]:
    (
      intentosPin[
        String(visita.id)
      ] || 0
    ) + 1,

};

setIntentosPin(
  nuevosIntentos
);

const totalIntentos =
  nuevosIntentos[
    String(visita.id)
  ];

  // 🔥 AUDITORÍA

  const {
    error
  } = await supabase
    .from(
      "auditoria_visitas"
    )
    .insert({

      visita_id:
        visita?.id,

      visitante_nombre:
        visita?.visitante_nombre,

      vivienda_codigo:
        visita?.viviendas
          ?.codigo_vivienda || "",

      pin_ingresado:
        pinIngresado[
          visita?.id
        ] || "",

      pin_correcto:
        false,

      validado_por:
        usuario.id,

      validado_por_nombre:
        usuario.nombre || "",

      accion:
        totalIntentos >= 3
          ? "PIN BLOQUEADO"
          : "PIN INCORRECTO",

      observacion:
        `Intento fallido #${totalIntentos}`

    });

  console.log(
    "ERROR PIN:",
    error
  );

  // 🔥 BLOQUEAR

  if (
    totalIntentos >= 3
  ) {

    alert(
      "⛔ PIN bloqueado por múltiples intentos fallidos"
    );

  } else {

    alert(
      `❌ PIN incorrecto. Intento ${totalIntentos} de 3`
    );

  }

};

// 🔥 APROBAR

const aprobarIngreso =
  async (
    id: string
  ) => {

  const visita =
    visitas.find(
      (v) => v.id === id
    );

  if (!visita)
    return;

  // 🔥 VALIDAR PIN

  const correcto =
    validarPin(
      visita
    );

  if (!correcto) {

    await registrarPinIncorrecto(
      visita
    );
    return;
    
  }

  // 🔥 ACTUALIZAR VISITA

  await supabase
    .from("visitas")
    .update({

      estado:
        "INGRESÓ",

    })
    .eq("id", id);

  // 🔥 AUDITORÍA APROBADO

  const {
    error
  } = await supabase
    .from(
      "auditoria_visitas"
    )
    .insert({

      visita_id:
        visita?.id,

      visitante_nombre:
        visita?.visitante_nombre,

      vivienda_codigo:
        visita?.viviendas
          ?.codigo_vivienda || "",

      pin_ingresado:
        pinIngresado[
          visita?.id
        ] || "",

      pin_correcto:
        true,

      validado_por:
        usuario.id,

      validado_por_nombre:
        usuario.nombre || "",

      accion:
        "ACCESO APROBADO",

      observacion:
        "PIN válido"

    });

  console.log(
    "ERROR APROBAR:",
    error
  );

  cargarVisitas();

};


  // 🔥 FINALIZAR

  const finalizarVisita =
    async (id: string) => {

    await supabase
      .from("visitas")
     .update({

  estado:
    "FINALIZADA",

  fecha_salida:
    new Date()
      .toISOString(),

})
      .eq("id", id);

      const visita =
  visitas.find(
    (v) => v.id === id
  );

await supabase
  .from(
    "auditoria_visitas"
  )
  .insert({

    visita_id:
      visita?.id,

    visitante_nombre:
      visita?.visitante_nombre,

    vivienda_codigo:
      visita?.viviendas
        ?.codigo_vivienda || "",

    pin_correcto:
      true,

    validado_por:
      usuario.id,

    validado_por_nombre:
      usuario.nombre,

    accion:
      "SALIDA FINALIZADA",

    observacion:
      "Visita cerrada"

  });

    cargarVisitas();

  };

  // 🔥 ELIMINAR

  const eliminarVisita =
    async (id: string) => {

    const confirmar =
      confirm(
        "¿Eliminar visita?"
      );

    if (!confirmar)
      return;

    await supabase
      .from("visitas")
      .delete()
      .eq("id", id);

    cargarVisitas();

  };

  // 🔥 LIMPIAR

  const limpiarFormulario =
    () => {

    setVisitanteNombre("");

    setVisitanteIdentificacion("");

    setPlacaVehiculo("");

    setHoraIngreso("");

    setObservacion("");

    setResidenteId("");

  };

  // 🔥 OBTENER NOMBRE

  const obtenerResidente =
  (visita: any) => {

    if (
      visita.residentes
    ) {

      return visita.residentes;

    }

    return residentes.find(
      (r) =>
        r.id ===
        visita.residente_id
    );

  };

// 🔥 VALIDAR EXPIRACIÓN

const visitaExpirada =
  (visita: any) => {

  if (
    !visita.fecha_expiracion
  ) {
    return false;
  }

  return (
    new Date() >
    new Date(
      visita.fecha_expiracion
    )
  );

};

  // 🔥 FILTRO

  const visitasFiltradas =
  useMemo(() => {

    const resultado =
      visitas.filter(
        (v) => {

          const texto =
            `${v.visitante_nombre || ""} ${v.visitante_identificacion || ""} ${v.pin || ""}`
              .toLowerCase();

          const coincideBusqueda =
            texto.includes(
              busqueda.toLowerCase()
            );

          const coincideEstado =
            filtroEstado
              ? v.estado ===
                filtroEstado
              : true;

          const coincideFecha =
            filtroFecha
              ? v.fecha_visita ===
                filtroFecha
              : true;

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideFecha
          );

        }
      );

    // 🔥 SI NO HAY VISITAS HOY
    // MOSTRAR TODO EL HISTORIAL

    if (
      resultado.length === 0 &&
      fechaQuery === "hoy"
    ) {

      return visitas;

    }

    return resultado;

  }, [
    visitas,
    busqueda,
    filtroEstado,
    filtroFecha,
    fechaQuery,
  ]);
  
  // 🔒 VALIDACIONES

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
            Gestión de Visitas
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Control inteligente de accesos y visitantes
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

      {/* 🔥 FORM */}

      {!soloHistorial &&
 (rol === "ADMIN" ||
  rol === "RESIDENTE") && (

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
              marginBottom: 20,
              color:
                "#111827",
            }}
          >
            Registrar Visita
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(240px,1fr))",
              gap: 16,
            }}
          >

            <Input
              placeholder="Nombre visitante"
              value={
                visitanteNombre
              }
              onChange={(e: any) =>
                setVisitanteNombre(
                  e.target.value
                )
              }
            />
            
            <Input
  placeholder="Identificación"
  value={
    visitanteIdentificacion
  }
  onChange={(e: any) =>
    setVisitanteIdentificacion(
      e.target.value
    )
  }
/>

<Input
  placeholder="Placa vehículo"
  value={placaVehiculo}
  onChange={(e: any) =>
    setPlacaVehiculo(
      e.target.value
    )
  }
/>
            <Input
              type="date"

              value={fechaVisita}
              onChange={(e: any) =>
                setFechaVisita(
                  e.target.value
                )
              }
            />
              <Input
              type="time"
              value={horaIngreso}
              onChange={(e: any) =>
                setHoraIngreso(
                  e.target.value
                )
              }
            
/>
            <select
  value={horasVigencia}
  onChange={(e) =>
    setHorasVigencia(
      Number(
        e.target.value
      )
    )
  }
  style={inputStyle}
>

  <option value={1}>
    1 hora
  </option>

  <option value={2}>
    2 horas
  </option>

  <option value={3}>
    3 horas
  </option>

  <option value={4}>
    4 horas
  </option>

  <option value={5}>
    5 horas
  </option>

  <option value={8}>
    8 horas
  </option>

</select>

            {rol === "ADMIN" && (

              <select
                value={residenteId}
                onChange={(e) =>
                  setResidenteId(
                    e.target.value
                  )
                }
                style={inputStyle}
              >

                <option value="">
                  Seleccione residente
                </option>

                {residentes.map(
                  (r) => (

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

            )}

          </div>

          <textarea
            placeholder="Observaciones"
            value={observacion}
            onChange={(e) =>
              setObservacion(
                e.target.value
              )
            }
            style={{
              width: "100%",
              marginTop: 16,
              minHeight: 120,
              borderRadius: 14,
              padding: 16,
              border:
                "1px solid #d1d5db",
              fontSize: 15,
            }}
          />

          <div
            style={{
              marginTop: 20,
            }}
          >

            <button
              onClick={
                crearVisita
              }
              style={{
                background:
                  "linear-gradient(135deg,#2563eb,#1d4ed8)",
                color:
                  "#fff",
                border:
                  "none",
                padding:
                  "14px 22px",
                borderRadius: 14,
                cursor:
                  "pointer",
                fontWeight:
                  "bold",
                fontSize: 15,
              }}
            >
              + Registrar Visita
            </button>

          </div>

        </div>

      )}

      {/* 🔥 FILTROS */}

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
            marginBottom: 18,
          }}
        >
          Historial de Visitas
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
            placeholder="Buscar visita"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            style={{
              ...inputStyle,
              minWidth: 260,
            }}
          />

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(
                e.target.value
              )
            }
            style={inputStyle}
          >

            <option value="">
              Todos estados
            </option>

            <option value="PENDIENTE">
              Pendiente
            </option>

            <option value="INGRESÓ">
              Ingresó
            </option>

            <option value="FINALIZADA">
              Finalizada
            </option>

          </select>

          <input
            type="date"
            value={filtroFecha}
            onChange={(e) =>
              setFiltroFecha(
                e.target.value
              )
            }
            style={inputStyle}
          />

        </div>

      </div>

      {/* 🔥 LISTADO */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(340px,1fr))",
          gap: 22,
        }}
      >

        {visitasFiltradas.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 24,
              borderRadius: 20,
            }}
          >
            No existen visitas registradas
          </div>

        ) : (

          visitasFiltradas.map(
            (v) => {

            const residente =
              obtenerResidente(v);

            return (

              <div
                key={v.id}
                style={{
                  background:
                    "#fff",
                  borderRadius: 26,
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
                      {v.visitante_nombre}
                    </h2>

                    <p
  style={{
    marginTop: 6,
    color:
      "#6b7280",
  }}
>
  PIN:
  {" "}
  <b>
    {rol === "RESIDENTE"
      ? v.pin
      : "••••••"}
  </b>
</p>

                  </div>

                  <EstadoBadge
                    estado={v.estado}
                  />

                </div>

                {/* 🔥 INFO */}

<div
  style={{
    display: "flex",
    flexDirection:
      "column",
    gap: 10,
    color:
      "#4b5563",
    fontSize: 14,
  }}
>

  <span>
    🪪
    {" "}
    {
      v.visitante_identificacion
    }
  </span>

  <span>
    🚗
    {" "}
    {
      v.placa_vehiculo ||
      "SIN PLACA"
    }
  </span>

  <span>
    📅
    {" "}
    {v.fecha_visita}
  </span>

  <span>
    ⏰ Inicio:
    {" "}
    {v.hora_ingreso}
  </span>

  <span>
    🕒 Vigencia:
    {" "}
    {v.horas_vigencia || 3}
    {" "}horas
  </span>

 {v.fecha_salida && (

  <span>
    🚪 Salida:
    {" "}
    {
      (() => {

        const fecha =
          new Date(
            v.fecha_salida
          );

        fecha.setHours(
          fecha.getHours() - 5
        );

        return fecha.toLocaleString(
          "es-EC"
        );

      })()
    }
  </span>

)}

  <span>
    👤
    {" "}
    {
      v.residentes?.nombre
    }
    {" "}
    {
      v.residentes?.apellido
    }
  </span>

  <span>
    🏠 Vivienda:
    {" "}
    {
      v.viviendas?.codigo_vivienda ||
      "N/D"
    }
  </span>

  {v.observacion && (

    <span>
      📝
      {" "}
      {
        v.observacion
      }
    </span>

  )}

</div>

{/* 🔥 VALIDACIÓN PIN */}

{(rol === "GUARDIA" ||
  rol === "ADMIN") &&
  v.estado === "PENDIENTE" && (

  <div
    style={{
      marginTop: 18,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}
  >

    <input
      type="text"
      placeholder="Ingrese PIN visitante"
      value={
        pinIngresado[v.id] || ""
      }
      onChange={(e) =>
        setPinIngresado({
          ...pinIngresado,
          [v.id]:
            e.target.value,
        })
      }
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border:
          "1px solid #d1d5db",
        fontSize: 14,
      }}
    />

    {pinIngresado[v.id] && (

      <span
        style={{
          fontSize: 13,
          fontWeight: "bold",
          color:
            (
  visitaExpirada(v)

  ||

  (
    intentosPin[
      v.id
    ] || 0
  ) >= 3
)

  ? "#9ca3af"

  : "#2563eb",
        }}
      >
        {
          validarPin(v)
            ? "✅ PIN correcto"
            : "❌ PIN incorrecto"
        }
      </span>
      )}

      {visitaExpirada(v) && (

  <span
    style={{
      color: "#dc2626",
      fontWeight: "bold",
      fontSize: 13,
    }}
  >
    ⛔ Visita expirada
  </span>

)}


  </div>

)}

                 {/* 🔥 BOTONES */}

{(rol === "ADMIN" ||
  rol === "GUARDIA") && (

  <div
    style={{
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 22,
    }}
  >

    {v.estado ===
      "PENDIENTE" && (

      <button

        disabled={

          visitaExpirada(v)

          ||

          (
            intentosPin[
              v.id
            ] || 0
          ) >= 3

        }

        onClick={() =>
          aprobarIngreso(
            v.id
          )
        }

        style={{

          background:

            (
              visitaExpirada(v)

              ||

              (
                intentosPin[
                  v.id
                ] || 0
              ) >= 3
            )

              ? "#9ca3af"

              : "#2563eb",

          color:
            "#fff",

          border:
            "none",

          padding:
            "10px 16px",

          borderRadius: 12,

          cursor:

            (
              visitaExpirada(v)

              ||

              (
                intentosPin[
                  v.id
                ] || 0
              ) >= 3
            )

              ? "not-allowed"

              : "pointer",

          fontWeight:
            "bold",

          opacity:

            (
              visitaExpirada(v)

              ||

              (
                intentosPin[
                  v.id
                ] || 0
              ) >= 3
            )

              ? 0.7

              : 1,

        }}

      >

        Aprobar ingreso

      </button>

    )}

    {v.estado ===
      "INGRESÓ" && (

      <button
        onClick={() =>
          finalizarVisita(
            v.id
          )
        }
        style={{
          background:
            "#16a34a",
          color:
            "#fff",
          border:
            "none",
          padding:
            "10px 16px",
          borderRadius: 12,
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        Finalizar
      </button>

    )}

    {rol === "ADMIN" && (

      <button
        onClick={() =>
          eliminarVisita(
            v.id
          )
        }
        style={{
          background:
            "#dc2626",
          color:
            "#fff",
          border:
            "none",
          padding:
            "10px 16px",
          borderRadius: 12,
          cursor:
            "pointer",
          fontWeight:
            "bold",
        }}
      >
        Eliminar
      </button>

    )}

  </div>

)}

              </div>

            );

          }
        )

        )}

      </div>

    </main>

  );

}

{/* 🔥 INPUT */}

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
}: any) {

  return (

    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={inputStyle}
    />

  );

}

export default function Visitas() {
  return (
    <Suspense fallback={<div>Cargando visitas...</div>}>
      <VisitasContenido />
    </Suspense>
  );
}

// 🔥 BADGE

function EstadoBadge({
  estado,
}: any) {

  const colores: any = {

    PENDIENTE: {

      bg: "#fef3c7",

      color: "#92400e",

    },

    INGRESÓ: {

      bg: "#dbeafe",

      color: "#1d4ed8",

    },

    FINALIZADA: {

      bg: "#dcfce7",

      color: "#166534",

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