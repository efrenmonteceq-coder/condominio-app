"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AsistenciaQRPage() {
  const params = useParams();
  const id = params?.id as string;

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState<
    "exito" | "error" | "info"
  >("info");

  useEffect(() => {
    if (!id) return;

    registrarAsistencia();
  }, [id]);

  async function registrarAsistencia() {
    try {
      setCargando(true);
      setMensaje("Validando asistencia...");
      setTipo("info");

      // 1. Verificar usuario autenticado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setTipo("error");
        setMensaje(
          "Debes iniciar sesión en RENALIX para registrar tu asistencia."
        );
        return;
      }

      // 2. Buscar usuario en la tabla usuarios
      const { data: usuario, error: usuarioError } =
        await supabase
          .from("usuarios")
          .select(
            "id, nombre, apellido, rol, activo, condominio_id, puede_votar"
          )
          .eq("auth_user_id", user.id)
          .eq("activo", true)
          .maybeSingle();

      if (usuarioError) {
        console.error(
          "Error buscando usuario:",
          usuarioError
        );

        setTipo("error");
        setMensaje(
          "No fue posible identificar tu usuario en RENALIX."
        );
        return;
      }

      if (!usuario) {
        setTipo("error");
        setMensaje(
          "Tu usuario no está registrado o no está activo en RENALIX."
        );
        return;
      }

      // 3. Verificar que el usuario esté habilitado para registrar asistencia.
      // RESIDENTE: habilitado por defecto.
      // ADMIN/DIRECTIVA: habilitados únicamente si puede_votar = true.
      const rolActual = (usuario.rol || "").trim().toUpperCase();

      const puedeRegistrarAsistencia =
        rolActual === "RESIDENTE" ||
        ((rolActual === "ADMIN" || rolActual === "DIRECTIVA") &&
          usuario.puede_votar === true);

      if (!puedeRegistrarAsistencia) {
        setTipo("error");
        setMensaje(
          "Esta función está habilitada para residentes y para usuarios ADMIN/DIRECTIVA autorizados para votar."
        );
        return;
      }

      // 4. Buscar la sesión correspondiente al QR
      const { data: sesion, error: sesionError } =
        await supabase
          .from("sesiones")
          .select(
            `
              id,
              condominio_id,
              titulo,
              fecha,
              hora_inicio,
              hora_fin,
              estado,
              qr_activo,
              qr_activo_desde,
              qr_activo_hasta
            `
          )
          .eq("id", id)
          .maybeSingle();

      if (sesionError) {
        console.error(
          "Error buscando sesión:",
          sesionError
        );

        setTipo("error");
        setMensaje(
          "No fue posible verificar la sesión."
        );
        return;
      }

      if (!sesion) {
        setTipo("error");
        setMensaje(
          "La sesión indicada no existe."
        );
        return;
      }

      // 5. Verificar que el residente pertenezca al mismo condominio
      if (
        usuario.condominio_id !==
        sesion.condominio_id
      ) {
        setTipo("error");
        setMensaje(
          "No tienes autorización para registrar asistencia en esta sesión."
        );
        return;
      }

       // 6. Verificar si ya registró asistencia
  const {
    data: asistenciaExistente,
    error: asistenciaExistenteError,
  } = await supabase
    .from("asistencias")
    .select("id, fecha_hora, metodo")
    .eq("sesion_id", sesion.id)
    .eq("usuario_id", usuario.id)
    .maybeSingle();

  if (asistenciaExistenteError) {
    console.error(
      "Error verificando asistencia:",
      asistenciaExistenteError
    );

    setTipo("error");
    setMensaje(
      "No fue posible verificar si ya registraste tu asistencia."
    );
    return;
  }

  // 7. Evitar asistencia duplicada
  if (asistenciaExistente) {
    setTipo("info");
    setMensaje(
      "Tu asistencia ya fue registrada para esta sesión."
    );
    return;
  }

  // 8. Verificar que el QR esté activo
  if (!sesion.qr_activo) {
    setTipo("error");
    setMensaje(
      "El código QR de esta sesión no está activo."
    );
    return;
  }

    // 9. Verificar vigencia del QR
  const ahora = new Date();

  if (sesion.qr_activo_desde) {
    const desde = new Date(
      `${sesion.qr_activo_desde.replace(" ", "T")}Z`
    );

    if (ahora < desde) {
      setTipo("error");
      setMensaje(
        "El código QR todavía no está disponible."
      );
      return;
    }
  }

  if (sesion.qr_activo_hasta) {
    const hasta = new Date(
      `${sesion.qr_activo_hasta.replace(" ", "T")}Z`
    );

    if (ahora > hasta) {
      setTipo("error");
      setMensaje(
        "El código QR de esta sesión ya expiró."
      );
      return;
    }
  }

      // 10. Registrar asistencia
      const { error: insertError } =
        await supabase
          .from("asistencias")
          .insert({
            sesion_id: sesion.id,
            usuario_id: usuario.id,
            metodo: "QR",
          });

      if (insertError) {
        console.error(
          "Error registrando asistencia:",
          insertError
        );

        setTipo("error");
        setMensaje(
          "No fue posible registrar tu asistencia."
        );
        return;
      }

      // 11. Confirmación
      setTipo("exito");
      setMensaje(
        `¡Asistencia registrada correctamente, ${usuario.nombre}!`
      );
    } catch (error) {
      console.error(
        "Error inesperado:",
        error
      );

      setTipo("error");
      setMensaje(
        "Ocurrió un error inesperado al registrar la asistencia."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#ffffff",
          borderRadius: 20,
          padding: 35,
          textAlign: "center",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.10)",
        }}
      >
        <div
          style={{
            fontSize: 50,
            marginBottom: 15,
          }}
        >
          🏢
        </div>

        <h1
          style={{
            margin: 0,
            color: "#1f2937",
            fontSize: 28,
          }}
        >
          RENALIX
        </h1>

        <p
          style={{
            color: "#6b7280",
            marginTop: 8,
          }}
        >
          Registro de asistencia
        </p>

        {cargando && (
          <div
            style={{
              marginTop: 30,
              padding: 20,
              background: "#eff6ff",
              borderRadius: 14,
              color: "#1d4ed8",
            }}
          >
            ⏳
            <div
              style={{
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              Validando asistencia...
            </div>
          </div>
        )}

        {!cargando && mensaje && (
          <div
            style={{
              marginTop: 30,
              padding: 22,
              borderRadius: 14,
              background:
                tipo === "exito"
                  ? "#f0fdf4"
                  : tipo === "error"
                  ? "#fef2f2"
                  : "#eff6ff",
              color:
                tipo === "exito"
                  ? "#166534"
                  : tipo === "error"
                  ? "#991b1b"
                  : "#1d4ed8",
            }}
          >
            <div
              style={{
                fontSize: 35,
                marginBottom: 10,
              }}
            >
              {tipo === "exito"
                ? "✅"
                : tipo === "error"
                ? "❌"
                : "ℹ️"}
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 18,
              }}
            >
              {mensaje}
            </strong>
          </div>
        )}

        <p
          style={{
            marginTop: 30,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          Sistema de gestión residencial
          RENALIX
        </p>
      </div>
    </main>
  );
}