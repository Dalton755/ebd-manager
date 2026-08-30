import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    ArrowLeft,
    BookOpen,
    CalendarClock,
    ChevronRight,
    Clock3,
    GraduationCap,
    Loader2,
    Radio,
    UserRound,
    UsersRound,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase } from "@/shared/lib/supabase/client";

import { ClassroomService } from "../services/ClassroomService";

import type {
    PainelSalas,
    SalaAula,
} from "../types/Classroom";


function formatarData(
    valor: string
) {

    if (!valor) {
        return "";
    }


    const [
        ano,
        mes,
        dia,
    ] =
        valor.split("-");


    return `${dia}/${mes}/${ano}`;
}


function formatarHora(
    valor: string | null
) {

    if (!valor) {
        return "--:--";
    }


    return valor.slice(
        0,
        5
    );
}


function formatarCheckin(
    valor: string
) {

    return new Date(
        valor
    ).toLocaleTimeString(
        "pt-BR",
        {
            hour:
                "2-digit",

            minute:
                "2-digit",
        }
    );
}


export function ClassroomPage() {

    const {
        pessoa,
    } =
        useAuth();


    const [
        painel,
        setPainel,
    ] =
        useState<PainelSalas | null>(
            null
        );


    const [
        carregando,
        setCarregando,
    ] =
        useState(true);


    const [
        erro,
        setErro,
    ] =
        useState("");


    const [
        classeSelecionadaId,
        setClasseSelecionadaId,
    ] =
        useState<string | null>(
            null
        );


    const carregar =
        useCallback(
            async (
                silencioso = false
            ) => {

                if (
                    !pessoa?.igreja_id
                ) {
                    return;
                }


                try {

                    if (!silencioso) {
                        setCarregando(
                            true
                        );
                    }


                    setErro("");


                    const dados =
                        await ClassroomService
                            .carregarPainel(
                                pessoa.igreja_id
                            );


                    setPainel(
                        dados
                    );


                } catch (error) {

                    console.error(
                        "Erro ao carregar salas:",
                        error
                    );


                    setErro(
                        "Não foi possível carregar as salas de aula."
                    );

                } finally {

                    if (!silencioso) {
                        setCarregando(
                            false
                        );
                    }
                }
            },
            [
                pessoa?.igreja_id,
            ]
        );


    useEffect(() => {

        void carregar();

    }, [
        carregar,
    ]);


    /*
     * O relógio também altera o estado da sala.
     *
     * Exemplo:
     * 19:59 = sem atividade
     * 20:00 = em aula
     *
     * Por isso atualizamos automaticamente.
     */
    useEffect(() => {

        const intervalo =
            window.setInterval(
                () => {
                    void carregar(
                        true
                    );
                },
                30_000
            );


        return () => {
            window.clearInterval(
                intervalo
            );
        };

    }, [
        carregar,
    ]);


    /*
     * Presenças entram em tempo real.
     *
     * Ao receber INSERT, UPDATE ou DELETE,
     * recarregamos somente os dados do painel.
     */
    useEffect(() => {

        if (
            !pessoa?.igreja_id
        ) {
            return;
        }


        const canal =
            supabase
                .channel(
                    `salas-presencas-${pessoa.igreja_id}`
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "ebd",
                        table: "presencas",
                    },
                    () => {
                        void carregar(
                            true
                        );
                    }
                )
                .subscribe();


        return () => {

            void supabase
                .removeChannel(
                    canal
                );
        };

    }, [
        pessoa?.igreja_id,
        carregar,
    ]);


    const salaSelecionada =
        useMemo<SalaAula | null>(
            () => {

                if (
                    !classeSelecionadaId ||
                    !painel
                ) {
                    return null;
                }


                return (
                    painel.salas.find(
                        (sala) =>
                            sala.classeId ===
                            classeSelecionadaId
                    ) ?? null
                );
            },
            [
                painel,
                classeSelecionadaId,
            ]
        );


    if (carregando) {

        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                        Carregando salas de aula...
                    </p>
                </div>
            </div>
        );
    }


    if (erro) {

        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                {erro}
            </div>
        );
    }


    if (!painel) {
        return null;
    }


    /*
     * DETALHE DE UMA SALA ATIVA
     */
    if (
        salaSelecionada &&
        salaSelecionada.status ===
            "EM_AULA" &&
        salaSelecionada.aulaAtual
    ) {

        const aula =
            salaSelecionada.aulaAtual;


        return (
            <div className="mx-auto max-w-7xl space-y-6">

                <button
                    type="button"
                    onClick={() =>
                        setClasseSelecionadaId(
                            null
                        )
                    }
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
                >
                    <ArrowLeft className="h-4 w-4" />

                    Voltar para Salas
                </button>


                <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">

                    <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-6 md:p-8">

                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                            <div>

                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">

                                    <span className="relative flex h-2 w-2">

                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />

                                    </span>

                                    Em aula
                                </div>


                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                                    {salaSelecionada.classeNome}
                                </h1>


                                <div className="mt-4 flex items-center gap-2 text-lg font-semibold text-slate-700">

                                    <BookOpen className="h-5 w-5 text-blue-600" />

                                    {aula.titulo}
                                </div>


                                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                                    <span className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4" />

                                        {formatarData(
                                            aula.data
                                        )}
                                    </span>


                                    <span className="flex items-center gap-2">
                                        <Clock3 className="h-4 w-4" />

                                        {formatarHora(
                                            aula.hora_inicio
                                        )}
                                        {" às "}
                                        {formatarHora(
                                            aula.hora_fim
                                        )}
                                    </span>


                                    <span className="flex items-center gap-2">
                                        <UserRound className="h-4 w-4" />

                                        Professor:{" "}
                                        {aula.professor?.nome ??
                                            "Não definido"}
                                    </span>

                                </div>

                            </div>


                            <div className="rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-center shadow-sm">

                                <p className="text-3xl font-bold text-emerald-600">
                                    {
                                        salaSelecionada
                                            .alunosEmAula
                                            .length
                                    }
                                </p>

                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    alunos em aula
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="p-6 md:p-8">

                        <div className="mb-5 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    Alunos em aula
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Atualização automática em tempo real
                                </p>

                            </div>


                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">

                                <Radio className="h-3.5 w-3.5" />

                                AO VIVO
                            </div>

                        </div>


                        {salaSelecionada.alunosEmAula.length === 0 ? (

                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">

                                <UsersRound className="mx-auto h-9 w-9 text-slate-300" />

                                <p className="mt-3 font-medium text-slate-600">
                                    Nenhum aluno fez check-in nesta sala ainda.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">

                                {salaSelecionada.alunosEmAula.map(
                                    (
                                        aluno
                                    ) => (

                                        <div
                                            key={
                                                aluno.presencaId
                                            }
                                            className="flex flex-col gap-3 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">

                                                    <UserRound className="h-5 w-5 text-emerald-700" />

                                                </div>


                                                <div>

                                                    <p className="font-semibold text-slate-800">
                                                        {
                                                            aluno.nome
                                                        }
                                                    </p>

                                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">

                                                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />

                                                        Presente
                                                    </div>

                                                </div>

                                            </div>


                                            <div className="text-sm text-slate-500">

                                                Check-in{" "}

                                                <span className="font-semibold text-slate-700">
                                                    {formatarCheckin(
                                                        aluno.horaCheckin
                                                    )}
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </section>

            </div>
        );
    }


    /*
     * PAINEL PRINCIPAL
     */
    return (

        <div className="mx-auto max-w-7xl space-y-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                <div>

                    <div className="flex items-center gap-3">

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Salas de Aula
                        </h1>


                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">

                            <span className="relative flex h-2 w-2">

                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />

                            </span>

                            AO VIVO
                        </span>

                    </div>


                    <p className="mt-2 text-sm text-slate-500">
                        Acompanhe as classes e os alunos presentes em tempo real.
                    </p>

                </div>

            </div>


            <section className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Total de salas
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {painel.totalSalas}
                            </p>

                        </div>


                        <div className="rounded-xl bg-blue-50 p-3">
                            <GraduationCap className="h-6 w-6 text-blue-600" />
                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Em aula agora
                            </p>

                            <p className="mt-2 text-3xl font-bold text-emerald-600">
                                {painel.salasEmAula}
                            </p>

                        </div>


                        <div className="rounded-xl bg-emerald-50 p-3">
                            <Activity className="h-6 w-6 text-emerald-600" />
                        </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-slate-500">
                                Alunos em aula
                            </p>

                            <p className="mt-2 text-3xl font-bold text-violet-600">
                                {painel.alunosEmAula}
                            </p>

                        </div>


                        <div className="rounded-xl bg-violet-50 p-3">
                            <UsersRound className="h-6 w-6 text-violet-600" />
                        </div>

                    </div>

                </div>

            </section>


            {painel.salas.length === 0 ? (

                <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

                    <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />

                    <h2 className="mt-4 text-lg font-semibold text-slate-700">
                        Nenhuma classe ativa
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Cadastre ou ative uma classe para começar.
                    </p>

                </section>

            ) : (

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                    {painel.salas.map(
                        (
                            sala
                        ) => {

                            const emAula =
                                sala.status ===
                                "EM_AULA";


                            if (emAula) {

                                return (

                                    <button
                                        key={
                                            sala.classeId
                                        }
                                        type="button"
                                        onClick={() =>
                                            setClasseSelecionadaId(
                                                sala.classeId
                                            )
                                        }
                                        className="group overflow-hidden rounded-3xl border border-emerald-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                                    >

                                        <div className="h-1.5 bg-emerald-500" />


                                        <div className="p-6">

                                            <div className="flex items-start justify-between gap-4">

                                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">

                                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                                    EM AULA
                                                </span>


                                                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />

                                            </div>


                                            <h2 className="mt-5 text-2xl font-bold text-slate-900">

                                                {
                                                    sala.classeNome
                                                }

                                            </h2>


                                            <p className="mt-3 line-clamp-1 font-semibold text-blue-700">

                                                {
                                                    sala.aulaAtual
                                                        ?.titulo
                                                }

                                            </p>


                                            <div className="mt-5 space-y-3 text-sm text-slate-500">

                                                <div className="flex items-center gap-2">

                                                    <UserRound className="h-4 w-4" />

                                                    {
                                                        sala.aulaAtual
                                                            ?.professor
                                                            ?.nome ??
                                                        "Professor não definido"
                                                    }

                                                </div>


                                                <div className="flex items-center gap-2">

                                                    <Clock3 className="h-4 w-4" />

                                                    {formatarHora(
                                                        sala.aulaAtual
                                                            ?.hora_inicio ??
                                                            null
                                                    )}

                                                    {" às "}

                                                    {formatarHora(
                                                        sala.aulaAtual
                                                            ?.hora_fim ??
                                                            null
                                                    )}

                                                </div>


                                                <div className="flex items-center gap-2 font-semibold text-emerald-700">

                                                    <UsersRound className="h-4 w-4" />

                                                    {
                                                        sala
                                                            .alunosEmAula
                                                            .length
                                                    }

                                                    {" "}

                                                    {sala.alunosEmAula.length === 1
                                                        ? "aluno em aula"
                                                        : "alunos em aula"}

                                                </div>

                                            </div>


                                            <div className="mt-6 border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-700">

                                                Ver sala →

                                            </div>

                                        </div>

                                    </button>
                                );
                            }


                            return (

                                <div
                                    key={
                                        sala.classeId
                                    }
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white opacity-90 shadow-sm"
                                >

                                    <div className="h-1.5 bg-slate-200" />


                                    <div className="p-6">

                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">

                                            <span className="h-2 w-2 rounded-full bg-slate-400" />

                                            SEM ATIVIDADE
                                        </span>


                                        <h2 className="mt-5 text-2xl font-bold text-slate-700">

                                            {
                                                sala.classeNome
                                            }

                                        </h2>


                                        {sala.proximaAula ? (

                                            <div className="mt-5">

                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Próxima aula
                                                </p>


                                                <p className="mt-2 font-semibold text-slate-700">
                                                    {
                                                        sala.proximaAula
                                                            .titulo
                                                    }
                                                </p>


                                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                                                    <CalendarClock className="h-4 w-4" />

                                                    {formatarData(
                                                        sala.proximaAula
                                                            .data
                                                    )}

                                                    {" às "}

                                                    {formatarHora(
                                                        sala.proximaAula
                                                            .hora_inicio
                                                    )}

                                                </div>

                                            </div>

                                        ) : (

                                            <div className="mt-5">

                                                <p className="text-sm text-slate-400">
                                                    Nenhuma próxima aula agendada.
                                                </p>

                                            </div>

                                        )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </section>

            )}

        </div>
    );
}