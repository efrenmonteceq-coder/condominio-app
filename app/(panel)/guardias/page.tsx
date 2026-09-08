"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Guardias() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  // 🔥 ESTADOS

  const [guardias, setGuardias] =
    useState<any[]>([]);

  // 🔥 FORM

  const [nombre, setNombre] =
    useState("");

  const [apellido, setApellido] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [identificacion, setIdentificacion] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 INIT

  useEffect(() => {

    if (usuario?.condominio_id) {

      cargarGuardias();

    }

  }, [usuario]);

  // 🔥 CARGAR

  const cargarGuardias =
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
        "GUARDIA"
      );

    if (error) {

      console.error(error);

      return;
    }

    setGuardias(data || []);

  };

  // 🔥 CREAR

  const crearGuardia =
    async () => {

    if (
      !nombre ||
      !apellido ||
      !email ||
      !telefono ||
      !identificacion
    ) {

      alert(
        "Completa todos los campos"
      );

      return;
    }

    try {

      const response = await fetch(
        "/api/usuarios/create",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            identificacion:
              identificacion.trim(),

            nombres:
              nombre.trim(),

            apellidos:
              apellido.trim(),

            email:
              email.trim(),

            rol: "GUARDIA",

            condominio_id:
              usuario.condominio_id,

          }),

        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        alert(
          result.error ||
          "Error creando guardia"
        );

        return;
      }

      alert(
        "Guardia creado correctamente"
      );

      limpiar();

      cargarGuardias();

    } catch (error) {

      console.error(error);

      alert(
        "Error interno"
      );

    }

  };

  // 🔥 EDITAR

  const editarGuardia =
    async (guardia: any) => {

    const nuevoNombre = prompt(
      "Nombre",
      guardia.nombre || ""
    );

    if (nuevoNombre === null)
      return;

    const nuevoApellido = prompt(
      "Apellido",
      guardia.apellido || ""
    );

    if (nuevoApellido === null)
      return;

    const nuevoEmail = prompt(
      "Correo",
      guardia.email || ""
    );

    if (nuevoEmail === null)
      return;

    const nuevoTelefono = prompt(
      "Teléfono",
      guardia.telefono || ""
    );

    if (nuevoTelefono === null)
      return;

    const nuevaIdentificacion = prompt(
      "Identificación",
      guardia.identificacion || ""
    );

    if (
      nuevaIdentificacion === null
    )
      return;

    const { error } = await supabase
      .from("usuarios")
      .update({

        nombre:
          nuevoNombre.trim(),

        apellido:
          nuevoApellido.trim(),

        email:
          nuevoEmail.trim(),

        telefono:
          nuevoTelefono.trim(),

        identificacion:
          nuevaIdentificacion.trim(),

      })
      .eq("id", guardia.id);

    if (error) {

      console.error(error);

      alert(
        "Error actualizando guardia"
      );

      return;
    }

    alert(
      "Guardia actualizado correctamente"
    );

    cargarGuardias();

  };

  // 🔥 ACTIVAR

  const cambiarEstado =
    async (guardia: any) => {

    const { error } = await supabase
      .from("usuarios")
      .update({

        activo:
          !guardia.activo

      })
      .eq("id", guardia.id);

    if (error) {

      console.error(error);

      alert(
        "Error actualizando estado"
      );

      return;
    }

    cargarGuardias();

  };

  // 🔥 ELIMINAR

  const eliminarGuardia =
    async (id: string) => {

    const confirmar = confirm(
      "¿Eliminar guardia?"
    );

    if (!confirmar)
      return;

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {

      console.error(error);

      alert(
        "Error eliminando guardia"
      );

      return;
    }

    alert(
      "Guardia eliminado"
    );

    cargarGuardias();

  };

  // 🔥 LIMPIAR

  const limpiar = () => {

    setNombre("");

    setApellido("");

    setEmail("");

    setTelefono("");

    setIdentificacion("");

  };

  // 🔥 FILTRO

  const guardiasFiltrados =
    busqueda
      ? guardias.filter(
          (g) =>
            g.nombre
              ?.toLowerCase()
              .includes(
                busqueda.toLowerCase()
              ) ||

            g.apellido
              ?.toLowerCase()
              .includes(
                busqueda.toLowerCase()
              ) ||

            g.identificacion
              ?.toLowerCase()
              .includes(
                busqueda.toLowerCase()
              )
        )
      : guardias;

  // 🔒 VALIDACIONES

  if (loading) {

    return <p>Cargando...</p>;

  }

  if (rol !== "ADMIN") {

    return (
      <p>
        No autorizado
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
            Guardias
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Gestión de seguridad y control residencial
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

      <div
        style={{
          background:
            "#fff",
          borderRadius: 24,
          padding: 25,
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
            fontSize: 24,
          }}
        >
          Registrar Guardia
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
          }}
        >

          <Input
            placeholder="Nombre"
            value={nombre}
            onChange={(e: any) =>
              setNombre(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Apellido"
            value={apellido}
            onChange={(e: any) =>
              setApellido(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Correo electrónico"
            value={email}
            onChange={(e: any) =>
              setEmail(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Teléfono"
            value={telefono}
            onChange={(e: any) =>
              setTelefono(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Identificación"
            value={identificacion}
            onChange={(e: any) =>
              setIdentificacion(
                e.target.value
              )
            }
          />

        </div>

        <div
          style={{
            marginTop: 22,
          }}
        >

          <button
            onClick={crearGuardia}
            style={{
              background:
                "linear-gradient(135deg,#111827,#1f2937)",
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
              boxShadow:
                "0 8px 18px rgba(0,0,0,0.2)",
            }}
          >
            + Crear Guardia
          </button>

        </div>

      </div>

      {/* 🔍 BUSCADOR */}

      <div
        style={{
          background:
            "#fff",
          borderRadius: 20,
          padding: 20,
          marginBottom: 25,
          boxShadow:
            "0 6px 18px rgba(0,0,0,0.05)",
        }}
      >

        <h2
          style={{
            marginTop: 0,
            color:
              "#111827",
          }}
        >
          Buscar Guardias
        </h2>

        <input
          placeholder="Buscar por nombre o identificación"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
          style={{
            width: "100%",
            maxWidth: 500,
            padding:
              "14px 18px",
            borderRadius: 14,
            border:
              "1px solid #d1d5db",
            fontSize: 15,
          }}
        />

      </div>

      {/* 🔥 LISTADO */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(320px,1fr))",
          gap: 20,
        }}
      >

        {guardiasFiltrados.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 25,
              borderRadius: 20,
            }}
          >
            No existen guardias registrados
          </div>

        ) : (

          guardiasFiltrados.map((g) => (

            <div
              key={g.id}
              style={{
                background:
                  "#fff",
                borderRadius: 24,
                padding: 22,
                boxShadow:
                  "0 8px 20px rgba(0,0,0,0.06)",
                border:
                  "1px solid #e5e7eb",
              }}
            >

              {/* 🔥 AVATAR */}

              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius:
                    "50%",
                  background:
                    "linear-gradient(135deg,#111827,#1f2937)",
                  color:
                    "#fff",
                  display: "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  fontSize: 26,
                  fontWeight:
                    "bold",
                  marginBottom: 18,
                }}
              >
                🛡️
              </div>

              {/* 🔥 NOMBRE */}

              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                  color:
                    "#111827",
                  fontSize: 22,
                }}
              >
                {g.nombre}
                {" "}
                {g.apellido}
              </h3>

              {/* 🔥 INFO */}

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 8,
                  color:
                    "#4b5563",
                  fontSize: 14,
                }}
              >

                <span>
                  📧 {g.email}
                </span>

                <span>
                  📱 {g.telefono}
                </span>

                <span>
                  🪪 {g.identificacion}
                </span>

              </div>

              {/* 🔥 BADGE */}

              <div
                style={{
                  marginTop: 16,
                  display:
                    "inline-block",

                  background:
                    g.activo
                      ? "#dcfce7"
                      : "#fee2e2",

                  color:
                    g.activo
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
                {g.activo
                  ? "ACTIVO"
                  : "INACTIVO"}
              </div>

              {/* 🔥 BOTONES */}

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
                    editarGuardia(g)
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
                    cambiarEstado(g)
                  }
                  style={{
                    background:
                      g.activo
                        ? "#f59e0b"
                        : "#16a34a",

                    color:
                      "#fff",

                    border:
                      "none",

                    padding:
                      "10px 16px",

                    borderRadius:
                      12,

                    cursor:
                      "pointer",

                    fontWeight:
                      "bold",
                  }}
                >
                  {g.activo
                    ? "Desactivar"
                    : "Activar"}
                </button>

                <button
                  onClick={() =>
                    eliminarGuardia(
                      g.id
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

              </div>

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