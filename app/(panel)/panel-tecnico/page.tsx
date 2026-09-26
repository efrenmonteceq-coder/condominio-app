"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 4px 14px rgba(15,23,42,.06)",
};

const mobileCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 4px 14px rgba(15,23,42,.06)",
  textDecoration: "none",
  color: "#0f172a",
};

const mobileIconBox: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 14,
  background: "#eef2ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#2563eb",
};

function Icon({ tipo }: { tipo: "servicios" | "perfil" | "pago" }) {
  const paths: Record<string, React.ReactNode> = {
    servicios: <><path d="M14.7 6.3a4.1 4.1 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.7-7.7a4.1 4.1 0 0 0-2-2z" /><path d="m7 17 2 2" /></>,
    perfil: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" /></>,
    pago: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 9h17M7 14h4" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[tipo]}</svg>;
}

export default function PanelTecnico() {
  const [tecnico, setTecnico] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [comprobantePendiente, setComprobantePendiente] = useState(false);
  const [condominioNombre, setCondominioNombre] = useState("");

  const cargar = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const identificacion = usuario?.identificacion;
    if (!identificacion) { setCargando(false); return; }

    if (usuario?.condominio_id) {
      const { data: condominioDB } = await supabase
        .from("condominios")
        .select("nombre")
        .eq("id", usuario.condominio_id)
        .single();

      setCondominioNombre(condominioDB?.nombre || "");
    } else {
      setCondominioNombre("");
    }

    const { data: tecnicoDB } = await supabase
      .from("tecnicos")
      .select("*")
      .eq("cedula", identificacion)
      .single();

    if (!tecnicoDB) { setCargando(false); return; }
    setTecnico(tecnicoDB);

    const { data: pagos } = await supabase
      .from("pagos_tecnicos")
      .select("*")
      .eq("tecnico_id", tecnicoDB.id);
    setComprobantePendiente(
      (pagos || []).some((p: any) => p.estado === "PENDIENTE")
    );

    const { data: serviciosDB } = await supabase
      .from("servicios_tecnicos")
      .select("*")
      .eq("tecnico_global_id", tecnicoDB.id)
      .order("created_at", { ascending: false })
      .limit(2);
    setServicios(serviciosDB || []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 3000);
    return () => clearInterval(interval);
  }, []);

  if (cargando) return <p style={{ padding: 30 }}>Cargando...</p>;
  if (!tecnico) return <p style={{ padding: 30 }}>No autorizado</p>;

  if (tecnico.estado !== "ACTIVO") {
    return (
      <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "30px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={card}>
            <h1 style={{ marginTop: 0 }}>🔒 Cuenta pendiente de activación</h1>
            <p>Bienvenido <b>{tecnico.nombre}</b>.</p>
            <p>Para utilizar la plataforma debe activar su suscripción.</p>
            <Link href="/panel-tecnico/pagos" style={{ display: "inline-block", marginTop: 12, padding: "12px 18px", borderRadius: 10, background: "#2563eb", color: "white", textDecoration: "none", fontWeight: 700 }}>
              <Icon tipo="pago" /> <span style={{ verticalAlign: "top", marginLeft: 8 }}>Ir a Pagos y Comprobantes</span>
            </Link>
            {comprobantePendiente && <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: "#f0fdf4" }}>✅ Comprobante enviado correctamente. Su pago está siendo revisado por RENALIX.</div>}
          </div>
        </div>
      </main>
    );
  }

  const recientes = servicios.slice(0, 2);

      return (
      <>
        <div className="panel-tecnico-mobile">
          <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "18px 16px 30px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, paddingTop: 6 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0,
                }}>RX</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Ecosistema de Servicios</div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: "#0f172a", lineHeight: 1.15 }}>Panel Técnico</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
                    Bienvenido, <b>{tecnico.nombre}</b>
                  </div>
                  {condominioNombre && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600 }}>
                      🏘️ {condominioNombre}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: "0 0 10px", fontSize: 18, color: "#0f172a" }}>Acciones principales</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
                  <Link href="/panel-tecnico/servicios" style={{ ...mobileCard, background: "#dcfce7", border: "1px solid #86efac", color: "#166534" }}>
                    <div style={{ ...mobileIconBox, background: "#bbf7d0", color: "#15803d" }}><Icon tipo="servicios" /></div>
                    <div style={{ marginTop: 10, fontWeight: 800 }}>Mis Servicios</div>
                    <div style={{ fontSize: 12, color: "#15803d", marginTop: 4 }}>Consulta y gestiona tus servicios</div>
                  </Link>
                  <Link href="/panel-tecnico/perfil" style={{ ...mobileCard, background: "#dbeafe", border: "1px solid #93c5fd", color: "#1e3a8a" }}>
                    <div style={{ ...mobileIconBox, background: "#bfdbfe", color: "#2563eb" }}><Icon tipo="perfil" /></div>
                    <div style={{ marginTop: 10, fontWeight: 800 }}>Mi Perfil</div>
                    <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 4 }}>Datos del profesional</div>
                  </Link>
                  <Link href="/panel-tecnico/pagos" style={{ ...mobileCard, background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e" }}>
                    <div style={{ ...mobileIconBox, background: "#fde68a", color: "#b45309" }}><Icon tipo="pago" /></div>
                    <div style={{ marginTop: 10, fontWeight: 800 }}>Pagos y Comprobantes</div>
                    <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>Estado de tu suscripción</div>
                  </Link>
                </div>
              </div>

              <div style={{ ...mobileCard, marginBottom: 14, background: "#f3e8ff", border: "1px solid #d8b4fe", color: "#581c87" }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#581c87" }}>Estado de tu cuenta</h2>
                <div style={{
                  display: "inline-block", marginTop: 10, padding: "6px 10px",
                  borderRadius: 999, background: "#dcfce7", color: "#166534",
                  fontSize: 12, fontWeight: 800,
                }}>{tecnico.estado || "ACTIVO"}</div>
                <p style={{ color: "#6b21a8", fontSize: 13, margin: "9px 0 0" }}>
                  Tu cuenta de técnico está activa y puedes gestionar tus servicios.
                </p>
              </div>

              <div style={{ ...mobileCard, background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Servicios recientes</h2>
                    <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 12 }}>Tus dos servicios más recientes.</p>
                  </div>
                  <Link href="/panel-tecnico/servicios" style={{
                    textDecoration: "none", fontWeight: 800, color: "#2563eb", fontSize: 13
                  }}>Ver todos →</Link>
                </div>

                {recientes.length === 0 ? (
                  <div style={{ padding: "24px 8px 8px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    Todavía no tienes servicios asignados.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {recientes.map(s => (
                      <div key={s.id} style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 13 }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{s.descripcion || "Servicio solicitado"}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Residente: {s.residente_nombre || "-"}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Vivienda: {s.residente_vivienda || "-"}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Estado: <b>{s.estado || "SIN ESTADO"}</b></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        <div className="panel-tecnico-desktop">
          <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "30px 20px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Ecosistema de Servicios</div>
                <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>👨‍🔧 Panel Técnico</h1>
                <p style={{ margin: "7px 0 0", color: "#64748b" }}>Bienvenido, <b>{tecnico.nombre}</b>. Este es tu resumen.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
                <Link href="/panel-tecnico/perfil" style={{ textDecoration: "none", color: "inherit" }}><div style={card}><Icon tipo="perfil" /><div style={{ marginTop: 10, fontWeight: 700 }}>Mi Perfil</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Datos del profesional</div></div></Link>
                <Link href="/panel-tecnico/servicios" style={{ textDecoration: "none", color: "inherit" }}><div style={card}><Icon tipo="servicios" /><div style={{ marginTop: 10, fontWeight: 700 }}>Mis Servicios</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{servicios.length} servicio(s) registrado(s)</div></div></Link>
                <Link href="/panel-tecnico/pagos" style={{ textDecoration: "none", color: "inherit" }}><div style={card}><Icon tipo="pago" /><div style={{ marginTop: 10, fontWeight: 700 }}>Pagos y Comprobantes</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Estado de tu suscripción</div></div></Link>
              </div>

              <div style={{ ...card, marginBottom: 18 }}>
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>Estado de tu cuenta</h2>
                <div style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>{tecnico.estado || "ACTIVO"}</div>
                <p style={{ color: "#64748b", marginBottom: 0 }}>Tu cuenta de técnico está activa y puedes gestionar tus servicios.</p>
              </div>

              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div><h2 style={{ margin: 0, color: "#0f172a" }}>Servicios recientes</h2><p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>Tus dos servicios más recientes.</p></div>
                  <Link href="/panel-tecnico/servicios" style={{ textDecoration: "none", fontWeight: 700, color: "#2563eb" }}>Buscar servicios →</Link>
                </div>
                {recientes.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: "#64748b" }}>Todavía no tienes servicios asignados.</div> : <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{recientes.map(s => <div key={s.id} style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 15 }}><div style={{ fontWeight: 700 }}>{s.descripcion || "Servicio solicitado"}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 7 }}>Residente: {s.residente_nombre || "-"} · Vivienda: {s.residente_vivienda || "-"}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Estado: <b>{s.estado || "SIN ESTADO"}</b></div></div>)}</div>}
              </div>
            </div>
          </main>
        </div>

        <style jsx>{`
          .panel-tecnico-mobile { display: none; }
          .panel-tecnico-desktop { display: block; }
          @media (max-width: 680px) {
            .panel-tecnico-mobile { display: block; }
            .panel-tecnico-desktop { display: none; }
          }
        `}</style>
      </>
    );
}
