"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function AreasComunes() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [areas, setAreas] =
    useState<any[]>([]);

  // 🔥 FORM

  const [nombre, setNombre] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [capacidad, setCapacidad] =
    useState("");

    // 🔥 HORARIOS

const [horarioInicio,
  setHorarioInicio] =
  useState("08:00");

const [horarioFin,
  setHorarioFin] =
  useState("20:00");

// 🔥 POLÍTICAS

const [maxResidentes,
  setMaxResidentes] =
  useState("3");

const [maxInvitados,
  setMaxInvitados] =
  useState("2");

const [duracionMaxima,
  setDuracionMaxima] =
  useState("2");

const [duracionBloque,
  setDuracionBloque] =
  useState("60");

  const [busqueda, setBusqueda] =
    useState("");

  const [mostrarHistorial, setMostrarHistorial] =
    useState(false);

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 INICIO

  useEffect(() => {

    if (usuario?.condominio_id) {

      cargarAreas();

    }

  }, [usuario]);

  // 🔥 CARGAR ÁREAS

  const cargarAreas = async () => {

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
      .order("created_at", {
        ascending: false,
      });

    if (error) {

      console.error(
        "ERROR ÁREAS:",
        error.message
      );

      return;
    }

    setAreas(data || []);

  };

  // 🔥 CREAR ÁREA

  const crearArea = async () => {

    if (rol !== "ADMIN") {

      alert("No autorizado");

      return;
    }

    if (
      !nombre ||
      !descripcion ||
      !capacidad
    ) {

      alert(
        "Completa todos los campos"
      );

      return;
    }

    const payload = {

  nombre: nombre.trim(),

  descripcion: descripcion.trim(),

  capacidad: Number(capacidad),

  estado: "ACTIVA",

  condominio_id: usuario.condominio_id,

  horario_inicio: horarioInicio,

  horario_fin: horarioFin,

  max_residentes: Number(maxResidentes),

  max_invitados: Number(maxInvitados),

  duracion_maxima_horas: Number(duracionMaxima),

  duracion_bloque_minutos: Number(duracionBloque),

};

    const { error } = await supabase
      .from("areas_comunes")
      .insert([payload]);

    if (error) {

      console.error(error);

      alert(
        "Error creando área común"
      );

      return;
    }

    alert(
      "Área común creada correctamente"
    );

    limpiar();

    cargarAreas();

  };

  // 🔥 EDITAR ÁREA

  const editarArea = async (
    area: any
  ) => {

    const nuevoNombre = prompt(
      "Nombre",
      area.nombre || ""
    );

    if (nuevoNombre === null)
      return;

    const nuevaDescripcion = prompt(
      "Descripción",
      area.descripcion || ""
    );

    if (
      nuevaDescripcion === null
    )
      return;

    const nuevaCapacidad = prompt(
      "Capacidad",
      area.capacidad || ""
    );

    if (
      nuevaCapacidad === null
    )
      return;

    const nuevoEstado = prompt(
      "Estado",
      area.estado || "ACTIVA"
    );

    if (nuevoEstado === null)
      return;

    const { error } = await supabase
      .from("areas_comunes")
      .update({

        nombre:
          nuevoNombre.trim(),

        descripcion:
          nuevaDescripcion.trim(),

        capacidad:
          Number(nuevaCapacidad),

        estado:
          nuevoEstado.trim(),

      })
      .eq("id", area.id);

    if (error) {

      alert(
        "Error actualizando"
      );

      return;
    }

    alert(
      "Área actualizada"
    );

    cargarAreas();

  };

  // 🔥 ELIMINAR

  const eliminarArea = async (
    id: string
  ) => {

    const confirmar = confirm(
      "¿Eliminar área?"
    );

    if (!confirmar)
      return;

    const { error } = await supabase
      .from("areas_comunes")
      .delete()
      .eq("id", id);

    if (error) {

      alert(
        "Error eliminando"
      );

      return;
    }

    cargarAreas();

  };

  // 🔥 LIMPIAR

  const limpiar = () => {

  setNombre("");

  setDescripcion("");

  setCapacidad("");

  setHorarioInicio("08:00");

  setHorarioFin("20:00");

  setMaxResidentes("3");

  setMaxInvitados("2");

  setDuracionMaxima("2");

  setDuracionBloque("60");

};

  // 🔍 FILTRO + HISTORIAL

  const terminoBusqueda =
    busqueda.trim().toLowerCase();

  const areasFiltradas =
    terminoBusqueda
      ? areas.filter((a) => {
          const textoBusqueda = [
            a.nombre,
            a.descripcion,
            a.estado,
            a.capacidad,
            a.horario_inicio,
            a.horario_fin,
            a.max_residentes,
            a.max_invitados,
            a.duracion_maxima_horas,
            a.duracion_bloque_minutos,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return textoBusqueda.includes(terminoBusqueda);
        })
      : mostrarHistorial
        ? areas
        : areas.slice(0, 2);

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
            Áreas Comunes
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Gestión de espacios y áreas recreativas
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
              marginBottom: 20,
              color:
                "#111827",
            }}
          >
            Registrar Área Común
          </h2>

          {/* 🔥 INFORMACIÓN GENERAL */}

