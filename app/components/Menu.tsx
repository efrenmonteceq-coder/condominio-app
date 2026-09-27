"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function Menu() {

  const {
    usuario,
    logout,
  } = useAuth();

  const pathname =
    usePathname();
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
    const [condominioNombre, setCondominioNombre] = useState("");
    const [codigoViviendaMenu, setCodigoViviendaMenu] = useState("");
    const [fotoPerfilVista, setFotoPerfilVista] = useState("");
    const [fotoPerfilGuardando, setFotoPerfilGuardando] = useState(false);
    const [camaraAbierta, setCamaraAbierta] = useState(false);
    const [mensajeCamara, setMensajeCamara] = useState("");
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamCamaraRef = useRef<MediaStream | null>(null);
    const inputArchivoRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
  setMenuMovilAbierto(false);
}, [pathname]);

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();
  useEffect(() => {
    const cargarDatosIdentidad = async () => {
      if (!usuario?.condominio_id) {
        setCondominioNombre("");
        setCodigoViviendaMenu("");
        return;
      }

      const { data: condominioData } = await supabase
        .from("condominios")
        .select("nombre")
        .eq("id", usuario.condominio_id)
        .single();

      setCondominioNombre(condominioData?.nombre || "");

      if (rol === "RESIDENTE" && usuario?.id) {
        const { data: viviendaData } = await supabase
          .from("viviendas")
          .select("codigo_vivienda")
          .eq("residente_id", usuario.id)
          .eq("condominio_id", usuario.condominio_id)
          .maybeSingle();

        setCodigoViviendaMenu(viviendaData?.codigo_vivienda || "");
      } else {
        setCodigoViviendaMenu("");
      }
    };

    cargarDatosIdentidad();
  }, [rol, usuario?.condominio_id, usuario?.id]);

  const detenerCamara = () => {
    streamCamaraRef.current?.getTracks().forEach((track) => track.stop());
    streamCamaraRef.current = null;
    setCamaraAbierta(false);
    setMensajeCamara("");
  };

  useEffect(() => {
    return () => {
      streamCamaraRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const guardarFotoEnSupabase = async (archivo: File) => {
    setFotoPerfilGuardando(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert("No se pudo verificar la sesión para guardar la foto.");
        return false;
      }

      const formData = new FormData();
      formData.append("foto", archivo);

      const response = await fetch("/api/usuarios/perfil-foto", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const resultado = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          resultado?.error ||
            "No se pudo guardar la foto de perfil."
        );
        return false;
      }

      if (resultado?.signedUrl) {
        setFotoPerfilVista(resultado.signedUrl);
      }

      return true;
    } catch (error) {
      console.error("ERROR GUARDANDO FOTO DE PERFIL:", error);
      alert("No se pudo guardar la foto de perfil.");
      return false;
    } finally {
      setFotoPerfilGuardando(false);
    }
  };

  const procesarArchivoFoto = async (archivo: File) => {
    if (!archivo.type.startsWith("image/")) {
      alert("Selecciona una imagen para la foto de perfil.");
      return;
    }

    if (archivo.size <= 0 || archivo.size > 8 * 1024 * 1024) {
      alert("La imagen debe tener un tamaño entre 1 byte y 8 MB.");
      return;
    }

    const lector = new FileReader();

    lector.onload = async () => {
      setFotoPerfilVista(String(lector.result || ""));
      await guardarFotoEnSupabase(archivo);
    };

    lector.readAsDataURL(archivo);
  };

  const cargarFotoPerfilGuardada = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return;
      }

      const response = await fetch("/api/usuarios/perfil-foto", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const resultado = await response.json().catch(() => null);

      if (!response.ok) {
        console.warn(
          "NO SE PUDO CARGAR FOTO DE PERFIL:",
          resultado?.error || response.status
        );
        return;
      }

      if (resultado?.signedUrl) {
        setFotoPerfilVista(resultado.signedUrl);
      }
    } catch (error) {
      console.warn("ERROR CARGANDO FOTO DE PERFIL:", error);
    }
  };

  useEffect(() => {
    if (!usuario?.id) {
      setFotoPerfilVista("");
      return;
    }

    cargarFotoPerfilGuardada();
  }, [usuario?.id]);

  const manejarFotoPerfil = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    void procesarArchivoFoto(archivo);
    event.target.value = "";
  };

  const abrirSelectorArchivo = async () => {
    try {
      if ("showOpenFilePicker" in window) {
        const selector = (window as Window & {
          showOpenFilePicker?: (options?: {
            multiple?: boolean;
            types?: Array<{
              description?: string;
              accept: Record<string, string[]>;
            }>;
            startIn?: string;
          }) => Promise<any[]>;
        }).showOpenFilePicker;

        if (selector) {
          const [handle] = await selector({
            multiple: false,
            startIn: "pictures",
            types: [
              {
                description: "Imágenes",
                accept: {
                  "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
                },
              },
            ],
          });

          const archivo = await handle.getFile();
          procesarArchivoFoto(archivo);
          return;
        }
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return;
      }
    }

    inputArchivoRef.current?.click();
  };

  const abrirCamara = async () => {
    setMensajeCamara("");

    if (!navigator.mediaDevices?.getUserMedia) {
      await abrirSelectorArchivo();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamCamaraRef.current = stream;
      setCamaraAbierta(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch (error: any) {
      const nombreError = error?.name || "";

      if (
        nombreError === "NotAllowedError" ||
        nombreError === "SecurityError" ||
        nombreError === "NotFoundError" ||
        nombreError === "NotReadableError" ||
        nombreError === "OverconstrainedError" ||
        nombreError === "TypeError"
      ) {
        setMensajeCamara("No se pudo utilizar la cámara. Abriendo selector de imágenes…");
        await abrirSelectorArchivo();
        setMensajeCamara("");
        return;
      }

      await abrirSelectorArchivo();
    }
  };

  const tomarFoto = () => {
    const video = videoRef.current;
    const stream = streamCamaraRef.current;

    if (!video || !stream || video.readyState < 2) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
      detenerCamara();
      return;
    }

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        detenerCamara();
        alert("No se pudo preparar la foto tomada.");
        return;
      }

      const archivo = new File(
        [blob],
        `perfil-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      detenerCamara();
      await procesarArchivoFoto(archivo);
    }, "image/jpeg", 0.9);
  };


  // 🔧 ÍCONO TÉCNICO

  const IconoTecnico = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="3" />
      <path d="M3.5 20c.6-3.1 2.5-5 5.5-5s4.9 1.9 5.5 5" />
      <path d="m16.2 11.2 1.3 1.3" />
      <path d="m18.1 9.3 2.6 2.6" />
      <path d="m20.7 11.9-2.8 2.8" />
      <path d="m17.9 14.7-1.3-1.3" />
    </svg>
  );

  // 🔥 MENU ITEM

  const MenuItem = ({
    href,
    icon,
    label,
  }: any) => {

    const activo =
      pathname === href;

    return (

      <li
        style={{
          marginBottom: 6,
        }}
      >

        <Link
          href={href}
          style={{

            display: "flex",

            alignItems:
              "center",

            gap: 10,

            padding:
              "11px 13px",

            borderRadius: 14,

            textDecoration:
              "none",

            fontWeight:
              600,

            fontSize: 14,

            transition:
              "0.2s",

            background:
              activo
                ? "linear-gradient(135deg,#2563eb,#4f46e5)"
                : "transparent",

            color:
              activo
                ? "#fff"
                : "#374151",

            boxShadow:
              activo
                ? "0 8px 18px rgba(79,70,229,0.25)"
                : "none",

          }}
        >

          <span
            style={{
              fontSize: 17,
            }}
          >
            {icon}
          </span>

          <span>
            {label}
          </span>

        </Link>

      </li>

    );

  };

  // 🔥 TITULOS

  const SectionTitle = ({
    title,
  }: any) => (

    <div
      style={{
        marginTop: 18,
        marginBottom: 10,
        paddingLeft: 6,
        fontSize: 11,
        fontWeight: "bold",
        color: "#9ca3af",
        letterSpacing: 1.2,
      }}
    >
      {title}
    </div>

  );

  return (

    <>
   <button
  className="boton-menu-movil"
  onClick={() => setMenuMovilAbierto(true)}
  style={{
    position: "fixed",
    top: 15,
    left: 15,
    zIndex: 1100,
    width: 45,
    height: 45,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    fontSize: 24,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  }}
>
  ☰
</button>

{menuMovilAbierto && (
  <div
    className="menu-overlay"
    onClick={() => setMenuMovilAbierto(false)}
  />
)}

<aside
  className={`renalix-menu ${
    menuMovilAbierto ? "menu-abierto" : "menu-cerrado"
  }`}
  style={{
        width: 245,
        height: "100vh",

        background:
          "linear-gradient(180deg,#ffffff,#f8fafc)",

        padding: 16,

        position: "fixed",

        left: 0,

        top: 0,

        borderRight:
          "1px solid #e5e7eb",

        overflowY: "auto",

        boxShadow:
          "0 0 25px rgba(0,0,0,0.05)",

          zIndex: 1000,
transition: "transform 0.25s ease",
transform: "translateX(0)",
      }}
    >

      {/* 🔥 LOGO RENALIX */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 12,
          marginBottom: 22,
        }}
      >

        <div
          style={{
            width: 210,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >

          <img
            src="/branding/renalix-horizontal.png"
            alt="RENALIX - Tu Urbanización en Orden"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 86,
              objectFit: "contain",
              display: "block",
            }}
          />

        </div>

        <div
          style={{
            display: "none",
          }}
        >

          <h2
            style={{
              margin: 0,
              fontSize: 21,
              color: "#111827",
              fontWeight: "bold",
            }}
          >
            RENALIX
          </h2>

          <p
            style={{
              margin: 0,
              marginTop: 2,
              color: "#6b7280",
              fontSize: 11,
            }}
          >
            TU URBANIZACIÓN EN ORDEN · Administración · Comunidad · Seguridad
          </p>

        </div>

      </div>










      {/* 🔥 PERFIL */}

      <div
        className="renalix-perfil-card"
        style={{
          background:
            "linear-gradient(135deg,#eff6ff,#eef2ff)",
          borderRadius: 18,
          padding: 14,
          marginBottom: 18,
          border:
            "1px solid #dbeafe",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >

          <button
            type="button"
            className="renalix-perfil-foto"
            onClick={abrirCamara}
            disabled={fotoPerfilGuardando}
            title={
              fotoPerfilGuardando
                ? "Guardando foto de perfil…"
                : "Tomar foto con la cámara o seleccionar una imagen"
            }
            aria-label={
              fotoPerfilGuardando
                ? "Guardando foto de perfil"
                : "Tomar foto con la cámara o seleccionar una imagen"
            }
            style={{
              position: "relative",
              width: 56,
              height: 56,
              minWidth: 56,
              borderRadius: "50%",
              overflow: "hidden",
              background:
                "linear-gradient(135deg,#2563eb,#4f46e5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: "bold",
              cursor: fotoPerfilGuardando ? "wait" : "pointer",
              opacity: fotoPerfilGuardando ? 0.8 : 1,
              boxShadow: "0 6px 14px rgba(79,70,229,0.22)",
              border: "2px solid rgba(255,255,255,0.88)",
            }}
          >
            {fotoPerfilVista ? (
              <img
                src={fotoPerfilVista}
                alt="Foto de perfil"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span aria-hidden="true">👤</span>
            )}

            <span
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#ffffff",
                color: "#2563eb",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 11,
                boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
              }}
            >
              📷
            </span>

            {fotoPerfilGuardando && (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(15,23,42,0.38)",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                …
              </span>
            )}

          </button>

          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
            onChange={manejarFotoPerfil}
            style={{ display: "none" }}
          />

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >

            <div
              style={{
                fontWeight: "bold",
                color: "#111827",
                fontSize: 15,
                lineHeight: 1.2,
              }}
            >
              {usuario?.nombre || "Usuario"}
            </div>

            <div
              style={{
                color: "#4f46e5",
                fontSize: 12,
                marginTop: 3,
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              {rol === "SUPER_ADMIN" && "👑 Super Admin"}
              {rol === "ADMIN" && "⚙️ Administrador"}
              {rol === "GUARDIA" && "🛡️ Guardia"}
              {rol === "RESIDENTE" && "🏠 Residente"}
              {rol === "DIRECTIVA" &&
                `🏛️ Directiva · ${
                  usuario?.cargo_directiva || "Cargo no definido"
                }`}
              {rol === "TECNICO" && "🔧 Técnico"}
            </div>

            {condominioNombre && (
              <div
                style={{
                  marginTop: 5,
                  color: "#475569",
                  fontSize: 11.5,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  overflowWrap: "anywhere",
                }}
              >
                🌐 {condominioNombre}
              </div>
            )}

            {codigoViviendaMenu && (
              <div
                style={{
                  marginTop: 4,
                  color: "#475569",
                  fontSize: 11.5,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  overflowWrap: "anywhere",
                }}
              >
                🏠 {codigoViviendaMenu}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 🔥 MENU */}

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >

{/* GENERAL */}

{rol !== "TECNICO" && (

  <>

    <SectionTitle
      title="GENERAL"
    />

    <MenuItem
      href="/dashboard"
      icon="📊"
      label="Dashboard"
    />

    {(rol === "ADMIN" ||
      rol === "GUARDIA" ||
      rol === "RESIDENTE") && (
      <MenuItem
        href="/avisos"
        icon="📢"
        label="Avisos"
      />
    )}

    {rol !== "DIRECTIVA" && (
      <MenuItem
        href="/novedades"
        icon="📢"
        label="Novedades"
      />
    )}

  </>

)}

{/* DIRECTIVA */}

{rol === "DIRECTIVA" && (
  <>

    <SectionTitle
      title="DIRECTIVA"
    />

    <MenuItem
      href="/finanzas-directiva"
      icon="💰"
      label="Finanzas"
    />

    <MenuItem
      href="/aprobaciones-directiva"
      icon="📋"
      label="Aprobaciones"
    />

    <MenuItem
    href="/configuracion-financiera"
    icon="⚙️"
    label="Configuración Financiera"
  />

  <MenuItem
    href="/sesiones-acuerdos"
    icon="📝"
    label="Sesiones y Acuerdos"
  />

  <MenuItem
    href="/votaciones"
    icon="🗳️"
    label="Votaciones"
  />

  </>
)}

{/* TECNICO */}

{rol === "TECNICO" && (

  <>

    <SectionTitle
      title="PANEL TÉCNICO"
    />

    <MenuItem
      href="/panel-tecnico"
      icon={<IconoTecnico />}
      label="Panel Técnico"
    />

    <MenuItem
      href="/panel-tecnico"
      icon="🛠️"
      label="Mis Servicios"
    />

    <MenuItem
      href="/panel-tecnico/pagos"
      icon="💳"
      label="Pagos y Comprobantes"
    />

  </>

)}



        {/* ADMIN */}

        {(rol === "ADMIN" ||
          rol === "GUARDIA") && (

          <>

            <SectionTitle
              title="ADMINISTRACIÓN"
            />

            <MenuItem
              href="/viviendas"
              icon="🏠"
              label="Viviendas"
            />

            <MenuItem
              href="/residentes"
              icon="👨‍👩‍👧"
              label="Residentes"
            />

            {rol === "ADMIN" && (

              <MenuItem
                href="/guardias"
                icon="🛡️"
                label="Guardias"
              />

            )}

          </>

        )}


        {rol === "ADMIN" && (
  <MenuItem
    href="/directiva"
    icon="🏛️"
    label="Directiva"
  />
)}

        {/* ACCESOS */}

        {(rol === "ADMIN" ||
          rol === "RESIDENTE" ||
          rol === "GUARDIA") && (

          <>

            <SectionTitle
              title="CONTROL ACCESOS"
            />

            <MenuItem
              href="/visitas"
              icon="🚗"
              label="Visitas PIN"
            />

            <MenuItem
              href="/tecnicos"
              icon="🌐"
              label="Ecosistema de Servicios"
            />

            {(
  rol === "ADMIN" ||
  rol === "GUARDIA" ||
  rol === "RESIDENTE"
) && (

  <>

    <MenuItem
      href="/activar-por-pagos"
      icon="💳"
      label="Gestión de Servicios"
    />

    {rol === "GUARDIA" && (
      <MenuItem
        href="/rondas-guardia"
        icon="🛡️"
        label="Rondas de Vigilancia"
      />
    )}

    {(
  rol === "ADMIN" ||
  rol === "GUARDIA" ||
  rol === "RESIDENTE"
) && (
  <MenuItem
    href="/paqueteria"
    icon="📦"
    label="Paquetería"
  />
)}
  </>

)}
               
          </>

        )}

        {/* RESERVAS */}

        {(rol === "ADMIN" ||
          rol === "RESIDENTE") && (

          <>

            <SectionTitle
              title="ÁREAS"
            />

            <MenuItem
              href="/areas-comunes"
              icon="🏊"
              label="Áreas Comunes"
            />

            <MenuItem
              href="/reservas"
              icon="📅"
              label="Reservas"
            />

          </>

        )}

        {/* FINANZAS */}

        {(rol === "ADMIN" ||
          rol === "RESIDENTE") && (

          <>

            <SectionTitle
              title="FINANZAS"
            />

            {rol === "ADMIN" && (

            <>
            <MenuItem
              href="/pagos"
              icon="💰"
              label="Gestión Financiera"
            />

            <MenuItem
              href="/votaciones"
              icon="🗳️"
              label="Votaciones"
            />
            </>
            )}

            {rol === "RESIDENTE" && (

              <>

<MenuItem
  href="/pagos"
  icon="💳"
  label="Pago de Alícuotas"
/>

 <MenuItem
      href="/votaciones"
      icon="🗳️"
      label="Votaciones"
    />
  </>
)}

            <MenuItem
              href="/estado-cuenta"
              icon="📄"
              label="Estado Cuenta"
            />

            <MenuItem
              href="/gastos"
              icon="🧾"
              label="Gastos"
            />

            {rol === "ADMIN" && (

  <>

    <MenuItem
      href="/solicitudes-gastos"
      icon="📋"
      label="Solicitudes Gastos"
    />

    <MenuItem
      href="/solicitudes-aprobadas"
      icon="✅"
      label="Solicitudes Aprobadas"
    />

  </>

)}

          </>

        )}

        {/* CONFIG */}

        {rol === "ADMIN" && (

          <>

            <SectionTitle
              title="CONFIG"
            />

            <MenuItem
              href="/configuracion"
              icon="⚙️"
              label="Configuración"
            />

            <MenuItem
  href="/sectores-ronda"
  icon="📍"
  label="Sectores de Ronda"
/>

          </>

        )}

      </ul>

      {/* 🔥 FOOTER */}

      <div
        style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop:
            "1px solid #e5e7eb",
        }}
      >

        <button
          onClick={logout}
          style={{
            width: "100%",

            padding:
              "12px 16px",

            background:
              "linear-gradient(135deg,#dc2626,#ef4444)",

            color:
              "#fff",

            border:
              "none",

            borderRadius: 14,

            cursor:
              "pointer",

            fontWeight:
              "bold",

            fontSize: 14,

            boxShadow:
              "0 8px 18px rgba(220,38,38,0.2)",
          }}
        >
          🚪 Cerrar sesión
        </button>

      </div>

        </aside>

    {camaraAbierta && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tomar foto de perfil"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2000,
          background: "rgba(15,23,42,0.78)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "min(92vw, 720px)",
            background: "#ffffff",
            borderRadius: 20,
            padding: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <strong style={{ color: "#111827", fontSize: 17 }}>
              📷 Tomar foto de perfil
            </strong>

            <button
              type="button"
              onClick={detenerCamara}
              style={{
                border: "none",
                background: "#f3f4f6",
                color: "#374151",
                borderRadius: 10,
                width: 38,
                height: 38,
                cursor: "pointer",
                fontSize: 18,
              }}
              aria-label="Cerrar cámara"
              title="Cerrar cámara"
            >
              ✕
            </button>
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 3",
              background: "#111827",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          {mensajeCamara && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 13,
                color: "#475569",
                textAlign: "center",
              }}
            >
              {mensajeCamara}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={tomarFoto}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              📸 Tomar foto
            </button>

            <button
              type="button"
              onClick={detenerCamara}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#ffffff",
                color: "#374151",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}

    <style jsx>{`
      .renalix-menu {
        transform: translateX(0);
        transition: transform 0.25s ease;
      }

      .renalix-perfil-foto {
        -webkit-tap-highlight-color: transparent;
        border: 0;
        padding: 0;
        margin: 0;
        appearance: none;
      }

      .renalix-perfil-foto:hover {
        transform: scale(1.03);
        transition: transform 0.15s ease;
      }

      .boton-menu-movil {
  display: none;
}
  .menu-overlay {
  display: none;
}

@media (max-width: 680px) {
  .boton-menu-movil {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 999;
  }
}

      @media (max-width: 680px) {
        .renalix-menu.menu-cerrado {
          transform: translateX(-100%) !important;
        }

        .renalix-menu.menu-abierto {
          transform: translateX(0) !important;
        }
      }

      @media (min-width: 681px) {
        .renalix-menu {
          transform: translateX(0) !important;
        }
      }
    `}</style>

  </>
  );

}
