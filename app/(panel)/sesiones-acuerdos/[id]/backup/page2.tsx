"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";

type Sesion = {
  id: string;
  condominio_id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  lugar: string;
  estado: string;
  creado_por: string | null;
  qr_activo: boolean;
  qr_activo_desde: string | null;
  qr_activo_hasta: string | null;
  created_at: string;
  asistencia_abierta_por?: string | null;
  asistencia_abierta_at?: string | null;
  asistencia_cerrada_por?: string | null;
  asistencia_cerrada_at?: string | null;
};

type PuntoSesion = {
  id: string;
  sesion_id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  orden: number;
  resultado: string | null;
  creado_por: string | null;
  created_at: string;
};

export default function DetalleSesionPage() {
  const router = useRouter();
  const params = useParams();

  const { usuario, loading } = useAuth();

  const [sesion, setSesion] =
    useState<Sesion | null>(null);

    type Condominio = {
  id: string;
  nombre: string;
  direccion: string | null;
};

const [condominio, setCondominio] =
  useState<Condominio | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [procesando, setProcesando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

    const [qrVisible, setQrVisible] =
  useState(false);

const [activandoQR, setActivandoQR] =
  useState(false);

  const [totalAsistencias, setTotalAsistencias] = useState(0);

  const [puntos, setPuntos] = useState<PuntoSesion[]>([]);
const [cargandoPuntos, setCargandoPuntos] = useState(false);
const [mostrarFormularioPunto, setMostrarFormularioPunto] = useState(false);

const [editandoPuntoId, setEditandoPuntoId] = useState<string | null>(null);

const [tituloPunto, setTituloPunto] = useState("");
const [descripcionPunto, setDescripcionPunto] = useState("");
const [estadoPunto, setEstadoPunto] = useState("PENDIENTE");
const [ordenPunto, setOrdenPunto] = useState(1);
const [resultadoPunto, setResultadoPunto] = useState("");

const [procesandoPunto, setProcesandoPunto] = useState(false);

type AcuerdoSesion = {
  id: string;
  sesion_id: string;
  titulo: string;
  descripcion: string | null;
  resultado: string | null;
  creado_por: string | null;
  created_at: string;
};

const [acuerdos, setAcuerdos] = useState<AcuerdoSesion[]>([]);
const [cargandoAcuerdos, setCargandoAcuerdos] = useState(false);

const [mostrarFormularioAcuerdo, setMostrarFormularioAcuerdo] =
  useState(false);

const [editandoAcuerdoId, setEditandoAcuerdoId] =
  useState<string | null>(null);

const [tituloAcuerdo, setTituloAcuerdo] = useState("");
const [descripcionAcuerdo, setDescripcionAcuerdo] = useState("");
const [resultadoAcuerdo, setResultadoAcuerdo] = useState("");
const [votaciones, setVotaciones] = useState<any[]>([]);
const [cargandoVotaciones, setCargandoVotaciones] = useState(false);
const [resultadosVotaciones, setResultadosVotaciones] = useState<
  Record<
    string,
    { aFavor: number; enContra: number; abstencion: number; total: number }
  >
>({});

const [mostrarFormularioVotacion, setMostrarFormularioVotacion] =
  useState(false);

  const [editandoVotacionId, setEditandoVotacionId] =
  useState<string | null>(null);

  const [votosUsuario, setVotosUsuario] = useState<
  Record<string, string>
>({});

const [procesandoVoto, setProcesandoVoto] =
  useState(false);

  const [tieneAsistencia, setTieneAsistencia] =
  useState(false);

const [preguntaVotacion, setPreguntaVotacion] = useState("");
const [descripcionVotacion, setDescripcionVotacion] = useState("");

const [procesandoVotacion, setProcesandoVotacion] = useState(false);

// INFORME DE LA SESIÓN
const [informePreparado, setInformePreparado] = useState(false);
const [cargandoInforme, setCargandoInforme] = useState(false);
const [mostrarInforme, setMostrarInforme] = useState(false);
const [incluirAsistencia, setIncluirAsistencia] = useState(true);
const [incluirVotaciones, setIncluirVotaciones] = useState(true);
const [incluirAcuerdos, setIncluirAcuerdos] = useState(true);
const [incluirOtrosAnexos, setIncluirOtrosAnexos] = useState(false);
const [datosInforme, setDatosInforme] = useState<{
  votos: Record<
    string,
    { aFavor: number; enContra: number; abstencion: number; total: number }
  >;
}>({ votos: {} });

const [informeGenerado, setInformeGenerado] = useState("");
const [cargandoGeneracionIA, setCargandoGeneracionIA] = useState(false);


  const id =
    typeof params?.id === "string"
      ? params.id
      : "";

  const rol = (
    usuario?.rol || ""
  )
    .toUpperCase()
    .trim();

  const cargo = (
    usuario?.cargo_directiva || ""
  )
    .toUpperCase()
    .trim();

  const puedeGestionar =
    rol === "ADMIN" ||
    (rol === "DIRECTIVA" &&
      cargo === "PRESIDENTE");

      console.log("DEBUG SESIÓN:", {
  rol,
  cargo,
  puedeGestionar,
  estadoSesion: sesion?.estado,
  sesion,
});

  const cargarSesion = async () => {
    if (!id) {
      setError(
        "No se recibió el identificador de la sesión."
      );
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    const { data, error } =
      await supabase
        .from("sesiones")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
      console.error(
        "Error cargando sesión:",
        error
      );

      setError(
        "No fue posible cargar la sesión."
      );

      setSesion(null);
    } else {
      // Si la fecha y hora de fin ya pasaron, finalizar la sesión
      // automáticamente y desactivar su QR.
      const ahora = new Date();

      let sesionFinal = data;

      if (
        data.estado === "ABIERTA" &&
        data.fecha &&
        data.hora_fin
      ) {
        const fechaHoraFin = new Date(
          `${data.fecha}T${data.hora_fin.slice(0, 8)}`
        );

        if (fechaHoraFin <= ahora) {
          const { data: sesionActualizada, error: errorCierre } =
            await supabase
              .from("sesiones")
              .update({
                estado: "FINALIZADA",
                qr_activo: false,
                qr_activo_hasta: ahora.toISOString(),
              })
              .eq("id", data.id)
              .eq("estado", "ABIERTA")
              .select("*")
              .single();

          if (errorCierre) {
            console.error(
              "Error finalizando automáticamente la sesión:",
              errorCierre
            );
          } else if (sesionActualizada) {
            sesionFinal = sesionActualizada;
          }
        }
      }

      setSesion(sesionFinal);

      // Cargar datos de la urbanización/condominio
const { data: condominioData, error: condominioError } =
  await supabase
    .from("condominios")
    .select("id, nombre, direccion")
    .eq("id", sesionFinal.condominio_id)
    .single();

if (condominioError) {
  console.error(
    "Error cargando condominio:",
    condominioError
  );
  setCondominio(null);
} else {
  console.log(
    "DEBUG CONDOMINIO:",
    condominioData
  );
  setCondominio(condominioData);
}

      const qrActivo =
        sesionFinal.qr_activo === true &&
        sesionFinal.qr_activo_hasta &&
        new Date(sesionFinal.qr_activo_hasta) > ahora &&
        sesionFinal.estado === "ABIERTA";

      setQrVisible(!!qrActivo);
    }

    setCargando(false);
  };

  const cargarTotalAsistencias = async () => {
  if (!id) {
    return;
  }

  const { count, error } = await supabase
    .from("asistencias")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("sesion_id", id);

  if (error) {
    console.error(
      "Error cargando total de asistencias:",
      error
    );
    return;
  }

  setTotalAsistencias(count ?? 0);
};

  const cargarAcuerdos = async () => {
    if (!id) return;

    setCargandoAcuerdos(true);

    const { data, error } = await supabase
      .from("acuerdos")
      .select("*")
      .eq("sesion_id", id)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error cargando acuerdos:",
        error
      );
      setAcuerdos([]);
    } else {
      setAcuerdos(data ?? []);
    }

    setCargandoAcuerdos(false);
  };

  const guardarAcuerdos = async () => {
    if (!id) {
      setMensaje(
        "No se encontró la sesión."
      );
      return;
    }

    if (!tituloAcuerdo.trim()) {
      setMensaje(
        "El título del acuerdo es obligatorio."
      );
      return;
    }

    if (!descripcionAcuerdo.trim()) {
      setMensaje(
        "La descripción del acuerdo es obligatoria."
      );
      return;
    }

    setProcesando(true);
    setMensaje("");

    try {
      if (editandoAcuerdoId) {
        const { error } = await supabase
          .from("acuerdos")
          .update({
            titulo: tituloAcuerdo.trim(),
            descripcion:
              descripcionAcuerdo.trim(),
            resultado:
              resultadoAcuerdo.trim() || null,
          })
          .eq("id", editandoAcuerdoId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("acuerdos")
          .insert({
            sesion_id: id,
            titulo: tituloAcuerdo.trim(),
            descripcion:
              descripcionAcuerdo.trim(),
            resultado:
              resultadoAcuerdo.trim() || null,
            creado_por: usuario?.id ?? null,
          });

        if (error) {
          throw error;
        }
      }

      setMostrarFormularioAcuerdo(false);
      setEditandoAcuerdoId(null);
      setTituloAcuerdo("");
      setDescripcionAcuerdo("");
      setResultadoAcuerdo("");

      await cargarAcuerdos();

      setMensaje(
        editandoAcuerdoId
          ? "Acuerdo actualizado correctamente."
          : "Acuerdo guardado correctamente."
      );
    } catch (error) {
      console.error(
        "Error guardando acuerdo:",
        error
      );

      setMensaje(
        "No fue posible guardar el acuerdo."
      );
    } finally {
      setProcesando(false);
    }
  };

  const editarAcuerdo = (
    acuerdo: AcuerdoSesion
  ) => {
    setEditandoAcuerdoId(acuerdo.id);
    setTituloAcuerdo(
      acuerdo.titulo ?? ""
    );
    setDescripcionAcuerdo(
      acuerdo.descripcion ?? ""
    );
    setResultadoAcuerdo(
      acuerdo.resultado ?? ""
    );
    setMostrarFormularioAcuerdo(true);
  };

  const eliminarAcuerdo = async (
    acuerdoId: string
  ) => {
    const confirmar = window.confirm(
      "¿Deseas eliminar este acuerdo?"
    );

    if (!confirmar) return;

    setProcesando(true);

    try {
      const { error } = await supabase
        .from("acuerdos")
        .delete()
        .eq("id", acuerdoId);

      if (error) {
        throw error;
      }

      await cargarAcuerdos();

      setMensaje(
        "Acuerdo eliminado correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando acuerdo:",
        error
      );

      setMensaje(
        "No fue posible eliminar el acuerdo."
      );
    } finally {
      setProcesando(false);
    }
  };


const cargarPuntos = async () => {
  if (!id) {
    return;
  }

  setCargandoPuntos(true);

  const { data, error } = await supabase
    .from("puntos_sesion")
    .select("*")
    .eq("sesion_id", id)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Error cargando puntos de la sesión:",
      error
    );

    setCargandoPuntos(false);
    return;
  }

  setPuntos(data || []);
  setCargandoPuntos(false);
};

