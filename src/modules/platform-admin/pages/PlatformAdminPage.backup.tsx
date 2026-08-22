import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    CreditCard,
    Layers3,
    Loader2,
    Plus,
    Puzzle,
    RefreshCw,
    Users,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Navigate,
    useNavigate,
} from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import {
    IgrejasService,
    type Igreja,
} from "../services/IgrejasService";

import {
    AssinaturasService,
    type Assinatura,
} from "../services/AssinaturasService";


function formatarData(data: string | null) {

    if (!data) {
        return "Indefinido";
    }

    return new Date(data).toLocaleDateString(
        "pt-BR",
        {
            timeZone: "America/Sao_Paulo",
        }
    );
}


function obterDiasParaVencimento(
    data: string | null
) {

    if (!data) {
        return null;
    }

    const hoje = new Date();

    hoje.setHours(
        0,
        0,
        0,
        0
    );

    const vencimento = new Date(data);

    vencimento.setHours(
        0,
        0,
        0,
        0
    );

    const diferenca =
        vencimento.getTime() -
        hoje.getTime();

    return Math.ceil(
        diferenca /
        (1000 * 60 * 60 * 24)
    );
}


function Indicador({
    titulo,
    valor,
    descricao,
    icon: Icon,
    onClick,
}: {
    titulo: string;
    valor: number;
    descricao: string;
    icon: React.ElementType;
    onClick?: () => void;
}) {

    return (
        <Card
            className={
                onClick
                    ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
                    : ""
            }
            onClick={onClick}
        >

            <CardContent className="p-5">

                <div className="flex items-start justify-between">

                    <div>

                        <p className="text-sm font-medium text-slate-500">
                            {titulo}
                        </p>

                        <p className="mt-2 text-3xl font-bold text-slate-900">
                            {valor}
                        </p>

                    </div>

                    <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                        <Icon size={21} />
                    </div>

                </div>

                <p className="mt-3 text-xs text-slate-500">
                    {descricao}
                </p>

            </CardContent>

        </Card>
    );
}


