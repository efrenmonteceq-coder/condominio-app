"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    useEffect(() => {
  setMenuMovilAbierto(false);
}, [pathname]);

  // 🔥 ROL

  const rol =
    (usuario?.rol || "")
      .toUpperCase()
      .trim();
  useEffect(() => {
    const cargarCondominioTecnico = async () => {
      if (rol !== "TECNICO" || !usuario?.condominio_id) {
        setCondominioNombre("");
        return;
      }

      const { data } = await supabase
        .from("condominios")
        .select("nombre")
        .eq("id", usuario.condominio_id)
        .single();

      setCondominioNombre(data?.nombre || "");
    };

    cargarCondominioTecnico();
  }, [rol, usuario?.condominio_id]);


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

      {/* 🔥 LOGO */}

      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          gap: 12,
          marginBottom: 22,
        }}
      >

        <div
          style={{
            width: 52,
            height: 52,

            borderRadius:
              16,

            background:
              "linear-gradient(135deg,#2563eb,#4f46e5)",

            display: "flex",

            justifyContent:
              "center",

            alignItems:
              "center",

            fontSize: 22,

            color:
              "#fff",

            fontWeight:
              "bold",

            boxShadow:
              "0 10px 24px rgba(79,70,229,0.28)",
          }}
        >
          RX
        </div>

        <div>

          <h2
            style={{
              margin: 0,
              fontSize: 21,
              color:
                "#111827",
              fontWeight:
                "bold",
            }}
          >
            RENALIX
          </h2>

          <p
            style={{
              margin: 0,
              marginTop: 2,
              color:
                "#6b7280",
              fontSize: 11,
            }}
          >
            Smart Residential ERP
          </p>

        </div>

      </div>

      {/* 🔥 PERFIL */}

      <div
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
            alignItems:
              "center",
            gap: 12,
          }}
        >

          <div
            style={{
              width: 44,
              height: 44,

              borderRadius:
                "50%",

              background:
                "linear-gradient(135deg,#2563eb,#4f46e5)",

              display: "flex",

              justifyContent:
                "center",

              alignItems:
                "center",

              color:
                "#fff",

              fontSize: 18,

              fontWeight:
                "bold",
            }}
          >
            👤
          </div>

          <div>

            <div
              style={{
                fontWeight:
                  "bold",

                color:
                  "#111827",

                fontSize: 14,
              }}
            >
              {usuario?.nombre ||
                "Usuario"}
            </div>

            <div
              style={{
                color:
                  "#4f46e5",

                fontSize: 12,

                marginTop: 2,

                fontWeight:
                  600,
              }}
            >

              {rol ===
                "SUPER_ADMIN" &&
                "👑 Super Admin"}

              {rol ===
                "ADMIN" &&
                "⚙️ Administrador"}

              {rol ===
                "GUARDIA" &&
                "🛡️ Guardia"}

              {rol ===
                "RESIDENTE" &&
                "🏠 Residente"}

              {rol === "DIRECTIVA" &&
  `🏛️ Directiva · ${
    usuario?.cargo_directiva || "Cargo no definido"
  }`}

              {rol === "TECNICO" && "🔧 Técnico"}

              {rol === "TECNICO" && condominioNombre && (
                <div
                  style={{
                    marginTop: 3,
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  🏘️ {condominioNombre}
                </div>
              )}

            </div>

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

    <style jsx>{`
      .renalix-menu {
        transform: translateX(0);
        transition: transform 0.25s ease;
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