import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Outlet,
    useNavigate,
} from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Sidebar } from "@/shared/components/layout/Sidebar";
import { Header } from "@/shared/components/layout/Header";
import marcaDagua from "@/assets/marca-dagua.png";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
} from "@/shared/auth/permissions";

import {
    OnboardingService,
} from "@/modules/onboarding/services/OnboardingService";

export function MainLayout() {

    const [
        menuOpen,
        setMenuOpen,
    ] =
        useState(false);


    const {
        pessoa,
    } =
        useAuth();


    const navigate =
        useNavigate();


    /*
     * Impede que a checagem seja
     * executada várias vezes durante
     * a mesma montagem do layout.
     */
    const onboardingVerificado =
        useRef<string | null>(
            null
        );


    useEffect(() => {

        async function verificarPrimeiroAcesso() {

            if (
                !pessoa?.id
            ) {
                return;
            }


            /*
             * Já verificamos esse usuário
             * nesta sessão do layout.
             */
            if (
                onboardingVerificado.current ===
                pessoa.id
            ) {
                return;
            }


            onboardingVerificado.current =
                pessoa.id;


            /*
             * Usuários pendentes não entram
             * no fluxo administrativo.
             */
            if (
                pessoa.perfil ===
                "PENDENTE"
            ) {
                return;
            }


            const podeGerenciarPessoas =
                temPermissao(
                    pessoa.perfil,
                    "GERENCIAR_PESSOAS"
                );


            /*
             * Aluno, professor ou outro
             * usuário sem essa permissão
             * não recebe este onboarding.
             */
            if (
                !podeGerenciarPessoas
            ) {
                return;
            }


            try {

                const deveExibir =
                    await OnboardingService
                        .deveExibir(
                            pessoa.id,
                            "PESSOAS",
                            1
                        );


                if (
                    deveExibir
                ) {

                    navigate(
                        "/pessoas",
                        {
                            replace:
                                true,
                        }
                    );

                }


            } catch (error) {

                /*
                 * Uma falha no tutorial jamais
                 * deve impedir o usuário de
                 * utilizar o EBD Manager.
                 */
                console.error(
                    "[ONBOARDING] Erro ao verificar primeiro acesso:",
                    error
                );

            }

        }


        void verificarPrimeiroAcesso();

    }, [
        pessoa?.id,
        pessoa?.perfil,
        navigate,
    ]);

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