export function PlatformAdminPage() {

    const navigate = useNavigate();

    const {
        isSuperAdmin,
    } = useAuth();

    const [igrejas, setIgrejas] =
        useState<Igreja[]>([]);

    const [assinaturas, setAssinaturas] =
        useState<Assinatura[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [atualizando, setAtualizando] =
        useState(false);


    async function carregarDashboard(
        silencioso = false
    ) {

        try {

            if (silencioso) {
                setAtualizando(true);
            } else {
                setLoading(true);
            }

            const [
                igrejasDados,
                assinaturasDados,
            ] = await Promise.all([
                IgrejasService.listar(),
                AssinaturasService.listar(),
            ]);

            setIgrejas(
                igrejasDados
            );

            setAssinaturas(
                assinaturasDados
            );

        } catch (error) {

            console.error(
                error
            );

            toast.error(
                "Não foi possível carregar o painel gerencial."
            );

        } finally {

            setLoading(false);
            setAtualizando(false);

        }
    }


    useEffect(() => {

        carregarDashboard();

    }, []);


    const hoje = useMemo(
        () => {

            const data = new Date();

            data.setHours(
                0,
                0,
                0,
                0
            );

            return data;

        },
        []
    );


    const estatisticas =
        useMemo(() => {

            const assinaturasAtivas =
                assinaturas.filter(
                    (item) =>
                        item.status ===
                        "ATIVA"
                );

            const assinaturasVencidas =
                assinaturas.filter(
                    (item) => {

                        const dias =
                            obterDiasParaVencimento(
                                item.fim_em
                            );

                        return (
                            item.status ===
                                "EXPIRADA" ||
                            (
                                dias !== null &&
                                dias < 0
                            )
                        );
                    }
                );

            const vencendo7Dias =
                assinaturas.filter(
                    (item) => {

                        if (
                            item.status !==
                            "ATIVA"
                        ) {
                            return false;
                        }

                        const dias =
                            obterDiasParaVencimento(
                                item.fim_em
                            );

                        return (
                            dias !== null &&
                            dias >= 0 &&
                            dias <= 7
                        );
                    }
                );

            const vencendo30Dias =
                assinaturas.filter(
                    (item) => {

                        if (
                            item.status !==
                            "ATIVA"
                        ) {
                            return false;
                        }

                        const dias =
                            obterDiasParaVencimento(
                                item.fim_em
                            );

                        return (
                            dias !== null &&
                            dias >= 0 &&
                            dias <= 30
                        );
                    }
                );

            const igrejasSemAssinatura =
                igrejas.filter(
                    (igreja) =>
                        !assinaturas.some(
                            (assinatura) =>
                                assinatura.igreja_id ===
                                    igreja.id &&
                                assinatura.status ===
                                    "ATIVA"
                        )
                );

            const novas7Dias =
                igrejas.filter(
                    (igreja) => {

                        const criada =
                            new Date(
                                igreja.created_at
                            );

                        criada.setHours(
                            0,
                            0,
                            0,
                            0
                        );

                        const diferenca =
                            Math.floor(
                                (
                                    hoje.getTime() -
                                    criada.getTime()
                                ) /
                                (1000 * 60 * 60 * 24)
                            );

                        return (
                            diferenca >= 0 &&
                            diferenca <= 7
                        );
                    }
                );

            const novas30Dias =
                igrejas.filter(
                    (igreja) => {

                        const criada =
                            new Date(
                                igreja.created_at
                            );

                        criada.setHours(
                            0,
                            0,
                            0,
                            0
                        );

                        const diferenca =
                            Math.floor(
                                (
                                    hoje.getTime() -
                                    criada.getTime()
                                ) /
                                (1000 * 60 * 60 * 24)
                            );

                        return (
                            diferenca >= 0 &&
                            diferenca <= 30
                        );
                    }
                );

            return {
                assinaturasAtivas,
                assinaturasVencidas,
                vencendo7Dias,
                vencendo30Dias,
                igrejasSemAssinatura,
                novas7Dias,
                novas30Dias,
            };

        },
        [
            igrejas,
            assinaturas,
            hoje,
        ]
    );


    const proximosVencimentos =
        useMemo(
            () =>
                estatisticas.vencendo30Dias
                    .sort(
                        (a, b) => {

                            const dataA =
                                a.fim_em
                                    ? new Date(
                                        a.fim_em
                                    ).getTime()
                                    : Infinity;

                            const dataB =
                                b.fim_em
                                    ? new Date(
                                        b.fim_em
                                    ).getTime()
                                    : Infinity;

                            return (
                                dataA -
                                dataB
                            );
                        }
                    )
                    .slice(
                        0,
                        8
                    ),
            [
                estatisticas.vencendo30Dias,
            ]
        );


    const novasIgrejas =
        useMemo(
            () =>
                [...estatisticas.novas30Dias]
                    .sort(
                        (a, b) =>
                            new Date(
                                b.created_at
                            ).getTime() -
                            new Date(
                                a.created_at
                            ).getTime()
                    )
                    .slice(
                        0,
                        8
                    ),
            [
                estatisticas.novas30Dias,
            ]
        );


    if (!isSuperAdmin) {

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    if (loading) {

        return (
            <div className="flex min-h-[400px] items-center justify-center">

                <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                />

            </div>
        );
    }


    return (

        <div className="space-y-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <PageHeader
                    title="Visão geral da plataforma"
                    subtitle="Acompanhe o crescimento, as assinaturas e o que precisa da sua atenção."
                    icon={Layers3}
                />

                <button
                    type="button"
                    onClick={() =>
                        carregarDashboard(true)
                    }
                    disabled={atualizando}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >

                    <RefreshCw
                        size={17}
                        className={
                            atualizando
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Atualizar

                </button>

            </div>


            {/* INDICADORES */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <Indicador
                    titulo="Igrejas cadastradas"
                    valor={igrejas.length}
                    descricao="Total de igrejas na plataforma."
                    icon={Building2}
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/igrejas"
                        )
                    }
                />

                <Indicador
                    titulo="Assinaturas ativas"
                    valor={
                        estatisticas
                            .assinaturasAtivas
                            .length
                    }
                    descricao="Assinaturas atualmente ativas."
                    icon={CreditCard}
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/assinaturas"
                        )
                    }
                />

                <Indicador
                    titulo="Vencendo em 7 dias"
                    valor={
                        estatisticas
                            .vencendo7Dias
                            .length
                    }
                    descricao="Exigem atenção imediata."
                    icon={AlertTriangle}
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/assinaturas"
                        )
                    }
                />

                <Indicador
                    titulo="Assinaturas vencidas"
                    valor={
                        estatisticas
                            .assinaturasVencidas
                            .length
                    }
                    descricao="Igrejas que precisam ser contatadas."
                    icon={XCircle}
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/assinaturas"
                        )
                    }
                />

            </div>


            {/* CRESCIMENTO */}

            <div className="grid gap-4 md:grid-cols-3">

                <Card>

                    <CardContent className="p-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <Plus size={20} />
                            </div>

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Novas igrejas
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {estatisticas.novas7Dias.length}
                                </p>

                                <p className="text-xs text-slate-500">
                                    últimos 7 dias
                                </p>

                            </div>

                        </div>

                    </CardContent>

                </Card>


                <Card>

                    <CardContent className="p-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                <Users size={20} />
                            </div>

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Novas igrejas
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {estatisticas.novas30Dias.length}
                                </p>

                                <p className="text-xs text-slate-500">
                                    últimos 30 dias
                                </p>

                            </div>

                        </div>

                    </CardContent>

                </Card>


                <Card>

                    <CardContent className="p-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                <TriangleAlertIcon />
                            </div>

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Sem assinatura ativa
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {estatisticas.igrejasSemAssinatura.length}
                                </p>

                                <p className="text-xs text-slate-500">
                                    requerem acompanhamento
                                </p>

                            </div>

                        </div>

                    </CardContent>

                </Card>

            </div>


            {/* ATENÇÃO */}

            <div className="grid gap-6 lg:grid-cols-2">

                <Card>

                    <CardContent className="p-0">

                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                            <div>

                                <h2 className="font-semibold text-slate-900">
                                    Próximos vencimentos
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Assinaturas que vencem nos próximos 30 dias.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/administracao/plataforma/assinaturas"
                                    )
                                }
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver todas
                            </button>

                        </div>


                        {proximosVencimentos.length === 0 ? (

                            <div className="px-5 py-10 text-center">

                                <CheckCircle2
                                    size={28}
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-2 text-sm text-slate-500">
                                    Nenhum vencimento próximo.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y divide-slate-100">

                                {proximosVencimentos.map(
                                    (assinatura) => {

                                        const dias =
                                            obterDiasParaVencimento(
                                                assinatura.fim_em
                                            );

                                        return (

                                            <div
                                                key={assinatura.id}
                                                className="flex items-center justify-between gap-4 px-5 py-4"
                                            >

                                                <div className="min-w-0">

                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {
                                                            assinatura.igreja?.nome
                                                            ??
                                                            "Igreja não encontrada"
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Plano{" "}
                                                        {
                                                            assinatura.plano?.nome
                                                            ??
                                                            "Não informado"
                                                        }
                                                        {" • "}
                                                        {formatarData(
                                                            assinatura.fim_em
                                                        )}
                                                    </p>

                                                </div>

                                                <div className="flex shrink-0 items-center gap-3">

                                                    <span
                                                        className={
                                                            dias !== null &&
                                                            dias <= 7
                                                                ? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                                                                : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                                        }
                                                    >
                                                        {dias === 0
                                                            ? "Hoje"
                                                            : dias === 1
                                                                ? "1 dia"
                                                                : `${dias} dias`}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                "/administracao/plataforma/assinaturas"
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                        title="Gerenciar assinatura"
                                                    >
                                                        <ArrowRight
                                                            size={17}
                                                        />
                                                    </button>

                                                </div>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                        )}

                    </CardContent>

                </Card>


                <Card>

                    <CardContent className="p-0">

                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                            <div>

                                <h2 className="font-semibold text-slate-900">
                                    Novas igrejas
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Igrejas cadastradas nos últimos 30 dias.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/administracao/plataforma/igrejas"
                                    )
                                }
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver todas
                            </button>

                        </div>


                        {novasIgrejas.length === 0 ? (

                            <div className="px-5 py-10 text-center">

                                <Building2
                                    size={28}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-2 text-sm text-slate-500">
                                    Nenhuma igreja nova nos últimos 30 dias.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y divide-slate-100">

                                {novasIgrejas.map(
                                    (igreja) => {

                                        const possuiAssinatura =
                                            assinaturas.some(
                                                (assinatura) =>
                                                    assinatura.igreja_id ===
                                                        igreja.id &&
                                                    assinatura.status ===
                                                        "ATIVA"
                                            );

                                        return (

                                            <div
                                                key={igreja.id}
                                                className="flex items-center justify-between gap-4 px-5 py-4"
                                            >

                                                <div className="min-w-0">

                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {igreja.nome}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Cadastro em{" "}
                                                        {formatarData(
                                                            igreja.created_at
                                                        )}
                                                    </p>

                                                </div>

                                                <div className="flex shrink-0 items-center gap-3">

                                                    <span
                                                        className={
                                                            possuiAssinatura
                                                                ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                                : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                                        }
                                                    >
                                                        {possuiAssinatura
                                                            ? "Com assinatura"
                                                            : "Sem assinatura"}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                "/administracao/plataforma/igrejas"
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                        title="Gerenciar igreja"
                                                    >
                                                        <ArrowRight
                                                            size={17}
                                                        />
                                                    </button>

                                                </div>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                        )}

                    </CardContent>

                </Card>

            </div>


            {/* IGREJAS SEM ASSINATURA */}

            <Card>

                <CardContent className="p-0">

                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                        <div>

                            <h2 className="font-semibold text-slate-900">
                                Igrejas sem assinatura ativa
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Oportunidades que podem exigir contato comercial.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/administracao/plataforma/igrejas"
                                )
                            }
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Gerenciar igrejas
                        </button>

                    </div>


                    {estatisticas.igrejasSemAssinatura.length === 0 ? (

                        <div className="px-5 py-10 text-center">

                            <CheckCircle2
                                size={30}
                                className="mx-auto text-emerald-500"
                            />

                            <p className="mt-2 text-sm text-slate-500">
                                Todas as igrejas possuem uma assinatura ativa.
                            </p>

                        </div>

                    ) : (

                        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">

                            {estatisticas.igrejasSemAssinatura
                                .slice(0, 9)
                                .map(
                                    (igreja) => (

                                        <div
                                            key={igreja.id}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                                        >

                                            <div className="min-w-0">

                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {igreja.nome}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {igreja.email ||
                                                        igreja.telefone ||
                                                        "Sem contato cadastrado"}
                                                </p>

                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        "/administracao/plataforma/igrejas"
                                                    )
                                                }
                                                className="ml-3 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                            >
                                                <ArrowRight
                                                    size={17}
                                                />
                                            </button>

                                        </div>

                                    )
                                )}

                        </div>

                    )}

                </CardContent>

            </Card>


            {/* AÇÕES RÁPIDAS */}

            <Card>

                <CardContent className="p-5">

                    <div className="mb-4">

                        <h2 className="font-semibold text-slate-900">
                            Ações rápidas
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Acesse diretamente as áreas administrativas.
                        </p>

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/administracao/plataforma/igrejas"
                                )
                            }
                            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                        >

                            <Building2
                                size={20}
                                className="text-blue-600"
                            />

                            <div>

                                <p className="text-sm font-semibold text-slate-800">
                                    Igrejas
                                </p>

                                <p className="text-xs text-slate-500">
                                    Cadastro e gestão
                                </p>

                            </div>

                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/administracao/plataforma/assinaturas"
                                )
                            }
                            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                        >

                            <CreditCard
                                size={20}
                                className="text-blue-600"
                            />

                            <div>

                                <p className="text-sm font-semibold text-slate-800">
                                    Assinaturas
                                </p>

                                <p className="text-xs text-slate-500">
                                    Vencimentos e planos
                                </p>

                            </div>

                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/administracao/plataforma/planos"
                                )
                            }
                            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                        >

                            <Layers3
                                size={20}
                                className="text-blue-600"
                            />

                            <div>

                                <p className="text-sm font-semibold text-slate-800">
                                    Planos
                                </p>

                                <p className="text-xs text-slate-500">
                                    Configuração
                                </p>

                            </div>

                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/administracao/plataforma/recursos"
                                )
                            }
                            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                        >

                            <Puzzle
                                size={20}
                                className="text-blue-600"
                            />

                            <div>

                                <p className="text-sm font-semibold text-slate-800">
                                    Recursos
                                </p>

                                <p className="text-xs text-slate-500">
                                    Funcionalidades
                                </p>

                            </div>

                        </button>

                    </div>

                </CardContent>

            </Card>

        </div>
    );
}


function TriangleAlertIcon() {

    return (
        <AlertTriangle
            size={20}
        />
    );
}