import {
    useEffect,
    useState,
} from "react";

import {
    Activity,
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    ShieldCheck,
    TrendingUp,
    Users,
    UserRound,
    AlertTriangle,
} from "lucide-react";

import {
    DashboardService,
    type DashboardResumo,
    type DashboardTrimestre,
    type DashboardAnalise,
    type DashboardEvolucaoTrimestre,
    type DashboardDesempenhoClasse,
    type DashboardAlunoOpcao,
    type DashboardDesempenhoIndividual,
    type DashboardEvolucaoAlunoTrimestre,
} from "../services/DashboardService";

type Props = {
    igrejaId: string | null;
    resumoInicial: DashboardResumo | null;
};

export function DashboardIgrejaPage({
    igrejaId,
    resumoInicial,
}: Props) {

    const [
        resumo,
        setResumo,
    ] =
        useState<DashboardResumo | null>(
            resumoInicial
        );

    const [
        trimestres,
        setTrimestres,
    ] =
        useState<DashboardTrimestre[]>([]);

    const [
        trimestreSelecionado,
        setTrimestreSelecionado,
    ] =
        useState("");

    const [
        carregandoPeriodo,
        setCarregandoPeriodo,
    ] =
        useState(false);

    const [
        analise,
        setAnalise,
    ] =
        useState<DashboardAnalise | null>(
            null
        );

    const [
        evolucaoTrimestres,
        setEvolucaoTrimestres,
    ] =
        useState<
            DashboardEvolucaoTrimestre[]
        >([]);


    const [
        desempenhoClasses,
        setDesempenhoClasses,
    ] =
        useState<
            DashboardDesempenhoClasse[]
        >([]);

    const [
        alunosDashboard,
        setAlunosDashboard,
    ] =
        useState<
            DashboardAlunoOpcao[]
        >([]);


    const [
        alunoSelecionado,
        setAlunoSelecionado,
    ] =
        useState("");


    const [
        trimestreIndividualSelecionado,
        setTrimestreIndividualSelecionado,
    ] =
        useState("");


    const [
        desempenhoIndividual,
        setDesempenhoIndividual,
    ] =
        useState<
            DashboardDesempenhoIndividual | null
        >(null);

    const [
        evolucaoAluno,
        setEvolucaoAluno,
    ] =
        useState<
            DashboardEvolucaoAlunoTrimestre[]
        >([]);


    const [
        carregandoIndividual,
        setCarregandoIndividual,
    ] =
        useState(false);

    const [
        abaAtiva,
        setAbaAtiva,
    ] =
        useState<
            "GERAL" |
            "INDIVIDUAL"
        >("GERAL");


    useEffect(() => {

        setResumo(
            resumoInicial
        );

    }, [
        resumoInicial,
    ]);


    useEffect(() => {

        async function carregarTrimestres() {

            if (!igrejaId) {

                setTrimestres([]);

                return;
            }

            try {

                const dados =
                    await DashboardService
                        .listarTrimestres(
                            igrejaId
                        );

                setTrimestres(
                    dados
                );

            } catch (error) {

                console.error(
                    "Erro ao carregar trimestres do Dashboard:",
                    error
                );

            }

        }

        carregarTrimestres();

    }, [
        igrejaId,
    ]);

    useEffect(() => {

        async function carregarAnaliseInicial() {

            if (!igrejaId) {

                setAnalise(
                    null
                );

                return;
            }

            try {

                const [
                    dadosAnalise,
                    dadosEvolucao,
                    dadosClasses,
                ] =
                    await Promise.all([

                        DashboardService
                            .carregarAnalise(
                                igrejaId,
                                null
                            ),

                        DashboardService
                            .carregarEvolucaoTrimestres(
                                igrejaId
                            ),

                        DashboardService
                            .carregarDesempenhoClasses(
                                igrejaId,
                                null
                            ),

                    ]);


                setAnalise(
                    dadosAnalise
                );

                setEvolucaoTrimestres(
                    dadosEvolucao
                );

                setDesempenhoClasses(
                    dadosClasses
                );

            } catch (error) {

                console.error(
                    "Erro ao carregar análise do Dashboard:",
                    error
                );

            }

        }

        carregarAnaliseInicial();

    }, [
        igrejaId,
    ]);

    useEffect(() => {

        async function carregarAlunosDashboard() {

            if (!igrejaId) {

                setAlunosDashboard([]);
                setAlunoSelecionado("");
                setDesempenhoIndividual(null);

                return;
            }

            try {

                const dados =
                    await DashboardService
                        .listarAlunosDashboard(
                            igrejaId
                        );

                setAlunosDashboard(
                    dados
                );

            } catch (error) {

                console.error(
                    "Erro ao carregar alunos do Dashboard:",
                    error
                );

            }

        }

        carregarAlunosDashboard();

    }, [
        igrejaId,
    ]);

    async function carregarDesempenhoAluno(
        alunoId: string,
        trimestreId: string
    ) {

        if (
            !igrejaId ||
            !alunoId
        ) {

            setDesempenhoIndividual(
                null
            );

            return;
        }

        try {

            setCarregandoIndividual(
                true
            );

            const dados =
                await DashboardService
                    .carregarDesempenhoIndividual(
                        igrejaId,
                        alunoId,
                        trimestreId || null
                    );

            setDesempenhoIndividual(
                dados
            );

        } catch (error) {

            console.error(
                "Erro ao carregar desempenho individual:",
                error
            );

            setDesempenhoIndividual(
                null
            );

        } finally {

            setCarregandoIndividual(
                false
            );

        }

    }


    async function alterarAlunoIndividual(
        valor: string
    ) {

        setAlunoSelecionado(
            valor
        );


        if (
            !igrejaId ||
            !valor
        ) {

            setDesempenhoIndividual(
                null
            );

            setEvolucaoAluno([]);

            return;
        }


        try {

            setCarregandoIndividual(
                true
            );


            const [
                desempenho,
                evolucao,
            ] =
                await Promise.all([

                    DashboardService
                        .carregarDesempenhoIndividual(
                            igrejaId,
                            valor,
                            trimestreIndividualSelecionado ||
                            null
                        ),

                    DashboardService
                        .carregarEvolucaoAlunoTrimestres(
                            igrejaId,
                            valor
                        ),

                ]);


            setDesempenhoIndividual(
                desempenho
            );

            setEvolucaoAluno(
                evolucao
            );


        } catch (error) {

            console.error(
                "Erro ao carregar desempenho individual:",
                error
            );

            setDesempenhoIndividual(
                null
            );

            setEvolucaoAluno([]);

        } finally {

            setCarregandoIndividual(
                false
            );

        }

    }


    async function alterarPeriodoIndividual(
        valor: string
    ) {

        setTrimestreIndividualSelecionado(
            valor
        );

        await carregarDesempenhoAluno(
            alunoSelecionado,
            valor
        );

    }


    async function alterarPeriodo(
        valor: string
    ) {

        setTrimestreSelecionado(
            valor
        );

        if (!igrejaId) {
            return;
        }

        try {

            setCarregandoPeriodo(
                true
            );

            const [
                dadosResumo,
                dadosAnalise,
                dadosClasses,
            ] =
                await Promise.all([

                    DashboardService
                        .carregarResumo(
                            igrejaId,
                            valor || null
                        ),

                    DashboardService
                        .carregarAnalise(
                            igrejaId,
                            valor || null
                        ),

                    DashboardService
                        .carregarDesempenhoClasses(
                            igrejaId,
                            valor || null
                        ),

                ]);

            setResumo(
                dadosResumo
            );

            setAnalise(
                dadosAnalise
            );

            setDesempenhoClasses(
                dadosClasses
            );

        } catch (error) {

            console.error(
                "Erro ao alterar período do Dashboard:",
                error
            );

        } finally {

            setCarregandoPeriodo(
                false
            );

        }

    }


    const frequencia =
        analise?.frequenciaMedia ??
        resumo?.frequencia ??
        0;

    const evolucao =
        analise?.evolucaoPontosPercentuais ??
        null;

    const primeiroTrimestreAluno =
        evolucaoAluno.length > 0
            ? evolucaoAluno[0]
            : null;


    const ultimoTrimestreAluno =
        evolucaoAluno.length > 0
            ? evolucaoAluno[
            evolucaoAluno.length - 1
            ]
            : null;


    const evolucaoAlunoPontos =
        primeiroTrimestreAluno &&
            ultimoTrimestreAluno &&
            primeiroTrimestreAluno.id !==
            ultimoTrimestreAluno.id
            ? ultimoTrimestreAluno.frequencia -
            primeiroTrimestreAluno.frequencia
            : null;


    const melhorTrimestreAluno =
        evolucaoAluno.length > 0
            ? evolucaoAluno.reduce(
                (melhor, atual) =>
                    atual.frequencia >
                        melhor.frequencia
                        ? atual
                        : melhor
            )
            : null;


    const aulasSemProfessor =
        resumo?.aulasSemProfessor ?? 0;

    const sistemaOk =
        aulasSemProfessor === 0;

    function formatarData(data: string | null) {
        if (!data) {
            return "Nenhum registro";
        }

        return new Date(
            `${data}T00:00:00`
        ).toLocaleDateString("pt-BR");
    }

    if (
        abaAtiva ===
        "INDIVIDUAL"
    ) {

        return (

            <div className="space-y-6">

                {/* ================================================= */}
                {/* NAVEGAÇÃO */}
                {/* ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

                    <div className="flex flex-col gap-2 sm:flex-row">

                        <button
                            type="button"
                            onClick={() =>
                                setAbaAtiva(
                                    "GERAL"
                                )
                            }
                            className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                        >
                            Visão Geral
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setAbaAtiva(
                                    "INDIVIDUAL"
                                )
                            }
                            className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm"
                        >
                            Desempenho Individual
                        </button>

                    </div>

                </div>


                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl">

                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl" />

                    <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-2xl" />


                    <div className="relative z-10">

                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">

                            <UserRound size={14} />

                            Plano Igreja • Análise individual

                        </div>


                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">

                            Desempenho do aluno

                        </h1>


                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                            Acompanhe frequência,
                            faltas, participação,
                            comparação com a classe
                            e histórico de aulas.

                        </p>

                    </div>

                </div>


                {/* ================================================= */}
                {/* FILTROS */}
                {/* ================================================= */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="grid gap-4 md:grid-cols-2">

                        {/* ALUNO */}

                        <div>

                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">

                                Aluno

                            </label>

                            <select
                                value={
                                    alunoSelecionado
                                }
                                onChange={(event) =>
                                    alterarAlunoIndividual(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    carregandoIndividual
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                            >

                                <option value="">
                                    Selecione um aluno
                                </option>

                                {alunosDashboard.map(
                                    (aluno) => (

                                        <option
                                            key={
                                                aluno.id
                                            }
                                            value={
                                                aluno.id
                                            }
                                        >
                                            {aluno.nome}
                                            {" — "}
                                            {aluno.classeNome}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* PERÍODO */}

                        <div>

                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">

                                Período

                            </label>

                            <select
                                value={
                                    trimestreIndividualSelecionado
                                }
                                onChange={(event) =>
                                    alterarPeriodoIndividual(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    !alunoSelecionado ||
                                    carregandoIndividual
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                            >

                                <option value="">
                                    Geral — todos os períodos
                                </option>

                                {trimestres.map(
                                    (trimestre) => (

                                        <option
                                            key={
                                                trimestre.id
                                            }
                                            value={
                                                trimestre.id
                                            }
                                        >
                                            {trimestre.numero}º trimestre de{" "}
                                            {trimestre.ano}
                                            {" — "}
                                            {trimestre.tema}
                                            {trimestre.ativo
                                                ? " • Atual"
                                                : ""}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    </div>

                </div>


                {/* ================================================= */}
                {/* CARREGANDO */}
                {/* ================================================= */}

                {carregandoIndividual && (

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center">

                        <p className="text-sm font-semibold text-indigo-700">
                            Calculando desempenho do aluno...
                        </p>

                    </div>

                )}


                {/* ================================================= */}
                {/* NENHUM ALUNO SELECIONADO */}
                {/* ================================================= */}

                {!alunoSelecionado &&
                    !carregandoIndividual && (

                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                                <UserRound size={26} />

                            </div>

                            <h2 className="mt-4 text-lg font-bold text-slate-900">

                                Selecione um aluno

                            </h2>

                            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">

                                Escolha um aluno para visualizar
                                frequência, faltas, comparação com
                                a classe e histórico de participação.

                            </p>

                        </div>

                    )}


                {/* ================================================= */}
                {/* RESULTADO */}
                {/* ================================================= */}

                {desempenhoIndividual &&
                    !carregandoIndividual && (

                        <>

                            {/* CABEÇALHO DO ALUNO */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="flex items-center gap-4">

                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                                            <UserRound size={26} />

                                        </div>


                                        <div>

                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Aluno
                                            </p>

                                            <h2 className="mt-1 text-xl font-bold text-slate-900">

                                                {desempenhoIndividual.aluno.nome}

                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">

                                                Classe{" "}
                                                <strong className="font-semibold text-slate-700">

                                                    {desempenhoIndividual.aluno.classeNome}

                                                </strong>

                                            </p>

                                        </div>

                                    </div>


                                    <div className="min-w-36 rounded-2xl bg-slate-950 px-5 py-4 text-white">

                                        <p className="text-xs text-slate-400">
                                            Frequência
                                        </p>

                                        <p className="mt-1 text-3xl font-bold">

                                            {desempenhoIndividual.frequencia}%

                                        </p>

                                    </div>

                                </div>


                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">

                                    <div
                                        className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    desempenhoIndividual.frequencia
                                                )
                                            )}%`,
                                        }}
                                    />

                                </div>

                            </div>


                            {/* ================================================= */}
                            {/* INDICADORES */}
                            {/* ================================================= */}

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                                {/* PRESENÇAS */}

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                    <CheckCircle2
                                        size={21}
                                        className="text-emerald-600"
                                    />

                                    <p className="mt-4 text-sm font-medium text-slate-500">
                                        Presenças
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">

                                        {desempenhoIndividual.presencas}
                                        {" "}
                                        <span className="text-sm font-medium text-slate-400">
                                            de {desempenhoIndividual.aulasEsperadas}
                                        </span>

                                    </p>

                                </div>


                                {/* FALTAS */}

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                    <AlertTriangle
                                        size={21}
                                        className="text-rose-600"
                                    />

                                    <p className="mt-4 text-sm font-medium text-slate-500">
                                        Faltas
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-rose-600">

                                        {desempenhoIndividual.faltas}

                                    </p>

                                </div>


                                {/* MÉDIA DA CLASSE */}

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                    <Users
                                        size={21}
                                        className="text-blue-600"
                                    />

                                    <p className="mt-4 text-sm font-medium text-slate-500">
                                        Média da classe
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">

                                        {desempenhoIndividual.mediaClasse}%

                                    </p>

                                </div>


                                {/* COMPARAÇÃO */}

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                    <TrendingUp
                                        size={21}
                                        className={
                                            (
                                                desempenhoIndividual
                                                    .diferencaMediaClasse ??
                                                0
                                            ) >= 0
                                                ? "text-emerald-600"
                                                : "text-rose-600"
                                        }
                                    />

                                    <p className="mt-4 text-sm font-medium text-slate-500">
                                        Comparação
                                    </p>


                                    {desempenhoIndividual
                                        .diferencaMediaClasse !== null ? (

                                        <p
                                            className={[
                                                "mt-1 text-2xl font-bold",

                                                desempenhoIndividual
                                                    .diferencaMediaClasse >
                                                    0
                                                    ? "text-emerald-600"
                                                    : desempenhoIndividual
                                                        .diferencaMediaClasse <
                                                        0
                                                        ? "text-rose-600"
                                                        : "text-slate-900",

                                            ].join(" ")}
                                        >

                                            {desempenhoIndividual
                                                .diferencaMediaClasse >
                                                0
                                                ? "+"
                                                : ""}

                                            {desempenhoIndividual
                                                .diferencaMediaClasse}{" "}
                                            p.p.

                                        </p>

                                    ) : (

                                        <p className="mt-1 text-2xl font-bold text-slate-400">
                                            —
                                        </p>

                                    )}


                                    <p className="mt-1 text-xs text-slate-400">
                                        em relação à turma
                                    </p>

                                </div>


                                {/* SEQUÊNCIA */}

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                    <Activity
                                        size={21}
                                        className="text-indigo-600"
                                    />

                                    <p className="mt-4 text-sm font-medium text-slate-500">
                                        Sequência atual
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-slate-900">

                                        {desempenhoIndividual.sequenciaAtual}

                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        presenças consecutivas
                                    </p>

                                </div>

                            </div>


                            {/* ================================================= */}
                            {/* LEITURA EXECUTIVA */}
                            {/* ================================================= */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                                <div className="flex items-start gap-4">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                                        <Activity size={20} />

                                    </div>


                                    <div>

                                        <h2 className="font-bold text-slate-900">

                                            Leitura do desempenho

                                        </h2>


                                        {desempenhoIndividual.aulasEsperadas === 0 ? (

                                            <p className="mt-2 text-sm leading-6 text-slate-500">

                                                Não existem aulas realizadas
                                                para este aluno no período selecionado.

                                            </p>

                                        ) : desempenhoIndividual.frequencia >= 75 ? (

                                            <p className="mt-2 text-sm leading-6 text-emerald-700">

                                                O aluno apresenta boa participação,
                                                com frequência de{" "}
                                                <strong>
                                                    {desempenhoIndividual.frequencia}%
                                                </strong>.

                                            </p>

                                        ) : desempenhoIndividual.frequencia >= 50 ? (

                                            <p className="mt-2 text-sm leading-6 text-amber-700">

                                                O aluno apresenta participação
                                                intermediária, com frequência de{" "}
                                                <strong>
                                                    {desempenhoIndividual.frequencia}%
                                                </strong>.
                                                Vale acompanhar a evolução nas
                                                próximas aulas.

                                            </p>

                                        ) : (

                                            <p className="mt-2 text-sm leading-6 text-rose-700">

                                                O aluno está em faixa de atenção,
                                                com frequência de apenas{" "}
                                                <strong>
                                                    {desempenhoIndividual.frequencia}%
                                                </strong>.
                                                O histórico abaixo pode ajudar a
                                                identificar o padrão de ausência.

                                            </p>

                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* ================================================= */}
                            {/* EVOLUÇÃO ENTRE TRIMESTRES */}
                            {/* ================================================= */}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-6 py-5">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                                            <TrendingUp size={20} />

                                        </div>

                                        <div>

                                            <h2 className="font-bold text-slate-900">
                                                Evolução por trimestre
                                            </h2>

                                            <p className="text-xs text-slate-500">
                                                Histórico de frequência do aluno
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                <div className="p-6">

                                    {evolucaoAluno.length > 0 ? (

                                        <>

                                            {/* RESUMO DA EVOLUÇÃO */}

                                            <div className="mb-7 grid gap-4 sm:grid-cols-2">

                                                <div className="rounded-2xl bg-slate-950 p-5 text-white">

                                                    <p className="text-xs font-medium text-slate-400">
                                                        Tendência
                                                    </p>


                                                    {evolucaoAlunoPontos !== null ? (

                                                        <p
                                                            className={[
                                                                "mt-2 text-3xl font-bold",

                                                                evolucaoAlunoPontos > 0
                                                                    ? "text-emerald-400"
                                                                    : evolucaoAlunoPontos < 0
                                                                        ? "text-rose-400"
                                                                        : "text-white",

                                                            ].join(" ")}
                                                        >

                                                            {evolucaoAlunoPontos > 0
                                                                ? "↑ +"
                                                                : evolucaoAlunoPontos < 0
                                                                    ? "↓ "
                                                                    : ""}

                                                            {evolucaoAlunoPontos} p.p.

                                                        </p>

                                                    ) : (

                                                        <p className="mt-2 text-2xl font-bold text-slate-400">
                                                            —
                                                        </p>

                                                    )}


                                                    <p className="mt-2 text-xs text-slate-400">

                                                        {evolucaoAlunoPontos !== null
                                                            ? "Do primeiro ao último trimestre com dados"
                                                            : "Ainda não há períodos suficientes para comparação"}

                                                    </p>

                                                </div>


                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                                    <p className="text-xs font-medium text-slate-500">
                                                        Melhor trimestre
                                                    </p>


                                                    {melhorTrimestreAluno ? (

                                                        <>

                                                            <p className="mt-2 text-2xl font-bold text-slate-900">

                                                                {melhorTrimestreAluno.numero}º/
                                                                {melhorTrimestreAluno.ano}

                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-emerald-600">

                                                                {melhorTrimestreAluno.frequencia}%
                                                                {" de frequência"}

                                                            </p>

                                                        </>

                                                    ) : (

                                                        <p className="mt-2 text-2xl font-bold text-slate-400">
                                                            —
                                                        </p>

                                                    )}

                                                </div>

                                            </div>


                                            {/* GRÁFICO */}

                                            <div className="space-y-5">

                                                {evolucaoAluno.map(
                                                    (
                                                        trimestre,
                                                        indice
                                                    ) => {

                                                        const anterior =
                                                            indice > 0
                                                                ? evolucaoAluno[
                                                                indice - 1
                                                                ]
                                                                : null;


                                                        const diferenca =
                                                            anterior
                                                                ? trimestre.frequencia -
                                                                anterior.frequencia
                                                                : null;


                                                        return (

                                                            <div
                                                                key={
                                                                    trimestre.id
                                                                }
                                                            >

                                                                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                                                                    <div>

                                                                        <div className="flex items-center gap-2">

                                                                            <p className="text-sm font-bold text-slate-800">

                                                                                {trimestre.numero}º trimestre de{" "}
                                                                                {trimestre.ano}

                                                                            </p>


                                                                            {trimestre.ativo && (

                                                                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">

                                                                                    Atual

                                                                                </span>

                                                                            )}

                                                                        </div>


                                                                        <p className="mt-0.5 text-xs text-slate-400">

                                                                            {trimestre.tema}

                                                                        </p>


                                                                        <p className="mt-1 text-xs text-slate-500">

                                                                            {trimestre.presencas} de{" "}
                                                                            {trimestre.aulasEsperadas} aulas
                                                                            {" • "}
                                                                            {trimestre.faltas} falta
                                                                            {trimestre.faltas !== 1
                                                                                ? "s"
                                                                                : ""}

                                                                        </p>

                                                                    </div>


                                                                    <div className="flex items-center gap-4">

                                                                        {diferenca !== null && (

                                                                            <span
                                                                                className={[
                                                                                    "text-xs font-bold",

                                                                                    diferenca > 0
                                                                                        ? "text-emerald-600"
                                                                                        : diferenca < 0
                                                                                            ? "text-rose-600"
                                                                                            : "text-slate-400",

                                                                                ].join(" ")}
                                                                            >

                                                                                {diferenca > 0
                                                                                    ? `↑ +${diferenca}`
                                                                                    : diferenca < 0
                                                                                        ? `↓ ${diferenca}`
                                                                                        : "0"}{" "}
                                                                                p.p.

                                                                            </span>

                                                                        )}


                                                                        <span className="min-w-14 text-right text-xl font-bold text-slate-900">

                                                                            {trimestre.frequencia}%

                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                                                                    <div
                                                                        className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                100,
                                                                                Math.max(
                                                                                    0,
                                                                                    trimestre.frequencia
                                                                                )
                                                                            )}%`,
                                                                        }}
                                                                    />

                                                                </div>

                                                            </div>

                                                        );

                                                    }
                                                )}

                                            </div>

                                        </>

                                    ) : (

                                        <div className="py-10 text-center">

                                            <TrendingUp
                                                size={30}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                                Ainda não há histórico suficiente
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Os trimestres aparecerão conforme
                                                houver aulas realizadas para o aluno.
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* ================================================= */}
                            {/* HISTÓRICO */}
                            {/* ================================================= */}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-6 py-5">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                            <CalendarDays size={20} />

                                        </div>


                                        <div>

                                            <h2 className="font-bold text-slate-900">
                                                Histórico de participação
                                            </h2>

                                            <p className="text-xs text-slate-500">
                                                Aula por aula no período analisado
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                <div className="p-5">

                                    {desempenhoIndividual.historico.length >
                                        0 ? (

                                        <div className="space-y-3">

                                            {desempenhoIndividual.historico.map(
                                                (registro) => (

                                                    <div
                                                        key={
                                                            registro.aulaId
                                                        }
                                                        className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                                                    >

                                                        <div className="flex items-start gap-3">

                                                            <div
                                                                className={
                                                                    registro.presente
                                                                        ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
                                                                        : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"
                                                                }
                                                            >

                                                                {registro.presente ? (

                                                                    <CheckCircle2 size={18} />

                                                                ) : (

                                                                    <AlertTriangle size={18} />

                                                                )}

                                                            </div>


                                                            <div>

                                                                <p className="font-semibold text-slate-900">

                                                                    Aula{" "}
                                                                    {registro.numero ??
                                                                        "-"}{" "}
                                                                    •{" "}
                                                                    {registro.titulo}

                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">

                                                                    {formatarData(
                                                                        registro.data
                                                                    )}

                                                                </p>

                                                            </div>

                                                        </div>


                                                        <div className="flex items-center gap-2">

                                                            {registro.presente ? (

                                                                <>

                                                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">

                                                                        Presente

                                                                    </span>


                                                                    {registro.tipoRegistro && (

                                                                        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-semibold uppercase text-slate-600">

                                                                            {registro.tipoRegistro}

                                                                        </span>

                                                                    )}

                                                                </>

                                                            ) : (

                                                                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">

                                                                    Ausente

                                                                </span>

                                                            )}

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    ) : (

                                        <div className="py-10 text-center">

                                            <CalendarDays
                                                size={30}
                                                className="mx-auto text-slate-300"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-slate-600">

                                                Nenhuma aula realizada neste período

                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </>

                    )}

            </div>

        );
    }

    return (
        <div className="space-y-6">

            {/* ================================================= */}
            {/* NAVEGAÇÃO DO DASHBOARD AVANÇADO */}
            {/* ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

                <div className="flex flex-col gap-2 sm:flex-row">

                    <button
                        type="button"
                        onClick={() =>
                            setAbaAtiva(
                                "GERAL"
                            )
                        }
                        className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                        Visão Geral
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setAbaAtiva(
                                "INDIVIDUAL"
                            )
                        }
                        className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                    >
                        Desempenho Individual
                    </button>

                </div>

            </div>


            {/* ================================================= */}
            {/* FILTRO DE PERÍODO */}
            {/* ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <p className="text-sm font-bold text-slate-900">
                            Período de análise
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Consulte toda a história da EBD
                            ou analise um trimestre específico.
                        </p>

                    </div>


                    <div className="w-full lg:w-96">

                        <select
                            value={
                                trimestreSelecionado
                            }
                            onChange={(event) =>
                                alterarPeriodo(
                                    event.target.value
                                )
                            }
                            disabled={
                                carregandoPeriodo
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-wait disabled:opacity-60"
                        >

                            <option value="">
                                Geral — todos os períodos
                            </option>

                            {trimestres.map(
                                (trimestre) => (

                                    <option
                                        key={
                                            trimestre.id
                                        }
                                        value={
                                            trimestre.id
                                        }
                                    >
                                        {trimestre.numero}º trimestre de{" "}
                                        {trimestre.ano}
                                        {" — "}
                                        {trimestre.tema}
                                        {trimestre.ativo
                                            ? " • Atual"
                                            : ""}
                                    </option>

                                )
                            )}

                        </select>


                        {carregandoPeriodo && (

                            <p className="mt-2 text-xs font-medium text-indigo-600">

                                Atualizando indicadores...

                            </p>

                        )}

                    </div>

                </div>

            </div>




            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl">

                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl" />

                <div className="relative z-10">

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">

                                <ShieldCheck size={14} />

                                Plano Igreja

                            </div>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">

                                Visão geral da EBD

                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                                Acompanhe a saúde da Escola Bíblica,
                                frequência, estrutura e programação
                                em uma única visão executiva.

                            </p>

                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">

                                <Activity size={20} />

                            </div>

                            <div>

                                <p className="text-xs text-slate-500">
                                    Status da EBD
                                </p>

                                <p className="text-sm font-semibold text-white">

                                    {sistemaOk
                                        ? "Operação normal"
                                        : "Requer atenção"}

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ================================================= */}
            {/* INDICADORES DE DECISÃO */}
            {/* ================================================= */}

            <div>

                <div className="mb-4 flex flex-col gap-1">

                    <h2 className="text-lg font-bold text-slate-900">
                        Indicadores de decisão
                    </h2>

                    <p className="text-sm text-slate-500">
                        Métricas para acompanhar participação,
                        engajamento e evolução da EBD.
                    </p>

                </div>


                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {/* FREQUÊNCIA */}

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-lg">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-medium text-blue-100">
                                    Frequência média
                                </p>

                                <p className="mt-2 text-4xl font-bold tracking-tight">
                                    {frequencia}%
                                </p>

                                <p className="mt-2 text-xs text-blue-100">
                                    Participação no período
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">

                                <TrendingUp size={21} />

                            </div>

                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">

                            <div
                                className="h-full rounded-full bg-white transition-all duration-700"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            frequencia
                                        )
                                    )}%`,
                                }}
                            />

                        </div>

                    </div>


                    {/* EVOLUÇÃO */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Evolução
                                </p>

                                {evolucao !== null ? (

                                    <>

                                        <p
                                            className={[
                                                "mt-2 text-3xl font-bold tracking-tight",

                                                evolucao > 0
                                                    ? "text-emerald-600"
                                                    : evolucao < 0
                                                        ? "text-rose-600"
                                                        : "text-slate-900",

                                            ].join(" ")}
                                        >

                                            {evolucao > 0
                                                ? "↑ "
                                                : evolucao < 0
                                                    ? "↓ "
                                                    : ""}

                                            {evolucao > 0
                                                ? "+"
                                                : ""}

                                            {evolucao} p.p.

                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">

                                            vs.{" "}

                                            {analise?.trimestreAnterior
                                                ? `${analise.trimestreAnterior.numero}º trim. de ${analise.trimestreAnterior.ano}`
                                                : "período anterior"}

                                        </p>

                                    </>

                                ) : (

                                    <>

                                        <p className="mt-2 text-2xl font-bold text-slate-400">
                                            —
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Selecione um trimestre comparável
                                        </p>

                                    </>

                                )}

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                                <Activity size={21} />

                            </div>

                        </div>

                    </div>


                    {/* ASSÍDUOS */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Alunos assíduos
                                </p>

                                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">

                                    {analise?.alunosAssiduos ?? 0}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Frequência igual ou superior a 75%
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                                <CheckCircle2 size={21} />

                            </div>

                        </div>

                    </div>


                    {/* ATENÇÃO */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Alunos em atenção
                                </p>

                                <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">

                                    {analise?.alunosAtencao ?? 0}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Participação abaixo de 50%
                                </p>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                                <AlertTriangle size={21} />

                            </div>

                        </div>

                    </div>

                </div>


                <div className="mt-4 grid gap-4 sm:grid-cols-3">

                    {/* SEM PARTICIPAÇÃO */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Sem participação
                                </p>

                                <p className="mt-2 text-2xl font-bold text-rose-600">

                                    {analise?.alunosSemParticipacao ?? 0}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Nenhuma presença no período
                                </p>

                            </div>

                            <UserRound
                                size={22}
                                className="text-rose-500"
                            />

                        </div>

                    </div>


                    {/* MÉDIA POR AULA */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Média por aula
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">

                                    {(
                                        analise?.mediaAlunosPorAula ??
                                        0
                                    ).toLocaleString(
                                        "pt-BR",
                                        {
                                            minimumFractionDigits: 1,
                                            maximumFractionDigits: 1,
                                        }
                                    )}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Alunos presentes por aula
                                </p>

                            </div>

                            <Users
                                size={22}
                                className="text-blue-600"
                            />

                        </div>

                    </div>


                    {/* COBERTURA PROFESSORES */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Cobertura docente
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">

                                    {analise?.coberturaProfessores ?? 0}%

                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Aulas com professor definido
                                </p>

                            </div>

                            <GraduationCap
                                size={22}
                                className="text-indigo-600"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* RANKING DE ASSIDUIDADE */}
            {/* ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <TrendingUp size={20} />
                        </div>

                        <div>
                            <h2 className="font-bold text-slate-900">
                                Ranking de assiduidade
                            </h2>

                            <p className="text-xs text-slate-500">
                                Alunos com maior frequência no período selecionado
                            </p>
                        </div>

                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Top 10
                    </div>

                </div>


                <div className="p-5">

                    {(analise?.rankingAssiduidade.length ?? 0) > 0 ? (

                        <div className="space-y-2">

                            {analise?.rankingAssiduidade.map(
                                (aluno, index) => (

                                    <div
                                        key={aluno.id}
                                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                                    >

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">

                                            {index === 0
                                                ? "🥇"
                                                : index === 1
                                                    ? "🥈"
                                                    : index === 2
                                                        ? "🥉"
                                                        : `${index + 1}º`}

                                        </div>


                                        <div className="min-w-0 flex-1">

                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {aluno.nome}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {aluno.presencas} de{" "}
                                                {aluno.aulasEsperadas} aulas
                                            </p>

                                        </div>


                                        <div className="hidden w-32 sm:block">

                                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                                                <div
                                                    className={[
                                                        "h-full rounded-full",

                                                        aluno.frequencia >= 90
                                                            ? "bg-emerald-500"
                                                            : aluno.frequencia >= 75
                                                                ? "bg-blue-500"
                                                                : aluno.frequencia >= 50
                                                                    ? "bg-amber-500"
                                                                    : "bg-rose-500",

                                                    ].join(" ")}
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                aluno.frequencia
                                                            )
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>


                                        <div
                                            className={[
                                                "min-w-14 text-right text-sm font-bold",

                                                aluno.frequencia >= 90
                                                    ? "text-emerald-700"
                                                    : aluno.frequencia >= 75
                                                        ? "text-blue-700"
                                                        : aluno.frequencia >= 50
                                                            ? "text-amber-700"
                                                            : "text-rose-700",

                                            ].join(" ")}
                                        >
                                            {aluno.frequencia}%
                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">

                            <Users
                                size={28}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-medium text-slate-600">
                                Ainda não há dados suficientes
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                O ranking aparecerá após o registro das presenças.
                            </p>

                        </div>

                    )}

                </div>

            </div>


            {/* ================================================= */}
            {/* EVOLUÇÃO INDIVIDUAL ENTRE TRIMESTRES */}
            {/* ================================================= */}

            {trimestreSelecionado &&
                analise?.trimestreAnterior && (

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <Activity size={20} />
                                </div>

                                <div>

                                    <h2 className="font-bold text-slate-900">
                                        Evolução da frequência dos alunos
                                    </h2>

                                    <p className="text-xs text-slate-500">

                                        Comparação individual com o{" "}
                                        {analise.trimestreAnterior.numero}º trimestre de{" "}
                                        {analise.trimestreAnterior.ano}

                                    </p>

                                </div>

                            </div>


                            <div className="text-xs text-slate-400">
                                Variação em pontos percentuais
                            </div>

                        </div>


                        {analise.comparativoAlunos.length > 0 ? (

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-slate-50">

                                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                                            <th className="px-5 py-3">
                                                Aluno
                                            </th>

                                            <th className="whitespace-nowrap px-5 py-3 text-center">
                                                Trimestre anterior
                                            </th>

                                            <th className="whitespace-nowrap px-5 py-3 text-center">
                                                Atual
                                            </th>

                                            <th className="whitespace-nowrap px-5 py-3 text-center">
                                                Variação
                                            </th>

                                            <th className="whitespace-nowrap px-5 py-3">
                                                Evolução
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-slate-100">

                                        {analise.comparativoAlunos.map(
                                            (aluno) => (

                                                <tr
                                                    key={aluno.id}
                                                    className="transition hover:bg-slate-50"
                                                >

                                                    <td className="px-5 py-4">
                                                        <p className="whitespace-nowrap text-sm font-semibold text-slate-900">
                                                            {aluno.nome}
                                                        </p>
                                                    </td>


                                                    <td className="px-5 py-4 text-center">

                                                        {aluno.frequenciaAnterior !== null ? (

                                                            <p className="text-sm font-semibold text-slate-700">
                                                                {aluno.frequenciaAnterior}%
                                                            </p>

                                                        ) : (

                                                            <span className="text-sm text-slate-400">
                                                                —
                                                            </span>

                                                        )}

                                                    </td>


                                                    <td className="px-5 py-4 text-center">

                                                        <p className="text-sm font-bold text-slate-900">
                                                            {aluno.frequenciaAtual}%
                                                        </p>

                                                    </td>


                                                    <td
                                                        className={[
                                                            "whitespace-nowrap px-5 py-4 text-center text-sm font-bold",

                                                            aluno.variacao === null
                                                                ? "text-slate-400"
                                                                : aluno.variacao > 0
                                                                    ? "text-emerald-600"
                                                                    : aluno.variacao < 0
                                                                        ? "text-rose-600"
                                                                        : "text-slate-500",

                                                        ].join(" ")}
                                                    >

                                                        {aluno.variacao === null
                                                            ? "—"
                                                            : aluno.variacao > 0
                                                                ? `+${aluno.variacao} p.p.`
                                                                : `${aluno.variacao} p.p.`}

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        {aluno.situacao === "MELHOROU" && (
                                                            <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                ↑ Melhorou
                                                            </span>
                                                        )}

                                                        {aluno.situacao === "PIOROU" && (
                                                            <span className="inline-flex whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                                                                ↓ Piorou
                                                            </span>
                                                        )}

                                                        {aluno.situacao === "MANTEVE" && (
                                                            <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                                → Manteve
                                                            </span>
                                                        )}

                                                        {aluno.situacao === "SEM_HISTORICO" && (
                                                            <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                                Novo no período
                                                            </span>
                                                        )}

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        ) : (

                            <div className="p-8 text-center">
                                <p className="text-sm text-slate-500">
                                    Não há dados suficientes para comparar os alunos.
                                </p>
                            </div>

                        )}

                    </div>

                )}

            {/* ================================================= */}
            {/* ALUNOS QUE PRECISAM DE ATENÇÃO */}
            {/* ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                            <AlertTriangle size={20} />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Alunos que precisam de atenção
                            </h2>

                            <p className="text-xs text-slate-500">
                                Participação abaixo de 50% no período analisado
                            </p>

                        </div>

                    </div>

                </div>


                <div className="p-5">

                    {(
                        analise?.alunosCriticos.length ??
                        0
                    ) > 0 ? (

                        <div className="space-y-3">

                            {analise?.alunosCriticos.map(
                                (aluno) => (

                                    <div
                                        key={aluno.id}
                                        className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >

                                        <div>

                                            <p className="font-semibold text-slate-900">
                                                {aluno.nome}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">

                                                {aluno.presencas} de{" "}
                                                {aluno.aulasEsperadas} aulas

                                            </p>

                                        </div>


                                        <div className="flex items-center gap-4">

                                            <div className="w-32">

                                                <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                                                    <div
                                                        className="h-full rounded-full bg-amber-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                aluno.frequencia
                                                            )}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>


                                            <span className="min-w-12 text-right text-sm font-bold text-amber-700">

                                                {aluno.frequencia}%

                                            </span>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">

                            <div className="flex items-center gap-3">

                                <CheckCircle2
                                    size={20}
                                    className="text-emerald-600"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-emerald-900">
                                        Nenhum aluno em situação crítica
                                    </p>

                                    <p className="mt-1 text-xs text-emerald-700">
                                        Não há alunos com frequência abaixo de 50% neste período.
                                    </p>

                                </div>

                            </div>

                        </div>

                    )}

                </div>

            </div>

            {/* ================================================= */}
            {/* EVOLUÇÃO POR TRIMESTRE */}
            {/* ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                            <TrendingUp size={20} />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Evolução da frequência
                            </h2>

                            <p className="text-xs text-slate-500">
                                Comparação histórica entre trimestres
                            </p>

                        </div>

                    </div>

                </div>


                <div className="p-6">

                    {evolucaoTrimestres.length > 0 ? (

                        <div className="space-y-5">

                            {evolucaoTrimestres.map(
                                (
                                    trimestre,
                                    indice
                                ) => {

                                    const anterior =
                                        indice > 0
                                            ? evolucaoTrimestres[
                                            indice - 1
                                            ]
                                            : null;

                                    const diferenca =
                                        anterior
                                            ? trimestre.frequencia -
                                            anterior.frequencia
                                            : null;


                                    return (

                                        <div
                                            key={
                                                trimestre.id
                                            }
                                        >

                                            <div className="mb-2 flex items-center justify-between gap-4">

                                                <div>

                                                    <div className="flex items-center gap-2">

                                                        <p className="text-sm font-semibold text-slate-800">

                                                            {trimestre.numero}º trimestre de{" "}
                                                            {trimestre.ano}

                                                        </p>

                                                        {trimestre.ativo && (

                                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">

                                                                Atual

                                                            </span>

                                                        )}

                                                    </div>

                                                    <p className="mt-0.5 text-xs text-slate-400">

                                                        {trimestre.tema}

                                                    </p>

                                                </div>


                                                <div className="flex items-center gap-3">

                                                    {diferenca !== null && (

                                                        <span
                                                            className={[
                                                                "text-xs font-bold",

                                                                diferenca > 0
                                                                    ? "text-emerald-600"
                                                                    : diferenca < 0
                                                                        ? "text-rose-600"
                                                                        : "text-slate-400",

                                                            ].join(" ")}
                                                        >

                                                            {diferenca > 0
                                                                ? `↑ +${diferenca}`
                                                                : diferenca < 0
                                                                    ? `↓ ${diferenca}`
                                                                    : "0"}{" "}
                                                            p.p.

                                                        </span>

                                                    )}


                                                    <span className="min-w-12 text-right text-lg font-bold text-slate-900">

                                                        {trimestre.frequencia}%

                                                    </span>

                                                </div>

                                            </div>


                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                                                <div
                                                    className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                trimestre.frequencia
                                                            )
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    ) : (

                        <div className="py-8 text-center text-sm text-slate-400">

                            Ainda não há dados suficientes para
                            mostrar a evolução.

                        </div>

                    )}

                </div>

            </div>

            {/* ================================================= */}
            {/* DESEMPENHO POR CLASSE */}
            {/* ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-6 py-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                            <BookOpen size={20} />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Desempenho por classe
                            </h2>

                            <p className="text-xs text-slate-500">

                                Compare participação e engajamento
                                entre as turmas

                            </p>

                        </div>

                    </div>

                </div>


                <div className="grid gap-4 p-5 lg:grid-cols-2">

                    {desempenhoClasses.map(
                        (classe) => (

                            <div
                                key={classe.id}
                                className="rounded-2xl border border-slate-200 p-5"
                            >

                                <div className="flex items-start justify-between">

                                    <div>

                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Classe
                                        </p>

                                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                                            {classe.nome}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-400">

                                            {classe.alunos} aluno
                                            {classe.alunos !== 1
                                                ? "s"
                                                : ""}

                                            {" • "}

                                            {classe.aulasRealizadas} aula
                                            {classe.aulasRealizadas !== 1
                                                ? "s"
                                                : ""}

                                        </p>

                                    </div>


                                    <div className="text-right">

                                        <p className="text-3xl font-bold text-slate-900">

                                            {classe.frequencia}%

                                        </p>

                                        <p className="text-xs text-slate-400">
                                            frequência
                                        </p>

                                    </div>

                                </div>


                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">

                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    classe.frequencia
                                                )
                                            )}%`,
                                        }}
                                    />

                                </div>


                                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                                    <div className="rounded-xl bg-slate-50 p-3">

                                        <p className="text-[10px] font-bold uppercase text-slate-400">
                                            Média/aula
                                        </p>

                                        <p className="mt-1 font-bold text-slate-900">

                                            {classe.mediaAlunosPorAula
                                                .toLocaleString(
                                                    "pt-BR",
                                                    {
                                                        minimumFractionDigits: 1,
                                                        maximumFractionDigits: 1,
                                                    }
                                                )}

                                        </p>

                                    </div>


                                    <div className="rounded-xl bg-emerald-50 p-3">

                                        <p className="text-[10px] font-bold uppercase text-emerald-600">
                                            Assíduos
                                        </p>

                                        <p className="mt-1 font-bold text-emerald-700">

                                            {classe.alunosAssiduos}

                                        </p>

                                    </div>


                                    <div className="rounded-xl bg-amber-50 p-3">

                                        <p className="text-[10px] font-bold uppercase text-amber-600">
                                            Atenção
                                        </p>

                                        <p className="mt-1 font-bold text-amber-700">

                                            {classe.alunosAtencao}

                                        </p>

                                    </div>


                                    <div className="rounded-xl bg-rose-50 p-3">

                                        <p className="text-[10px] font-bold uppercase text-rose-600">
                                            Ausentes
                                        </p>

                                        <p className="mt-1 font-bold text-rose-700">

                                            {classe.alunosSemParticipacao}

                                        </p>

                                    </div>

                                </div>

                            </div>

                        )
                    )}

                </div>

            </div>


            {/* ================================================= */}
            {/* PRÓXIMA AULA + STATUS */}
            {/* ================================================= */}

            <div className="grid gap-6 xl:grid-cols-3">

                {/* PRÓXIMA AULA */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                                <CalendarDays size={20} />

                            </div>

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Próxima aula
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Próxima atividade programada
                                </p>

                            </div>

                        </div>

                        <ArrowUpRight
                            size={18}
                            className="text-slate-400"
                        />

                    </div>

                    <div className="p-6">

                        {resumo?.proximaAula ? (

                            <div className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                    <div className="mb-2 inline-flex rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">

                                        Aula {resumo.proximaAula.numero ?? "-"}

                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900">

                                        {resumo.proximaAula.titulo}

                                    </h3>

                                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                                        <UserRound size={15} />

                                        {resumo.proximaAula.professor}

                                    </div>

                                </div>

                                <div className="rounded-xl bg-white px-5 py-4 shadow-sm">

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Data
                                    </p>

                                    <p className="mt-1 font-bold text-slate-900">
                                        {formatarData(
                                            resumo.proximaAula.data
                                        )}
                                    </p>

                                </div>

                            </div>

                        ) : (

                            <div className="rounded-2xl bg-slate-50 p-8 text-center">

                                <CalendarDays
                                    className="mx-auto text-slate-300"
                                    size={32}
                                />

                                <p className="mt-3 font-semibold text-slate-700">
                                    Nenhuma aula programada
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Cadastre uma aula para acompanhar
                                    a programação.
                                </p>

                            </div>

                        )}

                    </div>

                </div>


                {/* SAÚDE DA PROGRAMAÇÃO */}

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                                <AlertTriangle size={20} />

                            </div>

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Saúde da programação
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Indicadores operacionais
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="space-y-3 p-5">

                        <div
                            className={
                                aulasSemProfessor > 0
                                    ? "rounded-xl border border-amber-100 bg-amber-50 p-4"
                                    : "rounded-xl border border-emerald-100 bg-emerald-50 p-4"
                            }
                        >

                            <div className="flex items-center gap-3">

                                {aulasSemProfessor > 0 ? (
                                    <AlertTriangle
                                        size={19}
                                        className="text-amber-600"
                                    />
                                ) : (
                                    <CheckCircle2
                                        size={19}
                                        className="text-emerald-600"
                                    />
                                )}

                                <div>

                                    <p className="text-sm font-semibold text-slate-800">

                                        {aulasSemProfessor > 0
                                            ? `${aulasSemProfessor} aula${aulasSemProfessor > 1
                                                ? "s"
                                                : ""
                                            } sem professor`
                                            : "Todas as aulas têm professor"}

                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">

                                        {aulasSemProfessor > 0
                                            ? "A programação precisa de atenção."
                                            : "A programação está organizada."}

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-4">

                            <div className="flex items-center gap-3">

                                <ShieldCheck
                                    size={19}
                                    className="text-slate-500"
                                />

                                <div>

                                    <p className="text-sm font-semibold text-slate-700">
                                        Sistema operacional
                                    </p>

                                    <p className="text-xs text-slate-400">
                                        Dados carregados normalmente
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ================================================= */}
            {/* DESEMPENHO DA EBD */}
            {/* ================================================= */}

            <div className="grid gap-6 md:grid-cols-3">

                {/* DESEMPENHO */}

                <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-lg">

                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />

                    <div className="relative z-10">

                        <div className="flex items-start justify-between">

                            <div>

                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Desempenho da EBD
                                </p>

                                <h2 className="mt-1 text-lg font-bold">
                                    Frequência geral
                                </h2>

                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">

                                <TrendingUp size={19} />

                            </div>

                        </div>


                        <div className="mt-7 flex items-end gap-2">

                            <span className="text-4xl font-bold tracking-tight">
                                {frequencia}%
                            </span>

                            <span className="mb-1 text-xs text-slate-400">
                                participação
                            </span>

                        </div>


                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

                            <div
                                className="h-full rounded-full bg-white transition-all duration-700"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(0, frequencia)
                                    )}%`,
                                }}
                            />

                        </div>


                        <div className="mt-6 grid grid-cols-2 gap-3">

                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Presenças
                                </p>

                                <p className="mt-1 text-xl font-bold text-white">
                                    {resumo?.presencas ?? 0}
                                </p>

                            </div>


                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Último registro
                                </p>

                                <p className="mt-1 text-sm font-bold text-white">
                                    {formatarData(
                                        resumo?.ultimaPresenca ?? null
                                    )}
                                </p>

                            </div>

                        </div>


                        <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">

                            <CheckCircle2
                                size={14}
                                className="text-emerald-400"
                            />

                            Indicador geral de participação da EBD

                        </div>

                    </div>

                </div>


                {/* ESTRUTURA */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

                            <BookOpen size={20} />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Estrutura
                            </h2>

                            <p className="text-xs text-slate-500">
                                Organização pedagógica
                            </p>

                        </div>

                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-50 p-4">

                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Aulas
                            </p>

                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {resumo?.aulas ?? 0}
                            </p>

                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">

                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Classes
                            </p>

                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {resumo?.classes ?? 0}
                            </p>

                        </div>

                    </div>

                </div>


                {/* COMUNIDADE */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                            <Users size={20} />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Comunidade
                            </h2>

                            <p className="text-xs text-slate-500">
                                Pessoas envolvidas
                            </p>

                        </div>

                    </div>

                    <div className="mt-6 space-y-4">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2">

                                <Users
                                    size={15}
                                    className="text-slate-400"
                                />

                                <span className="text-sm text-slate-600">
                                    Alunos
                                </span>

                            </div>

                            <strong className="text-slate-900">
                                {resumo?.alunos ?? 0}
                            </strong>

                        </div>

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2">

                                <GraduationCap
                                    size={15}
                                    className="text-slate-400"
                                />

                                <span className="text-sm text-slate-600">
                                    Professores
                                </span>

                            </div>

                            <strong className="text-slate-900">
                                {resumo?.professores ?? 0}
                            </strong>

                        </div>

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2">

                                <UserRound
                                    size={15}
                                    className="text-slate-400"
                                />

                                <span className="text-sm text-slate-600">
                                    Pessoas cadastradas
                                </span>

                            </div>

                            <strong className="text-slate-900">
                                {resumo?.pessoas ?? 0}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            {/* ================================================= */}
            {/* RODAPÉ EXECUTIVO */}
            {/* ================================================= */}

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

                        <ShieldCheck size={18} />

                    </div>

                    <div>

                        <p className="text-sm font-semibold text-slate-700">
                            EBD Manager • Plano Igreja
                        </p>

                        <p className="text-xs text-slate-400">
                            Visão executiva da Escola Bíblica
                        </p>

                    </div>

                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">

                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    Sistema operacional

                </div>

            </div>

        </div>
    );
}