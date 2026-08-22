import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    CheckCircle2,
    Edit3,
    Loader2,
    Plus,
    Search,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import {
    IgrejasService,
    type Igreja,
    type IgrejaInput,
} from "../services/IgrejasService";

const FORMULARIO_INICIAL: IgrejaInput = {
    nome: "",
    sigla: "",
    cnpj: "",
    telefone: "",
    email: "",
    ativa: true,
};

function formatarData(data: string) {
    return new Date(data).toLocaleDateString(
        "pt-BR",
        {
            timeZone: "America/Sao_Paulo",
        }
    );
}

function formatarCnpj(valor: string): string {
    const numeros = valor.replace(/\D/g, "").slice(0, 14);

    return numeros
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarTelefone(valor: string): string {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 10) {
        return numeros
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
    );
}

export function IgrejasPage() {

    const [igrejas, setIgrejas] =
        useState<Igreja[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [busca, setBusca] =
        useState("");

    const [modalAberto, setModalAberto] =
        useState(false);

    const [igrejaEditando, setIgrejaEditando] =
        useState<Igreja | null>(null);

    const [formulario, setFormulario] =
        useState<IgrejaInput>(
            FORMULARIO_INICIAL
        );

    const [rascunhoCarregado, setRascunhoCarregado] =
        useState(false);

    async function carregarIgrejas() {

        try {

            setLoading(true);

            const dados =
                await IgrejasService.listar();

            setIgrejas(dados);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar as igrejas."
            );

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {
        carregarIgrejas();
    }, []);

    useEffect(() => {
        try {
            const rascunhoSalvo =
                localStorage.getItem(
                    "ebd-manager-igrejas-rascunho"
                );

            if (!rascunhoSalvo) {
                setRascunhoCarregado(true);
                return;
            }

            const rascunho = JSON.parse(
                rascunhoSalvo
            );

            if (
                rascunho &&
                rascunho.formulario
            ) {
                setFormulario(
                    rascunho.formulario
                );

                if (rascunho.igrejaEditandoId) {
                    setIgrejaEditando({
                        id: rascunho.igrejaEditandoId,
                    } as Igreja);
                } else {
                    setIgrejaEditando(null);
                }

                setModalAberto(true);
            }

        } catch (error) {

            console.error(
                "Erro ao recuperar rascunho da igreja:",
                error
            );

            localStorage.removeItem(
                "ebd-manager-igrejas-rascunho"
            );

        } finally {

            setRascunhoCarregado(true);

        }
    }, []);

    useEffect(() => {
        if (!rascunhoCarregado || !modalAberto) {
            return;
        }

        const existeConteudo =
            formulario.nome.trim() ||
            formulario.sigla.trim() ||
            formulario.cnpj.trim() ||
            formulario.telefone.trim() ||
            formulario.email.trim();

        if (!existeConteudo) {
            return;
        }

        localStorage.setItem(
            "ebd-manager-igrejas-rascunho",
            JSON.stringify({
                formulario,
                igrejaEditandoId: igrejaEditando?.id ?? null,
            })
        );
    }, [
        formulario,
        igrejaEditando,
        modalAberto,
        rascunhoCarregado,
    ]);

    const igrejasFiltradas =
        useMemo(() => {

            const termo =
                busca
                    .trim()
                    .toLowerCase();

            if (!termo) {
                return igrejas;
            }

            return igrejas.filter((igreja) =>
                [
                    igreja.nome,
                    igreja.sigla,
                    igreja.cnpj,
                    igreja.email,
                ]
                    .filter(Boolean)
                    .some((valor) =>
                        valor!
                            .toLowerCase()
                            .includes(termo)
                    )
            );

        }, [igrejas, busca]);

    function abrirNovaIgreja() {

        setIgrejaEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );

        setModalAberto(true);
    }

    function abrirEdicao(igreja: Igreja) {

        setIgrejaEditando(igreja);

        setFormulario({
            nome: igreja.nome,
            sigla: igreja.sigla ?? "",
            cnpj: igreja.cnpj ?? "",
            telefone: igreja.telefone ?? "",
            email: igreja.email ?? "",
            ativa: igreja.ativa,
        });

        setModalAberto(true);
    }

    function fecharModal() {

        if (salvando) {
            return;
        }

        localStorage.removeItem(
            "ebd-manager-igrejas-rascunho"
        );

        setModalAberto(false);
        setIgrejaEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );
    }

    function atualizarCampo(
        campo: keyof IgrejaInput,
        valor: string | boolean
    ) {
        let valorFormatado = valor;

        if (typeof valor === "string") {
            if (campo === "cnpj") {
                valorFormatado = formatarCnpj(valor);
            }

            if (campo === "telefone") {
                valorFormatado = formatarTelefone(valor);
            }

            if (campo === "email") {
                valorFormatado = valor.toLowerCase();
            }
        }

        setFormulario((atual) => ({
            ...atual,
            [campo]: valorFormatado,
        }));
    }

    async function salvar() {

        if (
            formulario.email.trim() &&
            !emailValido(formulario.email)
        ) {
            toast.error(
                "Digite um e-mail válido."
            );
            return;
        }

        if (!formulario.nome.trim()) {

            toast.error(
                "Informe o nome da igreja."
            );

            return;
        }

        if (
            formulario.email.trim() &&
            !emailValido(formulario.email)
        ) {

            toast.error(
                "Informe um e-mail válido."
            );

            return;
        }

        try {

            setSalvando(true);

            if (igrejaEditando) {

                await IgrejasService.atualizar(
                    igrejaEditando.id,
                    {
                        ...formulario,
                        nome: formulario.nome.trim(),
                    }
                );

                toast.success(
                    "Igreja atualizada com sucesso."
                );

            } else {

                await IgrejasService.criar({
                    ...formulario,
                    nome: formulario.nome.trim(),
                });

                toast.success(
                    "Igreja criada com sucesso."
                );
            }

            localStorage.removeItem(
                "ebd-manager-igrejas-rascunho"
            );

            fecharModal();

            await carregarIgrejas();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível salvar a igreja."
            );

        } finally {

            setSalvando(false);

        }
    }

    async function alterarStatus(
        igreja: Igreja
    ) {

        const novoStatus =
            !igreja.ativa;

        try {

            await IgrejasService.alterarStatus(
                igreja.id,
                novoStatus
            );

            setIgrejas((atuais) =>
                atuais.map((item) =>
                    item.id === igreja.id
                        ? {
                            ...item,
                            ativa: novoStatus,
                        }
                        : item
                )
            );

            toast.success(
                novoStatus
                    ? "Igreja ativada."
                    : "Igreja desativada."
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível alterar o status."
            );
        }
    }

    return (
        <div className="space-y-6">

            <PageHeader
                title="Igrejas"
                subtitle="Gerencie as igrejas cadastradas na plataforma."
                icon={Building2}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="relative w-full sm:max-w-md">

                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        value={busca}
                        onChange={(event) =>
                            setBusca(event.target.value)
                        }
                        placeholder="Buscar igreja..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

                <button
                    type="button"
                    onClick={abrirNovaIgreja}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Nova igreja
                </button>

            </div>

            <Card>

                <CardContent className="p-0">

                    {loading ? (

                        <div className="flex min-h-64 items-center justify-center">

                            <div className="flex items-center gap-2 text-sm text-slate-500">

                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />

                                Carregando igrejas...

                            </div>

                        </div>

                    ) : igrejasFiltradas.length === 0 ? (

                        <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                            <div className="rounded-full bg-slate-100 p-4 text-slate-400">

                                <Building2 size={28} />

                            </div>

                            <h3 className="mt-4 font-semibold text-slate-800">
                                {busca
                                    ? "Nenhuma igreja encontrada"
                                    : "Nenhuma igreja cadastrada"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                {busca
                                    ? "Tente alterar os termos da busca."
                                    : "Cadastre a primeira igreja da plataforma."}
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[800px]">

                                <thead>

                                    <tr className="border-b border-slate-200 bg-slate-50">

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Igreja
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            CNPJ
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            E-mail
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Cadastro
                                        </th>

                                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {igrejasFiltradas.map(
                                        (igreja) => (

                                            <tr
                                                key={igreja.id}
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">

                                                            <Building2
                                                                size={18}
                                                            />

                                                        </div>

                                                        <div>

                                                            <p className="font-semibold text-slate-800">
                                                                {igreja.nome}
                                                            </p>

                                                            {igreja.sigla && (
                                                                <p className="text-xs text-slate-500">
                                                                    {igreja.sigla}
                                                                </p>
                                                            )}

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {igreja.cnpj || "—"}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {igreja.email || "—"}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {formatarData(
                                                        igreja.created_at
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            alterarStatus(
                                                                igreja
                                                            )
                                                        }
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${igreja.ativa
                                                            ? "bg-green-50 text-green-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >

                                                        {igreja.ativa
                                                            ? (
                                                                <CheckCircle2 size={14} />
                                                            )
                                                            : (
                                                                <XCircle size={14} />
                                                            )}

                                                        {igreja.ativa
                                                            ? "Ativa"
                                                            : "Inativa"}

                                                    </button>

                                                </td>

                                                <td className="px-6 py-4 text-right">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirEdicao(
                                                                igreja
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                                    >

                                                        <Edit3 size={16} />

                                                        Editar

                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </CardContent>

            </Card>

            <div className="text-sm text-slate-500">
                {igrejasFiltradas.length}{" "}
                {igrejasFiltradas.length === 1
                    ? "igreja"
                    : "igrejas"}
            </div>

            {modalAberto && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    {igrejaEditando
                                        ? "Editar igreja"
                                        : "Nova igreja"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Informe os dados administrativos da igreja.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <XCircle size={20} />
                            </button>

                        </div>

                        <div className="grid gap-4 p-6 sm:grid-cols-2">

                            <div className="sm:col-span-2">

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Nome *
                                </label>

                                <input
                                    value={formulario.nome}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "nome",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Nome da igreja"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Sigla
                                </label>

                                <input
                                    value={formulario.sigla}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "sigla",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ex.: ADVE"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    CNPJ
                                </label>

                                <input
                                    value={formulario.cnpj}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "cnpj",
                                            formatarCnpj(event.target.value)
                                        )
                                    }
                                    placeholder="00.000.000/0000-00"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Telefone
                                </label>

                                <input
                                    value={formulario.telefone}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "telefone",
                                            formatarTelefone(event.target.value)
                                        )
                                    }
                                    placeholder="(11) 99999-9999"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    E-mail
                                </label>

                                <input
                                    type="email"
                                    value={formulario.email}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "email",
                                            event.target.value
                                        )
                                    }
                                    placeholder="contato@igreja.com"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            <label className="flex items-center gap-3 sm:col-span-2">

                                <input
                                    type="checkbox"
                                    checked={formulario.ativa}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "ativa",
                                            event.target.checked
                                        )
                                    }
                                    className="h-4 w-4 rounded border-slate-300"
                                />

                                <span className="text-sm font-medium text-slate-700">
                                    Igreja ativa
                                </span>

                            </label>

                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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

                                {igrejaEditando
                                    ? "Salvar alterações"
                                    : "Criar igreja"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
