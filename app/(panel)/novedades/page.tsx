"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useSearchParams
} from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

function NovedadesContenido() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const searchParams =
  useSearchParams();

const soloHistorial =
  searchParams.get(
    "solo"
  ) === "historial";

  const [novedades,
    setNovedades] =
    useState<any[]>([]);

  const [viviendas,
    setViviendas] =
    useState<any[]>([]);

  const [viviendaId,
    setViviendaId] =
    useState("");

  const [descripcion,
    setDescripcion] =
    useState("");

    const [
  imagen,
  setImagen
] = useState<File | null>(
  null
);

  const [estado,
    setEstado] =
    useState("ABIERTO");

  // 🔥 FILTROS

  const [busqueda,
    setBusqueda] =
    useState("");

  const [filtroEstado,
    setFiltroEstado] =
    useState("");

  const [filtroFecha,
    setFiltroFecha] =
    useState("");

  // 🔥 ROL

  const rol =
    (
      usuario?.rol || ""
    )
      .toUpperCase()
      .trim();

  // 🔥 CARGAR NOVEDADES

  const cargarNovedades =
  async () => {

    let query =
      supabase
        .from("novedades")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (
      rol === "RESIDENTE"
    ) {

      query = query.eq(
        "usuario_id",
        usuario.id
      );

    } else {
      query = query.eq(
    "condominio_id",
    usuario.condominio_id
  );

}

    const {
      data,
      error,
    } = await query;

    if (error) {

      console.error(
        "ERROR NOVEDADES:",
        error
      );

      return;

    }

    const {
  data: residentes
} = await supabase
  .from("residentes")
  .select(`
    nombre,
    telefono,
    vivienda_id
  `);

const {
  data: viviendas
} = await supabase
  .from("viviendas")
  .select(`
    id,
    codigo_vivienda
  `);

const novedadesCompletas =
  (data || []).map((n) => {

    const residente =
      residentes?.find(
        (r) =>
          r.vivienda_id ===
          n.vivienda_id
      );

    const vivienda =
      viviendas?.find(
        (v) =>
          v.id ===
          n.vivienda_id
      );

    return {

      ...n,

      residente_nombre:
        residente?.nombre || "-",

      residente_telefono:
        residente?.telefono || "-",

      codigo_vivienda:
        vivienda?.codigo_vivienda || "-",

    };

  });

setNovedades(
  novedadesCompletas
);
};


  // 🔥 CARGAR VIVIENDAS

  const cargarViviendas =
    async () => {

      if (!usuario?.condominio_id)
        return;

      const {
        data,
        error,
      } = await supabase
        .from("viviendas")
        .select(`
          id,
          codigo_vivienda
        `)
        .eq(
          "condominio_id",
          usuario.condominio_id
        )
        .order(
          "codigo_vivienda",
          {
            ascending: true,
          }
        );

      if (error) {

        console.error(
          "ERROR VIVIENDAS:",
          error
        );

        return;

      }

      setViviendas(
        data || []
      );

    };

  // 🔥 INIT

  useEffect(() => {

    if (usuario) {

      cargarNovedades();

      cargarViviendas();

    }

  }, [usuario]);

  // 🔥 GUARDAR

  const guardar =
    async () => {

      if (!descripcion.trim()) {

        alert(
          "Escribe una novedad"
        );

        return;

      }

      // 🔥 OBTENER VIVIENDA AUTOMÁTICA DEL RESIDENTE

let viviendaSeleccionada = viviendaId;

if (rol === "RESIDENTE") {

  const {
    data: residente,
    error,
  } = await supabase

    .from("residentes")

    .select("vivienda_id")

    .eq(
  "email",
  usuario.email
)

    .single();

  if (error) {

  console.error(
    "ERROR RESIDENTE:",
    error
  );

  alert(
    "No se encontró la vivienda del residente."
  );

  return;

}

if (!residente) {

  alert(
    "No existe registro del residente."
  );

  return;

}

  viviendaSeleccionada =
    residente.vivienda_id;

}

if (!viviendaSeleccionada) {

  alert(
    "Selecciona una vivienda"
  );

  return;

}

let fotoUrl = "";

if (imagen) {

  const nombreArchivo =
    `${Date.now()}-${imagen.name}`;

  const {
    error: errorUpload
  } = await supabase
    .storage
    .from("novedades")
    .upload(
      nombreArchivo,
      imagen
    );

  if (errorUpload) {

    console.error(
      errorUpload
    );

    alert(
      "Error subiendo imagen"
    );

    return;

  }

  const {
    data
  } = supabase
    .storage
    .from("novedades")
    .getPublicUrl(
      nombreArchivo
    );

  fotoUrl =
    data.publicUrl;

}

const {
  error,
} = await supabase
  .from("novedades")
  .insert([
    {

      vivienda_id:
        viviendaSeleccionada,

      tipo:
        "GENERAL",

      descripcion:
        descripcion.trim(),

      registrado_por:
  `${usuario?.nombre || ""} ${usuario?.apellido || ""}`,

usuario_id:
  usuario?.id,

condominio_id:
  usuario?.condominio_id,

fecha:
  new Date()
    .toISOString(),

estado,

foto_url:
  fotoUrl,

    },
  ]);
      if (error) {

        console.error(
          "ERROR INSERT:",
          error
        );

        alert(
          "Error al guardar novedad"
        );

        return;

      }

      alert(
        "Novedad registrada correctamente"
      );

      setDescripcion("");

      setEstado(
        "ABIERTO"
      );

      setViviendaId("");

      cargarNovedades();

    };

  // 🔥 CERRAR

  const cerrar =
    async (
      id: string
    ) => {

      const solucion =
  window.prompt(

    "Ingrese cómo se resolvió la novedad"
  );

if (
  !solucion ||
  !solucion.trim()
) {

  alert(
    "Debe ingresar una solución"
  );

  return;

}

      
      if (

  rol !== "ADMIN"
  &&

  rol !== "GUARDIA"

){

        alert(
          "No autorizado"
        );

        return;

      }

      const {
  error,
} = await supabase
  .from("novedades")
  .update({
    estado: "CERRADO",
    solucion:
      solucion.trim(),
  })
  .eq(
    "id",
    id
  );

if (error) {

  console.error(
    "ERROR UPDATE:",
    error
  );

  return;

}

cargarNovedades();

               };

  // 🔥 FILTRAR NOVEDADES

  const novedadesFiltradas =
    useMemo(() => {

      return novedades.filter((n) => {

        const texto =
          `${n.descripcion || ""} ${n.registrado_por || ""} ${n.tipo || ""}`
            .toLowerCase();

        const coincideBusqueda =
          texto.includes(
            busqueda.toLowerCase()
          );

        const coincideEstado =
          filtroEstado
            ? n.estado ===
              filtroEstado
            : true;

        const fechaNovedad =
          n.fecha
            ? new Date(
                n.fecha
              )
                .toISOString()
                .split("T")[0]
            : "";

        const coincideFecha =
          filtroFecha
            ? fechaNovedad ===
              filtroFecha
            : true;

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideFecha
        );

      });

    }, [
      novedades,
      busqueda,
      filtroEstado,
      filtroFecha,
    ]);

  // 🔒 VALIDACIÓN

  if (
    loading ||
    !usuario
  ) {

    return (

      <div
        style={{
          minHeight:
            "100vh",
          display: "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          background:
            "#f5f7fa",
        }}
      >

        <p
          style={{
            fontSize: 18,
            color: "#555",
          }}
        >
          Cargando...
        </p>

      </div>

    );

  }

  return (

    <main
      style={{
        minHeight:
          "100vh",
        background:
          "#f3f4f6",
        padding:
          "20px",
      }}
    >

      <div
        style={{
          maxWidth: 1200,
          margin:
            "0 auto",
        }}
      >

        {/* 🔥 HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #111827, #1f2937)",
            borderRadius: 24,
            padding:
              "35px 30px",
            marginBottom: 30,
            color: "#fff",
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              flexWrap:
                "wrap",
              gap: 20,
            }}
          >

            <div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight:
                    "bold",
                }}
              >
                Gestión de Novedades
              </h1>

              <p
                style={{
                  marginTop: 10,
                  color:
                    "#d1d5db",
                  fontSize: 16,
                }}
              >
                Registro y control
                operativo de
                incidencias de la
                urbanización.
              </p>

            </div>

            <button
              onClick={logout}
              style={{
                background:
                  "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding:
                  "14px 22px",
                cursor:
                  "pointer",
                fontWeight:
                  "bold",
                fontSize: 15,
              }}
            >
              Cerrar sesión
            </button>

          </div>

        </div>

        {/* 🔥 FORMULARIO */}

        {!soloHistorial && (
        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 30,
            marginBottom: 30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: 25,
              fontSize: 24,
              color: "#111827",
            }}
          >
            Registrar nueva novedad
          </h2>

          {/* 🔥 GRID */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              marginBottom: 20,
            }}
          >

            {/* 🔥 VIVIENDA */}

