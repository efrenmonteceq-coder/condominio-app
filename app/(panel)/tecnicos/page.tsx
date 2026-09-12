"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Tecnicos() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const [tecnicos, setTecnicos] =
    useState<any[]>([]);

  const [especialidades,
    setEspecialidades] =
    useState<string[]>([]);

  const [filtro,
    setFiltro] =
    useState("");

  const [busqueda,
    setBusqueda] =
    useState("");

    const [
  comentariosVisibles,
  setComentariosVisibles
] = useState<
  Record<string, boolean>
>({});


  // 🔥 CALIFICACION

  const [puntuacion,
    setPuntuacion] =
    useState("");

  const [comentario,
    setComentario] =
    useState("");

  const [tecnicoSeleccionado,
    setTecnicoSeleccionado] =
    useState("");

  const [misServicios,
    setMisServicios] =
    useState<any[]>([]);

  const [servicioCalificando,
    setServicioCalificando] =
    useState<any>(null);

  const [rating,
    setRating] =
    useState(0);

  const [comentarioRating,
    setComentarioRating] =
    useState("");

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 CARGAR TECNICOS

  const cargarTecnicos =
    async () => {

    const { data } =
      await supabase
        .from("tecnicos")
        .select(`
          *,
          calificaciones (
            puntuacion,
            comentario
          )
        `)
        .eq("activo", true)
        .eq(
          "suscripcion_activa",
          true
        )

        //.eq(
         //"disponible",
        //true
         //)

        .order(
          "calificacion_promedio",
          {
            ascending: false,
          }
        );

    if (data) {

      console.log(
  "TECNICOS CARGADOS:",
  data.map((t) => ({
    nombre: t.nombre,
    especialidad: t.especialidad,
    activo: t.activo,
    suscripcion_activa: t.suscripcion_activa
  }))
);
      
   
      const hoy =
        new Date();

      const filtrados =
        data.filter((t) => {

          return (
            t.fecha_vencimiento &&
            new Date(
              t.fecha_vencimiento
            ) > hoy
          );

        });

      setTecnicos(
        filtrados
      );

      const lista = [
        ...new Set(
          filtrados.map(
            (t) =>
              t.especialidad
          )
        ),
      ];

      setEspecialidades(
        lista as string[]
      );

    }

  };

  const cargarServicios =
  async () => {


      let data = null;

if (rol === "RESIDENTE") {

  const {
  data: residente
} = await supabase
  .from("residentes")
  .select("id")
  .eq(
    "usuario_id",
    usuario.id
  )
  .single();

  const resultado =
    await supabase
      .from("servicios_tecnicos")
      .select(`
        *,
        tecnicos:tecnico_global_id (
          nombre,
          telefono
        )
      `)
      .eq(
        "residente_id",
        residente?.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  data = resultado.data;

} else if (rol === "ADMIN") {

  const resultado =
    await supabase
      .from("servicios_tecnicos")
      .select(`
        *,
        tecnicos:tecnico_global_id (
          nombre,
          telefono
        )
      `)
      .eq(
        "solicitado_por_usuario_id",
        usuario.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  data = resultado.data;

}
  
    if (data) {

      setMisServicios(
        data
      );

    }

};
  useEffect(() => {

    if (usuario) {

      cargarTecnicos();
      cargarServicios();

    }

  }, [usuario]);

  // 🔥 CALIFICAR

  const calificar =
    async () => {

    if (rol === "GUARDIA") {

      alert(
        "No autorizado"
      );

      return;

    }

    if (
      !tecnicoSeleccionado ||
      !puntuacion
    ) {

      alert(
        "Selecciona técnico y puntuación"
      );

      return;

    }

    await supabase
      .from("calificaciones")
      .insert([{

        tecnico_id:
          tecnicoSeleccionado,

        usuario_id:
          usuario.id,

        puntuacion:
          Number(
            puntuacion
          ),

        comentario,

      }]);

    setPuntuacion("");

    setComentario("");

    setTecnicoSeleccionado("");

    alert(
      "Calificación registrada"
    );

    cargarTecnicos();

  };

  // 🔥 VALIDACIONES

  if (
    loading ||
    !usuario
  ) {

    return (
      <p>
        Cargando...
      </p>
    );

  }

  // 🔥 FILTROS

  let tecnicosFiltrados =
    filtro
      ? tecnicos.filter(
          (t) =>
            t.especialidad ===
            filtro
        )
      : tecnicos;

  if (busqueda) {

    tecnicosFiltrados =
      tecnicosFiltrados.filter(
        (t) =>
          t.nombre
            ?.toLowerCase()
            .includes(
              busqueda.toLowerCase()
            ) ||

          t.especialidad
            ?.toLowerCase()
            .includes(
              busqueda.toLowerCase()
            )
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
            Ecosistema de Servicios

             <div>
              ROL: {rol}
             </div>


          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Encuentra profesionales, servicios y negocios de tu comunidad.
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

      {/* 🔥 FILTROS */}

      <div
        style={{
          background:
            "#fff",
          borderRadius: 24,
          padding: 22,
          boxShadow:
            "0 8px 20px rgba(0,0,0,0.06)",
          marginBottom: 25,
        }}
      >

        <h2
          style={{
            marginTop: 0,
            marginBottom: 18,
            color:
              "#111827",
          }}
        >
          Buscar profesionales y servicios
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 15,
          }}
        >

          <input
            placeholder="Buscar profesional, servicio o especialidad"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
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
            }}
          />

          <select
            value={filtro}
            onChange={(e) =>
              setFiltro(
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
              Todas las especialidades
            </option>

            {especialidades.map(
              (e, i) => (

              <option
                key={i}
              >
                {e}
              </option>

            ))}

          </select>

        </div>

      </div>


      {/* 🔥 MIS SERVICIOS */}

{["RESIDENTE", "ADMIN"].includes(rol) && (

  <div
    style={{
      background: "#fff",
      borderRadius: 24,
      padding: 22,
      marginBottom: 30,
      boxShadow:
        "0 8px 20px rgba(0,0,0,0.06)",
    }}
  >

    <h2
      style={{
        marginTop: 0,
        marginBottom: 20,
      }}
    >
      Mis Servicios
    </h2>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 15,
      }}
    >

      {misServicios.map(
        (s) => (

        <div
          key={s.id}
          style={{
            border:
              "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 18,
            background:
              "#f9fafb",
          }}
        >

          <div
            style={{
              fontWeight:
                "bold",
              marginBottom: 8,
            }}
          >
            {s.descripcion}
          </div>

          <div>
            Estado:
            {" "}
            <b>
              {s.estado}
            </b>
          </div>

          <div>
            Fecha:
            {" "}
            {new Date(
              s.created_at
            ).toLocaleString()}
          </div>

          {s.solucion && (

  <div
    style={{
      marginTop: 10,
      padding: 12,
      background: "#ecfeff",
      border: "1px solid #a5f3fc",
      borderRadius: 12,
      color: "#155e75",
    }}
  >

    <b>
      Resolución del servicio:
    </b>

    <div
      style={{
        marginTop: 6,
      }}
    >
      {s.solucion}
    </div>

  </div>

)}



          {s.tecnicos && (

  <div
    style={{
      marginTop: 10,
      color: "#2563eb",
      fontWeight: "bold",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >

    <div>
      👨‍🔧 Técnico:
      {" "}
      {s.tecnicos?.nombre}
    </div>

    <div>
      📞 Contacto:
      {" "}
      {s.tecnicos?.telefono}
    </div>

  </div>

)}

          {s.estado
            ?.toUpperCase()
              ?.trim() ===
              "EN_PROCESO" && (

            <button

              onClick={async () => {

                const solucion =
                  window.prompt(
                    "Describe cómo se resolvió el servicio"
                  );

                if (!solucion) {

                  return;

                }

                await supabase
  .from(
    "servicios_tecnicos"
  )
  .update({

    estado:
      "FINALIZADO",

    solucion,

  })
  .eq(
    "id",
    s.id
  );

setMisServicios(
  (prev) =>

    prev.map(
      (item) =>

        item.id === s.id
          ? {
              ...item,
              estado:
                "FINALIZADO",
              solucion,
            }
          : item
    )
);

                alert(
                  "Servicio finalizado"
                );

              }}

              style={{

                marginTop: 15,

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

              Finalizar servicio

            </button>

          )}

{s.estado
  ?.toUpperCase()
  ?.trim() ===
  "FINALIZADO" && (


  <button

    onClick={async () => {

      setServicioCalificando(s);

    }}

    style={{

      marginTop: 12,

      background:
        "#16a34a",

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

      marginLeft:
        10,

    }}

  >

    Calificar y cerrar

  </button>

)}



        </div>

      ))}

    </div>

  </div>

)}

      {/* 🔥 LISTADO */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(340px,1fr))",
          gap: 22,
        }}
      >

        {tecnicosFiltrados.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 25,
              borderRadius: 20,
            }}
          >
            No existen profesionales o servicios disponibles
          </div>

        ) : (

          (
  tecnicosFiltrados
    .slice(
      0,
      busqueda
        ? tecnicosFiltrados.length
        : 3
    )
).map(   
  
            (t, i) => (

            <div
              key={t.id}
              style={{
                background:
                  "#fff",
                borderRadius: 26,
                padding: 22,
                boxShadow:
                  "0 10px 22px rgba(0,0,0,0.06)",
                border:
                  "1px solid #e5e7eb",
              }}
            >

              {/* 🔥 FOTO */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  marginBottom: 18,
                }}
              >

                {t.foto_url ? (

                  <img
                    src={t.foto_url}
                    alt={t.nombre}
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius:
                        "50%",
                      objectFit:
                        "cover",
                      border:
                        "4px solid #dbeafe",
                    }}
                  />

                ) : (

                  <div
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius:
                        "50%",
                      background:
                        "linear-gradient(135deg,#2563eb,#1d4ed8)",
                      display: "flex",
                      justifyContent:
                        "center",
                      alignItems:
                        "center",
                      color:
                        "#fff",
                      fontSize: 28,
                      fontWeight:
                        "bold",
                    }}
                  >
                    🔧
                  </div>

                )}

                {i === 0 && (

                  <div
                    style={{
                      background:
                        "#fef3c7",
                      color:
                        "#92400e",
                      padding:
                        "8px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight:
                        "bold",
                    }}
                  >
                    🏆 DESTACADO
                  </div>

                )}

              </div>

              {/* 🔥 NOMBRE */}

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  color:
                    "#111827",
                  fontSize: 24,
                }}
              >
                {t.nombre}
              </h2>

              {/* 🔥 ESPECIALIDADES */}

