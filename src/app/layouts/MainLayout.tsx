import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Sidebar } from "@/shared/components/layout/Sidebar";
import { Header } from "@/shared/components/layout/Header";
import marcaDagua from "@/assets/marca-dagua.png";

export function MainLayout() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen w-full bg-slate-50">
            {/* Sidebar desktop */}
            <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:block">
                <Sidebar />
            </aside>

            {/* Fundo escuro do menu mobile */}
            {menuOpen && (
                <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
                />
            )}

            {/* Sidebar mobile */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white p-6 shadow-xl transition-transform duration-300 md:hidden ${menuOpen
                        ? "translate-x-0"
                        : "-translate-x-full"
                    }`}
            >
                <div className="mb-6 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="rounded-lg p-2 hover:bg-slate-100"
                        aria-label="Fechar menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                <Sidebar

                    onNavigate={() => setMenuOpen(false)}
                />
            </aside>

            {/* Área principal */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center border-b border-slate-200 bg-white md:hidden">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="p-4"
                        aria-label="Abrir menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <Header />

                <main className="relative min-w-0 flex-1 overflow-auto bg-slate-50">

                    {/* MARCA D'ÁGUA */}
                    <div
                        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
                        aria-hidden="true"
                    >
                        <img
                            src={marcaDagua}
                            alt=""
                            className="w-[90%] max-w-[1100px] opacity-30"
                        />
                    </div>

                    {/* CONTEÚDO */}
                    <div className="relative z-10 p-4 md:p-6">
                        <Outlet />
                    </div>

                </main>
            </div>
        </div>
    );
}