"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Residentes() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [residentes, setResidentes] =
    useState<any[]>([]);

  const [viviendas, setViviendas] =
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

  const [viviendaId, setViviendaId] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 INICIO

  useEffect(() => {

    if (usuario?.condominio_id) {

      cargarViviendas();

      cargarResidentes();

    }

  }, [usuario]);

  // 🔥 CARGAR VIVIENDAS

  const cargarViviendas = async () => {

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

    if (error) {

      console.error(
        "ERROR VIVIENDAS:",
        error.message
      );

      return;
    }

    setViviendas(data || []);

  };

  // 🔥 CARGAR RESIDENTES

  const cargarResidentes = async () => {

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
      .eq("rol", "RESIDENTE");

    if (error) {

      console.error(
        "ERROR RESIDENTES:",
        error.message
      );

      return;
    }

    setResidentes(data || []);

  };

  // 🔥 CREAR RESIDENTE

  const crearResidente = async () => {

    if (rol !== "ADMIN") {

      alert("No autorizado");

      return;
    }

    if (
      !nombre ||
      !apellido ||
      !email ||
      !telefono ||
      !identificacion ||
      !viviendaId
    ) {

      alert(
        "Completa todos los campos y selecciona una vivienda"
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

  telefono:
    telefono.trim(),

  rol: "RESIDENTE",

  condominio_id:
    usuario.condominio_id,

  vivienda_id:
    viviendaId,

}),


        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        alert(
          result.error ||
          "Error creando residente"
        );

        return;
      }

      const residenteCreado =
        await supabase
          .from("usuarios")
          .select("id")
          .eq(
            "identificacion",
            identificacion.trim()
          )
          .single();

      if (
        viviendaId &&
        residenteCreado.data
      ) {

        await supabase
          .from("viviendas")
          .update({

            residente_id:
              residenteCreado.data.id

          })
          .eq("id", viviendaId);

      }

      alert(
        "Residente creado correctamente"
      );

      limpiar();

      cargarResidentes();

      cargarViviendas();

    } catch (error) {

      console.error(error);

      alert(
        "Error interno del sistema"
      );

    }

  };

  // 🔥 EDITAR

  const editarResidente = async (
    residente: any
  ) => {

    const nuevoNombre = prompt(
      "Nombre",
      residente.nombre || ""
    );

    if (nuevoNombre === null) {
      return;
    }

    const nuevoApellido = prompt(
      "Apellido",
      residente.apellido || ""
    );

    if (nuevoApellido === null) {
      return;
    }

    const nuevoEmail = prompt(
      "Email",
      residente.email || ""
    );

    if (nuevoEmail === null) {
      return;
    }

    const nuevoTelefono = prompt(
      "Teléfono",
      residente.telefono || ""
    );

    if (nuevoTelefono === null) {
      return;
    }

    const nuevaIdentificacion = prompt(
      "Identificación",
      residente.identificacion || ""
    );

    if (
      nuevaIdentificacion === null
    ) {
      return;
    }

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
      .eq("id", residente.id);

    if (error) {

      console.error(error);

      alert(
        "Error actualizando residente"
      );

      return;
    }

    alert(
      "Residente actualizado correctamente"
    );

    cargarResidentes();

  };

  // 🔥 ELIMINAR

  const eliminarResidente = async (
    id: string
  ) => {

    const confirmar = confirm(
      "¿Eliminar residente?"
    );

    if (!confirmar) {
      return;
    }

    await supabase
      .from("viviendas")
      .update({

        residente_id: null

      })
      .eq("residente_id", id);

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {

      console.error(error);

      alert(
        "Error eliminando residente"
      );

      return;
    }

    alert(
      "Residente eliminado"
    );

    cargarResidentes();

    cargarViviendas();

  };

  // 🔥 LIMPIAR

  const limpiar = () => {

    setNombre("");

    setApellido("");

    setEmail("");

    setTelefono("");

    setIdentificacion("");

    setViviendaId("");

  };

  // 🔍 FILTRO

  const residentesFiltrados =
    busqueda
      ? residentes.filter(
          (r) =>
            r.nombre
              ?.toLowerCase()
              .includes(
                busqueda.toLowerCase()
              ) ||
            r.apellido
              ?.toLowerCase()
              .includes(
                busqueda.toLowerCase()
              ) ||
            r.identificacion
              ?.toLowerCase()
              .includes(
                busqueda.toLowerCase()
              )
        )
      : residentes;

  // 🔒 VALIDACIONES

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!usuario?.condominio_id) {

    return (
      <p>
        Usuario sin urbanización
      </p>
    );

  }

  if (rol === "RESIDENTE") {

    return (
      <main style={{ padding: 40 }}>
        <h2>
          No tienes acceso
        </h2>
      </main>
    );

  }

  if (
    !["ADMIN", "GUARDIA"].includes(
      rol
    )
  ) {

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
            Residentes
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Administración de residentes del condominio
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

      {/* 🔥 FORMULARIO */}

      {rol === "ADMIN" && (

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
            }}
          >
            Registrar Residente
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

            <select
              value={viviendaId}
              onChange={(e) =>
                setViviendaId(
                  e.target.value
                )
              }
              style={{
                padding:
                  "14px 16px",
                borderRadius: 14,
                border:
                  "1px solid #d1d5db",
                fontSize: 15,
                background:
                  "#fff",
              }}
            >

              <option value="">
                Seleccionar vivienda
              </option>

              {viviendas.map((v) => (

                <option
                  key={v.id}
                  value={v.id}
                >
                  {v.codigo_vivienda}
                </option>

              ))}

            </select>

          </div>

          <div
            style={{
              marginTop: 22,
            }}
          >

            <button
              onClick={
                crearResidente
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
                boxShadow:
                  "0 8px 18px rgba(37,99,235,0.25)",
              }}
            >
              + Crear Residente
            </button>

          </div>

        </div>

      )}

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
          Buscar Residentes
        </h2>

        <input
          placeholder="Buscar por nombre, apellido o identificación"
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

        {residentesFiltrados.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 25,
              borderRadius: 20,
            }}
          >
            No existen residentes registrados
          </div>

        ) : (

          residentesFiltrados.map((r) => (

            <div
              key={r.id}
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
                  width: 70,
                  height: 70,
                  borderRadius:
                    "50%",
                  background:
                    "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  color:
                    "#fff",
                  display: "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  fontSize: 24,
                  fontWeight:
                    "bold",
                  marginBottom: 18,
                }}
              >
                {(
                  r.nombre?.[0] || ""
                ) +
                  (
                    r.apellido?.[0] ||
                    ""
                  )}
              </div>

              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                  color:
                    "#111827",
                  fontSize: 22,
                }}
              >
                {r.nombre} {r.apellido}
              </h3>

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
                  📧 {r.email}
                </span>

                <span>
                  📱 {r.telefono}
                </span>

                <span>
                  🪪 {r.identificacion}
                </span>

              </div>

              {/* 🔥 BADGE */}

              <div
                style={{
                  marginTop: 16,
                  display: "inline-block",
                  background:
                    "#dcfce7",
                  color:
                    "#166534",
                  padding:
                    "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight:
                    "bold",
                }}
              >
                RESIDENTE ACTIVO
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
                      editarResidente(r)
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
                      eliminarResidente(
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

// 🔥 INPUT COMPONENTE

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