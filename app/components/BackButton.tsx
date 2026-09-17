"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // El Dashboard principal no necesita botón "Volver".
  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <button
      type="button"
      className="renalix-mobile-back-button"
      onClick={() => router.back()}
      aria-label="Volver a la pantalla anterior"
    >
      ← Volver
    </button>
  );
}