{rol !== "RESIDENTE" && (

  <div>

    <label
      style={{
        display:
          "block",
        marginBottom: 8,
        fontWeight:
          "bold",
        color:
          "#374151",
      }}
    >
      Vivienda
    </label>

    <select
      value={
        viviendaId
      }
      onChange={(e) =>
        setViviendaId(
          e.target.value
        )
      }
      style={{
        width: "100%",
        padding: 14,
        borderRadius: 14,
        border:
          "1px solid #d1d5db",
        fontSize: 15,
        outline:
          "none",
      }}
    >

      <option value="">
        Seleccionar
        vivienda
      </option>

      {viviendas.map(
        (v) => (

          <option
            key={v.id}
            value={v.id}
          >
            {
              v.codigo_vivienda
            }
          </option>

        )
      )}

    </select>

  </div>

)}

            {/* 🔥 ESTADO */}

            <div>

              <label
                style={{
                  display:
                    "block",
                  marginBottom: 8,
                  fontWeight:
                    "bold",
                  color:
                    "#374151",
                }}
              >
                Estado
              </label>

              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  border:
                    "1px solid #d1d5db",
                  fontSize: 15,
                  outline:
                    "none",
                }}
              >

                <option value="ABIERTO">
                  ABIERTO
                </option>

                <option value="EN PROCESO">
                  EN PROCESO
                </option>

              </select>

            </div>

          </div>

          {/* 🔥 DESCRIPCIÓN */}

          <div
            style={{
              marginBottom: 25,
            }}
          >

            <label
              style={{
                display:
                  "block",
                marginBottom: 8,
                fontWeight:
                  "bold",
                color:
                  "#374151",
              }}
            >
              Descripción
            </label>

            <textarea
              placeholder="Describe detalladamente la novedad..."
              value={
                descripcion
              }
              onChange={(e) =>
                setDescripcion(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                minHeight: 160,
                padding: 18,
                borderRadius: 16,
                border:
                  "1px solid #d1d5db",
                fontSize: 15,
                resize:
                  "vertical",
                outline:
                  "none",
                boxSizing:
                  "border-box",
              }}
            />

          </div>

          {/* 🔥 FOTO */}

