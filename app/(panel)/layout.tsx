import Menu from
"@/app/components/Menu";

export default function
PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "#f5f7fa",
      }}
    >

      <Menu />

      <main
  style={{
    flex: 1,
    padding: "25px",
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
  }}
>

        {children}

      </main>

    </div>

  );

}