const guardarPunto = async () => {
  if (!usuario?.id) {
    setError(
      "No se pudo identificar al usuario actual."
    );
    return;
  }

  if (!id) {
    setError(
      "No se identificó la sesión."
    );
    return;
  }

  if (!tituloPunto.trim()) {
    setError(
      "El título del punto es obligatorio."
    );
    return;
  }

  setProcesandoPunto(true);
  setError("");
  setMensaje("");

  const datos = {
    sesion_id: id,
    titulo: tituloPunto.trim(),
    descripcion:
      descripcionPunto.trim() || null,
    estado: estadoPunto,
    orden: Number(ordenPunto) || 1,
    resultado:
      resultadoPunto.trim() || null,
    creado_por: usuario.id,
  };

  let errorGuardar;

  if (editandoPuntoId) {
    const { error } = await supabase
      .from("puntos_sesion")
      .update(datos)
      .eq("id", editandoPuntoId);

    errorGuardar = error;
  } else {
    const { error } = await supabase
      .from("puntos_sesion")
      .insert(datos);

    errorGuardar = error;
  }

  if (errorGuardar) {
    console.error(
      "Error guardando punto:",
      errorGuardar
    );

    setError(
      errorGuardar.message ||
        "No fue posible guardar el punto."
    );

    setProcesandoPunto(false);
    return;
  }

  setMensaje(
    editandoPuntoId
      ? "El punto fue actualizado correctamente."
      : "El punto fue agregado correctamente."
  );

  limpiarFormularioPunto();

  await cargarPuntos();

  setProcesandoPunto(false);
};

const cargarVotaciones = async () => {
  if (!id) {
    return;
  }

  setCargandoVotaciones(true);

  const { data, error } = await supabase
    .from("votaciones")
    .select("*")
    .eq("sesion_id", id)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Error cargando votaciones:",
      error
    );

    setError(
      error.message ||
        "No fue posible cargar las votaciones."
    );

    setCargandoVotaciones(false);
    return;
  }

  setVotaciones(data || []);

  // Los resultados de los votos solo se consultan para usuarios que
  // pueden gestionar la sesión (ADMIN o DIRECTIVA/PRESIDENTE).
  const conteos: Record<
    string,
    { aFavor: number; enContra: number; abstencion: number; total: number }
  > = {};

  if (puedeGestionar) {
    const votacionIds = (data || []).map((votacion) => votacion.id);

    votacionIds.forEach((votacionId) => {
      conteos[votacionId] = {
        aFavor: 0,
        enContra: 0,
        abstencion: 0,
        total: 0,
      };
    });

    if (votacionIds.length > 0) {
      const { data: votos, error: errorVotos } = await supabase
        .from("votos")
        .select("votacion_id, opcion")
        .in("votacion_id", votacionIds);

      if (errorVotos) {
        console.error("Error cargando resultados de votaciones:", errorVotos);
      } else {
        (votos || []).forEach((voto) => {
          const conteo = conteos[voto.votacion_id];
          if (!conteo) return;

          conteo.total += 1;

          const opcionNormalizada = String(voto.opcion || "")
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\s-]+/g, "_");

          if (opcionNormalizada === "A_FAVOR" || opcionNormalizada === "AFAVOR") {
            conteo.aFavor += 1;
          } else if (opcionNormalizada === "EN_CONTRA" || opcionNormalizada === "ENCONTRA") {
            conteo.enContra += 1;
          } else if (opcionNormalizada === "ABSTENCION") {
            conteo.abstencion += 1;
          }
        });
      }
    }
  }

  setResultadosVotaciones(conteos);
  setCargandoVotaciones(false);
};

const cargarVotosUsuario = async () => {
  if (!usuario?.id || !id) {
    return;
  }

  const { data: asistencia, error: errorAsistencia } =
    await supabase
      .from("asistencias")
      .select("id")
      .eq("sesion_id", id)
      .eq("usuario_id", usuario.id)
      .maybeSingle();

  if (errorAsistencia) {
    console.error(
      "Error verificando asistencia:",
      errorAsistencia
    );
    return;
  }

  if (!asistencia) {
  setTieneAsistencia(false);
  setVotosUsuario({});
  return;
}

setTieneAsistencia(true);

  const { data: votos, error: errorVotos } =
    await supabase
      .from("votos")
      .select("votacion_id, opcion")
      .eq("usuario_id", usuario.id);

  if (errorVotos) {
    console.error(
      "Error cargando votos del usuario:",
      errorVotos
    );
    return;
  }

  const mapaVotos: Record<string, string> = {};

  (votos || []).forEach((voto) => {
    mapaVotos[voto.votacion_id] = voto.opcion;
  });

  setVotosUsuario(mapaVotos);
};

