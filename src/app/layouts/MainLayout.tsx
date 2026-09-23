import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { X } from "lucide-react";

import { Sidebar } from "@/shared/components/layout/Sidebar";
import { Header } from "@/shared/components/layout/Header";
import { MobileBottomNav } from "@/shared/components/layout/MobileBottomNav";
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

    const location =
        useLocation();

    const mainRef =
        useRef<HTMLElement | null>(
            null
        );


    /*
     * Impede que a checagem seja
     * executada várias vezes durante
     * a mesma montagem do layout.
     */
    const onboardingVerificado =
        useRef<string | null>(
            null
        );


    /*
     * Guarda a posição de cada tela durante a sessão.
     * Se o Android descarregar e recriar a aba, o usuário
     * volta praticamente ao mesmo ponto em que estava.
     */
    useEffect(() => {

        const elemento =
            mainRef.current;

        if (!elemento) {
            return;
        }

        const chave =
            `ebd_scroll:${location.pathname}${location.search}`;

        const posicaoSalva =
            Number(
                window.sessionStorage
                    .getItem(
                        chave
                    ) ??
                "0"
            );

        const frame =
            window.requestAnimationFrame(
                () => {

                    elemento.scrollTo({
                        top:
                            Number.isFinite(
                                posicaoSalva
                            )
                                ? posicaoSalva
                                : 0,

                        behavior:
                            "auto",
                    });
                }
            );

        const salvar =
            () => {

                window.sessionStorage
                    .setItem(
                        chave,
                        String(
                            elemento.scrollTop
                        )
                    );
            };

        elemento.addEventListener(
            "scroll",
            salvar,
            {
                passive:
                    true,
            }
        );

        return () => {

            window.cancelAnimationFrame(
                frame
            );

            salvar();

            elemento.removeEventListener(
                "scroll",
                salvar
            );
        };

    }, [
        location.pathname,
        location.search,
    ]);


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
                <Header
                    onOpenMenu={() =>
                        setMenuOpen(
                            true
                        )
                    }
                />

                <main
                    ref={
                        mainRef
                    }
                    className="relative min-w-0 flex-1 overflow-auto overscroll-y-contain bg-slate-50"
                >

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
                    <div className="relative z-10 mx-auto w-full max-w-[1600px] p-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
                        <Outlet />
                    </div>

                </main>

                <MobileBottomNav
                    onOpenMenu={() =>
                        setMenuOpen(
                            true
                        )
                    }
                />
            </div>
        </div>
    );
}