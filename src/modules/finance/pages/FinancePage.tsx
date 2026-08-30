import {
    useEffect,
    useState,
} from "react";

import {
    ArrowDownRight,
    ArrowUpRight,
    Plus,
    Wallet,
} from "lucide-react";

import { toast } from "sonner";

import {
    PageHeader,
} from "@/shared/components/ui/PageHeader";

import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import {
    LoadingSpinner,
} from "@/shared/components/ui/LoadingSpinner";

import {
    Modal,
} from "@/shared/components/ui/Modal";

import {
    FinanceService,
} from "../services/FinanceService";

import {
    FinanceForm,
} from "../components/FinanceForm";

import {
    FinanceHistory,
} from "../components/FinanceHistory";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
} from "@/shared/auth/permissions";


type ResumoFinanceiro = {
    receitas: number;
    despesas: number;
    saldo: number;
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


export function FinancePage() {

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
        resumo,
        setResumo,
    ] =
        useState<ResumoFinanceiro>({
            receitas: 0,
            despesas: 0,
            saldo: 0,
        });


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        historicoAtualizacao,
        setHistoricoAtualizacao,
    ] =
        useState(0);


    const [
        modalNovaOpen,
        setModalNovaOpen,
    ] =
        useState(false);


    async function carregarResumo() {

        try {

            setLoading(true);

            const resultado =
                await FinanceService.obterResumo();

            setResumo(
                resultado
            );

            setHistoricoAtualizacao(
                (valor) =>
                    valor + 1
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Erro ao carregar o resumo financeiro."
            );

        } finally {

            setLoading(false);
        }
    }


    useEffect(() => {

        void carregarResumo();

    }, []);


    function abrirNovaMovimentacao() {

        if (!podeGerenciar) {

            toast.error(
                "Você não tem permissão para registrar movimentações."
            );

            return;
        }

        setModalNovaOpen(
            true
        );
    }


    async function movimentacaoSalva() {

        setModalNovaOpen(
            false
        );

        await carregarResumo();
    }


    return (

        <div className="space-y-6">

            {/* CABEÇALHO */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <PageHeader
                    title="Financeiro"
                    subtitle="Acompanhe receitas, despesas e movimentações da EBD"
                    icon={Wallet}
                />


                {podeGerenciar && (

                    <button
                        type="button"
                        onClick={
                            abrirNovaMovimentacao
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >

                        <Plus size={18} />

                        Nova movimentação

                    </button>

                )}

            </div>


            {/* RESUMO */}

            {loading ? (

                <LoadingSpinner
                    text="Carregando financeiro..."
                />

            ) : (

                <div className="grid gap-4 md:grid-cols-3">


                    {/* SALDO */}

                    <Card className="overflow-hidden">

                        <CardContent className="p-5">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Saldo atual
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                        {formatarMoeda(
                                            resumo.saldo
                                        )}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Resultado entre receitas e despesas
                                    </p>

                                </div>


                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                    <Wallet size={21} />

                                </div>

                            </div>

                        </CardContent>

                    </Card>


                    {/* RECEITAS */}

                    <Card className="overflow-hidden">

                        <CardContent className="p-5">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Receitas
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                                        {formatarMoeda(
                                            resumo.receitas
                                        )}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Total de entradas registradas
                                    </p>

                                </div>


                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                                    <ArrowUpRight size={21} />

                                </div>

                            </div>

                        </CardContent>

                    </Card>


                    {/* DESPESAS */}

                    <Card className="overflow-hidden">

                        <CardContent className="p-5">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Despesas
                                    </p>

                                    <p className="mt-2 text-2xl font-bold tracking-tight text-red-600 sm:text-3xl">
                                        {formatarMoeda(
                                            resumo.despesas
                                        )}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Total de saídas registradas
                                    </p>

                                </div>


                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">

                                    <ArrowDownRight size={21} />

                                </div>

                            </div>

                        </CardContent>

                    </Card>

                </div>

            )}


            {/* HISTÓRICO */}

            <FinanceHistory
                atualizar={
                    historicoAtualizacao
                }
                onChanged={
                    carregarResumo
                }
            />


            {/* MODAL NOVA MOVIMENTAÇÃO */}

            <Modal
                open={
                    modalNovaOpen
                }
                title="Registrar movimentação"
                onClose={() =>
                    setModalNovaOpen(
                        false
                    )
                }
            >

                <FinanceForm
                    onSaved={
                        movimentacaoSalva
                    }
                />

            </Modal>

        </div>
    );
}