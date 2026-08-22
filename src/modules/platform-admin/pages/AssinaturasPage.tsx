import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    CheckCircle2,
    CreditCard,
    Edit3,
    Gift,
    Loader2,
    Mail,
    MessageCircle,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Send,
    TriangleAlert,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import {
    AssinaturasService,
    type Assinatura,
    type AssinaturaInput,
} from "../services/AssinaturasService";

import {
    IgrejasService,
    type Igreja,
} from "../services/IgrejasService";

import { supabase } from "@/shared/lib/supabase/client";

type Plano = {
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
    ativo: boolean;
};

const FORMULARIO_INICIAL: AssinaturaInput = {
    igreja_id: "",
    plano_id: "",
    status: "ATIVA",
    inicio_em: new Date().toISOString().slice(0, 10),
    fim_em: "",
};

function formatarData(data: string | null) {
    if (!data) {
        return "Indefinido";
    }

    return new Date(data).toLocaleDateString(
        "pt-BR",
        {
            timeZone: "America/Sao_Paulo",
        }
    );
}

function obterClasseStatus(status: string) {

    if (status === "ATIVA") {
        return "bg-emerald-100 text-emerald-700";
    }

    if (status === "EXPIRADA") {
        return "bg-amber-100 text-amber-700";
    }

    return "bg-slate-100 text-slate-600";
}

