import { useEffect, useState } from "react";

import { supabase } from "@/shared/lib/supabase/client";
import { useAuth } from "@/modules/auth/hooks/useAuth";

type Plano = {
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
    ativo: boolean;
};

type LimitesPlano = {
    max_pessoas: number;
    max_classes: number;
    max_professores: number;
    max_administradores: number;
    max_trimestres_ativos: number;
};

type Recurso = {
    codigo: string;
    nome: string;
};



type PlanoExibicao = {
    plano: Plano;
    limites: LimitesPlano | null;
    recursos: Recurso[];
};

type AssinaturaAtual = {
    plano_id: string;
    inicio_em: string;
    fim_em: string | null;
    status: string;
};

function formatarLimite(valor: number | undefined) {
    if (valor === -1) {
        return "Ilimitado";
    }

    return valor?.toString() ?? "-";
}

function formatarPreco(planoNome: string) {
    if (planoNome === "Semente") {
        return "Grátis por 3 meses";
    }

    if (planoNome === "Crescimento") {
        return "R$ 59,90/mês";
    }

    if (planoNome === "Igreja") {
        return "R$ 99,90/mês";
    }

    return "";
}

function calcularGratuidade(inicioEm: string) {
    const inicio = new Date(inicioEm);

    const fim = new Date(inicio);
    fim.setMonth(fim.getMonth() + 3);

    const agora = new Date();

    if (agora >= fim) {
        return {
            ativo: false,
            texto: "Período gratuito encerrado",
        };
    }

    const diferenca =
        fim.getTime() - agora.getTime();

    const dias =
        Math.ceil(
            diferenca /
            (1000 * 60 * 60 * 24)
        );

    const meses = Math.floor(dias / 30);
    const diasRestantes = dias % 30;

    let texto = "Gratuito por ";

    if (meses > 0) {
        texto += `${meses} ${meses === 1 ? "mês" : "meses"
            }`;

        if (diasRestantes > 0) {
            texto += ` e ${diasRestantes} ${diasRestantes === 1
                ? "dia"
                : "dias"
                }`;
        }
    } else {
        texto += `${dias} ${dias === 1 ? "dia" : "dias"
            }`;
    }

    return {
        ativo: true,
        texto,
    };
}

