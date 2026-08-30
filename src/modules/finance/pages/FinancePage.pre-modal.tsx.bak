import { useEffect, useState } from "react";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/Card";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

import { FinanceService } from "../services/FinanceService";

import { FinanceForm } from "../components/FinanceForm";
import { FinanceHistory } from "../components/FinanceHistory";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { temPermissao } from "@/shared/auth/permissions";

type ResumoFinanceiro = {
    receitas: number;
    despesas: number;
    saldo: number;
};

function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(valor);
}

export function FinancePage() {

    const { pessoa } = useAuth();

    const podeGerenciar =
        pessoa?.perfil !== "PENDENTE" &&
        temPermissao(
            pessoa?.perfil,
            "GERENCIAR_FINANCEIRO"
        );

    const [resumo, setResumo] =
        useState<ResumoFinanceiro>({
            receitas: 0,
            despesas: 0,
            saldo: 0,
        });

    const [loading, setLoading] = useState(true);

    const [historicoAtualizacao, setHistoricoAtualizacao] =
        useState(0);

    async function carregarResumo() {
        try {
            setLoading(true);

            const resultado =
                await FinanceService.obterResumo();

            setResumo(resultado);

            setHistoricoAtualizacao(
                (valor) => valor + 1
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
        carregarResumo();
    }, []);

    return (
        <div className="space-y-8">

            <PageHeader
                title="Financeiro"
                subtitle="Visão geral das movimentações financeiras"
                icon={Wallet}
            />

            {loading ? (
                <LoadingSpinner
                    text="Carregando financeiro..."
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-3">

                    {/* SALDO */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet
                                    size={20}
                                    className="text-blue-600"
                                />

                                Saldo
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <p className="text-3xl font-bold text-slate-900">
                                {formatarMoeda(resumo.saldo)}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Saldo atual da carteira
                            </p>
                        </CardContent>
                    </Card>


                    {/* RECEITAS */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp
                                    size={20}
                                    className="text-green-600"
                                />

                                Receitas
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">
                                {formatarMoeda(resumo.receitas)}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Total de entradas
                            </p>
                        </CardContent>
                    </Card>


                    {/* DESPESAS */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown
                                    size={20}
                                    className="text-red-600"
                                />

                                Despesas
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <p className="text-3xl font-bold text-red-600">
                                {formatarMoeda(resumo.despesas)}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Total de saídas
                            </p>
                        </CardContent>
                    </Card>

                    {podeGerenciar && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Registrar movimentação
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <FinanceForm
                                    onSaved={carregarResumo}
                                />
                            </CardContent>
                        </Card>
                    )}

                </div>





            )}

            <FinanceHistory
                atualizar={historicoAtualizacao}
                onChanged={carregarResumo}
            />

        </div>
    );
}