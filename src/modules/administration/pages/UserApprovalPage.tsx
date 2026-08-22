import {
    useEffect,
    useState,
} from "react";

import {
    AlertTriangle,
    ArrowUpCircle,
    Users,
} from "lucide-react";

import { toast } from "sonner";

import type { Pessoa } from "@/modules/people/types/Pessoa";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import {
    UserApprovalService,
} from "../services/UserApprovalService";


import { PlanLimitModal } from "@/shared/components/plans/PlanLimitModal";

type PerfilAprovacao =
    | "ALUNO"
    | "PASTOR"
    | "SUPERINTENDENTE"
    | "PROFESSOR";

export function UserApprovalPage() {

    const { plano } = useAuth();

    const nomePlano =
        plano?.plano?.nome ?? "Semente";

    const recursoLiberado =
        nomePlano === "Crescimento" ||
        nomePlano === "Igreja";

    const [usuarios, setUsuarios] =
        useState<Pessoa[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [processingId, setProcessingId] =
        useState<string | null>(null);

    const [perfis, setPerfis] =
        useState<Record<string, PerfilAprovacao>>({});

    const [limitePessoas, setLimitePessoas] =
        useState<{
            utilizado: number;
            limite: number;
        } | null>(null);

    async function carregarUsuarios() {
        try {
            setLoading(true);

            const data =
                await UserApprovalService.listarPendentes();

            setUsuarios(data);

            const perfisIniciais: Record<
                string,
                PerfilAprovacao
            > = {};

            data.forEach((usuario) => {
                if (usuario.id) {
                    perfisIniciais[usuario.id] =
                        "ALUNO";
                }
            });

            setPerfis(perfisIniciais);

        } catch (error) {
            console.error(error);

            toast.error(
                "Não foi possível carregar os cadastros pendentes."
            );

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (recursoLiberado) {
            carregarUsuarios();
        } else {
            setLoading(false);
        }
    }, [recursoLiberado]);

    async function aprovarUsuario(id: string) {
        try {
            setProcessingId(id);

            const resultado =
                await UserApprovalService.aprovar(
                    id,
                    perfis[id] ?? "ALUNO"
                );

            if ("codigo" in resultado) {
                if (
                    resultado.codigo ===
                    "LIMITE_PESSOAS_ATINGIDO"
                ) {
                    setLimitePessoas({
                        utilizado: resultado.utilizado,
                        limite: resultado.limite,
                    });

                    return;
                }

                toast.error(
                    "Não foi possível aprovar o usuário."
                );

                return;
            }

            toast.success(
                "Usuário aprovado com sucesso!"
            );

            await carregarUsuarios();

        } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível aprovar o usuário."
            );

        } finally {
            setProcessingId(null);
        }
    }

    async function rejeitarUsuario(id: string) {
        try {
            setProcessingId(id);

            await UserApprovalService.rejeitar(id);

            toast.success(
                "Cadastro rejeitado."
            );

            await carregarUsuarios();

        } catch (error) {
            console.error(error);

            toast.error(
                "Não foi possível rejeitar o usuário."
            );

        } finally {
            setProcessingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-slate-500">
                    Carregando cadastros pendentes...
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Aprovação de usuários
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Analise os novos cadastros e defina o perfil de acesso.
                    </p>
                </div>

                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex gap-3">
                            <div className="mt-0.5 rounded-lg bg-white p-2 text-blue-600">
                                <Users size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-blue-900">
                                    Como funciona o cadastro de usuários
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-blue-800">
                                    Novos usuários não fazem autocadastro neste modelo.
                                    Para cadastrar uma nova pessoa, utilize o menu
                                    <strong> Pessoas</strong>.
                                </p>

                                <p className="mt-2 text-sm leading-6 text-blue-800">
                                    Após o cadastro, você poderá definir o perfil e
                                    gerenciar o acesso do usuário.
                                </p>
                            </div>
                        </div>

                        {!recursoLiberado && (
                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = "/planos";
                                }}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <ArrowUpCircle size={17} />
                                Fazer upgrade
                            </button>
                        )}

                    </div>
                </div>

                {!recursoLiberado && (
                    <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
                        <AlertTriangle
                            size={21}
                            className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <div>
                            <h2 className="font-semibold text-amber-900">
                                Recurso disponível no plano Crescimento
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                A aprovação de usuários está disponível a partir do
                                plano <strong>Crescimento</strong>. Faça o upgrade para
                                liberar este recurso.
                            </p>
                        </div>
                    </div>
                )}

                {!recursoLiberado ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="mx-auto max-w-2xl text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <Users size={28} />
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-slate-800">
                                Recurso disponível no plano Crescimento
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                A aprovação de usuários é liberada a partir do
                                plano <strong>Crescimento</strong>.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                No modelo atual do EBD Manager, novos usuários não
                                fazem autocadastro. O cadastro deve ser realizado
                                pelo administrador através do menu <strong>Pessoas</strong>.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = "/planos";
                                }}
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <ArrowUpCircle size={18} />
                                Fazer upgrade
                            </button>

                        </div>
                    </div>
                ) : usuarios.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                        <h2 className="text-lg font-semibold text-slate-700">
                            Nenhum cadastro pendente
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Todos os cadastros foram analisados.
                        </p>

                    </div>
                ) : (
                    <div className="space-y-4">

                        {usuarios.map((usuario) => (
                            <div
                                key={usuario.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
                            >

                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <h2 className="font-semibold text-slate-800">
                                            {usuario.nome}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {usuario.email}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {usuario.telefone}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:min-w-[220px]">

                                        <select
                                            value={
                                                perfis[usuario.id!] ??
                                                "ALUNO"
                                            }
                                            onChange={(event) =>
                                                setPerfis((atual) => ({
                                                    ...atual,
                                                    [usuario.id!]:
                                                        event.target.value as PerfilAprovacao,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
                                        >

                                            <option value="ALUNO">
                                                Aluno
                                            </option>

                                            <option value="PASTOR">
                                                Pastor
                                            </option>

                                            <option value="SUPERINTENDENTE">
                                                Superintendente
                                            </option>

                                            <option value="PROFESSOR">
                                                Professor
                                            </option>

                                        </select>

                                        <div className="flex gap-2">

                                            <button
                                                type="button"
                                                disabled={
                                                    processingId === usuario.id
                                                }
                                                onClick={() =>
                                                    aprovarUsuario(
                                                        usuario.id!
                                                    )
                                                }
                                                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {processingId === usuario.id
                                                    ? "Processando..."
                                                    : "Aprovar"}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    processingId === usuario.id
                                                }
                                                onClick={() =>
                                                    rejeitarUsuario(
                                                        usuario.id!
                                                    )
                                                }
                                                className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                Rejeitar
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>
                )}
            </div>

            <PlanLimitModal
                open={limitePessoas !== null}
                utilizado={limitePessoas?.utilizado ?? 0}
                limite={limitePessoas?.limite ?? 0}
                recurso="pessoas"
                onClose={() => setLimitePessoas(null)}
            />
        </>
    );
}