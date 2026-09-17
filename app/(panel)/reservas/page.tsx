"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams
} from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

function ReservasContenido() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const searchParams =
  useSearchParams();

const soloHistorial =
  searchParams.get(
    "solo"
  ) === "historial";

  const [areas,
    setAreas] =
    useState<any[]>([]);

  const [reservas,
    setReservas] =
    useState<any[]>([]);

  const [residentes,
    setResidentes] =
    useState<any[]>([]);

  // 🔥 FILTROS

  const [busqueda,
    setBusqueda] =
    useState("");

  const [filtroEstado,
    setFiltroEstado] =
    useState("");

  const [filtroFecha,
    setFiltroFecha] =
    useState("");

  // 🔥 HISTORIAL: por defecto mostramos solo las 2 últimas
  const [mostrarHistorialCompleto,
    setMostrarHistorialCompleto] =
    useState(false);

  // 🔥 FORM

  const [areaId,
    setAreaId] =
    useState("");

  const [fecha,
    setFecha] =
    useState("");

  const [horaInicio,
    setHoraInicio] =
    useState("");

  const [horaFin,
    setHoraFin] =
    useState("");

    // 🔥 BLOQUE HORARIO SELECCIONADO

const [bloqueHorario,
  setBloqueHorario] =
  useState("");


    // 🔥 POLÍTICAS DEL ÁREA

const [horarioInicioArea,
  setHorarioInicioArea] =
  useState("");

const [horarioFinArea,
  setHorarioFinArea] =
  useState("");

const [duracionBloque,
  setDuracionBloque] =
  useState(60);

const [duracionMaxima,
  setDuracionMaxima] =
  useState(1);

const [maxResidentes,
  setMaxResidentes] =
  useState(1);

const [maxInvitados,
  setMaxInvitados] =
  useState(0);

  // 🔥 ASISTENTES A LA RESERVA

const [residentesAsistentes,
  setResidentesAsistentes] =
  useState(1);

const [invitados,
  setInvitados] =
  useState(0);

const totalPersonas =
  residentesAsistentes +
  invitados;

  const [residenteId,
    setResidenteId] =
    useState("");

    // 🔥 INFORMACIÓN DEL ÁREA SELECCIONADA

const [capacidadArea,
  setCapacidadArea] =
  useState(0);

const [reservadasArea,
  setReservadasArea] =
  useState(0);

const [disponiblesArea,
  setDisponiblesArea] =
  useState(0);

const [nombreArea,
  setNombreArea] =
  useState("");

const [estadoArea,
  setEstadoArea] =
  useState("");

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

      cargarAreas();

      cargarResidentes();

      cargarReservas();

    }

  }, [usuario]);

  // 🔥 ACTUALIZAR INFORMACIÓN DEL ÁREA

useEffect(() => {

  const cargarInformacionArea = async () => {

    if (!areaId) {

      setCapacidadArea(0);
      setReservadasArea(0);
      setDisponiblesArea(0);
      setNombreArea("");
      setEstadoArea("");

      return;

    }

    // Área seleccionada

    const { data: area } = await supabase
      .from("areas_comunes")
      .select("*")
      .eq("id", areaId)
      .single();

    if (!area) return;

    setNombreArea(area.nombre);

    setCapacidadArea(area.capacidad);

    setHorarioInicioArea(
  area.horario_inicio
);

setHorarioFinArea(
  area.horario_fin
);

setDuracionBloque(
  area.duracion_bloque_minutos
);

setDuracionMaxima(
  area.duracion_maxima_horas
);

setMaxResidentes(
  area.max_residentes
);

setMaxInvitados(
  area.max_invitados
);

    // Si todavía no se ha escogido la fecha,
    // solo mostramos la capacidad.

    if (!fecha) {

      setReservadasArea(0);

      setDisponiblesArea(area.capacidad);

      setEstadoArea("DISPONIBLE");

      return;

    }

    // Contar reservas del día

    const { data: reservasHoy } = await supabase
      .from("reservas_areas")
      .select("*")
      .eq("area_id", areaId)
      .eq("fecha", fecha);

    // 🔥 TOTAL DE PERSONAS RESERVADAS

const totalReservadas =
  (reservasHoy || []).reduce(

    (total, reserva) =>

      total +

      (reserva.total_personas || 1),

    0

  );

setReservadasArea(
  totalReservadas
);

const disponibles =
  Math.max(
    area.capacidad -
    totalReservadas,
    0
  );

setDisponiblesArea(
  disponibles
);

setEstadoArea(
  disponibles === 0
    ? "COMPLETO"
    : "DISPONIBLE"
);

  };

  cargarInformacionArea();

}, [areaId, fecha]);

  // 🔥 ÁREAS

  const cargarAreas =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("areas_comunes")
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        )
        .eq(
          "estado",
          "ACTIVA"
        );

      if (error) {

        console.error(error);

        return;

      }

      setAreas(
        data || []
      );

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

      if (error) {

        console.error(error);

        return;

      }

      setResidentes(
        data || []
      );

    };

  // 🔥 RESERVAS

  const cargarReservas =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("reservas_areas")
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

      if (error) {

        console.error(error);

        return;

      }

      setReservas(
        data || []
      );

    };


    // =====================================================
