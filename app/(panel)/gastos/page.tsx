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

function GastosAdministrativosContenido() {

  const {
    usuario,
    loading,
    logout,
  } = useAuth();

  const searchParams =
  useSearchParams();

const solicitudId =
  searchParams.get(
    "solicitud"
  );

const [
  solicitudAprobada,
  setSolicitudAprobada
] =
  useState<any>(null);

const [
  montoMaximoAdmin,
  setMontoMaximoAdmin
] = useState(200);
console.log(
  "MONTO MAXIMO:",
  montoMaximoAdmin
);

  // 🔥 ESTADOS

  const [gastos,
    setGastos] =
    useState<any[]>([]);

  // 🔥 FILTROS

  const [busqueda,
    setBusqueda] =
    useState("");

  const [mostrarHistorial,
    setMostrarHistorial] =
    useState(false);

  const [filtroCategoria,
    setFiltroCategoria] =
    useState("");

  const [filtroFecha,
    setFiltroFecha] =
    useState("");

  const [filtroFormaPago,
    setFiltroFormaPago] =
    useState("");

  // 🔥 FORMULARIO

  const [categoria,
    setCategoria] =
    useState("");

  const [proveedor,
    setProveedor] =
    useState("");

  const [rucProveedor,
    setRucProveedor] =
    useState("");

  const [numeroFactura,
    setNumeroFactura] =
    useState("");

  const [descripcion,
    setDescripcion] =
    useState("");

  const [subtotal,
    setSubtotal] =
    useState("");

  const [porcentajeIva,
    setPorcentajeIva] =
    useState(15);

  const [iva,
    setIva] =
    useState(0);

  const [total,
    setTotal] =
    useState(0);

  const [fechaEmision,
    setFechaEmision] =
    useState("");

  const [fechaGasto,
    setFechaGasto] =
    useState("");

  const [direccionProveedor,
    setDireccionProveedor] =
    useState("");

  const [tipoComprobante,
    setTipoComprobante] =
    useState("FACTURA");

  const [autorizacionSri,
    setAutorizacionSri] =
    useState("");

  const [formaPago,
    setFormaPago] =
    useState("");

  const [observacion,
    setObservacion] =
    useState("");

  const [comprobante,
    setComprobante] =
    useState<any>(null);

    const [bloqueadoPorMonto,
  setBloqueadoPorMonto] =
  useState(false);

  // 🔥 ROL

  const rol =
    (
      usuario?.rol || ""
    )
      .toUpperCase()
      .trim();

  // 🔥 INIT

  useEffect(() => {

  if (
    usuario?.condominio_id
  ) {

    cargarGastos();

    cargarMontoMaximo();

  }

}, [usuario]);


  useEffect(() => {

  if (
    solicitudId
  ) {

    cargarSolicitudAprobada();

  }

}, [solicitudId]);

async function cargarSolicitudAprobada() {

  const {
    data,
    error
  } = await supabase
    .from(
      "solicitudes_gastos"
    )
    .select("*")
    .eq(
      "id",
      solicitudId
    )
    .single();

  if (
    error ||
    !data
  ) {

    console.error(
      error
    );

    return;

  }

  setSolicitudAprobada(
    data
  );

  setCategoria(
    data.categoria || ""
  );

  setProveedor(
    data.proveedor_sugerido || ""
  );

  setDescripcion(
    data.descripcion || ""
  );

  setSubtotal(
    String(
      data.valor_solicitado || 0
    )
  );

  setBloqueadoPorMonto(
    false
  );

}

async function cargarMontoMaximo() {

  if (
    !usuario?.condominio_id
  ) return;

  const {
    data,
    error
  } = await supabase
    .from("condominios")
    .select(
      "monto_maximo_gasto_admin"
    )
    .eq(
      "id",
      usuario.condominio_id
    )
    .single();

  if (
    error ||
    !data
  ) {

    console.error(error);

    return;

  }

  setMontoMaximoAdmin(
    Number(
      data.monto_maximo_gasto_admin || 200
    )
  );

}

 
  // 🔥 CALCULAR IVA

  useEffect(() => {

    const subtotalNumero =
      Number(subtotal || 0);

    const ivaCalculado =
      subtotalNumero *
      (porcentajeIva / 100);

    const totalCalculado =
      subtotalNumero +
      ivaCalculado;

    setIva(
      ivaCalculado
    );

    setTotal(
      totalCalculado
    );

  }, [
    subtotal,
    porcentajeIva,
  ]);

  // 🔥 CARGAR GASTOS

  const cargarGastos =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from(
          "gastos_administrativos"
        )
        .select("*")
        .eq(
          "condominio_id",
          usuario.condominio_id
        )
        .order(
          "fecha_gasto",
          {
            ascending: false,
          }
        );

      if (error) {

        console.error(
          error
        );

        return;

      }

      setGastos(
        data || []
      );

    };

  // 🔥 REGISTRAR

  const registrarGasto =
    async () => {

      try {

        if (
          !categoria ||
          !descripcion ||
          !subtotal ||
          !fechaGasto
        ) {

          alert(
            "Complete los campos obligatorios"
          );

          return;

        }

        let comprobanteUrl =
          null;

        // 🔥 SUBIR COMPROBANTE

        if (comprobante) {

          const nombreArchivo =

            `${Date.now()}-${comprobante.name}`;

          const {
            error: uploadError
          } = await supabase
            .storage
            .from(
              "gastos-administrativos"
            )
            .upload(
              nombreArchivo,
              comprobante
            );

          if (uploadError) {

            console.error(
              uploadError
            );

            alert(
              "Error subiendo comprobante"
            );

            return;

          }

          const {
            data: publicUrlData
          } = supabase
            .storage
            .from(
              "gastos-administrativos"
            )
            .getPublicUrl(
              nombreArchivo
            );

          comprobanteUrl =
            publicUrlData.publicUrl;

        }

        // 🔥 INSERT

        const payload = {

          condominio_id:
            usuario.condominio_id,

          categoria,

          proveedor:
            proveedor || null,

          ruc_proveedor:
            rucProveedor || null,

          numero_factura:
            numeroFactura || null,

          descripcion,

          subtotal:
            subtotal,

          iva,

          total,

          valor:
            total,

            requiere_aprobacion:
  total > montoMaximoAdmin,

estado_aprobacion:
  total > montoMaximoAdmin
    ? "PENDIENTE"
    : "APROBADO",

          fecha_emision:
            fechaEmision || null,

          fecha_gasto:
            fechaGasto,

          direccion_proveedor:
            direccionProveedor || null,

          tipo_comprobante:
            tipoComprobante || null,

          autorizacion_sri:
            autorizacionSri || null,

          forma_pago:
            formaPago || null,

          comprobante_url:
            comprobanteUrl,

          observacion:
            observacion || null,

        };

        const { error } =
          await supabase
            .from(
              "gastos_administrativos"
            )
            .insert([
              payload,
            ]);

        if (error) {

          console.error(
            error
          );

          alert(
            error.message
          );

          return;

        }

        alert(
          "Gasto registrado correctamente"
        );

        limpiar();

        cargarGastos();

      } catch (err) {

        console.error(
          err
        );

        alert(
          "Error inesperado"
        );

      }

    };

  // 🔥 LIMPIAR

  const limpiar =
    () => {

      setCategoria("");

      setProveedor("");

      setRucProveedor("");

      setNumeroFactura("");

      setDescripcion("");

      setSubtotal("");

      setPorcentajeIva(15);

      setIva(0);

      setTotal(0);

      setFechaEmision("");

      setFechaGasto("");

      setDireccionProveedor("");

      setTipoComprobante(
        "FACTURA"
      );

      setAutorizacionSri("");

      setFormaPago("");

      setObservacion("");

      setComprobante(null);

    };

  // 🔥 FILTRAR

  const gastosFiltrados =
    useMemo(() => {

      const terminoBusqueda =
        busqueda.trim().toLowerCase();

      const gastosCoincidentes =
        gastos.filter((g) => {
          const textoBusqueda = [
            g.proveedor,
            g.ruc_proveedor,
            g.numero_factura,
            g.descripcion,
            g.categoria,
            g.forma_pago,
            g.tipo_comprobante,
            g.autorizacion_sri,
            g.fecha_gasto,
            g.fecha_emision,
            g.estado_aprobacion,
            g.observacion,
          ].filter(Boolean).join(" " ).toLowerCase();

          const coincideBusqueda =
            !terminoBusqueda ||
            textoBusqueda.includes(terminoBusqueda);

          const coincideCategoria =
            filtroCategoria ? g.categoria === filtroCategoria : true;
          const coincideFecha =
            filtroFecha ? g.fecha_gasto === filtroFecha : true;
          const coincideFormaPago =
            filtroFormaPago ? g.forma_pago === filtroFormaPago : true;

          return coincideBusqueda && coincideCategoria && coincideFecha && coincideFormaPago;
        });

      const hayCriterios =
        Boolean(terminoBusqueda) ||
        Boolean(filtroCategoria) ||
        Boolean(filtroFecha) ||
        Boolean(filtroFormaPago);

      if (hayCriterios || mostrarHistorial) {
        return gastosCoincidentes;
      }

      return gastosCoincidentes.slice(0, 2);
    }, [
      gastos,
      busqueda,
      filtroCategoria,
      filtroFecha,
      filtroFormaPago,
      mostrarHistorial,
    ]);

  // 🔥 KPIs

  const totalGastos =
    gastosFiltrados.reduce(
      (
        acc,
        g
      ) =>
        acc +
        Number(
          g.total || 0
        ),
      0
    );

  const totalFacturas =
    gastosFiltrados.length;

  const promedioGasto =
    totalFacturas > 0
      ? totalGastos /
        totalFacturas
      : 0;

  // 🔒 LOADING

  if (loading) {

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
            "#f3f4f6",
        }}
      >

        <p>
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
          maxWidth: 1400,
          margin:
            "0 auto",
        }}
      >

        {/* 🔥 HEADER */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#111827,#1f2937)",
            borderRadius: 28,
            padding:
              "35px 30px",
            marginBottom: 30,
            color: "#fff",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.18)",
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
                  fontSize: 36,
                }}
              >
                Gastos
                Administrativos
              </h1>

              <p
                style={{
                  marginTop: 10,
                  color:
                    "#d1d5db",
                  fontSize: 16,
                }}
              >
                Gestión financiera
                y transparencia
                administrativa del
                condominio.
              </p>

            </div>

            <button
              onClick={logout}
              style={{
                background:
                  "#dc2626",
                border: "none",
                color: "#fff",
                borderRadius: 16,
                padding:
                  "14px 22px",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
                fontSize: 15,
              }}
            >
              Cerrar sesión
            </button>

          </div>

        </div>

        {/* 🔥 KPIs */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 20,
            marginBottom: 30,
          }}
        >

          <CardKPI
            titulo="Total gastos"
            valor={`$${totalGastos.toFixed(2)}`}
          />

          <CardKPI
            titulo="Facturas"
            valor={
              totalFacturas
            }
          />

          <CardKPI
            titulo="Promedio gasto"
            valor={`$${promedioGasto.toFixed(2)}`}
          />

        </div>

        {/* 🔥 FORMULARIO */}

        {rol === "ADMIN" && (

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
              }}
            >
              Registrar gasto
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(260px,1fr))",
                gap: 20,
              }}
            >

              <Campo>

                <Label>
                  Categoría
                </Label>

                <select
                  value={
                    categoria
                  }
                  onChange={(e) =>
                    setCategoria(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                >

                  <option value="">
                    Seleccionar
                  </option>

                  <option value="SEGURIDAD">
                    Seguridad
                  </option>

                  <option value="LIMPIEZA">
                    Limpieza
                  </option>

                  <option value="MANTENIMIENTO">
                    Mantenimiento
                  </option>

                  <option value="JARDINERÍA">
                    Jardinería
                  </option>

                  <option value="SERVICIOS_BÁSICOS">
                    Servicios básicos
                  </option>

                  <option value="ADMINISTRACIÓN">
                    Administración
                  </option>

                  <option value="OTROS">
                    Otros
                  </option>

                </select>

              </Campo>

              <Campo>

                <Label>
                  Proveedor
                </Label>

                <input
                  value={
                    proveedor
                  }
                  onChange={(e) =>
                    setProveedor(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />

              </Campo>

              <Campo>

                <Label>
                  RUC proveedor
                </Label>

                <input
                  value={
                    rucProveedor
                  }
                  onChange={(e) =>
                    setRucProveedor(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />

              </Campo>

              <Campo>

                <Label>
                  Factura
                </Label>

                <input
                  value={
                    numeroFactura
                  }
                  onChange={(e) =>
                    setNumeroFactura(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />

              </Campo>

              <Campo>

  <Label>
    Autorización SRI
  </Label>

  <input
    value={
      autorizacionSri
    }
    onChange={(e) =>
      setAutorizacionSri(
        e.target.value
      )
    }
    style={
      inputStyle
    }
    placeholder="Número de autorización SRI"
  />

</Campo>

              <Campo>

                <Label>
                  Subtotal
                </Label>

               <input
  type="number"
 
  value={
    subtotal
  }
  onChange={(e) => {

    const valor =
      Number(
        e.target.value
      );

      console.log(
  "VALIDACION",
  valor,
  montoMaximoAdmin
);

    if (
  valor > montoMaximoAdmin &&
  !solicitudAprobada
)
    
    
    {

      setBloqueadoPorMonto(
        true
      );

      setSubtotal(
  String(
    montoMaximoAdmin
  )
);

      return;

    }

    setBloqueadoPorMonto(
      false
    );

    setSubtotal(
      e.target.value
    );

  }}
  style={
    inputStyle
  }
/>

              </Campo>

              {bloqueadoPorMonto && (

  <div
    style={{
      background: "#fef3c7",
      border: "1px solid #f59e0b",
      color: "#92400e",
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      gridColumn: "1 / -1",
    }}
  >

    <strong>
      ⚠️ Límite excedido
    </strong>

    <br />
    <br />

    {`Los gastos mayores a $${montoMaximoAdmin} requieren aprobación de la Directiva.`}

    <br />
    <br />

    Utilice el módulo:

    <strong>
      📋 Solicitudes de Gastos
    </strong>

  </div>

)}
              
                    
              <Campo>

                <Label>
                  IVA %
                </Label>

                <select
                  value={
                    porcentajeIva
                  }
                  onChange={(e) =>
                    setPorcentajeIva(
                      Number(
                        e.target
                          .value
                      )
                    )
                  }
                  style={
                    inputStyle
                  }
                >

                  <option value={0}>
  0%
</option>

<option value={10}>
  10%
</option>

<option value={11}>
  11%
</option>

<option value={12}>
  12%
</option>

<option value={13}>
  13%
</option>

<option value={14}>
  14%
</option>

<option value={15}>
  15%
</option>

<option value={16}>
  16%
</option>

<option value={17}>
  17%
</option>

<option value={18}>
  18%
</option>

<option value={19}>
  19%
</option>

<option value={20}>
  20%
</option>
                </select>

              </Campo>

              <Campo>

                <Label>
                  IVA calculado
                </Label>

                <input
                  readOnly
                  value={iva.toFixed(2)}
                  style={{
                    ...inputStyle,
                    background:
                      "#f3f4f6",
                  }}
                />

              </Campo>

              <Campo>

                <Label>
                  Total
                </Label>

                <input
                  readOnly
                  value={total.toFixed(2)}
                  style={{
                    ...inputStyle,
                    background:
                      "#f3f4f6",
                    fontWeight:
                      "bold",
                  }}
                />

              </Campo>

              <Campo>

                <Label>
                  Fecha emisión
                </Label>

                <input
                  type="date"
                  value={
                    fechaEmision
                  }
                  onChange={(e) =>
                    setFechaEmision(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />

              </Campo>

              <Campo>

                <Label>
                  Fecha gasto
                </Label>

                <input
                  type="date"
                  value={
                    fechaGasto
                  }
                  onChange={(e) =>
                    setFechaGasto(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                />

              </Campo>

              <Campo>

                <Label>
                  Forma pago
                </Label>

                <select
                  value={
                    formaPago
                  }
                  onChange={(e) =>
                    setFormaPago(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                >

                  <option value="">
                    Seleccionar
                  </option>

                  <option value="EFECTIVO">
                    Efectivo
                  </option>

                  <option value="TRANSFERENCIA">
                    Transferencia
                  </option>

                  <option value="TARJETA">
                    Tarjeta
                  </option>

                  <option value="CHEQUE">
                    Cheque
                  </option>

                </select>

              </Campo>

              <Campo>

                <Label>
                  Tipo comprobante
                </Label>

                <select
                  value={
                    tipoComprobante
                  }
                  onChange={(e) =>
                    setTipoComprobante(
                      e.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                >

                  <option value="FACTURA">
                    Factura
                  </option>

                  <option value="NOTA_VENTA">
                    Nota venta
                  </option>

                  <option value="RECIBO">
                    Recibo
                  </option>

                </select>

              </Campo>

            </div>

            {/* 🔥 DESCRIPCIÓN */}

            <div
              style={{
                marginTop: 25,
              }}
            >

              <Label>
                Descripción
              </Label>

              <textarea
                value={
                  descripcion
                }
                onChange={(e) =>
                  setDescripcion(
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  minHeight: 120,
                  resize:
                    "vertical",
                }}
              />

            </div>

            {/* 🔥 OBS */}

            <div
              style={{
                marginTop: 20,
              }}
            >

              <Label>
                Observación
              </Label>

              <textarea
                value={
                  observacion
                }
                onChange={(e) =>
                  setObservacion(
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  minHeight: 100,
                  resize:
                    "vertical",
                }}
              />

            </div>

            {/* 🔥 FILE */}

            <div
              style={{
                marginTop: 25,
              }}
            >

              <Label>
                Comprobante
              </Label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {

                  if (
                    e.target.files &&
                    e.target.files[0]
                  ) {

                    setComprobante(
                      e.target.files[0]
                    );

                  }

                }}
              />

            </div>

            <br />

            <button
              onClick={
                registrarGasto
              }
              style={{
                background:
                  "linear-gradient(135deg,#2563eb,#1d4ed8)",
                color: "#fff",
                border: "none",
                borderRadius: 18,
                padding:
                  "18px 28px",
                fontWeight:
                  "bold",
                fontSize: 16,
                cursor:
                  "pointer",
                boxShadow:
                  "0 8px 24px rgba(37,99,235,0.35)",
              }}
            >
              Registrar gasto
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
            Buscar gastos
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(240px,1fr))",
              gap: 20,
            }}
          >

            <input
              placeholder="Buscar proveedor, descripción, factura o categoría..."
              value={busqueda}
              onChange={(e) => {
                const valor = e.target.value;
                setBusqueda(valor);
                if (valor.trim()) setMostrarHistorial(true);
              }}
              style={inputStyle}
            />

            <select
              value={
                filtroCategoria
              }
              onChange={(e) =>
                setFiltroCategoria(
                  e.target.value
                )
              }
              style={
                inputStyle
              }
            >

              <option value="">
                Todas categorías
              </option>

              <option value="SEGURIDAD">
                Seguridad
              </option>

              <option value="LIMPIEZA">
                Limpieza
              </option>

              <option value="MANTENIMIENTO">
                Mantenimiento
              </option>

            </select>

            <select
              value={
                filtroFormaPago
              }
              onChange={(e) =>
                setFiltroFormaPago(
                  e.target.value
                )
              }
              style={
                inputStyle
              }
            >

              <option value="">
                Forma pago
              </option>

              <option value="EFECTIVO">
                Efectivo
              </option>

              <option value="TRANSFERENCIA">
                Transferencia
              </option>

              <option value="TARJETA">
                Tarjeta
              </option>

            </select>

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
              style={
                inputStyle
              }
            />

          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 18,
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              {busqueda.trim() || filtroCategoria || filtroFecha || filtroFormaPago
                ? `Resultados encontrados: ${gastosFiltrados.length}`
                : mostrarHistorial
                  ? `Historial completo: ${gastos.length} gastos`
                  : `Últimos gastos: ${Math.min(gastos.length, 2)}`}
            </div>

            {!busqueda.trim() && !filtroCategoria && !filtroFecha && !filtroFormaPago && gastos.length > 2 && (
              <button
                type="button"
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                style={{
                  background: "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {mostrarHistorial ? "⬆️ Ver solo los 2 últimos" : "📂 Ver historial completo"}
              </button>
            )}
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
            marginBottom: 40,
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
              }}
            >
              Transparencia financiera
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
                gastosFiltrados.length
              }
            </div>

          </div>

          {gastosFiltrados.length ===
          0 ? (

            <div
              style={{
                padding: 40,
                border:
                  "2px dashed #d1d5db",
                borderRadius: 20,
                textAlign:
                  "center",
                color:
                  "#6b7280",
              }}
            >

              {busqueda.trim() || filtroCategoria || filtroFecha || filtroFormaPago
                ? "No existen gastos que coincidan con la búsqueda o los filtros."
                : "No existen gastos registrados"}

            </div>

          ) : (

            gastosFiltrados.map(
              (g) => (

                <div
                  key={g.id}
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: 24,
                    padding: 24,
                    marginBottom: 20,
                    background:
                      "#fafafa",
                  }}
                >

                  {/* 🔥 TOP */}

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      flexWrap:
                        "wrap",
                      gap: 15,
                    }}
                  >

                    <div>

                      <h3
                        style={{
                          marginTop: 0,
                          marginBottom: 10,
                          fontSize: 24,
                        }}
                      >
                        {
                          g.categoria
                        }
                      </h3>

                      <div
                        style={{
                          color:
                            "#6b7280",
                        }}
                      >
                        {
                          g.descripcion
                        }
                      </div>

                    </div>

                    <div
                      style={{
                        background:
                          "#16a34a",
                        color: "#fff",
                        padding:
                          "14px 20px",
                        borderRadius: 18,
                        fontWeight:
                          "bold",
                        fontSize: 24,
                      }}
                    >
                        $
                        {Number(
                          g.total
                        ).toFixed(2)}
                    </div>

                  </div>

                  {/* 🔥 GRID */}

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 18,
                      marginTop: 25,
                    }}
                  >

                    <Info
                      label="Proveedor"
                      value={
                        g.proveedor ||
                        "-"
                      }
                    />

                    <Info
                      label="Factura"
                      value={
                        g.numero_factura ||
                        "-"
                      }
                    />

                    <Info
                      label="Forma pago"
                      value={
                        g.forma_pago ||
                        "-"
                      }
                    />

                    <Info
                      label="Fecha"
                      value={
                        g.fecha_gasto
                      }
                    />

                    <Info
                      label="IVA"
                      value={`$${Number(g.iva).toFixed(2)}`}
                    />

                    <Info
                      label="Subtotal"
                      value={`$${Number(g.subtotal).toFixed(2)}`}
                    />

                  </div>

                  {/* 🔥 OBS */}

                  {g.observacion && (

                    <div
                      style={{
                        marginTop: 20,
                        background:
                          "#fff",
                        padding: 18,
                        borderRadius: 16,
                        border:
                          "1px solid #e5e7eb",
                      }}
                    >

                      <b>
                        Observación:
                      </b>

                      <br />
                      <br />

                      {
                        g.observacion
                      }

                    </div>

                  )}

                  {/* 🔥 FACTURA */}

                  {g.comprobante_url && (

                    <div
                      style={{
                        marginTop: 20,
                      }}
                    >

                      <a
                        href={
                          g.comprobante_url
                        }
                        target="_blank"
                        style={{
                          background:
                            "#2563eb",
                          color:
                            "#fff",
                          padding:
                            "12px 20px",
                          borderRadius: 14,
                          textDecoration:
                            "none",
                          fontWeight:
                            "bold",
                          display:
                            "inline-block",
                        }}
                      >
                        Ver comprobante
                      </a>

                    </div>

                  )}

                </div>

              )
            )

          )}

        </div>

      </div>

    </main>

  );

}

export default function GastosAdministrativos() {
  return (
    <Suspense fallback={<div>Cargando gastos...</div>}>
      <GastosAdministrativosContenido />
    </Suspense>
  );
}

// 🔥 COMPONENTES

function Campo({
  children,
}: any) {

  return (
    <div>
      {children}
    </div>
  );

}

function Label({
  children,
}: any) {

  return (

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
      {children}
    </label>

  );

}

function Info({
  label,
  value,
}: any) {

  return (

    <div
      style={{
        background:
          "#fff",
        padding: 16,
        borderRadius: 16,
        border:
          "1px solid #e5e7eb",
      }}
    >

      <div
        style={{
          color:
            "#6b7280",
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight:
            "bold",
          color:
            "#111827",
        }}
      >
        {value}
      </div>

    </div>

  );

}

function CardKPI({
  titulo,
  valor,
}: any) {

  return (

    <div
      style={{
        background:
          "#fff",
        borderRadius: 22,
        padding: 24,
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >

      <div
        style={{
          color:
            "#6b7280",
          marginBottom: 10,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight:
            "bold",
          color:
            "#111827",
        }}
      >
        {valor}
      </div>

    </div>

  );

}

// 🔥 INPUTS

const inputStyle = {

  width: "100%",

  padding: 16,

  borderRadius: 16,

  border:
    "1px solid #d1d5db",

  fontSize: 15,

  outline: "none",

  boxSizing:
    "border-box" as const,

};