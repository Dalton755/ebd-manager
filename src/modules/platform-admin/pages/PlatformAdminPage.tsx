import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CalendarClock,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    Layers3,
    Mail,
    MessageCircle,
    RefreshCw,
    Users,
    XCircle,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
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

import { supabase } from "@/shared/lib/supabase/client";

type IndicadorProps = {
    titulo: string;
    valor: number;
    descricao: string;
    icon: React.ElementType;
    tipo?: "normal" | "success" | "warning" | "danger";
    onClick?: () => void;
};

function Indicador({
    titulo,
    valor,
    descricao,
    icon: Icon,
    tipo = "normal",
    onClick,
}: IndicadorProps) {

    const estilos = {
        normal: {
            fundo: "bg-slate-100",
            texto: "text-slate-700",
            numero: "text-slate-900",
        },
        success: {
            fundo: "bg-emerald-100",
            texto: "text-emerald-700",
            numero: "text-emerald-700",
        },
        warning: {
            fundo: "bg-amber-100",
            texto: "text-amber-700",
            numero: "text-amber-700",
        },
        danger: {
            fundo: "bg-red-100",
            texto: "text-red-700",
            numero: "text-red-700",
        },
    };

    const estilo = estilos[tipo];

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left"
        >
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">

                <CardContent className="p-5">

                    <div className="flex items-start justify-between gap-4">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                {titulo}
                            </p>

                            <p
                                className={`mt-2 text-3xl font-bold ${estilo.numero}`}
                            >
                                {valor}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                {descricao}
                            </p>

                        </div>

                        <div
                            className={`rounded-xl p-3 ${estilo.fundo} ${estilo.texto}`}
                        >
                            <Icon size={22} />
                        </div>

                    </div>

                </CardContent>

            </Card>
        </button>
    );
}

type IgrejaGerencial = Igreja & {
    pessoas: number;
    classes: number;
    assinatura: Assinatura | null;
};

function formatarData(data: string | null) {

    if (!data) {
        return "Sem vencimento";
    }

    return new Intl.DateTimeFormat(
        "pt-BR"
    ).format(new Date(data));
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

    return Math.ceil(
        (
            vencimento.getTime() -
            hoje.getTime()
        ) /
        (1000 * 60 * 60 * 24)
    );
}

function obterSituacao(
    igreja: IgrejaGerencial
) {

    if (!igreja.ativa) {

        return {
            texto: "Igreja inativa",
            tipo: "danger" as const,
        };
    }

    if (!igreja.assinatura) {

        return {
            texto: "Sem assinatura",
            tipo: "warning" as const,
        };
    }

    const dias =
        obterDiasParaVencimento(
            igreja.assinatura.fim_em
        );

    if (dias !== null && dias < 0) {

        return {
            texto: "Assinatura vencida",
            tipo: "danger" as const,
        };
    }

    if (dias !== null && dias <= 30) {

        return {
            texto: `Vence em ${dias} dias`,
            tipo: "warning" as const,
        };
    }

    return {
        texto: "Regular",
        tipo: "success" as const,
    };
}

