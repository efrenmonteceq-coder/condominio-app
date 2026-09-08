"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function SuperAdmin() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [condominios, setCondominios] =
    useState<any[]>([]);

  const [usuarios, setUsuarios] =
    useState<any[]>([]);

  // 🔥 FORM CONDOMINIO

  const [nombre, setNombre] =
    useState("");

  const [direccion, setDireccion] =
    useState("");

  // 🔥 FORM ADMIN

  const [nombreAdmin, setNombreAdmin] =
    useState("");

  const [apellidoAdmin, setApellidoAdmin] =
    useState("");

  const [emailAdmin, setEmailAdmin] =
    useState("");

  const [telefonoAdmin, setTelefonoAdmin] =
    useState("");

  const [identificacionAdmin, setIdentificacionAdmin] =
    useState("");

  const [condominioAdmin, setCondominioAdmin] =
    useState("");

    const [rolGestion, setRolGestion] =
  useState("ADMIN");

  const [puedeVotar, setPuedeVotar] =
  useState(false);

  // 🔥 MODAL PARA ELEGIR SI EL USUARIO PUEDE VOTAR
  const [mostrarModalVoto, setMostrarModalVoto] =
    useState(false);

  const [resolverVoto, setResolverVoto] =
    useState<((valor: boolean) => void) | null>(null);

  const preguntarPuedeVotar = () => {
    return new Promise<boolean>((resolve) => {
      setResolverVoto(() => resolve);
      setMostrarModalVoto(true);
    });
  };

  const responderPuedeVotar = (valor: boolean) => {
    setMostrarModalVoto(false);

    if (resolverVoto) {
      resolverVoto(valor);
      setResolverVoto(null);
    }
  };

  const [busquedaUsuario, setBusquedaUsuario] =
  useState("");

  const [fechaActual, setFechaActual] =
  useState("");

  // 🔥 CARGAR DATOS

  const cargarDatos = async () => {

    // 🔥 CONDOMINIOS

    const {
      data: condominiosData,
      error: condominiosError,
    } = await supabase
      .from("condominios")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (condominiosError) {

      console.error(
        "ERROR CONDOMINIOS:",
        condominiosError.message
      );

    }

    // 🔥 USUARIOS

    const {
      data: usuariosData,
      error: usuariosError,
    } = await supabase
      .from("usuarios")
      .select("*");

    if (usuariosError) {

      console.error(
        "ERROR USUARIOS:",
        usuariosError.message
      );

    }

    setCondominios(
      condominiosData || []
    );

    setUsuarios(
      usuariosData || []
    );

  };

  useEffect(() => {

    if (usuario) {
      cargarDatos();
    }

    setFechaActual(
      new Intl.DateTimeFormat("es-EC", {
        dateStyle: "long",
      }).format(new Date())
    );

  }, [usuario]);

  // 🔥 CREAR CONDOMINIO

  const crearCondominio = async () => {

    if (!nombre || !direccion) {

      alert(
        "Completa todos los campos"
      );

      return;
    }

    const { error } = await supabase
      .from("condominios")
      .insert([
        {
          nombre: nombre.trim(),
          direccion: direccion.trim(),
        },
      ]);

    if (error) {

      console.error(error);

      alert(
        "Error creando urbanización"
      );

      return;
    }

    alert(
      "Urbanización creada correctamente"
    );

    setNombre("");

    setDireccion("");

    cargarDatos();

  };

  // 🔥 CREAR ADMIN

  const crearAdmin = async () => {

    if (
      !nombreAdmin ||
      !apellidoAdmin ||
      !emailAdmin ||
      !telefonoAdmin ||
      !identificacionAdmin ||
      !condominioAdmin
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
              identificacionAdmin.trim(),

            nombres:
              nombreAdmin.trim(),

            apellidos:
              apellidoAdmin.trim(),

            email:
              emailAdmin.trim(),

            rol: "ADMIN",

            condominio_id:
             condominioAdmin,

            puede_votar: puedeVotar,

          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        alert(
          result.error ||
          "Error creando administrador"
        );

        return;
      }

      alert(
  rolGestion === "DIRECTIVA"
    ? "Directiva creada correctamente"
    : "Administrador creado correctamente"
);

      setNombreAdmin("");
      setApellidoAdmin("");
      setEmailAdmin("");
      setTelefonoAdmin("");
      setIdentificacionAdmin("");
      setCondominioAdmin("");
      setPuedeVotar(false);

      cargarDatos();

    } catch (error) {

      console.error(error);

      alert(
        "Error interno del sistema"
      );

    }

  };

  // 🔥 ELIMINAR CONDOMINIO

  const eliminarCondominio = async (
    id: string
  ) => {

    const confirmar = confirm(
      "¿Eliminar urbanización?"
    );

    if (!confirmar) {
      return;
    }

    const adminsRelacionados =
      usuarios.filter(
        (u) =>
          u.condominio_id === id
      );

    if (
      adminsRelacionados.length > 0
    ) {

      alert(
        "No puedes eliminar esta urbanización porque tiene administradores asociados"
      );

      return;
    }

    const { error } = await supabase
      .from("condominios")
      .delete()
      .eq("id", id);

    if (error) {

      console.error(error);

      alert(
        "Error eliminando urbanización"
      );

      return;
    }

    alert(
      "Urbanización eliminada"
    );

    cargarDatos();

  };

  // 🔥 EDITAR CONDOMINIO

  const editarCondominio = async (
    condominio: any
  ) => {

    const nuevoNombre = prompt(
      "Nuevo nombre",
      condominio.nombre
    );

    if (!nuevoNombre) {
      return;
    }

    const nuevaDireccion = prompt(
      "Nueva dirección",
      condominio.direccion
    );

    if (!nuevaDireccion) {
      return;
    }

    const { error } = await supabase
      .from("condominios")
      .update({
        nombre: nuevoNombre,
        direccion: nuevaDireccion,
      })
      .eq("id", condominio.id);

    if (error) {

      alert(
        "Error actualizando urbanización"
      );

      return;
    }

    alert(
      "Urbanización actualizada"
    );

    cargarDatos();

  };

  // 🔥 ELIMINAR ADMIN

  const eliminarAdmin = async (
    id: string
  ) => {

    const confirmar = confirm(
      "¿Eliminar administrador?"
    );

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {

      alert(
        "Error eliminando administrador"
      );

      return;
    }

    alert(
      "Administrador eliminado"
    );

    cargarDatos();

  };

  // 🔥 EDITAR ADMIN

  // 🔥 EDITAR ADMIN

