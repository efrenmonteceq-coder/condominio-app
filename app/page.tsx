"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // FORMULARIO
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);

  // BÚSQUEDA
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<any[]>([]);

  // CREAR
  const crearConjunto = async () => {
    if (!nombre) return alert("El nombre es obligatorio");

    await supabase.from("condominios").insert([
      { nombre, tipo, direccion, ciudad, provincia, telefono, email },
    ]);

    limpiarFormulario();
    alert("Guardado correctamente");
  };

  // BUSCAR
  const buscarConjunto = async () => {
    const { data } = await supabase
      .from("condominios")
      .select("*")
      .ilike("nombre", `%${busqueda}%`);

    if (data) setResultado(data);
  };

  // ELIMINAR
  const eliminarConjunto = async (id: string) => {
    const confirmar = confirm("¿Eliminar este conjunto?");
    if (!confirmar) return;

    await supabase.from("condominios").delete().eq("id", id);
    buscarConjunto();
  };

  // EDITAR (cargar datos)
  const editarConjunto = (c: any) => {
    setEditandoId(c.id);
    setNombre(c.nombre || "");
    setTipo(c.tipo || "");
    setDireccion(c.direccion || "");
    setCiudad(c.ciudad || "");
    setProvincia(c.provincia || "");
    setTelefono(c.telefono || "");
    setEmail(c.email || "");
  };

  // GUARDAR EDICIÓN
  const guardarEdicion = async () => {
    if (!editandoId) return;

    await supabase
      .from("condominios")
      .update({ nombre, tipo, direccion, ciudad, provincia, telefono, email })
      .eq("id", editandoId);

    setEditandoId(null);
    limpiarFormulario();
    buscarConjunto();
  };

  // LIMPIAR
  const limpiarFormulario = () => {
    setNombre("");
    setTipo("");
    setDireccion("");
    setCiudad("");
    setProvincia("");
    setTelefono("");
    setEmail("");
  };

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Sistema de Gestión de Conjuntos Habitacionales</h1>

      {/* FORMULARIO */}
      <h2>{editandoId ? "Editar Conjunto" : "Registrar Conjunto"}</h2>

      <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /><br />
      <input placeholder="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} /><br />
      <input placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} /><br />
      <input placeholder="Ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} /><br />
      <input placeholder="Provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} /><br />
      <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} /><br />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br /><br />

      {editandoId ? (
        <button onClick={guardarEdicion}>Guardar cambios</button>
      ) : (
        <button onClick={crearConjunto}>Guardar</button>
      )}

      <hr />

      {/* BUSCADOR */}
      <h2>Buscar Conjunto</h2>

      <input
        placeholder="Nombre del conjunto"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <button onClick={buscarConjunto}>Buscar</button>

      {/* RESULTADOS */}
      <h2>Resultados</h2>

      {resultado.length === 0 ? (
        <p>No hay resultados</p>
      ) : (
        resultado.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginTop: "10px",
            }}
          >
            <b>{c.nombre}</b><br />
            Tipo: {c.tipo} <br />
            Dirección: {c.direccion} <br />
            Ciudad: {c.ciudad} <br />
            Provincia: {c.provincia} <br />
            Teléfono: {c.telefono} <br />
            Email: {c.email} <br /><br />

            <button onClick={() => editarConjunto(c)}>
              Modificar
            </button>

            <button
              onClick={() => eliminarConjunto(c.id)}
              style={{ marginLeft: "10px", color: "red" }}
            >
              Eliminar
            </button>
          </div>
        ))
      )}
    </main>
  );
}