// 🤖 MOTOR INTELIGENTE DE RESERVAS RENALIX
// =====================================================
    // 🔥 VERIFICA SI DOS HORARIOS SE CRUZAN

const horariosSeCruzan = (

  inicio1: string,
  fin1: string,

  inicio2: string,
  fin2: string

) => {

  return (

    inicio1 < fin2 &&
    fin1 > inicio2

  );

};

// 🔥 CALCULAR TOTAL DE PERSONAS EN UN HORARIO

const calcularPersonasEnHorario = (
  reservas: any[],
  horaInicio: string,
  horaFin: string
) => {

  return reservas
    .filter((r) =>
      horariosSeCruzan(
        horaInicio,
        horaFin,
        r.hora_inicio,
        r.hora_fin
      )
    )
    .reduce(
      (total, reserva) =>
        total + (reserva.total_personas || 1),
      0
    );

};

// 🔥 GENERAR BLOQUES HORARIOS

const generarBloques = () => {

  if (!horarioInicioArea || !horarioFinArea)
    return [];

  const bloques: {
    texto: string;
    inicio: string;
    fin: string;
  }[] = [];

  let actual = new Date(
    `2000-01-01T${horarioInicioArea}`
  );

  const fin = new Date(
    `2000-01-01T${horarioFinArea}`
  );

  while (actual < fin) {

    const siguiente = new Date(actual);

    siguiente.setMinutes(
      siguiente.getMinutes() +
      duracionBloque
    );

    if (siguiente > fin)
      break;

    bloques.push({

      texto:
        `${actual.toTimeString().substring(0,5)} - ${siguiente.toTimeString().substring(0,5)}`,

      inicio:
        actual.toTimeString().substring(0,5),

      fin:
        siguiente.toTimeString().substring(0,5),

    });

    actual = siguiente;

  }

  return bloques;

};

// 🔥 OBTENER BLOQUES CON CAPACIDAD DISPONIBLE

const obtenerBloquesDisponibles = (
  reservas: any[]
) => {

  const bloques = generarBloques();

  return bloques
    .map((bloque) => {

      const ocupadas =
        calcularPersonasEnHorario(
          reservas,
          bloque.inicio,
          bloque.fin
        );

      const disponibles =
        capacidadArea - ocupadas;

      return {

        ...bloque,

        ocupadas,

        disponibles,

        completo:
          disponibles < totalPersonas,

      };

    })
    .filter(
      (bloque) => !bloque.completo
    );

};

// 🔥 BUSCAR EL PRÓXIMO HORARIO DISPONIBLE