<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  }}
>

  <div
    style={{
      background: "#dbeafe",
      color: "#1d4ed8",
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: "bold",
    }}
  >
    {t.especialidad}
  </div>

  {t.especialidad_secundaria_1 && (
    <div
      style={{
        background: "#e0f2fe",
        color: "#0369a1",
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
      }}
    >
      {t.especialidad_secundaria_1}
    </div>
  )}

  {t.especialidad_secundaria_2 && (
    <div
      style={{
        background: "#e0f2fe",
        color: "#0369a1",
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
      }}
    >
      {t.especialidad_secundaria_2}
    </div>
  )}

</div>

            
                          {/* 🔥 INFO */}

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 8,
                  fontSize: 14,
                  color:
                    "#4b5563",
                }}

                >

                <span>
                ⭐ {t.calificacion_promedio?.toFixed(1) || "0.0"} / 5
                    {" "}
                    (
                    {t.calificaciones?.length || 0}
                     {" "}
                     evaluaciones verificadas)
                   </span>


                <span>
                  🪪 Cédula:
                  {" "}
                  {t.cedula}
                </span>

                <span>
                  📍 Dirección:
                  {" "}
                  {t.direccion}
                </span>

                <span>
                📞 Teléfono:
                 {" "}
                 09X XXX XXXX
                </span>

              </div>

              {/* 🔥 BADGES */}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap:
                    "wrap",
                  marginTop: 18,
                }}
              >

                <div
                  style={{
                    background:
                      "#dcfce7",
                    color:
                      "#166534",
                    padding:
                      "6px 12px",
                    borderRadius:
                      999,
                    fontSize: 12,
                    fontWeight:
                      "bold",
                  }}
                >
                  ACTIVO
                </div>

                <div
                  style={{
                    background:
                      "#ede9fe",
                    color:
                      "#6d28d9",
                    padding:
                      "6px 12px",
                    borderRadius:
                      999,
                    fontSize: 12,
                    fontWeight:
                      "bold",
                  }}
                >
                  SUSCRIPCIÓN PREMIUM
                </div>

              </div>

              {/* 🔥 Solicita el servicio y toma contacto con el técnico */}

