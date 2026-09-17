"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Usuario = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  condominio_id: string;
};

type Residente = {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string | null;
  vivienda_id: string | null;
  condominio_id: string;
};

type Vivienda = {
  id: string;
  codigo_vivienda: string;
  tipo_vivienda: string | null;
  condominio_id: string;
};

type Resultado = {
  residente: Residente;
  vivienda: Vivienda | null;
};

export default function PaqueteriaPage() {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const rol = (usuario?.rol || "").toUpperCase().trim();

  console.log("👤 ROL PAQUETERÍA:", rol);

  const [busqueda, setBusqueda] = useState("");

  const [resultados, setResultados] = useState<Resultado[]>([]);

  const [seleccionado, setSeleccionado] =
    useState<Resultado | null>(null);

    const [empresaEntrega, setEmpresaEntrega] =
  useState("");

const [descripcion, setDescripcion] =
  useState("");

const [observacion, setObservacion] =
  useState("");

const [registrando, setRegistrando] =
  useState(false);

const [mensajeRegistro, setMensajeRegistro] =
  useState("");

  const [paquetesPendientes, setPaquetesPendientes] =
  useState<any[]>([]);

const [cargandoPaquetes, setCargandoPaquetes] =
  useState(false);

  const [mostrarHistorial, setMostrarHistorial] =
  useState(false);

  // Controla si dentro del historial se muestran todos los registros
  // o solamente los 2 más recientes. No debe confundirse con la pestaña Historial.
  const [mostrarTodoHistorial, setMostrarTodoHistorial] =
  useState(false);

const [historialPaquetes, setHistorialPaquetes] =
  useState<any[]>([]);

const [cargandoHistorial, setCargandoHistorial] =
  useState(false);

const [busquedaHistorial, setBusquedaHistorial] =
  useState("");

  const [paqueteEntrega, setPaqueteEntrega] =
  useState<any | null>(null);

const [nombreReceptor, setNombreReceptor] =
  useState("");

const [cedulaReceptor, setCedulaReceptor] =
  useState("");

const [relacionReceptor, setRelacionReceptor] =
  useState("");

const [sinCedula, setSinCedula] =
  useState(false);

const [entregando, setEntregando] =
  useState(false);

const [mensajeEntrega, setMensajeEntrega] =
  useState("");

  const [cargandoUsuario, setCargandoUsuario] =
    useState(true);

  const [buscando, setBuscando] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // CARGAR USUARIO AUTENTICADO
  // ==========================================

  useEffect(() => {
    const cargarUsuario = async () => {
      setCargandoUsuario(true);
      setError("");

      try {
        const {
          data: { user },
          error: errorAuth,
        } = await supabase.auth.getUser();

        if (errorAuth) {
          throw errorAuth;
        }

        if (!user) {
          throw new Error(
            "No existe un usuario autenticado."
          );
        }

        const { data, error: errorUsuario } =
          await supabase
            .from("usuarios")
            .select(
              "id,nombre,apellido,rol,condominio_id"
            )
            .eq("auth_user_id", user.id)
            .single();

        if (errorUsuario) {
          throw errorUsuario;
        }

        if (!data) {
          throw new Error(
            "No se encontró el registro del usuario."
          );
        }

        setUsuario(data);
      } catch (err) {
        console.error(
          "❌ Error cargando usuario:",
          err
        );

        setError(
          "No fue posible obtener la información del usuario."
        );
      } finally {
        setCargandoUsuario(false);
      }
    };

    cargarUsuario();
  }, []);

  useEffect(() => {
  if (!usuario) return;

  cargarPaquetesPendientes();
}, [usuario]);


  // ==========================================
  // BUSCAR
  // ==========================================

  useEffect(() => {
    if (!usuario) return;

    const termino = busqueda.trim();

    if (termino.length < 2) {
      setResultados([]);
      setSeleccionado(null);
      setError("");
      return;
    }

    const ejecutarBusqueda = async () => {
      setBuscando(true);
      setError("");

      try {
        // ======================================
        // 1. BUSCAR RESIDENTES
        // ======================================

        const {
          data: residentes,
          error: errorResidentes,
        } = await supabase
          .from("residentes")
          .select(
            "id,nombre,identificacion,telefono,vivienda_id,condominio_id"
          )
          .eq(
            "condominio_id",
            usuario.condominio_id
          )
          .or(
            `nombre.ilike.%${termino}%,identificacion.ilike.%${termino}%`
          )
          .limit(10);

        if (errorResidentes) {
          throw errorResidentes;
        }

        const residentesEncontrados =
          residentes || [];

        console.log(
          "🔎 RESIDENTES ENCONTRADOS:",
          residentesEncontrados
        );

        // ======================================
        // 2. CONSTRUIR RESULTADOS POR RESIDENTE
        // ======================================

        const resultadosPorResidente: Resultado[] =
          [];

        for (
          const residente of residentesEncontrados
        ) {
          let vivienda: Vivienda | null = null;

          // --------------------------------------
          // Buscar vivienda directamente por
          // residentes.vivienda_id
          // --------------------------------------

          if (residente.vivienda_id) {
            const {
              data: viviendaEncontrada,
              error: errorVivienda,
            } = await supabase
              .from("viviendas")
              .select(
                "id,codigo_vivienda,tipo_vivienda,condominio_id"
              )
              .eq(
                "id",
                residente.vivienda_id
              )
              .eq(
                "condominio_id",
                usuario.condominio_id
              )
              .maybeSingle();

            if (errorVivienda) {
              console.error(
                "⚠️ Error buscando vivienda:",
                errorVivienda
              );
            }

            if (viviendaEncontrada) {
              vivienda = viviendaEncontrada;
            }
          }

          console.log(
            "👤 RESIDENTE:",
            residente.nombre
          );

          console.log(
            "🏠 vivienda_id del residente:",
            residente.vivienda_id
          );

          console.log(
            "🏠 VIVIENDA ENCONTRADA:",
            vivienda
          );

          resultadosPorResidente.push({
            residente,
            vivienda,
          });
        }

        // ======================================
        // 3. BUSCAR DIRECTAMENTE POR VIVIENDA
        // ======================================

        const {
          data: viviendasEncontradas,
          error: errorViviendas,
        } = await supabase
          .from("viviendas")
          .select(
            "id,codigo_vivienda,tipo_vivienda,condominio_id"
          )
          .eq(
            "condominio_id",
            usuario.condominio_id
          )
          .ilike(
            "codigo_vivienda",
            `%${termino}%`
          )
          .limit(10);

        if (errorViviendas) {
          throw errorViviendas;
        }

        console.log(
          "🏠 VIVIENDAS ENCONTRADAS POR CÓDIGO:",
          viviendasEncontradas
        );

        // ======================================
        // 4. PARA CADA VIVIENDA ENCONTRADA,
        //    BUSCAR SUS RESIDENTES
        // ======================================

        for (
          const vivienda of viviendasEncontradas ||
          []
        ) {
          const {
            data: residentesVivienda,
            error: errorRV,
          } = await supabase
            .from("residentes")
            .select(
              "id,nombre,identificacion,telefono,vivienda_id,condominio_id"
            )
            .eq(
              "condominio_id",
              usuario.condominio_id
            )
            .eq(
              "vivienda_id",
              vivienda.id
            )
            .limit(10);

          if (errorRV) {
            console.error(
              "⚠️ Error buscando residentes de vivienda:",
              errorRV
            );

            continue;
          }

          for (
            const residente of residentesVivienda ||
            []
          ) {
            const yaExiste =
              resultadosPorResidente.some(
                (resultado) =>
                  resultado.residente.id ===
                  residente.id
              );

            if (!yaExiste) {
              resultadosPorResidente.push({
                residente,
                vivienda,
              });
            }
          }
        }

        // ======================================
        // 5. LIMPIAR DUPLICADOS
        // ======================================

        const resultadosUnicos =
          resultadosPorResidente.filter(
            (resultado, index, array) =>
              index ===
              array.findIndex(
                (item) =>
                  item.residente.id ===
                  resultado.residente.id
              )
          );

        console.log(
          "📦 RESULTADOS FINALES:",
          resultadosUnicos
        );

        setResultados(
          resultadosUnicos.slice(0, 10)
        );

        // Si la búsqueda cambió,
        // quitamos selección anterior.
        setSeleccionado(null);
      } catch (err) {
        console.error(
          "❌ Error realizando búsqueda:",
          err
        );

        setResultados([]);

        setError(
          "No fue posible realizar la búsqueda."
        );
      } finally {
        setBuscando(false);
      }
    };

    // Esperar 300 ms después de escribir
    const temporizador =
      setTimeout(
        ejecutarBusqueda,
        300
      );

    return () => {
      clearTimeout(temporizador);
    };
  }, [busqueda, usuario]);

  // ==========================================
  // SELECCIONAR DESTINATARIO
  // ==========================================

  const seleccionarDestinatario = (
    resultado: Resultado
  ) => {
    setSeleccionado(resultado);
  };

  // ==========================================
  // LIMPIAR SELECCIÓN
  // ==========================================

const cargarPaquetesPendientes = async () => {
  if (!usuario) return;

  setCargandoPaquetes(true);

  try {
    // ==========================================
    // OBTENER PAQUETES PENDIENTES
    // ==========================================

    const {
      data: paquetes,
      error: errorPaquetes,
    } = await supabase
      .from("paqueteria")
      .select(
        `
        id,
        residente_id,
        vivienda_id,
        empresa_entrega,
        descripcion,
        estado,
        fecha_recepcion,
        observacion
        `
      )
      .eq(
        "condominio_id",
        usuario.condominio_id
      )
      .eq(
        "estado",
        "PENDIENTE"
      )
      .order(
        "fecha_recepcion",
        {
          ascending: false,
        }
      );

    if (errorPaquetes) {
      throw errorPaquetes;
    }

    if (!paquetes || paquetes.length === 0) {
      setPaquetesPendientes([]);
      return;
    }

    // ==========================================
    // IDS DE RESIDENTES
    // ==========================================

    const residentesIds = [
      ...new Set(
        paquetes
          .map((p) => p.residente_id)
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // IDS DE VIVIENDAS
    // ==========================================

    const viviendasIds = [
      ...new Set(
        paquetes
          .map((p) => p.vivienda_id)
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // BUSCAR RESIDENTES
    // ==========================================

    const {
      data: residentes,
      error: errorResidentes,
    } = await supabase
      .from("residentes")
      .select(
        "id,nombre,identificacion"
      )
      .in(
        "id",
        residentesIds
      );

    if (errorResidentes) {
      throw errorResidentes;
    }

    // ==========================================
    // BUSCAR VIVIENDAS
    // ==========================================

    const {
      data: viviendas,
      error: errorViviendas,
    } = await supabase
      .from("viviendas")
      .select(
        "id,codigo_vivienda,tipo_vivienda"
      )
      .in(
        "id",
        viviendasIds
      );

    if (errorViviendas) {
      throw errorViviendas;
    }

    // ==========================================
    // CREAR MAPAS
    // ==========================================

    const residentesMap = new Map(
      (residentes || []).map(
        (r) => [r.id, r]
      )
    );

    const viviendasMap = new Map(
      (viviendas || []).map(
        (v) => [v.id, v]
      )
    );

    // ==========================================
    // ARMAR RESULTADO FINAL
    // ==========================================

    const resultado = paquetes.map(
      (paquete) => ({
        ...paquete,

        residente:
          residentesMap.get(
            paquete.residente_id
          ) || null,

        vivienda:
          viviendasMap.get(
            paquete.vivienda_id
          ) || null,
      })
    );

    console.log(
      "📦 PAQUETES PENDIENTES:",
      resultado
    );

    setPaquetesPendientes(resultado);

  } catch (error) {

    console.error(
      "❌ Error cargando paquetes pendientes:",
      error
    );

    setPaquetesPendientes([]);

  } finally {

    setCargandoPaquetes(false);

  }
};

const cargarHistorialPaquetes = async () => {
  if (!usuario) {
    console.log("⚠️ No existe usuario.");
    return;
  }

  setCargandoHistorial(true);

  try {
    console.log(
      "🔎 Cargando historial del condominio:",
      usuario.condominio_id
    );

    const {
      data: paquetes,
      error: errorPaquetes,
    } = await supabase
      .from("paqueteria")
      .select(
        `
        id,
        condominio_id,
        residente_id,
        vivienda_id,
        guardia_id,
        entregado_por,
        empresa_entrega,
        descripcion,
        estado,
        fecha_recepcion,
        fecha_entrega,
        entregado_a,
        entregado_identificacion,
        relacion_receptor,
        observacion,
        foto_url
        `
      )
      .eq(
        "condominio_id",
        usuario.condominio_id
      )
      .order(
        "fecha_recepcion",
        {
          ascending: false,
        }
      );

    if (errorPaquetes) {
      console.error(
        "❌ Error consultando paqueteria:",
        errorPaquetes
      );

      throw errorPaquetes;
    }

    console.log(
      "📦 PAQUETES ENCONTRADOS:",
      paquetes
    );

    if (!paquetes || paquetes.length === 0) {
      console.log(
        "📭 No existen paquetes para este condominio."
      );

      setHistorialPaquetes([]);
      return;
    }

    // ==========================================
    // IDS DE RESIDENTES
    // ==========================================

    const residentesIds = [
      ...new Set(
        paquetes
          .map(
            (paquete) =>
              paquete.residente_id
          )
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // IDS DE VIVIENDAS
    // ==========================================

    const viviendasIds = [
      ...new Set(
        paquetes
          .map(
            (paquete) =>
              paquete.vivienda_id
          )
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // IDS DE USUARIOS
    // ==========================================

    const usuariosIds = [
      ...new Set(
        paquetes
          .flatMap((paquete) => [
            paquete.guardia_id,
            paquete.entregado_por,
          ])
          .filter(Boolean)
      ),
    ];

    // ==========================================
    // RESIDENTES
    // ==========================================

    const {
      data: residentes,
      error: errorResidentes,
    } = await supabase
      .from("residentes")
      .select(
        "id,nombre,identificacion"
      )
      .in(
        "id",
        residentesIds
      );

    if (errorResidentes) {
      throw errorResidentes;
    }

    // ==========================================
    // VIVIENDAS
    // ==========================================

    const {
      data: viviendas,
      error: errorViviendas,
    } = await supabase
      .from("viviendas")
      .select(
        "id,codigo_vivienda,tipo_vivienda"
      )
      .in(
        "id",
        viviendasIds
      );

    if (errorViviendas) {
      throw errorViviendas;
    }

    // ==========================================
    // USUARIOS
    // ==========================================

    const {
      data: usuarios,
      error: errorUsuarios,
    } = await supabase
      .from("usuarios")
      .select(
        "id,nombre,apellido,identificacion,rol"
      )
      .in(
        "id",
        usuariosIds
      );

    if (errorUsuarios) {
      throw errorUsuarios;
    }

    console.log(
      "👤 RESIDENTES:",
      residentes
    );

    console.log(
      "🏠 VIVIENDAS:",
      viviendas
    );

    console.log(
      "👮 USUARIOS PAQUETERÍA:",
      usuarios
    );

    // ==========================================
    // MAPAS
    // ==========================================

    const residentesMap = new Map(
      (residentes || []).map(
        (residente) => [
          residente.id,
          residente,
        ]
      )
    );

    const viviendasMap = new Map(
      (viviendas || []).map(
        (vivienda) => [
          vivienda.id,
          vivienda,
        ]
      )
    );

    const usuariosMap = new Map(
      (usuarios || []).map(
        (usuarioPaquete) => [
          usuarioPaquete.id,
          usuarioPaquete,
        ]
      )
    );

    // ==========================================
    // RESULTADO FINAL
    // ==========================================

    const resultado = paquetes.map(
      (paquete) => ({
        ...paquete,

        residente:
          residentesMap.get(
            paquete.residente_id
          ) || null,

        vivienda:
          viviendasMap.get(
            paquete.vivienda_id
          ) || null,

        recibido_por:
          usuariosMap.get(
            paquete.guardia_id
          ) || null,

        entregado_por_usuario:
          usuariosMap.get(
            paquete.entregado_por
          ) || null,
      })
    );

    console.log(
      "🗂️ HISTORIAL FINAL:",
      resultado
    );

    setHistorialPaquetes(
      resultado
    );

  } catch (error) {

    console.error(
      "❌ Error cargando historial:",
      error
    );

    setHistorialPaquetes([]);

  } finally {

    setCargandoHistorial(false);

  }
};

const confirmarEntrega = async () => {
  if (!usuario) {
    setMensajeEntrega(
      "No se encontró el usuario actual."
    );
    return;
  }

  if (!paqueteEntrega) {
    setMensajeEntrega(
      "No se seleccionó ningún paquete."
    );
    return;
  }

  if (!nombreReceptor.trim()) {
    setMensajeEntrega(
      "Debe ingresar el nombre de quien retira el paquete."
    );
    return;
  }

  if (!relacionReceptor) {
    setMensajeEntrega(
      "Debe seleccionar la relación con el residente."
    );
    return;
  }

  if (
    !sinCedula &&
    !cedulaReceptor.trim()
  ) {
    setMensajeEntrega(
      "Ingrese la cédula o marque 'No presenta / no conoce su cédula'."
    );
    return;
  }

  setEntregando(true);
  setMensajeEntrega("");

  try {
    const { error } = await supabase
      .from("paqueteria")
      .update({
        estado: "ENTREGADO",

        fecha_entrega:
          new Date().toISOString(),

        entregado_a:
          nombreReceptor.trim(),

        entregado_identificacion:
          sinCedula
            ? null
            : cedulaReceptor.trim(),

        relacion_receptor:
          relacionReceptor,

        // Usuario que REALIZA la entrega
        entregado_por:
          usuario.id,
      })
      .eq(
        "id",
        paqueteEntrega.id
      )
      .eq(
        "estado",
        "PENDIENTE"
      );

    if (error) {
      throw error;
    }

    setMensajeEntrega(
      "✅ Paquete entregado correctamente."
    );

    // Limpiar formulario
    setNombreReceptor("");
    setCedulaReceptor("");
    setRelacionReceptor("");
    setSinCedula(false);
    setPaqueteEntrega(null);

    // Actualizar lista
    await cargarPaquetesPendientes();

  } catch (error) {

    console.error(
      "❌ Error entregando paquete:",
      error
    );

    setMensajeEntrega(
      "No fue posible registrar la entrega."
    );

  } finally {

    setEntregando(false);

  }
};

const registrarPaquete = async () => {
  if (!usuario) {
    setMensajeRegistro(
      "No se encontró el usuario actual."
    );
    return;
  }

  if (!seleccionado) {
    setMensajeRegistro(
      "Debe seleccionar un destinatario."
    );
    return;
  }

  if (!seleccionado.vivienda) {
    setMensajeRegistro(
      "El destinatario no tiene una vivienda asociada."
    );
    return;
  }

  setRegistrando(true);
  setMensajeRegistro("");

  try {
    const { error } = await supabase
      .from("paqueteria")
      .insert({
        condominio_id:
          usuario.condominio_id,

        residente_id:
          seleccionado.residente.id,

        vivienda_id:
          seleccionado.vivienda.id,

        guardia_id:
          usuario.id,

        empresa_entrega:
          empresaEntrega.trim() || null,

        descripcion:
          descripcion.trim() || null,

        estado: "PENDIENTE",

        observacion:
          observacion.trim() || null,

        fecha_recepcion:
          new Date().toISOString(),
      });

    if (error) {
      console.error(
        "❌ Error registrando paquete:",
        error
      );

      throw error;
    }

    setMensajeRegistro(
      "✅ Paquete registrado correctamente."
    );
     await cargarPaquetesPendientes();

    // Limpiar formulario
    setEmpresaEntrega("");
    setDescripcion("");
    setObservacion("");

  } catch (error) {

    console.error(
      "❌ Error:",
      error
    );

    setMensajeRegistro(
      "No fue posible registrar el paquete."
    );

  } finally {

    setRegistrando(false);

  }
};

  const limpiarSeleccion = () => {
    setSeleccionado(null);
    setBusqueda("");
    setResultados([]);
  };

  const terminoHistorial = busquedaHistorial.trim().toLowerCase();

  const historialFiltrado = historialPaquetes.filter((paquete) => {
    if (!terminoHistorial) return true;

    const texto = [
      paquete.residente?.nombre,
      paquete.residente?.identificacion,
      paquete.vivienda?.codigo_vivienda,
      paquete.empresa_entrega,
      paquete.descripcion,
      paquete.estado,
      paquete.entregado_a,
      paquete.entregado_identificacion,
      paquete.relacion_receptor,
      paquete.observacion,
      paquete.recibido_por?.nombre,
      paquete.recibido_por?.apellido,
      paquete.entregado_por_usuario?.nombre,
      paquete.entregado_por_usuario?.apellido,
      paquete.fecha_recepcion,
      paquete.fecha_entrega,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return texto.includes(terminoHistorial);
  });

  const historialVisible = terminoHistorial || mostrarTodoHistorial
    ? historialFiltrado
    : historialFiltrado.slice(0, 2);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
      }}
    >
      {/* ======================================
          ENCABEZADO
          ====================================== */}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>
          📦 Paquetería
        </h1>

        <p style={{ marginTop: 8, color: "#6b7280" }}>
          Registro y control de paquetes.
        </p>

        {/* ======================================
            BOTONES PRINCIPALES
            ====================================== */}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMostrarHistorial(false);
              setMostrarTodoHistorial(false);
              cargarPaquetesPendientes();
            }}
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              background: !mostrarHistorial ? "#111827" : "#f3f4f6",
              color: !mostrarHistorial ? "#ffffff" : "#374151",
            }}
          >
            📋 Pendientes
          </button>

          <button
            type="button"
            onClick={() => {
              setMostrarHistorial(true);
              setMostrarTodoHistorial(false);
              cargarHistorialPaquetes();
            }}
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              background: mostrarHistorial ? "#111827" : "#f3f4f6",
              color: mostrarHistorial ? "#ffffff" : "#374151",
            }}
          >
            🗂️ Historial
          </button>
        </div>
      </div>

      {/* ======================================
          CARGANDO USUARIO
          ====================================== */}

      {cargandoUsuario && (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "#f3f4f6",
          }}
        >
          Cargando información...
        </div>
      )}

      {/* ======================================
          ERROR
          ====================================== */}

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {!cargandoUsuario && usuario && (
        <>
          {/* ==================================
              BUSCADOR
              SOLO GUARDIA Y ADMIN
              ================================== */}

          {(rol === "GUARDIA" || rol === "ADMIN") && (
            <>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  🔎 Buscar destinatario
                </label>

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Vivienda, residente o cédula..."
                  autoComplete="off"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 15px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    fontSize: 16,
                    outline: "none",
                  }}
                />

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Puede buscar por nombre, cédula o código de vivienda.
                </div>
              </div>

              {/* ==================================
                  BUSCANDO
                  ================================== */}

              {buscando && (
                <div style={{ marginTop: 16, color: "#6b7280" }}>
                  🔎 Buscando...
                </div>
              )}

              {/* ==================================
                  RESULTADOS
                  ================================== */}

              {!buscando &&
                busqueda.trim().length >= 2 &&
                resultados.length > 0 && (
                  <div
                    style={{
                      marginTop: 20,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    {resultados.map((resultado) => (
                      <div
                        key={resultado.residente.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 18,
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          👤 {resultado.residente.nombre}
                        </div>

                        <div style={{ marginTop: 8, color: "#374151" }}>
                          🪪 {resultado.residente.identificacion}
                        </div>

                        <div style={{ marginTop: 8, color: "#374151" }}>
                          🏠 {resultado.vivienda?.codigo_vivienda || "Sin vivienda asociada"}
                        </div>

                        {resultado.vivienda?.tipo_vivienda && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              color: "#6b7280",
                            }}
                          >
                            {resultado.vivienda.tipo_vivienda}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => seleccionarDestinatario(resultado)}
                          style={{
                            marginTop: 14,
                            width: "100%",
                            padding: "12px 14px",
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          SELECCIONAR DESTINATARIO
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              {/* ==================================
                  SIN RESULTADOS
                  ================================== */}

              {!buscando &&
                busqueda.trim().length >= 2 &&
                resultados.length === 0 &&
                !error && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 20,
                      textAlign: "center",
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderRadius: 12,
                    }}
                  >
                    No se encontraron residentes o viviendas.
                  </div>
                )}

              {/* ==================================
                  DESTINATARIO SELECCIONADO
                  ================================== */}

              {seleccionado && (
                <div
                  style={{
                    marginTop: 24,
                    padding: 20,
                    borderRadius: 14,
                    border: "2px solid #16a34a",
                    background: "#f0fdf4",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    ✅ Destinatario seleccionado
                  </div>

                  <div style={{ marginTop: 12 }}>
                    👤 {seleccionado.residente.nombre}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    🪪 {seleccionado.residente.identificacion}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    🏠 {seleccionado.vivienda?.codigo_vivienda || "Sin vivienda asociada"}
                  </div>

                  {seleccionado.vivienda?.tipo_vivienda && (
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      {seleccionado.vivienda.tipo_vivienda}
                    </div>
                  )}

                  {/* ==================================
                      FORMULARIO DEL PAQUETE
                      SOLO GUARDIA
                      ================================== */}

                  {rol === "GUARDIA" && (
                    <div
                      style={{
                        marginTop: 20,
                        paddingTop: 20,
                        borderTop: "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 16,
                        }}
                      >
                        📦 Registrar paquete
                      </div>

                      <label
                        style={{
                          display: "block",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Empresa de entrega
                        <span style={{ fontWeight: 400, color: "#6b7280" }}>
                          {" "}(opcional)
                        </span>
                      </label>

                      <input
                        type="text"
                        value={empresaEntrega}
                        onChange={(e) => setEmpresaEntrega(e.target.value)}
                        placeholder="Ej.: Servientrega, DHL, Amazon..."
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "11px 13px",
                          borderRadius: 9,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                          marginBottom: 14,
                        }}
                      />

                      <label
                        style={{
                          display: "block",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Descripción
                        <span style={{ fontWeight: 400, color: "#6b7280" }}>
                          {" "}(opcional)
                        </span>
                      </label>

                      <input
                        type="text"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Ej.: Caja pequeña, sobre, paquete..."
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "11px 13px",
                          borderRadius: 9,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                          marginBottom: 14,
                        }}
                      />

                      <label
                        style={{
                          display: "block",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Observación
                        <span style={{ fontWeight: 400, color: "#6b7280" }}>
                          {" "}(opcional)
                        </span>
                      </label>

                      <textarea
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Alguna observación..."
                        rows={3}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "11px 13px",
                          borderRadius: 9,
                          border: "1px solid #d1d5db",
                          fontSize: 14,
                          resize: "vertical",
                          marginBottom: 16,
                        }}
                      />

                      {mensajeRegistro && (
                        <div
                          style={{
                            marginBottom: 14,
                            padding: 12,
                            borderRadius: 9,
                            background: mensajeRegistro.startsWith("✅") ? "#dcfce7" : "#fef2f2",
                            color: mensajeRegistro.startsWith("✅") ? "#166534" : "#b91c1c",
                          }}
                        >
                          {mensajeRegistro}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={registrarPaquete}
                        disabled={registrando}
                        style={{
                          width: "100%",
                          padding: "13px 16px",
                          border: "none",
                          borderRadius: 10,
                          cursor: registrando ? "not-allowed" : "pointer",
                          fontWeight: 700,
                          fontSize: 15,
                          opacity: registrando ? 0.6 : 1,
                        }}
                      >
                        {registrando ? "📦 Registrando..." : "📦 REGISTRAR PAQUETE"}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={limpiarSeleccion}
                    style={{
                      marginTop: 16,
                      padding: "10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    Cambiar destinatario
                  </button>
                </div>
              )}
            </>
          )}

          {/* ==================================
              PAQUETES PENDIENTES
              ================================== */}

          {!mostrarHistorial && (
            <div style={{ marginTop: 30 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                📋 Paquetes pendientes
              </div>

              {cargandoPaquetes && (
                <div
                  style={{
                    padding: 18,
                    background: "#f9fafb",
                    borderRadius: 12,
                    color: "#6b7280",
                  }}
                >
                  📦 Cargando paquetes pendientes...
                </div>
              )}

              {!cargandoPaquetes && paquetesPendientes.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    background: "#f9fafb",
                    borderRadius: 12,
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  📭 No hay paquetes pendientes.
                </div>
              )}

              {!cargandoPaquetes && paquetesPendientes.length > 0 && (
                <div style={{ display: "grid", gap: 14 }}>
                  {paquetesPendientes.map((paquete) => (
                    <div
                      key={paquete.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 18,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        👤 {paquete.residente?.nombre || "Residente no encontrado"}
                      </div>

                      <div style={{ marginTop: 8, color: "#374151" }}>
                        🏠 {paquete.vivienda?.codigo_vivienda || "Vivienda no encontrada"}
                      </div>

                      {paquete.empresa_entrega && (
                        <div style={{ marginTop: 8, color: "#374151" }}>
                          🚚 {paquete.empresa_entrega}
                        </div>
                      )}

                      {paquete.descripcion && (
                        <div style={{ marginTop: 6, color: "#374151" }}>
                          📦 {paquete.descripcion}
                        </div>
                      )}

                      {paquete.observacion && (
                        <div style={{ marginTop: 6, color: "#6b7280" }}>
                          📝 {paquete.observacion}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        🕐 Recibido: {new Date(paquete.fecha_recepcion).toLocaleString("es-EC")}
                      </div>

                      <div
                        style={{
                          marginTop: 12,
                          display: "inline-block",
                          padding: "5px 10px",
                          borderRadius: 999,
                          background: "#fef3c7",
                          color: "#92400e",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        🟠 PENDIENTE
                      </div>

                      {(rol === "GUARDIA" || rol === "ADMIN") && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaqueteEntrega(paquete);
                            setNombreReceptor("");
                            setCedulaReceptor("");
                            setRelacionReceptor("");
                            setSinCedula(false);
                            setMensajeEntrega("");
                          }}
                          style={{
                            marginTop: 16,
                            width: "100%",
                            padding: "13px 16px",
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 15,
                          }}
                        >
                          📦 PAQUETE ENTREGADO
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================
              HISTORIAL DE PAQUETES
              ================================== */}

          {mostrarHistorial && (
            <div style={{ marginTop: 30 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                🗂️ Historial de paquetes
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  🔎 Buscar en el historial
                </label>

                <input
                  type="text"
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  placeholder="Residente, vivienda, empresa, descripción, estado..."
                  autoComplete="off"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    fontSize: 15,
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setMostrarTodoHistorial((actual) => !actual)}
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    background: "#f9fafb",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {mostrarTodoHistorial
                    ? "⬆️ Ver solo los 2 últimos"
                    : "📂 Ver historial completo"}
                </button>

                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                  {terminoHistorial
                    ? `Resultados encontrados: ${historialFiltrado.length}`
                    : mostrarTodoHistorial
                    ? `Historial completo: ${historialPaquetes.length} registros`
                    : `Mostrando los 2 últimos de ${historialPaquetes.length} registros`}
                </div>
              </div>

              {cargandoHistorial && (
                <div
                  style={{
                    padding: 18,
                    background: "#f9fafb",
                    borderRadius: 12,
                    color: "#6b7280",
                  }}
                >
                  📦 Cargando historial...
                </div>
              )}

              {!cargandoHistorial && historialPaquetes.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    background: "#f9fafb",
                    borderRadius: 12,
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  📭 No existen paquetes registrados.
                </div>
              )}

              {!cargandoHistorial &&
                historialPaquetes.length > 0 &&
                terminoHistorial &&
                historialVisible.length === 0 && (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      background: "#f9fafb",
                      borderRadius: 12,
                      color: "#6b7280",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    🔎 No se encontraron resultados en el historial.
                  </div>
                )}

              {!cargandoHistorial && historialVisible.length > 0 && (
                <div style={{ display: "grid", gap: 14 }}>
                  {historialVisible.map((paquete) => (
                    <div
                      key={paquete.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 18,
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        👤 {paquete.residente?.nombre || "Residente no encontrado"}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        🏠 {paquete.vivienda?.codigo_vivienda || "Vivienda no encontrada"}
                      </div>

                      {paquete.empresa_entrega && (
                        <div style={{ marginTop: 8 }}>
                          🚚 {paquete.empresa_entrega}
                        </div>
                      )}

                      {paquete.descripcion && (
                        <div style={{ marginTop: 6 }}>
                          📦 {paquete.descripcion}
                        </div>
                      )}

                      {paquete.observacion && (
                        <div style={{ marginTop: 6, color: "#6b7280" }}>
                          📝 {paquete.observacion}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        🕐 Recibido: {new Date(paquete.fecha_recepcion).toLocaleString("es-EC")}
                      </div>

                      {/* ESTADO Y AUDITORÍA DE ENTREGA */}

{paquete.estado === "ENTREGADO" && (
  <>
    {/* ESTADO */}

    <div
      style={{
        marginTop: 10,
        color: "#166534",
        fontWeight: 700,
      }}
    >
      🟢 ENTREGADO
    </div>

    {/* FECHA DE ENTREGA */}

    {paquete.fecha_entrega && (
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        📅 Entregado:{" "}
        {new Date(
          paquete.fecha_entrega
        ).toLocaleString("es-EC")}
      </div>
    )}

    {/* QUIÉN RECIBIÓ EL PAQUETE EN GARITA */}

    {paquete.recibido_por && (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          background: "#f3f4f6",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 5,
          }}
        >
          📥 Recibido en garita por
        </div>

        <div>
          👮{" "}
          {paquete.recibido_por.nombre}{" "}
          {paquete.recibido_por.apellido}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Rol: {paquete.recibido_por.rol}
        </div>
      </div>
    )}

    {/* QUIÉN REALIZÓ LA ENTREGA */}

    {paquete.entregado_por_usuario && (
      <div
        style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 10,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 5,
            color: "#1e40af",
          }}
        >
          📤 Entregado por
        </div>

        <div>
          👤{" "}
          {paquete.entregado_por_usuario.nombre}{" "}
          {paquete.entregado_por_usuario.apellido}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Rol: {paquete.entregado_por_usuario.rol}
        </div>
      </div>
    )}

    {/* PERSONA QUE RETIRÓ */}

    {paquete.entregado_a && (
      <div
        style={{
          marginTop: 10,
        }}
      >
        👤 Retiró:{" "}
        <strong>
          {paquete.entregado_a}
        </strong>
      </div>
    )}

    {/* RELACIÓN */}

    {paquete.relacion_receptor && (
      <div
        style={{
          marginTop: 5,
        }}
      >
        👥 Relación:{" "}
        {paquete.relacion_receptor}
      </div>
    )}

    {/* CÉDULA */}

    <div
      style={{
        marginTop: 5,
      }}
    >
      🪪 Cédula:{" "}
      {paquete.entregado_identificacion ||
        "No proporcionada"}
    </div>
  </>
)}

                        {/* OTROS ESTADOS */}
                        
                      {paquete.estado !== "ENTREGADO" && (
                        <div
                          style={{
                            marginTop: 10,
                            color: "#92400e",
                            fontWeight: 700,
                          }}
                        >
                          🟠 {paquete.estado}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================
              FORMULARIO DE ENTREGA
              SOLO GUARDIA Y ADMIN
              ================================== */}

          {(rol === "GUARDIA" || rol === "ADMIN") && paqueteEntrega && (
            <div
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 14,
                border: "2px solid #2563eb",
                background: "#eff6ff",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1e40af",
                }}
              >
                📦 Entrega de paquete
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 10,
                  background: "#ffffff",
                }}
              >
                <div>
                  👤 <strong>{paqueteEntrega.residente?.nombre || "Residente"}</strong>
                </div>

                <div style={{ marginTop: 6 }}>
                  🏠 {paqueteEntrega.vivienda?.codigo_vivienda || "Vivienda"}
                </div>
              </div>

              <label
                style={{
                  display: "block",
                  marginTop: 18,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Nombre de quien retira *
              </label>

              <input
                type="text"
                value={nombreReceptor}
                onChange={(e) => setNombreReceptor(e.target.value)}
                placeholder="Nombre completo"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  fontSize: 15,
                }}
              />

              <label
                style={{
                  display: "block",
                  marginTop: 16,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Cédula
                <span style={{ fontWeight: 400, color: "#6b7280" }}>
                  {" "}(opcional)
                </span>
              </label>

              <input
                type="text"
                value={cedulaReceptor}
                disabled={sinCedula}
                onChange={(e) => setCedulaReceptor(e.target.value)}
                placeholder="Número de cédula"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  fontSize: 15,
                  background: sinCedula ? "#f3f4f6" : "#ffffff",
                }}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={sinCedula}
                  onChange={(e) => {
                    const marcado = e.target.checked;
                    setSinCedula(marcado);
                    if (marcado) {
                      setCedulaReceptor("");
                    }
                  }}
                />
                No presenta / no conoce su cédula
              </label>

              <label
                style={{
                  display: "block",
                  marginTop: 16,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Relación con el residente *
              </label>

              <select
                value={relacionReceptor}
                onChange={(e) => setRelacionReceptor(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  fontSize: 15,
                  background: "#ffffff",
                }}
              >
                <option value="">Seleccione una opción</option>
                <option value="RESIDENTE">Residente</option>
                <option value="HIJO_A">Hijo/a</option>
                <option value="ESPOSO_A">Esposo/a</option>
                <option value="PADRE_MADRE">Padre/Madre</option>
                <option value="HERMANO_A">Hermano/a</option>
                <option value="FAMILIAR">Familiar</option>
                <option value="AMIGO_A">Amigo/a</option>
                <option value="OTRO">Otro</option>
              </select>

              {mensajeEntrega && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 10,
                    background: mensajeEntrega.startsWith("✅") ? "#dcfce7" : "#fef2f2",
                    color: mensajeEntrega.startsWith("✅") ? "#166534" : "#b91c1c",
                  }}
                >
                  {mensajeEntrega}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPaqueteEntrega(null);
                    setMensajeEntrega("");
                  }}
                  disabled={entregando}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  CANCELAR
                </button>

                <button
                  type="button"
                  onClick={confirmarEntrega}
                  disabled={entregando}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {entregando ? "ENTREGANDO..." : "✅ CONFIRMAR ENTREGA"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}