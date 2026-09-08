"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Directiva = {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  identificacion: string;
  rol: string;
  cargo_directiva: string | null;
  activo: boolean;
  condominio_id: string;
  puede_votar: boolean;
};

const CARGOS = [
  "PRESIDENTE",
  "VICEPRESIDENTE",
  "SECRETARIO",
  "VOCAL",
];

export default function DirectivaPage() {
  const {
    usuario,
    loading,
  } = useAuth();

  // ==========================================
  // ESTADOS
  // ==========================================

  const [directiva, setDirectiva] =
    useState<Directiva[]>([]);

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

  const [cargo, setCargo] =
    useState("");

    const [puedeVotar, setPuedeVotar] =
  useState(false);

  const [busqueda, setBusqueda] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  // ==========================================
  // ROL
  // ==========================================

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // ==========================================
  // CARGAR DIRECTIVA
  // ==========================================

  useEffect(() => {
    if (usuario?.condominio_id) {
      cargarDirectiva();
    }
  }, [usuario]);

  const cargarDirectiva = async () => {
    if (!usuario?.condominio_id) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("usuarios")
      .select(`
        id,
        nombre,
        apellido,
        email,
        telefono,
        identificacion,
        rol,
        cargo_directiva,
        activo,
        condominio_id,
        puede_votar
      `)
      .eq(
        "condominio_id",
        usuario.condominio_id
      )
      .eq(
        "rol",
        "DIRECTIVA"
      )
      .order(
        "activo",
        {
          ascending: false,
        }
      )
      .order(
        "nombre",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "ERROR CARGANDO DIRECTIVA:",
        error
      );

      alert(
        "No fue posible cargar la Directiva."
      );

      return;
    }

    setDirectiva(
      data || []
    );
  };

  // ==========================================
  // LIMPIAR FORMULARIO
  // ==========================================

  const limpiar = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setTelefono("");
    setIdentificacion("");
    setCargo("");
    setPuedeVotar(false);
  };

  // ==========================================
  // CREAR INTEGRANTE
  // ==========================================

  const crearIntegrante = async () => {
    if (rol !== "ADMIN") {
      alert(
        "No autorizado."
      );

      return;
    }

    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !email.trim() ||
      !telefono.trim() ||
      !identificacion.trim() ||
      !cargo
    ) {
      alert(
        "Completa todos los campos."
      );

      return;
    }

    // ========================================
    // VALIDAR PRESIDENTE ÚNICO
    // ========================================

    if (
      cargo === "PRESIDENTE"
    ) {
      const presidenteActivo =
        directiva.some(
          (d) =>
            d.activo === true &&
            d.cargo_directiva ===
              "PRESIDENTE"
        );

      if (presidenteActivo) {
        alert(
          "Ya existe un Presidente activo para este condominio."
        );

        return;
      }
    }

    setGuardando(true);

    try {
      const response =
        await fetch(
          "/api/usuarios/create",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
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

                rol:
                  "DIRECTIVA",

                cargo_directiva:
                  cargo,

                condominio_id:
                  usuario.condominio_id,

                vivienda_id:
                  null,

                  puede_votar: puedeVotar,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result.error ||
            "Error creando integrante."
        );

        return;
      }

      alert(
        "Integrante de Directiva creado correctamente."
      );

      limpiar();

      await cargarDirectiva();

    } catch (error) {
      console.error(
        "ERROR CREANDO DIRECTIVA:",
        error
      );

      alert(
        "Error interno del sistema."
      );

    } finally {
      setGuardando(false);
    }
  };

  // ==========================================
  // EDITAR INTEGRANTE
  // ==========================================

  const editarIntegrante = async (
    integrante: Directiva
  ) => {
    if (rol !== "ADMIN") {
      alert(
        "No autorizado."
      );

      return;
    }

    const nuevoNombre =
      prompt(
        "Nombre",
        integrante.nombre || ""
      );

    if (
      nuevoNombre === null
    ) {
      return;
    }

    const nuevoApellido =
      prompt(
        "Apellido",
        integrante.apellido || ""
      );

    if (
      nuevoApellido === null
    ) {
      return;
    }

    const nuevoTelefono =
      prompt(
        "Teléfono",
        integrante.telefono || ""
      );

    if (
      nuevoTelefono === null
    ) {
      return;
    }

    // ========================================
    // CAMBIO DE CARGO
    // ========================================

    const nuevoCargo =
      prompt(
        `Cargo actual: ${integrante.cargo_directiva || ""}

Ingrese uno de estos cargos:
PRESIDENTE
VICEPRESIDENTE
SECRETARIO
VOCAL`,
        integrante.cargo_directiva || ""
      );

    if (
      nuevoCargo === null
    ) {
      return;
    }

    const cargoNormalizado =
      nuevoCargo
        .trim()
        .toUpperCase();

    if (
      !CARGOS.includes(
        cargoNormalizado
      )
    ) {
      alert(
        "Cargo no válido."
      );

      return;
    }

    // ========================================
// CAMBIO DE DERECHO A VOTO
// ========================================

const nuevoPuedeVotar =
  prompt(
    `Derecho a voto actual: ${
      integrante.puede_votar
        ? "SI"
        : "NO"
    }

Escribe SI o NO:`,
    integrante.puede_votar
      ? "SI"
      : "NO"
  );

if (
  nuevoPuedeVotar === null
) {
  return;
}

const votoNormalizado =
  nuevoPuedeVotar
    .trim()
    .toUpperCase();

if (
  votoNormalizado !== "SI" &&
  votoNormalizado !== "NO"
) {
  alert(
    "Debes escribir únicamente SI o NO."
  );

  return;
}

const puedeVotarEditado =
  votoNormalizado === "SI";

    // ========================================
    // VALIDAR PRESIDENTE ÚNICO
    // ========================================

    if (
      cargoNormalizado ===
        "PRESIDENTE" &&
      integrante.cargo_directiva !==
        "PRESIDENTE"
    ) {
      const otroPresidente =
        directiva.some(
          (d) =>
            d.id !== integrante.id &&
            d.activo === true &&
            d.cargo_directiva ===
              "PRESIDENTE"
        );

      if (otroPresidente) {
        alert(
          "Ya existe otro Presidente activo."
        );

        return;
      }
    }

    const {
      error,
    } = await supabase
      .from("usuarios")
      .update({
        nombre:
          nuevoNombre.trim(),

        apellido:
          nuevoApellido.trim(),

        telefono:
          nuevoTelefono.trim(),

        cargo_directiva:
          cargoNormalizado,

          puede_votar:
    puedeVotarEditado,

      })
      .eq(
        "id",
        integrante.id
      );

    if (error) {
      console.error(
        "ERROR ACTUALIZANDO DIRECTIVA:",
        error
      );

      alert(
        "No fue posible actualizar el integrante."
      );

      return;
    }

    alert(
      "Integrante actualizado correctamente."
    );

    await cargarDirectiva();
  };

  // ==========================================
  // ACTIVAR / DESACTIVAR
  // ==========================================

  const cambiarEstado = async (
    integrante: Directiva
  ) => {
    if (rol !== "ADMIN") {
      alert(
        "No autorizado."
      );

      return;
    }

    const nuevoEstado =
      !integrante.activo;

    // ========================================
    // SI SE VA A ACTIVAR UN PRESIDENTE,
    // VALIDAR QUE NO EXISTA OTRO
    // ========================================

    if (
      nuevoEstado === true &&
      integrante.cargo_directiva ===
        "PRESIDENTE"
    ) {
      const otroPresidente =
        directiva.some(
          (d) =>
            d.id !== integrante.id &&
            d.activo === true &&
            d.cargo_directiva ===
              "PRESIDENTE"
        );

      if (otroPresidente) {
        alert(
          "Ya existe otro Presidente activo."
        );

        return;
      }
    }

    const confirmar =
      confirm(
        nuevoEstado
          ? "¿Activar este integrante de Directiva?"
          : "¿Desactivar este integrante de Directiva?"
      );

    if (!confirmar) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("usuarios")
      .update({
        activo:
          nuevoEstado,
      })
      .eq(
        "id",
        integrante.id
      );

    if (error) {
      console.error(
        "ERROR CAMBIANDO ESTADO:",
        error
      );

      alert(
        "No fue posible cambiar el estado."
      );

      return;
    }

    alert(
      nuevoEstado
        ? "Integrante activado."
        : "Integrante desactivado."
    );

    await cargarDirectiva();
  };

  // ==========================================
  // FILTRO
  // ==========================================

  const directivaFiltrada =
    busqueda.trim()
      ? directiva.filter(
          (d) =>
            d.nombre
              ?.toLowerCase()
              .includes(
                busqueda
                  .toLowerCase()
              ) ||
            d.apellido
              ?.toLowerCase()
              .includes(
                busqueda
                  .toLowerCase()
              ) ||
            d.identificacion
              ?.toLowerCase()
              .includes(
                busqueda
                  .toLowerCase()
              ) ||
            d.cargo_directiva
              ?.toLowerCase()
              .includes(
                busqueda
                  .toLowerCase()
              )
        )
      : directiva;

  // ==========================================
  // VALIDACIONES
  // ==========================================

  if (loading) {
    return (
      <p
        style={{
          padding: 40,
        }}
      >
        Cargando...
      </p>
    );
  }

  if (
    !usuario?.condominio_id
  ) {
    return (
      <p
        style={{
          padding: 40,
        }}
      >
        Usuario sin urbanización.
      </p>
    );
  }

  if (rol !== "ADMIN") {
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

  // ==========================================
  // INTERFAZ
  // ==========================================

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

      {/* =====================================
          HEADER
      ===================================== */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          flexWrap:
            "wrap",
          gap: 15,
          marginBottom:
            25,
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
            🏛️ Directiva
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Gestión de integrantes
            de la Directiva del
            condominio
          </p>

        </div>

      </div>

      {/* =====================================
          FORMULARIO
      ===================================== */}

      <div
        style={{
          background:
            "#fff",
          borderRadius:
            24,
          padding: 25,
          boxShadow:
            "0 8px 20px rgba(0,0,0,0.06)",
          marginBottom:
            30,
        }}
      >

        <h2
          style={{
            marginTop: 0,
            marginBottom:
              20,
            color:
              "#111827",
          }}
        >
          Registrar integrante
        </h2>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
          }}
        >

          <Input
            placeholder="Nombre"
            value={nombre}
            onChange={(
              e: any
            ) =>
              setNombre(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Apellido"
            value={apellido}
            onChange={(
              e: any
            ) =>
              setApellido(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Correo electrónico"
            value={email}
            onChange={(
              e: any
            ) =>
              setEmail(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Teléfono"
            value={telefono}
            onChange={(
              e: any
            ) =>
              setTelefono(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Número de cédula"
            value={identificacion}
            onChange={(
              e: any
            ) =>
              setIdentificacion(
                e.target.value
              )
            }
          />

          <select
            value={cargo}
            onChange={(
              e
            ) =>
              setCargo(
                e.target.value
              )
            }
            style={{
              padding:
                "14px 16px",
              borderRadius:
                14,
              border:
                "1px solid #d1d5db",
              fontSize: 15,
              background:
                "#fff",
            }}
          >

            <option value="">
              Seleccionar cargo
            </option>

            {CARGOS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}

          </select>

</div>

{/* DERECHO A VOTO */}
<div
  style={{
    marginTop: 18,
    padding: 14,
    border: "1px solid #dbeafe",
    borderRadius: 10,
    background: "#f8fafc",
  }}
>
  <label
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: "pointer",
    }}
  >
    <input
      type="checkbox"
      checked={puedeVotar}
      onChange={(e) =>
        setPuedeVotar(e.target.checked)
      }
      style={{
        marginTop: 3,
        width: 18,
        height: 18,
        cursor: "pointer",
      }}
    />

    <span>
      <strong>Derecho a voto</strong>
      <br />
      <small style={{ color: "#64748b" }}>
        Marcar únicamente si esta persona es
        residente/propietario y tiene derecho a votar.
      </small>
    </span>
  </label>
</div>

<div
  style={{
    marginTop: 22,
  }}
>

          <button
            type="button"
            onClick={
              crearIntegrante
            }
            disabled={
              guardando
            }
            style={{
              background:
                guardando
                  ? "#9ca3af"
                  : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color:
                "#fff",
              border:
                "none",
              padding:
                "14px 22px",
              borderRadius:
                14,
              cursor:
                guardando
                  ? "not-allowed"
                  : "pointer",
              fontWeight:
                "bold",
              fontSize:
                15,
              boxShadow:
                "0 8px 18px rgba(37,99,235,0.25)",
            }}
          >
            {guardando
              ? "Creando..."
              : "+ Crear integrante"}
          </button>

        </div>

      </div>

      {/* =====================================
          BUSCADOR
      ===================================== */}

      <div
        style={{
          background:
            "#fff",
          borderRadius:
            20,
          padding: 20,
          marginBottom:
            25,
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
          Integrantes de Directiva
        </h2>

        <input
          placeholder="Buscar por nombre, apellido, cédula o cargo"
          value={busqueda}
          onChange={(
            e
          ) =>
            setBusqueda(
              e.target.value
            )
          }
          style={{
            width:
              "100%",
            maxWidth:
              600,
            padding:
              "14px 18px",
            borderRadius:
              14,
            border:
              "1px solid #d1d5db",
            fontSize:
              15,
          }}
        />

      </div>

      {/* =====================================
          LISTADO
      ===================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(320px,1fr))",
          gap: 20,
        }}
      >

        {directivaFiltrada.length ===
        0 ? (

          <div
            style={{
              background:
                "#fff",
              padding:
                25,
              borderRadius:
                20,
            }}
          >
            No existen integrantes
            de Directiva registrados.
          </div>

        ) : (

          directivaFiltrada.map(
            (d) => (

              <div
                key={d.id}
                style={{
                  background:
                    "#fff",
                  borderRadius:
                    24,
                  padding:
                    22,
                  boxShadow:
                    "0 8px 20px rgba(0,0,0,0.06)",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                {/* AVATAR */}

                <div
                  style={{
                    width:
                      70,
                    height:
                      70,
                    borderRadius:
                      "50%",
                    background:
                      "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    color:
                      "#fff",
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                    fontSize:
                      24,
                    fontWeight:
                      "bold",
                    marginBottom:
                      18,
                  }}
                >
                  {(
                    d.nombre?.[0] ||
                    ""
                  ) +
                    (
                      d.apellido?.[0] ||
                      ""
                    )}
                </div>

                {/* NOMBRE */}

                <h3
                  style={{
                    marginTop:
                      0,
                    marginBottom:
                      10,
                    color:
                      "#111827",
                    fontSize:
                      22,
                  }}
                >
                  {d.nombre}{" "}
                  {d.apellido}
                </h3>

                {/* CARGO */}

                <div
                  style={{
                    display:
                      "inline-block",
                    background:
                      d.cargo_directiva ===
                      "PRESIDENTE"
                        ? "#dbeafe"
                        : "#f3f4f6",
                    color:
                      d.cargo_directiva ===
                      "PRESIDENTE"
                        ? "#1d4ed8"
                        : "#374151",
                    padding:
                      "7px 12px",
                    borderRadius:
                      999,
                    fontSize:
                      12,
                    fontWeight:
                      "bold",
                    marginBottom:
                      16,
                  }}
                >
                  🏛️{" "}
                  {d.cargo_directiva ||
                    "SIN CARGO"}
                </div>

                {/* DATOS */}

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: 8,
                    color:
                      "#4b5563",
                    fontSize:
                      14,
                  }}
                >

                  <span>
                    📧{" "}
                    {d.email ||
                      "Sin correo"}
                  </span>

                  <span>
                    📱{" "}
                    {d.telefono ||
                      "Sin teléfono"}
                  </span>

                  <span>
                    🪪{" "}
                    {d.identificacion}
                  </span>

                </div>

                {/* ESTADO */}

                <div
                  style={{
                    marginTop:
                      16,
                    display:
                      "inline-block",
                    background:
                      d.activo
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      d.activo
                        ? "#166534"
                        : "#991b1b",
                    padding:
                      "6px 12px",
                    borderRadius:
                      999,
                    fontSize:
                      12,
                    fontWeight:
                      "bold",
                  }}
                >
                  {d.activo
                    ? "🟢 ACTIVO"
                    : "🔴 INACTIVO"}
                </div>

                <div
  style={{
    marginTop: 10,
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "bold",
    background: d.puede_votar
      ? "#dbeafe"
      : "#f3f4f6",
    color: d.puede_votar
      ? "#1d4ed8"
      : "#6b7280",
  }}
>
  {d.puede_votar
    ? "🗳️ PUEDE VOTAR"
    : "🚫 NO VOTA"}
</div>

                {/* BOTONES */}

                <div
                  style={{
                    display:
                      "flex",
                    gap: 10,
                    flexWrap:
                      "wrap",
                    marginTop:
                      22,
                  }}
                >

                  <button
                    type="button"
                    onClick={() =>
                      editarIntegrante(
                        d
                      )
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
                      borderRadius:
                        12,
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                    }}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarEstado(
                        d
                      )
                    }
                    style={{
                      background:
                        d.activo
                          ? "#dc2626"
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
                    {d.activo
                      ? "Desactivar"
                      : "Activar"}
                  </button>

                </div>

              </div>

            )
          )

        )}

      </div>

    </main>
  );
}

// ==========================================
// INPUT
// ==========================================

function Input({
  placeholder,
  value,
  onChange,
}: any) {
  return (
    <input
      placeholder={
        placeholder
      }
      value={
        value
      }
      onChange={
        onChange
      }
      style={{
        padding:
          "14px 16px",
        borderRadius:
          14,
        border:
          "1px solid #d1d5db",
        fontSize:
          15,
        width:
          "100%",
        background:
          "#fff",
      }}
    />
  );
}