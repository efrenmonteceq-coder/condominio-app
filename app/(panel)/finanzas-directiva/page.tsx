export default function FinanzasDirectiva() {
  return (
    <div
      style={{
        padding: 24,
      }}
    >
      <h1
        style={{
          marginBottom: 20,
        }}
      >
        💰 Finanzas Directiva
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3>💰 Ingresos</h3>
          <h2>$0.00</h2>
        </div>

        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3>🧾 Gastos</h3>
          <h2>$0.00</h2>
        </div>

        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3>📊 Saldo</h3>
          <h2>$0.00</h2>
        </div>

        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3>⚠ Cartera Vencida</h3>
          <h2>$0.00</h2>
        </div>
      </div>
    </div>
  );
}