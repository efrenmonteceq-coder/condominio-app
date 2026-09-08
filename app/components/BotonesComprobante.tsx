"use client";

export default function BotonesComprobante() {

  // 🔥 IMPRIMIR

  const imprimir =
    () => {

      window.print();

    };

  // 🔥 COPIAR ENLACE

  const copiarEnlace =
    async () => {

      try {

        await navigator
          .clipboard
          .writeText(
            window.location.href
          );

        alert(
          "Enlace copiado correctamente."
        );

      } catch (error) {

        console.error(error);

        alert(
          "No se pudo copiar el enlace."
        );

      }

    };

  // 🔥 WHATSAPP

  const compartirWhatsApp =
    () => {

      const texto =
        `Comprobante de pago:\n${window.location.href}`;

      const url =
        `https://wa.me/?text=${encodeURIComponent(
          texto
        )}`;

      window.open(
        url,
        "_blank"
      );

    };

  return (

    <div
      style={{
        marginTop: 40,
        display: "flex",
        justifyContent:
          "center",
        gap: 15,
        flexWrap:
          "wrap",
      }}
    >

      {/* 🔥 IMPRIMIR */}

      <button
        onClick={imprimir}
        style={{
          background:
            "#2563eb",
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
            "0 6px 15px rgba(37,99,235,0.25)",
        }}
      >
        🖨 Imprimir / Guardar PDF
      </button>

      {/* 🔥 COPIAR */}

      <button
        onClick={copiarEnlace}
        style={{
          background:
            "#16a34a",
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
            "0 6px 15px rgba(22,163,74,0.25)",
        }}
      >
        📋 Copiar enlace
      </button>

      {/* 🔥 WHATSAPP */}

      <button
        onClick={
          compartirWhatsApp
        }
        style={{
          background:
            "#25d366",
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
            "0 6px 15px rgba(37,211,102,0.25)",
        }}
      >
        📲 Compartir WhatsApp
      </button>

    </div>

  );

}