{rol !== "GUARDIA" && (

  <div
    style={{
      marginTop: 18,
    }}
  >

    <button

      onClick={async () => {

        const descripcion =
          window.prompt(
            "Describe el servicio solicitado"
          );

        if (!descripcion) {

          return;

        }

        const usuario = JSON.parse(
  localStorage.getItem("usuario") || "{}"
);

const identificacion =
  usuario?.identificacion;

  const rolUsuario =
  usuario?.rol?.toUpperCase();

  console.log(
  "IDENTIFICACION LOGIN:",
  identificacion
);

let residente = null;

if (rolUsuario === "RESIDENTE") {

  const {
  data,
  error,
} = await supabase
  .from("residentes")
  .select("*")
  .eq(
    "usuario_id",
    usuario.id
  )
  .single();

  if (error || !data) {

    alert(
      "No se encontró el residente"
    );

    return;

  }

  residente = data;

}

  console.log(
  "RESIDENTE ENCONTRADO:",
  residente
);



const condominioId =
  rolUsuario === "RESIDENTE"
    ? residente?.condominio_id
    : usuario?.condominio_id;

const {
  data: condominio,
  error: condominioError,
} = await supabase
  .from("condominios")
  .select("nombre")
  .eq(
    "id",
    condominioId
  )
  .single();

let residenteNombre = "";
let residenteTelefono = "";
let residenteVivienda = "";

if (rolUsuario === "RESIDENTE" && residente) {

  residenteNombre =
    residente.nombre || "";

  residenteTelefono =
    residente.telefono || "";

  const {
    data: vivienda
  } = await supabase
    .from("viviendas")
    .select("codigo_vivienda")
    .eq(
      "id",
      residente.vivienda_id
    )
    .single();

  residenteVivienda =
    vivienda?.codigo_vivienda || "";

} else {

  residenteNombre =
    usuario.nombre || "";

  residenteTelefono =
    usuario.telefono || "";

  residenteVivienda =
    "ÁREA COMÚN";

}

const condominioNombre =
  condominio?.nombre || "";


  console.log(
  "DATOS OPERATIVOS",
  {
    residenteNombre,
    residenteTelefono,
    residenteVivienda,
    condominioNombre,
  }
);


        const { error } =
          await supabase
            .from(
              "servicios_tecnicos"
            )
            
            
            .insert([{

  tecnico_global_id:
    t.id,

  residente_id:
      residente?.id || null,

      solicitado_por_usuario_id:
  usuario.id,

solicitado_por_rol:
  rolUsuario,

  residente_nombre:
    residenteNombre,

  residente_telefono:
    residenteTelefono,

  residente_vivienda:
    residenteVivienda,

  condominio_nombre:
    condominioNombre,

  descripcion,

  estado:
    "EN_PROCESO",

  fecha_inicio:
    new Date(),

}]);


        if (error) {

          console.error(error);

          alert(
            "Error al solicitar servicio"
          );

          return;

        }

        await supabase
         .from("tecnicos")
         .update({
          disponible: false,
          })
          .eq(
             "id",
             t.id
            );

            await cargarTecnicos();
            await cargarServicios();

        alert(
          "Servicio solicitado correctamente"
        );

      }}

      style={{

        background:
          "linear-gradient(135deg,#16a34a,#15803d)",

        color:
          "#fff",

        border:
          "none",

        padding:
          "12px 18px",

        borderRadius:
          14,

        cursor:
          "pointer",

        fontWeight:
          "bold",

        width:
          "100%",

      }}

    >

      Solicita el servicio y toma contacto con el técnico

    </button>

  </div>

)}

              {/* 🔥 COMENTARIOS */}

              <div
                style={{
                  marginTop: 22,
                  background:
                    "#f9fafb",
                  borderRadius: 18,
                  padding: 16,
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: 12,
                    color:
                      "#111827",
                    fontSize: 16,
                  }}
                >
                  Comentarios
                </h3>

                <button
  onClick={() =>
    setTecnicos(
      prev =>
        prev.map(
          (tec) =>
            tec.id === t.id
              ? {
                  ...tec,
                  mostrarComentarios:
                    !tec.mostrarComentarios,
                }
              : tec
        )
    )
  }
  style={{
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 12,
  }}
