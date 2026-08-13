import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
//import marcaDagua from "@/assets/marca-dagua.png";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        <Header />

        <main
          style={{
            backgroundColor: "red",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              padding: "40px",
              color: "white",
              fontSize: "30px",
            }}
          >
            TESTE APPSHELL
          </div>

          <Outlet />
        </main>

      </div>

    </div>
  );
}