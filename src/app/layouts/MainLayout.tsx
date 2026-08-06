import { Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-blue-700">
            EBD Manager
          </h1>

          <p className="text-xs text-slate-500">
            Sistema de Gestão da Escola Bíblica
          </p>
        </div>

        <div className="text-sm text-slate-500">
          Usuário
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}