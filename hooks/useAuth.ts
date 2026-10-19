import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [usuario, setUsuario] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelado = false;

    const validarSesion = async () => {
      // Conserva la comprobación inicial del perfil local.
      const data =
        localStorage.getItem("usuario");

      if (!data) {
        console.warn(
          "No hay usuario → redirigiendo"
        );

        window.location.href =
          "/login";

        return;
      }

      try {
        const userLocal = JSON.parse(data);

        if (!userLocal) {
          throw new Error("Usuario inválido.");
        }

        // SUPER_ADMIN no necesita condominio.
        if (
          userLocal.rol !== "SUPER_ADMIN" &&
          !userLocal.condominio_id
        ) {
          throw new Error("Usuario sin condominio.");
        }

        // Verifica que exista una sesión real de Supabase.
        const {
          data: { session },
          error: errorSesion,
        } = await supabase.auth.getSession();

        if (errorSesion || !session?.access_token) {
          localStorage.removeItem("usuario");
          await supabase.auth.signOut();

          if (!cancelado) {
            window.location.href = "/login";
          }
          return;
        }

        // Comprueba el estado actual de la cuenta en el servidor.
        const response = await fetch(
          "/api/auth/validar-sesion",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        );

        const resultado = await response.json().catch(() => null);

        if (!response.ok || !resultado?.success || !resultado?.usuario) {
          // Una denegación (401/403) significa que la sesión ya no está
          // autorizada. En errores 5xx no borramos los tokens locales,
          // aunque no permitimos continuar dentro de la página protegida.
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("usuario");
            await supabase.auth.signOut();
          }

          throw new Error(
            resultado?.error ||
              "No se pudo validar la sesión. Intenta nuevamente."
          );
        }

        const user = resultado.usuario;

        if (
          user.rol !== "SUPER_ADMIN" &&
          !user.condominio_id
        ) {
          localStorage.removeItem("usuario");
          await supabase.auth.signOut();
          throw new Error("Usuario sin condominio.");
        }

        if (cancelado) return;

        // Actualiza el perfil local con datos verificados por el servidor.
        localStorage.setItem("usuario", JSON.stringify(user));
        setUsuario(user);
        setLoading(false);
      } catch (error) {
        console.error("Error validando sesión:", error);

        if (cancelado) return;

        // No mostramos contenido protegido si no se pudo validar.
        setUsuario(null);
        setLoading(false);

        // Solo redirige automáticamente cuando la sesión fue revocada
        // o no se pudo autenticar. En errores temporales del servidor,
        // la pantalla no debe seguir mostrando el contenido protegido.
        const mensaje =
          error instanceof Error ? error.message : "";

        if (
          mensaje === "Usuario inválido." ||
          mensaje === "Usuario sin condominio."
        ) {
          localStorage.removeItem("usuario");
          await supabase.auth.signOut();
          window.location.href = "/login";
        }
      }
    };

    void validarSesion();

    return () => {
      cancelado = true;
    };
  }, []);

  // Cerrar sesión en RENALIX y en Supabase.
  const logout = async () => {
    localStorage.removeItem("usuario");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return {
    usuario,
    loading,
    logout,
  };
}