<div
  style={{
    marginBottom: 25,
  }}
>

  <label
    style={{
      display: "block",
      marginBottom: 8,
      fontWeight: "bold",
      color: "#374151",
    }}
  >
    Foto evidencia
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {

      const archivo =
        e.target.files?.[0];

      if (archivo) {

        setImagen(
          archivo
        );

      }

    }}
  />

</div>


          {/* 🔥 BOTÓN */}

          <button
            onClick={guardar}
            style={{
              background:
                "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              padding:
                "16px 28px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
              fontSize: 16,
              boxShadow:
                "0 6px 18px rgba(37,99,235,0.35)",
              width:
                "100%",
              maxWidth: 320,
            }}
          >
            Guardar novedad
          </button>

        </div>
        )}

        {/* 🔥 FILTROS */}

        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 25,
            marginBottom: 30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            Buscar novedades
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
            }}
          >

            {/* 🔥 BUSCADOR */}

            <input
              type="text"
              placeholder="Buscar descripción, usuario o tipo..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border:
                  "1px solid #d1d5db",
                fontSize: 15,
              }}
            />

            {/* 🔥 ESTADO */}

            <select
              value={
                filtroEstado
              }
              onChange={(e) =>
                setFiltroEstado(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border:
                  "1px solid #d1d5db",
                fontSize: 15,
              }}
            >

              <option value="">
                Todos los estados
              </option>

              <option value="ABIERTO">
                ABIERTO
              </option>

              <option value="EN PROCESO">
                EN PROCESO
              </option>

              <option value="CERRADO">
                CERRADO
              </option>

            </select>

            {/* 🔥 FECHA */}

            <input
              type="date"
              value={
                filtroFecha
              }
              onChange={(e) =>
                setFiltroFecha(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border:
                  "1px solid #d1d5db",
                fontSize: 15,
              }}
            />

          </div>

        </div>

        {/* 🔥 LISTADO */}

        <div
          style={{
            background:
              "#fff",
            borderRadius: 24,
            padding: 30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >

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

            <h2
              style={{
                margin: 0,
                fontSize: 24,
              }}
            >
              Listado de novedades
            </h2>

            <div
              style={{
                background:
                  "#111827",
                color: "#fff",
                padding:
                  "10px 18px",
                borderRadius: 14,
                fontWeight:
                  "bold",
              }}
            >
              Resultados:
              {" "}
              {
                novedadesFiltradas.length
              }
            </div>

          </div>

          {novedadesFiltradas.length === 0 ? (

            <div
              style={{
                padding: 40,
                textAlign:
                  "center",
                color: "#6b7280",
                border:
                  "2px dashed #d1d5db",
                borderRadius: 20,
              }}
            >

              No existen novedades registradas

            </div>

          ) : (

            novedadesFiltradas.map((n) => (

              <div
                key={n.id}
                style={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 20,
                  padding: 24,
                  marginBottom: 18,
                  background:
                    "#fafafa",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    flexWrap:
                      "wrap",
                    gap: 15,
                  }}
                >

                  <div
                    style={{
                      flex: 1,
                    }}
                  >

                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        color:
                          "#111827",
                      }}
                    >
                      {
                        n.tipo ||
                        "GENERAL"
                      }
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        lineHeight:
                          1.7,
                        color:
                          "#374151",
                      }}
                    >
                      {
                        n.descripcion
                      }
                    </p>
                     
                     {n.foto_url && (

  <div
    style={{
      marginTop: 18,
    }}
  >

    <img
      src={n.foto_url}
      alt="evidencia"
      style={{
        width: "100%",
        maxWidth: 320,
        borderRadius: 18,
        border:
          "1px solid #d1d5db",
        objectFit:
          "cover",
      }}
    />

  </div>

)}

                    
                  </div>

                  {/* 🔥 BADGE */}

                  <div
                    style={{
                      background:
                        n.estado ===
                        "CERRADO"
                          ? "#dc2626"
                          : n.estado ===
                            "EN PROCESO"
                          ? "#f59e0b"
                          : "#16a34a",
                      color: "#fff",
                      padding:
                        "10px 16px",
                      borderRadius: 999,
                      fontWeight:
                        "bold",
                      fontSize: 13,
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {n.estado}
                  </div>

                </div>

                {/* 🔥 FOOTER */}

                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 18,
                    borderTop:
                      "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    flexWrap:
                      "wrap",
                    gap: 15,
                  }}
                >

                  <div
                    style={{
                      color:
                        "#6b7280",
                      fontSize: 14,
                      lineHeight:
                        1.6,
                    }}
                  >

                   <div>

  <b>
    Residente:
  </b>
  {" "}
  {
    n.residente_nombre ||
  n.registrado_por ||
    "-"
  }

</div>

<div>

  <b>
    Vivienda:
  </b>
  {" "}
  {
    n.codigo_vivienda ||
  "-"
  }

</div>

<div>

  <b>
    Teléfono:
  </b>
  {" "}
  {
    n.residente_telefono ||
    "-"
  }

</div>

<div>

  <b>
    Fecha:
  </b>
  {" "}
  {n.fecha
    ? new Date(
        n.fecha
      ).toLocaleString()
    : "-"}

</div>

                  </div>

                  {n.solucion && (

  <div
    style={{
      marginTop: 10,
      padding: 14,
      background:
        "#ecfdf5",
      border:
        "1px solid #10b981",
      borderRadius: 14,
      color:
        "#065f46",
      lineHeight:
        1.6,
    }}
  >

    <b>
      Solución:
    </b>

    <br />

    {n.solucion}

  </div>

)}

                  {/* 🔥 BOTÓN ADMIN */}

                  {(
                     rol === "ADMIN"
                     ||
                     rol === "GUARDIA"
                    ) &&
                    n.estado !==
                      "CERRADO" && (

                      <button
                        onClick={() =>
                          cerrar(
                            n.id
                          )
                        }
                        style={{
                          background:
                            "#dc2626",
                          color:
                            "#fff",
                          border:
                            "none",
                          borderRadius: 14,
                          padding:
                            "12px 20px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                          fontSize: 14,
                        }}
                      >
                        Cerrar novedad
                      </button>

                    )}

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </main>

  );

}

export default function Novedades() {
  return (
    <Suspense fallback={<div>Cargando novedades...</div>}>
      <NovedadesContenido />
    </Suspense>
  );
}