>
  {t.mostrarComentarios
    ? "Ocultar comentarios"
    : "Ver comentarios"}



</button>

                {t.mostrarComentarios &&
                 t.calificaciones?.length > 0 ? (

                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        "column",
                      gap: 12,
                    }}
                  >





                    {t.calificaciones.map(
                      (
                        c: any,
                        index: number
                      ) => (

                      <div
                        key={index}
                        style={{
                          background:
                            "#fff",
                          borderRadius: 14,
                          padding: 12,
                          border:
                            "1px solid #e5e7eb",
                        }}
                      >

                        <div
                          style={{
                            marginBottom: 6,
                            fontWeight:
                              "bold",
                            color:
                              "#111827",
                          }}
                        >
                          {c.comentario}
                        </div>

                        <div
                          style={{
                            color:
                              "#4b5563",
                            fontSize: 14,
                          }}
                        >
                          {c.comentario}
                        </div>

                      </div>

                    ))}

                  </div>

                ) : (

                  <div
                    style={{
                      color:
                        "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    Sin comentarios aún
                  </div>

                )}

              </div>

            </div>

          ))

        )}

      </div>

      {servicioCalificando && (

  <div
    style={{

      position: "fixed",
      inset: 0,
      background:
        "rgba(0,0,0,0.45)",

      display: "flex",
      justifyContent:
        "center",

      alignItems:
        "center",

      zIndex: 9999,

    }}
  >

    <div
      style={{

        background:
          "#fff",

        padding: 30,

        borderRadius: 24,

        width: 420,

        maxWidth: "95%",

      }}
    >

      <h2
        style={{
          marginTop: 0,
        }}
      >
        Calificar servicio
      </h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          marginBottom: 20,
          fontSize: 32,
          cursor: "pointer",
        }}
      >

        {[1,2,3,4,5].map(
          (n) => (

          <span

            key={n}

            onClick={() =>
              setRating(n)
            }

          >

            {rating >= n
              ? "⭐"
              : "☆"}

          </span>

        ))}

      </div>

      <div
        style={{
          marginBottom: 18,
          fontWeight: "bold",
        }}
      >

        {rating === 5 &&
          "⭐⭐⭐⭐⭐ Excelente"}

        {rating === 4 &&
          "⭐⭐⭐⭐ Muy bueno"}

        {rating === 3 &&
          "⭐⭐⭐ Bueno"}

        {rating === 2 &&
          "⭐⭐ Regular"}

        {rating === 1 &&
          "⭐ Malo"}

      </div>

      <textarea

        placeholder="Comentario"

        value={comentarioRating}

        onChange={(e) =>
          setComentarioRating(
            e.target.value
          )
        }

        style={{

          width: "100%",
          minHeight: 100,
          borderRadius: 14,
          border:
            "1px solid #d1d5db",
          padding: 14,

        }}

      />

      <div>
  {comentarioRating}