const obtenerProximoHorarioDisponible = (
  reservas: any[],
  horaInicio: string,
  horaFin: string,
  capacidad: number
) => {

  let propuesta = horaInicio;

  while (true) {

    const ocupadas = reservas.filter((r) =>
      horariosSeCruzan(
        propuesta,
        horaFin,
        r.hora_inicio,
        r.hora_fin
      )
    );

    if (ocupadas.length < capacidad)
      return propuesta;

    const ultimaReserva =
      ocupadas
        .sort((a, b) =>
          a.hora_fin.localeCompare(b.hora_fin)
        )
        .pop();

    if (!ultimaReserva)
      return propuesta;

    propuesta = ultimaReserva.hora_fin;

  }

};


  // 🔥 CREAR RESERVA

  const crearReserva =
    async () => {

      if (
        !areaId ||
        !fecha ||
        !horaInicio ||
        !horaFin
      ) {

        alert(
          "Completa todos los campos"
        );

        return;

      }

      let usuarioReservaId =
        "";

      // 🔥 ADMIN

      if (
        rol === "ADMIN"
      ) {

        if (!residenteId) {

          alert(
            "Selecciona residente"
          );

          return;

        }

        const {
          data: pagosVencidosAdmin,
        } = await supabase
          .from(
            "pagos_residentes"
          )
          .select("*")
          .eq(
            "residente_id",
            residenteId
          )
          .in(

  "estado",
  [
    "VENCIDO",
    "PENDIENTE",
  ]
);

        if (
          pagosVencidosAdmin &&
          pagosVencidosAdmin.length > 0
        ) {

          alert(
            "El residente tiene pagos vencidos"
          );

          return;

        }

        usuarioReservaId =
          residenteId;

      }

      // 🔥 RESIDENTE

      if (
        rol ===
        "RESIDENTE"
      ) {

        const residenteActual =
          residentes.find(
            (r) =>
              r.email ===
              usuario.email
          );

        if (
          !residenteActual
        ) {

          alert(
            "No se encontró residente"
          );

          return;

        }

        usuarioReservaId =
          residenteActual.id;

        const {
          data: pagosVencidos,
        } = await supabase
          .from(
            "pagos_residentes"
          )
          .select("*")
          .eq(
            "residente_id",
            residenteActual.id
          )
          .in(
  "estado",
  [
    "VENCIDO",
    "PENDIENTE",
  ]
);

        if (
          pagosVencidos &&
          pagosVencidos.length > 0
        ) {

          alert(
            "Tienes pagos vencidos"
          );

          return;

        }

      }

      // 🔥 OBTENER CAPACIDAD DEL ÁREA

const {
  data: areaSeleccionada,
  error: errorArea,
} = await supabase
  .from("areas_comunes")
  .select(`
    nombre,
    capacidad,
    horario_inicio,
    horario_fin,
    max_residentes,
    max_invitados,
    duracion_maxima_horas,
    duracion_bloque_minutos
  `)
  .eq("id", areaId)
  .single();

if (errorArea || !areaSeleccionada) {

  alert(
    "No se pudo obtener la capacidad del área."
  );

  return;

}

const capacidadMaxima =
  areaSeleccionada.capacidad;


      // 🔥 VALIDAR CONFLICTOS

      const {
        data: reservasExistentes,
      } = await supabase
        .from(
          "reservas_areas"
        )
        .select("*")
        .eq(
          "area_id",
          areaId
        )
        .eq(
          "fecha",
          fecha
        );

    // 🔥 CALCULAR PERSONAS OCUPANDO EL HORARIO

const personasEnHorario =
  calcularPersonasEnHorario(
    reservasExistentes || [],
    horaInicio,
    horaFin
  );

// 🔥 VALIDAR SEGÚN CAPACIDAD

if (
  personasEnHorario + totalPersonas >
  capacidadMaxima
) {

  const proximoHorario =
    obtenerProximoHorarioDisponible(

      reservasExistentes || [],

      horaInicio,

      horaFin,

      capacidadMaxima

    );

  if (capacidadMaxima === 1) {

    alert(
      `El área ya está reservada.\n\nPróximo horario disponible: ${proximoHorario}`
    );

  } else {

    alert(
      `No existen cupos disponibles para ${totalPersonas} personas entre ${horaInicio} y ${horaFin}.\n\nPróximo horario disponible: ${proximoHorario}`
    );

  }

  return;

}

      // 🔥 INSERT

      const payload = {

  area_id: areaId,

  usuario_id: usuarioReservaId,

  fecha,

  hora_inicio: horaInicio,

  hora_fin: horaFin,

  residentes_asistentes:
    residentesAsistentes,

  invitados,

  total_personas:
    totalPersonas,

  estado: "RESERVADA",

  condominio_id:
    usuario.condominio_id,

};
      const {
        error,
      } = await supabase
        .from(
          "reservas_areas"
        )
        .insert([
          payload,
        ]);

      if (error) {

        console.error(
          error
        );

        alert(
          "Error creando reserva"
        );

        return;

      }

      alert(
        "Reserva creada correctamente"
      );

      limpiar();

      cargarReservas();

    };

  // 🔥 ELIMINAR

  const eliminarReserva =
    async (
      id: string
    ) => {

      const confirmar =
        confirm(
          "¿Eliminar reserva?"
        );

      if (!confirmar) {
        return;
      }

      const {
        error,
      } = await supabase
        .from(
          "reservas_areas"
        )
        .delete()
        .eq(
          "id",
          id
        );

      if (error) {

        console.error(
          error
        );

        alert(
          "Error eliminando reserva"
        );

        return;

      }

      alert(
        "Reserva eliminada"
      );

      cargarReservas();

    };

  // 🔥 HELPERS

  const obtenerNombreArea =
    (
      areaId: string
    ) => {

      return areas.find(
        (a) =>
          a.id === areaId
      )?.nombre;

    };

  const obtenerResidente =
    (
      usuarioId: string
    ) => {

      return residentes.find(
        (r) =>
          r.id === usuarioId
      );

    };

  // 🔥 LIMPIAR

  const limpiar =
    () => {

      setAreaId("");

      setFecha("");

      setHoraInicio("");

      setHoraFin("");

      setResidenteId("");

      setResidentesAsistentes(1);

setInvitados(0);

    };

  // 🔥 FILTRAR

  const reservasFiltradas =
    useMemo(() => {

      return reservas.filter(
        (r) => {

          const area =
            obtenerNombreArea(
              r.area_id
            );

          const residente =
            obtenerResidente(
              r.usuario_id
            );

          const texto =
            `${area || ""} ${residente?.nombre || ""} ${residente?.apellido || ""}`
              .toLowerCase();

          const coincideBusqueda =
            texto.includes(
              busqueda.toLowerCase()
            );

          const coincideEstado =
            filtroEstado
              ? r.estado ===
                filtroEstado
              : true;

          const coincideFecha =
            filtroFecha
              ? r.fecha ===
                filtroFecha
              : true;

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideFecha
          );

        }
      );

    }, [
      reservas,
      busqueda,
      filtroEstado,
      filtroFecha,
    ]);

    const hayFiltros =
      busqueda.trim() ||
      filtroEstado ||
      filtroFecha;

    const reservasVisibles =
      hayFiltros || mostrarHistorialCompleto
        ? reservasFiltradas
        : reservasFiltradas.slice(0, 2);

    // 🔥 BLOQUES HORARIOS DISPONIBLES

