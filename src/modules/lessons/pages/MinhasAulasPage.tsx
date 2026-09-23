import { useEffect, useState } from "react";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    Presentation,
    Upload,
    UserRound,
} from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { usePlan } from "@/shared/plans/usePlan";
import { temPermissao } from "@/shared/auth/permissions";

import { LessonService } from "../services/LessonService";
import { PresentationService } from "../services/PresentationService";

import {
    LessonImage,
} from "../components/LessonImage";

import type { Aula } from "../types/Aula";
import type { ApresentacaoAula } from "../types/ApresentacaoAula";
import type { Trimestre } from "../types/Trimestre";

import {
    obterAulaEmFoco,
    obterEstadoAula,
    ordenarAulasPorRelevancia,
} from "../utils/lessonFocus";

export function MinhasAulasPage() {

    const { pessoa } = useAuth();

    const perfilUsuario =
        pessoa?.perfil === "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const podeEditarApresentacao =
        temPermissao(
            perfilUsuario,
            "EDITAR_APRESENTACAO"
        );

    console.log(
        "[MINHAS AULAS] Pessoa:",
        {
            id: pessoa?.id,
            nome: pessoa?.nome,
            perfil: pessoa?.perfil,
            igreja_id: pessoa?.igreja_id,
            classe_id: pessoa?.classe_id,
        }
    );

    const navigate =
        useNavigate();

    const { temRecurso } =
        usePlan();

    const possuiRecursoApresentacoes =
        temRecurso(
            "APRESENTACOES_PDF"
        );

    const [
        searchParams,
    ] =
        useSearchParams();


    const aulaDestaqueId =
        searchParams.get(
            "aula"
        );


    const destacarMaterial =
        searchParams.get(
            "material"
        ) === "1";

    const [trimestre, setTrimestre] =
        useState<Trimestre | null>(null);

    const [aulas, setAulas] =
        useState<Aula[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [erro, setErro] =
        useState<string | null>(null);

    const [
        apresentacoes,
        setApresentacoes,
    ] =
        useState<
            Record<
                string,
                ApresentacaoAula | null
            >
        >({});


    const [
        aulaEnviandoPdf,
        setAulaEnviandoPdf,
    ] =
        useState<string | null>(
            null
        );


    const [
        erroApresentacao,
        setErroApresentacao,
    ] =
        useState<string | null>(
            null
        );

    async function importarPdf(
        aula: Aula,
        arquivo: File
    ) {

        if (
            !podeEditarApresentacao ||
            !pessoa?.igreja_id ||
            !pessoa?.id
        ) {
            const mensagem =
                "Você não tem permissão para importar esta apresentação.";

            setErroApresentacao(
                mensagem
            );

            toast.error(
                mensagem
            );

            return;
        }


        try {

            setErroApresentacao(
                null
            );

            setAulaEnviandoPdf(
                aula.id
            );


            const apresentacao =
                await PresentationService
                    .importar(
                        arquivo,
                        aula.id,
                        pessoa.igreja_id,
                        pessoa.id
                    );


            setApresentacoes(
                (estadoAtual) => ({
                    ...estadoAtual,

                    [aula.id]:
                        apresentacao,
                })
            );

            toast.success(
                apresentacoes[aula.id]
                    ? "PDF substituído com sucesso."
                    : "PDF importado com sucesso."
            );

        } catch (error) {

            console.error(
                "[APRESENTAÇÃO] Erro ao importar PDF:",
                error
            );


            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Não foi possível importar o PDF.";

            setErroApresentacao(
                mensagem
            );

            toast.error(
                mensagem
            );

        } finally {

            setAulaEnviandoPdf(
                null
            );
        }
    }


    useEffect(() => {

        async function carregar() {

            try {

                setLoading(true);
                setErro(null);

                if (!pessoa?.id) {
                    setAulas([]);
                    return;
                }

                const igrejaId = pessoa?.igreja_id;

                if (!igrejaId) {
                    throw new Error(
                        "Não foi possível identificar a igreja do usuário."
                    );
                }

                const trimestreAtivo =
                    await LessonService.buscarTrimestreAtivo(
                        igrejaId
                    );

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


                const aulasAtivas =
                    todasAsAulas.filter(
                        (aula) =>
                            !aula.cancelada
                    );


                let aulasParaExibir: Aula[] = [];

                if (
                    pessoa.perfil === "PROFESSOR" ||
                    pessoa.perfil === "SUPERINTENDENTE" ||
                    pessoa.perfil === "ADMIN"
                ) {

                    // PERFIS QUE PODEM MINISTRAR:
                    // mostra somente as aulas em que a própria
                    // pessoa está escalada como professor.
                    aulasParaExibir =
                        aulasAtivas
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

                    const aulasDaClasse =
                        aulasAtivas.filter(
                            (aula) =>
                                aula.classe_id ===
                                pessoa.classe_id
                        );


                    const aulasOrdenadas =
                        [...aulasDaClasse].sort(
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

                setAulas(
                    aulasParaExibir
                );


                /*
                 * Carrega as apresentações somente
                 * das aulas que aparecem nesta tela.
                 *
                 * O recurso também é protegido pelo
                 * banco/RLS. Esta verificação evita
                 * consultas desnecessárias para planos
                 * que não possuem apresentações.
                 */
                if (
                    possuiRecursoApresentacoes &&
                    aulasParaExibir.length > 0
                ) {

                    const resultados =
                        await Promise.all(
                            aulasParaExibir.map(
                                async (aula) => {

                                    const apresentacao =
                                        await PresentationService
                                            .buscar(
                                                aula.id
                                            );

                                    return [
                                        aula.id,
                                        apresentacao,
                                    ] as const;
                                }
                            )
                        );


                    setApresentacoes(
                        Object.fromEntries(
                            resultados
                        )
                    );

                } else {

                    setApresentacoes(
                        {}
                    );
                }

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

    }, [
        pessoa?.id,
        pessoa?.igreja_id,
        possuiRecursoApresentacoes,
    ]);

    useEffect(() => {

        if (
            !aulaDestaqueId ||
            aulas.length === 0
        ) {
            return;
        }


        const timer =
            window.setTimeout(
                () => {

                    const elemento =
                        document.querySelector(
                            `[data-aula-id="${aulaDestaqueId}"]`
                        );


                    elemento?.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "center",
                    });

                },
                200
            );


        return () =>
            window.clearTimeout(
                timer
            );

    }, [
        aulaDestaqueId,
        aulas,
    ]);


    function formatarData(data: string) {

        const [ano, mes, dia] =
            data.split("-");

        return `${dia}/${mes}/${ano}`;
    }


    function formatarHora(
        hora?: string | null
    ) {

        return hora
            ? hora.slice(
                0,
                5
            )
            : "";
    }


    const aulaEmFoco =
        aulas.find(
            (aula) =>
                aula.id ===
                aulaDestaqueId
        ) ??
        obterAulaEmFoco(
            aulas
        );

    const estadoAulaEmFoco =
        aulaEmFoco
            ? obterEstadoAula(
                aulaEmFoco
            )
            : null;

    const aulasRestantes =
        ordenarAulasPorRelevancia(
            aulas
        )
            .filter(
                (aula) =>
                    aula.id !==
                    aulaEmFoco?.id
            );


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

        <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">

            {/* CABEÇALHO */}

            <div>

                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">

                        <BookOpen
                            className="h-6 w-6 text-blue-700"
                        />

                    </div>

                    <div>

                        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
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

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

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

            {erroApresentacao && (

                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

                    {erroApresentacao}

                </div>

            )}


            {/* AULA EM FOCO */}

            {aulaEmFoco &&
                estadoAulaEmFoco && (

                <section
                    data-aula-id={
                        aulaEmFoco.id
                    }
                    className={
                        aulaEmFoco.id ===
                            aulaDestaqueId
                            ? "rounded-3xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-xl shadow-emerald-100 ring-4 ring-emerald-100 sm:p-5"
                            : "rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-xl shadow-blue-100 sm:p-5"
                    }
                >

                    {aulaEmFoco.imagem_path && (

                        <LessonImage
                            aula={
                                aulaEmFoco
                            }
                            downloadable
                            className="mb-4 aspect-video rounded-2xl border border-white/15"
                            downloadClassName="absolute bottom-2 right-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/90 px-3 text-xs font-extrabold text-blue-700 shadow-lg backdrop-blur"
                        />

                    )}


                    <div className="flex items-center justify-between gap-3">

                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                            {estadoAulaEmFoco.rotulo}
                        </span>

                        <span className="text-xs font-semibold text-white/80">
                            Aula {aulaEmFoco.numero}
                        </span>

                    </div>


                    {aulaEmFoco.id ===
                        aulaDestaqueId &&
                        destacarMaterial && (

                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-3 text-sm font-bold">

                            <CheckCircle2
                                className="h-5 w-5 shrink-0"
                            />

                            Presença registrada. Seu material está aqui.

                        </div>

                    )}


                    <div className="mt-4">

                        <h2 className="text-xl font-extrabold leading-snug sm:text-2xl">
                            {aulaEmFoco.titulo}
                        </h2>


                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-blue-50">

                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                {formatarData(
                                    aulaEmFoco.data
                                )}
                            </span>


                            {(aulaEmFoco.hora_inicio ||
                                aulaEmFoco.hora_fim) && (

                                <span className="inline-flex items-center gap-1.5">

                                    <Clock3 className="h-4 w-4" />

                                    {formatarHora(
                                        aulaEmFoco.hora_inicio
                                    )}

                                    {aulaEmFoco.hora_fim
                                        ? ` às ${formatarHora(
                                            aulaEmFoco.hora_fim
                                        )}`
                                        : ""}

                                </span>

                            )}

                        </div>

                    </div>


                    <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">

                        {possuiRecursoApresentacoes &&
                            apresentacoes[
                                aulaEmFoco.id
                            ] && (

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/minhas-aulas/${aulaEmFoco.id}/apresentacao?modo=${podeEditarApresentacao ? "apresentacao" : "aula"}`
                                    )
                                }
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-blue-700 shadow-sm transition active:scale-[0.99]"
                            >
                                <Presentation className="h-4 w-4" />

                                {podeEditarApresentacao
                                    ? "Apresentar agora"
                                    : "Abrir apresentação"}
                            </button>

                        )}


                        {aulaEmFoco.link_drive && (

                            <a
                                href={
                                    aulaEmFoco.link_drive
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99]"
                            >
                                <BookOpen className="h-4 w-4" />
                                Material original
                            </a>

                        )}


                        {possuiRecursoApresentacoes &&
                            podeEditarApresentacao && (

                            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99]">

                                {aulaEnviandoPdf ===
                                    aulaEmFoco.id ? (

                                    <Loader2 className="h-4 w-4 animate-spin" />

                                ) : (

                                    <Upload className="h-4 w-4" />

                                )}


                                {aulaEnviandoPdf ===
                                    aulaEmFoco.id
                                    ? "Enviando..."
                                    : apresentacoes[
                                        aulaEmFoco.id
                                    ]
                                        ? "Substituir PDF"
                                        : "Importar PDF"}


                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    disabled={
                                        aulaEnviandoPdf ===
                                        aulaEmFoco.id
                                    }
                                    onChange={async (
                                        event
                                    ) => {

                                        const arquivo =
                                            event.target
                                                .files?.[0];

                                        event.target.value =
                                            "";

                                        if (!arquivo) {
                                            return;
                                        }

                                        await importarPdf(
                                            aulaEmFoco,
                                            arquivo
                                        );
                                    }}
                                />

                            </label>

                        )}

                    </div>


                    {!aulaEmFoco.link_drive &&
                        !apresentacoes[
                            aulaEmFoco.id
                        ] && (

                        <p className="mt-4 rounded-xl bg-white/10 px-3 py-3 text-sm text-white/80">
                            O material desta aula ainda não foi disponibilizado.
                        </p>

                    )}

                </section>

            )}


            {/* LISTA DE AULAS */}

            {aulasRestantes.length > 0 && (

                <div className="space-y-3">

                    <div className="flex items-center justify-between px-1">

                        <div>

                            <h2 className="text-base font-bold text-slate-800">
                                Outras aulas
                            </h2>

                            <p className="text-xs text-slate-500">
                                Histórico e próximas aulas disponíveis
                            </p>

                        </div>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            {aulasRestantes.length}
                        </span>

                    </div>


                    {aulasRestantes.map((aula) => (

                        <div
                            key={aula.id}
                            data-aula-id={aula.id}
                            className={
                                aula.id === aulaDestaqueId
                                    ? "rounded-3xl border-2 border-emerald-400 bg-white p-4 shadow-lg ring-4 ring-emerald-100 transition sm:p-6"
                                    : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                            }
                        >

                            {aula.imagem_path && (

                                <LessonImage
                                    aula={
                                        aula
                                    }
                                    downloadable
                                    className="mb-4 aspect-video rounded-2xl"
                                />

                            )}


                            {aula.id === aulaDestaqueId &&
                                destacarMaterial && (

                                    <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">

                                        <CheckCircle2
                                            className="h-5 w-5"
                                        />

                                        Presença registrada! Agora acesse o material da aula.

                                    </div>

                                )}

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

                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Material da aula
                                    </p>

                                    <div className="flex flex-col gap-2">

                                        {possuiRecursoApresentacoes &&
                                            apresentacoes[aula.id] && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/minhas-aulas/${aula.id}/apresentacao?modo=aula`
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:min-w-[190px]"
                                                >
                                                    <BookOpen className="h-4 w-4" />

                                                    Ver apresentação
                                                </button>

                                            )}

                                        {aula.link_drive && (

                                            <a
                                                href={aula.link_drive}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={
                                                    aula.id === aulaDestaqueId &&
                                                        destacarMaterial
                                                        ? "flex w-full items-center justify-center gap-3 rounded-2xl border border-amber-400 bg-amber-300 px-6 py-5 text-base font-extrabold text-amber-950 shadow-lg shadow-amber-100 transition hover:bg-amber-400 sm:min-w-[270px]"
                                                        : "flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-200 sm:min-w-[190px]"
                                                }
                                            >
                                                <Presentation
                                                    className={
                                                        aula.id === aulaDestaqueId &&
                                                            destacarMaterial
                                                            ? "h-6 w-6"
                                                            : "h-4 w-4"
                                                    }
                                                />

                                                <span>
                                                    {aula.id === aulaDestaqueId &&
                                                        destacarMaterial
                                                        ? "ABRIR MATERIAL ORIGINAL"
                                                        : "Abrir material original"}
                                                </span>
                                            </a>

                                        )}

                                        {!aula.link_drive &&
                                            !apresentacoes[aula.id] && (

                                                <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500">
                                                    Material ainda não disponibilizado
                                                </div>

                                            )}

                                    </div>

                                </div>


                                {/* APRESENTAÇÃO */}

                                {possuiRecursoApresentacoes &&
                                    podeEditarApresentacao && (

                                        <div className="shrink-0 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">

                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Apresentação
                                            </p>


                                            {apresentacoes[aula.id] ? (

                                                <div className="flex flex-col gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/minhas-aulas/${aula.id}/apresentacao?modo=apresentacao`
                                                            )
                                                        }
                                                        title="Abrir apresentação"
                                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                                                    >

                                                        <Presentation className="h-4 w-4" />

                                                        Apresentar

                                                    </button>


                                                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">

                                                        {aulaEnviandoPdf ===
                                                            aula.id ? (

                                                            <Loader2 className="h-4 w-4 animate-spin" />

                                                        ) : (

                                                            <Upload className="h-4 w-4" />

                                                        )}


                                                        {aulaEnviandoPdf ===
                                                            aula.id
                                                            ? "Enviando..."
                                                            : "Substituir PDF"}


                                                        <input
                                                            type="file"
                                                            accept="application/pdf,.pdf"
                                                            className="hidden"
                                                            disabled={
                                                                aulaEnviandoPdf ===
                                                                aula.id
                                                            }
                                                            onChange={async (
                                                                event
                                                            ) => {

                                                                const arquivo =
                                                                    event.target
                                                                        .files?.[0];

                                                                event.target.value =
                                                                    "";


                                                                if (!arquivo) {
                                                                    return;
                                                                }


                                                                await importarPdf(
                                                                    aula,
                                                                    arquivo
                                                                );
                                                            }}
                                                        />

                                                    </label>

                                                </div>

                                            ) : (

                                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">

                                                    {aulaEnviandoPdf ===
                                                        aula.id ? (

                                                        <Loader2 className="h-4 w-4 animate-spin" />

                                                    ) : (

                                                        <Upload className="h-4 w-4" />

                                                    )}


                                                    {aulaEnviandoPdf ===
                                                        aula.id
                                                        ? "Enviando PDF..."
                                                        : "Importar PDF"}


                                                    <input
                                                        type="file"
                                                        accept="application/pdf,.pdf"
                                                        className="hidden"
                                                        disabled={
                                                            aulaEnviandoPdf ===
                                                            aula.id
                                                        }
                                                        onChange={async (
                                                            event
                                                        ) => {

                                                            const arquivo =
                                                                event.target
                                                                    .files?.[0];

                                                            event.target.value =
                                                                "";


                                                            if (!arquivo) {
                                                                return;
                                                            }


                                                            await importarPdf(
                                                                aula,
                                                                arquivo
                                                            );
                                                        }}
                                                    />

                                                </label>

                                            )}

                                        </div>

                                    )}


                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}