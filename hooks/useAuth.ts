import { useEffect, useState } from "react";

export function useAuth() {
  const [usuario, setUsuario] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    // 🔥 LEER LOCALSTORAGE
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
      const user = JSON.parse(data);

      // 🔥 VALIDAR USUARIO
      if (!user) {
        console.warn(
          "Usuario inválido"
        );

        localStorage.removeItem(
          "usuario"
        );

        window.location.href =
          "/login";

        return;
      }

      // 🔥 SUPER ADMIN NO NECESITA CONDOMINIO
      if (
        user.rol !== "SUPER_ADMIN" &&
        !user.condominio_id
      ) {
        console.warn(
          "Usuario sin condominio"
        );

        localStorage.removeItem(
          "usuario"
        );

        window.location.href =
          "/login";

        return;
      }

      setUsuario(user);
    } catch (error) {
      console.error(
        "Error leyendo usuario:",
        error
      );

      localStorage.removeItem(
        "usuario"
      );

      window.location.href =
        "/login";

      return;
    }

    setLoading(false);
  }, []);

  // 🔥 LOGOUT
  const logout = () => {
    localStorage.removeItem(
      "usuario"
    );

    window.location.href =
      "/login";
  };

  return {
    usuario,
    loading,
    logout,
  };
}