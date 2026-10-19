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

  const [tipoResidente, setTipoResidente] =
    useState("PROPIETARIO");

  const [pagaAlicuota, setPagaAlicuota] =
    useState(false);

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
      data: usuariosData,
      error: usuariosError,
    } = await supabase
      .from("usuarios")
      .select("*")
      .eq("condominio_id", usuario.condominio_id)
      .eq("rol", "RESIDENTE");

    if (usuariosError) {
      console.error("ERROR RESIDENTES:", usuariosError.message);
      return;
    }

    // Mostramos primero los usuarios residentes. Así, un problema de permisos
    // o de datos en la tabla auxiliar "residentes" no oculta toda la lista.
    const residentesBase = (usuariosData || []).map((item: any) => ({
      ...item,
      ficha_residente: null,
      tipo_residente: "NO CONFIGURADO",
      paga_alicuota: false,
      vivienda_id: item.vivienda_id || null,
      estado_residente: "SIN FICHA",
    }));
    setResidentes(residentesBase);

    const { data: fichasData, error: fichasError } = await supabase
      .from("residentes")
      .select("id, usuario_id, vivienda_id, tipo, estado, paga_alicuota, condominio_id")
      .eq("condominio_id", String(usuario.condominio_id));

    if (fichasError) {
      // La lista de usuarios ya está visible; solo registramos el fallo de los
      // datos complementarios para no dejar la pantalla falsamente vacía.
      console.error("ERROR FICHAS DE RESIDENTES:", fichasError.message);
      return;
    }

    const fichasPorUsuario = new Map<string, any>();
    (fichasData || []).forEach((ficha: any) => {
      if (ficha.usuario_id) fichasPorUsuario.set(ficha.usuario_id, ficha);
    });

    const usuariosConFicha = (usuariosData || []).map((item: any) => ({
      ...item,
      ficha_residente: fichasPorUsuario.get(item.id) || null,
      tipo_residente: fichasPorUsuario.get(item.id)?.tipo || "NO CONFIGURADO",
      paga_alicuota: fichasPorUsuario.get(item.id)?.paga_alicuota === true,
      vivienda_id: fichasPorUsuario.get(item.id)?.vivienda_id || item.vivienda_id || null,
      estado_residente: fichasPorUsuario.get(item.id)?.estado || "SIN FICHA",
    }));

    setResidentes(usuariosConFicha);

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
  "Content-Type": "application/json",
  Authorization: `Bearer ${
    (await supabase.auth.getSession()).data.session?.access_token ?? ""
  }`,
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

  tipo_residente: tipoResidente,

  paga_alicuota: pagaAlicuota,

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

  // 🔥 EDITAR RESIDENTE MEDIANTE API SEGURA

  const editarResidente = async (
    residente: any
  ) => {

    const nuevoNombre = prompt(
      "Nombre",
      residente.nombre || ""
    );

    if (nuevoNombre === null) return;

    const nuevoApellido = prompt(
      "Apellido",
      residente.apellido || ""
    );

    if (nuevoApellido === null) return;

    const nuevoEmail = prompt(
      "Email",
      residente.email || ""
    );

    if (nuevoEmail === null) return;

    const nuevoTelefono = prompt(
      "Teléfono",
      residente.telefono || ""
    );

    if (nuevoTelefono === null) return;

    const nuevaIdentificacion = prompt(
      "Identificación",
      residente.identificacion || ""
    );

    if (nuevaIdentificacion === null) return;

    const tipoActual = String(residente.tipo_residente || "PROPIETARIO").toUpperCase();
    const nuevoTipo = prompt(
      "Tipo de ocupante: PROPIETARIO, INQUILINO, FAMILIAR u OTRO_OCUPANTE",
      tipoActual
    );
    if (nuevoTipo === null) return;
    const tipoNormalizado = nuevoTipo.trim().toUpperCase();
    if (!["PROPIETARIO", "INQUILINO", "FAMILIAR", "OTRO_OCUPANTE"].includes(tipoNormalizado)) {
      alert("Tipo inválido. Usa PROPIETARIO, INQUILINO, FAMILIAR u OTRO_OCUPANTE.");
      return;
    }

    const pagaRespuesta = prompt(
      "¿Paga alícuota? Escribe SI o NO",
      residente.paga_alicuota ? "SI" : "NO"
    );
    if (pagaRespuesta === null) return;
    const pagaNormalizado = pagaRespuesta.trim().toUpperCase();
    if (!["SI", "SÍ", "NO"].includes(pagaNormalizado)) {
      alert("Respuesta inválida. Escribe SI o NO.");
      return;
    }

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        return;
      }

      const response = await fetch("/api/usuarios/residente/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          residente_id: residente.id,
          nombre: nuevoNombre.trim(),
          apellido: nuevoApellido.trim(),
          email: nuevoEmail.trim(),
          telefono: nuevoTelefono.trim(),
          identificacion: nuevaIdentificacion.trim(),
          tipo_residente: tipoNormalizado,
          paga_alicuota: ["SI", "SÍ"].includes(pagaNormalizado),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Error actualizando residente.");
        return;
      }

      await cargarResidentes();
      alert("Residente actualizado correctamente.");
    } catch (error) {
      console.error("Error actualizando residente:", error);
      alert("No se pudo actualizar el residente. Revisa la conexión e inténtalo nuevamente.");
    }
  };

  // 🔥 ELIMINAR RESIDENTE MEDIANTE API SEGURA

  const eliminarResidente = async (
    id: string
  ) => {
    const confirmar = confirm("¿Eliminar residente?");

    if (!confirmar) return;

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        return;
      }

      const response = await fetch("/api/usuarios/residente/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ residente_id: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "No se pudo eliminar el residente.");
        return;
      }

      await cargarResidentes();
      await cargarViviendas();
      alert("Residente eliminado correctamente.");
    } catch (error) {
      console.error("Error eliminando residente:", error);
      alert("No se pudo eliminar el residente. Revisa la conexión e inténtalo nuevamente.");
    }
  };

  // 🔥 LIMPIAR

  const limpiar = () => {

    setNombre("");

    setApellido("");

    setEmail("");

    setTelefono("");

    setIdentificacion("");

    setViviendaId("");
    setTipoResidente("PROPIETARIO");
    setPagaAlicuota(false);

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

            <select
              value={tipoResidente}
              onChange={(e) => setTipoResidente(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #d1d5db",
                fontSize: 15,
                background: "#fff",
              }}
            >
              <option value="PROPIETARIO">Propietario</option>
              <option value="INQUILINO">Inquilino</option>
              <option value="FAMILIAR">Familiar</option>
              <option value="OTRO_OCUPANTE">Otro ocupante</option>
            </select>

            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#374151", fontSize: 15 }}>
              <input
                type="checkbox"
                checked={pagaAlicuota}
                onChange={(e) => setPagaAlicuota(e.target.checked)}
              />
              Paga alícuota (se aplicará también al acceso en el siguiente paso)
            </label>

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
                <span>
                  🏠 Vivienda: {viviendas.find((v) => v.id === r.vivienda_id)?.codigo_vivienda || "Sin vivienda vinculada"}
                </span>
                
<span>
  👤 Tipo: {{
    PROPIETARIO: "Propietario",
    INQUILINO: "Inquilino",
    FAMILIAR: "Familiar",
    OTRO_OCUPANTE: "Otro ocupante",
  }[
    String(r.tipo_residente ?? "").toUpperCase().trim() as
      | "PROPIETARIO"
      | "INQUILINO"
      | "FAMILIAR"
      | "OTRO_OCUPANTE"
  ] || r.tipo_residente || "No configurado"}
</span>

                <span style={{ color: r.paga_alicuota ? "#166534" : "#b91c1c", fontWeight: 600 }}>
                  {r.paga_alicuota ? "✓ Habilitado para pagar alícuota" : "✕ No habilitado para pagar alícuota"}
                </span>

              </div>

              {/* 🔥 BADGE */}

              <div
                style={{
                  marginTop: 16,
                  display: "inline-block",
                  background:
                    r.activo ? "#dcfce7" : "#fee2e2",
                  color:
                    r.activo ? "#166534" : "#991b1b",
                  padding:
                    "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight:
                    "bold",
                }}
              >
                {r.activo ? "RESIDENTE ACTIVO" : "RESIDENTE INACTIVO"}
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