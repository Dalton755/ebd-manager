import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { NotificationService } from "@/modules/notifications/services/NotificationService";
import type { Notificacao } from "@/modules/notifications/repositories/NotificationRepository";

export function NotificationBell() {

    const { pessoa } = useAuth();

    const [notificacoes, setNotificacoes] =
        useState<Notificacao[]>([]);

    const [aberto, setAberto] =
        useState(false);

    const [carregando, setCarregando] =
        useState(false);


    async function carregarNotificacoes() {

        if (!pessoa?.id) {
            return;
        }

        try {

            setCarregando(true);

            const dados =
                await NotificationService.listarPorPessoa(
                    pessoa.id
                );

            setNotificacoes(dados);

        } catch (error) {

            console.error(
                "Erro ao carregar notificações:",
                error
            );

        } finally {

            setCarregando(false);

        }
    }


    useEffect(() => {

        carregarNotificacoes();

    }, [pessoa?.id]);


    const naoLidas =
        notificacoes.filter(
            (notificacao) =>
                !notificacao.lida
        ).length;


    async function abrirNotificacao(
        notificacao: Notificacao
    ) {

        try {

            if (!notificacao.lida) {

                await NotificationService.marcarComoLida(
                    notificacao.id
                );

                setNotificacoes(
                    (anteriores) =>
                        anteriores.map(
                            (item) =>
                                item.id === notificacao.id
                                    ? {
                                        ...item,
                                        lida: true,
                                    }
                                    : item
                        )
                );
            }

        } catch (error) {

            console.error(
                "Erro ao marcar notificação como lida:",
                error
            );

        }
    }


    return (

        <div className="relative">

            {/* SINO */}

            <button
                type="button"
                onClick={() => setAberto(!aberto)}
                className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notificações"
            >

                <Bell size={21} />

                {naoLidas > 0 && (

                    <span
                        className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
                    >
                        {naoLidas > 9
                            ? "9+"
                            : naoLidas}
                    </span>

                )}

            </button>


            {/* PAINEL */}

            {aberto && (

                <>

                    {/* Área para fechar ao clicar fora */}

                    <button
                        type="button"
                        aria-label="Fechar notificações"
                        onClick={() => setAberto(false)}
                        className="fixed inset-0 z-40 cursor-default"
                    />


                    <div
                        className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                    >

                        {/* CABEÇALHO */}

                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                            <div>

                                <h3 className="font-semibold text-slate-800">
                                    Notificações
                                </h3>

                                {naoLidas > 0 && (

                                    <p className="text-xs text-slate-500">
                                        {naoLidas} não lida
                                        {naoLidas !== 1
                                            ? "s"
                                            : ""}
                                    </p>

                                )}

                            </div>

                            <Bell
                                size={18}
                                className="text-slate-400"
                            />

                        </div>


                        {/* CONTEÚDO */}

                        <div className="max-h-96 overflow-y-auto">

                            {carregando && (

                                <div className="px-4 py-8 text-center text-sm text-slate-500">
                                    Carregando...
                                </div>

                            )}


                            {!carregando &&
                                notificacoes.length === 0 && (

                                    <div className="px-4 py-8 text-center text-sm text-slate-500">

                                        <Bell
                                            size={28}
                                            className="mx-auto mb-2 text-slate-300"
                                        />

                                        Nenhuma notificação.

                                    </div>

                                )}


                            {!carregando &&
                                notificacoes.map(
                                    (notificacao) => (

                                        <button
                                            key={notificacao.id}
                                            type="button"
                                            onClick={() =>
                                                abrirNotificacao(
                                                    notificacao
                                                )
                                            }
                                            className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                                                notificacao.lida
                                                    ? "bg-white"
                                                    : "bg-blue-50/50"
                                            }`}
                                        >

                                            <div className="flex gap-3">

                                                <div
                                                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                        notificacao.lida
                                                            ? "bg-slate-100 text-slate-400"
                                                            : "bg-blue-100 text-blue-700"
                                                    }`}
                                                >

                                                    {notificacao.lida
                                                        ? (
                                                            <Check
                                                                size={16}
                                                            />
                                                        )
                                                        : (
                                                            <Bell
                                                                size={16}
                                                            />
                                                        )}

                                                </div>


                                                <div className="min-w-0 flex-1">

                                                    <p
                                                        className={`text-sm ${
                                                            notificacao.lida
                                                                ? "font-medium text-slate-600"
                                                                : "font-semibold text-slate-800"
                                                        }`}
                                                    >
                                                        {notificacao.titulo}
                                                    </p>


                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        {notificacao.mensagem}
                                                    </p>


                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                        {new Date(
                                                            notificacao.created_at
                                                        ).toLocaleString(
                                                            "pt-BR"
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                        </button>

                                    )
                                )}

                        </div>

                    </div>

                </>

            )}

        </div>
    );
}