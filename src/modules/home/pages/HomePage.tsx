import { useEffect, useState } from "react";
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Flame,
    GraduationCap,
    MapPin,
    UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { HomeService } from "../services/HomeService";

import {
    LessonImage,
} from "@/modules/lessons/components/LessonImage";

import type {
    ProximaAulaHome,
    AulaEscalaHome,
    FrequenciaHome,
} from "../services/HomeService";

function formatarData(data: string) {

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
        }
    ).format(
        new Date(
            `${data}T00:00:00`
        )
    );
}


function obterDataHojeLocal() {

    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
}

export function HomePage() {

    const {
        pessoa,
    } = useAuth();

    const [proximaAula, setProximaAula] =
        useState<ProximaAulaHome | null>(
            null
        );

    const [frequencia, setFrequencia] =
        useState<FrequenciaHome | null>(
            null
        );

    const [escala, setEscala] =
        useState<AulaEscalaHome[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const ehProfessor =
        pessoa?.perfil === "PROFESSOR";

    const ehAdmin =
        pessoa?.perfil === "ADMIN";

    const ehDiaDaAula =
        proximaAula?.data ===
        obterDataHojeLocal();

    const priorizarApresentacaoHoje =
        Boolean(
            proximaAula &&
            !ehAdmin &&
            ehDiaDaAula &&
            proximaAula.tem_apresentacao
        );

    useEffect(() => {

        async function carregar() {

            if (!pessoa?.id) {
                return;
            }

            try {

                setLoading(true);
                setErro("");

                let aula = null;


                if (
                    pessoa.perfil === "ALUNO"
                ) {

                    /*
                     * Aluno sem classe não pode receber
                     * aula de outra classe da igreja.
                     */
                    if (pessoa.classe_id) {

                        aula =
                            await HomeService
                                .buscarProximaAula(
                                    pessoa.classe_id
                                );

                    }

                } else {

                    aula =
                        await HomeService
                            .buscarProximaAula();

                }

                setProximaAula(aula);

                if (
                    pessoa.perfil === "ALUNO" ||
                    pessoa.perfil === "PROFESSOR"
                ) {

                    const dadosFrequencia =
                        await HomeService
                            .buscarFrequenciaAluno(
                                pessoa.id,

                                pessoa.perfil === "ALUNO"
                                    ? pessoa.classe_id ?? null
                                    : undefined
                            );

                    setFrequencia(
                        dadosFrequencia
                    );
                }

                if (
                    pessoa.perfil === "PROFESSOR"
                ) {

                    const dadosEscala =
                        await HomeService
                            .buscarEscalaProfessor(
                                pessoa.id
                            );

                    setEscala(
                        dadosEscala
                    );
                }

            } catch (error) {

                console.error(error);

                setErro(
                    "Não foi possível carregar sua página inicial."
                );

            } finally {

                setLoading(false);

            }
        }

        carregar();

    }, [
        pessoa?.id,
        pessoa?.perfil,
    ]);

    if (loading) {

        return (
            <div className="flex min-h-[60vh] items-center justify-center">

                <div className="text-center">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-4 text-sm text-slate-500">
                        Preparando sua página...
                    </p>

                </div>

            </div>
        );
    }

    if (erro) {

        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">

                <p className="font-medium">
                    {erro}
                </p>

            </div>
        );
    }

    const percentualFrequencia =
        frequencia &&
        frequencia.totalAulas > 0
            ? Math.round(
                (
                    frequencia.presencas /
                    frequencia.totalAulas
                ) * 100
            )
            : 0;

    return (
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-8">

            {/* ================================================= */}
            {/* MOBILE — HOME ASSISTIDA */}
            {/* ================================================= */}

            <section className="space-y-3 md:hidden">

                <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-5 text-white shadow-xl shadow-blue-900/15">

                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

                    <div className="relative">

                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">
                            {ehProfessor
                                ? "Área do professor"
                                : "Minha EBD"}
                        </p>

                        <h1 className="mt-1.5 text-2xl font-black tracking-tight">
                            Olá,{" "}
                            {pessoa?.nome
                                ?.split(" ")[0]}
                        </h1>

                        <p className="mt-1 text-sm leading-5 text-blue-100">
                            {ehProfessor
                                ? "Sua próxima aula e o que você precisa preparar."
                                : "Sua aula, presença e materiais em um só lugar."}
                        </p>


                        {frequencia && (

                            <div className="mt-4 grid grid-cols-3 gap-2">

                                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-200">
                                        Frequência
                                    </p>
                                    <p className="mt-1 text-lg font-black">
                                        {percentualFrequencia}%
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-200">
                                        Presenças
                                    </p>
                                    <p className="mt-1 text-lg font-black">
                                        {frequencia.presencas}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-200">
                                        Sequência
                                    </p>
                                    <p className="mt-1 text-lg font-black">
                                        {frequencia.sequencia}
                                    </p>
                                </div>

                            </div>

                        )}

                    </div>

                </div>


                {proximaAula ? (

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {proximaAula.imagem_path && (

                            <LessonImage
                                aula={
                                    proximaAula
                                }
                                downloadable
                                className="aspect-[16/7] rounded-none"
                            />

                        )}


                        <div className="p-4">

                            <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                                        {ehProfessor
                                            ? "Sua próxima aula"
                                            : "Próxima aula"}
                                    </p>

                                    <h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-900">
                                        Aula {proximaAula.numero} — {proximaAula.titulo}
                                    </h2>

                                </div>

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <BookOpen className="h-5 w-5" />
                                </div>

                            </div>


                            <div className="mt-4 grid grid-cols-2 gap-2">

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Quando
                                    </p>
                                    <p className="mt-1 text-sm font-black capitalize text-slate-800">
                                        {formatarData(
                                            proximaAula.data
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                        {proximaAula.horario}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Professor
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-sm font-black text-slate-800">
                                        {proximaAula.professor ??
                                            "Não informado"}
                                    </p>
                                </div>

                            </div>


                            <div className="mt-3 grid grid-cols-2 gap-2">

                                {proximaAula.apresentacao_publicada ? (

                                    <Link
                                        to={
                                            `/minhas-aulas/${proximaAula.id}/apresentacao?modo=aula`
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-white"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Apresentação
                                    </Link>

                                ) : proximaAula.link_drive ? (

                                    <a
                                        href={
                                            proximaAula.link_drive
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-white"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Material
                                    </a>

                                ) : (

                                    <Link
                                        to="/minhas-aulas"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-white"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Minhas aulas
                                    </Link>

                                )}


                                {pessoa?.perfil === "ALUNO" ? (

                                    <Link
                                        to="/aluno/checkin"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        Check-in
                                    </Link>

                                ) : (

                                    <Link
                                        to="/minhas-aulas"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700"
                                    >
                                        Minha agenda
                                    </Link>

                                )}

                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center">

                        <BookOpen className="mx-auto h-8 w-8 text-slate-300" />

                        <p className="mt-2 font-black text-slate-700">
                            Nenhuma próxima aula
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Quando houver uma aula programada ela aparecerá aqui.
                        </p>

                    </div>

                )}


                <div className="grid grid-cols-3 gap-2">

                    <Link
                        to="/minhas-aulas"
                        className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm"
                    >
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="text-[10px] font-black text-slate-700">
                            Aulas
                        </span>
                    </Link>

                    {pessoa?.perfil === "ALUNO" ? (
                        <Link
                            to="/minhas-presencas"
                            className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm"
                        >
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <span className="text-[10px] font-black text-slate-700">
                                Presenças
                            </span>
                        </Link>
                    ) : (
                        <Link
                            to="/aulas"
                            className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm"
                        >
                            <CalendarDays className="h-5 w-5 text-emerald-600" />
                            <span className="text-[10px] font-black text-slate-700">
                                Agenda
                            </span>
                        </Link>
                    )}

                    <Link
                        to="/meus-dados"
                        className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm"
                    >
                        <UserRound className="h-5 w-5 text-violet-600" />
                        <span className="text-[10px] font-black text-slate-700">
                            Meus dados
                        </span>
                    </Link>

                </div>

            </section>


            {/* ================================================= */}
            {/* SAUDAÇÃO — DESKTOP */}
            {/* ================================================= */}

            <section className="hidden md:block">

                <p className="text-sm font-medium text-blue-600">
                    Escola Bíblica Dominical
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">

                    Olá,{" "}

                    {pessoa?.nome
                        ?.split(" ")[0]}

                    ! 👋

                </h1>

                <p className="mt-2 text-slate-500">

                    {ehProfessor
                        ? "Aqui está sua agenda e suas próximas aulas."
                        : "Que bom ter você aqui. Vamos continuar sua jornada na EBD?"}

                </p>

            </section>


            {/* ================================================= */}
            {/* PRÓXIMA AULA */}
            {/* ================================================= */}

            {proximaAula ? (

                <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">

                    <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">

                        <div className="flex items-center gap-3">

                            <div className="rounded-xl bg-blue-50 p-3">

                                <BookOpen
                                    className="h-6 w-6 text-blue-600"
                                />

                            </div>

                            <div>

                                <p className="text-sm font-medium text-blue-600">
                                    {ehProfessor
                                        ? "Sua próxima aula"
                                        : "Próxima aula"}
                                </p>

                                <h2 className="text-xl font-bold text-slate-900">

                                    Aula{" "}
                                    {proximaAula.numero}
                                    {" — "}
                                    {proximaAula.titulo}

                                </h2>

                            </div>

                        </div>

                    </div>


                    {proximaAula.imagem_path && (

                        <div className="px-4 pt-4 sm:px-6">

                            <LessonImage
                                aula={
                                    proximaAula
                                }
                                downloadable
                                className="aspect-video rounded-2xl"
                            />

                        </div>

                    )}


                    <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 md:grid-cols-3">

                        <div className="flex items-center gap-3">

                            <CalendarDays
                                className="h-5 w-5 text-slate-400"
                            />

                            <div>

                                <p className="text-xs text-slate-400">
                                    Data
                                </p>

                                <p className="font-medium capitalize text-slate-800">

                                    {formatarData(
                                        proximaAula.data
                                    )}

                                </p>

                            </div>

                        </div>


                        <div className="flex items-center gap-3">

                            <Clock3
                                className="h-5 w-5 text-slate-400"
                            />

                            <div>

                                <p className="text-xs text-slate-400">
                                    Horário
                                </p>

                                <p className="font-medium text-slate-800">
                                    {proximaAula.horario}
                                </p>

                            </div>

                        </div>


                        <div className="flex items-center gap-3">

                            <UserRound
                                className="h-5 w-5 text-slate-400"
                            />

                            <div>

                                <p className="text-xs text-slate-400">
                                    Professor
                                </p>

                                <p className="font-medium text-slate-800">

                                    {proximaAula.professor ??
                                        "Não informado"}

                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">

                        {priorizarApresentacaoHoje ? (

                            <Link
                                to={
                                    `/minhas-aulas/${proximaAula.id}/apresentacao?modo=aula`
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <BookOpen
                                    className="h-4 w-4"
                                />

                                Ver apresentação

                            </Link>

                        ) : proximaAula.apresentacao_publicada ? (

                            <Link
                                to={
                                    `/minhas-aulas/${proximaAula.id}/apresentacao?modo=aula`
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <BookOpen
                                    className="h-4 w-4"
                                />

                                Abrir apresentação

                            </Link>

                        ) : proximaAula.link_drive ? (

                            <a
                                href={
                                    proximaAula.link_drive
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <ExternalLink
                                    className="h-4 w-4"
                                />

                                Material da aula

                            </a>

                        ) : null}

                        {pessoa?.perfil === "ALUNO" && (

                            <Link
                                to="/aluno/checkin"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >

                                <MapPin
                                    className="h-4 w-4"
                                />

                                Fazer check-in

                            </Link>

                        )}

                    </div>

                </section>

            ) : (

                <section className="hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:block">

                    <BookOpen
                        className="mx-auto h-10 w-10 text-slate-300"
                    />

                    <h2 className="mt-4 text-lg font-semibold text-slate-800">
                        Nenhuma próxima aula encontrada
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Assim que uma nova aula for cadastrada,
                        ela aparecerá aqui.
                    </p>

                </section>

            )}


            {/* ================================================= */}
            {/* ÁREA DO ALUNO */}
            {/* ================================================= */}

            {pessoa?.perfil === "ALUNO" &&
                frequencia && (

                    <section className="hidden gap-6 md:grid md:grid-cols-2">

                        {/* SEQUÊNCIA */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center gap-3">

                                <div className="rounded-xl bg-orange-50 p-3">

                                    <Flame
                                        className="h-6 w-6 text-orange-500"
                                    />

                                </div>

                                <div>

                                    <p className="text-sm text-slate-500">
                                        Sua sequência
                                    </p>

                                    <p className="text-3xl font-bold text-slate-900">

                                        {frequencia.sequencia}

                                        <span className="ml-2 text-base font-medium text-slate-500">
                                            {frequencia.sequencia === 1
                                                ? "aula consecutiva"
                                                : "aulas consecutivas"}
                                        </span>

                                    </p>

                                </div>

                            </div>

                            {frequencia.sequencia >= 3 && (

                                <p className="mt-5 rounded-xl bg-orange-50 p-4 text-sm font-medium text-orange-800">

                                    🔥 Você está mantendo uma
                                    ótima frequência. Continue assim!

                                </p>

                            )}

                        </div>


                        {/* FREQUÊNCIA */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            {frequencia.totalAulas > 0 &&
                                !frequencia.participouUltima ? (

                                <>

                                    <div className="flex items-center gap-3">

                                        <div className="rounded-xl bg-blue-50 p-3">

                                            <GraduationCap
                                                className="h-6 w-6 text-blue-600"
                                            />

                                        </div>

                                        <div>

                                            <p className="text-sm font-medium text-blue-600">
                                                Sentimos sua falta
                                            </p>

                                            <h2 className="text-xl font-bold text-slate-900">
                                                Não perca a próxima aula!
                                            </h2>

                                        </div>

                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-slate-500">

                                        Sua presença faz diferença.
                                        Estamos esperando por você na
                                        próxima aula. ❤️

                                    </p>

                                </>

                            ) : (

                                <>

                                    <div className="flex items-center gap-3">

                                        <div className="rounded-xl bg-green-50 p-3">

                                            <CheckCircle2
                                                className="h-6 w-6 text-green-600"
                                            />

                                        </div>

                                        <div>

                                            <p className="text-sm text-slate-500">
                                                Sua frequência
                                            </p>

                                            <p className="text-2xl font-bold text-slate-900">

                                                {frequencia.presencas}

                                                <span className="ml-2 text-base font-medium text-slate-500">
                                                    presenças
                                                </span>

                                            </p>

                                        </div>

                                    </div>

                                    <p className="mt-4 text-sm text-slate-500">

                                        Você está participando da
                                        jornada da EBD. Continue firme!

                                    </p>

                                </>

                            )}

                        </div>

                    </section>
                )}


            {/* ================================================= */}
            {/* ÁREA DO PROFESSOR */}
            {/* ================================================= */}

            {ehProfessor && (

                <section className="space-y-4">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm font-medium text-blue-600">
                                Agenda
                            </p>

                            <h2 className="text-xl font-bold text-slate-900">
                                Minha escala
                            </h2>

                        </div>

                        <GraduationCap
                            className="h-6 w-6 text-slate-300"
                        />

                    </div>


                    {escala.length === 0 ? (

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">

                            Você ainda não possui aulas
                            escaladas.

                        </div>

                    ) : (

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="divide-y divide-slate-100">

                                {escala.map(
                                    (aula) => (

                                        <div
                                            key={
                                                aula.id
                                            }
                                            className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                                        >

                                            {aula.imagem_path && (

                                                <LessonImage
                                                    aula={
                                                        aula
                                                    }
                                                    downloadable
                                                    className="aspect-video w-full rounded-xl md:w-36 md:shrink-0"
                                                />

                                            )}


                                            <div className="min-w-0 flex-1">

                                                <div className="flex items-center gap-2">

                                                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">

                                                        Aula{" "}
                                                        {aula.numero}

                                                    </span>

                                                    <span className="text-xs text-slate-400">

                                                        {formatarData(
                                                            aula.data
                                                        )}

                                                    </span>

                                                </div>

                                                <h3 className="mt-2 font-semibold text-slate-800">

                                                    {aula.titulo}

                                                </h3>

                                            </div>


                                            <div className="flex flex-wrap items-center gap-3">

                                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">

                                                    <Clock3
                                                        className="h-4 w-4"
                                                    />

                                                    {aula.horario}

                                                </span>

                                                {aula.link_drive && (

                                                    <a
                                                        href={
                                                            aula.link_drive
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                                                    >

                                                        <ExternalLink
                                                            className="h-4 w-4"
                                                        />

                                                        Material

                                                    </a>

                                                )}

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    )}

                </section>

            )}


            {/* ================================================= */}
            {/* ATALHOS */}
            {/* ================================================= */}

            <section>

                <h2 className="mb-4 text-lg font-bold text-slate-900">
                    Acesso rápido
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

                    {pessoa?.perfil === "ALUNO" && (

                        <Link
                            to="/aluno/checkin"
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        >

                            <MapPin
                                className="h-6 w-6 text-blue-600"
                            />

                            <p className="mt-3 font-semibold text-slate-800">
                                Fazer check-in
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Registre sua presença na aula.
                            </p>

                        </Link>

                    )}


                    <Link
                        to="/aulas"
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >

                        <BookOpen
                            className="h-6 w-6 text-blue-600"
                        />

                        <p className="mt-3 font-semibold text-slate-800">
                            Aulas
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Consulte as aulas da EBD.
                        </p>

                    </Link>


                    <Link
                        to="/presencas"
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >

                        <CheckCircle2
                            className="h-6 w-6 text-green-600"
                        />

                        <p className="mt-3 font-semibold text-slate-800">
                            Minhas presenças
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Consulte seu histórico.
                        </p>

                    </Link>

                </div>

            </section>

        </div>
    );
}