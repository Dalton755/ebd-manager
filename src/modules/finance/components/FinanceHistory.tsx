import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CalendarDays,
    Eye,
    FileText,
    Filter,
    Pencil,
    Receipt,
    Search,
    Trash2,
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react";

import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/Card";

import {
    LoadingSpinner,
} from "@/shared/components/ui/LoadingSpinner";

import {
    ConfirmDialog,
} from "@/shared/components/ui/ConfirmDialog";

import {
    Modal,
} from "@/shared/components/ui/Modal";

import {
    FinanceService,
} from "../services/FinanceService";

import {
    FinanceForm,
} from "./FinanceForm";

import type {
    CategoriaFinanceira,
    MovimentacaoFinanceira,
    TipoMovimentacao,
} from "../types/MovimentacaoFinanceira";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
} from "@/shared/auth/permissions";


type Props = {
    atualizar?: number;
    onChanged?: () => void;
};


function formatarMoeda(
    valor: number
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        }
    ).format(valor);
}


function formatarData(
    data: string
) {
    if (!data) {
        return "-";
    }

    const [
        ano,
        mes,
        dia,
    ] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}


export function FinanceHistory({
    atualizar = 0,
    onChanged,
}: Props) {

    const {
        pessoa,
    } = useAuth();


    const podeGerenciar =
        pessoa?.perfil !== "PENDENTE" &&
        temPermissao(
            pessoa?.perfil,
            "GERENCIAR_FINANCEIRO"
        );


    const [
        movimentacoes,
        setMovimentacoes,
    ] =
        useState<MovimentacaoFinanceira[]>([]);


    const [
        categorias,
        setCategorias,
    ] =
        useState<CategoriaFinanceira[]>([]);


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        pesquisa,
        setPesquisa,
    ] =
        useState("");

    const [
        filtrosMobileOpen,
        setFiltrosMobileOpen,
    ] =
        useState(false);


    const [
        dataInicial,
        setDataInicial,
    ] =
        useState("");


    const [
        dataFinal,
        setDataFinal,
    ] =
        useState("");


    const [
        tipo,
        setTipo,
    ] =
        useState<
            "TODOS" |
            TipoMovimentacao
        >("TODOS");


    const [
        categoriaId,
        setCategoriaId,
    ] =
        useState("TODAS");


    const [
        movimentacaoParaExcluir,
        setMovimentacaoParaExcluir,
    ] =
        useState<MovimentacaoFinanceira>();


    const [
        movimentacaoParaEditar,
        setMovimentacaoParaEditar,
    ] =
        useState<MovimentacaoFinanceira>();


    const [
        modalEditarOpen,
        setModalEditarOpen,
    ] =
        useState(false);


    const [
        dialogExcluirOpen,
        setDialogExcluirOpen,
    ] =
        useState(false);


    async function carregar() {

        try {

            setLoading(
                true
            );

            const [
                movs,
                cats,
            ] =
                await Promise.all([
                    FinanceService.listarMovimentacoes(),
                    FinanceService.listarCategorias(),
                ]);


            setMovimentacoes(
                movs
            );

            setCategorias(
                cats
            );

        } catch (error) {

            console.error(
                error
            );

            toast.error(
                "Erro ao carregar movimentações."
            );

        } finally {

            setLoading(
                false
            );
        }
    }


    useEffect(() => {

        void carregar();

    }, [
        atualizar,
    ]);


    const movimentacoesFiltradas =
        useMemo(() => {

            const termo =
                pesquisa
                    .trim()
                    .toLocaleLowerCase(
                        "pt-BR"
                    );


            return movimentacoes.filter(
                (
                    movimentacao
                ) => {

                    if (
                        tipo !== "TODOS" &&
                        movimentacao.tipo !== tipo
                    ) {
                        return false;
                    }


                    if (
                        categoriaId !== "TODAS" &&
                        movimentacao.categoria_id !== categoriaId
                    ) {
                        return false;
                    }


                    if (
                        dataInicial &&
                        movimentacao.data <
                        dataInicial
                    ) {
                        return false;
                    }


                    if (
                        dataFinal &&
                        movimentacao.data >
                        dataFinal
                    ) {
                        return false;
                    }


                    if (
                        termo
                    ) {

                        const texto =
                            [
                                movimentacao
                                    .descricao ??
                                "",

                                movimentacao
                                    .categoria
                                    ?.nome ??
                                "",

                                movimentacao
                                    .tipo ===
                                    "RECEITA"
                                    ? "receita"
                                    : "despesa",
                            ]
                                .join(" ")
                                .toLocaleLowerCase(
                                    "pt-BR"
                                );


                        if (
                            !texto.includes(
                                termo
                            )
                        ) {
                            return false;
                        }
                    }


                    return true;
                }
            );

        }, [
            movimentacoes,
            pesquisa,
            tipo,
            categoriaId,
            dataInicial,
            dataFinal,
        ]);


    const temFiltros =
        Boolean(
            pesquisa ||
            dataInicial ||
            dataFinal ||
            tipo !== "TODOS" ||
            categoriaId !== "TODAS"
        );

    const quantidadeFiltrosAtivos =
        [
            Boolean(dataInicial),
            Boolean(dataFinal),
            tipo !== "TODOS",
            categoriaId !== "TODAS",
        ].filter(Boolean).length;


    function limparFiltros() {

        setPesquisa("");
        setDataInicial("");
        setDataFinal("");
        setTipo("TODOS");
        setCategoriaId("TODAS");

        setFiltrosMobileOpen(
            false
        );
    }


    async function abrirComprovante(
        movimentacao:
            MovimentacaoFinanceira
    ) {

        if (
            !movimentacao.comprovante_path
        ) {

            toast.error(
                "Esta movimentação não possui comprovante."
            );

            return;
        }


        try {

            const url =
                await FinanceService
                    .gerarUrlComprovante(
                        movimentacao
                            .comprovante_path
                    );


            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );

        } catch (error) {

            console.error(
                error
            );

            toast.error(
                "Não foi possível abrir o comprovante."
            );
        }
    }


    function solicitarExclusao(
        movimentacao:
            MovimentacaoFinanceira
    ) {

        if (
            !podeGerenciar
        ) {

            toast.error(
                "Você não tem permissão para excluir movimentações."
            );

            return;
        }


        setMovimentacaoParaExcluir(
            movimentacao
        );

        setDialogExcluirOpen(
            true
        );
    }


    async function confirmarExclusao() {

        if (
            !podeGerenciar
        ) {
            return;
        }


        if (
            !movimentacaoParaExcluir?.id
        ) {
            return;
        }


        try {

            await FinanceService
                .excluirMovimentacao(
                    movimentacaoParaExcluir.id
                );


            toast.success(
                "Movimentação excluída."
            );


            setMovimentacaoParaExcluir(
                undefined
            );

            setDialogExcluirOpen(
                false
            );


            await carregar();

            onChanged?.();

        } catch (error) {

            console.error(
                error
            );

            toast.error(
                "Erro ao excluir movimentação."
            );
        }
    }


    function editarMovimentacao(
        movimentacao:
            MovimentacaoFinanceira
    ) {

        if (
            !podeGerenciar
        ) {

            toast.error(
                "Você não tem permissão para editar movimentações."
            );

            return;
        }


        setMovimentacaoParaEditar(
            movimentacao
        );

        setModalEditarOpen(
            true
        );
    }


    return (

        <>

            <Card>

                <CardHeader>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <CardTitle className="flex items-center gap-2">

                            <Receipt
                                size={20}
                            />

                            Movimentações financeiras

                        </CardTitle>


                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

                            {
                                movimentacoesFiltradas
                                    .length
                            }{" "}

                            {
                                movimentacoesFiltradas
                                    .length === 1
                                    ? "registro"
                                    : "registros"
                            }

                        </span>

                    </div>

                </CardHeader>


                <CardContent className="space-y-5">


                    {/* FILTROS */}

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">

                        <div className="mb-3 flex items-center justify-between gap-3">

                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">

                                <Filter
                                    size={16}
                                />

                                Filtros

                            </div>


                            {temFiltros && (

                                <button
                                    type="button"
                                    onClick={
                                        limparFiltros
                                    }
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                                >

                                    <X
                                        size={14}
                                    />

                                    Limpar

                                </button>

                            )}

                        </div>


                        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_.8fr_1fr]">


                            {/* PESQUISA — SEMPRE VISÍVEL */}

                            <div>

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Pesquisar
                                </label>


                                <div className="relative">

                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="text"

                                        value={
                                            pesquisa
                                        }

                                        onChange={(
                                            event
                                        ) =>
                                            setPesquisa(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }

                                        placeholder="Descrição ou categoria..."

                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                            </div>


                            {/* BOTÃO MOBILE */}

                            <button
                                type="button"

                                onClick={() =>
                                    setFiltrosMobileOpen(
                                        (
                                            aberto
                                        ) =>
                                            !aberto
                                    )
                                }

                                className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:hidden"
                            >

                                <span className="flex items-center gap-2">

                                    <Filter
                                        size={16}
                                    />

                                    Mais filtros


                                    {quantidadeFiltrosAtivos > 0 && (

                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">

                                            {
                                                quantidadeFiltrosAtivos
                                            }

                                        </span>

                                    )}

                                </span>


                                {filtrosMobileOpen ? (

                                    <ChevronUp
                                        size={17}
                                    />

                                ) : (

                                    <ChevronDown
                                        size={17}
                                    />

                                )}

                            </button>


                            {/* DATA INICIAL */}

                            <div
                                className={
                                    filtrosMobileOpen
                                        ? "block"
                                        : "hidden md:block"
                                }
                            >

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    De
                                </label>


                                <div className="relative">

                                    <CalendarDays
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="date"

                                        value={
                                            dataInicial
                                        }

                                        onChange={(
                                            event
                                        ) =>
                                            setDataInicial(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }

                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                            </div>


                            {/* DATA FINAL */}

                            <div
                                className={
                                    filtrosMobileOpen
                                        ? "block"
                                        : "hidden md:block"
                                }
                            >

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Até
                                </label>


                                <div className="relative">

                                    <CalendarDays
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />


                                    <input
                                        type="date"

                                        value={
                                            dataFinal
                                        }

                                        onChange={(
                                            event
                                        ) =>
                                            setDataFinal(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }

                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                            </div>


                            {/* TIPO */}

                            <div
                                className={
                                    filtrosMobileOpen
                                        ? "block"
                                        : "hidden md:block"
                                }
                            >

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Tipo
                                </label>


                                <select
                                    value={
                                        tipo
                                    }

                                    onChange={(
                                        event
                                    ) =>
                                        setTipo(
                                            event
                                                .target
                                                .value as
                                            | "TODOS"
                                            | TipoMovimentacao
                                        )
                                    }

                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="TODOS">
                                        Todos
                                    </option>

                                    <option value="RECEITA">
                                        Receitas
                                    </option>

                                    <option value="DESPESA">
                                        Despesas
                                    </option>

                                </select>

                            </div>


                            {/* CATEGORIA */}

                            <div
                                className={
                                    filtrosMobileOpen
                                        ? "block"
                                        : "hidden md:block"
                                }
                            >

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Categoria
                                </label>


                                <select
                                    value={
                                        categoriaId
                                    }

                                    onChange={(
                                        event
                                    ) =>
                                        setCategoriaId(
                                            event
                                                .target
                                                .value
                                        )
                                    }

                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="TODAS">
                                        Todas
                                    </option>


                                    {categorias.map(
                                        (
                                            categoria
                                        ) => (

                                            <option
                                                key={
                                                    categoria.id
                                                }

                                                value={
                                                    categoria.id
                                                }
                                            >

                                                {
                                                    categoria.nome
                                                }

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                    </div>


                    {/* CONTEÚDO */}

                    {loading ? (

                        <LoadingSpinner
                            text="Carregando movimentações..."
                        />

                    ) : movimentacoesFiltradas.length === 0 ? (

                        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">

                            <Receipt
                                size={32}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 font-semibold text-slate-700">
                                Nenhuma movimentação encontrada
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Tente alterar os filtros utilizados.
                            </p>

                        </div>

                    ) : (

                        <>


                            {/* DESKTOP */}

                            <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">

                                <table className="w-full">

                                    <thead className="bg-slate-50">

                                        <tr className="border-b border-slate-200">

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Data
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Tipo
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Categoria
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Descrição
                                            </th>

                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Valor
                                            </th>

                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Comprovante
                                            </th>

                                            {podeGerenciar && (

                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Ações
                                                </th>

                                            )}

                                        </tr>

                                    </thead>


                                    <tbody className="divide-y divide-slate-100">

                                        {movimentacoesFiltradas.map(
                                            (
                                                movimentacao
                                            ) => {

                                                const receita =
                                                    movimentacao.tipo ===
                                                    "RECEITA";


                                                return (

                                                    <tr
                                                        key={
                                                            movimentacao.id
                                                        }
                                                        className="transition hover:bg-slate-50/70"
                                                    >

                                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">

                                                            {formatarData(
                                                                movimentacao.data
                                                            )}

                                                        </td>


                                                        <td className="px-4 py-4">

                                                            <span
                                                                className={
                                                                    receita
                                                                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                                        : "inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                                                                }
                                                            >

                                                                {receita
                                                                    ? "Receita"
                                                                    : "Despesa"}

                                                            </span>

                                                        </td>


                                                        <td className="px-4 py-4 text-sm font-medium text-slate-700">

                                                            {
                                                                movimentacao
                                                                    .categoria
                                                                    ?.nome ??
                                                                "-"
                                                            }

                                                        </td>


                                                        <td className="max-w-[320px] px-4 py-4 text-sm text-slate-600">

                                                            <div className="truncate">

                                                                {
                                                                    movimentacao
                                                                        .descricao ||
                                                                    "-"
                                                                }

                                                            </div>

                                                        </td>


                                                        <td
                                                            className={`whitespace-nowrap px-4 py-4 text-right text-sm font-bold ${receita
                                                                ? "text-emerald-600"
                                                                : "text-red-600"
                                                                }`}
                                                        >

                                                            {receita
                                                                ? "+"
                                                                : "-"}{" "}

                                                            {formatarMoeda(
                                                                Number(
                                                                    movimentacao.valor
                                                                )
                                                            )}

                                                        </td>


                                                        <td className="px-4 py-4 text-center">

                                                            {movimentacao.comprovante_path ? (

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirComprovante(
                                                                            movimentacao
                                                                        )
                                                                    }
                                                                    title="Visualizar comprovante"
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                                >

                                                                    <Eye
                                                                        size={16}
                                                                    />

                                                                </button>

                                                            ) : (

                                                                <span
                                                                    title="Sem comprovante"
                                                                    className="inline-flex h-9 w-9 items-center justify-center text-slate-300"
                                                                >

                                                                    <FileText
                                                                        size={16}
                                                                    />

                                                                </span>

                                                            )}

                                                        </td>


                                                        {podeGerenciar && (

                                                            <td className="px-4 py-4">

                                                                <div className="flex items-center justify-end gap-2">

                                                                    <button
                                                                        type="button"
                                                                        title="Editar movimentação"
                                                                        onClick={() =>
                                                                            editarMovimentacao(
                                                                                movimentacao
                                                                            )
                                                                        }
                                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                                    >

                                                                        <Pencil
                                                                            size={16}
                                                                        />

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        title="Excluir movimentação"
                                                                        onClick={() =>
                                                                            solicitarExclusao(
                                                                                movimentacao
                                                                            )
                                                                        }
                                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                                                    >

                                                                        <Trash2
                                                                            size={16}
                                                                        />

                                                                    </button>

                                                                </div>

                                                            </td>

                                                        )}

                                                    </tr>

                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {/* MOBILE */}

                            <div className="space-y-3 md:hidden">

                                {movimentacoesFiltradas.map(
                                    (
                                        movimentacao
                                    ) => {

                                        const receita =
                                            movimentacao.tipo ===
                                            "RECEITA";


                                        return (

                                            <article
                                                key={
                                                    movimentacao.id
                                                }
                                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                            >

                                                <div className="flex items-start justify-between gap-3">

                                                    <div>

                                                        <p className="text-xs font-medium text-slate-400">

                                                            {formatarData(
                                                                movimentacao.data
                                                            )}

                                                        </p>


                                                        <p className="mt-1 font-semibold text-slate-800">

                                                            {
                                                                movimentacao
                                                                    .categoria
                                                                    ?.nome ??
                                                                "Sem categoria"
                                                            }

                                                        </p>

                                                    </div>


                                                    <span
                                                        className={
                                                            receita
                                                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                                                : "rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                                                        }
                                                    >

                                                        {receita
                                                            ? "Receita"
                                                            : "Despesa"}

                                                    </span>

                                                </div>


                                                {movimentacao.descricao && (

                                                    <p className="mt-3 text-sm text-slate-500">

                                                        {
                                                            movimentacao
                                                                .descricao
                                                        }

                                                    </p>

                                                )}


                                                <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">

                                                    <p
                                                        className={`text-lg font-bold ${receita
                                                            ? "text-emerald-600"
                                                            : "text-red-600"
                                                            }`}
                                                    >

                                                        {receita
                                                            ? "+"
                                                            : "-"}{" "}

                                                        {formatarMoeda(
                                                            Number(
                                                                movimentacao.valor
                                                            )
                                                        )}

                                                    </p>


                                                    <div className="flex items-center gap-2">

                                                        {movimentacao.comprovante_path && (

                                                            <button
                                                                type="button"
                                                                title="Comprovante"
                                                                onClick={() =>
                                                                    abrirComprovante(
                                                                        movimentacao
                                                                    )
                                                                }
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                                            >

                                                                <Eye
                                                                    size={16}
                                                                />

                                                            </button>

                                                        )}


                                                        {podeGerenciar && (

                                                            <>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        editarMovimentacao(
                                                                            movimentacao
                                                                        )
                                                                    }
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600"
                                                                >

                                                                    <Pencil
                                                                        size={16}
                                                                    />

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        solicitarExclusao(
                                                                            movimentacao
                                                                        )
                                                                    }
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500"
                                                                >

                                                                    <Trash2
                                                                        size={16}
                                                                    />

                                                                </button>

                                                            </>

                                                        )}

                                                    </div>

                                                </div>

                                            </article>

                                        );
                                    }
                                )}

                            </div>

                        </>

                    )}

                </CardContent>

            </Card>


            <ConfirmDialog
                open={
                    dialogExcluirOpen
                }
                title="Excluir movimentação"
                description={`Deseja realmente excluir a movimentação "${movimentacaoParaExcluir?.descricao ||
                    "sem descrição"
                    }" no valor de ${movimentacaoParaExcluir
                        ? formatarMoeda(
                            Number(
                                movimentacaoParaExcluir.valor
                            )
                        )
                        : ""
                    }? Esta ação também removerá o comprovante associado.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                onConfirm={
                    confirmarExclusao
                }
                onCancel={() => {

                    setDialogExcluirOpen(
                        false
                    );

                    setMovimentacaoParaExcluir(
                        undefined
                    );

                }}
            />


            <Modal
                open={
                    modalEditarOpen
                }
                title="Editar movimentação"
                onClose={() => {

                    setModalEditarOpen(
                        false
                    );

                    setMovimentacaoParaEditar(
                        undefined
                    );

                }}
            >

                {movimentacaoParaEditar && (

                    <FinanceForm
                        movimentacao={
                            movimentacaoParaEditar
                        }
                        onSaved={async () => {

                            setModalEditarOpen(
                                false
                            );

                            setMovimentacaoParaEditar(
                                undefined
                            );

                            await carregar();

                            onChanged?.();

                        }}
                        onCancel={() => {

                            setModalEditarOpen(
                                false
                            );

                            setMovimentacaoParaEditar(
                                undefined
                            );

                        }}
                    />

                )}

            </Modal>

        </>

    );
}