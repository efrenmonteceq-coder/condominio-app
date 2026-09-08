"use client";

import {
useEffect,
useState,
} from "react";

import {
supabase,
} from "@/lib/supabase";

export default function PanelTecnico() {

const [
servicios,
setServicios
] = useState<any[]>([]);

const [
tecnico,
setTecnico
] = useState<any>(null);

const [
  archivo,
  setArchivo
] = useState<File | null>(null);

const [
  banco,
  setBanco
] = useState("");

const [
  numeroTransferencia,
  setNumeroTransferencia
] = useState("");

const [
  subiendo,
  setSubiendo
] = useState(false);


const [
  comprobantePendiente,
  setComprobantePendiente
] = useState(false);

const [
  configuracion,
  setConfiguracion
] = useState<any>(null);

const cargar =
async () => {


  const usuario =
    JSON.parse(
      localStorage.getItem(
        "usuario"
      ) || "{}"
    );

  const identificacion =
    usuario?.identificacion;

  if (
    !identificacion
  ) {

    return;

  }

  const {
    data: tecnicoDB
  } =
    await supabase
      .from(
        "tecnicos"
      )
      .select("*")
      .eq(
        "cedula",
        identificacion
      )
      .single();

  console.log(
    "TECNICO ENCONTRADO:",
    tecnicoDB
  );

  if (!tecnicoDB) {

    return;

  }

  setTecnico(
    tecnicoDB
  );

  const {
  data: config
} = await supabase
  .from(
    "configuracion_saas"
  )
  .select("*")
  .eq(
    "activo",
    true
  )
  .single();

setConfiguracion(
  config
);

  const {
  data: pagosPendientes
} =
  await supabase
    .from("pagos_tecnicos")
    .select("*")
    .eq(
      "tecnico_id",
      tecnicoDB.id
    );

console.log(
  "PAGOS DEL TECNICO:",
  pagosPendientes
);

setComprobantePendiente(
  (pagosPendientes?.length || 0) > 0
);

  const {
    data
  } =
    await supabase
      .from(
        "servicios_tecnicos"
      )
      .select("*")
      .eq(
        "tecnico_global_id",
        tecnicoDB.id
      );

  console.log(
    "SERVICIOS:",
    data
  );

  setServicios(
    data || []
  );

};


useEffect(() => {


cargar();

const interval =
  setInterval(() => {

    cargar();

  }, 3000);

return () =>
  clearInterval(interval);


}, []);

const subirComprobante =
  async () => {

    if (
      !archivo ||
      !tecnico
    ) {

      alert(
        "Seleccione un comprobante"
      );

      return;

    }

    try {

      setSubiendo(true);

      const nombreArchivo =
        `${tecnico.id}-${Date.now()}-${archivo.name}`;

      const {
        error: uploadError
      } =
        await supabase
          .storage
          .from("comprobantes-saas")
          .upload(
            nombreArchivo,
            archivo
          );

      if (uploadError) {

        throw uploadError;

      }

      const {
        data
      } =
        supabase
          .storage
          .from("comprobantes-saas")
          .getPublicUrl(
            nombreArchivo
          );

      await supabase
        .from(
          "pagos_tecnicos"
        )
        .insert([{

          tecnico_id:
            tecnico.id,

          valor: 14,

          porcentaje_iva:
            15,

            banco,

numero_transferencia:
  numeroTransferencia,

          comprobante_url:
            data.publicUrl,

          fecha_pago:
            new Date(),

          estado:
            "PENDIENTE",

        }]);

      alert(
        "Comprobante enviado correctamente"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Error al subir comprobante"
      );

    } finally {

      setSubiendo(false);

    }

  };


if (
tecnico &&
tecnico.estado !== "ACTIVO"
) {


return (

  <div
    style={{
      padding: 40,
      maxWidth: 700,
      margin: "0 auto",
    }}
  >

    <h1>
      🔒 Cuenta pendiente de activación
    </h1>

    <p>
      Bienvenido{" "}
      <b>
        {tecnico.nombre}
      </b>
    </p>

    <p>
      Para utilizar la plataforma
      debe activar su suscripción.
    </p>

    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
      }}
    >

      <h2>
        Plan Anual Renalix
      </h2>

      <p>
        USD 14.00
      </p>

      <p>
        IVA incluido
      </p>

      {configuracion && (

  <div
    style={{
      marginTop: 20,
      padding: 15,
      borderRadius: 10,
      background: "#f8fafc",
      border: "1px solid #dbeafe",
    }}
  >

    <h3>
      💳 Datos para realizar el pago
    </h3>

    <p>
      <b>Empresa:</b>{" "}
      {configuracion.empresa}
    </p>

    <p>
      <b>Banco:</b>{" "}
      {configuracion.banco}
    </p>

    <p>
      <b>Tipo de cuenta:</b>{" "}
      {configuracion.tipo_cuenta}
    </p>

    <p>
      <b>Número de cuenta:</b>{" "}
      {configuracion.numero_cuenta}
    </p>

    <p>
      <b>Titular:</b>{" "}
      {configuracion.titular_cuenta}
    </p>

    <p>
      <b>Correo de cobros:</b>{" "}
      {configuracion.correo_cobros}
    </p>

  </div>

)}

      <p>
        Estado:
        {" "}
        <b>
          {tecnico.estado}
        </b>
      </p>

      {!comprobantePendiente ? (

  <>

  <input
  placeholder="Banco desde donde realizó la transferencia"
  value={banco}
  onChange={(e) =>
    setBanco(
      e.target.value
    )
  }
  style={{
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    width: "100%",
    marginBottom: 10,
  }}
/>

<input
  placeholder="Número de transferencia"
  value={numeroTransferencia}
  onChange={(e) =>
    setNumeroTransferencia(
      e.target.value
    )
  }
  style={{
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    width: "100%",
    marginBottom: 15,
  }}
/>

    <label
  style={{
    display: "inline-block",
    padding: "12px 20px",
    background: "#2563eb",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    marginRight: 10,
  }}
>
  {
  archivo
    ? "✅ Comprobante cargado"
    : "📂 Cargar comprobante"
}

  <input
    type="file"
    accept=".jpg,.jpeg,.png,.pdf"
    style={{
      display: "none",
    }}
    onChange={(e) =>
      setArchivo(
        e.target.files?.[0] || null
      )
    }
  />
</label>

    <button
      onClick={
        subirComprobante
      }
      disabled={
        subiendo
      }
      
      style={{
  marginTop: 15,
  padding: "12px 20px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
}}

    >
      {
        subiendo
          ? "Subiendo..."
          : "Enviar comprobante"
      }
    </button>

  </>

) : (

  <div
    style={{
      marginTop: 20,
      padding: 15,
      borderRadius: 10,
      background: "#f0fdf4",
    }}
  >

    ✅ Comprobante enviado correctamente.

    <br />

    Su pago está siendo revisado
    por Renalix.

  </div>

)}

      

    </div>

  </div>

);


}

