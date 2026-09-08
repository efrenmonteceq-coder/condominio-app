"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PagosSaas() {

  const [
    pagos,
    setPagos
  ] = useState<any[]>([]);

  const [
  tecnicos,
  setTecnicos
] = useState<any[]>([]);

  const cargar = async () => {


    const {
  data,
  error
} = await supabase
  .from("pagos_tecnicos")
  .select("*")

      .eq(
        "estado",
        "PENDIENTE"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {

      console.error(error);

      return;

    }

    setPagos(
      data || []
    );

    const {
  data: tecnicosData
} = await supabase
  .from("tecnicos")
  .select(
    "id,nombre"
  );

setTecnicos(
  tecnicosData || []
);

  };

  useEffect(() => {

    cargar();

  }, []);

  const aprobarPago = async (
  id: string,
  tecnicoId: string
) => {

  const confirmar = confirm(
    "¿Aprobar este pago?"
  );

  if (!confirmar) {
    return;
  }

  const { error } =
    await supabase
  .from(
    "pagos_tecnicos"
  )
  .update({

    estado:
      "APROBADO",

    fecha_aprobacion:
      new Date(),

    aprobado_por:
  "SUPERADMIN",

  })
  .eq(
    "id",
    id
  );
      
console.log(
  "ACTIVANDO TECNICO:",
  tecnicoId
);

const {
  error: errorTecnico
} =
  await supabase
    .from(
      "tecnicos"
    )
    .update({

      estado:
        "ACTIVO",

      suscripcion_activa:
        true,

      activo:
        true,

      fecha_inicio:
        new Date(),

      fecha_vencimiento:
        new Date(
          Date.now() +
          365 * 24 * 60 * 60 * 1000
        ),

    })
    .eq(
      "id",
      tecnicoId
    );
    
if (errorTecnico) {

  console.error(
    errorTecnico
  );

  alert(
    "Pago aprobado pero no se pudo activar el técnico"
  );

  return;

}

const {
  data: tecnico
} = await supabase
  .from(
    "tecnicos"
  )
  .select("*")
  .eq(
    "id",
    tecnicoId
  )
  .single();

if (tecnico) {

  const hoy =
    new Date();

  const vencimiento =
    new Date();

  vencimiento.setFullYear(
    hoy.getFullYear() + 1
  );

  await supabase
    .from(
      "comprobantes_saas"
    )
    .insert([{

      tecnico_global_id:
        tecnicoId,

      tipo_documento:
        "COMPROBANTE",

      codigo_comprobante:
        `COMP-${Date.now()}`,

      autorizacion_sri:
        `AUT-${Date.now()}`,

      concepto:
        "Suscripción anual técnico",

      subtotal:
        12.17,

      iva:
        1.83,

      total:
        14,

      estado:
        "PAGADO",

      vigencia_inicio:
        hoy,

      vigencia_fin:
        vencimiento,

      observacion:
        "Pago SaaS aprobado",

      modulo_origen:
        "TECNICOS",

      asiento_generado:
        false,

    }]);

}

  if (error) {

    console.error(error);

    alert(
      "Error aprobando pago"
    );

    return;

  }

  alert(
    "Pago aprobado correctamente"
  );

  cargar();

};
  
  
  return (

    <main
      style={{
        padding: 40,
      }}
    >

      <h1>
        💳 Pagos SaaS
      </h1>

      <p>
        Pagos pendientes:
      </p>

      {pagos.map((p) => (

  <div
    key={p.id}
    style={{
      border: "1px solid #ccc",
      padding: 15,
      marginTop: 15,
      borderRadius: 10,
    }}
  >

    <div>

  Técnico:
  {" "}

  <b>
    {
      tecnicos.find(
        (t) =>
          t.id === p.tecnico_id
      )?.nombre ||
      "Sin nombre"
    }
  </b>

</div>

    <div>
      Valor:
      {" "}
      ${p.valor}
    </div>

    <div>
      Estado:
      {" "}
      <b>
        {p.estado}
      </b>
    </div>

    <div>
      Fecha:
      {" "}
      {new Date(
        p.fecha_pago
      ).toLocaleString()}
    </div>

    <br />

<button
  onClick={() =>
    window.open(
      p.comprobante_url,
      "_blank"
    )
  }
>
  👁 Ver comprobante
</button>

{" "}

<button
  onClick={() =>
    aprobarPago(
      p.id,
      p.tecnico_id
    )
  }
>
  ✅ Aprobar
</button>

  </div>

))}


    </main>

  );

}