const bloquesDisponibles =

  obtenerBloquesDisponibles(

    reservas.filter(

      (r) =>

        r.area_id === areaId &&

        r.fecha === fecha

    )

  );

  // 🔒 VALIDACIONES

  if (loading) {

    return (

      <div
        style={{
          minHeight:
            "100vh",
          display: "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          background:
            "#f3f4f6",
        }}
      >

        <p>
          Cargando...
        </p>

      </div>

    );

  }

  return (

    <main
      style={{
        minHeight:
          "100vh",
        background:
          "#f3f4f6",
        padding:
          "20px",
      }}
    >

      <div
        style={{
          maxWidth: 1300,
          margin:
            "0 auto",
        }}
      >

        {/* 🔥 HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#111827,#1f2937)",
            borderRadius: 28,
            padding:
              "35px 30px",
            marginBottom: 30,
            color: "#fff",
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

              <h1
                style={{
                  margin: 0,
                  fontSize: 36,
                }}
              >
                Reservas de Áreas
                Comunes
              </h1>

              <p
                style={{
                  marginTop: 10,
                  color:
                    "#d1d5db",
                  fontSize: 16,
                }}
              >
                Gestión inteligente
                de reservas para
                áreas sociales y
                recreativas.
              </p>

            </div>

            <button
              onClick={logout}
              style={{
                background:
                  "#dc2626",
                border: "none",
                color: "#fff",
                borderRadius: 16,
                padding:
                  "14px 22px",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
                fontSize: 15,
              }}
            >
              Cerrar sesión
            </button>

          </div>

        </div>

        {/* 🔥 FORMULARIO */}

        {!soloHistorial && (
        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 30,
            marginBottom: 30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: 25,
            }}
          >
            Nueva Reserva
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(260px,1fr))",
              gap: 20,
            }}
          >

            {/* 🔥 ADMIN */}

            {rol ===
              "ADMIN" && (

              <Campo>

                <Label>
                  Residente
                </Label>

                <select
                  value={
                    residenteId
                  }
                  onChange={(e) =>
                    setResidenteId(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                >

                  <option value="">
                    Seleccionar
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

                    )
                  )}

                </select>

              </Campo>

            )}

            {/* 🔥 ÁREA */}

            <Campo>

              <Label>
                Área común
              </Label>

              <select
                value={areaId}

                onChange={async (e) => {

  const id = e.target.value;

  setAreaId(id);

  if (!id) {

    setCapacidadArea(0);
    setReservadasArea(0);
    setDisponiblesArea(0);
    setNombreArea("");
    setEstadoArea("");

    return;

  }

  // 🔥 CARGAR ÁREA

  const { data: area } =
    await supabase
      .from("areas_comunes")
      .select("*")
      .eq("id", id)
      .single();

  if (!area) return;

  setNombreArea(area.nombre);

  setCapacidadArea(
    area.capacidad
  );

  // 🔥 CONTAR RESERVAS DEL DÍA SI YA HAY FECHA

  if (fecha) {

    const { data: reservasHoy } =
      await supabase
        .from("reservas_areas")
        .select("*")
        .eq("area_id", id)
        .eq("fecha", fecha);

    const cantidad =
      reservasHoy?.length || 0;

    setReservadasArea(
      cantidad
    );

    setDisponiblesArea(
      area.capacidad - cantidad
    );

    if (
      cantidad >= area.capacidad
    ) {

      setEstadoArea(
        "COMPLETO"
      );

    } else {

      setEstadoArea(
        "DISPONIBLE"
      );

    }

  }

}}
                
                style={
                  inputStyle
                }
              >

                <option value="">
                  Seleccionar área
                </option>

                {areas.map(
                  (a) => (

                    <option
                      key={a.id}
                      value={a.id}
                    >
                      {a.nombre}
                    </option>

                  )
                )}

              </select>

            </Campo>

            {/* 🔥 FECHA */}

            <Campo>

              <Label>
                Fecha
              </Label>

              <input
                type="date"
                value={fecha}
                onChange={(e) =>
                  setFecha(
                    e.target.value
                  )
                }
                style={
                  inputStyle
                }
              />

            </Campo>

            {/* 🔥 ASISTENTES */}