</div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 20,
        }}
      >

        <button

          onClick={() => {

            setServicioCalificando(
              null
            );

            setRating(0);

            setComentarioRating("");

          }}

          style={{

            flex: 1,
            padding: 14,
            borderRadius: 14,
            border:
              "1px solid #d1d5db",
            background:
              "#fff",
            cursor:
              "pointer",

          }}
        >

          Cancelar

        </button>

        <button

          onClick={async () => {

            if (!rating) {

              alert(
                "Selecciona una puntuación"
              );

              return;

            }

            await supabase
              .from(
                "calificaciones"
              )
              .insert([{

                tecnico_id:
                  servicioCalificando.tecnico_global_id,

                usuario_id:
                  usuario.id,

                puntuacion:
                  rating,

                comentario:
                  comentarioRating,

              }]);

              const {
  data: promedio
} = await supabase
  .from("calificaciones")
  .select("puntuacion")
  .eq(
    "tecnico_id",
    servicioCalificando.tecnico_global_id
  );

if (promedio && promedio.length > 0) {

  const total =
    promedio.reduce(
      (sum, c) =>
        sum + Number(c.puntuacion),
      0
    );

  const promedioFinal =
    total / promedio.length;

  await supabase
    .from("tecnicos")
    .update({
      calificacion_promedio:
        promedioFinal,
    })
    .eq(
      "id",
      servicioCalificando.tecnico_global_id
    );

}

            await supabase
              .from(
                "servicios_tecnicos"
              )
              .update({

                estado:
                  "CERRADO",

              })
              .eq(
                "id",
                servicioCalificando.id
              );

            await supabase
              .from(
                "tecnicos"
              )
              .update({

                disponible:
                  true,

              })
              .eq(
                "id",
                servicioCalificando.tecnico_global_id
              );

            await cargarServicios();
            await cargarTecnicos();

            setServicioCalificando(
              null
            );

            setRating(0);

            setComentarioRating("");

            alert(
              "Servicio cerrado correctamente"
            );

          }}

          style={{

            flex: 1,

            padding: 14,

            borderRadius: 14,

            border:
              "none",

            background:
              "#16a34a",

            color:
              "#fff",

            fontWeight:
              "bold",

            cursor:
              "pointer",

          }}
        >

          Guardar calificación

        </button>

      </div>

    </div>

  </div>

)}

    </main>

);
}