import { useEffect, useState } from "react";

import {
    CheckCircle2,
    Edit3,
    Layers3,
    Loader2,
    Plus,
    XCircle,
    Tag,
    Clock3,
    Save,
} from "lucide-react";

import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";

import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import {
    PlanosService,
    type Plano,
    type PlanoInput,
    type PlanoLimitesInput,
    type OfertaPlano,
    type OfertaPlanoInput,
} from "../services/PlanosService";

import {
    RecursosService,
    type Recurso,
} from "../services/RecursosService";


// ============================================================
// FORMULÁRIOS
// ============================================================

const FORMULARIO_INICIAL: PlanoInput = {
    nome: "",
    descricao: "",
    ordem: 1,
    ativo: true,
};


const LIMITES_INICIAIS: PlanoLimitesInput = {
    max_pessoas: 0,
    max_classes: 0,
    max_professores: 0,
    max_administradores: 0,
    max_secretarios: 0,
    max_pastores: 0,
    max_superintendentes: 0,
    max_trimestres_ativos: 0,
    max_trimestres: null,
};


const OFERTA_INICIAL: Omit<
    OfertaPlanoInput,
    "plano_id"
> = {
    preco_recorrente: 0,
    gratuito: false,
    duracao_gratuita_dias: 0,
    periodo_recorrente: "MENSAL",
    ativa: true,
};


// ============================================================
// HELPERS
// ============================================================

function formatarLimite(
    valor: number | null
): string {

    if (valor === -1) {
        return "Ilimitado";
    }

    return String(valor ?? 0);
}


function formatarPreco(
    valor: number
): string {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        }
    );
}


function formatarPeriodo(
    periodo: OfertaPlano["periodo_recorrente"]
): string {

    switch (periodo) {

        case "MENSAL":
            return "mês";

        case "TRIMESTRAL":
            return "trimestre";

        case "SEMESTRAL":
            return "semestre";

        case "ANUAL":
            return "ano";

        default:
            return periodo;
    }
}


// ============================================================
// COMPONENTE
// ============================================================

