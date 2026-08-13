import { useEffect, useState } from "react";
import {
    BookOpen,
    CalendarDays,
    ExternalLink,
    Loader2,
    UserRound,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { LessonService } from "../services/LessonService";
import type { Aula } from "../types/Aula";
import type { Trimestre } from "../types/Trimestre";

export function MinhasAulasPage() {

    const { pessoa } = useAuth();

    const [trimestre, setTrimestre] =
        useState<Trimestre | null>(null);

    const [aulas, setAulas] =
        useState<Aula[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [erro, setErro] =
        useState<string | null>(null);


    useEffect(() => {

        async function carregar() {

            try {

                setLoading(true);
                setErro(null);

                if (!pessoa?.id) {
                    setAulas([]);
                    return;
                }

                const trimestreAtivo =
                    await LessonService.buscarTrimestreAtivo();

                if (!trimestreAtivo) {
                    setTrimestre(null);
                    setAulas([]);
                    return;
                }

                setTrimestre(trimestreAtivo);

                const todasAsAulas =
                    await LessonService.listarAulasDoTrimestre(
                        trimestreAtivo.id
                    );

                let aulasParaExibir: Aula[] = [];

                if (pessoa.perfil === "PROFESSOR") {

                    // PROFESSOR:
                    // mostra somente as aulas em que está escalado.
                    aulasParaExibir =
                        todasAsAulas
                            .filter(
                                (aula) =>
                                    aula.professor_id === pessoa.id
                            )
                            .sort(
                                (a, b) =>
                                    a.numero - b.numero
                            );

                } else if (pessoa.perfil === "ALUNO") {

                    // ALUNO:
                    // mostra todas as aulas já realizadas
                    // e também somente a próxima aula.

                    const hoje = new Date();

                    hoje.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    const aulasOrdenadas =
                        [...todasAsAulas].sort(
                            (a, b) =>
                                a.numero - b.numero
                        );

                    const aulasPassadas =
                        aulasOrdenadas.filter(
                            (aula) => {

                                const dataAula =
                                    new Date(
                                        `${aula.data}T00:00:00`
                                    );

                                return dataAula < hoje;
                            }
                        );

                    const proximaAula =
                        aulasOrdenadas.find(
                            (aula) => {

                                const dataAula =
                                    new Date(
                                        `${aula.data}T00:00:00`
                                    );

                                return dataAula >= hoje;
                            }
                        );

                    aulasParaExibir = [
                        ...aulasPassadas,
                        ...(proximaAula
                            ? [proximaAula]
                            : []),
                    ];

                }

                setAulas(aulasParaExibir);

            } catch (error) {

                console.error(error);

                setErro(
                    "Não foi possível carregar suas aulas."
                );

            } finally {

                setLoading(false);

            }
        }

        carregar();

    }, [pessoa?.id]);


    function formatarData(data: string) {

        const [ano, mes, dia] =
            data.split("-");

        return `${dia}/${mes}/${ano}`;
    }


    if (loading) {

        return (
            <div className="flex min-h-[400px] items-center justify-center">

                <div className="flex items-center gap-3 text-slate-500">

                    <Loader2
                        className="h-5 w-5 animate-spin"
                    />

                    <span>
                        Carregando suas aulas...
                    </span>

                </div>

            </div>
        );
    }


    if (erro) {

        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

                <p className="font-semibold text-red-700">
                    {erro}
                </p>

            </div>
        );
    }


    return (

        <div className="space-y-6">

            {/* CABEÇALHO */}

            <div>

                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">

                        <BookOpen
                            className="h-6 w-6 text-blue-700"
                        />

                    </div>

                    <div>

                        <h1 className="text-2xl font-bold text-slate-800">
                            Minhas aulas
                        </h1>

                        <p className="text-sm text-slate-500">
                            {pessoa?.perfil === "ALUNO"
                                ? "Aulas do trimestre atual"
                                : "Aulas em que você está escalado"}
                        </p>

                    </div>

                </div>

            </div>


            {/* TRIMESTRE */}

            {trimestre && (

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                Trimestre atual
                            </p>

                            <h2 className="mt-1 text-lg font-bold text-slate-800">

                                {trimestre.numero}º Trimestre de{" "}
                                {trimestre.ano}

                            </h2>

                            {trimestre.tema && (

                                <p className="mt-1 text-sm text-slate-500">
                                    {trimestre.tema}
                                </p>

                            )}

                        </div>


                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">

                            <UserRound
                                className="h-5 w-5 text-blue-600"
                            />

                            <div>

                                <p className="text-xs text-slate-500">
                                    {pessoa?.perfil === "ALUNO"
                                        ? "Aluno"
                                        : "Professor"}
                                </p>

                                <p className="text-sm font-semibold text-slate-700">
                                    {pessoa?.nome}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* SEM TRIMESTRE */}

            {!trimestre && (

                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                    <BookOpen
                        className="mx-auto h-10 w-10 text-slate-300"
                    />

                    <h2 className="mt-4 font-semibold text-slate-700">
                        Nenhum trimestre ativo
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Ainda não existe um trimestre ativo.
                    </p>

                </div>

            )}


            {/* SEM AULAS */}

            {trimestre && aulas.length === 0 && (

                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                    <BookOpen
                        className="mx-auto h-10 w-10 text-slate-300"
                    />

                    <h2 className="mt-4 font-semibold text-slate-700">
                        {pessoa?.perfil === "ALUNO"
                            ? "Nenhuma aula disponível"
                            : "Nenhuma aula escalada"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {pessoa?.perfil === "ALUNO"
                            ? "Ainda não existem aulas disponíveis neste trimestre."
                            : "Você ainda não está escalado para ministrar nenhuma aula neste trimestre."}
                    </p>

                </div>

            )}


            {/* LISTA DE AULAS */}

            {aulas.length > 0 && (

                <div className="space-y-4">

                    {aulas.map((aula) => (

                        <div
                            key={aula.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                {/* INFORMAÇÕES */}

                                <div className="flex gap-4">

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                                        <span className="text-lg font-bold text-blue-700">
                                            {aula.numero}
                                        </span>

                                    </div>


                                    <div>

                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                            Aula {aula.numero}
                                        </p>

                                        <h2 className="mt-1 text-lg font-bold text-slate-800">
                                            {aula.titulo}
                                        </h2>

                                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                                            <CalendarDays
                                                className="h-4 w-4"
                                            />

                                            <span>
                                                {formatarData(aula.data)}
                                            </span>

                                        </div>

                                    </div>

                                </div>


                                {/* MATERIAL */}

                                <div className="shrink-0">

                                    {aula.link_drive ? (

                                        <a
                                            href={aula.link_drive}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >

                                            <ExternalLink
                                                className="h-4 w-4"
                                            />

                                            Abrir material

                                        </a>

                                    ) : (

                                        <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500">

                                            Material ainda não
                                            disponibilizado

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}