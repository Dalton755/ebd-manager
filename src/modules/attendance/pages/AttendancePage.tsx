import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BookOpen,
    CalendarDays,
    Check,
    GraduationCap,
    Loader2,
    Search,
    Users,
} from "lucide-react";

import {
    toast,
} from "sonner";

import {
    PeopleService,
} from "@/modules/people/services/PeopleService";

import {
    LessonService,
} from "@/modules/lessons/services/LessonService";

import {
    AttendanceService,
} from "../services/AttendanceService";

import type {
    Pessoa,
} from "@/modules/people/types/Pessoa";

import type {
    AulaComStatus,
} from "@/modules/lessons/services/LessonService";

import type {
    TrimestreComClasses,
} from "@/modules/lessons/types/TrimestreClasse";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    useFormDraft,
} from "@/shared/hooks/useFormDraft";


type Aluno = Pessoa & {
    presente: boolean;
};


function formatarData(
    data: string
) {

    if (!data) {
        return "-";
    }

    return new Date(
        `${data}T00:00:00`
    ).toLocaleDateString(
        "pt-BR"
    );
}


function formatarHora(
    hora: string | null
) {

    if (!hora) {
        return "-";
    }

    return hora.slice(
        0,
        5
    );
}


function obterDataLocalHoje() {

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


export function AttendancePage() {

    const {
        pessoa,
    } =
        useAuth();


    const [
        trimestres,
        setTrimestres,
    ] =
        useState<
            TrimestreComClasses[]
        >(
            []
        );


    const [
        aulas,
        setAulas,
    ] =
        useState<
            AulaComStatus[]
        >(
            []
        );


    const [
        alunos,
        setAlunos,
    ] =
        useState<
            Aluno[]
        >(
            []
        );


    const [
        pesquisa,
        setPesquisa,
    ] =
        useState(
            ""
        );


    const [
        loadingEstrutura,
        setLoadingEstrutura,
    ] =
        useState(
            true
        );


    const [
        loadingAlunos,
        setLoadingAlunos,
    ] =
        useState(
            false
        );


    const [
        processandoId,
        setProcessandoId,
    ] =
        useState<string | null>(
            null
        );


    /*
     * Guarda os filtros mesmo saindo
     * da página ou fechando o navegador.
     */
    const {
        valores:
        filtros,

        setValores:
        setFiltros,
    } =
        useFormDraft(
            `filtros-chamada-${pessoa?.igreja_id ?? "sem-igreja"}`,
            {
                trimestreId: "",
                classeId: "",
                aulaId: "",
            }
        );


    const trimestreSelecionado =
        useMemo(
            () =>
                trimestres.find(
                    (
                        trimestre
                    ) =>
                        trimestre.id ===
                        filtros.trimestreId
                ) ??
                null,

            [
                trimestres,
                filtros.trimestreId,
            ]
        );


    const classesDisponiveis =
        trimestreSelecionado
            ?.classes ??
        [];


    const classeSelecionada =
        classesDisponiveis.find(
            (
                classe
            ) =>
                classe.classe_id ===
                filtros.classeId
        ) ??
        null;


    const aulaSelecionada =
        aulas.find(
            (
                aula
            ) =>
                aula.id ===
                filtros.aulaId
        ) ??
        null;


    /*
     * Escolhe uma aula útil automaticamente.
     *
     * Prioridade:
     * 1. aula já salva no filtro;
     * 2. aula de hoje;
     * 3. primeira aula da classe.
     */
    function escolherAula(
        aulasDisponiveis:
            AulaComStatus[],
        aulaSalvaId?: string
    ) {

        if (
            aulaSalvaId &&
            aulasDisponiveis.some(
                (
                    aula
                ) =>
                    aula.id ===
                    aulaSalvaId
            )
        ) {
            return aulaSalvaId;
        }


        const hoje =
            obterDataLocalHoje();


        const aulaDeHoje =
            aulasDisponiveis.find(
                (
                    aula
                ) =>
                    aula.data ===
                    hoje
            );


        return (
            aulaDeHoje?.id ??
            aulasDisponiveis[0]?.id ??
            ""
        );
    }


    /*
     * Carrega toda a estrutura inicial.
     *
     * O trimestre atual é usado como
     * padrão quando não existe filtro salvo.
     */
    async function carregarEstrutura() {

        if (
            !pessoa?.igreja_id
        ) {
            return;
        }


        try {

            setLoadingEstrutura(
                true
            );


            const dados =
                await LessonService
                    .listarTrimestresComClasses(
                        pessoa.igreja_id
                    );


            setTrimestres(
                dados
            );


            const trimestreIdSalvo =
                dados.some(
                    (
                        trimestre
                    ) =>
                        trimestre.id ===
                        filtros.trimestreId
                )
                    ? filtros.trimestreId
                    : "";


            const trimestreId =
                trimestreIdSalvo ||
                dados.find(
                    (
                        trimestre
                    ) =>
                        trimestre.ativo
                )?.id ||
                dados[0]?.id ||
                "";


            const trimestre =
                dados.find(
                    (
                        item
                    ) =>
                        item.id ===
                        trimestreId
                );


            const classes =
                trimestre?.classes ??
                [];


            const classeIdSalvo =
                classes.some(
                    (
                        classe
                    ) =>
                        classe.classe_id ===
                        filtros.classeId
                )
                    ? filtros.classeId
                    : "";


            const classeId =
                classeIdSalvo ||
                classes[0]?.classe_id ||
                "";


            let aulasDaClasse:
                AulaComStatus[] =
                [];


            if (
                trimestreId &&
                classeId
            ) {

                aulasDaClasse =
                    await LessonService
                        .listarAulasDaClasseNoTrimestre(
                            trimestreId,
                            classeId
                        );
            }


            setAulas(
                aulasDaClasse
            );


            const aulaId =
                escolherAula(
                    aulasDaClasse,
                    filtros.aulaId
                );


            setFiltros({
                trimestreId,
                classeId,
                aulaId,
            });

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível carregar os filtros da chamada."
            );

        } finally {

            setLoadingEstrutura(
                false
            );
        }
    }


    useEffect(() => {

        if (
            !pessoa?.igreja_id
        ) {
            return;
        }


        void carregarEstrutura();

    }, [
        pessoa?.igreja_id,
    ]);


    /*
     * Troca de trimestre.
     *
     * A classe e a aula são recalculadas
     * para evitar combinações inválidas.
     */
    async function alterarTrimestre(
        trimestreId: string
    ) {

        const trimestre =
            trimestres.find(
                (
                    item
                ) =>
                    item.id ===
                    trimestreId
            );


        const classeId =
            trimestre
                ?.classes[0]
                ?.classe_id ??
            "";


        let aulasDaClasse:
            AulaComStatus[] =
            [];


        try {

            setLoadingEstrutura(
                true
            );


            if (
                trimestreId &&
                classeId
            ) {

                aulasDaClasse =
                    await LessonService
                        .listarAulasDaClasseNoTrimestre(
                            trimestreId,
                            classeId
                        );
            }


            setAulas(
                aulasDaClasse
            );


            setFiltros({
                trimestreId,

                classeId,

                aulaId:
                    escolherAula(
                        aulasDaClasse
                    ),
            });

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível carregar as aulas do trimestre."
            );

        } finally {

            setLoadingEstrutura(
                false
            );
        }
    }


    /*
     * Troca de classe.
     */
    async function alterarClasse(
        classeId: string
    ) {

        try {

            setLoadingEstrutura(
                true
            );


            let aulasDaClasse:
                AulaComStatus[] =
                [];


            if (
                filtros.trimestreId &&
                classeId
            ) {

                aulasDaClasse =
                    await LessonService
                        .listarAulasDaClasseNoTrimestre(
                            filtros.trimestreId,
                            classeId
                        );
            }


            setAulas(
                aulasDaClasse
            );


            setFiltros(
                (
                    atual
                ) => ({
                    ...atual,

                    classeId,

                    aulaId:
                        escolherAula(
                            aulasDaClasse
                        ),
                })
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível carregar as aulas da classe."
            );

        } finally {

            setLoadingEstrutura(
                false
            );
        }
    }


    /*
     * Carrega somente os alunos da classe
     * e as presenças da aula selecionada.
     */
    async function carregarAlunosDaAula() {

        if (
            !pessoa?.igreja_id ||
            !filtros.classeId ||
            !filtros.aulaId
        ) {

            setAlunos(
                []
            );

            return;
        }


        try {

            setLoadingAlunos(
                true
            );


            const [
                pessoas,
                presencas,
            ] =
                await Promise.all([
                    PeopleService
                        .listar(
                            pessoa.igreja_id
                        ),

                    AttendanceService
                        .listarPorAula(
                            filtros.aulaId
                        ),
                ]);


            const alunosDaClasse =
                (
                    pessoas ??
                    []
                )
                    .filter(
                        (
                            item
                        ) =>
                            item.ativo ===
                            true &&
                            item.status ===
                            "ATIVO"
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.nome.localeCompare(
                                b.nome,
                                "pt-BR"
                            )
                    );


            const alunosComPresenca =
                alunosDaClasse.map(
                    (
                        aluno
                    ) => ({
                        ...aluno,

                        presente:
                            presencas.some(
                                (
                                    presenca
                                ) =>
                                    presenca.pessoa_id ===
                                    aluno.id
                            ),
                    })
                );


            setAlunos(
                alunosComPresenca
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível carregar os alunos e as presenças."
            );

        } finally {

            setLoadingAlunos(
                false
            );
        }
    }


    useEffect(() => {

        void carregarAlunosDaAula();

    }, [
        filtros.aulaId,
        filtros.classeId,
        pessoa?.igreja_id,
    ]);


    /*
     * Clique na presença.
     *
     * Agora a identidade é:
     *
     * pessoa + aula
     *
     * e não mais pessoa + data.
     */
    async function registrarPresenca(
        aluno: Aluno
    ) {

        if (
            !aluno.id ||
            !aulaSelecionada ||
            !pessoa?.id
        ) {
            return;
        }


        try {

            setProcessandoId(
                aluno.id
            );


            if (
                aluno.presente
            ) {

                await AttendanceService
                    .removerPresencaDaAula(
                        aluno.id,
                        aulaSelecionada.id
                    );


                toast.success(
                    `${aluno.nome} marcado como ausente.`
                );

            } else {

                await AttendanceService
                    .registrarChamadaNaAula(
                        aluno.id,
                        aulaSelecionada.id,
                        aulaSelecionada.data,
                        pessoa.id
                    );


                toast.success(
                    `${aluno.nome} presente.`
                );
            }


            await carregarAlunosDaAula();

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível registrar a presença."
            );

        } finally {

            setProcessandoId(
                null
            );
        }
    }


    const alunosFiltrados =
        useMemo(
            () => {

                const termo =
                    pesquisa
                        .trim()
                        .toLowerCase();


                if (!termo) {
                    return alunos;
                }


                return alunos.filter(
                    (
                        aluno
                    ) =>
                        aluno.nome
                            .toLowerCase()
                            .includes(
                                termo
                            )
                );

            },

            [
                alunos,
                pesquisa,
            ]
        );


    const presentes =
        alunos.filter(
            (
                aluno
            ) =>
                aluno.presente
        ).length;


    if (
        loadingEstrutura &&
        trimestres.length === 0
    ) {

        return (

            <div className="flex min-h-[55vh] items-center justify-center">

                <div className="text-center">

                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                        Carregando chamada...
                    </p>

                </div>

            </div>
        );
    }


    return (

        <div className="mx-auto w-full max-w-7xl space-y-6">


            {/* CABEÇALHO */}

            <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100">

                    <Users
                        size={28}
                        className="text-blue-600"
                    />

                </div>


                <div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        Registrar presença
                    </h1>


                    <p className="mt-1 text-slate-500">
                        Selecione a turma e a aula para realizar a chamada.
                    </p>

                </div>

            </div>


            {/* FILTROS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="grid gap-4 lg:grid-cols-3">


                    {/* TRIMESTRE */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-600">
                            Trimestre
                        </label>


                        <select
                            value={
                                filtros.trimestreId
                            }

                            onChange={(
                                event
                            ) =>
                                void alterarTrimestre(
                                    event.target.value
                                )
                            }

                            disabled={
                                loadingEstrutura
                            }

                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-blue-600 disabled:bg-slate-50"
                        >

                            {trimestres.map(
                                (
                                    trimestre
                                ) => (

                                    <option
                                        key={
                                            trimestre.id
                                        }
                                        value={
                                            trimestre.id
                                        }
                                    >

                                        {trimestre.numero}º Trimestre de{" "}
                                        {trimestre.ano}

                                        {trimestre.ativo
                                            ? " — Atual"
                                            : ""}

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* CLASSE */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-600">
                            Classe
                        </label>


                        <select
                            value={
                                filtros.classeId
                            }

                            onChange={(
                                event
                            ) =>
                                void alterarClasse(
                                    event.target.value
                                )
                            }

                            disabled={
                                loadingEstrutura ||
                                !filtros.trimestreId
                            }

                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-blue-600 disabled:bg-slate-50"
                        >

                            {classesDisponiveis.length ===
                                0 && (

                                    <option value="">
                                        Nenhuma classe disponível
                                    </option>

                                )}


                            {classesDisponiveis.map(
                                (
                                    classe
                                ) => (

                                    <option
                                        key={
                                            classe.classe_id
                                        }

                                        value={
                                            classe.classe_id
                                        }
                                    >

                                        {classe.classe_nome}

                                        {classe.tema
                                            ? ` — ${classe.tema}`
                                            : ""}

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* AULA */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-600">
                            Aula
                        </label>


                        <select
                            value={
                                filtros.aulaId
                            }

                            onChange={(
                                event
                            ) =>
                                setFiltros(
                                    (
                                        atual
                                    ) => ({
                                        ...atual,

                                        aulaId:
                                            event.target.value,
                                    })
                                )
                            }

                            disabled={
                                loadingEstrutura ||
                                !filtros.classeId
                            }

                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-blue-600 disabled:bg-slate-50"
                        >

                            {aulas.length ===
                                0 && (

                                    <option value="">
                                        Nenhuma aula cadastrada
                                    </option>

                                )}


                            {aulas.map(
                                (
                                    aula
                                ) => (

                                    <option
                                        key={
                                            aula.id
                                        }

                                        value={
                                            aula.id
                                        }
                                    >

                                        Aula {aula.numero}
                                        {" — "}
                                        {aula.titulo}

                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>


                {/* RESUMO DA AULA */}

                {aulaSelecionada && (

                    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-start gap-3">

                            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />


                            <div>

                                <p className="font-semibold text-slate-900">

                                    Aula {aulaSelecionada.numero}
                                    {" — "}
                                    {aulaSelecionada.titulo}

                                </p>


                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">

                                    <span className="inline-flex items-center gap-1.5">

                                        <CalendarDays size={15} />

                                        {formatarData(
                                            aulaSelecionada.data
                                        )}

                                    </span>


                                    <span>

                                        {formatarHora(
                                            aulaSelecionada.hora_inicio
                                        )}

                                        {" às "}

                                        {formatarHora(
                                            aulaSelecionada.hora_fim
                                        )}

                                    </span>

                                </div>

                            </div>

                        </div>


                        {classeSelecionada && (

                            <div className="text-sm text-slate-500">

                                <span className="inline-flex items-center gap-1.5">

                                    <GraduationCap size={16} />

                                    {classeSelecionada.classe_nome}

                                </span>

                            </div>

                        )}

                    </div>

                )}

            </section>


            {/* SEM AULA */}

            {!aulaSelecionada ? (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                    <h2 className="mt-4 font-semibold text-slate-700">
                        Nenhuma aula selecionada
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Escolha um trimestre, uma classe e uma aula para realizar a chamada.
                    </p>

                </div>

            ) : (

                <>


                    {/* RESUMO */}

                    <div className="grid grid-cols-2 gap-4">

                        <div className="rounded-2xl border bg-white p-5 shadow-sm">

                            <p className="text-sm text-slate-500">
                                Alunos da classe
                            </p>

                            <p className="mt-1 text-3xl font-bold text-slate-900">
                                {alunos.length}
                            </p>

                        </div>


                        <div className="rounded-2xl border bg-white p-5 shadow-sm">

                            <p className="text-sm text-slate-500">
                                Presentes
                            </p>

                            <p className="mt-1 text-3xl font-bold text-green-600">
                                {presentes}
                            </p>

                        </div>

                    </div>


                    {/* PESQUISA */}

                    <div className="rounded-2xl border bg-white p-4 shadow-sm">

                        <div className="relative">

                            <Search
                                size={21}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />


                            <input
                                type="text"

                                placeholder="Pesquisar aluno..."

                                value={
                                    pesquisa
                                }

                                onChange={(
                                    event
                                ) =>
                                    setPesquisa(
                                        event.target.value
                                    )
                                }

                                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600"
                            />

                        </div>

                    </div>


                    {/* ALUNOS */}

                    <div className="rounded-2xl border bg-white p-4 shadow-sm">

                        <div className="mb-4 flex items-center justify-between">

                            <h2 className="text-xl font-bold text-slate-900">
                                Alunos
                            </h2>


                            <span className="text-sm text-slate-500">

                                {presentes}
                                /
                                {alunos.length}

                            </span>

                        </div>


                        {loadingAlunos ? (

                            <div className="flex items-center justify-center gap-2 py-10 text-slate-500">

                                <Loader2 className="h-5 w-5 animate-spin" />

                                Carregando alunos...

                            </div>

                        ) : alunosFiltrados.length ===
                            0 ? (

                            <div className="py-10 text-center text-slate-500">
                                Nenhum aluno encontrado nesta classe.
                            </div>

                        ) : (

                            <div className="space-y-3">

                                {alunosFiltrados.map(
                                    (
                                        aluno
                                    ) => {

                                        const processando =
                                            processandoId ===
                                            aluno.id;


                                        return (

                                            <div
                                                key={
                                                    aluno.id
                                                }

                                                className={`flex items-center gap-3 rounded-xl border p-3 transition ${aluno.presente
                                                        ? "border-green-200 bg-green-50/40"
                                                        : "border-slate-200 bg-white"
                                                    }`}
                                            >

                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${aluno.presente
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >

                                                    {aluno.nome
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}

                                                </div>


                                                <div className="min-w-0 flex-1">

                                                    <p className="truncate font-semibold text-slate-900">
                                                        {aluno.nome}
                                                    </p>


                                                    <p
                                                        className={`text-sm ${aluno.presente
                                                                ? "text-green-600"
                                                                : "text-slate-400"
                                                            }`}
                                                    >

                                                        {aluno.presente
                                                            ? "Presente"
                                                            : "Aguardando"}

                                                    </p>

                                                </div>


                                                <button
                                                    type="button"

                                                    disabled={
                                                        processandoId !==
                                                        null
                                                    }

                                                    onClick={() =>
                                                        void registrarPresenca(
                                                            aluno
                                                        )
                                                    }

                                                    title={
                                                        aluno.presente
                                                            ? "Remover presença"
                                                            : "Registrar presença"
                                                    }

                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-50 ${aluno.presente
                                                            ? "bg-green-600 text-white hover:bg-green-700"
                                                            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                        }`}
                                                >

                                                    {processando ? (

                                                        <Loader2 className="h-5 w-5 animate-spin" />

                                                    ) : (

                                                        <Check size={22} />

                                                    )}

                                                </button>

                                            </div>

                                        );
                                    }
                                )}

                            </div>

                        )}

                    </div>

                </>

            )}

        </div>
    );
}