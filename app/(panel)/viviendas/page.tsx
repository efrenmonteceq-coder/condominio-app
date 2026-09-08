"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Viviendas() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [conjuntos, setConjuntos] =
    useState<any[]>([]);

  // 🔥 FORMULARIO

  const [codigo, setCodigo] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [alicuota, setAlicuota] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [editandoId,
    setEditandoId] =
    useState<string | null>(null);

  // 🔥 BUSQUEDA

  const [busqueda,
    setBusqueda] =
    useState("");

  const [resultado,
    setResultado] =
    useState<any[]>([]);

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 CARGAR CONDOMINIO

  const cargarConjuntos =
    async () => {

    if (
      !usuario?.condominio_id
    ) return;

    const {
      data,
      error,
    } = await supabase
      .from("condominios")
      .select("*")
      .eq(
        "id",
        usuario.condominio_id
      );

    if (error) {

      console.error(
        "ERROR CONDOMINIO:",
        error.message
      );

      return;
    }

    setConjuntos(data || []);

  };

  useEffect(() => {

    if (
      usuario?.condominio_id
    ) {

      cargarConjuntos();

      buscarVivienda();

    }

  }, [usuario]);

  // 🔥 CREAR

  const crearVivienda =
    async () => {

    if (rol !== "ADMIN") {

      alert(
        "No autorizado"
      );

      return;
    }

    if (
      !codigo ||
      !alicuota ||
      !estado
    ) {

      alert(
        "Completa los campos obligatorios"
      );

      return;
    }

    const payload = {

      condominio_id:
        usuario.condominio_id,

      codigo_vivienda:
        codigo.trim(),

      tipo_vivienda:
        tipo,

      alicuota_mensual:
        Number(alicuota),

      estado:
        estado.trim(),

    };

    const { error } =
      await supabase
        .from("viviendas")
        .insert([payload]);

    if (error) {

      console.error(
        "ERROR INSERT:",
        error.message
      );

      alert(
        "Error al guardar vivienda"
      );

      return;
    }

    limpiar();

    buscarVivienda();

    alert(
      "Vivienda creada correctamente"
    );

  };

  // 🔥 BUSCAR

  const buscarVivienda =
    async () => {

    let query = supabase
      .from("viviendas")
      .select("*")
      .eq(
        "condominio_id",
        usuario.condominio_id
      );

    if (busqueda) {

      query = query.ilike(
        "codigo_vivienda",
        `%${busqueda}%`
      );

    }

    const {
      data,
      error,
    } = await query;

    if (error) {

      console.error(
        "ERROR BUSQUEDA:",
        error.message
      );

      return;
    }

    setResultado(data || []);

  };

  // 🔥 ELIMINAR

  const eliminarVivienda =
    async (id: string) => {

    if (rol !== "ADMIN") {

      alert(
        "No autorizado"
      );

      return;
    }

    if (
      !confirm(
        "¿Eliminar vivienda?"
      )
    ) return;

    await supabase
      .from("viviendas")
      .delete()
      .eq("id", id);

    buscarVivienda();

  };

  // 🔥 EDITAR

  const editarVivienda =
    (v: any) => {

    if (rol !== "ADMIN") {

      alert(
        "No autorizado"
      );

      return;
    }

    setEditandoId(v.id);

    setCodigo(
      v.codigo_vivienda || ""
    );

    setTipo(
      v.tipo_vivienda || ""
    );

    setAlicuota(
      v.alicuota_mensual || ""
    );

    setEstado(
      v.estado || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };

  // 🔥 GUARDAR EDICION

  const guardarEdicion =
    async () => {

    if (rol !== "ADMIN") {

      alert(
        "No autorizado"
      );

      return;
    }

    if (!editandoId) return;

    const { error } =
      await supabase
        .from("viviendas")
        .update({

          codigo_vivienda:
            codigo.trim(),

          tipo_vivienda:
            tipo,

          alicuota_mensual:
            Number(alicuota),

          estado:
            estado.trim(),

        })
        .eq(
          "id",
          editandoId
        );

    if (error) {

      console.error(
        "ERROR UPDATE:",
        error.message
      );

      alert(
        "Error actualizando"
      );

      return;
    }

    setEditandoId(null);

    limpiar();

    buscarVivienda();

    alert(
      "Vivienda actualizada"
    );

  };

  // 🔥 LIMPIAR

  const limpiar = () => {

    setCodigo("");

    setTipo("");

    setAlicuota("");

    setEstado("");

  };

  // 🔥 CONDOMINIO

  const obtenerCondominio =
    (id: string) => {

    const c =
      conjuntos.find(
        (c) => c.id === id
      );

    return c
      ? c.nombre
      : "Urbanización";

  };

  // 🔒 VALIDACIONES

  if (loading) {

    return <p>Cargando...</p>;

  }

  if (!usuario?.condominio_id) {

    return (
      <p>
        Usuario sin urbanización asignada
      </p>
    );

  }

  if (rol === "RESIDENTE") {

    return (
      <main
        style={{
          padding: 40,
        }}
      >
        <h2>
          No tienes acceso
        </h2>
      </main>
    );

  }

  if (
    !["ADMIN", "GUARDIA"]
      .includes(rol)
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
            Viviendas
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Gestión de viviendas y unidades residenciales
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

      {/* 🔥 INFO */}

      <div
        style={{
          background:
            "#fff",
          borderRadius: 22,
          padding: 22,
          marginBottom: 25,
          boxShadow:
            "0 6px 18px rgba(0,0,0,0.05)",
        }}
      >

        <div
          style={{
            color:
              "#6b7280",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          CONDOMINIO
        </div>

        <h2
          style={{
            margin: 0,
            color:
              "#111827",
          }}
        >
          {obtenerCondominio(
            usuario.condominio_id
          )}
        </h2>

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

            {editandoId
              ? "Editar Vivienda"
              : "Registrar Vivienda"}

          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(240px,1fr))",
              gap: 18,
            }}
          >

            <Input
              placeholder="Código vivienda"
              value={codigo}
              onChange={(e: any) =>
                setCodigo(
                  e.target.value
                )
              }
            />

            <Input
              placeholder="Tipo vivienda"
              value={tipo}
              onChange={(e: any) =>
                setTipo(
                  e.target.value
                )
              }
            />

            <Input
              placeholder="Alícuota mensual"
              value={alicuota}
              onChange={(e: any) =>
                setAlicuota(
                  e.target.value
                )
              }
            />

            <select
              value={estado}
              onChange={(e) =>
                setEstado(
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
                Estado vivienda
              </option>

              <option value="OCUPADA">
                Ocupada
              </option>

              <option value="DESOCUPADA">
                Desocupada
              </option>

            </select>

          </div>

          <div
            style={{
              marginTop: 22,
            }}
          >

            {editandoId ? (

              <button
                onClick={
                  guardarEdicion
                }
                style={{
                  background:
                    "linear-gradient(135deg,#16a34a,#15803d)",
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
                Guardar cambios
              </button>

            ) : (

              <button
                onClick={
                  crearVivienda
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
                + Registrar vivienda
              </button>

            )}

          </div>

        </div>

      )}

      {/* 🔥 BUSQUEDA */}

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
          Buscar Vivienda
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
            placeholder="Buscar código vivienda"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            style={{
              flex: 1,
              minWidth: 240,
              padding:
                "14px 18px",
              borderRadius: 14,
              border:
                "1px solid #d1d5db",
              fontSize: 15,
            }}
          />

          <button
            onClick={
              buscarVivienda
            }
            style={{
              background:
                "#111827",
              color:
                "#fff",
              border:
                "none",
              padding:
                "14px 20px",
              borderRadius: 14,
              cursor:
                "pointer",
              fontWeight:
                "bold",
            }}
          >
            Buscar
          </button>

        </div>

      </div>

      {/* 🔥 RESULTADOS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(320px,1fr))",
          gap: 20,
        }}
      >

        {resultado.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 25,
              borderRadius: 20,
            }}
          >
            No existen viviendas registradas
          </div>

        ) : (

          resultado.map((v) => (

            <div
              key={v.id}
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

              {/* 🔥 ICONO */}

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
                  fontSize: 28,
                  marginBottom: 18,
                }}
              >
                🏠
              </div>

              {/* 🔥 CODIGO */}

              <h3
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                  color:
                    "#111827",
                  fontSize: 24,
                }}
              >
                {v.codigo_vivienda}
              </h3>

              {/* 🔥 DATOS */}

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
                  🏢 {obtenerCondominio(
                    usuario.condominio_id
                  )}
                </span>

                <span>
                  💰 Alícuota:
                  {" "}
                  ${v.alicuota_mensual}
                </span>

                <span>
                  🏘 Tipo:
                  {" "}
                  {v.tipo_vivienda || "-"}
                </span>

              </div>

              {/* 🔥 BADGE */}

              <div
                style={{
                  marginTop: 16,
                  display:
                    "inline-block",
                  background:
                    v.estado ===
                    "OCUPADA"
                      ? "#dcfce7"
                      : "#fee2e2",

                  color:
                    v.estado ===
                    "OCUPADA"
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
                {v.estado}
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
                      editarVivienda(v)
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
                      eliminarVivienda(
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