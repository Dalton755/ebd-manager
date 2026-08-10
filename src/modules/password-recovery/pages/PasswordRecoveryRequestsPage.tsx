import {
    useEffect,
    useState,
} from "react";

import { toast } from "sonner";

import {
    KeyRound,
    LockKeyhole,
    X,
} from "lucide-react";

import {
    PasswordRecoveryAdminService,
} from "../services/PasswordRecoveryAdminService";

import type {
    PasswordRecoveryRequest,
} from "../types/PasswordRecoveryRequest";

export function PasswordRecoveryRequestsPage() {
    const [solicitacoes, setSolicitacoes] =
        useState<PasswordRecoveryRequest[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [solicitacaoSelecionada, setSolicitacaoSelecionada] =
        useState<PasswordRecoveryRequest | null>(null);

    const [novaSenha, setNovaSenha] =
        useState("");

    const [confirmarSenha, setConfirmarSenha] =
        useState("");

    const [salvando, setSalvando] =
        useState(false);

    async function carregarSolicitacoes() {
        try {
            setLoading(true);

            const data =
                await PasswordRecoveryAdminService
                    .listarPendentes();

            setSolicitacoes(data);

        } catch (error) {
            console.error(
                "Erro ao carregar solicitações:",
                error
            );

            toast.error(
                "Não foi possível carregar as solicitações de senha."
            );

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarSolicitacoes();
    }, []);

    function formatarData(data: string) {
        return new Intl.DateTimeFormat(
            "pt-BR",
            {
                dateStyle: "short",
                timeStyle: "short",
            }
        ).format(new Date(data));
    }

    function abrirModal(
        solicitacao: PasswordRecoveryRequest
    ) {
        setSolicitacaoSelecionada(solicitacao);
        setNovaSenha("");
        setConfirmarSenha("");
    }

    function fecharModal() {
        if (salvando) {
            return;
        }

        setSolicitacaoSelecionada(null);
        setNovaSenha("");
        setConfirmarSenha("");
    }

    async function redefinirSenha() {
        if (!solicitacaoSelecionada) {
            return;
        }

        if (novaSenha.length < 6) {
            toast.error(
                "A nova senha deve ter pelo menos 6 caracteres."
            );

            return;
        }

        if (novaSenha !== confirmarSenha) {
            toast.error(
                "As senhas não coincidem."
            );

            return;
        }

        try {
            setSalvando(true);

            await PasswordRecoveryAdminService
                .redefinirSenha(
                    solicitacaoSelecionada.id,
                    novaSenha
                );

            toast.success(
                `Senha de ${solicitacaoSelecionada.pessoa.nome} redefinida com sucesso.`
            );

            fecharModal();

            await carregarSolicitacoes();

        } catch (error) {
            console.error(
                "Erro ao redefinir senha:",
                error
            );

            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Não foi possível redefinir a senha.";

            toast.error(mensagem);

        } finally {
            setSalvando(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-slate-500">
                    Carregando solicitações de senha...
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-6 flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                        <KeyRound size={24} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Solicitações de senha
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Gerencie os pedidos de redefinição de senha dos usuários.
                        </p>
                    </div>
                </div>

                {solicitacoes.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <KeyRound
                            size={32}
                            className="mx-auto text-slate-400"
                        />

                        <h2 className="mt-3 text-lg font-semibold text-slate-700">
                            Nenhuma solicitação pendente
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Não há solicitações de redefinição de senha aguardando atendimento.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {solicitacoes.map((solicitacao) => (
                            <div
                                key={solicitacao.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
                            >
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <h2 className="font-semibold text-slate-800">
                                            {solicitacao.pessoa.nome}
                                        </h2>

                                        <p className="mt-1 break-all text-sm text-slate-500">
                                            {solicitacao.pessoa.email}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {solicitacao.pessoa.telefone ||
                                                "Telefone não informado"}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-400">
                                            Solicitado em{" "}
                                            {formatarData(
                                                solicitacao.solicitado_em
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-start gap-3 sm:items-end">
                                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                            PENDENTE
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                abrirModal(
                                                    solicitacao
                                                )
                                            }
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            <LockKeyhole size={16} />

                                            Redefinir senha
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {solicitacaoSelecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Redefinir senha
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Defina uma nova senha para{" "}
                                    <strong>
                                        {solicitacaoSelecionada.pessoa.nome}
                                    </strong>.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Nova senha
                                </label>

                                <input
                                    type="password"
                                    value={novaSenha}
                                    onChange={(event) =>
                                        setNovaSenha(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Mínimo de 6 caracteres"
                                    disabled={salvando}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Confirmar nova senha
                                </label>

                                <input
                                    type="password"
                                    value={confirmarSenha}
                                    onChange={(event) =>
                                        setConfirmarSenha(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Digite a senha novamente"
                                    disabled={salvando}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter"
                                        ) {
                                            redefinirSenha();
                                        }
                                    }}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={redefinirSenha}
                                disabled={salvando}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {salvando
                                    ? "Redefinindo..."
                                    : "Confirmar redefinição"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}