import Menu from "@/app/components/Menu";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {children}
      </main>
    </div>
  );
}