export function PlansPage() {

    const { pessoa } = useAuth();

    const [assinaturaAtual, setAssinaturaAtual] =
        useState<AssinaturaAtual | null>(null);



    const [planos, setPlanos] =
        useState<PlanoExibicao[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [erro, setErro] =
        useState<string | null>(null);

    useEffect(() => {
        async function carregarPlanos() {
            try {
                setLoading(true);
                setErro(null);

                if (pessoa?.igreja_id) {
                    const {
                        data: assinatura,
                        error: assinaturaError,
                    } = await supabase
                        .schema("ebd")
                        .from("assinaturas")
                        .select(`
                            plano_id,
                            inicio_em,
                            fim_em,
                            status
                        `)
                        .eq("igreja_id", pessoa.igreja_id)
                        .eq("status", "ATIVA")
                        .maybeSingle();

                    if (assinaturaError) {
                        throw assinaturaError;
                    }

                    setAssinaturaAtual(
                        assinatura ?? null
                    );
                } else {
                    setAssinaturaAtual(null);
                }

                const {
                    data: planosData,
                    error: planosError,
                } = await supabase
                    .schema("ebd")
                    .from("planos")
                    .select(`
                        id,
                        nome,
                        descricao,
                        ordem,
                        ativo
                    `)
                    .eq("ativo", true)
                    .order("ordem", {
                        ascending: true,
                    });

                if (planosError) {
                    throw planosError;
                }

                const listaPlanos =
                    planosData ?? [];

                if (listaPlanos.length === 0) {
                    setPlanos([]);
                    return;
                }

                const planoIds =
                    listaPlanos.map(
                        (plano) => plano.id
                    );

                const {
                    data: limitesData,
                    error: limitesError,
                } = await supabase
                    .schema("ebd")
                    .from("plano_limites")
                    .select(`
                        plano_id,
                        max_pessoas,
                        max_classes,
                        max_professores,
                        max_administradores,
                        max_trimestres_ativos
                    `)
                    .in("plano_id", planoIds);

                if (limitesError) {
                    throw limitesError;
                }

                const {
                    data: recursosData,
                    error: recursosError,
                } = await supabase
                    .schema("ebd")
                    .from("plano_recursos")
                    .select(`
                        plano_id,
                        ativo,
                        recursos (
                            codigo,
                            nome
                        )
                    `)
                    .in("plano_id", planoIds)
                    .eq("ativo", true);

                if (recursosError) {
                    throw recursosError;
                }

                const planosFormatados =
                    listaPlanos.map((plano) => {
                        const limite =
                            (limitesData ?? []).find(
                                (item) =>
                                    item.plano_id ===
                                    plano.id
                            );

                        const recursos =
                            (recursosData ?? [])
                                .filter(
                                    (item) =>
                                        item.plano_id ===
                                        plano.id
                                )
                                .map((item) => {
                                    if (
                                        Array.isArray(
                                            item.recursos
                                        )
                                    ) {
                                        return (
                                            item.recursos[0]
                                        );
                                    }

                                    return item.recursos;
                                })
                                .filter(
                                    (
                                        recurso
                                    ): recurso is Recurso =>
                                        recurso !== null
                                );

                        return {
                            plano,
                            limites:
                                limite ?? null,
                            recursos,
                        };
                    });

                setPlanos(
                    planosFormatados
                );

            } catch (error) {
                console.error(
                    "Erro ao carregar planos:",
                    error
                );

                setErro(
                    "Não foi possível carregar os planos."
                );

            } finally {
                setLoading(false);
            }
        }

        carregarPlanos();
    }, [pessoa?.igreja_id]);

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-slate-500">
                    Carregando planos...
                </p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h2 className="font-semibold text-red-800">
                        Erro ao carregar planos
                    </h2>

                    <p className="mt-2 text-sm text-red-700">
                        {erro}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">
                    Planos
                </h1>

                <p className="mt-1 text-slate-500">
                    Escolha o plano que melhor
                    acompanha o crescimento da
                    sua igreja.
                </p>
            </div>

            {planos.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-700">
                        Nenhum plano disponível
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Não existem planos ativos
                        cadastrados.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {planos.map(
                        ({
                            plano,
                            limites,
                            recursos,
                        }) => {
                            const destaque =
                                plano.nome ===
                                "Crescimento";

                            return (
                                <div
                                    key={plano.id}
                                    className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${destaque
                                        ? "border-blue-500 ring-2 ring-blue-100"
                                        : "border-slate-200"
                                        }`}
                                >
                                    {destaque && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                                            Mais escolhido
                                        </div>
                                    )}

                                    <h2 className="text-xl font-bold text-slate-800">
                                        {plano.nome}
                                    </h2>

                                    <div className="mt-2">
                                        {plano.nome === "Semente" ? (
                                            <>
                                                <p className="text-2xl font-bold text-slate-800">
                                                    Grátis
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    Depois R$ 29,90/mês
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-2xl font-bold text-slate-800">
                                                {formatarPreco(
                                                    plano.nome
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    {plano.nome === "Semente" &&
                                        assinaturaAtual?.plano_id === plano.id &&
                                        assinaturaAtual.inicio_em && (
                                            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                                    Seu plano atual
                                                </p>

                                                {(() => {
                                                    const gratuidade =
                                                        calcularGratuidade(
                                                            assinaturaAtual.inicio_em
                                                        );

                                                    return (
                                                        <>
                                                            <p className="mt-1 text-sm font-semibold text-green-800">
                                                                {gratuidade.texto}
                                                            </p>

                                                            {gratuidade.ativo && (
                                                                <p className="mt-1 text-xs text-green-700">
                                                                    Depois do período gratuito:
                                                                    {" "}
                                                                    R$ 29,90/mês
                                                                </p>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                                        {plano.descricao}
                                    </p>

                                    {limites && (
                                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                            <p className="mb-3 text-sm font-semibold text-slate-700">
                                                Limites do plano
                                            </p>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">
                                                        Pessoas
                                                    </span>

                                                    <strong className="text-slate-700">
                                                        {formatarLimite(
                                                            limites.max_pessoas
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">
                                                        Classes
                                                    </span>

                                                    <strong className="text-slate-700">
                                                        {formatarLimite(
                                                            limites.max_classes
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">
                                                        Professores
                                                    </span>

                                                    <strong className="text-slate-700">
                                                        {formatarLimite(
                                                            limites.max_professores
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">
                                                        Administradores
                                                    </span>

                                                    <strong className="text-slate-700">
                                                        {formatarLimite(
                                                            limites.max_administradores
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">
                                                        Trimestres ativos
                                                    </span>

                                                    <strong className="text-slate-700">
                                                        {formatarLimite(
                                                            limites.max_trimestres_ativos
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5">
                                        <p className="mb-3 text-sm font-semibold text-slate-700">
                                            Recursos incluídos
                                        </p>

                                        {recursos.length ===
                                            0 ? (
                                            <p className="text-sm text-slate-400">
                                                Nenhum recurso
                                                cadastrado.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {recursos.map(
                                                    (
                                                        recurso
                                                    ) => (
                                                        <div
                                                            key={
                                                                recurso.codigo
                                                            }
                                                            className="flex items-center gap-2 text-sm text-slate-600"
                                                        >
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                                                ✓
                                                            </span>

                                                            <span>
                                                                {
                                                                    recurso.nome
                                                                }
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            alert(
                                                "A contratação de planos será disponibilizada em breve."
                                            );
                                        }}
                                        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        Em breve
                                    </button>
                                </div>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}