import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Eye,
    FileText,
    Filter,
    Pencil,
    Receipt,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/Card";

import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { Modal } from "@/shared/components/ui/Modal";

import { FinanceService } from "../services/FinanceService";
import { FinanceForm } from "./FinanceForm";

import type {
    CategoriaFinanceira,
    MovimentacaoFinanceira,
    TipoMovimentacao,
} from "../types/MovimentacaoFinanceira";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { temPermissao } from "@/shared/auth/permissions";

type Props = {
    atualizar?: number;
    onChanged?: () => void;
};

function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(valor);
}

function formatarData(data: string) {
    if (!data) return "-";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}

export function FinanceHistory({
    atualizar = 0,
    onChanged,
}: Props) {

    const { pessoa } = useAuth();

    const podeGerenciar =
        pessoa?.perfil !== "PENDENTE" &&
        temPermissao(
            pessoa?.perfil,
            "GERENCIAR_FINANCEIRO"
        );

    const [movimentacoes, setMovimentacoes] =
        useState<MovimentacaoFinanceira[]>([]);

    const [categorias, setCategorias] =
        useState<CategoriaFinanceira[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [dataInicial, setDataInicial] =
        useState("");

    const [dataFinal, setDataFinal] =
        useState("");

    const [tipo, setTipo] =
        useState<"TODOS" | TipoMovimentacao>("TODOS");

    const [categoriaId, setCategoriaId] =
        useState("TODAS");

    const [movimentacaoParaExcluir, setMovimentacaoParaExcluir] =
        useState<MovimentacaoFinanceira>();

    const [movimentacaoParaEditar, setMovimentacaoParaEditar] =
        useState<MovimentacaoFinanceira>();

    const [modalEditarOpen, setModalEditarOpen] =
        useState(false);

    const [dialogExcluirOpen, setDialogExcluirOpen] =
        useState(false);

    async function carregar() {

        try {

            setLoading(true);

            const [movs, cats] =
                await Promise.all([
                    FinanceService.listarMovimentacoes(),
                    FinanceService.listarCategorias(),
                ]);

            setMovimentacoes(movs);
            setCategorias(cats);

        } catch (error) {

            console.error(error);

            toast.error(
                "Erro ao carregar movimentações."
            );

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {
        carregar();
    }, [atualizar]);

    const movimentacoesFiltradas =
        useMemo(() => {

            return movimentacoes.filter(
                (movimentacao) => {

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
                        movimentacao.data < dataInicial
                    ) {
                        return false;
                    }

                    if (
                        dataFinal &&
                        movimentacao.data > dataFinal
                    ) {
                        return false;
                    }

                    return true;
                }
            );

        }, [
            movimentacoes,
            tipo,
            categoriaId,
            dataInicial,
            dataFinal,
        ]);

    async function abrirComprovante(
        movimentacao: MovimentacaoFinanceira
    ) {

        if (!movimentacao.comprovante_path) {

            toast.error(
                "Esta movimentação não possui comprovante."
            );

            return;
        }

        try {

            const url =
                await FinanceService.gerarUrlComprovante(
                    movimentacao.comprovante_path
                );

            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível abrir o comprovante."
            );
        }
    }

    function solicitarExclusao(
        movimentacao: MovimentacaoFinanceira
    ) {

        if (!podeGerenciar) {

            toast.error(
                "Você não tem permissão para excluir movimentações."
            );

            return;
        }

        setMovimentacaoParaExcluir(
            movimentacao
        );

        setDialogExcluirOpen(true);
    }

    async function confirmarExclusao() {

        if (!podeGerenciar) {

            toast.error(
                "Você não tem permissão para excluir movimentações."
            );

            return;
        }

        if (!movimentacaoParaExcluir?.id) {
            return;
        }

        try {

            await FinanceService.excluirMovimentacao(
                movimentacaoParaExcluir.id
            );

            toast.success(
                "Movimentação excluída."
            );

            setMovimentacaoParaExcluir(
                undefined
            );

            setDialogExcluirOpen(false);

            await carregar();
            onChanged?.();

        } catch (error) {

            console.error(error);

            toast.error(
                "Erro ao excluir movimentação."
            );
        }
    }

    function editarMovimentacao(
        movimentacao: MovimentacaoFinanceira
    ) {

        if (!podeGerenciar) {

            toast.error(
                "Você não tem permissão para editar movimentações."
            );

            return;
        }

        setMovimentacaoParaEditar(
            movimentacao
        );

        setModalEditarOpen(true);
    }

    return (
        <>
            <Card>

                <CardHeader>

                    <CardTitle className="flex items-center gap-2">

                        <Receipt size={20} />

                        Movimentações financeiras

                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-6">

                    {/* FILTROS */}

                    <div className="rounded-xl border bg-slate-50 p-4">

                        <div className="mb-4 flex items-center gap-2 font-semibold">

                            <Filter size={18} />

                            Filtros

                        </div>

                        <div className="grid gap-4 md:grid-cols-4">

                            {/* DATA INICIAL */}

                            <div>

                                <label className="mb-1 block text-sm font-medium">
                                    Data inicial
                                </label>

                                <div className="relative">

                                    <CalendarDays
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="date"
                                        value={dataInicial}
                                        onChange={(e) =>
                                            setDataInicial(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border bg-white p-3 pl-10"
                                    />

                                </div>

                            </div>


                            {/* DATA FINAL */}

                            <div>

                                <label className="mb-1 block text-sm font-medium">
                                    Data final
                                </label>

                                <div className="relative">

                                    <CalendarDays
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="date"
                                        value={dataFinal}
                                        onChange={(e) =>
                                            setDataFinal(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border bg-white p-3 pl-10"
                                    />

                                </div>

                            </div>


                            {/* TIPO */}

                            <div>

                                <label className="mb-1 block text-sm font-medium">
                                    Tipo
                                </label>

                                <select
                                    value={tipo}
                                    onChange={(e) =>
                                        setTipo(
                                            e.target.value as
                                            | "TODOS"
                                            | TipoMovimentacao
                                        )
                                    }
                                    className="w-full rounded-lg border bg-white p-3"
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

                            <div>

                                <label className="mb-1 block text-sm font-medium">
                                    Categoria
                                </label>

                                <select
                                    value={categoriaId}
                                    onChange={(e) =>
                                        setCategoriaId(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border bg-white p-3"
                                >

                                    <option value="TODAS">
                                        Todas
                                    </option>

                                    {categorias.map(
                                        (categoria) => (
                                            <option
                                                key={categoria.id}
                                                value={categoria.id}
                                            >
                                                {categoria.nome}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                    </div>


                    {/* TABELA */}

                    {loading ? (

                        <LoadingSpinner
                            text="Carregando movimentações..."
                        />

                    ) : movimentacoesFiltradas.length === 0 ? (

                        <div className="rounded-xl border border-dashed p-10 text-center">

                            <Receipt
                                size={32}
                                className="mx-auto mb-3 text-slate-400"
                            />

                            <p className="font-medium">
                                Nenhuma movimentação encontrada.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Tente alterar os filtros.
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto rounded-xl border">

                            <table className="w-full min-w-[950px]">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                            Data
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                            Tipo
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                            Categoria
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                            Descrição
                                        </th>

                                        <th className="px-4 py-3 text-right text-sm font-semibold">
                                            Valor
                                        </th>

                                        <th className="px-4 py-3 text-center text-sm font-semibold">
                                            Comprovante
                                        </th>

                                        {podeGerenciar && (
                                            <th className="px-4 py-3 text-center text-sm font-semibold">
                                                Ações
                                            </th>
                                        )}

                                    </tr>

                                </thead>

                                <tbody>

                                    {movimentacoesFiltradas.map(
                                        (movimentacao) => {

                                            const receita =
                                                movimentacao.tipo ===
                                                "RECEITA";

                                            return (
                                                <tr
                                                    key={movimentacao.id}
                                                    className="border-t hover:bg-slate-50"
                                                >

                                                    <td className="px-4 py-4">
                                                        {formatarData(
                                                            movimentacao.data
                                                        )}
                                                    </td>


                                                    <td className="px-4 py-4">

                                                        <span
                                                            className={
                                                                receita
                                                                    ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                                                    : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                                                            }
                                                        >
                                                            {receita
                                                                ? "Receita"
                                                                : "Despesa"}
                                                        </span>

                                                    </td>


                                                    <td className="px-4 py-4">

                                                        {movimentacao
                                                            .categoria
                                                            ?.nome ?? "-"}

                                                    </td>


                                                    <td className="max-w-[280px] px-4 py-4">

                                                        <div className="truncate">

                                                            {movimentacao
                                                                .descricao ||
                                                                "-"}

                                                        </div>

                                                    </td>


                                                    <td
                                                        className={`px-4 py-4 text-right font-semibold ${receita
                                                            ? "text-green-600"
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
                                                                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-100"
                                                            >

                                                                <Eye size={16} />

                                                                Ver

                                                            </button>

                                                        ) : (

                                                            <span className="inline-flex items-center gap-1 text-sm text-slate-400">

                                                                <FileText
                                                                    size={15}
                                                                />

                                                                Sem comprovante

                                                            </span>

                                                        )}

                                                    </td>


                                                    {podeGerenciar && (

                                                        <td className="px-4 py-4 text-center">

                                                            <div className="flex items-center justify-center gap-2">

                                                                <button
                                                                    type="button"
                                                                    title="Editar movimentação"
                                                                    onClick={() =>
                                                                        editarMovimentacao(
                                                                            movimentacao
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center justify-center rounded-lg border p-2 text-yellow-600 hover:bg-yellow-50"
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
                                                                    className="inline-flex items-center justify-center rounded-lg border p-2 text-red-600 hover:bg-red-50"
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

                    )}

                    <div className="text-sm text-slate-500">

                        Exibindo{" "}

                        <strong>
                            {movimentacoesFiltradas.length}
                        </strong>{" "}

                        movimentação(ões).

                    </div>

                </CardContent>

            </Card>


            <ConfirmDialog
                open={dialogExcluirOpen}
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
                onConfirm={confirmarExclusao}
                onCancel={() => {

                    setDialogExcluirOpen(false);

                    setMovimentacaoParaExcluir(
                        undefined
                    );

                }}
            />

            <Modal
                open={modalEditarOpen}
                title="Editar movimentação"
                onClose={() => {
                    setModalEditarOpen(false);
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

                            setModalEditarOpen(false);

                            setMovimentacaoParaEditar(
                                undefined
                            );

                            await carregar();

                            onChanged?.();
                        }}
                        onCancel={() => {

                            setModalEditarOpen(false);

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