<Campo>

  <Label>
    Residentes asistentes
  </Label>

  <select
    value={residentesAsistentes}
    onChange={(e)=>
      setResidentesAsistentes(
        Number(e.target.value)
      )
    }
    style={inputStyle}
  >

    {Array.from(
      { length: maxResidentes },
      (_,i)=>i+1
    ).map((n)=>(

      <option
        key={n}
        value={n}
      >
        {n}
      </option>

    ))}

  </select>

</Campo>

<Campo>

  <Label>
    Invitados
  </Label>

  <select
    value={invitados}
    onChange={(e)=>
      setInvitados(
        Number(e.target.value)
      )
    }
    style={inputStyle}
  >

    {Array.from(
      { length: maxInvitados+1 },
      (_,i)=>i
    ).map((n)=>(

      <option
        key={n}
        value={n}
      >
        {n}
      </option>

    ))}

  </select>

</Campo>

<Campo>

  <Label>
    Total asistentes
  </Label>

  <input
    value={`${totalPersonas} personas`}
    readOnly
    style={{
      ...inputStyle,
      background:"#f3f4f6",
      fontWeight:"bold",
    }}
  />

</Campo>

{/* 🔥 HORARIOS DISPONIBLES */}

<Campo>

  <Label>
    Seleccione un horario
  </Label>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(220px,1fr))",
      gap: 15,
      marginTop: 10,
    }}
  >

    {bloquesDisponibles.length === 0 ? (

      <div
        style={{
          padding: 20,
          border: "1px dashed #d1d5db",
          borderRadius: 16,
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        No existen horarios disponibles.
      </div>

    ) : (

      bloquesDisponibles.map((bloque) => (

        <div
          key={bloque.texto}

          onClick={() => {

            setBloqueHorario(
              bloque.texto
            );

            setHoraInicio(
              bloque.inicio
            );

            setHoraFin(
              bloque.fin
            );

          }}

          style={{

    cursor: "pointer",

    border:

      bloqueHorario === bloque.texto

        ? "3px solid #2563eb"

        : bloque.disponibles <= 2

        ? "2px solid #dc2626"

        : bloque.disponibles <= 5

        ? "2px solid #f59e0b"

        : "1px solid #d1d5db",

    borderRadius: 18,

    padding: 18,

    background:

      bloqueHorario === bloque.texto

        ? "#dbeafe"

        : bloque.disponibles <= 2

        ? "#fef2f2"

        : bloque.disponibles <= 5

        ? "#fffbeb"

        : "#f0fdf4",

    transition: "all .2s",

  }}

>

          <div
            style={{
              fontWeight: "bold",
              fontSize: 17,
              marginBottom: 10,
              color: "#111827",
            }}
          >
            🕒 {bloque.texto}
          </div>

          <div
            style={{
              color: "#2563eb",
              fontWeight: "bold",
            }}
          >
            👥 {bloque.ocupadas}/{capacidadArea}
          </div>

         <div
  style={{
    marginTop: 10,
    fontWeight: "bold",
    fontSize: 14,
    color:

      bloque.disponibles <= 2

        ? "#dc2626"

        : bloque.disponibles <= 5

        ? "#d97706"

        : "#15803d",

  }}
>

  {bloque.disponibles <= 2

    ? "🔴 Últimos cupos"

    : bloque.disponibles <= 5

    ? "🟡 Pocos cupos"

    : "🟢 Disponible"}

</div>

        </div>

      ))

    )}

  </div>

</Campo>
          </div>

         {/* 🔥 INFORMACIÓN DEL ÁREA */}

{areaId && (

  <div
    style={{
      marginTop: 25,
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 22,
      padding: 24,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    }}
  >

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
        flexWrap: "wrap",
        gap: 15,
      }}
    >

      <h3
        style={{
          margin: 0,
          color: "#1e3a8a",
          fontSize: 26,
        }}
      >
        🏊 {nombreArea}
      </h3>

      <div
        style={{
          background:
            estadoArea === "COMPLETO"
              ? "#fee2e2"
              : "#dcfce7",
          color:
            estadoArea === "COMPLETO"
              ? "#b91c1c"
              : "#166534",
          border:
            estadoArea === "COMPLETO"
              ? "1px solid #fecaca"
              : "1px solid #bbf7d0",
          padding: "10px 18px",
          borderRadius: 999,
          fontWeight: "bold",
        }}
      >
        {estadoArea === "COMPLETO"
          ? "🔴 COMPLETO"
          : "🟢 DISPONIBLE"}
      </div>

    </div>

    {/* RESUMEN */}

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(170px,1fr))",
        gap: 16,
      }}
    >

      <Info
        label="👥 Capacidad"
        value={`${capacidadArea} personas`}
      />

      <Info
        label="📅 Reservadas"
        value={reservadasArea}
      />

      <Info
        label="✅ Disponibles"
        value={disponiblesArea}
      />

    </div>

    <hr
      style={{
        margin: "24px 0",
        border: "none",
        borderTop: "1px solid #e5e7eb",
      }}
    />

    {/* CONFIGURACIÓN */}

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: 16,
      }}
    >

      <Info
        label="🕒 Horario"
        value={`${horarioInicioArea} - ${horarioFinArea}`}
      />

      <Info
        label="⌛ Bloques"
        value={`${duracionBloque} minutos`}
      />

      <Info
        label="👨 Máx. residentes"
        value={maxResidentes}
      />

      <Info
        label="🎟 Máx. invitados"
        value={maxInvitados}
      />

      <Info
        label="⏱ Duración máxima"
        value={`${duracionMaxima} hora${duracionMaxima > 1 ? "s" : ""}`}
      />

    </div>

  </div>

)}
          <br />

          <button
            onClick={
              crearReserva
            }
            style={{
              background:
                "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: 18,
              padding:
                "18px 28px",
              fontWeight:
                "bold",
              fontSize: 16,
              cursor:
                "pointer",
              boxShadow:
                "0 8px 24px rgba(37,99,235,0.35)",
            }}
          >
            Reservar área
          </button>

        </div>
        )}
        
        {/* 🔥 FILTROS */}

        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 25,
            marginBottom: 30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            Buscar reservas
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: 20,
            }}
          >

            <input
              placeholder="Buscar área o residente..."
              value={
                busqueda
              }
              onChange={(e) => {
                setBusqueda(e.target.value);
                setMostrarHistorialCompleto(true);
              }}
              style={
                inputStyle
              }
            />

            <select
              value={
                filtroEstado
              }
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setMostrarHistorialCompleto(true);
              }}
              style={
                inputStyle
              }
            >

              <option value="">
                Todos los estados
              </option>

              <option value="RESERVADA">
                RESERVADA
              </option>

              <option value="FINALIZADA">
                FINALIZADA
              </option>

              <option value="CANCELADA">
                CANCELADA
              </option>

            </select>

            <input
              type="date"
              value={
                filtroFecha
              }
              onChange={(e) => {
                setFiltroFecha(e.target.value);
                setMostrarHistorialCompleto(true);
              }}
              style={
                inputStyle
              }
            />

          </div>

        </div>

        {/* 🔥 HISTORIAL */}

        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
            marginBottom: 40,
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
              gap: 15,
              marginBottom: 25,
            }}
          >

            <h2
              style={{
                margin: 0,
              }}
            >
              Historial de reservas
            </h2>

            <div
              style={{
                background:
                  "#111827",
                color: "#fff",
                padding:
                  "10px 18px",
                borderRadius: 14,
                fontWeight:
                  "bold",
              }}
            >
              Resultados:
              {" "}
              {
                reservasFiltradas.length
              }
            </div>

          </div>

          {!hayFiltros && (
            <button
              type="button"
              onClick={() =>
                setMostrarHistorialCompleto(
                  (actual) => !actual
                )
              }
              style={{
                width: "100%",
                marginBottom: 12,
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                background: "#ffffff",
                color: "#111827",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {mostrarHistorialCompleto
                ? "⬆️ Ver solo las 2 últimas"
                : "📂 Ver historial completo"}
            </button>
          )}

          {!hayFiltros && reservas.length > 0 && (
            <div
              style={{
                marginBottom: 18,
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              {mostrarHistorialCompleto
                ? `Mostrando el historial completo: ${reservas.length} registros`
                : `Mostrando las ${Math.min(2, reservas.length)} últimas de ${reservas.length} registros`}
            </div>
          )}

          {reservasFiltradas.length ===
          0 ? (

            <div
              style={{
                padding: 40,
                border:
                  "2px dashed #d1d5db",
                borderRadius: 20,
                textAlign:
                  "center",
                color:
                  "#6b7280",
              }}
            >

              {hayFiltros
                ? "No se encontraron reservas con los filtros seleccionados."
                : "No existen reservas registradas"}

            </div>

          ) : (

            reservasVisibles.map(
              (r) => {

                const residente =
                  obtenerResidente(
                    r.usuario_id
                  );

                return (

                  <div
                    key={r.id}
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: 24,
                      padding: 24,
                      marginBottom: 20,
                      background:
                        "#fafafa",
                    }}
                  >

                    {/* 🔥 TOP */}

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        flexWrap:
                          "wrap",
                        gap: 15,
                      }}
                    >

                      <div>

                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: 12,
                            fontSize: 24,
                          }}
                        >
                          {
                            obtenerNombreArea(
                              r.area_id
                            )
                          }
                        </h3>

                        <Badge
                          text={
                            r.estado
                          }
                          color={
                            r.estado ===
                            "RESERVADA"
                              ? "#16a34a"
                              : r.estado ===
                                "CANCELADA"
                              ? "#dc2626"
                              : "#2563eb"
                          }
                        />

                      </div>

                    </div>

                    {/* 🔥 GRID */}

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(220px,1fr))",
                        gap: 18,
                        marginTop: 25,
                      }}
                    >

                      <Info
                        label="Fecha"
                        value={
                          r.fecha
                        }
                      />

                      <Info
                        label="Hora inicio"
                        value={
                          r.hora_inicio
                        }
                      />

                      <Info
                        label="Hora fin"
                        value={
                          r.hora_fin
                        }
                      />

                      <Info
                        label="Residente"
                        value={`${residente?.nombre || ""} ${residente?.apellido || ""}`}
                      />

                      <Info
  label="👨 Residentes"
  value={r.residentes_asistentes ?? 1}
