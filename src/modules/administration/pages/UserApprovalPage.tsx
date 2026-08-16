import {
    useEffect,
    useState,
} from "react";

import { toast } from "sonner";

import type { Pessoa } from "@/modules/people/types/Pessoa";

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
        carregarUsuarios();
    }, []);

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

                {usuarios.length === 0 ? (
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
                onClose={() => setLimitePessoas(null)}
            />
        </>
    );
}