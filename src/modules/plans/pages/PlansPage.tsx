import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
    Bell,
    Check,
    Clock,
    Crown,
    MapPin,
    Sparkles,
    Users,
    Zap,
} from "lucide-react";

import { PlansCatalogService } from "@/shared/plans/PlansCatalogService";
import type {
    PlanoCompleto,
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

type TempoOferta = {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
};

const DURACAO_OFERTA = 3 * 24 * 60 * 60 * 1000;

function obterInicioOferta(): number {
    const chave = "ebd-manager-oferta-crescimento";

    const existente = localStorage.getItem(chave);

    if (existente) {
        return Number(existente);
    }

    const inicio = Date.now();

    localStorage.setItem(
        chave,
        inicio.toString()
    );

    return inicio;
}

function calcularTempoRestante(
    inicio: number
): TempoOferta {

    const restante = Math.max(
        0,
        inicio + DURACAO_OFERTA - Date.now()
    );

    const totalSegundos =
        Math.floor(restante / 1000);

    const dias =
        Math.floor(totalSegundos / 86400);

    const horas =
        Math.floor(
            (totalSegundos % 86400) / 3600
        );

    const minutos =
        Math.floor(
            (totalSegundos % 3600) / 60
        );

    const segundos =
        totalSegundos % 60;

    return {
        dias,
        horas,
        minutos,
        segundos,
    };
}

type ConfigPlano = {
    preco: string;
    periodo: string;
    destaque?: string;
    recomendado?: boolean;
    descricao: string;
};

const CONFIG_PLANOS: Record<string, ConfigPlano> = {
    Semente: {
        preco: "Grátis",
        periodo: "por 3 meses",
        descricao:
            "Comece sua organização sem compromisso e descubra como o EBD Manager pode transformar sua rotina.",
    },

    Crescimento: {
        preco: "R$ 59,90",
        periodo: "/mês",
        destaque: "Mais escolhido",
        recomendado: true,
        descricao:
            "Para igrejas que estão crescendo e precisam de mais estrutura, organização e controle.",
    },

    Igreja: {
        preco: "R$ 99,90",
        periodo: "/mês",
        destaque: "Experiência completa",
        descricao:
            "Para igrejas que querem escala, automação e recursos avançados para sua EBD.",
    },
};

const NOMES_RECURSOS: Record<RecursoCodigo, string> = {
    ALUNOS_CLASSES: "Alunos por classe",
    AULAS: "Gestão de aulas",
    CHECKIN: "Check-in",
    CHECKIN_LOCALIZACAO: "Check-in por geolocalização",
    CLASSES: "Classes",
    DASHBOARD: "Dashboard",
    FINANCEIRO: "Financeiro",
    GESTAO_USUARIOS: "Gestão de usuários",
    SOLICITACOES_SENHA: "Solicitações de senha",
    NOTIFICACAO_PUSH: "Notificações automáticas",
    NOTIFICACOES: "Notificações",
    PESSOAS: "Gestão de pessoas",
    PRESENCAS: "Controle de presenças",
    PROFESSORES: "Professores",
    RELATORIOS: "Relatórios",
    TRIMESTRES: "Trimestres",
};

function formatarLimite(valor: number) {
    if (valor === -1) {
        return "Ilimitado";
    }

    return valor.toString();
}

function obterRecursosPrincipais(
    plano: PlanoCompleto
) {
    const recursos = plano.recursos.map(
        (codigo) => NOMES_RECURSOS[codigo]
    );

    return recursos;
}

export function PlansPage() {

    const [planos, setPlanos] =
        useState<PlanoCompleto[]>([]);

    const [tempoOferta, setTempoOferta] =
        useState<TempoOferta>(() =>
            calcularTempoRestante(obterInicioOferta())
        );

    useEffect(() => {

        const inicio = obterInicioOferta();

        const atualizar = () => {
            setTempoOferta(
                calcularTempoRestante(inicio)
            );
        };

        atualizar();

        const intervalo =
            window.setInterval(
                atualizar,
                1000
            );

        return () => {
            window.clearInterval(intervalo);
        };

    }, []);

    const [loading, setLoading] =
        useState(true);

    const [erro, setErro] =
        useState<string | null>(null);

    useEffect(() => {

        async function carregarPlanos() {

            try {

                setLoading(true);
                setErro(null);

                const data =
                    await PlansCatalogService.listarPlanos();

                setPlanos(data);

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

    }, []);

    if (loading) {

        return (
            <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center p-6">

                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="text-sm text-slate-500">
                        Carregando planos...
                    </p>

                </div>

            </div>
        );
    }

    if (erro) {

        return (
            <div className="mx-auto w-full max-w-3xl p-6">

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

                    <p className="font-semibold text-red-800">
                        {erro}
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">



            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 lg:py-20">

                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
                    <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-purple-500 blur-3xl" />
                </div>

                

                <div className="relative mx-auto max-w-5xl text-center">

                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">

                        <Sparkles
                            size={16}
                            className="text-yellow-300"
                        />

                        Escolha o próximo nível da sua igreja

                    </div>

                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">

                        Sua igreja está crescendo.
                        <br />

                        <span className="text-blue-400">
                            Agora é hora de organizar esse crescimento.
                        </span>

                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">

                        Tenha uma EBD mais organizada, acompanhe seus
                        alunos, facilite o trabalho da equipe e tenha os
                        recursos certos para cada fase da sua igreja.

                    </p>

                    <div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center gap-3 text-sm sm:flex-row">

                        <div className="flex items-center gap-2">

                            <Check
                                size={17}
                                className="text-green-400"
                            />

                            Comece sem risco

                        </div>

                        <div className="hidden h-4 w-px bg-white/20 sm:block" />

                        <div className="flex items-center gap-2">

                            <Check
                                size={17}
                                className="text-green-400"
                            />

                            Cresça quando precisar

                        </div>

                        <div className="hidden h-4 w-px bg-white/20 sm:block" />

                        <div className="flex items-center gap-2">

                            <Check
                                size={17}
                                className="text-green-400"
                            />

                            Sem complicação

                        </div>

                    </div>

                </div>

            </section>

            {/* ================================================= */}
            {/* OFERTA */}
            {/* ================================================= */}

            <section className="px-4 py-8 sm:px-6">

                <div className="mx-auto max-w-5xl">

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.6,
                        }}
                        className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-lg sm:p-8"
                    >

                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

                        <div className="relative">

                            <div className="flex flex-col items-center text-center">

                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-amber-800">

                                    <Zap
                                        size={15}
                                        className="fill-amber-500 text-amber-500"
                                    />

                                    Oferta especial

                                </div>

                                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">

                                    Uma oportunidade para começar
                                    <span className="text-amber-600">
                                        {" "}agora.
                                    </span>

                                </h2>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">

                                    O plano Crescimento foi pensado para
                                    igrejas que estão avançando e precisam
                                    de mais estrutura para acompanhar esse
                                    crescimento.

                                </p>

                                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-red-600">

                                    <Clock size={18} />

                                    Esta condição está disponível por:

                                </div>

                                <div className="mt-4 flex gap-2 sm:gap-3">

                                    {[
                                        {
                                            valor: tempoOferta.dias,
                                            label: "DIAS",
                                        },
                                        {
                                            valor: tempoOferta.horas,
                                            label: "HORAS",
                                        },
                                        {
                                            valor: tempoOferta.minutos,
                                            label: "MIN",
                                        },
                                        {
                                            valor: tempoOferta.segundos,
                                            label: "SEG",
                                        },
                                    ].map((item) => (

                                        <motion.div
                                            key={item.label}

                                            animate={{
                                                scale:
                                                    item.label === "SEG"
                                                        ? [1, 1.04, 1]
                                                        : 1,
                                            }}
                                            transition={{
                                                duration: 1,
                                                repeat:
                                                    item.label === "SEG"
                                                        ? Infinity
                                                        : 0,
                                            }}
                                            className="min-w-[62px] rounded-2xl border border-red-200 bg-white px-3 py-3 shadow-sm sm:min-w-[76px]"
                                        >

                                            <div className="text-2xl font-black tabular-nums text-red-600 sm:text-3xl">
                                                {String(
                                                    item.valor
                                                ).padStart(2, "0")}
                                            </div>

                                            <div className="mt-1 text-[9px] font-bold tracking-widest text-slate-500 sm:text-[10px]">
                                                {item.label}
                                            </div>

                                        </motion.div>

                                    ))}

                                </div>

                                <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-500">

                                    <Check
                                        size={15}
                                        className="text-green-600"
                                    />

                                    Condição especial para esta visita

                                </div>

                            </div>

                        </div>

                    </motion.div>

                </div>

            </section>

            {/* ================================================= */}
            {/* PLANOS */}
            {/* ================================================= */}

            <section className="px-4 pb-16 sm:px-6">

                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">

                    {planos.map((plano) => {

                        const config =
                            CONFIG_PLANOS[plano.plano.nome];

                        if (!config) {
                            return null;
                        }





                        const isIgreja =
                            plano.plano.nome === "Igreja";

                        const isSemente =
                            plano.plano.nome === "Semente";

                        const recursos =
                            obterRecursosPrincipais(plano);

                        const recursosExibicao =
                            recursos.map((recurso) => {

                                if (
                                    isIgreja &&
                                    recurso === "Dashboard"
                                ) {
                                    return "Dashboard Avançado";
                                }

                                return recurso;
                            });

                        return (
                            <motion.div
                                key={plano.plano.id}
                                initial={{
                                    opacity: 0,
                                    y: 30,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: plano.plano.ordem * 0.12,
                                }}
                                whileHover={{
                                    y: -6,
                                }}
                                className={[
                                    "relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl",
                                    config.recomendado
                                        ? "border-blue-500 ring-2 ring-blue-500/20"
                                        : "border-slate-200",
                                ].join(" ")}
                            >

                                {/* DESTAQUE */}

                                {config.destaque && (
                                    <div
                                        className={[
                                            "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold shadow-sm",
                                            config.recomendado
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-900 text-white",
                                        ].join(" ")}
                                    >
                                        {config.destaque}
                                    </div>
                                )}

                                {/* CABEÇALHO */}

                                <div className="mb-6">

                                    <div className="mb-4 flex items-center justify-between">

                                        <div>

                                            <p className="text-sm font-medium text-slate-500">
                                                Plano
                                            </p>

                                            <h2 className="text-2xl font-black text-slate-900">
                                                {plano.plano.nome}
                                            </h2>

                                        </div>

                                        {isIgreja ? (
                                            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                                                <Crown size={23} />
                                            </div>
                                        ) : isSemente ? (
                                            <div className="rounded-xl bg-green-100 p-3 text-green-600">
                                                <Sparkles size={23} />
                                            </div>
                                        ) : (
                                            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                                                <Users size={23} />
                                            </div>
                                        )}

                                    </div>

                                    <p className="min-h-[72px] text-sm leading-6 text-slate-600">
                                        {config.descricao}
                                    </p>

                                </div>

                                {/* PREÇO */}

                                <div className="mb-6 rounded-2xl bg-slate-50 p-5">

                                    <div className="flex items-end gap-2">

                                        <span className="text-4xl font-black tracking-tight text-slate-950">
                                            {config.preco}
                                        </span>

                                        <span className="pb-1 text-sm text-slate-500">
                                            {config.periodo}
                                        </span>

                                    </div>

                                    {config.recomendado && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600">

                                            <Zap
                                                size={14}
                                                className="fill-amber-500"
                                            />

                                            Melhor equilíbrio entre preço e recursos

                                        </div>
                                    )}

                                    {isSemente && (
                                        <p className="mt-2 text-sm font-semibold text-green-600">
                                            Depois dos 3 meses: R$ 29,90/mês
                                        </p>
                                    )}

                                </div>

                                {/* CTA */}

                                <button
                                    type="button"
                                    className={[
                                        "mb-7 w-full rounded-xl px-5 py-3.5 text-sm font-bold transition",
                                        config.recomendado
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                                            : isIgreja
                                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                                    ].join(" ")}
                                >
                                    {isSemente
                                        ? "Começar gratuitamente"
                                        : "Escolher este plano"}
                                </button>

                                {/* LIMITES */}

                                <div className="mb-6">

                                    <p className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                                        Limites do plano
                                    </p>

                                    <div className="space-y-3">

                                        <div className="flex items-center justify-between gap-4 text-sm">

                                            <span className="text-slate-600">
                                                Pessoas
                                            </span>

                                            <strong className="text-slate-900">
                                                {formatarLimite(
                                                    plano.limites.max_pessoas
                                                )}
                                            </strong>

                                        </div>

                                        <div className="flex items-center justify-between gap-4 text-sm">

                                            <span className="text-slate-600">
                                                Classes
                                            </span>

                                            <strong className="text-slate-900">
                                                {formatarLimite(
                                                    plano.limites.max_classes
                                                )}
                                            </strong>

                                        </div>

                                        <div className="flex items-center justify-between gap-4 text-sm">

                                            <span className="text-slate-600">
                                                Professores
                                            </span>

                                            <strong className="text-slate-900">
                                                {formatarLimite(
                                                    plano.limites.max_professores
                                                )}
                                            </strong>

                                        </div>

                                        <div className="flex items-center justify-between gap-4 text-sm">

                                            <span className="text-slate-600">
                                                Superintendentes
                                            </span>

                                            <strong className="text-slate-900">
                                                {formatarLimite(
                                                    plano.limites.max_superintendentes
                                                )}
                                            </strong>

                                        </div>

                                        <div className="flex items-center justify-between gap-4 text-sm">

                                            <span className="text-slate-600">
                                                Trimestres
                                            </span>

                                            <strong className="text-slate-900">
                                                {formatarLimite(
                                                    plano.limites.max_trimestres
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                </div>

                                {/* RECURSOS */}

                                <div className="flex-1 border-t border-slate-100 pt-6">

                                    <p className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                                        Recursos incluídos
                                    </p>

                                    <div className="space-y-3">

                                        {recursosExibicao.map(
                                            (recurso) => {

                                                const isNotificacao =
                                                    recurso ===
                                                    "Notificações automáticas";

                                                const isCheckin =
                                                    recurso ===
                                                    "Check-in por geolocalização";

                                                const isDashboardAvancado =
                                                    recurso ===
                                                    "Dashboard Avançado";

                                                const isRelatorios =
                                                    recurso ===
                                                    "Relatórios";

                                                return (
                                                    <div
                                                        key={recurso}
                                                        className={[
                                                            "flex items-center gap-3 text-sm",
                                                            isNotificacao ||
                                                                isCheckin ||
                                                                isDashboardAvancado ||
                                                                isRelatorios
                                                                ? "font-semibold text-slate-900"
                                                                : "text-slate-600",
                                                        ].join(" ")}
                                                    >

                                                        {isNotificacao ? (
                                                            <Bell
                                                                size={17}
                                                                className="shrink-0 text-blue-600"
                                                            />
                                                        ) : isCheckin ? (
                                                            <MapPin
                                                                size={17}
                                                                className="shrink-0 text-blue-600"
                                                            />

                                                        ) : isDashboardAvancado ? (
                                                            <Sparkles
                                                                size={17}
                                                                className="shrink-0 text-purple-600"
                                                            />
                                                        ) : (
                                                            <Check
                                                                size={17}
                                                                className="shrink-0 text-green-600"
                                                            />
                                                        )}

                                                        <span>
                                                            {recurso}
                                                        </span>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>

                                </div>

                            </motion.div>
                        );
                    })}

                </div>

            </section>

            {/* ================================================= */}
            {/* FECHAMENTO */}
            {/* ================================================= */}

            <section className="border-t border-slate-200 bg-white px-4 py-14 sm:px-6">

                <div className="mx-auto max-w-3xl text-center">

                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">

                        <Crown size={27} />

                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                        Não espere sua igreja crescer
                        <br className="hidden sm:block" />
                        para organizar melhor.
                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">

                        Escolha hoje uma estrutura que permita
                        sua EBD crescer sem precisar trocar de sistema
                        amanhã.

                    </p>

                </div>

            </section>

        </div>
    );
}