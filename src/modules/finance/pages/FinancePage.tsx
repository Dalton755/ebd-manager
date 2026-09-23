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

        <div className="space-y-4 sm:space-y-6">

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

                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">


                    {/* SALDO */}

                    <Card className="col-span-2 overflow-hidden bg-gradient-to-br from-white to-blue-50/60 p-0 md:col-span-1">

                        <CardContent className="p-4 sm:p-5">

                            <div className="flex items-start justify-between gap-4">

                                <div className="min-w-0">

                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                        Saldo atual
                                    </p>

                                    <p className="mt-2 whitespace-nowrap text-[1.8rem] font-black leading-none tracking-tight text-slate-950 sm:text-3xl">
                                        {formatarMoeda(
                                            resumo.saldo
                                        )}
                                    </p>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        Resultado entre entradas e saídas
                                    </p>

                                </div>


                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700 sm:h-11 sm:w-11">

                                    <Wallet size={20} />

                                </div>

                            </div>

                        </CardContent>

                    </Card>


                    {/* RECEITAS */}

                    <Card className="overflow-hidden p-0">

                        <CardContent className="p-3.5 sm:p-5">

                            <div className="flex items-center justify-between gap-2">

                                <p className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-sm sm:font-semibold sm:normal-case sm:tracking-normal">
                                    Receitas
                                </p>

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-10 sm:w-10 sm:rounded-xl">

                                    <ArrowUpRight size={18} />

                                </div>

                            </div>


                            <p className="mt-3 whitespace-nowrap text-[clamp(1.15rem,5.4vw,1.7rem)] font-black leading-none tracking-tight text-emerald-600 sm:text-3xl">
                                {formatarMoeda(
                                    resumo.receitas
                                )}
                            </p>

                            <p className="mt-2 text-[11px] font-medium text-slate-400 sm:text-xs">
                                Entradas
                            </p>

                        </CardContent>

                    </Card>


                    {/* DESPESAS */}

                    <Card className="overflow-hidden p-0">

                        <CardContent className="p-3.5 sm:p-5">

                            <div className="flex items-center justify-between gap-2">

                                <p className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 sm:text-sm sm:font-semibold sm:normal-case sm:tracking-normal">
                                    Despesas
                                </p>

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 sm:h-10 sm:w-10 sm:rounded-xl">

                                    <ArrowDownRight size={18} />

                                </div>

                            </div>


                            <p className="mt-3 whitespace-nowrap text-[clamp(1.15rem,5.4vw,1.7rem)] font-black leading-none tracking-tight text-rose-600 sm:text-3xl">
                                {formatarMoeda(
                                    resumo.despesas
                                )}
                            </p>

                            <p className="mt-2 text-[11px] font-medium text-slate-400 sm:text-xs">
                                Saídas
                            </p>

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