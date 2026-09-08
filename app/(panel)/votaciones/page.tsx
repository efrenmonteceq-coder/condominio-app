"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Usuario = {
  id: string;
  nombre?: string | null;
  apellido?: string | null;
  email?: string | null;
  identificacion?: string | null;
  rol?: string | null;
  cargo_directiva?: string | null;
  condominio_id?: string | null;
  puede_votar?: boolean | null;
};

type Sesion = {
  id: string;
  titulo: string;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: string;
};

type Votacion = {
  id: string;
  sesion_id: string;
  pregunta: string;
  descripcion: string | null;
  estado: string;
  fecha_apertura: string | null;
  fecha_cierre: string | null;
};

type Voto = {
  votacion_id: string;
  opcion: string;
};

const OPCIONES = [
  {
    valor: "A FAVOR",
    emoji: "🟢",
    texto: "A favor",
  },
  {
    valor: "EN CONTRA",
    emoji: "🔴",
    texto: "En contra",
  },
  {
    valor: "ABSTENCIÓN",
    emoji: "🟡",
    texto: "Abstención",
  },
];

export default function VotacionesPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [misVotos, setMisVotos] = useState<Voto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    setMensaje("");

    try {
      // RENALIX identifica al usuario mediante el objeto
      // guardado en localStorage durante el login.
      const usuarioGuardado =
        typeof window !== "undefined"
          ? localStorage.getItem("usuario")
          : null;

      if (!usuarioGuardado) {
        setError("No se encontró la sesión del usuario.");
        setCargando(false);
        return;
      }

      let usuarioActual: Usuario;

      try {
        usuarioActual = JSON.parse(usuarioGuardado);
      } catch (errorJSON) {
        console.error(
          "Error leyendo usuario guardado:",
          errorJSON
        );
        setError("La información del usuario no es válida.");
        setCargando(false);
        return;
      }

      if (!usuarioActual?.id) {
        setError("No se pudo identificar al usuario actual.");
        setCargando(false);
        return;
      }

      // La información guardada en localStorage solo sirve para identificar
      // al usuario. Los permisos de votación se consultan nuevamente en BD.
      const {
        data: usuarioDB,
        error: errorUsuario,
      } = await supabase
        .from("usuarios")
        .select(
          "id, nombre, apellido, email, identificacion, rol, cargo_directiva, condominio_id, puede_votar"
        )
        .eq("id", usuarioActual.id)
        .maybeSingle();

      if (errorUsuario) {
        console.error("Error cargando usuario:", errorUsuario);
        setError("No se pudo verificar la información del usuario.");
        setCargando(false);
        return;
      }

      if (!usuarioDB) {
        setError("No se encontró el usuario en RENALIX.");
        setCargando(false);
        return;
      }

      const rolActual = usuarioDB.rol?.trim().toUpperCase();
      const puedeVotar =
        rolActual === "RESIDENTE" ||
        ((rolActual === "ADMIN" || rolActual === "DIRECTIVA") &&
          usuarioDB.puede_votar === true);

      if (!puedeVotar) {
        setUsuario(usuarioDB);
        setError(
          "Usted no está habilitado para votar. Debe ser residente o estar autorizado para votar como ADMIN/DIRECTIVA."
        );
        setCargando(false);
        return;
      }

      setUsuario(usuarioDB);

      console.log(
        "USUARIO VOTACIONES VERIFICADO:",
        usuarioDB
      );

      // Buscar las asistencias del usuario.
      const {
        data: asistencias,
        error: errorAsistencias,
      } = await supabase
        .from("asistencias")
        .select("sesion_id")
        .eq("usuario_id", usuarioActual.id);

      if (errorAsistencias) {
        console.error(
          "Error cargando asistencias:",
          errorAsistencias
        );
        setError("No se pudieron cargar las asistencias.");
        setCargando(false);
        return;
      }

      const sesionesConAsistencia =
        (asistencias || []).map(
          (asistencia) => asistencia.sesion_id
        );

      if (sesionesConAsistencia.length === 0) {
        setSesiones([]);
        setVotaciones([]);
        setMisVotos([]);
        setCargando(false);
        return;
      }

      // Solo sesiones ABIERTAS donde el usuario tiene asistencia.
      const {
        data: sesionesData,
        error: errorSesiones,
      } = await supabase
        .from("sesiones")
        .select(
          "id, titulo, fecha, hora_inicio, hora_fin, estado"
        )
        .in("id", sesionesConAsistencia)
        .eq("estado", "ABIERTA")
        .order("fecha", {
          ascending: false,
        });

      if (errorSesiones) {
        console.error(
          "Error cargando sesiones:",
          errorSesiones
        );
        setError(
          "No se pudieron cargar las sesiones abiertas."
        );
        setCargando(false);
        return;
      }

      const sesionesValidas = sesionesData || [];
      setSesiones(sesionesValidas);

      if (sesionesValidas.length === 0) {
        setVotaciones([]);
        setMisVotos([]);
        setCargando(false);
        return;
      }

      const idsSesiones = sesionesValidas.map(
        (sesion) => sesion.id
      );

      // Solo votaciones ABIERTAS de esas sesiones.
      const {
        data: votacionesData,
        error: errorVotaciones,
      } = await supabase
        .from("votaciones")
        .select(
          "id, sesion_id, pregunta, descripcion, estado, fecha_apertura, fecha_cierre"
        )
        .in("sesion_id", idsSesiones)
        .eq("estado", "ABIERTA")
        .order("fecha_apertura", {
          ascending: false,
        });

      if (errorVotaciones) {
        console.error(
          "Error cargando votaciones:",
          errorVotaciones
        );
        setError("No se pudieron cargar las votaciones.");
        setCargando(false);
        return;
      }

      const votacionesValidas = votacionesData || [];
      setVotaciones(votacionesValidas);

      if (votacionesValidas.length === 0) {
        setMisVotos([]);
        setCargando(false);
        return;
      }

      const idsVotaciones = votacionesValidas.map(
        (votacion) => votacion.id
      );

      // Cargar los votos que ya realizó este usuario.
      const {
        data: votosData,
        error: errorVotos,
      } = await supabase
        .from("votos")
        .select("votacion_id, opcion")
        .eq("usuario_id", usuarioActual.id)
        .in("votacion_id", idsVotaciones);

      if (errorVotos) {
        console.error(
          "Error cargando votos:",
          errorVotos
        );
        setError("No se pudieron cargar sus votos.");
        setCargando(false);
        return;
      }

      setMisVotos(votosData || []);
      setCargando(false);
    } catch (error) {
      console.error(
        "Error cargando votaciones:",
        error
      );
      setError("No fue posible cargar las votaciones.");
      setCargando(false);
    }
  };

  const yaVoto = (votacionId: string) => {
    return misVotos.find(
      (voto) =>
        voto.votacion_id === votacionId
    );
  };

  const obtenerSesion = (sesionId: string) => {
    return sesiones.find(
      (sesion) => sesion.id === sesionId
    );
  };

  const registrarVoto = async (
    votacion: Votacion,
    opcion: string
  ) => {
    if (!usuario?.id) {
      setError(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    if (yaVoto(votacion.id)) {
      setError(
        "Usted ya ha votado en esta votación."
      );
      return;
    }

    setProcesando(votacion.id);
    setError("");
    setMensaje("");

    // Verificación de seguridad: consultar nuevamente el usuario en BD.
    const {
      data: usuarioDB,
      error: errorUsuario,
    } = await supabase
      .from("usuarios")
      .select("id, rol, puede_votar")
      .eq("id", usuario.id)
      .maybeSingle();

    if (errorUsuario || !usuarioDB) {
      console.error("Error verificando usuario:", errorUsuario);
      setError("No fue posible verificar los permisos del usuario.");
      setProcesando(null);
      return;
    }

    const rolActual = usuarioDB.rol?.trim().toUpperCase();
    const puedeVotar =
      rolActual === "RESIDENTE" ||
      ((rolActual === "ADMIN" || rolActual === "DIRECTIVA") &&
        usuarioDB.puede_votar === true);

    if (!puedeVotar) {
      setError("Usted no está habilitado para votar.");
      setProcesando(null);
      return;
    }

    // La votación y la sesión deben seguir ABIERTAS al momento de registrar.
    const {
      data: sesionActual,
      error: errorSesion,
    } = await supabase
      .from("sesiones")
      .select("id, estado")
      .eq("id", votacion.sesion_id)
      .maybeSingle();

    if (errorSesion || !sesionActual || sesionActual.estado !== "ABIERTA") {
      setError("La sesión ya no está abierta para votar.");
      setProcesando(null);
      return;
    }

    const {
      data: votacionActual,
      error: errorVotacion,
    } = await supabase
      .from("votaciones")
      .select("id, estado")
      .eq("id", votacion.id)
      .maybeSingle();

    if (errorVotacion || !votacionActual || votacionActual.estado !== "ABIERTA") {
      setError("Esta votación ya no está abierta.");
      setProcesando(null);
      return;
    }

    // El usuario debe tener asistencia en ESTA sesión.
    const {
      data: asistencia,
      error: errorAsistencia,
    } = await supabase
      .from("asistencias")
      .select("id")
      .eq("sesion_id", votacion.sesion_id)
      .eq("usuario_id", usuario.id)
      .maybeSingle();

    if (errorAsistencia) {
      console.error(
        "Error verificando asistencia:",
        errorAsistencia
      );
      setError(
        "No fue posible verificar su asistencia."
      );
      setProcesando(null);
      return;
    }

    if (!asistencia) {
      setError(
        "No puede votar porque no tiene asistencia registrada en esta sesión."
      );
      setProcesando(null);
      return;
    }

    const {
      error: errorVoto,
    } = await supabase
      .from("votos")
      .insert({
        votacion_id: votacion.id,
        usuario_id: usuario.id,
        opcion,
      });

    if (errorVoto) {
      console.error(
        "Error guardando voto:",
        errorVoto
      );

      if (errorVoto.code === "23505") {
        setError(
          "Usted ya ha votado en esta votación."
        );
      } else {
        setError(
          errorVoto.message ||
            "No fue posible registrar su voto."
        );
      }

      setProcesando(null);
      return;
    }

    setMisVotos((actuales) => [
      ...actuales,
      {
        votacion_id: votacion.id,
        opcion,
      },
    ]);

    setMensaje(
      "Su voto fue registrado correctamente."
    );

    setProcesando(null);
  };

  if (cargando) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Cargando votaciones...
      </div>
    );
  }

  if (
    error &&
    sesiones.length === 0 &&
    votaciones.length === 0
  ) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#111827",
          }}
        >
          🗳️ Votaciones
        </h2>

        <p
          style={{
            color: "#dc2626",
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px 35px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg,#1e3a8a,#2563eb)",
          borderRadius: 28,
          padding: "32px 38px",
          marginBottom: 25,
          color: "#fff",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            opacity: 0.8,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          RENALIX · GOBERNANZA
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 32,
          }}
        >
          🗳️ Votaciones
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            color: "#dbeafe",
          }}
        >
          Participación en las decisiones de la
          Directiva
        </p>
      </div>

      {mensaje && (
        <div
          style={{
            marginBottom: 18,
            padding: "14px 18px",
            borderRadius: 12,
            background: "#ecfdf5",
            border:
              "1px solid #a7f3d0",
            color: "#065f46",
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 18,
            padding: "14px 18px",
            borderRadius: 12,
            background: "#fef2f2",
            border:
              "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {votaciones.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: 30,
            border:
              "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              marginBottom: 12,
            }}
          >
            🗳️
          </div>

          <h2
            style={{
              marginTop: 0,
              color: "#111827",
            }}
          >
            No hay votaciones disponibles
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginBottom: 0,
            }}
          >
            Actualmente no existen votaciones abiertas
            en sesiones donde usted tenga asistencia
            registrada.
          </p>
        </div>
      ) : (
        <div>
          {votaciones.map(
            (votacion, index) => {
              const sesion =
                obtenerSesion(
                  votacion.sesion_id
                );

              const voto =
                yaVoto(votacion.id);

              const estaProcesando =
                procesando ===
                votacion.id;

              return (
                <div
                  key={votacion.id}
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    padding: 25,
                    marginBottom: 18,
                    border:
                      "1px solid #e5e7eb",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      color: "#2563eb",
                      fontSize: 13,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    VOTACIÓN #{index + 1}
                  </div>

                  {sesion && (
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      📅 {sesion.titulo}
                    </div>
                  )}

                  <h2
                    style={{
                      marginTop: 0,
                      marginBottom: 10,
                      color: "#111827",
                      fontSize: 21,
                    }}
                  >
                    {votacion.pregunta}
                  </h2>

                  {votacion.descripcion && (
                    <p
                      style={{
                        color: "#6b7280",
                        lineHeight: 1.5,
                        marginTop: 0,
                      }}
                    >
                      {votacion.descripcion}
                    </p>
                  )}

                  {voto ? (
                    <div
                      style={{
                        marginTop: 20,
                        padding: 18,
                        borderRadius: 14,
                        background: "#eff6ff",
                        border:
                          "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#1e40af",
                          marginBottom: 6,
                        }}
                      >
                        ✅ Voto registrado
                      </div>

                      <div
                        style={{
                          color: "#374151",
                        }}
                      >
                        Su elección:{" "}
                        <strong>
                          {voto.opcion}
                        </strong>
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          color: "#6b7280",
                          fontSize: 13,
                        }}
                      >
                        No puede votar nuevamente
                        en esta votación.
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 22,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#374151",
                          marginBottom: 12,
                        }}
                      >
                        Seleccione su voto:
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        {OPCIONES.map(
                          (opcion) => (
                            <button
                              key={
                                opcion.valor
                              }
                              type="button"
                              onClick={() =>
                                registrarVoto(
                                  votacion,
                                  opcion.valor
                                )
                              }
                              disabled={
                                estaProcesando
                              }
                              style={{
                                flex:
                                  "1 1 180px",
                                minWidth: 160,
                                padding:
                                  "14px 18px",
                                border:
                                  "1px solid #d1d5db",
                                borderRadius: 12,
                                background:
                                  estaProcesando
                                    ? "#f3f4f6"
                                    : "#fff",
                                color:
                                  "#111827",
                                fontWeight:
                                  "bold",
                                cursor:
                                  estaProcesando
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  estaProcesando
                                    ? 0.7
                                    : 1,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 20,
                                  marginRight: 8,
                                }}
                              >
                                {
                                  opcion.emoji
                                }
                              </span>

                              {estaProcesando
                                ? "Registrando..."
                                : opcion.texto}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