export function PlanosPage() {

    // ========================================================
    // PLANOS
    // ========================================================

    const [planos, setPlanos] =
        useState<Plano[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);


    // ========================================================
    // OFERTAS
    // ========================================================

    const [ofertas, setOfertas] =
        useState<OfertaPlano[]>([]);

    const [carregandoOfertas, setCarregandoOfertas] =
        useState(true);

    const [ofertaEditando, setOfertaEditando] =
        useState<OfertaPlano | null>(null);

    const [ofertaModalAberto, setOfertaModalAberto] =
        useState(false);

    const [salvandoOferta, setSalvandoOferta] =
        useState(false);

    const [formularioOferta, setFormularioOferta] =
        useState<
            Omit<OfertaPlanoInput, "plano_id">
        >(
            OFERTA_INICIAL
        );


    // ========================================================
    // MODAL PLANO
    // ========================================================

    const [modalAberto, setModalAberto] =
        useState(false);

    const [planoEditando, setPlanoEditando] =
        useState<Plano | null>(null);

    const [formulario, setFormulario] =
        useState<PlanoInput>(
            FORMULARIO_INICIAL
        );

    const [limites, setLimites] =
        useState<PlanoLimitesInput>(
            LIMITES_INICIAIS
        );

    const [recursosSelecionados, setRecursosSelecionados] =
        useState<string[]>([]);

    const [recursos, setRecursos] =
        useState<Recurso[]>([]);

    const [carregandoRecursos, setCarregandoRecursos] =
        useState(false);

    const [carregandoLimites, setCarregandoLimites] =
        useState(false);


    // ========================================================
    // CARREGAR PLANOS
    // ========================================================

    async function carregarPlanos() {

        try {

            setLoading(true);

            const dados =
                await PlanosService.listar();

            setPlanos(dados);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar os planos."
            );

        } finally {

            setLoading(false);
        }
    }


    // ========================================================
    // CARREGAR OFERTAS
    // ========================================================

    async function carregarOfertas() {

        try {

            setCarregandoOfertas(true);

            const dados =
                await PlanosService.listarOfertas();

            setOfertas(dados);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar as ofertas comerciais."
            );

        } finally {

            setCarregandoOfertas(false);
        }
    }


    // ========================================================
    // CARREGAR RECURSOS
    // ========================================================

    async function carregarRecursos() {

        try {

            setCarregandoRecursos(true);

            const dados =
                await RecursosService.listar();

            setRecursos(dados);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar os recursos."
            );

        } finally {

            setCarregandoRecursos(false);
        }
    }


    // ========================================================
    // INIT
    // ========================================================

    useEffect(() => {

        carregarPlanos();
        carregarOfertas();
        carregarRecursos();

    }, []);


    // ========================================================
    // NOVO PLANO
    // ========================================================

    function abrirNovoPlano() {

        setPlanoEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );

        setLimites(
            LIMITES_INICIAIS
        );

        setRecursosSelecionados([]);

        setModalAberto(true);
    }


    // ========================================================
    // EDITAR PLANO
    // ========================================================

    async function abrirEdicao(
        plano: Plano
    ) {

        setPlanoEditando(plano);

        setFormulario({
            nome: plano.nome,
            descricao: plano.descricao ?? "",
            ordem: plano.ordem,
            ativo: plano.ativo,
        });

        setModalAberto(true);

        try {

            setRecursosSelecionados([]);

            const recursosDoPlano =
                await PlanosService.buscarRecursosDoPlano(
                    plano.id
                );

            setRecursosSelecionados(
                recursosDoPlano
            );

            setCarregandoLimites(true);

            const dados =
                await PlanosService.buscarLimites(
                    plano.id
                );

            if (dados) {

                setLimites({

                    max_pessoas:
                        dados.max_pessoas,

                    max_classes:
                        dados.max_classes,

                    max_professores:
                        dados.max_professores,

                    max_administradores:
                        dados.max_administradores,

                    max_secretarios:
                        dados.max_secretarios,

                    max_pastores:
                        dados.max_pastores,

                    max_superintendentes:
                        dados.max_superintendentes,

                    max_trimestres_ativos:
                        dados.max_trimestres_ativos,

                    max_trimestres:
                        dados.max_trimestres,

                });

            } else {

                setLimites(
                    LIMITES_INICIAIS
                );
            }

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar os limites do plano."
            );

        } finally {

            setCarregandoLimites(false);
        }
    }


    // ========================================================
    // FECHAR MODAL PLANO
    // ========================================================

    function fecharModal() {

        if (salvando) {
            return;
        }

        setModalAberto(false);

        setPlanoEditando(null);

        setFormulario(
            FORMULARIO_INICIAL
        );

        setLimites(
            LIMITES_INICIAIS
        );

        setRecursosSelecionados([]);
    }


    // ========================================================
    // CAMPOS DO PLANO
    // ========================================================

    function atualizarCampo(
        campo: keyof PlanoInput,
        valor: string | number | boolean
    ) {

        setFormulario((atual) => ({
            ...atual,
            [campo]: valor,
        }));
    }


    // ========================================================
    // RECURSOS
    // ========================================================

    function alternarRecurso(
        recursoId: string
    ) {

        setRecursosSelecionados((atuais) => {

            if (atuais.includes(recursoId)) {

                return atuais.filter(
                    (id) =>
                        id !== recursoId
                );
            }

            return [
                ...atuais,
                recursoId,
            ];
        });
    }


    // ========================================================
    // LIMITES
    // ========================================================

    function atualizarLimite(
        campo: keyof PlanoLimitesInput,
        valor: string
    ) {

        if (valor === "") {

            setLimites((atual) => ({
                ...atual,
                [campo]: 0,
            }));

            return;
        }

        const numero =
            Number(valor);

        setLimites((atual) => ({
            ...atual,
            [campo]:
                Number.isNaN(numero)
                    ? 0
                    : numero,
        }));
    }


    // ========================================================
    // SALVAR PLANO
    // ========================================================

    async function salvar() {

        if (!formulario.nome.trim()) {

            toast.error(
                "Informe o nome do plano."
            );

            return;
        }

        if (
            formulario.ordem === undefined ||
            formulario.ordem < 1
        ) {

            toast.error(
                "A ordem deve ser maior que zero."
            );

            return;
        }

        try {

            setSalvando(true);

            if (planoEditando) {

                await PlanosService.atualizar(
                    planoEditando.id,
                    formulario,
                    limites,
                    recursosSelecionados
                );

                toast.success(
                    "Plano atualizado com sucesso."
                );

            } else {

                await PlanosService.criar(
                    formulario,
                    limites,
                    recursosSelecionados
                );

                toast.success(
                    "Plano criado com sucesso."
                );
            }

            fecharModal();

            await carregarPlanos();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível salvar o plano."
            );

        } finally {

            setSalvando(false);
        }
    }


    // ========================================================
    // STATUS PLANO
    // ========================================================

    async function alterarStatus(
        plano: Plano
    ) {

        try {

            await PlanosService.alterarStatus(
                plano.id,
                !plano.ativo
            );

            toast.success(
                plano.ativo
                    ? "Plano desativado."
                    : "Plano ativado."
            );

            await carregarPlanos();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível alterar o status."
            );
        }
    }


    // ========================================================
    // BUSCAR OFERTA ATIVA
    // ========================================================

    function obterOfertaAtiva(
        planoId: string
    ) {

        return ofertas.find(
            (oferta) =>
                oferta.plano_id === planoId &&
                oferta.ativa
        ) ?? null;
    }


    // ========================================================
    // ABRIR EDITOR DE OFERTA
    // ========================================================

    function abrirEditorOferta(
        plano: Plano
    ) {

        const oferta =
            obterOfertaAtiva(
                plano.id
            );

        setOfertaEditando(
            oferta
        );

        if (oferta) {

            setFormularioOferta({

                preco_recorrente:
                    oferta.preco_recorrente,

                gratuito:
                    oferta.gratuito,

                duracao_gratuita_dias:
                    oferta.duracao_gratuita_dias,

                periodo_recorrente:
                    oferta.periodo_recorrente,

                ativa:
                    true,

            });

        } else {

            setFormularioOferta({
                ...OFERTA_INICIAL,
            });
        }

        setOfertaModalAberto(true);
    }


    // ========================================================
    // FECHAR EDITOR DE OFERTA
    // ========================================================

    function fecharOfertaModal() {

        if (salvandoOferta) {
            return;
        }

        setOfertaModalAberto(false);

        setOfertaEditando(null);

        setFormularioOferta({
            ...OFERTA_INICIAL,
        });
    }


    // ========================================================
    // SALVAR NOVA OFERTA
    // ========================================================

    async function salvarOferta() {

        if (!ofertaEditando) {

            toast.error(
                "Oferta inválida."
            );

            return;
        }

        if (
            formularioOferta.preco_recorrente < 0
        ) {

            toast.error(
                "O preço não pode ser negativo."
            );

            return;
        }

        if (
            formularioOferta.gratuito &&
            formularioOferta.duracao_gratuita_dias <= 0
        ) {

            toast.error(
                "Informe a quantidade de dias do teste gratuito."
            );

            return;
        }

        try {

            setSalvandoOferta(true);

            /*
             * REGRA FUNDAMENTAL:
             *
             * Nunca alteramos a oferta contratada.
             *
             * Criamos uma nova oferta.
             * Depois desativamos a oferta anterior.
             */

            const novaOferta =
                await PlanosService.criarOferta({

                    plano_id:
                        ofertaEditando.plano_id,

                    preco_recorrente:
                        formularioOferta.preco_recorrente,

                    gratuito:
                        formularioOferta.gratuito,

                    duracao_gratuita_dias:
                        formularioOferta.gratuito
                            ? formularioOferta.duracao_gratuita_dias
                            : 0,

                    periodo_recorrente:
                        formularioOferta.periodo_recorrente,

                    ativa:
                        true,

                });

            await PlanosService.desativarOferta(
                ofertaEditando.id
            );

            toast.success(
                "Nova oferta publicada com sucesso."
            );

            console.log(
                "NOVA OFERTA:",
                novaOferta
            );

            fecharOfertaModal();

            await carregarOfertas();

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível publicar a nova oferta."
            );

        } finally {

            setSalvandoOferta(false);
        }
    }


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="space-y-6">

            <PageHeader
                title="Planos"
                subtitle="Gerencie os planos e as ofertas comerciais disponíveis para as igrejas."
                icon={Layers3}
            />


            {/* ================================================= */}
            {/* PLANOS */}
            {/* ================================================= */}

            <Card>

                <CardContent className="p-6">

                    <div className="mb-6 flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-slate-900">
                                Planos cadastrados
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Configure os planos, limites e recursos.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={abrirNovoPlano}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Novo plano
                        </button>

                    </div>


                    {loading ? (

                        <div className="flex items-center justify-center py-12">

                            <Loader2
                                size={28}
                                className="animate-spin text-blue-600"
                            />

                        </div>

                    ) : planos.length === 0 ? (

                        <div className="py-12 text-center">

                            <Layers3
                                size={40}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm text-slate-500">
                                Nenhum plano cadastrado.
                            </p>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1150px] text-sm">

                                <thead>

                                    <tr className="border-b border-slate-200 text-left">

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Plano
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Oferta atual
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Teste
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Pessoas
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Classes
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Professores
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {planos.map(
                                        (plano) => {

                                            const oferta =
                                                obterOfertaAtiva(
                                                    plano.id
                                                );

                                            return (

                                                <tr
                                                    key={plano.id}
                                                    className="border-b border-slate-100 last:border-0"
                                                >

                                                    <td className="px-4 py-4">

                                                        <div className="font-semibold text-slate-900">
                                                            {plano.nome}
                                                        </div>

                                                        {plano.descricao && (

                                                            <div className="mt-1 max-w-md text-xs text-slate-500">
                                                                {plano.descricao}
                                                            </div>

                                                        )}

                                                    </td>


                                                    <td className="px-4 py-4">

                                                        {carregandoOfertas ? (

                                                            <Loader2
                                                                size={16}
                                                                className="animate-spin text-slate-400"
                                                            />

                                                        ) : oferta ? (

                                                            <div>

                                                                <div className="font-semibold text-slate-900">
                                                                    {formatarPreco(
                                                                        oferta.preco_recorrente
                                                                    )}
                                                                    <span className="ml-1 text-xs font-normal text-slate-500">
                                                                        /
                                                                        {formatarPeriodo(
                                                                            oferta.periodo_recorrente
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {oferta.gratuito && (

                                                                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">

                                                                        <Tag size={11} />

                                                                        {oferta.duracao_gratuita_dias}
                                                                        {" "}
                                                                        dias grátis

                                                                    </div>

                                                                )}

                                                            </div>

                                                        ) : (

                                                            <span className="text-xs text-slate-400">
                                                                Sem oferta
                                                            </span>

                                                        )}

                                                    </td>


                                                    <td className="px-4 py-4">

                                                        {oferta?.gratuito ? (

                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">

                                                                <Clock3 size={13} />

                                                                {oferta.duracao_gratuita_dias}
                                                                {" "}
                                                                dias

                                                            </span>

                                                        ) : (

                                                            <span className="text-xs text-slate-400">
                                                                —
                                                            </span>

                                                        )}

                                                    </td>


                                                    <td className="px-4 py-4 text-slate-600">
                                                        {formatarLimite(
                                                            plano.limites?.max_pessoas ?? null
                                                        )}
                                                    </td>


                                                    <td className="px-4 py-4 text-slate-600">
                                                        {formatarLimite(
                                                            plano.limites?.max_classes ?? null
                                                        )}
                                                    </td>


                                                    <td className="px-4 py-4 text-slate-600">
                                                        {formatarLimite(
                                                            plano.limites?.max_professores ?? null
                                                        )}
                                                    </td>


                                                    <td className="px-4 py-4">

                                                        {plano.ativo ? (

                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">

                                                                <CheckCircle2 size={14} />

                                                                Ativo

                                                            </span>

                                                        ) : (

                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">

                                                                <XCircle size={14} />

                                                                Inativo

                                                            </span>

                                                        )}

                                                    </td>


                                                    <td className="px-4 py-4">

                                                        <div className="flex justify-end gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirEditorOferta(
                                                                        plano
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                            >
                                                                <Tag size={15} />
                                                                Oferta
                                                            </button>


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirEdicao(
                                                                        plano
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                <Edit3 size={15} />
                                                                Editar
                                                            </button>


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    alterarStatus(
                                                                        plano
                                                                    )
                                                                }
                                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                                                                    plano.ativo
                                                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                                                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                                }`}
                                                            >
                                                                {plano.ativo
                                                                    ? "Desativar"
                                                                    : "Ativar"}
                                                            </button>

                                                        </div>

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


            {/* ================================================= */}
            {/* MODAL PLANO */}
            {/* ================================================= */}

            {modalAberto && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">


                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-slate-900">

                                    {planoEditando
                                        ? "Editar plano"
                                        : "Novo plano"}

                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Configure os dados e limites do plano.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <XCircle size={22} />
                            </button>

                        </div>


                        <div className="space-y-6 p-6">


                            {/* DADOS */}

                            <div>

                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Dados do plano
                                </h3>


                                <div className="grid gap-4 md:grid-cols-2">


                                    <div className="md:col-span-2">

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Nome
                                        </label>

                                        <input
                                            type="text"
                                            value={formulario.nome}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    "nome",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>


                                    <div className="md:col-span-2">

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Descrição
                                        </label>

                                        <textarea
                                            value={formulario.descricao}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    "descricao",
                                                    e.target.value
                                                )
                                            }
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>


                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Ordem
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={formulario.ordem}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    "ordem",
                                                    Number(
                                                        e.target.value
                                                    )
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>


                                    <div className="flex items-end">

                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">

                                            <input
                                                type="checkbox"
                                                checked={
                                                    formulario.ativo
                                                }
                                                onChange={(e) =>
                                                    atualizarCampo(
                                                        "ativo",
                                                        e.target.checked
                                                    )
                                                }
                                                className="h-4 w-4"
                                            />

                                            <span className="text-sm font-medium text-slate-700">
                                                Plano ativo
                                            </span>

                                        </label>

                                    </div>

                                </div>

                            </div>


                            {/* LIMITES */}

                            <div>

                                <div className="mb-4">

                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Limites do plano
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Use -1 para representar ilimitado.
                                    </p>

                                </div>


                                {carregandoLimites ? (

                                    <div className="flex items-center justify-center py-8">

                                        <Loader2
                                            size={24}
                                            className="animate-spin text-blue-600"
                                        />

                                    </div>

                                ) : (

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                        {[
                                            [
                                                "max_pessoas",
                                                "Máximo de pessoas",
                                            ],
                                            [
                                                "max_classes",
                                                "Máximo de classes",
                                            ],
                                            [
                                                "max_professores",
                                                "Máximo de professores",
                                            ],
                                            [
                                                "max_administradores",
                                                "Máximo de administradores",
                                            ],
                                            [
                                                "max_secretarios",
                                                "Máximo de secretários",
                                            ],
                                            [
                                                "max_pastores",
                                                "Máximo de pastores",
                                            ],
                                            [
                                                "max_superintendentes",
                                                "Máximo de superintendentes",
                                            ],
                                            [
                                                "max_trimestres_ativos",
                                                "Trimestres ativos",
                                            ],
                                            [
                                                "max_trimestres",
                                                "Máximo de trimestres",
                                            ],
                                        ].map(
                                            ([campo, label]) => (

                                                <div key={campo}>

                                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                        {label}
                                                    </label>

                                                    <input
                                                        type="number"
                                                        value={
                                                            limites[
                                                                campo as keyof PlanoLimitesInput
                                                            ] ?? ""
                                                        }
                                                        onChange={(e) =>
                                                            atualizarLimite(
                                                                campo as keyof PlanoLimitesInput,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    />

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>


                            {/* RECURSOS */}

                            <div>

                                <div className="mb-4">

                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Recursos do plano
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Selecione os recursos disponíveis para este plano.
                                    </p>

                                </div>


                                {carregandoRecursos ? (

                                    <div className="flex items-center justify-center py-8">

                                        <Loader2
                                            size={24}
                                            className="animate-spin text-blue-600"
                                        />

                                    </div>

                                ) : recursos.length === 0 ? (

                                    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">

                                        <p className="text-sm text-slate-500">
                                            Nenhum recurso cadastrado.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                                        {recursos.map(
                                            (recurso) => {

                                                const selecionado =
                                                    recursosSelecionados.includes(
                                                        recurso.id
                                                    );

                                                return (

                                                    <label
                                                        key={recurso.id}
                                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                                                            selecionado
                                                                ? "border-blue-300 bg-blue-50"
                                                                : "border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                    >

                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selecionado
                                                            }
                                                            onChange={() =>
                                                                alternarRecurso(
                                                                    recurso.id
                                                                )
                                                            }
                                                            disabled={
                                                                !recurso.ativo
                                                            }
                                                            className="mt-0.5 h-4 w-4"
                                                        />


                                                        <div className="min-w-0">

                                                            <div className="flex items-center gap-2">

                                                                <span className="text-sm font-semibold text-slate-800">
                                                                    {recurso.nome}
                                                                </span>

                                                                {!recurso.ativo && (

                                                                    <span className="text-xs font-medium text-slate-400">
                                                                        Inativo
                                                                    </span>

                                                                )}

                                                            </div>


                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {recurso.descricao ||
                                                                    "Sem descrição."}
                                                            </p>


                                                            <p className="mt-2 text-[11px] font-mono text-slate-400">
                                                                {recurso.codigo}
                                                            </p>

                                                        </div>

                                                    </label>

                                                );
                                            }
                                        )}

                                    </div>

                                )}

                            </div>

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
                                disabled={
                                    salvando ||
                                    carregandoLimites
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {salvando && (

                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />

                                )}

                                {salvando
                                    ? "Salvando..."
                                    : "Salvar"}

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ================================================= */}
            {/* MODAL OFERTA */}
            {/* ================================================= */}

            {ofertaModalAberto && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">


                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                            <div>

                                <div className="flex items-center gap-2">

                                    <Tag
                                        size={20}
                                        className="text-emerald-600"
                                    />

                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Nova oferta comercial
                                    </h2>

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    A alteração não modifica contratos existentes.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    fecharOfertaModal
                                }
                                disabled={
                                    salvandoOferta
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <XCircle size={22} />
                            </button>

                        </div>


                        <div className="space-y-5 p-6">


                            {/* PREÇO */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Preço recorrente
                                </label>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                                        R$
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formularioOferta.preco_recorrente
                                        }
                                        onChange={(e) =>
                                            setFormularioOferta(
                                                (atual) => ({
                                                    ...atual,
                                                    preco_recorrente:
                                                        Number(
                                                            e.target.value
                                                        ),
                                                })
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />

                                </div>

                            </div>


                            {/* PERIODICIDADE */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Periodicidade
                                </label>

                                <select
                                    value={
                                        formularioOferta.periodo_recorrente
                                    }
                                    onChange={(e) =>
                                        setFormularioOferta(
                                            (atual) => ({
                                                ...atual,
                                                periodo_recorrente:
                                                    e.target.value as OfertaPlano["periodo_recorrente"],
                                            })
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                >

                                    <option value="MENSAL">
                                        Mensal
                                    </option>

                                    <option value="TRIMESTRAL">
                                        Trimestral
                                    </option>

                                    <option value="SEMESTRAL">
                                        Semestral
                                    </option>

                                    <option value="ANUAL">
                                        Anual
                                    </option>

                                </select>

                            </div>


                            {/* TESTE GRATUITO */}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                                <label className="flex cursor-pointer items-center gap-3">

                                    <input
                                        type="checkbox"
                                        checked={
                                            formularioOferta.gratuito
                                        }
                                        onChange={(e) =>
                                            setFormularioOferta(
                                                (atual) => ({
                                                    ...atual,
                                                    gratuito:
                                                        e.target.checked,
                                                    duracao_gratuita_dias:
                                                        e.target.checked
                                                            ? (
                                                                atual.duracao_gratuita_dias ||
                                                                5
                                                            )
                                                            : 0,
                                                })
                                            )
                                        }
                                        className="h-4 w-4"
                                    />

                                    <div>

                                        <p className="text-sm font-semibold text-slate-800">
                                            Oferecer período gratuito
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            A igreja poderá utilizar o plano gratuitamente antes da cobrança.
                                        </p>

                                    </div>

                                </label>


                                {formularioOferta.gratuito && (

                                    <div className="mt-4">

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Dias gratuitos
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                formularioOferta.duracao_gratuita_dias
                                            }
                                            onChange={(e) =>
                                                setFormularioOferta(
                                                    (atual) => ({
                                                        ...atual,
                                                        duracao_gratuita_dias:
                                                            Number(
                                                                e.target.value
                                                            ),
                                                    })
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        />

                                    </div>

                                )}

                            </div>


                            {/* AVISO */}

                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                                <p className="text-sm font-semibold text-amber-800">
                                    Atenção
                                </p>

                                <p className="mt-1 text-xs leading-5 text-amber-700">
                                    Ao publicar esta alteração, será criada uma nova oferta comercial. Igrejas que já contrataram o plano continuarão com o preço e as condições originais.
                                </p>

                            </div>

                        </div>


                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={
                                    fecharOfertaModal
                                }
                                disabled={
                                    salvandoOferta
                                }
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>


                            <button
                                type="button"
                                onClick={
                                    salvarOferta
                                }
                                disabled={
                                    salvandoOferta
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {salvandoOferta ? (

                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />

                                ) : (

                                    <Save size={17} />

                                )}

                                {salvandoOferta
                                    ? "Publicando..."
                                    : "Publicar nova oferta"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}