export function AssinaturasPage() {

    const [assinaturas, setAssinaturas] =
        useState<Assinatura[]>([]);

    const [igrejas, setIgrejas] =
        useState<Igreja[]>([]);

    const [planos, setPlanos] =
        useState<Plano[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [busca, setBusca] =
        useState("");

    const [modalAberto, setModalAberto] =
        useState(false);

    const [assinaturaEditando, setAssinaturaEditando] =
        useState<Assinatura | null>(null);

    const [formulario, setFormulario] =
        useState<AssinaturaInput>(
            FORMULARIO_INICIAL
        );

    const [assinaturaAcao, setAssinaturaAcao] =
        useState<Assinatura | null>(null);

    const [menuAcoesAberto, setMenuAcoesAberto] =
        useState<string | null>(null);

    const [modalMensagemAberto, setModalMensagemAberto] =
        useState(false);

    const [tipoMensagem, setTipoMensagem] =
        useState<string>("");

    const [mensagem, setMensagem] =
        useState("");

    const [canalMensagem, setCanalMensagem] =
        useState<"WHATSAPP" | "EMAIL">("WHATSAPP");

    async function carregarDados() {

        try {

            setLoading(true);

            const [
                assinaturasDados,
                igrejasDados,
                planosDados,
            ] = await Promise.all([
                AssinaturasService.listar(),
                IgrejasService.listar(),
                carregarPlanos(),
            ]);

            setAssinaturas(assinaturasDados);
            setIgrejas(igrejasDados);
            setPlanos(planosDados);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar as assinaturas."
            );

        } finally {

            setLoading(false);

        }
    }

    async function carregarPlanos(): Promise<Plano[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("planos")
            .select(`
                id,
                nome,
                descricao,
                ordem,
                ativo
            `)
            .eq("ativo", true)
            .order("ordem", {
                ascending: true,
            });

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    useEffect(() => {
        carregarDados();
    }, []);

    const assinaturasFiltradas =
        useMemo(() => {

            const termo =
                busca
                    .trim()
                    .toLowerCase();

            if (!termo) {
                return assinaturas;
            }

            return assinaturas.filter(
                (assinatura) => {

                    const igreja =
                        assinatura.igreja?.nome
                        ??
                        igrejas.find(
                            (item) =>
                                item.id ===
                                assinatura.igreja_id
                        )?.nome
                        ??
                        "";

                    const plano =
                        assinatura.plano?.nome
                        ??
                        planos.find(
                            (item) =>
                                item.id ===
                                assinatura.plano_id
                        )?.nome
                        ??
                        "";

                    return [
                        igreja,
                        plano,
                        assinatura.status,
                    ]
                        .join(" ")
                        .toLowerCase()
                        .includes(termo);
                }
            );

        }, [
            assinaturas,
            igrejas,
            planos,
            busca,
        ]);

    function abrirNovaAssinatura() {

        setAssinaturaEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );

        setModalAberto(true);
    }

    function abrirEdicao(
        assinatura: Assinatura
    ) {

        setAssinaturaEditando(
            assinatura
        );

        setFormulario({
            igreja_id:
                assinatura.igreja_id,

            plano_id:
                assinatura.plano_id,

            status:
                assinatura.status,

            inicio_em:
                assinatura.inicio_em
                    .slice(0, 10),

            fim_em:
                assinatura.fim_em
                    ? assinatura.fim_em.slice(0, 10)
                    : "",
        });

        setModalAberto(true);
    }

    function fecharModal() {

        if (salvando) {
            return;
        }

        setModalAberto(false);

        setAssinaturaEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );
    }

    function gerarMensagem(
        assinatura: Assinatura,
        tipo: string
    ): string {

        const igreja =
            assinatura.igreja?.nome
            ?? "Igreja";

        const plano =
            assinatura.plano?.nome
            ?? "seu plano";

        const vencimento =
            formatarData(
                assinatura.fim_em
            );

        switch (tipo) {

            case "VENCIMENTO_PROXIMO":

                return `Olá, ${igreja}!

Passando para lembrar que a assinatura do plano ${plano} está próxima do vencimento.

Data de vencimento: ${vencimento}

Se precisar de ajuda com a renovação ou tiver alguma dúvida, estamos à disposição.

EBD Manager`;

            case "VENCIDA":

                return `Olá, ${igreja}!

Identificamos que a assinatura do plano ${plano} encontra-se vencida.

Gostaríamos de ajudá-los a regularizar a assinatura e continuar utilizando todos os recursos da plataforma.

Se precisar de ajuda, estamos à disposição.

EBD Manager`;

            case "RENOVACAO":

                return `Olá, ${igreja}!

Sua assinatura do plano ${plano} está chegando ao fim.

Estamos entrando em contato para facilitar sua renovação e garantir que sua igreja continue utilizando o EBD Manager sem interrupções.

Podemos ajudá-los com a renovação.

EBD Manager`;

            case "PROMOCAO":

                return `Olá, ${igreja}!

Temos uma novidade especial para vocês! 🎁

Preparamos uma promoção exclusiva para sua igreja na renovação do plano ${plano}.

Entre em contato conosco para conhecer as condições especiais.

EBD Manager`;

            case "AVISO":

                return `Olá, ${igreja}!

Temos um aviso importante relacionado à sua assinatura do EBD Manager.

Entre em contato conosco para obter mais informações.

EBD Manager`;

            default:

                return `Olá, ${igreja}!

Estamos entrando em contato sobre sua assinatura do plano ${plano} no EBD Manager.

Ficamos à disposição.

EBD Manager`;
        }
    }

    function abrirAcaoMensagem(
        assinatura: Assinatura,
        tipo: string
    ) {

        setMenuAcoesAberto(null);

        setAssinaturaAcao(
            assinatura
        );

        setTipoMensagem(
            tipo
        );

        setMensagem(
            gerarMensagem(
                assinatura,
                tipo
            )
        );

        setCanalMensagem(
            "WHATSAPP"
        );

        setModalMensagemAberto(
            true
        );
    }

    function fecharModalMensagem() {

        setModalMensagemAberto(false);

        setAssinaturaAcao(null);

        setTipoMensagem("");

        setMensagem("");
    }

    function obterTituloMensagem(
        tipo: string
    ): string {

        const titulos: Record<string, string> = {
            VENCIMENTO_PROXIMO:
                "Vencimento próximo",

            VENCIDA:
                "Assinatura vencida",

            RENOVACAO:
                "Renovação da assinatura",

            PROMOCAO:
                "Nova promoção exclusiva",

            AVISO:
                "Aviso importante",

            PERSONALIZADA:
                "Mensagem personalizada",
        };

        return (
            titulos[tipo]
            ?? "Mensagem"
        );
    }

    function enviarMensagem() {

        if (!assinaturaAcao) {
            return;
        }

        const igreja =
            assinaturaAcao.igreja
            ?? igrejas.find(
                (item) =>
                    item.id ===
                    assinaturaAcao.igreja_id
            );

        if (!igreja) {

            toast.error(
                "Não foi possível localizar os dados da igreja."
            );

            return;
        }

        if (!mensagem.trim()) {

            toast.error(
                "Digite uma mensagem."
            );

            return;
        }

        if (
            canalMensagem ===
            "WHATSAPP"
        ) {

            if (!igreja.telefone) {

                toast.error(
                    "Esta igreja não possui telefone cadastrado."
                );

                return;
            }

            const telefone =
                igreja.telefone.replace(
                    /\D/g,
                    ""
                );

            const url =
                `https://wa.me/55${telefone}?text=${encodeURIComponent(
                    mensagem
                )}`;

            window.open(
                url,
                "_blank"
            );

        } else {

            if (!igreja.email) {

                toast.error(
                    "Esta igreja não possui e-mail cadastrado."
                );

                return;
            }

            const url =
                `mailto:${igreja.email}?subject=${encodeURIComponent(
                    obterTituloMensagem(tipoMensagem)
                )}&body=${encodeURIComponent(
                    mensagem
                )}`;

            window.location.href = url;
        }

        fecharModalMensagem();
    }

    function atualizarCampo(
        campo: keyof AssinaturaInput,
        valor: string
    ) {

        setFormulario(
            (atual) => ({
                ...atual,
                [campo]: valor,
            })
        );
    }

    async function salvar() {

        if (!formulario.igreja_id) {

            toast.error(
                "Selecione uma igreja."
            );

            return;
        }

        if (!formulario.plano_id) {

            toast.error(
                "Selecione um plano."
            );

            return;
        }

        if (!formulario.inicio_em) {

            toast.error(
                "Informe a data de início."
            );

            return;
        }

        if (
            formulario.fim_em &&
            formulario.fim_em <
            formulario.inicio_em
        ) {

            toast.error(
                "A data de término não pode ser anterior à data de início."
            );

            return;
        }

        try {

            setSalvando(true);

            if (assinaturaEditando) {

                await AssinaturasService.atualizar(
                    assinaturaEditando.id,
                    formulario
                );

                toast.success(
                    "Assinatura atualizada com sucesso."
                );

            } else {

                await AssinaturasService.criar(
                    formulario
                );

                toast.success(
                    "Assinatura criada com sucesso."
                );
            }

            fecharModal();

            await carregarDados();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível salvar a assinatura."
            );

        } finally {

            setSalvando(false);

        }
    }

    return (
        <div className="space-y-6">

            <PageHeader
                title="Assinaturas"
                subtitle="Gerencie os planos contratados pelas igrejas da plataforma."
                icon={CreditCard}
            />

            <Card>

                <CardContent className="p-6">

                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div className="relative w-full md:max-w-md">

                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={busca}
                                onChange={(event) =>
                                    setBusca(
                                        event.target.value
                                    )
                                }
                                placeholder="Buscar igreja, plano ou status..."
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                        </div>

                        <button
                            type="button"
                            onClick={abrirNovaAssinatura}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Nova assinatura
                        </button>

                    </div>

                    {loading ? (

                        <div className="flex items-center justify-center py-16">

                            <Loader2
                                className="animate-spin text-blue-600"
                                size={28}
                            />

                        </div>

                    ) : assinaturasFiltradas.length === 0 ? (

                        <div className="py-16 text-center">

                            <CreditCard
                                size={40}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            <p className="font-medium text-slate-700">
                                Nenhuma assinatura encontrada.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Cadastre uma assinatura para começar.
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-left">

                                <thead>

                                    <tr className="border-b border-slate-200 text-sm text-slate-500">

                                        <th className="px-3 py-3 font-medium">
                                            Igreja
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Plano
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Status
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Início
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Término
                                        </th>

                                        <th className="px-3 py-3 text-right font-medium">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {assinaturasFiltradas.map(
                                        (assinatura) => {

                                            const igreja =
                                                assinatura.igreja?.nome
                                                ??
                                                igrejas.find(
                                                    (item) =>
                                                        item.id ===
                                                        assinatura.igreja_id
                                                )?.nome
                                                ??
                                                "Igreja não encontrada";

                                            const plano =
                                                assinatura.plano?.nome
                                                ??
                                                planos.find(
                                                    (item) =>
                                                        item.id ===
                                                        assinatura.plano_id
                                                )?.nome
                                                ??
                                                "Plano não encontrado";

                                            return (

                                                <tr
                                                    key={assinatura.id}
                                                    className="border-b border-slate-100 last:border-0"
                                                >

                                                    <td className="px-3 py-4">

                                                        <div className="font-medium text-slate-800">
                                                            {igreja}
                                                        </div>

                                                    </td>

                                                    <td className="px-3 py-4">

                                                        <span className="font-medium text-slate-700">
                                                            {plano}
                                                        </span>

                                                    </td>

                                                    <td className="px-3 py-4">

                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${obterClasseStatus(
                                                                assinatura.status
                                                            )}`}
                                                        >

                                                            {assinatura.status === "ATIVA" && (
                                                                <CheckCircle2 size={13} />
                                                            )}

                                                            {assinatura.status}

                                                        </span>

                                                    </td>

                                                    <td className="px-3 py-4 text-sm text-slate-600">
                                                        {formatarData(
                                                            assinatura.inicio_em
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-4 text-sm text-slate-600">
                                                        {formatarData(
                                                            assinatura.fim_em
                                                        )}
                                                    </td>

                                                    <td className="relative px-3 py-4 text-right">

                                                        <div className="inline-flex items-center gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirEdicao(
                                                                        assinatura
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                                                            >
                                                                <Edit3 size={16} />
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setMenuAcoesAberto(
                                                                        menuAcoesAberto === assinatura.id
                                                                            ? null
                                                                            : assinatura.id
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                                                title="Ações"
                                                            >
                                                                <MoreVertical size={18} />
                                                            </button>

                                                        </div>

                                                        {menuAcoesAberto === assinatura.id && (

                                                            <div className="absolute right-3 top-14 z-30 w-64 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-xl">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirAcaoMensagem(
                                                                            assinatura,
                                                                            "VENCIMENTO_PROXIMO"
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <Bell size={17} />
                                                                    Vencimento próximo
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirAcaoMensagem(
                                                                            assinatura,
                                                                            "VENCIDA"
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <TriangleAlert size={17} />
                                                                    Assinatura vencida
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirAcaoMensagem(
                                                                            assinatura,
                                                                            "RENOVACAO"
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <RefreshCw size={17} />
                                                                    Renovação
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirAcaoMensagem(
                                                                            assinatura,
                                                                            "PROMOCAO"
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <Gift size={17} />
                                                                    Nova promoção exclusiva
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirAcaoMensagem(
                                                                            assinatura,
                                                                            "AVISO"
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <Mail size={17} />
                                                                    Aviso importante
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirAcaoMensagem(
                                                                            assinatura,
                                                                            "PERSONALIZADA"
                                                                        )
                                                                    }
                                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <MessageCircle size={17} />
                                                                    Mensagem personalizada
                                                                </button>

                                                            </div>

                                                        )}

                                                    </td>

                                                </tr>

                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </CardContent>

            </Card>

            {modalAberto && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-slate-900">
                                    {assinaturaEditando
                                        ? "Editar assinatura"
                                        : "Nova assinatura"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Defina a igreja, o plano e o período da assinatura.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="space-y-5 px-6 py-6">

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Igreja
                                </label>

                                <select
                                    value={formulario.igreja_id}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "igreja_id",
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="">
                                        Selecione uma igreja
                                    </option>

                                    {igrejas
                                        .filter(
                                            (igreja) =>
                                                igreja.ativa
                                        )
                                        .map(
                                            (igreja) => (

                                                <option
                                                    key={igreja.id}
                                                    value={igreja.id}
                                                >
                                                    {igreja.nome}
                                                </option>

                                            )
                                        )}

                                </select>

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Plano
                                </label>

                                <select
                                    value={formulario.plano_id}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "plano_id",
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="">
                                        Selecione um plano
                                    </option>

                                    {planos.map(
                                        (plano) => (

                                            <option
                                                key={plano.id}
                                                value={plano.id}
                                            >
                                                {plano.nome}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            <div className="grid gap-4 md:grid-cols-2">

                                <div>

                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Início
                                    </label>

                                    <input
                                        type="date"
                                        value={formulario.inicio_em}
                                        onChange={(event) =>
                                            atualizarCampo(
                                                "inicio_em",
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                <div>

                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Término
                                    </label>

                                    <input
                                        type="date"
                                        value={formulario.fim_em}
                                        min={formulario.inicio_em}
                                        onChange={(event) =>
                                            atualizarCampo(
                                                "fim_em",
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Status
                                </label>

                                <select
                                    value={formulario.status}
                                    onChange={(event) =>
                                        atualizarCampo(
                                            "status",
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="ATIVA">
                                        Ativa
                                    </option>

                                    <option value="INATIVA">
                                        Inativa
                                    </option>

                                    <option value="EXPIRADA">
                                        Expirada
                                    </option>

                                </select>

                            </div>

                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={salvar}
                                disabled={salvando}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >

                                {salvando && (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                )}

                                Salvar assinatura

                            </button>

                        </div>

                    </div>

                </div>

                      )}

            {modalMensagemAberto && assinaturaAcao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">

                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-slate-900">
                                    {obterTituloMensagem(tipoMensagem)}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enviar mensagem para{" "}
                                    <span className="font-medium text-slate-700">
                                        {assinaturaAcao.igreja?.nome
                                            ?? igrejas.find(
                                                (igreja) =>
                                                    igreja.id ===
                                                    assinaturaAcao.igreja_id
                                            )?.nome
                                            ?? "Igreja"}
                                    </span>
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={fecharModalMensagem}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="space-y-5 px-6 py-6">

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Canal de envio
                                </label>

                                <div className="grid grid-cols-2 gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCanalMensagem("WHATSAPP")
                                        }
                                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                            canalMensagem === "WHATSAPP"
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <MessageCircle size={18} />
                                        WhatsApp
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCanalMensagem("EMAIL")
                                        }
                                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                            canalMensagem === "EMAIL"
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Mail size={18} />
                                        E-mail
                                    </button>

                                </div>

                            </div>

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Mensagem
                                </label>

                                <textarea
                                    value={mensagem}
                                    onChange={(event) =>
                                        setMensagem(
                                            event.target.value
                                        )
                                    }
                                    rows={10}
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Digite a mensagem..."
                                />

                                <p className="mt-1.5 text-xs text-slate-400">
                                    Você pode editar a mensagem antes de enviar.
                                </p>

                            </div>

                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={fecharModalMensagem}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={enviarMensagem}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <Send size={17} />
                                Enviar mensagem
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
