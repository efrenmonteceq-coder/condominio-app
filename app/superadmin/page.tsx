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

    // Seguimiento de instalaciones
const [solicitudesInstalacion, setSolicitudesInstalacion] =
  useState<any[]>([]);
const [cargandoSolicitudes, setCargandoSolicitudes] =
  useState(false);
const [filtroEstadoInstalacion, setFiltroEstadoInstalacion] =
  useState("TODAS");
const [errorSolicitudes, setErrorSolicitudes] =
  useState("");

// Edición manual de los datos de infraestructura por instalación
const [instalacionInfraestructura, setInstalacionInfraestructura] =
  useState<any | null>(null);
const [infraProyectoSupabaseId, setInfraProyectoSupabaseId] = useState("");
const [infraProyectoVercelId, setInfraProyectoVercelId] = useState("");
const [infraUrlProduccion, setInfraUrlProduccion] = useState("");
const [infraDominio, setInfraDominio] = useState("");
const [guardandoInfraestructura, setGuardandoInfraestructura] = useState(false);


  // Catálogo de versiones y planificación de actualizaciones
  const [versiones, setVersiones] = useState<any[]>([]);
  const [actualizaciones, setActualizaciones] = useState<any[]>([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [cargandoActualizaciones, setCargandoActualizaciones] = useState(false);
  const [errorVersiones, setErrorVersiones] = useState("");
  const [errorActualizaciones, setErrorActualizaciones] = useState("");
  const [guardandoVersion, setGuardandoVersion] = useState(false);
  const [cambiandoEstadoVersionId, setCambiandoEstadoVersionId] = useState<string | null>(null);
  const [planificandoActualizacion, setPlanificandoActualizacion] = useState(false);
  const [versionNueva, setVersionNueva] = useState("");
  const [nombreVersionNueva, setNombreVersionNueva] = useState("");
  const [notasVersionNueva, setNotasVersionNueva] = useState("");
  const [versionMinimaNueva, setVersionMinimaNueva] = useState("");
  const [referenciaCodigoNueva, setReferenciaCodigoNueva] = useState("");
  const [instalacionParaActualizar, setInstalacionParaActualizar] = useState("");
  const [versionDestinoActualizacion, setVersionDestinoActualizacion] = useState("");
  const [filtroEstadoActualizacion, setFiltroEstadoActualizacion] = useState("TODAS");

    // Solicitud de instalación automatizada
const [nombreInstalacion, setNombreInstalacion] = useState("");
const [direccionInstalacion, setDireccionInstalacion] = useState("");
const [nombreAdminInstalacion, setNombreAdminInstalacion] = useState("");
const [emailAdminInstalacion, setEmailAdminInstalacion] = useState("");
const [identificacionAdminInstalacion, setIdentificacionAdminInstalacion] = useState("");
const [telefonoAdminInstalacion, setTelefonoAdminInstalacion] = useState("");
const [enviandoInstalacion, setEnviandoInstalacion] = useState(false);

const registrarSolicitudInstalacion = async () => {
  if (
    !nombreInstalacion.trim() ||
    !direccionInstalacion.trim() ||
    !nombreAdminInstalacion.trim() ||
    !emailAdminInstalacion.trim() ||
    !identificacionAdminInstalacion.trim()
  ) {
    alert("Completa los campos obligatorios de la instalación.");
    return;
  }

  setEnviandoInstalacion(true);

  try {
    const {
      data: { session },
      error: errorSesion,
    } = await supabase.auth.getSession();

    if (errorSesion || !session?.access_token) {
      alert("Tu sesión no es válida. Inicia sesión nuevamente.");
      return;
    }

    const response = await fetch("/api/instalaciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        nombre: nombreInstalacion.trim(),
        direccion: direccionInstalacion.trim(),
        nombre_administrador: nombreAdminInstalacion.trim(),
        email_administrador: emailAdminInstalacion.trim(),
        identificacion_administrador:
          identificacionAdminInstalacion.trim(),
        telefono_administrador: telefonoAdminInstalacion.trim(),
      }),
    });

    const resultado = await response.json();

    if (!response.ok) {
      alert(resultado.error || "No se pudo registrar la solicitud.");
      return;
    }

    alert(
      `Solicitud registrada correctamente. Estado: ${resultado.solicitud.estado}`
    );

    setNombreInstalacion("");
    setDireccionInstalacion("");
    setNombreAdminInstalacion("");
    setEmailAdminInstalacion("");
    setIdentificacionAdminInstalacion("");
    setTelefonoAdminInstalacion("");
  } catch (error) {
    console.error("Error registrando instalación:", error);
    alert("Ocurrió un error al enviar la solicitud.");
  } finally {
    setEnviandoInstalacion(false);
  }
};

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

  const cargarSolicitudesInstalacion = async (
  estado = filtroEstadoInstalacion
) => {
  setCargandoSolicitudes(true);
  setErrorSolicitudes("");

  try {
    const {
      data: { session },
      error: errorSesion,
    } = await supabase.auth.getSession();

    if (errorSesion || !session?.access_token) {
      setErrorSolicitudes("Tu sesión no es válida. Inicia sesión nuevamente.");
      return;
    }

    const query =
      estado !== "TODAS"
        ? `?estado=${encodeURIComponent(estado)}`
        : "";

    const response = await fetch(
      `/api/instalaciones${query}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      }
    );

    const resultado = await response.json();

    if (!response.ok || resultado.success === false) {
      setErrorSolicitudes(
        resultado.error || "No se pudieron cargar las solicitudes."
      );
      return;
    }

    setSolicitudesInstalacion(resultado.solicitudes || []);
  } catch (error) {
    console.error("Error cargando solicitudes:", error);
    setErrorSolicitudes("Error de conexión al consultar las solicitudes.");
  } finally {
    setCargandoSolicitudes(false);
  }
};


const actualizarSolicitudInstalacion = async (
  id: string,
  estado: string,
  etapa_actual: string,
  detalle_error = ""
) => {
  setErrorSolicitudes("");

  try {
    const {
      data: { session },
      error: errorSesion,
    } = await supabase.auth.getSession();

    if (errorSesion || !session?.access_token) {
      setErrorSolicitudes(
        "Tu sesión no es válida. Inicia sesión nuevamente."
      );
      return;
    }

    const response = await fetch("/api/instalaciones", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        id,
        estado,
        etapa_actual,
        error_etapa: estado === "ERROR" ? etapa_actual : "",
        detalle_error: estado === "ERROR" ? detalle_error : "",
      }),
    });

    const resultado = await response.json();

    if (!response.ok || resultado.success === false) {
      setErrorSolicitudes(
        resultado.error || "No se pudo actualizar la solicitud."
      );
      return;
    }

    await cargarSolicitudesInstalacion();
  } catch (error) {
    console.error("Error actualizando solicitud:", error);
    setErrorSolicitudes(
      "Error de conexión al actualizar la solicitud."
    );
  }
};


  const abrirEditorInfraestructura = (solicitud: any) => {
    setInstalacionInfraestructura(solicitud);
    setInfraProyectoSupabaseId(solicitud.proyecto_supabase_id || "");
    setInfraProyectoVercelId(solicitud.proyecto_vercel_id || "");
    setInfraUrlProduccion(solicitud.url_produccion || "");
    setInfraDominio(solicitud.dominio || "");
  };

  const guardarInfraestructura = async () => {
    if (!instalacionInfraestructura) return;

    const url = infraUrlProduccion.trim();
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error("Protocolo no válido");
        }
      } catch {
        alert("La URL de producción debe ser una dirección válida que comience con https:// o http://.");
        return;
      }
    }

    setGuardandoInfraestructura(true);
    setErrorSolicitudes("");

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        throw new Error("Tu sesión no es válida. Inicia sesión nuevamente.");
      }

      const response = await fetch("/api/instalaciones", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: instalacionInfraestructura.id,
          estado: instalacionInfraestructura.estado,
          etapa_actual: instalacionInfraestructura.etapa_actual,
          proyecto_supabase_id: infraProyectoSupabaseId.trim() || null,
          proyecto_vercel_id: infraProyectoVercelId.trim() || null,
          url_produccion: url || null,
          dominio: infraDominio.trim() || null,
        }),
      });

      const resultado = await response.json();
      if (!response.ok || resultado.success === false) {
        throw new Error(resultado.error || "No se pudieron guardar los datos de infraestructura.");
      }

      setInstalacionInfraestructura(null);
      await cargarSolicitudesInstalacion();
      alert("Datos de infraestructura guardados correctamente.");
    } catch (error) {
      const mensaje = error instanceof Error
        ? error.message
        : "Error al guardar los datos de infraestructura.";
      setErrorSolicitudes(mensaje);
      alert(mensaje);
    } finally {
      setGuardandoInfraestructura(false);
    }
  };

  const obtenerTokenSuperAdmin = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      throw new Error("Tu sesión no es válida. Inicia sesión nuevamente.");
    }
    return session.access_token;
  };

  const cargarVersiones = async () => {
    setCargandoVersiones(true);
    setErrorVersiones("");
    try {
      const token = await obtenerTokenSuperAdmin();
      const response = await fetch("/api/versiones", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const resultado = await response.json();
      if (!response.ok || resultado.success === false) {
        throw new Error(resultado.error || "No se pudo cargar el catálogo de versiones.");
      }
      setVersiones(resultado.versiones || []);
    } catch (error) {
      setErrorVersiones(error instanceof Error ? error.message : "Error al cargar las versiones.");
    } finally {
      setCargandoVersiones(false);
    }
  };

  const cargarActualizaciones = async () => {
    setCargandoActualizaciones(true);
    setErrorActualizaciones("");
    try {
      const token = await obtenerTokenSuperAdmin();
      const query = filtroEstadoActualizacion !== "TODAS"
        ? `?estado=${encodeURIComponent(filtroEstadoActualizacion)}`
        : "";
      const response = await fetch(`/api/actualizaciones${query}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const resultado = await response.json();
      if (!response.ok || resultado.success === false) {
        throw new Error(resultado.error || "No se pudo cargar el historial de actualizaciones.");
      }
      setActualizaciones(resultado.actualizaciones || []);
    } catch (error) {
      setErrorActualizaciones(error instanceof Error ? error.message : "Error al cargar las actualizaciones.");
    } finally {
      setCargandoActualizaciones(false);
    }
  };

  const registrarVersion = async () => {
    if (!versionNueva.trim() || !nombreVersionNueva.trim()) {
      alert("Ingresa la versión y el nombre de la versión.");
      return;
    }
    if (!/^\d+\.\d+\.\d+$/.test(versionNueva.trim())) {
      alert("La versión debe tener formato X.Y.Z, por ejemplo 1.0.0.");
      return;
    }
    if (versionMinimaNueva.trim() && !/^\d+\.\d+\.\d+$/.test(versionMinimaNueva.trim())) {
      alert("La versión mínima debe tener formato X.Y.Z.");
      return;
    }

    setGuardandoVersion(true);
    try {
      const token = await obtenerTokenSuperAdmin();
      const response = await fetch("/api/versiones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          version: versionNueva.trim(),
          nombre: nombreVersionNueva.trim(),
          notas_liberacion: notasVersionNueva.trim(),
          version_minima: versionMinimaNueva.trim() || null,
          referencia_codigo: referenciaCodigoNueva.trim() || null,
        }),
      });
      const resultado = await response.json();
      if (!response.ok || resultado.success === false) {
        alert(resultado.error || "No se pudo registrar la versión.");
        return;
      }
      alert("Versión registrada como borrador. Para planificar actualizaciones, deberá estar disponible.");
      setVersionNueva("");
      setNombreVersionNueva("");
      setNotasVersionNueva("");
      setVersionMinimaNueva("");
      setReferenciaCodigoNueva("");
      await cargarVersiones();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al registrar la versión.");
    } finally {
      setGuardandoVersion(false);
    }
  };

  const cambiarEstadoVersion = async (version: any, nuevoEstado: string) => {
    const acciones: Record<string, string> = {
      PILOTO: "enviar esta versión a pruebas piloto",
      DISPONIBLE: "publicar esta versión para las instalaciones",
      RETIRADA: "retirar esta versión del catálogo disponible",
    };

    const descripcion = acciones[nuevoEstado];
    if (!descripcion) {
      alert("La acción solicitada no es válida.");
      return;
    }

    const confirmacion = confirm(
      `¿Confirmas ${descripcion}?\n\nVersión: ${version.version}\nEstado actual: ${version.estado}\nNuevo estado: ${nuevoEstado}`
    );
    if (!confirmacion) return;

    setCambiandoEstadoVersionId(version.id);
    setErrorVersiones("");

    try {
      const token = await obtenerTokenSuperAdmin();
      const response = await fetch("/api/versiones", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: version.id,
          estado: nuevoEstado,
        }),
      });

      const resultado = await response.json();
      if (!response.ok || resultado.success === false) {
        throw new Error(resultado.error || "No se pudo cambiar el estado de la versión.");
      }

      await cargarVersiones();
      alert(resultado.message || "El estado de la versión se actualizó correctamente.");
    } catch (error) {
      const mensaje = error instanceof Error
        ? error.message
        : "Error al cambiar el estado de la versión.";
      setErrorVersiones(mensaje);
      alert(mensaje);
    } finally {
      setCambiandoEstadoVersionId(null);
    }
  };

  const planificarActualizacionManual = async () => {
    if (!instalacionParaActualizar || !versionDestinoActualizacion) {
      alert("Selecciona la instalación y la versión de destino.");
      return;
    }
    const instalacion = solicitudesInstalacion.find(
      (item) => item.id === instalacionParaActualizar
    );
    if (!instalacion) {
      alert("No se encontró la instalación seleccionada. Actualiza las solicitudes e inténtalo de nuevo.");
      return;
    }

    setPlanificandoActualizacion(true);
    try {
      const token = await obtenerTokenSuperAdmin();
      const response = await fetch("/api/actualizaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          solicitud_instalacion_id: instalacion.id,
          version_origen: instalacion.version_instalada || null,
          version_destino: versionDestinoActualizacion,
        }),
      });
      const resultado = await response.json();
      if (!response.ok || resultado.success === false) {
        alert(resultado.error || "No se pudo planificar la actualización.");
        return;
      }
      alert("Actualización planificada correctamente. Esta acción no ejecuta la actualización.");
      setInstalacionParaActualizar("");
      setVersionDestinoActualizacion("");
      await cargarActualizaciones();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al planificar la actualización.");
    } finally {
      setPlanificandoActualizacion(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarDatos();
      cargarSolicitudesInstalacion();
      cargarVersiones();
      cargarActualizaciones();

      setFechaActual(
        new Intl.DateTimeFormat("es-EC", {
          dateStyle: "long",
        }).format(new Date())
      );
    }
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
      !nombreAdmin.trim() ||
      !apellidoAdmin.trim() ||
      !emailAdmin.trim() ||
      !telefonoAdmin.trim() ||
      !identificacionAdmin.trim() ||
      !condominioAdmin
    ) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        alert("Tu sesión no es válida. Inicia sesión nuevamente.");
        return;
      }

      const response = await fetch("/api/usuarios/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          identificacion: identificacionAdmin.trim(),
          nombres: nombreAdmin.trim(),
          apellidos: apellidoAdmin.trim(),
          email: emailAdmin.trim(),
          telefono: telefonoAdmin.trim(),
          rol: "ADMIN",
          condominio_id: condominioAdmin,
          puede_votar: puedeVotar,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        alert(result.error || "Error creando administrador.");
        return;
      }

      alert("Administrador creado correctamente.");
      setNombreAdmin("");
      setApellidoAdmin("");
      setEmailAdmin("");
      setTelefonoAdmin("");
      setIdentificacionAdmin("");
      setCondominioAdmin("");
      setPuedeVotar(false);
      await cargarDatos();
    } catch (error) {
      console.error("Error creando administrador:", error);
      alert(error instanceof Error ? error.message : "Error interno del sistema.");
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

  const eliminarAdmin = async (id: string) => {
    const confirmar = confirm(
      "¿Deseas desactivar este administrador? Se conservarán su historial y sus registros."
    );

    if (!confirmar) return;

    try {
      const token = await obtenerTokenSuperAdmin();
      const response = await fetch("/api/usuarios/admin/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usuario_id: id }),
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.error || "No se pudo desactivar el administrador.");
      }

      alert(result.message || "Administrador desactivado correctamente.");
      await cargarDatos();
    } catch (error) {
      console.error("Error desactivando administrador:", error);
      alert(error instanceof Error ? error.message : "Error al desactivar el administrador.");
    }
  };

  // 🔥 EDITAR ADMIN

  // 🔥 EDITAR ADMIN

