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

    useEffect(() => {

        async function carregar() {

            if (!pessoa?.id) {
                return;
            }

            try {

                setLoading(true);
                setErro("");

                const aula =
                    await HomeService
                        .buscarProximaAula();

                setProximaAula(aula);

                if (
                    pessoa.perfil === "ALUNO" ||
                    pessoa.perfil === "PROFESSOR"
                ) {

                    const dadosFrequencia =
                        await HomeService
                            .buscarFrequenciaAluno(
                                pessoa.id
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

    return (
        <div className="mx-auto max-w-6xl space-y-8">

            {/* ================================================= */}
            {/* SAUDAÇÃO */}
            {/* ================================================= */}

            <section>

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

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">

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


                    <div className="grid gap-6 p-6 md:grid-cols-3">

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


                    <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">

                        {proximaAula.link_drive && (

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

                        )}

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

                <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

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

                    <section className="grid gap-6 md:grid-cols-2">

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

                                            <div>

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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {pessoa?.perfil === "ALUNO" && (

                        <Link
                            to="/aluno/checkin"
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
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