const registrarVoto = async (
  votacionId: string,
  opcion: string
) => {
  if (!usuario?.id) {
    setError(
      "No se pudo identificar al usuario actual."
    );
    return;
  }

  if (!id) {
    setError(
      "No se identificó la sesión."
    );
    return;
  }

  if (!tieneAsistencia) {
    setError(
      "Solo pueden votar los residentes que tienen asistencia registrada en esta sesión."
    );
    return;
  }

  const votacionActual = votaciones.find(
    (votacion) => votacion.id === votacionId
  );

  if (!votacionActual) {
    setError(
      "No se encontró la votación."
    );
    return;
  }

  if (votacionActual.estado !== "ABIERTA") {
    setError(
      "Esta votación no está abierta."
    );
    return;
  }

  if (votosUsuario[votacionId]) {
    setError(
      "Ya registraste tu voto en esta votación."
    );
    return;
  }

  setProcesandoVoto(true);
  setError("");
  setMensaje("");

  const { error } = await supabase
    .from("votos")
    .insert({
      votacion_id: votacionId,
      usuario_id: usuario.id,
      opcion,
    });

  if (error) {
    console.error(
      "Error registrando voto:",
      error
    );

    if (error.code === "23505") {
      setError(
        "Ya registraste tu voto en esta votación."
      );
    } else {
      setError(
        error.message ||
          "No fue posible registrar el voto."
      );
    }

    setProcesandoVoto(false);
    return;
  }

  setVotosUsuario((actuales) => ({
    ...actuales,
    [votacionId]: opcion,
  }));

  // Actualizar también los resultados de la votación inmediatamente.
  await cargarVotaciones();

  setMensaje(
    "Tu voto fue registrado correctamente."
  );

  setProcesandoVoto(false);
};

const guardarVotacion = async () => {
  if (!usuario?.id) {
    setError(
      "No se pudo identificar al usuario actual."
    );
    return;
  }

  if (!id) {
    setError(
      "No se identificó la sesión."
    );
    return;
  }

  if (!preguntaVotacion.trim()) {
    setError(
      "La pregunta de la votación es obligatoria."
    );
    return;
  }

  setProcesandoVotacion(true);
  setError("");
  setMensaje("");

  const datos = {
    sesion_id: id,
    pregunta: preguntaVotacion.trim(),
    descripcion:
      descripcionVotacion.trim() || null,
    estado: "PENDIENTE",
    creado_por: usuario.id,
  };

  const { error } = await supabase
    .from("votaciones")
    .insert(datos);

  if (error) {
    console.error(
      "Error guardando votación:",
      error
    );

    setError(
      error.message ||
        "No fue posible guardar la votación."
    );

    setProcesandoVotacion(false);
    return;
  }

  setMensaje(
    "La votación fue creada correctamente."
  );

  setPreguntaVotacion("");
  setDescripcionVotacion("");
  setMostrarFormularioVotacion(false);

  // Recargar inmediatamente las votaciones de esta sesión
  // para que la nueva votación aparezca sin necesidad de salir
  // o recargar manualmente la página.
  await cargarVotaciones();

  setProcesandoVotacion(false);
};

const eliminarVotacion = async (votacionId: string) => {
  if (!puedeGestionar) {
    setError(
      "No tienes permisos para eliminar esta votación."
    );
    return;
  }

  const confirmar = window.confirm(
    "¿Está seguro de eliminar esta votación? Esta acción también eliminará los votos registrados en ella."
  );

  if (!confirmar) {
    return;
  }

  setError("");
  setMensaje("");

  const { error } = await supabase
    .from("votaciones")
    .delete()
    .eq("id", votacionId);

  if (error) {
    console.error(
      "Error eliminando votación:",
      error
    );

    setError(
      error.message ||
        "No fue posible eliminar la votación."
    );

    return;
  }

  setMensaje(
    "La votación fue eliminada correctamente."
  );

  await cargarVotaciones();
};

const editarVotacion = async () => {
  if (!usuario?.id) {
    setError(
      "No se pudo identificar al usuario actual."
    );
    return;
  }

  if (!id) {
    setError(
      "No se identificó la sesión."
    );
    return;
  }

  if (!editandoVotacionId) {
    setError(
      "No se identificó la votación que se desea editar."
    );
    return;
  }

  if (!preguntaVotacion.trim()) {
    setError(
      "La pregunta de la votación es obligatoria."
    );
    return;
  }

  setProcesandoVotacion(true);
  setError("");
  setMensaje("");

  const datos = {
    pregunta: preguntaVotacion.trim(),
    descripcion:
      descripcionVotacion.trim() || null,
  };

  const { error } = await supabase
    .from("votaciones")
    .update(datos)
    .eq("id", editandoVotacionId);

  if (error) {
    console.error(
      "Error editando votación:",
      error
    );

    setError(
      error.message ||
        "No fue posible editar la votación."
    );

    setProcesandoVotacion(false);
    return;
  }

  setMensaje(
    "La votación fue actualizada correctamente."
  );

  setPreguntaVotacion("");
  setDescripcionVotacion("");
  setEditandoVotacionId(null);
  setMostrarFormularioVotacion(false);

  await cargarVotaciones();

  setProcesandoVotacion(false);
};

const abrirVotacion = async (votacionId: string) => {
  if (!puedeGestionar) {
    setError(
      "No tienes permisos para abrir esta votación."
    );
    return;
  }

  setError("");
  setMensaje("");

  const { error } = await supabase
    .from("votaciones")
    .update({
      estado: "ABIERTA",
      fecha_apertura: new Date().toISOString(),
    })
    .eq("id", votacionId)
    .eq("sesion_id", id);

  if (error) {
    console.error(
      "Error abriendo votación:",
      error
    );

    setError(
      error.message ||
        "No fue posible abrir la votación."
    );

    return;
  }

  setMensaje(
    "La votación fue abierta correctamente."
  );

  await cargarVotaciones();
};

const guardarAcuerdo = async () => {
  if (!usuario?.id) {
    setError(
      "No se pudo identificar al usuario actual."
    );
    return;
  }

  if (!id) {
    setError(
      "No se identificó la sesión."
    );
    return;
  }

  if (!tituloAcuerdo.trim()) {
    setError(
      "El título del acuerdo es obligatorio."
    );
    return;
  }

  if (!descripcionAcuerdo.trim()) {
    setError(
      "La descripción del acuerdo es obligatoria."
    );
    return;
  }

  setProcesandoPunto(true);
  setError("");
  setMensaje("");

  const datos = {
    sesion_id: id,
    titulo: tituloAcuerdo.trim(),
    descripcion:
      descripcionAcuerdo.trim() || null,
    resultado:
      resultadoAcuerdo.trim() || null,
    creado_por: usuario.id,
  };

  let errorGuardar;

  if (editandoAcuerdoId) {
    const { error } = await supabase
      .from("acuerdos")
      .update(datos)
      .eq("id", editandoAcuerdoId);

    errorGuardar = error;
  } else {
    const { error } = await supabase
      .from("acuerdos")
      .insert(datos);

    errorGuardar = error;
  }

  if (errorGuardar) {
    console.error(
      "Error guardando acuerdo:",
      errorGuardar
    );

    setError(
      errorGuardar.message ||
        "No fue posible guardar el acuerdo."
    );

    setProcesandoPunto(false);
    return;
  }

  setMensaje(
    editandoAcuerdoId
      ? "El acuerdo fue actualizado correctamente."
      : "El acuerdo fue agregado correctamente."
  );

  setTituloAcuerdo("");
  setDescripcionAcuerdo("");
  setResultadoAcuerdo("");
  setEditandoAcuerdoId(null);
  setMostrarFormularioAcuerdo(false);

  await cargarAcuerdos();

  setProcesandoPunto(false);
};