/>

<Info
  label="🎟 Invitados"
  value={r.invitados ?? 0}
/>

<Info
  label="👥 Total"
  value={`${r.total_personas ?? 1} personas`}
/>

                    </div>

                    {/* 🔥 ADMIN */}

                    {rol ===
                      "ADMIN" && (

                      <div
                        style={{
                          marginTop: 20,
                          paddingTop: 18,
                          borderTop:
                            "1px solid #e5e7eb",
                        }}
                      >

                        <b>
                          Identificación:
                        </b>
                        {" "}
                        {
                          residente?.identificacion
                        }

                        <br />

                        <b>
                          Teléfono:
                        </b>
                        {" "}
                        {
                          residente?.telefono
                        }

                        <br />

                        <b>
                          Correo:
                        </b>
                        {" "}
                        {
                          residente?.email
                        }

                        <br />
                        <br />

                        <button
                          onClick={() =>
                            eliminarReserva(
                              r.id
                            )
                          }
                          style={{
                            background:
                              "#dc2626",
                            color:
                              "#fff",
                            border:
                              "none",
                            borderRadius: 14,
                            padding:
                              "12px 20px",
                            fontWeight:
                              "bold",
                            cursor:
                              "pointer",
                          }}
                        >
                          Eliminar reserva
                        </button>

                      </div>

                    )}

                  </div>

                );

              }
            )

          )}

        </div>

      </div>

    </main>

  );
}