const editarAdmin = async (
  admin: any
) => {

  const nuevoNombre = prompt(
    "Nombre",
    admin.nombre || ""
  );

  if (nuevoNombre === null) {
    return;
  }

  const nuevoApellido = prompt(
    "Apellido",
    admin.apellido || ""
  );

  if (nuevoApellido === null) {
    return;
  }

  const nuevoEmail = prompt(
    "Email",
    admin.email || ""
  );

  if (nuevoEmail === null) {
    return;
  }

  const nuevoTelefono = prompt(
    "Teléfono",
    admin.telefono || ""
  );

  if (nuevoTelefono === null) {
    return;
  }

  const nuevaIdentificacion = prompt(
    "Identificación",
    admin.identificacion || ""
  );

  if (nuevaIdentificacion === null) {
    return;
  }

  const nuevoPuedeVotar =
    await preguntarPuedeVotar();

  // 🔥 MOSTRAR URBANIZACIONES

  const listaUrbanizaciones =
    condominios
      .map(
        (c, index) =>
          `${index + 1}. ${c.nombre}`
      )
      .join("\n");

  const urbanizacionActual =
    condominios.find(
      (c) =>
        c.id === admin.condominio_id
    );

  const seleccion = prompt(
    `Selecciona urbanización:\n\n${listaUrbanizaciones}\n\nUrbanización actual: ${
      urbanizacionActual?.nombre || "Sin urbanización"
    }\n\nEscribe el número`,
    ""
  );

  if (seleccion === null) {
    return;
  }

  const indice =
    parseInt(seleccion) - 1;

  const urbanizacionSeleccionada =
    condominios[indice];

  if (!urbanizacionSeleccionada) {

    alert(
      "Urbanización inválida"
    );

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

      condominio_id:
        urbanizacionSeleccionada.id,

      puede_votar:
        nuevoPuedeVotar,

    })
    .eq("id", admin.id);

  if (error) {

    console.error(error);

    alert(
      "Error actualizando administrador"
    );

    return;
  }

  alert(
    "Administrador actualizado correctamente"
  );

  cargarDatos();

};

  // 🔒 VALIDACIONES

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!usuario) {
    return <p>Sin sesión</p>;
  }

  if (
    usuario.rol !==
    "SUPER_ADMIN"
  ) {

    return (
      <main style={{ padding: 40 }}>
        <h2>
          No tienes acceso a este módulo
        </h2>
      </main>
    );

  }

  // 🔥 FILTRAR ADMINS

  const administradoresDirectiva = usuarios.filter(
    (u) => {
      const rol = u.rol?.trim()?.toUpperCase();
      const coincideRol =
        rol === "ADMIN" || rol === "DIRECTIVA";

      const texto = `
        ${u.nombre || ""}
        ${u.apellido || ""}
        ${u.email || ""}
        ${u.identificacion || ""}
      `.toLowerCase();

      return (
        coincideRol &&
        texto.includes(busquedaUsuario.toLowerCase())
      );
    }
  );

  const totalAdmins = usuarios.filter(
    (u) => u.rol?.trim()?.toUpperCase() === "ADMIN"
  ).length;

  const totalDirectiva = usuarios.filter(
    (u) => u.rol?.trim()?.toUpperCase() === "DIRECTIVA"
  ).length;

  return (
    <>
      {mostrarModalVoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 18,
              padding: 26,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 38,
                marginBottom: 10,
              }}
            >
              🗳️
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 20,
                color: "#17213d",
              }}
            >
              ¿Puede votar?
            </h3>

            <p
              style={{
                margin: "0 0 22px",
                color: "#667085",
                fontSize: 14,
              }}
            >
              Selecciona si esta persona es residente/propietario
              con derecho a voto.
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => responderPuedeVotar(true)}
                style={{
                  flex: 1,
                  border: "1px solid #b7e4c7",
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: "#e8f8ef",
                  color: "#15803d",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ✓ Sí, puede votar
              </button>

              <button
                type="button"
                onClick={() => responderPuedeVotar(false)}
                style={{
                  flex: 1,
                  border: "1px solid #dfe3ef",
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: "#f8fafc",
                  color: "#475467",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                No puede votar
              </button>
            </div>
          </div>
        </div>
      )}

      <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "28px clamp(18px, 4vw, 48px) 48px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#17213d",
      }}
    >
      <style>{`
        .sa-page * { box-sizing: border-box; }
        .sa-card {
          background: #ffffff;
          border: 1px solid #e7eaf3;
          border-radius: 18px;
          box-shadow: 0 8px 28px rgba(32, 43, 77, 0.07);
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .sa-card:hover {
          box-shadow: 0 12px 34px rgba(32, 43, 77, 0.10);
        }
        .sa-input, .sa-select {
          width: 100%;
          border: 1px solid #dce1ec;
          background: #fbfcff;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: #17213d;
          outline: none;
          transition: .2s ease;
        }
        .sa-input:focus, .sa-select:focus {
          border-color: #6941e8;
          box-shadow: 0 0 0 3px rgba(105, 65, 232, .10);
          background: #fff;
        }
        .sa-label {
          display: block;
          margin-bottom: 7px;
          font-size: 12px;
          font-weight: 700;
          color: #4a5674;
        }
        .sa-primary {
          border: 0;
          border-radius: 10px;
          padding: 12px 18px;
          color: white;
          font-weight: 800;
          cursor: pointer;
          background: linear-gradient(135deg, #7041e8, #4f46e5);
          box-shadow: 0 7px 18px rgba(91, 65, 220, .22);
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .sa-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(91, 65, 220, .28);
        }
        .sa-secondary {
          border: 1px solid #dfe3ef;
          border-radius: 10px;
          padding: 9px 12px;
          background: #fff;
          color: #30405f;
          font-weight: 700;
          cursor: pointer;
        }
        .sa-danger {
          border: 1px solid #ffd8d8;
          border-radius: 10px;
          padding: 9px 12px;
          background: #fff7f7;
          color: #dc2626;
          font-weight: 700;
          cursor: pointer;
        }
        .sa-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }
        .sa-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .sa-table-wrap { overflow-x: auto; }
        .sa-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }
        .sa-table th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .04em;
          color: #7a849e;
          padding: 12px 14px;
          border-bottom: 1px solid #edf0f6;
          white-space: nowrap;
        }
        .sa-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #f0f2f7;
          font-size: 13px;
          color: #394661;
          vertical-align: middle;
        }
        .sa-table tr:last-child td { border-bottom: 0; }
        .sa-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }
        .sa-role-admin { background: #eaf2ff; color: #2563eb; }
        .sa-role-directiva { background: #f1eaff; color: #6d28d9; }
        .sa-vote-yes { background: #e8f8ef; color: #15803d; }
        .sa-vote-no { background: #f1f3f7; color: #667085; }
        .sa-status { background: #e8f8ef; color: #15803d; }
        .sa-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          font-size: 21px;
          flex: 0 0 auto;
        }
        .sa-kpi {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
        }
        .sa-kpi-number {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 5px;
        }
        .sa-kpi-title {
          font-size: 13px;
          font-weight: 800;
          color: #1f2b47;
        }
        .sa-muted { color: #7b849b; font-size: 12px; }
        @media (max-width: 980px) {
          .sa-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .sa-form-grid { grid-template-columns: 1fr; }
          .sa-kpi { padding: 16px; }
          .sa-kpi-number { font-size: 24px; }
        }
      `}</style>

      <div className="sa-page">
        {/* HEADER */}
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            marginBottom: 26,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #6d3fe8, #4338ca)",
                  color: "#fff",
                  fontSize: 24,
                  boxShadow:
                    "0 8px 18px rgba(79,70,229,.22)",
                }}
              >
                👑
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(24px, 3vw, 34px)",
                    lineHeight: 1.1,
                    fontWeight: 900,
                    letterSpacing: "-.03em",
                  }}
                >
                  Panel de Super Administrador
                </h1>
                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#667085",
                    fontSize: 14,
                  }}
                >
                  Gestiona urbanizaciones, administradores y directivas del sistema
                </p>
              </div>
            </div>
          </div>

          <div
            className="sa-card"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "#f0ebff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              📅
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {fechaActual || "RENALIX"}
              </div>
              <div className="sa-muted">
                Administración general
              </div>
            </div>

            <button
              onClick={logout}
              className="sa-secondary"
              style={{ marginLeft: 4 }}
            >
              Cerrar sesión
            </button>
          </div>
        </section>

        {/* KPI */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {[
            {
              icon: "🏢",
              number: condominios.length,
              title: "Urbanizaciones",
              subtitle: "Total registradas",
              bg: "#efe9ff",
            },
            {
              icon: "👥",
              number: totalAdmins,
              title: "Administradores",
              subtitle: "Registrados",
              bg: "#e9f1ff",
            },
            {
              icon: "👨‍💼",
              number: totalDirectiva,
              title: "Directivas",
              subtitle: "Registradas",
              bg: "#e7f8ef",
            },
            {
              icon: "👤",
              number: usuarios.length,
              title: "Usuarios totales",
              subtitle: "En todo el sistema",
              bg: "#fff0e5",
            },
          ].map((kpi) => (
            <div key={kpi.title} className="sa-card sa-kpi">
              <div
                className="sa-icon"
                style={{ background: kpi.bg }}
              >
                {kpi.icon}
              </div>
              <div>
                <div className="sa-kpi-number">
                  {kpi.number}
                </div>
                <div className="sa-kpi-title">
                  {kpi.title}
                </div>
                <div className="sa-muted">
                  {kpi.subtitle}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* FORMS */}
        <section className="sa-grid-2" style={{ marginBottom: 22 }}>
          <div className="sa-card" style={{ padding: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                className="sa-icon"
                style={{ background: "#efe9ff" }}
              >
                🏢
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 19,
                    color: "#5b2dcc",
                  }}
                >
                  Crear Urbanización
                </h2>
                <div className="sa-muted">
                  Registra una nueva urbanización en RENALIX
                </div>
              </div>
            </div>

            <label className="sa-label">
              Nombre de la urbanización
            </label>
            <input
              className="sa-input"
              placeholder="Ej: Urbanización El Bosque"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ marginBottom: 14 }}
            />

            <label className="sa-label">
              Dirección
            </label>
            <input
              className="sa-input"
              placeholder="Ej: Av. Principal 123, Ciudad"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              style={{ marginBottom: 18 }}
            />

            <button
              onClick={crearCondominio}
              className="sa-primary"
              style={{ width: "100%" }}
            >
              🏢 &nbsp; Crear Urbanización
            </button>
          </div>

          <div className="sa-card" style={{ padding: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                className="sa-icon"
                style={{ background: "#e8f1ff" }}
              >
                👥
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 19,
                    color: "#1556d8",
                  }}
                >
                  Crear Administrador
                </h2>
                <div className="sa-muted">
                  Registra un nuevo administrador para una urbanización
                </div>
              </div>
            </div>

            <div className="sa-form-grid">
              <div>
                <label className="sa-label">Nombres</label>
                <input
                  className="sa-input"
                  placeholder="Nombres"
                  value={nombreAdmin}
                  onChange={(e) => setNombreAdmin(e.target.value)}
                />
              </div>

              <div>
                <label className="sa-label">Apellidos</label>
                <input
                  className="sa-input"
                  placeholder="Apellidos"
                  value={apellidoAdmin}
                  onChange={(e) => setApellidoAdmin(e.target.value)}
                />
              </div>

              <div>
                <label className="sa-label">Correo</label>
                <input
                  className="sa-input"
                  placeholder="correo@ejemplo.com"
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                />
              </div>

              <div>
                <label className="sa-label">Teléfono</label>
                <input
                  className="sa-input"
                  placeholder="099 123 4567"
                  value={telefonoAdmin}
                  onChange={(e) => setTelefonoAdmin(e.target.value)}
                />
              </div>

              <div>
                <label className="sa-label">Identificación</label>
                <input
                  className="sa-input"
                  placeholder="Ej: 0912345678"
                  value={identificacionAdmin}
                  onChange={(e) =>
                    setIdentificacionAdmin(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="sa-label">Rol</label>
                <select
                  className="sa-select"
                  value="ADMIN"
                  onChange={() => setRolGestion("ADMIN")}
                  disabled
                >
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="sa-label">Urbanización</label>
                <select
                  className="sa-select"
                  value={condominioAdmin}
                  onChange={(e) =>
                    setCondominioAdmin(e.target.value)
                  }
                >
                  <option value="">
                    Seleccionar urbanización
                  </option>
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                margin: "16px 0",
                borderRadius: 12,
                border: "1px solid #cdebd9",
                background: "#effaf4",
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
                  width: 19,
                  height: 19,
                  marginTop: 1,
                  accentColor: "#16a34a",
                }}
              />

              <span>
                <strong
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "#166534",
                  }}
                >
                  Es residente/propietario y puede votar
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 11,
                    color: "#4b6354",
                  }}
                >
                  Marcar únicamente si esta persona tiene derecho a voto.
                </span>
              </span>
            </label>

            <button
              onClick={crearAdmin}
              className="sa-primary"
              style={{
                width: "100%",
                background:
                  "linear-gradient(135deg, #2563eb, #1d4ed8)",
              }}
            >
              👤 &nbsp; Crear Administrador
            </button>
          </div>
        </section>

        {/* URBANIZACIONES */}
        <section className="sa-card" style={{ marginBottom: 22 }}>
          <div
            style={{
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              borderBottom: "1px solid #edf0f6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>🏢</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 17 }}>
                  Urbanizaciones Registradas
                </h2>
                <div className="sa-muted">
                  {condominios.length} registradas
                </div>
              </div>
            </div>

            <button
              className="sa-primary"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
              style={{ padding: "9px 14px" }}
            >
              ＋ Nueva
            </button>
          </div>

          <div className="sa-table-wrap">
            {condominios.length === 0 ? (
              <div
                style={{
                  padding: 28,
                  textAlign: "center",
                  color: "#7b849b",
                }}
              >
                No existen urbanizaciones registradas.
              </div>
            ) : (
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {condominios.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.nombre}</strong></td>
                      <td>{c.direccion}</td>
                      <td>
                        {c.created_at
                          ? new Intl.DateTimeFormat("es-EC").format(
                              new Date(c.created_at)
                            )
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="sa-secondary"
                            onClick={() =>
                              editarCondominio(c)
                            }
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="sa-danger"
                            onClick={() =>
                              eliminarCondominio(c.id)
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ADMINISTRADORES / DIRECTIVAS */}
        <section className="sa-card">
          <div
            style={{
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              borderBottom: "1px solid #edf0f6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>👥</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 17 }}>
                  Usuarios de gestión
                </h2>
                <div className="sa-muted">
                  {administradoresDirectiva.length} resultados
                </div>
              </div>
            </div>

            <input
              className="sa-input"
              placeholder="Buscar usuario..."
              value={busquedaUsuario}
              onChange={(e) =>
                setBusquedaUsuario(e.target.value)
              }
              style={{
                width: 240,
                maxWidth: "100%",
              }}
            />
          </div>

          <div className="sa-table-wrap">
            {administradoresDirectiva.length === 0 ? (
              <div
                style={{
                  padding: 28,
                  textAlign: "center",
                  color: "#7b849b",
                }}
              >
                No existen usuarios que coincidan con la búsqueda.
              </div>
            ) : (
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Urbanización</th>
                    <th>Votación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {administradoresDirectiva.map((a) => {
                    const rol =
                      a.rol?.trim()?.toUpperCase();

                    const urbanizacion =
                      condominios.find(
                        (c) =>
                          c.id === a.condominio_id
                      )?.nombre || "Sin urbanización";

                    return (
                      <tr key={a.id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  rol === "DIRECTIVA"
                                    ? "#efe9ff"
                                    : "#e8f1ff",
                                fontSize: 15,
                              }}
                            >
                              {rol === "DIRECTIVA" ? "👨‍💼" : "👤"}
                            </div>

                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  color: "#263451",
                                }}
                              >
                                {a.nombre} {a.apellido}
                              </strong>
                              <span className="sa-muted">
                                {a.identificacion ||
                                  "Sin identificación"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>{a.email || "—"}</td>

                        <td>
                          <span
                            className={`sa-badge ${
                              rol === "DIRECTIVA"
                                ? "sa-role-directiva"
                                : "sa-role-admin"
                            }`}
                          >
                            {rol === "DIRECTIVA"
                              ? "DIRECTIVA"
                              : "ADMIN"}
                          </span>
                        </td>

                        <td>{urbanizacion}</td>

                        <td>
                          <span
                            className={`sa-badge ${
                              a.puede_votar
                                ? "sa-vote-yes"
                                : "sa-vote-no"
                            }`}
                          >
                            {a.puede_votar
                              ? "✓ Puede votar"
                              : "— No vota"}
                          </span>
                        </td>

                        <td>
                          <span className="sa-badge sa-status">
                            ● Activo
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                            }}
                          >
                            <button
                              className="sa-secondary"
                              onClick={() =>
                                editarAdmin(a)
                              }
                            >
                              ✏️
                            </button>

                            <button
                              className="sa-danger"
                              onClick={() =>
                                eliminarAdmin(a.id)
                              }
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div
          style={{
            textAlign: "center",
            color: "#98a1b5",
            fontSize: 11,
            marginTop: 24,
          }}
        >
          RENALIX · Gestión Inteligente · Panel SUPER_ADMIN
        </div>
      </div>
    </main>
    </>
  );
}
