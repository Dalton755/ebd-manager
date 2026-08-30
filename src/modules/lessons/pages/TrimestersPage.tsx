import {
    useEffect,
    useState,
} from "react";

import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Pencil,
    Plus,
    X,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    toast,
} from "sonner";

import {
    LessonService,
} from "../services/LessonService";

import type {
    TrimestreComClasses,
} from "../types/TrimestreClasse";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    usePlan,
} from "@/shared/plans/usePlan";

import {
    temPermissao,
} from "@/shared/auth/permissions";

import {
    useFormDraft,
} from "@/shared/hooks/useFormDraft";


type TemaEmEdicao = {
    trimestreId: string;
    classeId: string;
    classeNome: string;
    tema: string | null;
};


export function TrimestersPage() {

    const navigate =
        useNavigate();

    const {
        pessoa,
    } =
        useAuth();

    const {
        obterLimite,
    } =
        usePlan();

    const maxTrimestresCadastrados =
        obterLimite(
            "max_trimestres"
        );

    const perfilUsuario =
        pessoa?.perfil === "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const podeGerenciar =
        temPermissao(
            perfilUsuario,
            "GERENCIAR_AULAS"
        );


    const [
        trimestres,
        setTrimestres,
    ] =
        useState<TrimestreComClasses[]>(
            []
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        modalNovoTrimestre,
        setModalNovoTrimestre,
    ] =
        useState(false);

    const [
        temaEmEdicao,
        setTemaEmEdicao,
    ] =
        useState<TemaEmEdicao | null>(
            null
        );

    const [
        ativandoId,
        setAtivandoId,
    ] =
        useState<string | null>(
            null
        );


    /*
     * RASCUNHO - NOVO TRIMESTRE
     */
    const {
        valores:
            novoTrimestre,

        setValores:
            setNovoTrimestre,

        limparRascunho:
            limparRascunhoTrimestre,

        rascunhoRecuperado:
            trimestreRecuperado,
    } =
        useFormDraft(
            `novo-trimestre-${pessoa?.igreja_id ?? "sem-igreja"}`,
            {
                numero: "1",
                ano:
                    new Date()
                        .getFullYear()
                        .toString(),
            }
        );


    /*
     * RASCUNHO - TEMA DA CLASSE
     */
    const {
        valores:
            temaDraft,

        setValores:
            setTemaDraft,

        limparRascunho:
            limparRascunhoTema,

        rascunhoRecuperado:
            temaRecuperado,
    } =
        useFormDraft(
            temaEmEdicao
                ? `tema-${temaEmEdicao.trimestreId}-${temaEmEdicao.classeId}`
                : "tema-sem-selecao",

            {
                tema:
                    temaEmEdicao?.tema ??
                    "",
            }
        );


    async function carregarDados() {

        if (
            !pessoa?.igreja_id
        ) {
            return;
        }

        try {

            setLoading(
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

        } catch (error) {

            console.error(
                error
            );

            toast.error(
                "Não foi possível carregar os trimestres."
            );

        } finally {

            setLoading(
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

        void carregarDados();

    }, [
        pessoa?.igreja_id,
    ]);


    const trimestresVisiveis =
        perfilUsuario === "ALUNO"
            ? trimestres.filter(
                (trimestre) =>
                    trimestre.ativo
            )
            : trimestres;


    function obterClassesVisiveis(
        trimestre:
            TrimestreComClasses
    ) {

        if (
            perfilUsuario === "ALUNO" &&
            pessoa?.classe_id
        ) {

            return trimestre.classes.filter(
                (classe) =>
                    classe.classe_id ===
                    pessoa.classe_id
            );
        }

        return trimestre.classes;
    }


    async function criarTrimestre(
        event:
            React.FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (
            !pessoa?.igreja_id
        ) {
            return;
        }


        if (
            maxTrimestresCadastrados !== -1 &&
            trimestres.length >=
                maxTrimestresCadastrados
        ) {

            toast.error(
                `Seu plano permite no máximo ${maxTrimestresCadastrados} trimestre${maxTrimestresCadastrados === 1 ? "" : "s"} cadastrados.`
            );

            return;
        }


        try {

            setSaving(
                true
            );


            await LessonService
                .criarTrimestre(
                    pessoa.igreja_id,

                    Number(
                        novoTrimestre.numero
                    ),

                    Number(
                        novoTrimestre.ano
                    ),

                    /*
                     * Campo legado.
                     * O usuário não verá mais este tema.
                     */
                    "Temas por classe",

                    maxTrimestresCadastrados
                );


            limparRascunhoTrimestre();


            setNovoTrimestre({
                numero: "1",

                ano:
                    new Date()
                        .getFullYear()
                        .toString(),
            });


            setModalNovoTrimestre(
                false
            );


            toast.success(
                "Trimestre cadastrado com sucesso!"
            );


            await carregarDados();

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível cadastrar o trimestre."
            );

        } finally {

            setSaving(
                false
            );
        }
    }


    async function salvarTema(
        event:
            React.FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();


        if (
            !temaEmEdicao ||
            !pessoa?.igreja_id
        ) {
            return;
        }


        try {

            setSaving(
                true
            );


            await LessonService
                .salvarTemaClasseTrimestre(
                    pessoa.igreja_id,

                    temaEmEdicao.trimestreId,

                    temaEmEdicao.classeId,

                    temaDraft.tema
                );


            limparRascunhoTema();


            setTemaEmEdicao(
                null
            );


            toast.success(
                "Tema atualizado com sucesso!"
            );


            await carregarDados();

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível atualizar o tema."
            );

        } finally {

            setSaving(
                false
            );
        }
    }


    async function ativarTrimestre(
        trimestreId: string
    ) {

        if (
            !pessoa?.igreja_id
        ) {
            return;
        }


        try {

            setAtivandoId(
                trimestreId
            );


            await LessonService
                .ativarTrimestre(
                    pessoa.igreja_id,
                    trimestreId
                );


            toast.success(
                "Trimestre definido como atual."
            );


            await carregarDados();

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível ativar o trimestre."
            );

        } finally {

            setAtivandoId(
                null
            );
        }
    }


    if (loading) {

        return (
            <div className="flex min-h-[55vh] items-center justify-center">

                <div className="text-center">

                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                        Carregando aulas...
                    </p>

                </div>

            </div>
        );
    }


    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">


            {/* CABEÇALHO */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Aulas
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Escolha o trimestre e a classe para visualizar e gerenciar as aulas.
                    </p>

                </div>


                {podeGerenciar && (

                    <button
                        type="button"

                        onClick={() =>
                            setModalNovoTrimestre(
                                true
                            )
                        }

                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus size={18} />

                        Novo trimestre
                    </button>

                )}

            </div>


            {/* TRIMESTRES */}

            {trimestresVisiveis.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                    <h2 className="mt-4 font-semibold text-slate-700">
                        Nenhum trimestre cadastrado
                    </h2>

                </div>

            ) : (

                <div className="space-y-6">

                    {trimestresVisiveis.map(
                        (trimestre) => {

                            const classes =
                                obterClassesVisiveis(
                                    trimestre
                                );


                            return (

                                <section
                                    key={
                                        trimestre.id
                                    }

                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >


                                    {/* TÍTULO DO TRIMESTRE */}

                                    <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                                        <div className="flex flex-wrap items-center gap-3">

                                            <div>

                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Período
                                                </p>

                                                <h2 className="mt-1 text-xl font-bold text-slate-900">

                                                    {trimestre.numero}º Trimestre de{" "}
                                                    {trimestre.ano}

                                                </h2>

                                            </div>


                                            {trimestre.ativo && (

                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">

                                                    <CheckCircle2 size={14} />

                                                    Atual

                                                </span>

                                            )}

                                        </div>


                                        {podeGerenciar &&
                                            !trimestre.ativo && (

                                                <button
                                                    type="button"

                                                    disabled={
                                                        ativandoId ===
                                                        trimestre.id
                                                    }

                                                    onClick={() =>
                                                        ativarTrimestre(
                                                            trimestre.id
                                                        )
                                                    }

                                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                                >

                                                    {ativandoId ===
                                                    trimestre.id
                                                        ? "Ativando..."
                                                        : "Tornar atual"}

                                                </button>

                                            )}

                                    </div>


                                    {/* CARDS DAS CLASSES */}

                                    <div className="p-5 sm:p-6">

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                                            {classes.map(
                                                (classe) => (

                                                    <div
                                                        key={
                                                            classe.classe_id
                                                        }

                                                        role="button"

                                                        tabIndex={
                                                            0
                                                        }

                                                        onClick={() =>
                                                            navigate(
                                                                `/aulas/${trimestre.id}/classe/${classe.classe_id}`
                                                            )
                                                        }

                                                        onKeyDown={(
                                                            event
                                                        ) => {

                                                            if (
                                                                event.key === "Enter" ||
                                                                event.key === " "
                                                            ) {

                                                                navigate(
                                                                    `/aulas/${trimestre.id}/classe/${classe.classe_id}`
                                                                );
                                                            }
                                                        }}

                                                        className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                                    >


                                                        <div className="flex items-start justify-between gap-4">

                                                            <div className="flex min-w-0 items-center gap-3">

                                                                <span
                                                                    className="h-3 w-3 shrink-0 rounded-full"

                                                                    style={{
                                                                        backgroundColor:
                                                                            classe.classe_cor ??
                                                                            "#2563eb",
                                                                    }}
                                                                />


                                                                <h3 className="truncate text-lg font-bold text-slate-900">

                                                                    {classe.classe_nome}

                                                                </h3>

                                                            </div>


                                                            {podeGerenciar && (

                                                                <button
                                                                    type="button"

                                                                    title="Editar tema"

                                                                    onClick={(
                                                                        event
                                                                    ) => {

                                                                        event.stopPropagation();


                                                                        setTemaEmEdicao({

                                                                            trimestreId:
                                                                                trimestre.id,

                                                                            classeId:
                                                                                classe.classe_id,

                                                                            classeNome:
                                                                                classe.classe_nome,

                                                                            tema:
                                                                                classe.tema,
                                                                        });
                                                                    }}

                                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                                                >

                                                                    <Pencil size={16} />

                                                                </button>

                                                            )}

                                                        </div>


                                                        <p
                                                            className={
                                                                classe.tema
                                                                    ? "mt-5 text-lg font-semibold text-slate-800"
                                                                    : "mt-5 text-sm font-medium text-amber-600"
                                                            }
                                                        >

                                                            {classe.tema ??
                                                                "Tema não definido"}

                                                        </p>


                                                        <div className="mt-6 flex items-center justify-between">

                                                            <span className="text-sm text-slate-500">

                                                                {classe.total_aulas}{" "}

                                                                {classe.total_aulas === 1
                                                                    ? "aula"
                                                                    : "aulas"}

                                                            </span>


                                                            <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">

                                                                Ver aulas

                                                                <ChevronRight
                                                                    size={17}

                                                                    className="transition group-hover:translate-x-0.5"
                                                                />

                                                            </span>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                </section>
                            );
                        }
                    )}

                </div>

            )}


            {/* NOVO TRIMESTRE */}

            {modalNovoTrimestre && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 p-5">

                            <h2 className="text-lg font-bold text-slate-900">
                                Novo trimestre
                            </h2>


                            <button
                                type="button"

                                onClick={() =>
                                    setModalNovoTrimestre(
                                        false
                                    )
                                }

                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <form
                            onSubmit={
                                criarTrimestre
                            }

                            className="space-y-5 p-6"
                        >


                            {trimestreRecuperado && (

                                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                    Rascunho recuperado.
                                </div>

                            )}


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Trimestre
                                </label>


                                <select
                                    value={
                                        novoTrimestre.numero
                                    }

                                    onChange={(
                                        event
                                    ) =>
                                        setNovoTrimestre(
                                            (atual) => ({
                                                ...atual,

                                                numero:
                                                    event.target.value,
                                            })
                                        )
                                    }

                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                                >

                                    <option value="1">
                                        1º Trimestre
                                    </option>

                                    <option value="2">
                                        2º Trimestre
                                    </option>

                                    <option value="3">
                                        3º Trimestre
                                    </option>

                                    <option value="4">
                                        4º Trimestre
                                    </option>

                                </select>

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Ano
                                </label>


                                <input
                                    type="number"

                                    min="2000"

                                    required

                                    value={
                                        novoTrimestre.ano
                                    }

                                    onChange={(
                                        event
                                    ) =>
                                        setNovoTrimestre(
                                            (atual) => ({
                                                ...atual,

                                                ano:
                                                    event.target.value,
                                            })
                                        )
                                    }

                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                                />

                            </div>


                            <p className="text-xs text-slate-400">
                                O tema será definido individualmente em cada classe.
                            </p>


                            <div className="flex justify-end gap-3">

                                <button
                                    type="button"

                                    onClick={() =>
                                        setModalNovoTrimestre(
                                            false
                                        )
                                    }

                                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                                >
                                    Fechar
                                </button>


                                <button
                                    type="submit"

                                    disabled={
                                        saving
                                    }

                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    Salvar trimestre
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* EDITAR TEMA */}

            {temaEmEdicao && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 p-5">

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Editar tema
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {temaEmEdicao.classeNome}
                                </p>

                            </div>


                            <button
                                type="button"

                                onClick={() =>
                                    setTemaEmEdicao(
                                        null
                                    )
                                }

                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <form
                            onSubmit={
                                salvarTema
                            }

                            className="space-y-5 p-6"
                        >


                            {temaRecuperado && (

                                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                    Rascunho recuperado.
                                </div>

                            )}


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Tema do trimestre
                                </label>


                                <input
                                    type="text"

                                    required

                                    autoFocus

                                    value={
                                        temaDraft.tema
                                    }

                                    onChange={(
                                        event
                                    ) =>
                                        setTemaDraft(
                                            (atual) => ({
                                                ...atual,

                                                tema:
                                                    event.target.value,
                                            })
                                        )
                                    }

                                    placeholder="Ex.: Cartas de Paulo"

                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                />

                            </div>


                            <p className="text-xs text-slate-400">
                                Rascunho salvo automaticamente.
                            </p>


                            <div className="flex justify-end gap-3">

                                <button
                                    type="button"

                                    onClick={() =>
                                        setTemaEmEdicao(
                                            null
                                        )
                                    }

                                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
                                >
                                    Fechar
                                </button>


                                <button
                                    type="submit"

                                    disabled={
                                        saving
                                    }

                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    Salvar tema
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}