const editarPunto = (punto: PuntoSesion) => {
  setEditandoPuntoId(punto.id);
  setTituloPunto(punto.titulo);
  setDescripcionPunto(punto.descripcion || "");
  setEstadoPunto(punto.estado || "PENDIENTE");
  setOrdenPunto(punto.orden || 1);
  setResultadoPunto(punto.resultado || "");
  setMostrarFormularioPunto(true);

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};

const eliminarPunto = async (puntoId: string) => {
  const confirmar = window.confirm(
    "¿Está seguro de eliminar este punto de la sesión?"
  );

  if (!confirmar) {
    return;
  }

  setError("");
  setMensaje("");

  const { error } = await supabase
    .from("puntos_sesion")
    .delete()
    .eq("id", puntoId);

  if (error) {
    console.error(
      "Error eliminando punto:",
      error
    );

    setError(
      error.message ||
        "No fue posible eliminar el punto."
    );

    return;
  }

  setMensaje(
    "El punto fue eliminado correctamente."
  );

  await cargarPuntos();
};

const limpiarFormularioPunto = () => {
  setTituloPunto("");
  setDescripcionPunto("");
  setEstadoPunto("PENDIENTE");
  setOrdenPunto(puntos.length + 1);
  setResultadoPunto("");
  setEditandoPuntoId(null);
  setMostrarFormularioPunto(false);
};

  const prepararDatosInforme = async () => {
    if (!id || !sesion) {
      setError("No se encontró la información de la sesión.");
      return;
    }

    setCargandoInforme(true);
    setCargandoGeneracionIA(true);
    setError("");
    setMensaje("");

    try {
      // RENALIX es la fuente de verdad. Aquí solo recopilamos datos reales.

      const { data: asistenciasData, error: errorAsistencias } =
        await supabase
          .from("asistencias")
          .select("id, usuario_id, fecha_hora, metodo")
          .eq("sesion_id", id)
          .order("fecha_hora", { ascending: true });

      if (errorAsistencias) {
        throw errorAsistencias;
      }

      const asistenciasReales = asistenciasData || [];
      const usuarioIdsAsistencia = [
        ...new Set(
          asistenciasReales
            .map((asistencia) => asistencia.usuario_id)
            .filter(Boolean)
        ),
      ];

      let usuariosAsistencia: any[] = [];

      if (usuarioIdsAsistencia.length > 0) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, nombre, apellido, identificacion, rol, cargo_directiva")
          .in("id", usuarioIdsAsistencia);

        if (error) {
          console.error(
            "No fue posible cargar el detalle de asistentes:",
            error
          );
        } else {
          usuariosAsistencia = data || [];
        }
      }

      const usuariosPorId: Record<string, any> = {};
      usuariosAsistencia.forEach((usuarioDB) => {
        usuariosPorId[usuarioDB.id] = usuarioDB;
      });

      const asistentesInforme = asistenciasReales.map((asistencia) => {
        const usuarioDB = usuariosPorId[asistencia.usuario_id];

        return {
          usuario_id: asistencia.usuario_id,
          nombre:
            usuarioDB?.nombre || usuarioDB?.apellido
              ? [usuarioDB?.nombre, usuarioDB?.apellido]
                  .filter(Boolean)
                  .join(" ")
              : null,
          identificacion: usuarioDB?.identificacion || null,
          rol: usuarioDB?.rol || null,
          cargo_directiva: usuarioDB?.cargo_directiva || null,
          fecha_hora: asistencia.fecha_hora || null,
          metodo: asistencia.metodo || null,
        };
      });

      const votacionIds = votaciones.map((votacion) => votacion.id);

      const conteoVotos: Record<
        string,
        { aFavor: number; enContra: number; abstencion: number; total: number }
      > = {};

      votacionIds.forEach((votacionId) => {
        conteoVotos[votacionId] = {
          aFavor: 0,
          enContra: 0,
          abstencion: 0,
          total: 0,
        };
      });

      let votosReales: any[] = [];

      if (votacionIds.length > 0) {
        const { data, error: errorVotos } = await supabase
          .from("votos")
          .select("id, votacion_id, usuario_id, opcion, fecha_hora, created_at")
          .in("votacion_id", votacionIds)
          .order("created_at", { ascending: true });

        if (errorVotos) {
          throw errorVotos;
        }

        votosReales = data || [];

        votosReales.forEach((voto) => {
          const conteo = conteoVotos[voto.votacion_id];
          if (!conteo) return;

          conteo.total += 1;

          const opcionNormalizada = String(voto.opcion || "")
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\s-]+/g, "_");

          if (
            opcionNormalizada === "A_FAVOR" ||
            opcionNormalizada === "AFAVOR"
          ) {
            conteo.aFavor += 1;
          } else if (
            opcionNormalizada === "EN_CONTRA" ||
            opcionNormalizada === "ENCONTRA"
          ) {
            conteo.enContra += 1;
          } else if (opcionNormalizada === "ABSTENCION") {
            conteo.abstencion += 1;
          }
        });
      }

      setDatosInforme({ votos: conteoVotos });

      const datosParaIA = {
        sesion: {
          id: sesion.id,
          condominio_id: sesion.condominio_id,
          titulo: sesion.titulo,
          descripcion: sesion.descripcion,
          fecha: sesion.fecha,
          hora_inicio: sesion.hora_inicio,
          hora_fin: sesion.hora_fin,
          lugar: sesion.lugar,
          estado: sesion.estado,
          creado_por: sesion.creado_por,
          qr_activo: sesion.qr_activo,
          qr_activo_desde: sesion.qr_activo_desde,
          qr_activo_hasta: sesion.qr_activo_hasta,
          asistencia_abierta_por: sesion.asistencia_abierta_por,
          asistencia_abierta_at: sesion.asistencia_abierta_at,
          asistencia_cerrada_por: sesion.asistencia_cerrada_por,
          asistencia_cerrada_at: sesion.asistencia_cerrada_at,
          created_at: sesion.created_at,
        },

         condominio: {
    id: condominio?.id || null,
    nombre: condominio?.nombre || null,
    direccion: condominio?.direccion || null,
  },
        puntos: puntos.map((punto) => ({
          id: punto.id,
          sesion_id: punto.sesion_id,
          titulo: punto.titulo,
          descripcion: punto.descripcion,
          estado: punto.estado,
          orden: punto.orden,
          resultado: punto.resultado,
          creado_por: punto.creado_por,
          created_at: punto.created_at,
        })),
        asistencia: {
          total: asistenciasReales.length,
          porcentaje: null,
          registros: incluirAsistencia ? asistentesInforme : [],
        },
        votaciones: incluirVotaciones
          ? votaciones.map((votacion) => {
              const conteo = conteoVotos[votacion.id] || {
                aFavor: 0,
                enContra: 0,
                abstencion: 0,
                total: 0,
              };

              return {
                id: votacion.id,
                sesion_id: votacion.sesion_id,
                pregunta: votacion.pregunta,
                descripcion: votacion.descripcion,
                estado: votacion.estado,
                fecha_apertura: votacion.fecha_apertura,
                fecha_cierre: votacion.fecha_cierre,
                creado_por: votacion.creado_por,
                created_at: votacion.created_at,
                conteos: {
                  a_favor: conteo.aFavor,
                  en_contra: conteo.enContra,
                  abstencion: conteo.abstencion,
                  total: conteo.total,
                },
                votos: votosReales
                  .filter((voto) => voto.votacion_id === votacion.id)
                  .map((voto) => ({
                    id: voto.id,
                    usuario_id: voto.usuario_id,
                    opcion: voto.opcion,
                    fecha_hora: voto.fecha_hora,
                    created_at: voto.created_at,
                  })),
              };
            })
          : [],
        acuerdos: incluirAcuerdos
          ? acuerdos.map((acuerdo) => ({
              id: acuerdo.id,
              sesion_id: acuerdo.sesion_id,
              titulo: acuerdo.titulo,
              descripcion: acuerdo.descripcion,
              resultado: acuerdo.resultado,
              creado_por: acuerdo.creado_por,
              created_at: acuerdo.created_at,
            }))
          : [],
        anexos: {
          incluir_asistencia: incluirAsistencia,
          incluir_votaciones: incluirVotaciones,
          incluir_acuerdos: incluirAcuerdos,
          incluir_otros: incluirOtrosAnexos,
        },
      };

      const response = await fetch("/api/informe-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaIA),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado?.error || "No fue posible generar el informe con IA."
        );
      }

      const informe = String(resultado?.informe || "").trim();

      if (!informe) {
        throw new Error("La IA no devolvió contenido para el informe.");
      }

      setInformeGenerado(informe);
      setInformePreparado(true);
      setMostrarInforme(true);
      setMensaje("El informe de la sesión fue generado correctamente con IA.");
    } catch (error: any) {
      console.error("Error generando informe con IA:", error);
      setError(
        error?.message || "No fue posible generar el informe con IA."
      );
      setInformePreparado(false);
    } finally {
      setCargandoInforme(false);
      setCargandoGeneracionIA(false);
    }
  };

  useEffect(() => {
    if (!loading && usuario) {
      cargarSesion();
      cargarTotalAsistencias();
      cargarPuntos();
      cargarAcuerdos();
      cargarVotaciones();
      cargarVotosUsuario();
    }
  }, [loading, usuario, id]);

    const abrirAsistencia = async () => {
    if (!usuario?.id) {
      setError(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    if (!sesion) {
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    // 1. Abrir asistencia
    const { data, error } =
      await supabase.rpc(
        "abrir_asistencia",
        {
          p_sesion_id: sesion.id,
        }
      );

    if (error) {
      console.error(
        "Error abriendo asistencia:",
        error
      );

      setError(
        error.message ||
          "No fue posible abrir la asistencia."
      );

      setProcesando(false);
      return;
    }

    console.log(
      "Resultado abrir asistencia:",
      data
    );

    // 2. Activar automáticamente el QR
    const ahora = new Date();

    const hasta = new Date(
      ahora.getTime() + 30 * 60 * 1000
    );

    const { error: errorQR } =
      await supabase
        .from("sesiones")
        .update({
          qr_activo: true,
          qr_activo_desde:
            ahora.toISOString(),
          qr_activo_hasta:
            hasta.toISOString(),
        })
        .eq("id", sesion.id);

    if (errorQR) {
      console.error(
  "Error activando QR automáticamente:",
  errorQR
);

      setError(
        errorQR.message ||
          "La asistencia se abrió, pero no fue posible activar el QR."
      );

      setProcesando(false);
      return;
    }

    // 3. Mostrar QR automáticamente
    setQrVisible(true);

    setMensaje(
      "La asistencia fue abierta correctamente y el QR está activo durante 30 minutos."
    );

    // 4. Recargar la sesión
    await cargarSesion();

    setProcesando(false);
  };

    const activarQR = async () => {
    if (!usuario?.id) {
      setError(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    if (!sesion) {
      return;
    }

    setActivandoQR(true);
    setError("");
    setMensaje("");

    const ahora = new Date();

    const hasta = new Date(
      ahora.getTime() + 30 * 60 * 1000
    );

    const { data: sesionActualizada, error } =
  await supabase
    .from("sesiones")
    .update({
        qr_activo: true,
        qr_activo_desde:
          ahora.toISOString(),
        qr_activo_hasta:
          hasta.toISOString(),
      })
      .eq("id", sesion.id);

    if (error) {
      console.error(
        "Error activando QR:",
        error
      );

      setError(
        error.message ||
          "No fue posible activar el QR."
      );

      setActivandoQR(false);
      return;
    }

    setQrVisible(true);

    setMensaje(
      "El QR de asistencia fue activado correctamente."
    );

    await cargarSesion();

    setActivandoQR(false);
  };

    const cerrarAsistencia = async () => {
    if (!usuario?.id) {
      setError(
        "No se pudo identificar al usuario actual."
      );
      return;
    }

    if (!sesion) {
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    const ahora = new Date();

    const { error } = await supabase
      .from("sesiones")
      .update({
      estado: "FINALIZADA",
      asistencia_cerrada_por: usuario.id,
      asistencia_cerrada_at: ahora.toISOString(),
      qr_activo: false,
      qr_activo_hasta: ahora.toISOString(),
    })
    .eq("id", sesion.id);
     
   console.log(
  "RESULTADO CIERRE:",
  JSON.stringify(
    {
      sesionId: sesion.id,
      usuarioId: usuario.id,
      error,
    },
    null,
    2
  )
);


    if (error) {
      console.error(
        "Error cerrando asistencia:",
        error
      );

      setError(
        error.message ||
          "No fue posible cerrar la asistencia."
      );

      setProcesando(false);
      return;
    }

     console.log(
      "ASISTENCIA CERRADA CORRECTAMENTE:",
      sesion.id
    );

    setQrVisible(false);

    setMensaje(
      "La asistencia fue cerrada correctamente. El QR ha sido desactivado."
    );

    await cargarSesion();

    setProcesando(false);
  };

  if (loading || cargando) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Cargando sesión...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>
          Sesión no iniciada
        </h2>

        <button
          onClick={() =>
            router.push("/login")
          }
          style={botonPrimario}
        >
          Ir al Login
        </button>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <h2>
          Sesión no encontrada
        </h2>

        <p
          style={{
            color: "#6b7280",
          }}
        >
          La sesión solicitada no existe o
          no pudo ser cargada.
        </p>

        <button
          onClick={() =>
            router.push(
              "/sesiones-acuerdos"
            )
          }
          style={botonPrimario}
        >
          Volver a Sesiones
        </button>
      </div>
    );
  }

  const fecha = new Date(
    `${sesion.fecha}T00:00:00`
  );

  const fechaTexto =
    fecha.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const horaInicio =
    sesion.hora_inicio?.slice(0, 5) ||
    "";

  const horaFin =
    sesion.hora_fin?.slice(0, 5) ||
    "";

  const asistenciaAbierta =
  (sesion.estado || "").toUpperCase().trim() === "ABIERTA" &&
  !!sesion.asistencia_abierta_at;

    const urlAsistencia =
  typeof window !== "undefined"
    ? `${window.location.origin}/asistencia/qr/${sesion.id}`
    : "";

  const estado =
    (sesion.estado || "")
      .toUpperCase()
      .trim();

  return (
    <div
      style={{
        padding: "30px 35px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

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
          📝 {sesion.titulo}
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            color: "#dbeafe",
          }}
        >
          Gestión de la sesión
        </p>
      </div>

      {/* VOLVER */}

      <button
        onClick={() =>
          router.push(
            "/sesiones-acuerdos"
          )
        }
        style={{
          border: "none",
          background: "transparent",
          color: "#2563eb",
          fontWeight: "bold",
          cursor: "pointer",
          padding: 0,
          marginBottom: 20,
          fontSize: 15,
        }}
      >
        ← Volver a Sesiones y Acuerdos
      </button>

      {/* INFORMACIÓN */}

      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          padding: 28,
          marginBottom: 22,
          boxShadow:
            "0 5px 18px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 15,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#111827",
            }}
          >
            📋 Información de la sesión
          </h2>

          <span
            style={{
              background:
                estado === "PROGRAMADA"
                  ? "#fef3c7"
                  : estado === "ABIERTA"
                  ? "#dcfce7"
                  : "#e5e7eb",
              color:
                estado === "PROGRAMADA"
                  ? "#92400e"
                  : estado === "ABIERTA"
                  ? "#166534"
                  : "#374151",
              padding: "7px 13px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            {estado}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 18,
          }}
        >
          <InfoItem
            icon="📅"
            label="Fecha"
            value={fechaTexto}
          />

          <InfoItem
            icon="🕐"
            label="Horario"
            value={`${horaInicio}${
              horaFin
                ? ` - ${horaFin}`
                : ""
            }`}
          />

          <InfoItem
            icon="📍"
            label="Lugar"
            value={sesion.lugar}
          />
        </div>

        {sesion.descripcion && (
          <div
            style={{
              marginTop: 22,
              paddingTop: 20,
              borderTop:
                "1px solid #e5e7eb",
            }}
          >
            <strong
              style={{
                color: "#111827",
              }}
            >
              Descripción
            </strong>

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.6,
                marginBottom: 0,
              }}
            >
              {sesion.descripcion}
            </p>
          </div>
        )}
      </div>

      {/* MENSAJES */}

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {mensaje && (
        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          ✅ {mensaje}
        </div>
      )}

      {/* ASISTENCIA */}
<div style={seccionStyle}>
  <h2 style={tituloSeccion}>
    👥 Asistencia
  </h2>

  <div
    style={{
      marginTop: 16,
      background: "#f9fafb",
      borderRadius: 14,
      padding: 20,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 32,
        fontWeight: "bold",
        color: "#111827",
      }}
    >
      {totalAsistencias}
    </div>

    <div
      style={{
        marginTop: 4,
        color: "#6b7280",
        fontSize: 14,
      }}
    >
      {totalAsistencias === 1
        ? "persona asistió a esta sesión"
        : "personas asistieron a esta sesión"}
    </div>

    {estado === "PROGRAMADA" && puedeGestionar && (
  <button
    onClick={abrirAsistencia}
    disabled={procesando}
    style={{
      marginTop: 18,
      padding: "12px 22px",
      border: "none",
      borderRadius: 10,
      background: "#2563eb",
      color: "#fff",
      fontWeight: "bold",
      cursor: procesando
        ? "not-allowed"
        : "pointer",
      opacity: procesando ? 0.7 : 1,
    }}
  >
    {procesando
      ? "Abriendo asistencia..."
      : "👥 Abrir asistencia"}
  </button>
)}

{qrVisible && (
  <div
    style={{
      marginTop: 22,
      padding: 24,
      background: "#ffffff",
      borderRadius: 16,
      border: "1px solid #e5e7eb",
      textAlign: "center",
    }}
  >
    <h3
      style={{
        marginTop: 0,
        color: "#111827",
      }}
    >
      📱 Código QR de asistencia
    </h3>

    <p
      style={{
        color: "#6b7280",
        marginBottom: 20,
      }}
    >
      Escanee este código para registrar su asistencia.
    </p>

    <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  }}
>
  <QRCodeSVG
    value={urlAsistencia}
    size={220}
  />
</div>

    <p
      style={{
        marginTop: 16,
        fontSize: 13,
        color: "#6b7280",
        wordBreak: "break-all",
      }}
    >
      {urlAsistencia}
    </p>
  </div>
)}

  </div>
