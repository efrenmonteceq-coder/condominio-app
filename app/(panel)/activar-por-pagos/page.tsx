"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function GestionTecnicos() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  console.log(
  "USUARIO ACTUAL",
  usuario
);

  const [sinPago,
    setSinPago] =
    useState<any[]>([]);

  const [activos,
    setActivos] =
    useState<any[]>([]);

  const [activosFiltrados,
    setActivosFiltrados] =
    useState<any[]>([]);

  // 🔥 BUSQUEDA

  const [busqueda,
    setBusqueda] =
    useState("");

  // 🔥 FORMULARIO

  const [nombre,
    setNombre] =
    useState("");

  const [especialidad,
  setEspecialidad] =
  useState("");

  const [especialidadSecundaria1,
  setEspecialidadSecundaria1] =
  useState("");

const [especialidadSecundaria2,
  setEspecialidadSecundaria2] =
  useState("");

const ESPECIALIDADES = [
  "Electricista",
  "Plomero",
  "Cerrajero",
  "Albañil",
  "Pintor",
  "Carpintero",
  "Soldador",
  "Vidriero",
  "Instalador de gypsum",
  "Instalador de pisos",
  "Instalador de cortinas",
  "Tapicero",
  "Jardinero",
  "Limpieza residencial",
  "Lavandería",
  "Costurero / Modista",
  "Lavado de alfombras",
  "Lavado de colchones",
  "Lavado de muebles y sofás",
  "Limpieza de ventanas",
  "Técnico de electrodomésticos",
  "Técnico de refrigeración",
  "Aire acondicionado",
  "Mecánico automotriz",
  "Mecánico de motos",
  "Vulcanizador / Llantero",
  "Lavado y detailing automotriz",
  "Reparación de calzado",
  "Reparación de celulares",
  "Técnico en computadoras",
  "Redes e internet",
  "Instalación de cámaras",
  "Seguridad electrónica",
  "Domótica",
  "Reparación de impresoras",
  "Soporte tecnológico",
  "Médico — Medicina General",
  "Médico — Cardiología",
  "Médico — Pediatría",
  "Médico — Ginecología",
  "Médico — Dermatología",
  "Médico — Traumatología",
  "Médico — Oftalmología",
  "Médico — Otorrinolaringología",
  "Médico — Neurología",
  "Médico — Endocrinología",
  "Médico — Gastroenterología",
  "Médico — Urología",
  "Médico — Psiquiatría",
  "Médico — Medicina Interna",
  "Médico — Geriatría",
  "Médico — Neumología",
  "Médico — Reumatología",
  "Médico — Oncología",
  "Médico — Nefrología",
  "Médico — Cirugía General",
  "Odontólogo",
  "Enfermero",
  "Fisioterapeuta",
  "Nutricionista",
  "Psicólogo",
  "Masajista",
  "Entrenador personal",
  "Abogado",
  "Contador",
  "Arquitecto",
  "Ingeniero civil",
  "Ingeniero eléctrico",
  "Diseñador gráfico",
  "Fotógrafo",
  "Asesor financiero",
  "Agente inmobiliario",
  "Panadero",
  "Pastelero",
  "Repostero",
  "Chef",
  "Cocinero",
  "Catering",
  "Comida preparada",
  "Peluquero",
  "Barbero",
  "Manicure / Pedicure",
  "Maquillista",
  "Estilista",
  "Transporte",
  "Mudanzas",
  "Delivery",
  "Mensajería",
  "Conductor particular",
  "Tienda / Víveres",
  "Minimarket",
  "Ferretería",
  "Floristería",
  "Venta de productos para el hogar",
  "Venta de alimentos",
  "Servicios de impresión",
  "Fotocopiado",
  "Organización de eventos",
  "Decoración de eventos",
  "Repostería para eventos",
  "Profesor particular",
  "Tutor académico",
  "Clases de idiomas",
  "Veterinario",
  "Peluquería canina",
  "Paseo de mascotas",
  "Cuidado de mascotas",
  "Diseño y mantenimiento de jardines",
  "Fumigación",
  "Control de plagas",
  "Guardia / Seguridad privada",
  "Administración de propiedades",
  "Avalúos inmobiliarios",
  "Impermeabilización",
  "Mantenimiento de piscinas",
  "Limpieza de tanques de agua",
  "Electricidad automotriz",
  "Instalación de alarmas y accesorios vehiculares",
  "Planchado de ropa"
];

