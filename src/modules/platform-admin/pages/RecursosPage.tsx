import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Edit3,
    Layers3,
    Loader2,
    Plus,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import {
    RecursosService,
    type Recurso,
    type RecursoInput,
} from "../services/RecursosService";

const FORMULARIO_INICIAL: RecursoInput = {
    codigo: "",
    nome: "",
    descricao: "",
    ativo: true,
};

export function RecursosPage() {

    const [recursos, setRecursos] =
        useState<Recurso[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [modalAberto, setModalAberto] =
        useState(false);

    const [recursoEditando, setRecursoEditando] =
        useState<Recurso | null>(null);

    const [formulario, setFormulario] =
        useState<RecursoInput>(
            FORMULARIO_INICIAL
        );

    async function carregarRecursos() {

        try {

            setLoading(true);

            const dados =
                await RecursosService.listar();

            setRecursos(dados);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar os recursos."
            );

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {
        carregarRecursos();
    }, []);

    function abrirNovoRecurso() {

        setRecursoEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );

        setModalAberto(true);
    }

    function abrirEdicao(
        recurso: Recurso
    ) {

        setRecursoEditando(recurso);

        setFormulario({
            codigo: recurso.codigo,
            nome: recurso.nome,
            descricao:
                recurso.descricao ?? "",
            ativo: recurso.ativo,
        });

        setModalAberto(true);
    }

    function fecharModal() {

        if (salvando) {
            return;
        }

        setModalAberto(false);

        setRecursoEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );
    }

    async function salvar() {

        if (!formulario.codigo.trim()) {

            toast.error(
                "Informe o código do recurso."
            );

            return;
        }

        if (!formulario.nome.trim()) {

            toast.error(
                "Informe o nome do recurso."
            );

            return;
        }

        try {

            setSalvando(true);

            const dados: RecursoInput = {
                codigo:
                    formulario.codigo
                        .trim()
                        .toUpperCase(),

                nome:
                    formulario.nome.trim(),

                descricao:
                    formulario.descricao.trim(),

                ativo:
                    formulario.ativo,
            };

            if (recursoEditando) {

                await RecursosService.atualizar(
                    recursoEditando.id,
                    dados
                );

                toast.success(
                    "Recurso atualizado com sucesso."
                );

            } else {

                await RecursosService.criar(
                    dados
                );

                toast.success(
                    "Recurso criado com sucesso."
                );
            }

            fecharModal();

            await carregarRecursos();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível salvar o recurso."
            );

        } finally {

            setSalvando(false);

        }
    }

    async function alterarStatus(
        recurso: Recurso
    ) {

        try {

            await RecursosService.alterarStatus(
                recurso.id,
                !recurso.ativo
            );

            toast.success(
                recurso.ativo
                    ? "Recurso desativado."
                    : "Recurso ativado."
            );

            await carregarRecursos();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível alterar o status."
            );
        }
    }

    return (
        <div className="space-y-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <PageHeader
                    title="Recursos"
                    subtitle="Gerencie os recursos disponíveis na plataforma e utilizados pelos planos."
                />

                <button
                    type="button"
                    onClick={abrirNovoRecurso}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus size={17} />
                    Novo recurso
                </button>

            </div>

            <Card>

                <CardContent className="p-0">

                    {loading ? (

                        <div className="flex items-center justify-center py-16">

                            <Loader2
                                size={30}
                                className="animate-spin text-blue-600"
                            />

                        </div>

                    ) : recursos.length === 0 ? (

                        <div className="py-16 text-center">

                            <Layers3
                                size={42}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm text-slate-500">
                                Nenhum recurso cadastrado.
                            </p>

                            <button
                                type="button"
                                onClick={abrirNovoRecurso}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus size={16} />
                                Criar primeiro recurso
                            </button>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[900px] text-sm">

                                <thead>

                                    <tr className="border-b border-slate-200 text-left">

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Recurso
                                        </th>

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Código
                                        </th>

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Descrição
                                        </th>

                                        <th className="px-5 py-3 font-semibold text-slate-600">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-right font-semibold text-slate-600">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {recursos.map((recurso) => (

                                        <tr
                                            key={recurso.id}
                                            className="border-b border-slate-100 last:border-0"
                                        >

                                            <td className="px-5 py-4">

                                                <div className="font-semibold text-slate-900">
                                                    {recurso.nome}
                                                </div>

                                            </td>

                                            <td className="px-5 py-4">

                                                <code className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                    {recurso.codigo}
                                                </code>

                                            </td>

                                            <td className="max-w-md px-5 py-4 text-slate-500">

                                                {recurso.descricao || "—"}

                                            </td>

                                            <td className="px-5 py-4">

                                                {recurso.ativo ? (

                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">

                                                        <CheckCircle2
                                                            size={14}
                                                        />

                                                        Ativo

                                                    </span>

                                                ) : (

                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">

                                                        <XCircle
                                                            size={14}
                                                        />

                                                        Inativo

                                                    </span>

                                                )}

                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirEdicao(
                                                                recurso
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >

                                                        <Edit3
                                                            size={15}
                                                        />

                                                        Editar

                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            alterarStatus(
                                                                recurso
                                                            )
                                                        }
                                                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${recurso.ativo
                                                            ? "border-red-200 text-red-600 hover:bg-red-50"
                                                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                            }`}
                                                    >

                                                        {recurso.ativo
                                                            ? "Desativar"
                                                            : "Ativar"}

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </CardContent>

            </Card>

            {modalAberto && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-slate-900">

                                    {recursoEditando
                                        ? "Editar recurso"
                                        : "Novo recurso"}

                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Configure os dados do recurso da plataforma.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <XCircle size={20} />
                            </button>

                        </div>

                        <div className="space-y-5 px-6 py-6">

                            <div className="grid gap-5 md:grid-cols-2">

                                <div>

                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Código
                                    </label>

                                    <input
                                        type="text"
                                        value={formulario.codigo}
                                        onChange={(e) =>
                                            setFormulario(
                                                (atual) => ({
                                                    ...atual,
                                                    codigo:
                                                        e.target.value
                                                            .toUpperCase(),
                                                })
                                            )
                                        }
                                        disabled={
                                            salvando
                                        }
                                        placeholder="EXEMPLO_RECURSO"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Identificador técnico único do recurso.
                                    </p>

                                </div>

                                <div>

                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Nome
                                    </label>

                                    <input
                                        type="text"
                                        value={formulario.nome}
                                        onChange={(e) =>
                                            setFormulario(
                                                (atual) => ({
                                                    ...atual,
                                                    nome:
                                                        e.target.value,
                                                })
                                            )
                                        }
                                        disabled={
                                            salvando
                                        }
                                        placeholder="Nome do recurso"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Descrição
                                </label>

                                <textarea
                                    value={
                                        formulario.descricao
                                    }
                                    onChange={(e) =>
                                        setFormulario(
                                            (atual) => ({
                                                ...atual,
                                                descricao:
                                                    e.target.value,
                                            })
                                        )
                                    }
                                    disabled={salvando}
                                    rows={4}
                                    placeholder="Descreva o que este recurso disponibiliza."
                                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">

                                <input
                                    type="checkbox"
                                    checked={
                                        formulario.ativo
                                    }
                                    onChange={(e) =>
                                        setFormulario(
                                            (atual) => ({
                                                ...atual,
                                                ativo:
                                                    e.target.checked,
                                            })
                                        )
                                    }
                                    disabled={salvando}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />

                                <div>

                                    <div className="text-sm font-semibold text-slate-700">
                                        Recurso ativo
                                    </div>

                                    <div className="text-xs text-slate-400">
                                        Recursos inativos não ficam disponíveis para novos vínculos.
                                    </div>

                                </div>

                            </label>

                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={salvar}
                                disabled={salvando}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {salvando && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {salvando
                                    ? "Salvando..."
                                    : "Salvar recurso"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