</div>

{/* PUNTOS DE LA SESIÓN */}

<div style={seccionStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 15,
      flexWrap: "wrap",
    }}
  >
    <div>
      <h2 style={tituloSeccion}>
        📋 Puntos de la sesión
      </h2>

      <p style={textoSecundario}>
        Temas y asuntos tratados durante esta sesión.
      </p>
    </div>

    {puedeGestionar && (
      <button
        onClick={() => {
          limpiarFormularioPunto();
          setOrdenPunto(puntos.length + 1);
          setMostrarFormularioPunto(true);
        }}
        style={botonPrimario}
      >
        ➕ Agregar punto
      </button>
    )}
  </div>

  {mostrarFormularioPunto && puedeGestionar && (
    <div
      style={{
        marginTop: 22,
        padding: 22,
        background: "#f8fafc",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: "#111827",
        }}
      >
        {editandoPuntoId
          ? "✏️ Editar punto"
          : "➕ Nuevo punto"}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 6,
              color: "#374151",
            }}
          >
            Título *
          </label>

          <input
            value={tituloPunto}
            onChange={(e) =>
              setTituloPunto(e.target.value)
            }
            placeholder="Ej. Revisión de gastos administrativos"
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 6,
              color: "#374151",
            }}
          >
            Orden
          </label>

          <input
            type="number"
            min="1"
            value={ordenPunto}
            onChange={(e) =>
              setOrdenPunto(
                Number(e.target.value)
              )
            }
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 6,
              color: "#374151",
            }}
          >
            Estado
          </label>

          <select
            value={estadoPunto}
            onChange={(e) =>
              setEstadoPunto(e.target.value)
            }
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          >
            <option value="PENDIENTE">
              PENDIENTE
            </option>

            <option value="EN_TRATAMIENTO">
              EN TRATAMIENTO
            </option>

            <option value="TRATADO">
              TRATADO
            </option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Descripción
        </label>

        <textarea
          value={descripcionPunto}
          onChange={(e) =>
            setDescripcionPunto(e.target.value)
          }
          placeholder="Detalle del tema a tratar..."
          rows={3}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Resultado
        </label>

        <textarea
          value={resultadoPunto}
          onChange={(e) =>
            setResultadoPunto(e.target.value)
          }
          placeholder="Resultado o conclusión del punto..."
          rows={3}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={guardarPunto}
          disabled={procesandoPunto}
          style={{
            ...botonPrimario,
            opacity: procesandoPunto ? 0.6 : 1,
          }}
        >
          {procesandoPunto
            ? "Guardando..."
            : editandoPuntoId
            ? "💾 Actualizar punto"
            : "💾 Guardar punto"}
        </button>

        <button
          onClick={limpiarFormularioPunto}
          disabled={procesandoPunto}
          style={{
            padding: "12px 20px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )}

  <div style={{ marginTop: 22 }}>
    {cargandoPuntos ? (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Cargando puntos...
      </div>
    ) : puntos.length === 0 ? (
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 14,
          padding: 22,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        📋 No hay puntos registrados para esta
        sesión.
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {puntos.map((punto, index) => (
          <div
            key={punto.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 18,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 15,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "5px 9px",
                      borderRadius: 8,
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    #{index + 1}
                  </span>

                  <strong
                    style={{
                      fontSize: 16,
                      color: "#111827",
                    }}
                  >
                    {punto.titulo}
                  </strong>

                  <span
                    style={{
                      background:
                        punto.estado === "TRATADO"
                          ? "#dcfce7"
                          : punto.estado ===
                            "EN_TRATAMIENTO"
                          ? "#fef3c7"
                          : "#f3f4f6",
                      color:
                        punto.estado === "TRATADO"
                          ? "#166534"
                          : punto.estado ===
                            "EN_TRATAMIENTO"
                          ? "#92400e"
                          : "#4b5563",
                      padding: "5px 9px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  >
                    {punto.estado}
                  </span>
                </div>

                {punto.descripcion && (
                  <p
                    style={{
                      color: "#6b7280",
                      lineHeight: 1.5,
                      marginBottom: 0,
                    }}
                  >
                    {punto.descripcion}
                  </p>
                )}

                {punto.resultado && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: "#f9fafb",
                      borderRadius: 10,
                    }}
                  >
                    <strong
                      style={{
                        color: "#374151",
                      }}
                    >
                      Resultado:
                    </strong>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#6b7280",
                      }}
                    >
                      {punto.resultado}
                    </div>
                  </div>
                )}
              </div>

              {puedeGestionar && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      editarPunto(punto)
                    }
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() =>
                      eliminarPunto(punto.id)
                    }
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

{/* VOTACIONES */}

<div style={seccionStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 15,
      flexWrap: "wrap",
    }}
  >
    <div>
      <h2 style={tituloSeccion}>
        🗳️ Votaciones
      </h2>

      <p style={textoSecundario}>
        Votaciones realizadas durante esta sesión.
      </p>
    </div>

    {puedeGestionar && (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => cargarVotaciones()}
          disabled={cargandoVotaciones}
          style={{
            padding: "12px 18px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            background: "#fff",
            color: "#374151",
            cursor: cargandoVotaciones ? "not-allowed" : "pointer",
            fontWeight: "bold",
            opacity: cargandoVotaciones ? 0.6 : 1,
          }}
        >
          🔄 Actualizar resultados
        </button>
        <button
          type="button"
          onClick={() => {
            setMostrarFormularioVotacion(true);
            setPreguntaVotacion("");
            setDescripcionVotacion("");
          }}
          style={botonPrimario}
        >
          ➕ Nueva votación
        </button>
      </div>
    )}
  </div>

  {mostrarFormularioVotacion && puedeGestionar && (
    <div
      style={{
        marginTop: 22,
        padding: 22,
        background: "#f8fafc",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: "#111827",
        }}
      >
        ➕ Nueva votación
      </h3>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Pregunta *
        </label>

        <input
          value={preguntaVotacion}
          onChange={(e) =>
            setPreguntaVotacion(e.target.value)
          }
          placeholder="Ej. ¿Se aprueba el presupuesto anual?"
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Descripción
        </label>

        <textarea
          value={descripcionVotacion}
          onChange={(e) =>
            setDescripcionVotacion(e.target.value)
          }
          placeholder="Información adicional sobre la votación..."
          rows={4}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={guardarVotacion}
          style={botonPrimario}
          disabled={procesandoVotacion}
        >
          💾 Crear votación
        </button>

        <button
          type="button"
          onClick={() => {
            setMostrarFormularioVotacion(false);
            setPreguntaVotacion("");
            setDescripcionVotacion("");
          }}
          style={{
            padding: "12px 20px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )}

  {cargandoVotaciones ? (
    <div
      style={{
        marginTop: 22,
        padding: 20,
        textAlign: "center",
        color: "#6b7280",
      }}
    >
      Cargando votaciones...
    </div>
  ) : votaciones.length === 0 ? (
    <div
      style={{
        marginTop: 22,
        background: "#f9fafb",
        borderRadius: 14,
        padding: 22,
        textAlign: "center",
        color: "#6b7280",
      }}
    >
      🗳️ No hay votaciones registradas para esta
      sesión.
    </div>
  ) : (
    <div style={{ marginTop: 22 }}>

      {votaciones.map((votacion, index) => (
        <div
          key={votacion.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 18,
            marginBottom: 12,
            background: "#fff",
          }}
        >
          <strong
            style={{
              fontSize: 16,
              color: "#111827",
            }}
          >
            #{index + 1} {votacion.pregunta}
          </strong>

          {votacion.descripcion && (
            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.5,
                marginBottom: 0,
              }}
            >
              {votacion.descripcion}
            </p>
          )}

          {puedeGestionar && (() => {
            const resultado = resultadosVotaciones[votacion.id] || {
              aFavor: 0,
              enContra: 0,
              abstencion: 0,
              total: 0,
            };

            const resultadoTexto =
              resultado.total === 0
                ? "Sin votos registrados"
                : resultado.aFavor > resultado.enContra
                ? "Tendencia: A FAVOR"
                : resultado.enContra > resultado.aFavor
                ? "Tendencia: EN CONTRA"
                : "Empate";

            return (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 10,
                  }}
                >
                  📊 Avance de la votación
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                    gap: 10,
                  }}
                >
                  <div style={{ padding: 10, background: "#dcfce7", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "#166534" }}>A FAVOR</div>
                    <strong style={{ fontSize: 20, color: "#166534" }}>{resultado.aFavor}</strong>
                  </div>

                  <div style={{ padding: 10, background: "#fee2e2", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "#b91c1c" }}>EN CONTRA</div>
                    <strong style={{ fontSize: 20, color: "#b91c1c" }}>{resultado.enContra}</strong>
                  </div>

                  <div style={{ padding: 10, background: "#f3f4f6", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "#374151" }}>ABSTENCIÓN</div>
                    <strong style={{ fontSize: 20, color: "#374151" }}>{resultado.abstencion}</strong>
                  </div>

                  <div style={{ padding: 10, background: "#eff6ff", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "#1d4ed8" }}>TOTAL VOTOS</div>
                    <strong style={{ fontSize: 20, color: "#1d4ed8" }}>{resultado.total}</strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontWeight: 700,
                    color: resultado.total === 0 ? "#6b7280" : "#111827",
                  }}
                >
                  {votacion.estado === "CERRADA" ? "Resultado" : "Tendencia"}: {resultadoTexto.replace("Tendencia: ", "")}
                </div>
              </div>
            );
          })()}

                    {votacion.estado === "ABIERTA" &&
            tieneAsistencia &&
            !votosUsuario[votacion.id] && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  disabled={procesandoVoto}
                  onClick={() =>
                    registrarVoto(
                      votacion.id,
                      "A_FAVOR"
                    )
                  }
                  style={{
                    border: "none",
                    background: "#dcfce7",
                    color: "#166534",
                    borderRadius: 10,
                    padding: "9px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🟢 A FAVOR
                </button>

                <button
                  type="button"
                  disabled={procesandoVoto}
                  onClick={() =>
                    registrarVoto(
                      votacion.id,
                      "EN_CONTRA"
                    )
                  }
                  style={{
                    border: "none",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    borderRadius: 10,
                    padding: "9px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  🔴 EN CONTRA
                </button>

                <button
                  type="button"
                  disabled={procesandoVoto}
                  onClick={() =>
                    registrarVoto(
                      votacion.id,
                      "ABSTENCION"
                    )
                  }
                  style={{
                    border: "none",
                    background: "#f3f4f6",
                    color: "#374151",
                    borderRadius: 10,
                    padding: "9px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  ⚪ ABSTENCIÓN
                </button>
              </div>
            )}

                    {puedeGestionar && (
            <button
              type="button"
              onClick={() => {
                setPreguntaVotacion(votacion.pregunta);
                setDescripcionVotacion(
                  votacion.descripcion || ""
                );
                setEditandoVotacionId(votacion.id);
                setMostrarFormularioVotacion(true);
              }}
              style={{
                marginTop: 12,
                marginRight: 8,
                border: "none",
                background: "#e0f2fe",
                color: "#0369a1",
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ✏️ Editar
            </button>
          )}

                    {puedeGestionar &&
            votacion.estado === "PENDIENTE" && (
              <button
                type="button"
                onClick={() =>
                  abrirVotacion(votacion.id)
                }
                style={{
                  marginTop: 12,
                  marginRight: 8,
                  border: "none",
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                🗳️ Abrir votación
              </button>
            )}


                    {puedeGestionar && (
            <button
              type="button"
              onClick={() => eliminarVotacion(votacion.id)}
              style={{
                marginTop: 12,
                border: "none",
                background: "#fee2e2",
                color: "#b91c1c",
                borderRadius: 10,
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🗑️ Eliminar
            </button>
          )}

        </div>
      ))}
    </div>
  )}
</div>
      
{/* ACUERDOS */}

<div style={seccionStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 15,
      flexWrap: "wrap",
    }}
  >
    <div>
      <h2 style={tituloSeccion}>
        🤝 Acuerdos
      </h2>

      <p style={textoSecundario}>
        Acuerdos adoptados durante esta sesión.
      </p>
    </div>

    {puedeGestionar && (
      <button
        onClick={() => {
          setMostrarFormularioAcuerdo(true);
          setEditandoAcuerdoId(null);
          setTituloAcuerdo("");
          setDescripcionAcuerdo("");
          setResultadoAcuerdo("");
        }}
        style={botonPrimario}
      >
        ➕ Nuevo acuerdo
      </button>
    )}
  </div>

  {mostrarFormularioAcuerdo && puedeGestionar && (
    <div
      style={{
        marginTop: 22,
        padding: 22,
        background: "#f8fafc",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: "#111827",
        }}
      >
        {editandoAcuerdoId
          ? "✏️ Editar acuerdo"
          : "➕ Nuevo acuerdo"}
      </h3>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Título *
        </label>

        <input
          value={tituloAcuerdo}
          onChange={(e) =>
            setTituloAcuerdo(e.target.value)
          }
          placeholder="Ej. Aprobación del presupuesto anual"
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Descripción *
        </label>

        <textarea
          value={descripcionAcuerdo}
          onChange={(e) =>
            setDescripcionAcuerdo(e.target.value)
          }
          placeholder="Detalle del acuerdo adoptado..."
          rows={4}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: 6,
            color: "#374151",
          }}
        >
          Resultado
        </label>

        <textarea
          value={resultadoAcuerdo}
          onChange={(e) =>
            setResultadoAcuerdo(e.target.value)
          }
          placeholder="Resultado o decisión final..."
          rows={3}
          style={{
            width: "100%",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={guardarAcuerdo}
          style={botonPrimario}
        >
          💾 Guardar acuerdo
        </button>

        <button
          onClick={() => {
            setMostrarFormularioAcuerdo(false);
            setEditandoAcuerdoId(null);
          }}
          style={{
            padding: "12px 20px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )}

  <div style={{ marginTop: 22 }}>
    {cargandoAcuerdos ? (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        Cargando acuerdos...
      </div>
    ) : acuerdos.length === 0 ? (
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 14,
          padding: 22,
          textAlign: "center",
          color: "#6b7280",
        }}
      >
        🤝 No hay acuerdos registrados para esta
        sesión.
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {acuerdos.map((acuerdo, index) => (
          <div
            key={acuerdo.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 18,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 15,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: "#ecfdf5",
                      color: "#047857",
                      padding: "5px 9px",
                      borderRadius: 8,
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    #{index + 1}
                  </span>

                  <strong
                    style={{
                      fontSize: 16,
                      color: "#111827",
                    }}
                  >
                    {acuerdo.titulo}
                  </strong>
                </div>

                {acuerdo.descripcion && (
                  <p
                    style={{
                      color: "#6b7280",
                      lineHeight: 1.5,
                      marginBottom: 0,
                    }}
                  >
                    {acuerdo.descripcion}
                  </p>
                )}

                {acuerdo.resultado && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: "#f9fafb",
                      borderRadius: 10,
                    }}
                  >
                    <strong
                      style={{
                        color: "#374151",
                      }}
                    >
                      Resultado:
                    </strong>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#6b7280",
                      }}
                    >
                      {acuerdo.resultado}
                    </div>
                  </div>
                )}
              </div>

              {puedeGestionar && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      editarAcuerdo(acuerdo)
                    }
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() =>
                      eliminarAcuerdo(acuerdo.id)
                    }
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

{/* INFORME DE LA SESIÓN */}
<div style={seccionStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 15,
      flexWrap: "wrap",
    }}
  >
    <div>
      <h2 style={tituloSeccion}>📄 Informe de la sesión</h2>
      <p style={textoSecundario}>
        Genera un informe administrativo a partir exclusivamente de los
        registros reales de esta sesión.
      </p>
    </div>

    <span
      style={{
        background: informeGenerado ? "#dcfce7" : "#fef3c7",
        color: informeGenerado ? "#166534" : "#92400e",
        padding: "7px 13px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: "bold",
      }}
    >
      {informeGenerado ? "GENERADO" : "PENDIENTE"}
    </span>
  </div>

  <div
    style={{
      marginTop: 20,
      padding: 18,
      background: "#f8fafc",
      borderRadius: 14,
      border: "1px solid #e5e7eb",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Asistencia</div>
        <strong style={{ color: "#111827" }}>
          {totalAsistencias} registrada(s)
        </strong>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Puntos</div>
        <strong style={{ color: "#111827" }}>{puntos.length}</strong>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Votaciones</div>
        <strong style={{ color: "#111827" }}>{votaciones.length}</strong>
      </div>

      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Acuerdos</div>
        <strong style={{ color: "#111827" }}>{acuerdos.length}</strong>
      </div>
    </div>
  </div>

  <div
    style={{
      marginTop: 18,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      onClick={prepararDatosInforme}
      disabled={cargandoGeneracionIA}
      style={{
        ...botonPrimario,
        opacity: cargandoGeneracionIA ? 0.7 : 1,
        cursor: cargandoGeneracionIA ? "not-allowed" : "pointer",
      }}
    >
      {cargandoGeneracionIA
        ? "🤖 Generando informe..."
        : informeGenerado
        ? "🔄 Regenerar informe con IA"
        : "🤖 Generar informe con IA"}
    </button>

    <button
      type="button"
      disabled={!informeGenerado}
      onClick={() => setMostrarInforme((actual) => !actual)}
      style={{
        padding: "12px 20px",
        border: "1px solid #d1d5db",
        borderRadius: 10,
        background: "#fff",
        color: "#374151",
        cursor: informeGenerado ? "pointer" : "not-allowed",
        fontWeight: "bold",
        opacity: informeGenerado ? 1 : 0.55,
      }}
    >
      👁️ {mostrarInforme ? "Ocultar informe" : "Ver informe"}
    </button>
  </div>

  {cargandoGeneracionIA && (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 12,
        color: "#1e40af",
        lineHeight: 1.6,
      }}
    >
      <strong>Generando el informe...</strong>
      <div style={{ marginTop: 4 }}>
        RENALIX está enviando los datos registrados de esta sesión al servicio
        seguro de generación de informes.
      </div>
    </div>
  )}

  {mostrarInforme && informeGenerado && (
    <div
      style={{
        marginTop: 22,
        padding: "34px 38px",
        background: "#ffffff",
        border: "1px solid #d1d5db",
        borderRadius: 16,
        boxShadow: "0 5px 18px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          flexWrap: "wrap",
          paddingBottom: 20,
          marginBottom: 24,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: "#2563eb",
              letterSpacing: 0.5,
            }}
          >
            RENALIX
          </div>
          <h3
            style={{
              margin: "6px 0 0",
              color: "#111827",
              fontSize: 24,
            }}
          >
            Informe de Sesión y Acuerdos
          </h3>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            textAlign: "right",
          }}
        >
          <div>{sesion.titulo}</div>
          <div>{fechaTexto}</div>
        </div>
      </div>

      <div
        style={{
          whiteSpace: "pre-wrap",
          color: "#1f2937",
          lineHeight: 1.75,
          fontSize: 15,
        }}
      >
        {informeGenerado}
      </div>
    </div>
  )}
</div>

</div>
  );
}
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginBottom: 6,
        }}
      >
        {icon} {label}
      </div>

      <div
        style={{
          fontWeight: "bold",
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const botonPrimario: React.CSSProperties = {
  padding: "12px 20px",
  border: "none",
  borderRadius: 10,
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 14,
};

const seccionStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  padding: 28,
  marginBottom: 22,
  boxShadow:
    "0 5px 18px rgba(0,0,0,0.08)",
};

const tituloSeccion: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const textoSecundario: React.CSSProperties = {
  color: "#6b7280",
  marginBottom: 0,
  marginTop: 8,
};