<h3
  style={{
    marginTop: 10,
    marginBottom: 15,
    color: "#1e3a8a",
  }}
>
  Información General
</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: 16,
  }}
>

  <Input
    placeholder="Nombre del área"
    value={nombre}
    onChange={(e:any)=>
      setNombre(e.target.value)
    }
  />

  <Input
    placeholder="Capacidad de personas"
    value={capacidad}
    onChange={(e:any)=>
      setCapacidad(e.target.value)
    }
  />

</div>

{/* 🔥 HORARIOS */}

<h3
  style={{
    marginTop: 30,
    marginBottom: 15,
    color: "#1e3a8a",
  }}
>
  Horarios
</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 20,
    alignItems: "start",
  }}
>
  <div>

  <label
    style={{
      display: "block",
      marginBottom: 6,
      fontWeight: "bold",
      color: "#374151",
    }}
  >
    Horario de inicio
  </label>

  <input
    type="time"
    value={horarioInicio}
    onChange={(e)=>
      setHorarioInicio(
        e.target.value
      )
    }
    style={{
      width:"100%",
      padding:"14px 16px",
      borderRadius:14,
      border:"1px solid #d1d5db",
      fontSize:15,
      background:"#fff",
    }}
  />

</div>

<div>

  <label
    style={{
      display: "block",
      marginBottom: 6,
      fontWeight: "bold",
      color: "#374151",
    }}
  >
    Horario de fin
  </label>

  <input
    type="time"
    value={horarioFin}
    onChange={(e) =>
      setHorarioFin(
        e.target.value
      )
    }
    style={{
      width: "100%",
      padding: "14px 16px",
      borderRadius: 14,
      border: "1px solid #d1d5db",
      fontSize: 15,
      background: "#fff",
    }}
  />

</div>

  <div>

  <label
    style={{
      display: "block",
      marginBottom: 6,
      fontWeight: "bold",
      color: "#374151",
    }}
  >
    Duración del bloque
  </label>

  <select
    value={duracionBloque}
    onChange={(e) =>
      setDuracionBloque(e.target.value)
    }
    style={{
      width: "100%",
      padding: "14px",
      borderRadius: 14,
      border: "1px solid #d1d5db",
      fontSize: 15,
      background: "#fff",
    }}
  >
    <option value="30">
      30 minutos
    </option>

    <option value="60">
      1 hora
    </option>

    <option value="90">
      1 hora 30 minutos
    </option>

    <option value="120">
      2 horas
    </option>

  </select>

</div>

</div>

{/* 🔥 POLÍTICAS */}

<h3
  style={{
    marginTop: 30,
    marginBottom: 15,
    color: "#1e3a8a",
  }}
>
  Políticas del Área
</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 20,
    alignItems: "start",
  }}
>

  {/* Máximo residentes */}

  <div>

    <label
      style={{
        display: "block",
        marginBottom: 6,
        fontWeight: "bold",
        color: "#374151",
      }}
    >
      Máximo de residentes
    </label>

    <select
      value={maxResidentes}
      onChange={(e) =>
        setMaxResidentes(e.target.value)
      }
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: 14,
        border: "1px solid #d1d5db",
        fontSize: 15,
        background: "#fff",
      }}
    >
      {[1,2,3,4,5].map((n) => (
        <option key={n} value={n}>
          {n} residente{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>

  </div>

  {/* Máximo invitados */}

  <div>

    <label
      style={{
        display: "block",
        marginBottom: 6,
        fontWeight: "bold",
        color: "#374151",
      }}
    >
      Máximo de invitados
    </label>

    <select
      value={maxInvitados}
      onChange={(e) =>
        setMaxInvitados(e.target.value)
      }
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: 14,
        border: "1px solid #d1d5db",
        fontSize: 15,
        background: "#fff",
      }}
    >
      {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
        <option key={n} value={n}>
          {n === 0
            ? "No se permiten invitados"
            : `${n} invitado${n > 1 ? "s" : ""}`}
        </option>
      ))}
    </select>

  </div>

  {/* Duración máxima */}

  <div>

    <label
      style={{
        display: "block",
        marginBottom: 6,
        fontWeight: "bold",
        color: "#374151",
      }}
    >
      Duración máxima
    </label>

    <select
      value={duracionMaxima}
      onChange={(e) =>
        setDuracionMaxima(e.target.value)
      }
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: 14,
        border: "1px solid #d1d5db",
        fontSize: 15,
        background: "#fff",
      }}
    >
      {[1,2,3,4,5,6,7,8].map((n) => (
        <option key={n} value={n}>
          {n} hora{n > 1 ? "s" : ""}
        </option>
      ))}
    </select>

  </div>

