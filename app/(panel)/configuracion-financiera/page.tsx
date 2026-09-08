"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function ConfiguracionFinanciera() {

  const { usuario } = useAuth();

  const [
    montoMaximo,
    setMontoMaximo
  ] = useState("");

  const [
    guardando,
    setGuardando
  ] = useState(false);

  useEffect(() => {

    if (
      usuario?.condominio_id
    ) {

      cargarConfiguracion();

    }

  }, [usuario]);

  async function cargarConfiguracion() {

    const {
      data,
      error
    } = await supabase
      .from(
        "condominios"
      )
      .select(
        "monto_maximo_gasto_admin"
      )
      .eq(
        "id",
        usuario?.condominio_id
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

    setMontoMaximo(
      String(
        data.monto_maximo_gasto_admin || 200
      )
    );

  }

  async function guardarConfiguracion() {

    if (
      !montoMaximo
    ) {

      alert(
        "Ingrese un valor válido."
      );

      return;

    }

    setGuardando(
      true
    );

    const {
      error
    } = await supabase
      .from(
        "condominios"
      )
      .update({

        monto_maximo_gasto_admin:
          Number(
            montoMaximo
          ),

      })
      .eq(
        "id",
        usuario?.condominio_id
      );

    setGuardando(
      false
    );

    if (error) {

      alert(
        error.message
      );

      return;

    }

    alert(
      "Configuración guardada correctamente."
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
          maxWidth:
            1000,
          margin:
            "0 auto",
        }}
      >

        <div
          style={{
            background:
              "linear-gradient(135deg,#111827,#1f2937)",
            color:
              "#fff",
            padding:
              "35px",
            borderRadius:
              28,
            marginBottom:
              30,
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.15)",
          }}
        >

          <h1
            style={{
              margin: 0,
              fontSize: 34,
            }}
          >
            ⚙️ Configuración Financiera
          </h1>

          <p
            style={{
              marginTop: 12,
              color:
                "#d1d5db",
            }}
          >
            Defina las políticas financieras
            autorizadas para el Administrador
            de la urbanizaciòn o condominio.
          </p>

        </div>

        <div
          style={{
            background:
              "#fff",
            borderRadius:
              24,
            padding:
              30,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >

          <div
            style={{
              background:
                "#eff6ff",
              border:
                "1px solid #bfdbfe",
              borderRadius:
                18,
              padding:
                20,
              marginBottom:
                25,
            }}
          >

            <h3
              style={{
                marginTop: 0,
              }}
            >
              💰 Monto máximo autorizado
            </h3>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              El Administrador podrá registrar
              gastos directamente hasta este valor.
              Los montos superiores requerirán
              aprobación previa de la Directiva.
            </p>

          </div>

          <label
            style={{
              display:
                "block",
              fontWeight:
                "bold",
              marginBottom:
                10,
              color:
                "#374151",
            }}
          >
            Límite autorizado al Administrador
          </label>

          <input
            type="number"
            min="0"
            value={
              montoMaximo
            }
            onChange={(e) =>
              setMontoMaximo(
                e.target.value
              )
            }
            style={{
              width:
                "100%",
              padding:
                18,
              borderRadius:
                16,
              border:
                "1px solid #d1d5db",
              fontSize:
                18,
              boxSizing:
                "border-box",
            }}
          />

          <div
            style={{
              marginTop:
                15,
              color:
                "#6b7280",
            }}
          >
            Valor actual:
            <strong>
              {" "}
              $
              {
                Number(
                  montoMaximo || 0
                ).toFixed(2)
              }
            </strong>
          </div>

          <button
            onClick={
              guardarConfiguracion
            }
            disabled={
              guardando
            }
            style={{
              marginTop:
                30,
              background:
                "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color:
                "#fff",
              border:
                "none",
              borderRadius:
                18,
              padding:
                "16px 28px",
              fontWeight:
                "bold",
              fontSize:
                16,
              cursor:
                "pointer",
            }}
          >
            {guardando
              ? "Guardando..."
              : "💾 Guardar Configuración"}
          </button>

        </div>

      </div>

    </main>

  );

}