const editarAdmin = async (admin: any) => {
  const nuevoNombre = prompt("Nombre", admin.nombre || "");
  if (nuevoNombre === null) return;

  const nuevoApellido = prompt("Apellido", admin.apellido || "");
  if (nuevoApellido === null) return;

  const nuevoEmail = prompt("Correo electrónico", admin.email || "");
  if (nuevoEmail === null) return;

  const nuevoTelefono = prompt("Teléfono", admin.telefono || "");
  if (nuevoTelefono === null) return;

  const nuevaIdentificacion = prompt("Identificación", admin.identificacion || "");
  if (nuevaIdentificacion === null) return;

  const nuevoPuedeVotar = await preguntarPuedeVotar();

  const listaUrbanizaciones = condominios
    .map((c, index) => `${index + 1}. ${c.nombre}`)
    .join("\\n");

  const urbanizacionActual = condominios.find(
    (c) => c.id === admin.condominio_id
  );

  const seleccion = prompt(
    `Selecciona la urbanización:\\n\\n${listaUrbanizaciones}\\n\\nUrbanización actual: ${
      urbanizacionActual?.nombre || "Sin urbanización"
    }\\n\\nEscribe el número`,
    String(
      Math.max(
        0,
        condominios.findIndex((c) => c.id === admin.condominio_id)
      ) + 1
    )
  );

  if (seleccion === null) return;

  const indice = Number.parseInt(seleccion, 10) - 1;
  const urbanizacionSeleccionada = condominios[indice];

  if (!urbanizacionSeleccionada) {
    alert("Urbanización inválida.");
    return;
  }

  try {
    const token = await obtenerTokenSuperAdmin();
    const response = await fetch("/api/usuarios/admin/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        usuario_id: admin.id,
        nombre: nuevoNombre.trim(),
        apellido: nuevoApellido.trim(),
        email: nuevoEmail.trim(),
        telefono: nuevoTelefono.trim(),
        identificacion: nuevaIdentificacion.trim(),
        condominio_id: urbanizacionSeleccionada.id,
        puede_votar: nuevoPuedeVotar,
      }),
    });

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.error || "Error actualizando administrador.");
    }

    alert(result.message || "Administrador actualizado correctamente.");
    await cargarDatos();
  } catch (error) {
    console.error("Error actualizando administrador:", error);
    alert(error instanceof Error ? error.message : "Error actualizando administrador.");
  }
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

  // SUPER_ADMIN gestiona exclusivamente cuentas con rol ADMIN.
  const administradores = usuarios.filter((u) => {
    const rol = String(u.rol ?? "").trim().toUpperCase();
    const texto = `
      ${u.nombre || ""}
      ${u.apellido || ""}
      ${u.email || ""}
      ${u.identificacion || ""}
    `.toLowerCase();

    return rol === "ADMIN" && texto.includes(busquedaUsuario.toLowerCase());
  });

  const totalAdmins = usuarios.filter(
    (u) => String(u.rol ?? "").trim().toUpperCase() === "ADMIN"
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
              Indica si este administrador tiene permiso para votar.
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

      {instalacionInfraestructura && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-infraestructura"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            overflowY: "auto",
          }}
        >
          <div
            className="sa-card"
            style={{
              width: "100%",
              maxWidth: 680,
              padding: 24,
              margin: "auto",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 id="titulo-infraestructura" style={{ margin: "0 0 6px", fontSize: 20 }}>
              Datos de infraestructura
            </h2>
            <p className="sa-muted" style={{ marginTop: 0, marginBottom: 18 }}>
              {instalacionInfraestructura.nombre} · {instalacionInfraestructura.slug}
            </p>
            <p className="sa-muted">
              Registra estos datos después de crear manualmente los proyectos del cliente en Supabase y Vercel. No introduzcas contraseñas, claves privadas ni tokens.
            </p>
            <div className="sa-form-grid">
              <div>
                <label className="sa-label">ID del proyecto Supabase</label>
                <input className="sa-input" value={infraProyectoSupabaseId} onChange={(e) => setInfraProyectoSupabaseId(e.target.value)} maxLength={150} placeholder="Identificador del proyecto" />
              </div>
              <div>
                <label className="sa-label">ID del proyecto Vercel</label>
                <input className="sa-input" value={infraProyectoVercelId} onChange={(e) => setInfraProyectoVercelId(e.target.value)} maxLength={200} placeholder="Identificador del proyecto" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="sa-label">URL de producción</label>
                <input className="sa-input" type="url" value={infraUrlProduccion} onChange={(e) => setInfraUrlProduccion(e.target.value)} maxLength={500} placeholder="https://mi-urbanizacion.vercel.app" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="sa-label">Dominio personalizado (opcional)</label>
                <input className="sa-input" value={infraDominio} onChange={(e) => setInfraDominio(e.target.value)} maxLength={253} placeholder="www.mi-urbanizacion.com" />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              <button type="button" className="sa-secondary" onClick={() => setInstalacionInfraestructura(null)} disabled={guardandoInfraestructura}>
                Cancelar
              </button>
              <button type="button" className="sa-primary" onClick={guardarInfraestructura} disabled={guardandoInfraestructura}>
                {guardandoInfraestructura ? "Guardando..." : "Guardar datos"}
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
                  Gestiona urbanizaciones y administradores del sistema
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
                  El administrador tiene derecho a votar
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 11,
                    color: "#4b6354",
                  }}
                >
                  Activa esta opción si el administrador tiene derecho a voto.
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

        
{/* NUEVA INSTALACIÓN AUTOMATIZADA */}
<section className="sa-card" style={{ padding: 22, marginBottom: 22 }}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
      flexWrap: "wrap",
    }}
  >
    <div className="sa-icon" style={{ background: "#e7f8ef" }}>
      <span aria-hidden="true">🏢</span>
      </div>
    <div>
      <h2 style={{ margin: 0, fontSize: 19, color: "#166534" }}>
        Nueva instalación automatizada
      </h2>
      <div className="sa-muted">
        Registra una solicitud para preparar una instalación independiente de RENALIX.
      </div>
    </div>
  </div>

  <div className="sa-form-grid">
    <div>
      <label className="sa-label">Nombre de la urbanización *</label>
      <input
        className="sa-input"
        placeholder="Ej.: Urbanización El Bosque"
        value={nombreInstalacion}
        onChange={(e) => setNombreInstalacion(e.target.value)}
      />
    </div>

    <div>
      <label className="sa-label">Dirección *</label>
      <input
        className="sa-input"
        placeholder="Dirección de la urbanización"
        value={direccionInstalacion}
        onChange={(e) => setDireccionInstalacion(e.target.value)}
      />
    </div>

    <div>
      <label className="sa-label">Nombre del administrador *</label>
      <input
        className="sa-input"
        placeholder="Nombre completo"
        value={nombreAdminInstalacion}
        onChange={(e) => setNombreAdminInstalacion(e.target.value)}
      />
    </div>

    <div>
      <label className="sa-label">Correo del administrador *</label>
      <input
        className="sa-input"
        type="email"
        placeholder="administrador@ejemplo.com"
        value={emailAdminInstalacion}
        onChange={(e) => setEmailAdminInstalacion(e.target.value)}
      />
    </div>

    <div>
      <label className="sa-label">Identificación del administrador *</label>
      <input
        className="sa-input"
        placeholder="Número de identificación"
        value={identificacionAdminInstalacion}
        onChange={(e) => setIdentificacionAdminInstalacion(e.target.value)}
      />
    </div>

    <div>
      <label className="sa-label">Teléfono del administrador</label>
      <input
        className="sa-input"
        type="tel"
        placeholder="Teléfono de contacto"
        value={telefonoAdminInstalacion}
        onChange={(e) => setTelefonoAdminInstalacion(e.target.value)}
      />
    </div>
  </div>

  <p className="sa-muted" style={{ marginTop: 14 }}>
    Los campos marcados con * son obligatorios. El registro inicial no crea
    todavía los proyectos de Supabase ni Vercel.
  </p>

  <button
    type="button"
    onClick={registrarSolicitudInstalacion}
    disabled={enviandoInstalacion}
    className="sa-primary"
    style={{
      width: "100%",
      opacity: enviandoInstalacion ? 0.7 : 1,
      cursor: enviandoInstalacion ? "wait" : "pointer",
    }}
  >
    {enviandoInstalacion
      ? "Registrando solicitud..."
      : "Registrar solicitud de instalación"}
  </button>