return (


<div
  style={{
    padding: 30,
  }}
>

  <h1>
    👨‍🔧 Panel Técnico
  </h1>

  <p>
    Servicios asignados:
  </p>

  <div
    style={{
      display: "flex",
      flexDirection:
        "column",
      gap: 16,
      marginTop: 20,
    }}
  >

    {servicios.map(
      (s) => (

        <div
          key={s.id}
          style={{

            border:
              "1px solid #ddd",

            borderRadius: 16,

            padding: 18,

          }}
        >

          <div>
            🛠️{" "}
            {s.descripcion}
          </div>

          <div
            style={{
              marginTop: 10,
            }}
          >

            👤 Residente:{" "}
            <b>
              {s.residente_nombre}
            </b>

          </div>

          <div>

            📞 Teléfono:{" "}
            {s.residente_telefono}

          </div>

          <div>

            🏠 Vivienda:{" "}
            {s.residente_vivienda}

          </div>

          <div>

            🏢 Condominio:{" "}
            {s.condominio_nombre}

          </div>

          <div>
            Estado:{" "}
            <b>
              {s.estado}
            </b>
          </div>

          <div>
            Fecha:{" "}
            {new Date(
              s.created_at
            ).toLocaleString()}
          </div>

        </div>

      )
    )}

  </div>

</div>


);

}