</div>
          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) =>
              setDescripcion(
                e.target.value
              )
            }
            style={{
              width: "100%",
              minHeight: 120,
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
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
              onClick={crearArea}
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
              + Crear Área
            </button>

          </div>

        </div>

      )}

      {/* 🔍 BUSCADOR */}

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
            color:
              "#111827",
          }}
        >
          Buscar Área
        </h2>

        <input
          placeholder="Buscar área común"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
          style={{
            width: "100%",
            maxWidth: 420,
            padding:
              "14px 16px",
            borderRadius: 14,
            border:
              "1px solid #d1d5db",
            fontSize: 15,
          }}
        />

        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setMostrarHistorial(
                !mostrarHistorial
              )
            }
            style={{
              background: mostrarHistorial
                ? "#eef2ff"
                : "#f3f4f6",
              color: "#1f2937",
              border: "1px solid #d1d5db",
              padding: "10px 14px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            {mostrarHistorial
              ? "⬆️ Ver solo las 2 últimas"
              : "📂 Ver historial completo"}
          </button>

          <span
            style={{
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            {terminoBusqueda
              ? `${areasFiltradas.length} resultado${areasFiltradas.length === 1 ? "" : "s"}`
              : `${areas.length} área${areas.length === 1 ? "" : "s"} registrada${areas.length === 1 ? "" : "s"}`}
          </span>
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

        {areasFiltradas.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 24,
              borderRadius: 20,
            }}
          >
            No existen áreas comunes
          </div>

        ) : (

          areasFiltradas.map((a) => (

            <div
              key={a.id}
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

              {/* 🔥 ICONO */}

              <div
                style={{
                  width: 82,
                  height: 82,
                  borderRadius:
                    "50%",
                  background:
                    "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  display: "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  color:
                    "#fff",
                  fontSize: 34,
                  marginBottom: 18,
                }}
              >
                🏖️
              </div>

              {/* 🔥 NOMBRE */}

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                  color:
                    "#111827",
                  fontSize: 24,
                }}
              >
                {a.nombre}
              </h2>

              {/* 🔥 DESCRIPCION */}

              <p
                style={{
                  color:
                    "#4b5563",
                  lineHeight: 1.6,
                  fontSize: 14,
                }}
              >
                {a.descripcion}
              </p>

             {/* 🔥 INFORMACIÓN */}

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 18,
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.7,
  }}
>

  <span>
    👥 <b>Capacidad:</b>{" "}
    {a.capacidad} personas
  </span>

  <span>
    🕒 <b>Horario:</b>{" "}
    {a.horario_inicio}
    {" - "}
    {a.horario_fin}
  </span>

  <span>
    👨 <b>Residentes:</b>{" "}
    {a.max_residentes}
  </span>

  <span>
    🎟 <b>Invitados:</b>{" "}
    {a.max_invitados}
  </span>

  <span>
    ⏱ <b>Reserva máxima:</b>{" "}
    {a.duracion_maxima_horas} hora
    {a.duracion_maxima_horas > 1
      ? "s"
      : ""}
  </span>

  <span>
    ⌛ <b>Bloques:</b>{" "}
    {a.duracion_bloque_minutos}
    {" min"}
  </span>

</div>

              {/* 🔥 BADGE */}

              <div
                style={{
                  marginTop: 18,
                  display:
                    "inline-block",
                  background:
                    a.estado ===
                    "ACTIVA"
                      ? "#dcfce7"
                      : "#fee2e2",

                  color:
                    a.estado ===
                    "ACTIVA"
                      ? "#166534"
                      : "#991b1b",

                  padding:
                    "6px 12px",

                  borderRadius:
                    999,

                  fontSize: 12,

                  fontWeight:
                    "bold",
                }}
              >
                {a.estado}
              </div>

              {/* 🔥 BOTONES */}

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

                  <button
                    onClick={() =>
                      editarArea(a)
                    }
                    style={{
                      background:
                        "#2563eb",
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
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      eliminarArea(a.id)
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

                </div>

              )}

            </div>

          ))

        )}

      </div>

    </main>

  );

}

// 🔥 INPUT

function Input({
  placeholder,
  value,
  onChange,
}: any) {

  return (

    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        padding:
          "14px 16px",
        borderRadius: 14,
        border:
          "1px solid #d1d5db",
        fontSize: 15,
        width: "100%",
        background:
          "#fff",
      }}
    />

  );

}