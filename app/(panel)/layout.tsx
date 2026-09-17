"use client";

import Menu from "@/app/components/Menu";
import { usePathname, useRouter } from "next/navigation";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // El Dashboard principal no necesita botón "Volver".
  const mostrarVolver = pathname !== "/dashboard";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f7fa",
      }}
    >
      <Menu />

      <main
        className="panel-main"
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {mostrarVolver && (
          <button
            type="button"
            className="renalix-mobile-back-button"
            onClick={() => router.back()}
            aria-label="Volver a la pantalla anterior"
          >
            ← Volver
          </button>
        )}

        {children}
      </main>
    </div>
  );
}