</section>

{/* SEGUIMIENTO DE SOLICITUDES DE INSTALACIÓN */}
<section className="sa-card" style={{ marginBottom: 22 }}>
  <div style={{ padding: "18px 20px" }}>
    <h2 style={{ margin: 0, fontSize: 17 }}>
      Seguimiento de solicitudes de instalación
    </h2>
    <p className="sa-muted" style={{ marginTop: 8 }}>
      Consulta el estado y el avance de las solicitudes registradas.
    </p>

    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <select
        className="sa-input"
        value={filtroEstadoInstalacion}
        onChange={(e) => {
          const estado = e.target.value;
          setFiltroEstadoInstalacion(estado);
          cargarSolicitudesInstalacion(estado);
        }}
        style={{ maxWidth: 240 }}
      >
        <option value="TODAS">Todos los estados</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="EN_PROCESO">En proceso</option>
        <option value="ERROR">Con error</option>
        <option value="LISTA">Terminada</option>
        <option value="CANCELADA">Cancelada</option>
      </select>

      <button
        type="button"
        className="sa-primary"
        onClick={() => cargarSolicitudesInstalacion()}
        disabled={cargandoSolicitudes}
      >
        {cargandoSolicitudes ? "Actualizando..." : "Actualizar solicitudes"}
      </button>
    </div>

    {errorSolicitudes && (
      <p role="alert" style={{ color: "#b42318" }}>
        {errorSolicitudes}
      </p>
    )}

    {cargandoSolicitudes ? (
      <p className="sa-muted">Cargando solicitudes...</p>
    ) : solicitudesInstalacion.length === 0 ? (
      <p className="sa-muted">
        No hay solicitudes para el filtro seleccionado.
      </p>
    ) : (
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #edf0f6" }}>
              <th style={{ padding: 10 }}>Urbanización</th>
              <th style={{ padding: 10 }}>Administrador</th>
              <th style={{ padding: 10 }}>Estado</th>
              <th style={{ padding: 10 }}>Etapa</th>
              <th style={{ padding: 10 }}>Registro</th>
              <th style={{ padding: 10 }}>Detalle del error</th>
              <th style={{ padding: 10 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesInstalacion.map((solicitud) => (
              <tr
                key={solicitud.id}
                style={{ borderBottom: "1px solid #edf0f6" }}
              >
                <td style={{ padding: 10 }}>
                  <strong>{solicitud.nombre}</strong>
                  <div className="sa-muted">{solicitud.slug}</div>
                  {solicitud.url_produccion && (
                    <div style={{ marginTop: 4 }}>
                      <a href={solicitud.url_produccion} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", fontSize: 12 }}>
                        Abrir instalación
                      </a>
                    </div>
                  )}
                </td>
                <td style={{ padding: 10 }}>
                  {solicitud.nombre_administrador}
                  <div className="sa-muted">
                    {solicitud.email_administrador}
                  </div>
                </td>
                <td style={{ padding: 10 }}>{solicitud.estado === "LISTA" ? "TERMINADA" : solicitud.estado}</td>
                <td style={{ padding: 10 }}>{solicitud.etapa_actual}</td>
                <td style={{ padding: 10 }}>
                  {solicitud.created_at
                    ? new Date(solicitud.created_at).toLocaleString("es-EC")
                    : "—"}
                </td>
                
<td style={{ padding: 10 }}>
  {solicitud.detalle_error || solicitud.error_etapa || "—"}
</td>
<td style={{ padding: 10 }}>
  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
    <button
      type="button"
      className="sa-secondary"
      onClick={() => abrirEditorInfraestructura(solicitud)}
    >
      {solicitud.proyecto_supabase_id || solicitud.proyecto_vercel_id || solicitud.url_produccion
        ? "Editar datos de infraestructura"
        : "Registrar datos de infraestructura"}
    </button>
    {(solicitud.estado === "PENDIENTE" ||
      solicitud.estado === "ERROR") && (
      <button
        type="button"
        className="sa-primary"
        onClick={() =>
          actualizarSolicitudInstalacion(
            solicitud.id,
            "EN_PROCESO",
            solicitud.etapa_actual === "REGISTRO"
              ? "SUPABASE"
              : solicitud.etapa_actual
          )
        }
      >
        {solicitud.estado === "ERROR" ? "Reintentar" : "Iniciar proceso"}
      </button>
    )}

    {solicitud.estado === "EN_PROCESO" && (
      <button
        type="button"
        className="sa-primary"
        disabled={guardandoInfraestructura}
        onClick={() => {
          const faltantes = [];
          if (!solicitud.proyecto_supabase_id?.trim()) faltantes.push("ID del proyecto Supabase");
          if (!solicitud.proyecto_vercel_id?.trim()) faltantes.push("ID del proyecto Vercel");
          if (!solicitud.url_produccion?.trim()) faltantes.push("URL de producción");

          if (faltantes.length > 0) {
            alert(`No se puede finalizar. Primero registra:\n\n• ${faltantes.join("\n• ")}`);
            return;
          }

          const confirmar = window.confirm(
            `¿Confirmas que la instalación de "${solicitud.nombre}" fue creada y probada manualmente?\n\nSe registrará como TERMINADA. Esta acción cerrará el seguimiento de la solicitud.`
          );

          if (confirmar) {
            actualizarSolicitudInstalacion(
              solicitud.id,
              "LISTA",
              "COMPLETADO"
            );
          }
        }}
      >
        Finalizar instalación
      </button>
    )}

    {(solicitud.estado === "PENDIENTE" ||
      solicitud.estado === "EN_PROCESO" ||
      solicitud.estado === "ERROR") && (
      <>
        <button
          type="button"
          className="sa-primary"
          onClick={() => {
            const detalle = window.prompt(
              "Describe el error de la instalación:"
            );

            if (detalle?.trim()) {
              actualizarSolicitudInstalacion(
                solicitud.id,
                "ERROR",
                solicitud.etapa_actual,
                detalle.trim()
              );
            }
          }}
        >
          Registrar error
        </button>

        <button
          type="button"
          onClick={() => {
            const confirmar = window.confirm(
              `¿Deseas cancelar la solicitud "${solicitud.nombre}"?`
            );

            if (confirmar) {
              actualizarSolicitudInstalacion(
                solicitud.id,
                "CANCELADA",
                solicitud.etapa_actual
              );
            }
          }}
        >
          Cancelar solicitud
        </button>
      </>
    )}

    {(solicitud.estado === "LISTA" ||
      solicitud.estado === "CANCELADA") && (
      <span className="sa-muted">Sin acciones disponibles</span>
    )}
  </div>
</td>


              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
</section>

{/* URBANIZACIONES */}




        {/* CATÁLOGO DE VERSIONES */}
        <section className="sa-card" style={{ padding: 22, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <div className="sa-icon" style={{ background: "#efe9ff" }}>🧩</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: "#5b2dcc" }}>Catálogo de versiones de RENALIX</h2>
              <p className="sa-muted" style={{ margin: "5px 0 0" }}>Registra versiones y consulta el catálogo central del sistema.</p>
            </div>
            <button type="button" className="sa-secondary" style={{ marginLeft: "auto" }} onClick={cargarVersiones} disabled={cargandoVersiones}>
              {cargandoVersiones ? "Consultando..." : "Actualizar catálogo"}
            </button>
          </div>
          {errorVersiones && <p role="alert" style={{ color: "#b42318" }}>{errorVersiones}</p>}
          <div className="sa-grid-2">
            <div style={{ border: "1px solid #e7eaf3", borderRadius: 14, padding: 18 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>Registrar una versión</h3>
              <p className="sa-muted" style={{ marginTop: 0 }}>Las versiones se registran como borrador y avanzan por etapas: pruebas piloto, disponibilidad y retirada.</p>
              <div className="sa-form-grid">
                <div><label className="sa-label">Número de versión *</label><input className="sa-input" placeholder="Ej.: 1.2.0" value={versionNueva} onChange={(e) => setVersionNueva(e.target.value)} /></div>
                <div><label className="sa-label">Nombre *</label><input className="sa-input" placeholder="Ej.: Mejoras de seguridad" value={nombreVersionNueva} onChange={(e) => setNombreVersionNueva(e.target.value)} /></div>
                <div><label className="sa-label">Versión mínima requerida</label><input className="sa-input" placeholder="Ej.: 1.0.0" value={versionMinimaNueva} onChange={(e) => setVersionMinimaNueva(e.target.value)} /></div>
                <div><label className="sa-label">Referencia del código</label><input className="sa-input" placeholder="Etiqueta o referencia" value={referenciaCodigoNueva} onChange={(e) => setReferenciaCodigoNueva(e.target.value)} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label className="sa-label">Notas de lanzamiento</label><textarea className="sa-input" rows={4} placeholder="Describe las mejoras y correcciones incluidas." value={notasVersionNueva} onChange={(e) => setNotasVersionNueva(e.target.value)} /></div>
              </div>
              <button type="button" className="sa-primary" style={{ width: "100%", marginTop: 14 }} onClick={registrarVersion} disabled={guardandoVersion}>
                {guardandoVersion ? "Registrando..." : "Registrar como borrador"}
              </button>
            </div>
            <div style={{ border: "1px solid #e7eaf3", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Versiones registradas</h3><span className="sa-badge sa-role-admin">{versiones.length} versiones</span>
              </div>
              {cargandoVersiones ? <p className="sa-muted">Cargando versiones...</p> : versiones.length === 0 ? <p className="sa-muted">Todavía no hay versiones registradas.</p> : (
                <div className="sa-table-wrap"><table className="sa-table" style={{ minWidth: 980 }}>
                  
                <thead>
                  <tr>
                    <th>Versión</th>
                    <th>Nombre y notas de lanzamiento</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Publicación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {versiones.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.version}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{v.nombre || "—"}</div>
                        {v.notas_liberacion && (
                          <p
                            className="sa-muted"
                            style={{
                              margin: "6px 0 0",
                              whiteSpace: "normal",
                              lineHeight: 1.5,
                              minWidth: 240,
                              maxWidth: 440,
                            }}
                          >
                            {v.notas_liberacion}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="sa-badge sa-role-admin">{v.estado || "—"}</span>
                      </td>
                      <td>{v.created_at ? new Date(v.created_at).toLocaleDateString("es-EC") : "—"}</td>
                      <td>{v.publicada_at ? new Date(v.publicada_at).toLocaleDateString("es-EC") : "—"}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 150 }}>
                          {v.estado === "BORRADOR" && (
                            <button
                              type="button"
                              className="sa-secondary"
                              onClick={() => cambiarEstadoVersion(v, "PILOTO")}
                              disabled={cambiandoEstadoVersionId !== null}
                            >
                              {cambiandoEstadoVersionId === v.id ? "Procesando..." : "Enviar a piloto"}
                            </button>
                          )}
                          {v.estado === "PILOTO" && (
                            <>
                              <button
                                type="button"
                                className="sa-primary"
                                style={{ padding: "9px 12px" }}
                                onClick={() => cambiarEstadoVersion(v, "DISPONIBLE")}
                                disabled={cambiandoEstadoVersionId !== null}
                              >
                                {cambiandoEstadoVersionId === v.id ? "Procesando..." : "Publicar versión"}
                              </button>
                            </>
                          )}
                          {v.estado === "DISPONIBLE" && (
                            <button
                              type="button"
                              className="sa-danger"
                              onClick={() => cambiarEstadoVersion(v, "RETIRADA")}
                              disabled={cambiandoEstadoVersionId !== null}
                            >
                              {cambiandoEstadoVersionId === v.id ? "Procesando..." : "Retirar versión"}
                            </button>
                          )}
                          {v.estado === "RETIRADA" && <span className="sa-muted">Sin acciones</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>  
                  
              </table></div>
              )}
            </div>
          </div>
        </section>

        {/* PLANIFICACIÓN DE ACTUALIZACIONES */}
        <section className="sa-card" style={{ padding: 22, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div className="sa-icon" style={{ background: "#e7f8ef" }}>🔄</div>
            <div><h2 style={{ margin: 0, fontSize: 20, color: "#166534" }}>Planificación de actualizaciones</h2><p className="sa-muted" style={{ margin: "5px 0 0" }}>Selecciona una instalación y una versión de destino.</p></div>
          </div>
          <div style={{ border: "1px solid #f3dfb8", background: "#fffbeb", color: "#854d0e", borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 16 }}>
            Planificar no instala ni modifica el sistema de la urbanización. La ejecución automática aún no está habilitada.
          </div>
          <div className="sa-form-grid">
            <div><label className="sa-label">Instalación *</label><select className="sa-select" value={instalacionParaActualizar} onChange={(e) => setInstalacionParaActualizar(e.target.value)}><option value="">Seleccionar instalación</option>{solicitudesInstalacion.map((i) => <option key={i.id} value={i.id}>{i.nombre} · {i.estado} · {i.version_instalada || "Sin versión registrada"}</option>)}</select></div>
            <div><label className="sa-label">Versión de destino disponible *</label><select className="sa-select" value={versionDestinoActualizacion} onChange={(e) => setVersionDestinoActualizacion(e.target.value)}><option value="">Seleccionar versión disponible</option>{versiones.filter((v) => v.estado === "DISPONIBLE").map((v) => <option key={v.id} value={v.version}>{v.version} · {v.nombre}</option>)}</select></div>
          </div>
          <p className="sa-muted" style={{ marginTop: 10 }}>Solo se pueden elegir versiones marcadas como disponibles en el catálogo.</p>
          <button type="button" className="sa-primary" style={{ marginTop: 8 }} onClick={planificarActualizacionManual} disabled={planificandoActualizacion}>{planificandoActualizacion ? "Planificando..." : "Registrar planificación"}</button>
        </section>

        {/* HISTORIAL DE ACTUALIZACIONES */}
        <section className="sa-card" style={{ marginBottom: 22 }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #edf0f6", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Historial de actualizaciones</h2><p className="sa-muted" style={{ margin: "5px 0 0" }}>Consulta las planificaciones registradas y su estado.</p></div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select className="sa-select" style={{ width: 190 }} value={filtroEstadoActualizacion} onChange={(e) => setFiltroEstadoActualizacion(e.target.value)}>
                <option value="TODAS">Todos los estados</option><option value="PLANIFICADA">Planificada</option><option value="PENDIENTE">Pendiente</option><option value="EN_PROCESO">En proceso</option><option value="EXITOSA">Exitosa</option><option value="ERROR">Error</option><option value="CANCELADA">Cancelada</option><option value="REVERSADA">Reversada</option>
              </select>
              <button type="button" className="sa-secondary" onClick={cargarActualizaciones} disabled={cargandoActualizaciones}>{cargandoActualizaciones ? "Consultando..." : "Actualizar historial"}</button>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {errorActualizaciones && <p role="alert" style={{ color: "#b42318" }}>{errorActualizaciones}</p>}
            {cargandoActualizaciones ? <p className="sa-muted">Cargando historial...</p> : actualizaciones.length === 0 ? <p className="sa-muted">No hay actualizaciones para el filtro seleccionado.</p> : (
              <div className="sa-table-wrap"><table className="sa-table" style={{ minWidth: 760 }}>
                <thead><tr><th>Instalación</th><th>Versión de origen</th><th>Versión de destino</th><th>Estado</th><th>Etapa</th><th>Fecha</th></tr></thead>
                <tbody>{actualizaciones.map((a) => {
                  const instalacion = solicitudesInstalacion.find((i) => i.id === a.solicitud_instalacion_id);
                  return <tr key={a.id}><td>{instalacion?.nombre || a.solicitud_instalacion_id}</td><td>{a.version_origen || "—"}</td><td><strong>{a.version_destino}</strong></td><td><span className="sa-badge sa-role-admin">{a.estado}</span></td><td>{a.etapa_actual || "—"}</td><td>{a.created_at ? new Date(a.created_at).toLocaleString("es-EC") : "—"}</td></tr>;
                })}</tbody>
              </table></div>
            )}
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

        {/* ADMINISTRADORES */}
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
                  Administradores
                </h2>
                <div className="sa-muted">
                  {administradores.length} administradores
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
            {administradores.length === 0 ? (
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
                  {administradores.map((a) => {
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
                                  "#e8f1ff",
                                fontSize: 15,
                              }}
                            >
                              👤
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
                            className="sa-badge sa-role-admin"
                          >
                            ADMIN
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
                          <span
                            className="sa-badge"
                            style={{
                              background: a.activo === false ? "#f1f3f7" : "#e8f8ef",
                              color: a.activo === false ? "#667085" : "#15803d",
                            }}
                          >
                            {a.activo === false ? "● Inactivo" : "● Activo"}
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