export default function Reservas() {
  return (
    <Suspense fallback={<div>Cargando reservas...</div>}>
      <ReservasContenido />
    </Suspense>
  );
}

// 🔥 COMPONENTES

function Campo({
  children,
}: any) {

  return (
    <div>
      {children}
    </div>
  );

}

function Label({
  children,
}: any) {

  return (

    <label
      style={{
        display:
          "block",
        marginBottom: 8,
        fontWeight:
          "bold",
        color:
          "#374151",
      }}
    >
      {children}
    </label>

  );

}

function Info({
  label,
  value,
}: any) {

  return (

    <div
      style={{
        background:
          "#fff",
        padding: 16,
        borderRadius: 16,
        border:
          "1px solid #e5e7eb",
      }}
    >

      <div
        style={{
          color:
            "#6b7280",
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight:
            "bold",
          color:
            "#111827",
        }}
      >
        {value}
      </div>

    </div>

  );

}

function Badge({
  text,
  color,
}: any) {

  return (

    <div
      style={{
        background:
          color,
        color: "#fff",
        padding:
          "8px 14px",
        borderRadius: 999,
        fontWeight:
          "bold",
        fontSize: 13,
        display:
          "inline-block",
      }}
    >
      {text}
    </div>

  );

}

// 🔥 INPUTS

const inputStyle = {

  width: "100%",

  padding: 16,

  borderRadius: 16,

  border:
    "1px solid #d1d5db",

  fontSize: 15,

  outline: "none",

  boxSizing:
    "border-box" as const,

};