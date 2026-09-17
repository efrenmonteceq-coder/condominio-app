"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, boxShadow: "0 4px 14px rgba(15,23,42,.06)" };

export default function MisServiciosTecnico() {
  const [tecnico, setTecnico] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const identificacion = usuario?.identificacion;
    if (!identificacion) { setCargando(false); return; }
    const { data: tecnicoDB } = await supabase.from("tecnicos").select("*").eq("cedula", identificacion).single();
    if (!tecnicoDB) { setCargando(false); return; }
    setTecnico(tecnicoDB);
    const { data } = await supabase.from("servicios_tecnicos").select("*").eq("tecnico_global_id", tecnicoDB.id).order("created_at", { ascending: false });
    setServicios(data || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); const interval = setInterval(cargar, 3000); return () => clearInterval(interval); }, []);

  if (cargando) return <p style={{ padding: 30 }}>Cargando...</p>;
  if (!tecnico) return <p style={{ padding: 30 }}>No autorizado</p>;

  const termino = busqueda.trim().toLowerCase();
  const filtrados = termino ? servicios.filter(s => [s.descripcion, s.residente_nombre, s.residente_telefono, s.residente_vivienda, s.condominio_nombre, s.estado].some(v => String(v || "").toLowerCase().includes(termino))) : servicios.slice(0, 2);

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "30px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Ecosistema de Servicios</div>
          <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>🛠️ Mis Servicios</h1>
          <p style={{ margin: "7px 0 0", color: "#64748b" }}>Gestiona tus servicios asignados y consulta tu historial.</p>
        </div>

        <div style={{ ...card, marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Buscar en mis servicios</label>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Descripción, residente, teléfono, vivienda, condominio o estado" style={{ width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 11, border: "1px solid #d1d5db", outline: "none" }} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{termino ? `${filtrados.length} resultado(s)` : `Mostrando los ${Math.min(2, servicios.length)} servicios más recientes`}</div>
        </div>

        {filtrados.length === 0 ? <div style={{ ...card, textAlign: "center", color: "#64748b" }}>{termino ? "No encontramos servicios con esa búsqueda." : "Todavía no tienes servicios asignados."}</div> : <div style={{ display: "grid", gap: 14 }}>{filtrados.map(s => <div key={s.id} style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0, fontSize: 17, color: "#0f172a" }}>{s.descripcion || "Servicio solicitado"}</h2><span style={{ padding: "5px 9px", borderRadius: 999, background: "#f1f5f9", color: "#334155", fontSize: 11, fontWeight: 700 }}>{s.estado || "SIN ESTADO"}</span></div><div style={{ borderTop: "1px solid #eef2f7", marginTop: 14, paddingTop: 13, display: "grid", gap: 8, fontSize: 13, color: "#475569" }}><div><b style={{ color: "#0f172a" }}>Residente:</b> {s.residente_nombre || "-"}</div><div><b style={{ color: "#0f172a" }}>Teléfono:</b> {s.residente_telefono || "-"}</div><div><b style={{ color: "#0f172a" }}>Vivienda:</b> {s.residente_vivienda || "-"}</div><div><b style={{ color: "#0f172a" }}>Condominio:</b> {s.condominio_nombre || "-"}</div><div><b style={{ color: "#0f172a" }}>Fecha:</b> {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}</div></div></div>)}</div>}

        <div style={{ marginTop: 22 }}><Link href="/panel-tecnico" style={{ textDecoration: "none", color: "#2563eb", fontWeight: 700 }}>← Volver al Panel Técnico</Link></div>
      </div>
    </main>
  );
}