const [telefono,
  setTelefono] =
  useState("");



  const [email,
    setEmail] =
    useState("");

  const [cedula,
    setCedula] =
    useState("");

  const [direccion,
    setDireccion] =
    useState("");

  const [foto,
    setFoto] =
    useState<any>(null);

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();

  // 🔥 ESTRELLAS

  const renderStars =
    (rating: number) => {

    const estrellas = [];

    const full =
      Math.round(rating);

    for (
      let i = 1;
      i <= 5;
      i++
    ) {

      estrellas.push(
        i <= full
          ? "⭐"
          : "☆"
      );

    }

    return estrellas.join("");

  };

  // 🔥 CARGAR

  const cargar =
    async () => {

    const {
      data: sin
    } = await supabase
      .from("tecnicos")
      .select("*")
      .eq(
        "suscripcion_activa",
        false
      );

    const {
      data: act
    } = await supabase
      .from("tecnicos")
      .select(`
        *,
        calificaciones (
          puntuacion,
          comentario,
          created_at
        )
      `)
      .eq(
        "suscripcion_activa",
        true
      )
      .order(
        "calificacion_promedio",
        {
          ascending: false
        }
      );
      

    setSinPago(
      sin || []
    );

    setActivos(
      act || []
    );

    setActivosFiltrados(
      act || []
    );

  };

  useEffect(() => {

    if (usuario) {

      cargar();

    }

  }, [usuario]);

  // 🔥 FILTRO

  useEffect(() => {

    if (!busqueda) {

      setActivosFiltrados(
        activos
      );

      return;

    }

    const filtro =
      activos.filter((t) =>

        t.nombre
          ?.toLowerCase()
          .includes(
            busqueda.toLowerCase()
          ) ||

        t.cedula
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

    setActivosFiltrados(
      filtro
    );

  }, [busqueda, activos]);

  // 🔥 CREAR

  const crearTecnico =
    async () => {

    if (
      !nombre ||
      !especialidad ||
      !foto ||
      !cedula ||
      !direccion
    ) {

      alert(
        "Completa todos los campos"
      );

      return;

    }

    const nombreArchivo =
      `${Date.now()}-${foto.name}`;

    const {
      error: errorUpload
    } = await supabase
      .storage
      .from("tecnicos")
      .upload(
        nombreArchivo,
        foto
      );

    if (errorUpload) {

      alert(
        "Error subiendo imagen"
      );

      return;

    }

    const {
      data: urlData
    } = supabase
      .storage
      .from("tecnicos")
      .getPublicUrl(
        nombreArchivo
      );

    const foto_url =
      urlData.publicUrl;


       const {
  data: condominio
} = await supabase
  .from("condominios")
  .select("nombre")
  .eq(
    "id",
    usuario?.condominio_id
  )
  .single();

const nombreReferente =
  `${usuario?.nombre || ""} ${usuario?.apellido || ""}`.trim();

const tipoReferente =
  usuario?.rol || "";

const condominioReferente =
  condominio?.nombre || "";

    await supabase
      .from("tecnicos")
      .insert([{

        nombre,

        especialidad,

        especialidad_secundaria_1:
  especialidadSecundaria1,

especialidad_secundaria_2:
  especialidadSecundaria2,

        telefono,

        email,

        cedula,

        direccion,

        foto_url,

        activo: false,

        suscripcion_activa:
          false,

        calificacion_promedio:
          0,

         referido_por_nombre:
         nombreReferente,

         referido_por_tipo:
         tipoReferente,

           condominio_referente:
           condominioReferente,

  }]);


 
      const response =
  await fetch(
    "/api/usuarios/create",
    {

      method: "POST",

      headers: {

        "Content-Type":
          "application/json",

      },

      body: JSON.stringify({

        identificacion:
          cedula,

        nombres:
          nombre,

        apellidos:
          "TECNICO",

        email,

        rol:
          "TECNICO",

        condominio_id:
          usuario
            ?.condominio_id,

      }),

    }
  );

const result =
  await response.json();

console.log(
  "API USUARIOS:",
  result
);

alert(
  JSON.stringify(result)
);

if (!response.ok) {

  alert(
    result.error ||
    "Error creando usuario"
  );

  return;

}


    limpiar();

    alert(
      "Profesional / servicio registrado"
    );

    cargar();

  };

  // 🔥 ACTIVAR

  const pagarYActivar =
    async (id: string) => {

    const hoy =
      new Date();

    const vencimiento =
      new Date();

    vencimiento.setFullYear(
      hoy.getFullYear() + 1
    );

    await supabase
      .from("tecnicos")
      .update({

        activo: true,

        suscripcion_activa:
          true,

        estado:
          "ACTIVO",

        fecha_inicio:
          hoy.toISOString(),

        fecha_vencimiento:
          vencimiento.toISOString(),

      })
      .eq("id", id);

    cargar();

  };

  // 🔥 DESACTIVAR

  const desactivarTecnico =
    async (id: string) => {

    await supabase
      .from("tecnicos")
      .update({

        activo: false,

        suscripcion_activa:
          false,

      })
      .eq("id", id);

    cargar();

  };

  // 🔥 ELIMINAR

  const eliminarTecnico =
    async (id: string) => {

    const confirmar =
      confirm(
        "¿Eliminar profesional o servicio?"
      );

    if (!confirmar)
      return;

    await supabase
      .from("calificaciones")
      .delete()
      .eq(
        "tecnico_id",
        id
      );

    await supabase
      .from("tecnicos")
      .delete()
      .eq("id", id);

    cargar();

  };

  // 🔥 LIMPIAR

  const limpiar = () => {

    setNombre("");

    setEspecialidad("");

    setEspecialidadSecundaria1("");

    setEspecialidadSecundaria2("");

    setTelefono("");

    setEmail("");

    setCedula("");

    setDireccion("");

    setFoto(null);

  };

  // 🔒 VALIDACIONES

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
            Gestión de Servicios
          </h1>

          <p
            style={{
              marginTop: 8,
              color:
                "#6b7280",
            }}
          >
            Administración y registro de profesionales, servicios y negocios de la comunidad.
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

      <div
        style={{
          background:
            "#fff",
          borderRadius: 24,
          padding: 24,
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
          Registrar Profesional / Servicio
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 16,
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

          <select
  value={especialidad}
  onChange={(e) =>
    setEspecialidad(e.target.value)
  }
  style={{
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    fontSize: 15,
    width: "100%",
    background: "#fff",
  }}
>
  <option value="">
    Seleccione una especialidad
  </option>

  {ESPECIALIDADES.map((item) => (
    <option
      key={item}
      value={item}
    >
      {item}
    </option>
  ))}
</select>

<select
  value={especialidadSecundaria1}
  onChange={(e) =>
    setEspecialidadSecundaria1(
      e.target.value
    )
  }
  style={{
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    fontSize: 15,
    width: "100%",
    background: "#fff",
  }}
>
  <option value="">
    Especialidad secundaria (opcional)
  </option>

  {ESPECIALIDADES
    .filter(
      (item) => item !== especialidad
    )
    .map((item) => (
      <option
        key={item}
        value={item}
      >
        {item}
      </option>
    ))}
</select>

<select
  value={especialidadSecundaria2}
  onChange={(e) =>
    setEspecialidadSecundaria2(
      e.target.value
    )
  }
  style={{
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    fontSize: 15,
    width: "100%",
    background: "#fff",
  }}
>
  <option value="">
    Segunda especialidad secundaria (opcional)
  </option>

  {ESPECIALIDADES
    .filter(
      (item) =>
        item !== especialidad &&
        item !== especialidadSecundaria1
    )
    .map((item) => (
      <option
        key={item}
        value={item}
      >
        {item}
      </option>
    ))}
</select>
          
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
            placeholder="Correo"
            value={email}
            onChange={(e: any) =>
              setEmail(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Cédula"
            value={cedula}
            onChange={(e: any) =>
              setCedula(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Dirección"
            value={direccion}
            onChange={(e: any) =>
              setDireccion(
                e.target.value
              )
            }
          />

        </div>

        {/* 🔥 FOTO */}

        <div
          style={{
            marginTop: 18,
          }}
        >

          <label
            style={{
              display:
                "block",
              marginBottom: 10,
              fontWeight:
                "bold",
              color:
                "#111827",
            }}
          >
            📸 Foto del técnico
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFoto(
                e.target.files?.[0]
              )
            }
          />

        </div>

        <div
          style={{
            marginTop: 22,
          }}
        >

          <button
            onClick={
              crearTecnico
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
            + Registrar Profesional / Servicio
          </button>

        </div>

        <div
  style={{
    marginTop: 20,
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    borderRadius: 16,
    padding: 18,
    color: "#1e3a8a",
    lineHeight: 1.8,
    fontSize: 14,
  }}
>

  <h3
    style={{
      marginTop: 0,
      marginBottom: 12,
      color: "#1d4ed8",
    }}
  >
    📋 Activación y acceso al Ecosistema de Servicios
  </h3>

  <p style={{ margin: 0 }}>
    Una vez registrado el profesional o servicio, deberá completar el siguiente proceso:
  </p>

  <br />

  <b>🌐 Portal del Profesional / Servicio</b>

  <br />

  <span
    style={{
      color: "#2563eb",
      fontWeight: "bold",
    }}
  >
    http://localhost:3000/panel-tecnico
  </span>

  <br />
  <br />

  1️⃣ Inicie sesión utilizando su número de identificación como usuario y como contraseña inicial.

  <br />

  2️⃣ Actualice su contraseña.

  <br />

  3️⃣ Registre la transferencia y cargue el comprobante de pago.

  <br />

  4️⃣ Espere la aprobación del administrador.

  <br />

  5️⃣ Una vez aprobada la suscripción, podrá recibir solicitudes de servicio.

  <br />
  <br />

  <b>
    💡 Recomendación:
  </b>

  Tome una captura de pantalla y envíesela al técnico por WhatsApp.

</div>

      </div>

      {/* 🔥 PENDIENTES */}

      <div
        style={{
          marginBottom: 35,
        }}
      >

        <h2
          style={{
            color:
              "#92400e",
            marginBottom: 18,
          }}
        >
          Profesionales Pendientes de Activación
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(320px,1fr))",
            gap: 20,
          }}
        >

          {sinPago.length === 0 ? (

            <div
              style={{
                background:
                  "#fff",
                padding: 22,
                borderRadius: 20,
              }}
            >
              No existen profesionales pendientes
            </div>

          ) : (

            sinPago.map((t) => (

              <div
                key={t.id}
                style={{
                  background:
                    "#fff7ed",
                  border:
                    "1px solid #fdba74",
                  borderRadius: 24,
                  padding: 22,
                }}
              >

                <img
                  src={t.foto_url}
                  alt={t.nombre}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius:
                      "50%",
                    objectFit:
                      "cover",
                    border:
                      "4px solid #fed7aa",
                    marginBottom: 16,
                  }}
                />

                <h3
                  style={{
                    marginTop: 0,
                    color:
                      "#111827",
                  }}
                >
                  {t.nombre}
                </h3>

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
                    🔧 {t.especialidad}
                  </span>

                  
                  <span>
                    📍 {t.direccion}
                  </span>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap:
                      "wrap",
                    marginTop: 20,
                  }}
                >
                  <div
  style={{
    background:
      "#16a34a",
    color:
      "#fff",
    padding:
      "10px 16px",
    borderRadius: 12,
    fontWeight:
      "bold",
    cursor:
      "default",
  }}
>
  ⏳ Esperando suscripción
</div>
                 
                  <button
                    onClick={() =>
                      eliminarTecnico(
                        t.id
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

              </div>

            ))

          )}

        </div>

      </div>

      {/* 🔥 BUSCADOR */}

      <div
        style={{
          background:
            "#fff",
          borderRadius: 24,
          padding: 22,
          marginBottom: 25,
          boxShadow:
            "0 8px 20px rgba(0,0,0,0.06)",
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
          Top Profesionales y Servicios
        </h2>

        <input
          placeholder="Buscar profesional, servicio o especialidad"
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
          style={{
            width: "100%",
            maxWidth: 420,
            padding:
              "14px 16px",
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
            "repeat(auto-fit,minmax(340px,1fr))",
          gap: 22,
        }}
      >

        {activosFiltrados.length === 0 ? (

          <div
            style={{
              background:
                "#fff",
              padding: 24,
              borderRadius: 20,
            }}
          >
            No existen profesionales o servicios activos
          </div>

        ) : (

          (
            activosFiltrados
              .slice(
                0,
                busqueda
                  ? activosFiltrados.length
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

                <img
                  src={t.foto_url}
                  alt={t.nombre}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius:
                      "50%",
                    objectFit:
                      "cover",
                    border:
                      "4px solid #dbeafe",
                  }}
                />

                {i === 0 && (

                  <div
                    style={{
                      background:
                        "#fef3c7",
                      color:
                        "#92400e",
                      padding:
                        "8px 12px",
                      borderRadius:
                        999,
                      fontSize: 12,
                      fontWeight:
                        "bold",
                    }}
                  >
                    🏆 DESTACADO
                  </div>

                )}

              </div>

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

</div>

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
                  ⭐
                  {" "}
                  {renderStars(
                    t.calificacion_promedio || 0
                  )}
                </span>

                <span>
                  📍 {t.direccion}
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </main>

  );

}

// 🔥 INPUT

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