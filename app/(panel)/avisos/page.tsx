"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Aviso = {
  id: string;
  condominio_id: string;
  creado_por: string;
  tipo: string;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_evento: string | null;
  lugar: string | null;
  prioridad: string;
  estado: string;
  created_at: string;
  updated_at: string;
};

const TIPOS = [
  ["CONVOCATORIA_REUNION", "📅 Convocatoria a reunión"],
  ["COMUNICADO", "📢 Comunicado de la administración"],
  ["CORTE_AGUA", "💧 Corte de agua"],
  ["CORTE_ENERGIA", "⚡ Corte de energía"],
  ["MANTENIMIENTO", "🔧 Mantenimiento / trabajos"],
  ["EVENTO", "🎉 Evento de la urbanización"],
  ["URGENTE", "🚨 Aviso urgente"],
  ["OTROS", "📝 Otros"],
];

const PRIORIDADES = [
  ["NORMAL", "Normal"],
  ["IMPORTANTE", "Importante"],
  ["URGENTE", "Urgente"],
];

function fechaVisible(fecha: string | null) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("es-EC");
}

function fechaParaInput(fecha: string | null) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function AvisosPage() {
  const { usuario, loading } = useAuth();

  const rol = (usuario?.rol || "").toUpperCase().trim();
  const puedeGestionar = rol === "ADMIN";

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [avisosLeidos, setAvisosLeidos] = useState<Set<string>>(new Set());
  const [lecturasPorAviso, setLecturasPorAviso] = useState<Record<string, number>>({});
  const [totalResidentes, setTotalResidentes] = useState(0);
  const [avisoAbierto, setAvisoAbierto] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [tipo, setTipo] = useState("COMUNICADO");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [lugar, setLugar] = useState("");
  const [prioridad, setPrioridad] = useState("NORMAL");

  const [busqueda, setBusqueda] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const cargarAvisos = async () => {
    if (!usuario?.condominio_id) return;

    setCargando(true);

    let query = supabase
      .from("avisos")
      .select("*")
      .eq("condominio_id", usuario.condominio_id)
      .order("created_at", { ascending: false });

    if (rol === "RESIDENTE") {
      // El residente puede consultar también avisos publicados ya finalizados.
      // La fecha_fin deja de ocultarlos: pasan a formar parte del historial.
      const ahora = new Date().toISOString();
      query = query
        .eq("estado", "PUBLICADO")
        .lte("fecha_inicio", ahora);
    } else if (rol === "GUARDIA") {
      // El GUARDIA puede consultar el historial de avisos publicados,
      // aunque su fecha_fin ya haya pasado.
      const ahora = new Date().toISOString();
      query = query
        .eq("estado", "PUBLICADO")
        .lte("fecha_inicio", ahora);
    }

    const { data, error } = await query;

    if (error) {
      console.error("ERROR AVISOS:", error);
      alert("No se pudieron cargar los avisos.");
      setAvisos([]);
      setAvisosLeidos(new Set());
    } else {
      const avisosCargados = (data || []) as Aviso[];
      setAvisos(avisosCargados);

      if (rol === "ADMIN") {
        const { data: residentes, error: errorResidentes } = await supabase
          .from("usuarios")
          .select("id")
          .eq("condominio_id", usuario.condominio_id)
          .eq("rol", "RESIDENTE");

        if (errorResidentes) {
          console.error("ERROR CONTANDO RESIDENTES:", errorResidentes);
          setTotalResidentes(0);
        } else {
          setTotalResidentes(residentes?.length || 0);
        }

        if (avisosCargados.length > 0) {
          const idsAvisos = avisosCargados.map((aviso) => aviso.id);
          const { data: lecturas, error: errorLecturas } = await supabase
            .from("avisos_lecturas")
            .select("aviso_id, usuario_id")
            .in("aviso_id", idsAvisos);

          if (errorLecturas) {
            console.error("ERROR CONTANDO LECTURAS AVISOS:", errorLecturas);
            setLecturasPorAviso({});
          } else {
            const conteo: Record<string, number> = {};
            (lecturas || []).forEach((lectura) => {
              conteo[lectura.aviso_id] = (conteo[lectura.aviso_id] || 0) + 1;
            });
            setLecturasPorAviso(conteo);
          }
        } else {
          setLecturasPorAviso({});
        }
      } else {
        setTotalResidentes(0);
        setLecturasPorAviso({});
      }

      if (rol === "RESIDENTE" && usuario?.id && avisosCargados.length > 0) {
        const idsAvisos = avisosCargados.map((aviso) => aviso.id);

        const { data: lecturas, error: errorLecturas } = await supabase
          .from("avisos_lecturas")
          .select("aviso_id")
          .eq("usuario_id", usuario.id)
          .in("aviso_id", idsAvisos);

        if (errorLecturas) {
          console.error("ERROR LECTURAS AVISOS:", errorLecturas);
          setAvisosLeidos(new Set());
        } else {
          setAvisosLeidos(
            new Set((lecturas || []).map((lectura) => lectura.aviso_id))
          );
        }
      } else {
        setAvisosLeidos(new Set());
      }
    }

    setCargando(false);
  };

  useEffect(() => {
    if (usuario) cargarAvisos();
  }, [usuario, rol]);

  useEffect(() => {
    if (!puedeGestionar || fechaInicio) return;

    const ahora = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setFechaInicio(
      `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`
    );
  }, [puedeGestionar, fechaInicio]);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setTipo("COMUNICADO");
    setTitulo("");
    setContenido("");
    setFechaInicio("");
    setFechaFin("");
    setFechaEvento("");
    setLugar("");
    setPrioridad("NORMAL");
  };

  const editarAviso = (aviso: Aviso) => {
    if (!puedeGestionar) return;

    setEditandoId(aviso.id);
    setTipo(aviso.tipo);
    setTitulo(aviso.titulo);
    setContenido(aviso.contenido);
    setFechaInicio(fechaParaInput(aviso.fecha_inicio));
    setFechaFin(fechaParaInput(aviso.fecha_fin));
    setFechaEvento(fechaParaInput(aviso.fecha_evento));
    setLugar(aviso.lugar || "");
    setPrioridad(aviso.prioridad);

    setTimeout(() => {
      document.getElementById("formulario-aviso")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const guardarAviso = async (publicar: boolean) => {
    if (!usuario?.id || !usuario?.condominio_id || !puedeGestionar) {
      alert("No autorizado.");
      return;
    }

    if (!titulo.trim()) {
      alert("Escribe el título del aviso.");
      return;
    }

    if (!contenido.trim()) {
      alert("Escribe el contenido del aviso.");
      return;
    }

    if (!fechaInicio) {
      alert("Selecciona la fecha de inicio de publicación.");
      return;
    }

    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      alert("La fecha de finalización no puede ser anterior al inicio.");
      return;
    }

    setGuardando(true);

    const fechaInicioISO = new Date(fechaInicio).toISOString();
    const fechaFinISO = fechaFin ? new Date(fechaFin).toISOString() : null;
    const fechaEventoISO = fechaEvento ? new Date(fechaEvento).toISOString() : null;

    let error: { message: string } | null = null;

    if (editandoId) {
      const resultado = await supabase
        .from("avisos")
        .update({
          tipo,
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          fecha_inicio: fechaInicioISO,
          fecha_fin: fechaFinISO,
          fecha_evento: fechaEventoISO,
          lugar: lugar.trim() || null,
          prioridad,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editandoId)
        .eq("condominio_id", usuario.condominio_id);

      error = resultado.error;
    } else {
      const resultado = await supabase.from("avisos").insert({
        condominio_id: usuario.condominio_id,
        creado_por: usuario.id,
        tipo,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        fecha_publicacion: new Date().toISOString(),
        fecha_inicio: fechaInicioISO,
        fecha_fin: fechaFinISO,
        fecha_evento: fechaEventoISO,
        lugar: lugar.trim() || null,
        prioridad,
        estado: publicar ? "PUBLICADO" : "BORRADOR",
      });

      error = resultado.error;
    }

    setGuardando(false);

    if (error) {
      console.error("ERROR GUARDANDO AVISO:", error);
      alert(`No se pudo guardar el aviso: ${error.message}`);
      return;
    }

    if (editandoId) {
      alert("Aviso actualizado correctamente.");
    } else {
      alert(publicar ? "Aviso publicado correctamente." : "Aviso guardado como borrador.");
    }

    limpiarFormulario();
    await cargarAvisos();
  };

  const abrirAviso = async (aviso: Aviso) => {
    if (avisoAbierto === aviso.id) {
      setAvisoAbierto(null);
      return;
    }

    setAvisoAbierto(aviso.id);

    if (rol !== "RESIDENTE" || !usuario?.id || avisosLeidos.has(aviso.id)) {
      return;
    }

    const { error } = await supabase
      .from("avisos_lecturas")
      .upsert(
        {
          aviso_id: aviso.id,
          usuario_id: usuario.id,
          fecha_lectura: new Date().toISOString(),
        },
        { onConflict: "aviso_id,usuario_id" }
      );

    if (error) {
      console.error("ERROR REGISTRANDO LECTURA:", error);
      return;
    }

    setAvisosLeidos((actuales) => {
      const nuevas = new Set(actuales);
      nuevas.add(aviso.id);
      return nuevas;
    });
  };

  const retirarAviso = async (id: string) => {
    if (!puedeGestionar) return;

    const confirmar = window.confirm(
      "¿Deseas retirar este aviso? Se conservará en el historial."
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("avisos")
      .update({ estado: "RETIRADO", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("condominio_id", usuario?.condominio_id);

    if (error) {
      console.error("ERROR RETIRANDO AVISO:", error);
      alert("No se pudo retirar el aviso.");
      return;
    }

    await cargarAvisos();
  };

  const publicarBorrador = async (id: string) => {
    if (!puedeGestionar) return;

    const { error } = await supabase
      .from("avisos")
      .update({
        estado: "PUBLICADO",
        fecha_publicacion: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("condominio_id", usuario?.condominio_id);

    if (error) {
      console.error("ERROR PUBLICANDO AVISO:", error);
      alert("No se pudo publicar el aviso.");
      return;
    }

    await cargarAvisos();
  };

  const avisosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    const filtrados = avisos.filter((aviso) => {
      const coincideTexto =
        !texto ||
        `${aviso.titulo} ${aviso.contenido} ${aviso.tipo} ${aviso.lugar || ""}`
          .toLowerCase()
          .includes(texto);

      const coincidePrioridad =
        !filtroPrioridad || aviso.prioridad === filtroPrioridad;

      const coincideEstado =
        !filtroEstado || aviso.estado === filtroEstado;

      return coincideTexto && coincidePrioridad && coincideEstado;
    });

    // Con búsqueda/filtros mostramos todo el historial coincidente.
    // Sin búsqueda/filtros, mostramos solo los 2 avisos más recientes,
    // salvo que el usuario haya solicitado ver el historial completo.
    const hayFiltros = Boolean(
      busqueda.trim() || filtroPrioridad || filtroEstado
    );

    if (hayFiltros || mostrarHistorial) {
      return filtrados;
    }

    return filtrados.slice(0, 2);
  }, [avisos, busqueda, filtroPrioridad, filtroEstado, mostrarHistorial]);

  const hayFiltrosAvisos = Boolean(
    busqueda.trim() || filtroPrioridad || filtroEstado
  );

  if (loading || !usuario) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fa",
        }}
      >
        <p style={{ fontSize: 18, color: "#555" }}>Cargando...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #111827, #1f2937)",
            borderRadius: 24,
            padding: "35px 30px",
            marginBottom: 30,
            color: "#fff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: "bold" }}>
            📢 Avisos
          </h1>
          <p style={{ marginTop: 10, color: "#d1d5db", fontSize: 16 }}>
            Comunicaciones importantes de la urbanización.
          </p>
        </div>

        {puedeGestionar && (
          <div
            id="formulario-aviso"
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 30,
              marginBottom: 30,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 25, fontSize: 24 }}>
              {editandoId ? "Editar aviso" : "Crear nuevo aviso"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <Field label="Tipo de aviso">
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
                  {TIPOS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Prioridad">
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} style={inputStyle}>
                  {PRIORIDADES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Título">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej.: Convocatoria a Asamblea General"
                style={inputStyle}
              />
            </Field>

            <Field label="Contenido">
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribe aquí el comunicado completo..."
                style={{ ...inputStyle, minHeight: 150, resize: "vertical" }}
              />
            </Field>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <Field label="Inicio de publicación">
                <input
                  type="datetime-local"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Fin de publicación (opcional)">
                <input
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Fecha y hora del evento (opcional)">
                <input
                  type="datetime-local"
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Lugar (opcional)">
                <input
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  placeholder="Ej.: Salón comunal"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button
                disabled={guardando}
                onClick={() => guardarAviso(editandoId ? false : true)}
                style={buttonPrimary}
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "💾 Guardar cambios"
                  : "📢 Publicar aviso"}
              </button>

              {!editandoId && (
                <button
                  disabled={guardando}
                  onClick={() => guardarAviso(false)}
                  style={buttonSecondary}
                >
                  💾 Guardar borrador
                </button>
              )}

              {editandoId && (
                <button
                  disabled={guardando}
                  onClick={limpiarFormulario}
                  style={buttonSecondary}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 25,
            marginBottom: 30,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>Buscar avisos</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 15,
            }}
          >
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                if (e.target.value.trim()) setMostrarHistorial(true);
              }}
              placeholder="Buscar por título, contenido, tipo o lugar..."
              style={inputStyle}
            />

            {puedeGestionar && (
              <>
                <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} style={inputStyle}>
                  <option value="">Todas las prioridades</option>
                  {PRIORIDADES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={inputStyle}>
                  <option value="">Todos los estados</option>
                  <option value="BORRADOR">BORRADOR</option>
                  <option value="PUBLICADO">PUBLICADO</option>
                  <option value="RETIRADO">RETIRADO</option>
                </select>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 15,
              marginBottom: 25,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24 }}>
              {puedeGestionar ? "Listado de avisos" : "Avisos de la urbanización"}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {!hayFiltrosAvisos && (
                <button
                  type="button"
                  onClick={() => setMostrarHistorial((actual) => !actual)}
                  style={{
                    ...buttonSecondarySmall,
                    whiteSpace: "nowrap",
                  }}
                >
                  {mostrarHistorial
                    ? "⬆️ Ver solo los 2 últimos"
                    : "📂 Ver historial completo"}
                </button>
              )}

              <div
                style={{
                  background: "#111827",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: 14,
                  fontWeight: "bold",
                }}
              >
                Resultados: {avisosFiltrados.length}
              </div>
            </div>
          </div>

          {cargando ? (
            <div style={emptyStyle}>Cargando avisos...</div>
          ) : avisosFiltrados.length === 0 ? (
            <div style={emptyStyle}>
              {hayFiltrosAvisos
                ? "No existen avisos que coincidan con la búsqueda o los filtros."
                : "No existen avisos para mostrar."}
            </div>
          ) : (
            avisosFiltrados.map((aviso) => {
              const abierto = avisoAbierto === aviso.id;
              const leido = avisosLeidos.has(aviso.id);

              return (
                <div
                  key={aviso.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 20,
                    padding: 24,
                    marginBottom: 18,
                    background: "#fafafa",
                    borderLeft:
                      aviso.prioridad === "URGENTE"
                        ? "6px solid #dc2626"
                        : aviso.prioridad === "IMPORTANTE"
                        ? "6px solid #f59e0b"
                        : "6px solid #2563eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 15,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
                        {TIPOS.find(([value]) => value === aviso.tipo)?.[1] || aviso.tipo}
                      </div>

                      <h3 style={{ margin: 0, color: "#111827", fontSize: 22 }}>
                        {aviso.titulo}
                      </h3>
                    </div>

                    <div
                      style={{
                        background:
                          aviso.prioridad === "URGENTE"
                            ? "#dc2626"
                            : aviso.prioridad === "IMPORTANTE"
                            ? "#f59e0b"
                            : "#2563eb",
                        color: "#fff",
                        padding: "9px 14px",
                        borderRadius: 999,
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {aviso.prioridad}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      marginTop: 18,
                    }}
                  >
                    <div style={{ color: leido ? "#15803d" : "#b45309", fontWeight: "bold", fontSize: 13 }}>
                      {rol === "ADMIN"
                        ? `👁️ ${lecturasPorAviso[aviso.id] || 0} de ${totalResidentes} residente${totalResidentes === 1 ? "" : "s"} han leído`
                        : leido
                        ? "✓ Leído"
                        : "• Pendiente de lectura"}
                    </div>

                    <button
                      onClick={() => abrirAviso(aviso)}
                      style={leidoButtonStyle}
                    >
                      {abierto ? "Ocultar aviso" : "Leer aviso"}
                    </button>
                  </div>

                  {abierto && (
                    <>
                      <p
                        style={{
                          marginTop: 18,
                          marginBottom: 0,
                          lineHeight: 1.7,
                          color: "#374151",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {aviso.contenido}
                      </p>

                      {(aviso.fecha_evento || aviso.lugar) && (
                        <div
                          style={{
                            marginTop: 18,
                            padding: 16,
                            background: "#eff6ff",
                            borderRadius: 14,
                            color: "#1e3a8a",
                            lineHeight: 1.7,
                          }}
                        >
                          {aviso.fecha_evento && (
                            <div><b>📅 Evento:</b> {fechaVisible(aviso.fecha_evento)}</div>
                          )}
                          {aviso.lugar && (
                            <div><b>📍 Lugar:</b> {aviso.lugar}</div>
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 20,
                          paddingTop: 18,
                          borderTop: "1px solid #e5e7eb",
                          color: "#6b7280",
                          fontSize: 13,
                          lineHeight: 1.7,
                        }}
                      >
                        <div><b>Inicio:</b> {fechaVisible(aviso.fecha_inicio)}</div>
                        <div><b>Fin:</b> {fechaVisible(aviso.fecha_fin)}</div>
                        {aviso.fecha_fin && new Date(aviso.fecha_fin) < new Date() && (
                          <div style={{ color: "#6b7280", fontWeight: "bold" }}>
                            ⚪ Aviso finalizado — permanece disponible en el historial.
                          </div>
                        )}
                        {puedeGestionar && (
                          <div><b>Estado:</b> {aviso.estado}</div>
                        )}
                      </div>
                    </>
                  )}

                  {puedeGestionar && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                      <button
                        onClick={() => editarAviso(aviso)}
                        style={buttonSecondarySmall}
                      >
                        ✏️ Editar
                      </button>

                      {aviso.estado === "BORRADOR" && (
                        <button
                          onClick={() => publicarBorrador(aviso.id)}
                          style={buttonPrimarySmall}
                        >
                          📢 Publicar
                        </button>
                      )}

                      {aviso.estado === "PUBLICADO" && (
                        <button
                          onClick={() => retirarAviso(aviso.id)}
                          style={buttonDangerSmall}
                        >
                          Retirar aviso
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          marginBottom: 8,
          fontWeight: "bold",
          color: "#374151",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #d1d5db",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const buttonPrimary: CSSProperties = {
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "15px 24px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 15,
};

const buttonSecondary: CSSProperties = {
  background: "#f3f4f6",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 16,
  padding: "15px 24px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 15,
};

const buttonPrimarySmall: CSSProperties = {
  ...buttonPrimary,
  padding: "11px 18px",
  borderRadius: 13,
  fontSize: 14,
};

const buttonSecondarySmall: CSSProperties = {
  ...buttonSecondary,
  padding: "11px 18px",
  borderRadius: 13,
  fontSize: 14,
};

const buttonDangerSmall: CSSProperties = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 13,
  padding: "11px 18px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 14,
};

const leidoButtonStyle: CSSProperties = {
  background: "#fff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 14,
};

const emptyStyle: CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#6b7280",
  border: "2px dashed #d1d5db",
  borderRadius: 20,
};