export function PlatformAdminPage() {

    const navigate = useNavigate();

    const {
        isSuperAdmin,
    } = useAuth();

    const [loading, setLoading] =
        useState(true);

    const [atualizando, setAtualizando] =
        useState(false);

    const [igrejas, setIgrejas] =
        useState<Igreja[]>([]);

    const [assinaturas, setAssinaturas] =
        useState<Assinatura[]>([]);

    const [pessoasPorIgreja, setPessoasPorIgreja] =
        useState<Record<string, number>>({});

    const [classesPorIgreja, setClassesPorIgreja] =
        useState<Record<string, number>>({});

    const [busca, setBusca] =
        useState("");

    if (!isSuperAdmin) {

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    async function carregarDados(
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
                pessoasDados,
                classesDados,
            ] = await Promise.all([

                IgrejasService.listar(),

                AssinaturasService.listar(),

                supabase
                    .schema("ebd")
                    .from("pessoas")
                    .select("id, igreja_id")
                    .eq("ativo", true),

                supabase
                    .schema("ebd")
                    .from("classes")
                    .select("id, igreja_id")
                    .eq("ativa", true),

            ]);

            if (pessoasDados.error) {
                throw pessoasDados.error;
            }

            if (classesDados.error) {
                throw classesDados.error;
            }

            const pessoasContagem:
                Record<string, number> = {};

            (
                pessoasDados.data ?? []
            ).forEach((pessoa) => {

                if (!pessoa.igreja_id) {
                    return;
                }

                pessoasContagem[
                    pessoa.igreja_id
                ] =
                    (
                        pessoasContagem[
                            pessoa.igreja_id
                        ] ?? 0
                    ) + 1;
            });

            const classesContagem:
                Record<string, number> = {};

            (
                classesDados.data ?? []
            ).forEach((classe) => {

                if (!classe.igreja_id) {
                    return;
                }

                classesContagem[
                    classe.igreja_id
                ] =
                    (
                        classesContagem[
                            classe.igreja_id
                        ] ?? 0
                    ) + 1;
            });

            setIgrejas(
                igrejasDados
            );

            setAssinaturas(
                assinaturasDados
            );

            setPessoasPorIgreja(
                pessoasContagem
            );

            setClassesPorIgreja(
                classesContagem
            );

        } catch (error) {

            console.error(
                "Erro ao carregar dashboard da plataforma:",
                error
            );

            toast.error(
                "Não foi possível carregar o painel da plataforma."
            );

        } finally {

            setLoading(false);
            setAtualizando(false);

        }
    }

    useEffect(() => {

        carregarDados();

    }, []);

    const igrejasGerenciais =
        useMemo<IgrejaGerencial[]>(() => {

            return igrejas.map(
                (igreja) => {

                    const assinatura =
                        assinaturas.find(
                            (item) =>
                                item.igreja_id ===
                                igreja.id
                        ) ?? null;

                    return {
                        ...igreja,
                        pessoas:
                            pessoasPorIgreja[
                                igreja.id
                            ] ?? 0,
                        classes:
                            classesPorIgreja[
                                igreja.id
                            ] ?? 0,
                        assinatura,
                    };
                }
            );

        }, [
            igrejas,
            assinaturas,
            pessoasPorIgreja,
            classesPorIgreja,
        ]);

    const resumo =
        useMemo(() => {

            const hoje =
                new Date();

            hoje.setHours(
                0,
                0,
                0,
                0
            );

            const em30Dias =
                new Date(hoje);

            em30Dias.setDate(
                em30Dias.getDate() + 30
            );

            const assinaturasVencidas =
                assinaturas.filter(
                    (assinatura) => {

                        if (
                            !assinatura.fim_em
                        ) {
                            return false;
                        }

                        return (
                            new Date(
                                assinatura.fim_em
                            ) < hoje
                        );
                    }
                );

            const assinaturasVencendo =
                assinaturas.filter(
                    (assinatura) => {

                        if (
                            !assinatura.fim_em
                        ) {
                            return false;
                        }

                        const fim =
                            new Date(
                                assinatura.fim_em
                            );

                        return (
                            fim >= hoje &&
                            fim <= em30Dias
                        );
                    }
                );

            const igrejasComAssinatura =
                new Set(
                    assinaturas.map(
                        (item) =>
                            item.igreja_id
                    )
                );

            const pessoas =
                Object.values(
                    pessoasPorIgreja
                ).reduce(
                    (
                        total,
                        valor
                    ) =>
                        total + valor,
                    0
                );

            const classes =
                Object.values(
                    classesPorIgreja
                ).reduce(
                    (
                        total,
                        valor
                    ) =>
                        total + valor,
                    0
                );

            return {

                totalIgrejas:
                    igrejas.length,

                igrejasAtivas:
                    igrejas.filter(
                        (item) =>
                            item.ativa
                    ).length,

                igrejasComAssinatura:
                    igrejasComAssinatura.size,

                igrejasSemAssinatura:
                    igrejas.filter(
                        (igreja) =>
                            !igrejasComAssinatura.has(
                                igreja.id
                            )
                    ).length,

                assinaturasAtivas:
                    assinaturas.filter(
                        (assinatura) =>
                            assinatura.status ===
                            "ATIVA"
                    ).length,

                vencendo:
                    assinaturasVencendo.length,

                vencidas:
                    assinaturasVencidas.length,

                pessoas,

                classes,

            };

        }, [
            igrejas,
            assinaturas,
            pessoasPorIgreja,
            classesPorIgreja,
        ]);

    const igrejasFiltradas =
        useMemo(() => {

            const termo =
                busca
                    .trim()
                    .toLowerCase();

            if (!termo) {
                return igrejasGerenciais;
            }

            return igrejasGerenciais.filter(
                (igreja) => {

                    const plano =
                        igreja.assinatura
                            ?.plano?.nome ?? "";

                    const status =
                        obterSituacao(
                            igreja
                        ).texto;

                    return [

                        igreja.nome,

                        igreja.sigla,

                        plano,

                        status,

                    ]
                        .join(" ")
                        .toLowerCase()
                        .includes(termo);
                }
            );

        }, [
            busca,
            igrejasGerenciais,
        ]);

    const igrejasAtencao =
        useMemo(() => {

            return igrejasGerenciais
                .filter(
                    (igreja) => {

                        const situacao =
                            obterSituacao(
                                igreja
                            );

                        return (
                            situacao.tipo ===
                            "danger" ||
                            situacao.tipo ===
                            "warning"
                        );
                    }
                )
                .sort(
                    (a, b) => {

                        const da =
                            obterDiasParaVencimento(
                                a.assinatura?.fim_em ??
                                null
                            );

                        const db =
                            obterDiasParaVencimento(
                                b.assinatura?.fim_em ??
                                null
                            );

                        if (
                            da === null &&
                            db === null
                        ) {
                            return 0;
                        }

                        if (da === null) {
                            return 1;
                        }

                        if (db === null) {
                            return -1;
                        }

                        return da - db;
                    }
                )
                .slice(
                    0,
                    8
                );

        }, [
            igrejasGerenciais,
        ]);

    const igrejasRecentes =
        useMemo(() => {

            return [
                ...igrejasGerenciais,
            ]
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
                    5
                );

        }, [
            igrejasGerenciais,
        ]);

    function abrirIgreja(
        igrejaId: string
    ) {

        navigate(
            "/administracao/plataforma/igrejas"
        );

        console.log(
            "Igreja selecionada:",
            igrejaId
        );
    }

    function abrirAssinaturas() {

        navigate(
            "/administracao/plataforma/assinaturas"
        );
    }

    function enviarWhatsApp(
        igreja: IgrejaGerencial
    ) {

        if (!igreja.telefone) {

            toast.error(
                "Esta igreja não possui telefone cadastrado."
            );

            return;
        }

        const telefone =
            igreja.telefone.replace(
                /\D/g,
                ""
            );

        window.open(
            `https://wa.me/55${telefone}`,
            "_blank"
        );
    }

    function enviarEmail(
        igreja: IgrejaGerencial
    ) {

        if (!igreja.email) {

            toast.error(
                "Esta igreja não possui e-mail cadastrado."
            );

            return;
        }

        window.location.href =
            `mailto:${igreja.email}`;
    }

    if (loading) {

        return (
            <div className="space-y-6">

                <PageHeader
                    title="Visão geral da plataforma"
                    subtitle="Carregando informações das igrejas..."
                    icon={Building2}
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {Array.from(
                        { length: 8 }
                    ).map(
                        (_, index) => (

                            <Card
                                key={index}
                                className="animate-pulse"
                            >

                                <CardContent className="p-5">

                                    <div className="h-4 w-28 rounded bg-slate-200" />

                                    <div className="mt-4 h-9 w-16 rounded bg-slate-200" />

                                    <div className="mt-2 h-3 w-32 rounded bg-slate-100" />

                                </CardContent>

                            </Card>
                        )
                    )}

                </div>

            </div>
        );
    }

    return (
        <div className="space-y-6">

            <PageHeader
                title="Visão geral da plataforma"
                subtitle="Acompanhe rapidamente a saúde e o crescimento das igrejas do EBD Manager."
                icon={Building2}
            />

            {/* AÇÕES RÁPIDAS */}

            <div className="flex flex-wrap gap-2">

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/igrejas"
                        )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <Building2 size={17} />
                    Gerenciar igrejas
                </button>

                <button
                    type="button"
                    onClick={abrirAssinaturas}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <CreditCard size={17} />
                    Gerenciar assinaturas
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/planos"
                        )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <Layers3 size={17} />
                    Gerenciar planos
                </button>

                <button
                    type="button"
                    disabled={atualizando}
                    onClick={() =>
                        carregarDados(true)
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <Indicador
                    titulo="Igrejas cadastradas"
                    valor={
                        resumo.totalIgrejas
                    }
                    descricao="Total de igrejas na plataforma"
                    icon={Building2}
                    onClick={() =>
                        navigate(
                            "/administracao/plataforma/igrejas"
                        )
                    }
                />

                <Indicador
                    titulo="Igrejas ativas"
                    valor={
                        resumo.igrejasAtivas
                    }
                    descricao="Igrejas atualmente ativas"
                    icon={CheckCircle2}
                    tipo="success"
                />

                <Indicador
                    titulo="Com assinatura"
                    valor={
                        resumo.igrejasComAssinatura
                    }
                    descricao="Igrejas que possuem assinatura"
                    icon={CreditCard}
                    tipo="success"
                    onClick={abrirAssinaturas}
                />

                <Indicador
                    titulo="Sem assinatura"
                    valor={
                        resumo.igrejasSemAssinatura
                    }
                    descricao="Igrejas que precisam de atenção"
                    icon={AlertTriangle}
                    tipo={
                        resumo.igrejasSemAssinatura > 0
                            ? "warning"
                            : "normal"
                    }
                />

                <Indicador
                    titulo="Assinaturas ativas"
                    valor={
                        resumo.assinaturasAtivas
                    }
                    descricao="Assinaturas com status ATIVA"
                    icon={CheckCircle2}
                    tipo="success"
                    onClick={abrirAssinaturas}
                />

                <Indicador
                    titulo="Vencendo em 30 dias"
                    valor={
                        resumo.vencendo
                    }
                    descricao="Renovações próximas"
                    icon={CalendarClock}
                    tipo={
                        resumo.vencendo > 0
                            ? "warning"
                            : "normal"
                    }
                    onClick={abrirAssinaturas}
                />

                <Indicador
                    titulo="Assinaturas vencidas"
                    valor={
                        resumo.vencidas
                    }
                    descricao="Precisam de ação imediata"
                    icon={XCircle}
                    tipo={
                        resumo.vencidas > 0
                            ? "danger"
                            : "normal"
                    }
                    onClick={abrirAssinaturas}
                />

                <Indicador
                    titulo="Pessoas cadastradas"
                    valor={
                        resumo.pessoas
                    }
                    descricao="Usuários ativos das igrejas"
                    icon={Users}
                    tipo="normal"
                />

            </div>

            {/* ALERTAS */}

            <div className="grid gap-6 xl:grid-cols-2">

                <Card>

                    <CardContent className="p-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <div className="flex items-center gap-2">

                                    <AlertTriangle
                                        size={19}
                                        className="text-amber-600"
                                    />

                                    <h2 className="font-semibold text-slate-900">
                                        Central de atenção
                                    </h2>

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Igrejas que merecem sua atenção agora.
                                </p>

                            </div>

                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                {igrejasAtencao.length}
                            </span>

                        </div>

                        <div className="mt-5 space-y-3">

                            {igrejasAtencao.length === 0 ? (

                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                                    Tudo certo. Nenhuma igreja precisa de atenção no momento.
                                </div>

                            ) : (

                                igrejasAtencao.map(
                                    (igreja) => {

                                        const situacao =
                                            obterSituacao(
                                                igreja
                                            );

                                        return (

                                            <div
                                                key={igreja.id}
                                                className="rounded-xl border border-slate-100 p-4"
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div className="min-w-0">

                                                        <p className="font-semibold text-slate-900">
                                                            {igreja.nome}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">

                                                            {igreja.assinatura
                                                                ?.plano
                                                                ?.nome ??
                                                                "Nenhum plano"}

                                                            {" • "}

                                                            {igreja.assinatura
                                                                ? `Vencimento: ${formatarData(
                                                                    igreja.assinatura.fim_em
                                                                )}`
                                                                : "Sem assinatura"}

                                                        </p>

                                                    </div>

                                                    <span
                                                        className={
                                                            `shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ` +
                                                            (
                                                                situacao.tipo ===
                                                                "danger"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                            )
                                                        }
                                                    >
                                                        {situacao.texto}
                                                    </span>

                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirIgreja(
                                                                igreja.id
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Ver igreja
                                                        <ArrowRight size={13} />
                                                    </button>

                                                    {igreja.telefone && (

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                enviarWhatsApp(
                                                                    igreja
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                        >
                                                            <MessageCircle size={13} />
                                                            WhatsApp
                                                        </button>

                                                    )}

                                                    {igreja.email && (

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                enviarEmail(
                                                                    igreja
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                        >
                                                            <Mail size={13} />
                                                            E-mail
                                                        </button>

                                                    )}

                                                </div>

                                            </div>
                                        );
                                    }
                                )
                            )}

                        </div>

                    </CardContent>

                </Card>

                {/* CRESCIMENTO */}

                <Card>

                    <CardContent className="p-5">

                        <div className="flex items-start justify-between">

                            <div>

                                <div className="flex items-center gap-2">

                                    <Building2
                                        size={19}
                                        className="text-blue-600"
                                    />

                                    <h2 className="font-semibold text-slate-900">
                                        Igrejas recentes
                                    </h2>

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Últimas igrejas cadastradas na plataforma.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/administracao/plataforma/igrejas"
                                    )
                                }
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Ver todas
                            </button>

                        </div>

                        <div className="mt-5 space-y-3">

                            {igrejasRecentes.map(
                                (igreja) => {

                                    const dias =
                                        obterDiasParaVencimento(
                                            igreja.assinatura
                                                ?.fim_em ??
                                            null
                                        );

                                    return (

                                        <div
                                            key={igreja.id}
                                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4"
                                        >

                                            <div className="flex min-w-0 items-center gap-3">

                                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                                                    <Building2 size={18} />
                                                </div>

                                                <div className="min-w-0">

                                                    <p className="truncate font-semibold text-slate-900">
                                                        {igreja.nome}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">

                                                        Cadastro em{" "}

                                                        {formatarData(
                                                            igreja.created_at
                                                        )}

                                                    </p>

                                                </div>

                                            </div>

                                            <div className="shrink-0 text-right">

                                                {igreja.assinatura ? (

                                                    <p className="text-xs font-semibold text-emerald-600">
                                                        {igreja.assinatura.plano?.nome}
                                                    </p>

                                                ) : (

                                                    <p className="text-xs font-semibold text-amber-600">
                                                        Sem assinatura
                                                    </p>

                                                )}

                                                {dias !== null && (

                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        {dias >= 0
                                                            ? `Vence em ${dias} dias`
                                                            : "Vencida"
                                                        }
                                                    </p>

                                                )}

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </CardContent>

                </Card>

            </div>

            {/* CLASSES */}

            <Card>

                <CardContent className="p-5">

                    <div className="grid gap-4 sm:grid-cols-2">

                        <div className="rounded-xl bg-slate-50 p-5">

                            <div className="flex items-center gap-3">

                                <div className="rounded-xl bg-white p-3 text-slate-700 shadow-sm">
                                    <Layers3 size={21} />
                                </div>

                                <div>

                                    <p className="text-sm text-slate-500">
                                        Classes ativas
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {resumo.classes}
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="rounded-xl bg-slate-50 p-5">

                            <div className="flex items-center gap-3">

                                <div className="rounded-xl bg-white p-3 text-slate-700 shadow-sm">
                                    <Users size={21} />
                                </div>

                                <div>

                                    <p className="text-sm text-slate-500">
                                        Pessoas ativas
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {resumo.pessoas}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* LISTAGEM GERENCIAL */}

            <Card>

                <CardContent className="p-5">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <h2 className="font-semibold text-slate-900">
                                Igrejas da plataforma
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Visão operacional de cada igreja cadastrada.
                            </p>

                        </div>

                        <input
                            type="text"
                            value={busca}
                            onChange={(event) =>
                                setBusca(
                                    event.target.value
                                )
                            }
                            placeholder="Buscar igreja, plano ou situação..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-80"
                        />

                    </div>

                    <div className="mt-5 overflow-x-auto">

                        <table className="w-full min-w-[1050px] text-sm">

                            <thead>

                                <tr className="border-b border-slate-200 text-left">

                                    <th className="px-3 py-3 font-semibold text-slate-500">
                                        Igreja
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-slate-500">
                                        Plano
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-slate-500">
                                        Vencimento
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-slate-500">
                                        Pessoas
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-slate-500">
                                        Classes
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-slate-500">
                                        Situação
                                    </th>

                                    <th className="px-3 py-3 text-right font-semibold text-slate-500">
                                        Ações
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {igrejasFiltradas.map(
                                    (igreja) => {

                                        const situacao =
                                            obterSituacao(
                                                igreja
                                            );

                                        return (

                                            <tr
                                                key={igreja.id}
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                            >

                                                <td className="px-3 py-4">

                                                    <div>

                                                        <p className="font-semibold text-slate-900">
                                                            {igreja.nome}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">

                                                            {igreja.sigla ??
                                                                "Sem sigla"}

                                                        </p>

                                                    </div>

                                                </td>

                                                <td className="px-3 py-4 text-slate-600">

                                                    {igreja.assinatura
                                                        ?.plano?.nome ??
                                                        "—"}

                                                </td>

                                                <td className="px-3 py-4 text-slate-600">

                                                    {formatarData(
                                                        igreja.assinatura
                                                            ?.fim_em ??
                                                        null
                                                    )}

                                                </td>

                                                <td className="px-3 py-4">

                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">

                                                        <Users size={13} />

                                                        {igreja.pessoas}

                                                    </span>

                                                </td>

                                                <td className="px-3 py-4">

                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">

                                                        <Layers3 size={13} />

                                                        {igreja.classes}

                                                    </span>

                                                </td>

                                                <td className="px-3 py-4">

                                                    <span
                                                        className={
                                                            `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ` +
                                                            (
                                                                situacao.tipo ===
                                                                "success"
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : situacao.tipo ===
                                                                        "warning"
                                                                        ? "bg-amber-100 text-amber-700"
                                                                        : "bg-red-100 text-red-700"
                                                            )
                                                        }
                                                    >

                                                        {situacao.tipo ===
                                                            "success" && (
                                                                <CheckCircle2 size={13} />
                                                            )}

                                                        {situacao.tipo ===
                                                            "warning" && (
                                                                <AlertTriangle size={13} />
                                                            )}

                                                        {situacao.tipo ===
                                                            "danger" && (
                                                                <XCircle size={13} />
                                                            )}

                                                        {situacao.texto}

                                                    </span>

                                                </td>

                                                <td className="px-3 py-4">

                                                    <div className="flex justify-end gap-1.5">

                                                        <button
                                                            type="button"
                                                            title="Ver igreja"
                                                            onClick={() =>
                                                                abrirIgreja(
                                                                    igreja.id
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Assinaturas"
                                                            onClick={
                                                                abrirAssinaturas
                                                            }
                                                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <CreditCard size={16} />
                                                        </button>

                                                        {igreja.telefone && (

                                                            <button
                                                                type="button"
                                                                title="WhatsApp"
                                                                onClick={() =>
                                                                    enviarWhatsApp(
                                                                        igreja
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                                                            >
                                                                <MessageCircle size={16} />
                                                            </button>

                                                        )}

                                                        {igreja.email && (

                                                            <button
                                                                type="button"
                                                                title="E-mail"
                                                                onClick={() =>
                                                                    enviarEmail(
                                                                        igreja
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                                            >
                                                                <Mail size={16} />
                                                            </button>

                                                        )}

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                        {igrejasFiltradas.length === 0 && (

                            <div className="py-12 text-center">

                                <Building2
                                    size={32}
                                    className="mx-auto text-slate-300"
                                />

                                <p className="mt-3 font-medium text-slate-600">
                                    Nenhuma igreja encontrada.
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Tente alterar o termo de busca.
                                </p>

                            </div>

                        )}

                    </div>

                </CardContent>

            </Card>

        </div>
    );
}