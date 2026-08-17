import { useEffect, useState } from "react";
import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    CreditCard,
    GraduationCap,
    ShieldCheck,
    Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/Card";

import { supabase } from "@/shared/lib/supabase/client";

type Limite = number;

type MeuPlano = {
    success: boolean;

    igreja_id: string;

    usuario: {
        nome: string;
        perfil: string;
    };

    assinatura: {
        id: string;
        status: string;
        data_inicio: string | null;
        data_vencimento: string | null;
    };

    plano: {
        id: string;
        nome: string;
    };

    limites: {
        pessoas: Limite;
        classes: Limite;
        professores: Limite;
        secretarios: Limite;
        pastores: Limite;
        administradores: Limite;
        trimestres_ativos: Limite;
    };

    utilizados: {
        pessoas: number;
        classes: number;
        professores: number;
        secretarios: number;
        pastores: number;
        administradores: number;
    };
};

type RecursoProps = {
    nome: string;
    utilizado: number;
    limite: number;
    icon: React.ElementType;
};

function formatarData(data: string | null) {
    if (!data) {
        return "Não informado";
    }

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
        return "Não informado";
    }

    return dataFormatada.toLocaleDateString(
        "pt-BR",
        {
            timeZone: "America/Sao_Paulo",
        }
    );
}

function calcularPercentual(
    utilizado: number,
    limite: number
) {
    if (limite === -1) {
        return 0;
    }

    if (limite <= 0) {
        return 100;
    }

    return Math.min(
        Math.round(
            (utilizado / limite) * 100
        ),
        100
    );
}

function RecursoCard({
    nome,
    utilizado,
    limite,
    icon: Icon,
}: RecursoProps) {

    const ilimitado = limite === -1;

    const percentual =
        calcularPercentual(
            utilizado,
            limite
        );

    const atingido =
        !ilimitado &&
        utilizado >= limite;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">

            <div className="mb-4 flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                        <Icon size={19} />
                    </div>

                    <span className="font-medium text-slate-800">
                        {nome}
                    </span>

                </div>

                {atingido && (
                    <AlertTriangle
                        size={18}
                        className="text-amber-500"
                    />
                )}

            </div>

            <div className="mb-2 flex items-baseline gap-1">

                <span className="text-2xl font-bold text-slate-900">
                    {utilizado}
                </span>

                <span className="text-sm text-slate-500">
                    / {ilimitado ? "Ilimitado" : limite}
                </span>

            </div>

            {ilimitado ? (
                <p className="text-xs font-medium text-green-600">
                    Recurso ilimitado
                </p>
            ) : (
                <>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                                width: `${percentual}%`,
                            }}
                        />

                    </div>

                    <div className="mt-2 flex justify-between text-xs text-slate-500">

                        <span>
                            {percentual}% utilizado
                        </span>

                        <span>
                            {limite - utilizado > 0
                                ? `${limite - utilizado} disponível`
                                : "Limite atingido"}
                        </span>

                    </div>
                </>
            )}

        </div>
    );
}

export function MyPlanPage() {

    const [plano, setPlano] =
        useState<MeuPlano | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        carregarPlano();
    }, []);

    async function carregarPlano() {

        try {

            setLoading(true);

            const {
                data: sessionData,
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            const session = sessionData.session;

            if (!session?.access_token) {
                throw new Error(
                    "Sessão do usuário não encontrada."
                );
            }

            console.log(
                "[MEU PLANO] Sessão encontrada:",
                session.user.id
            );

            const {
                data,
                error,
            } = await supabase.functions.invoke(
                "get-my-plan",
                {
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`,
                    },
                }
            );

            if (error) {
                throw error;
            }

            if (!data?.success) {
                throw new Error(
                    data?.error ??
                    "Não foi possível carregar o plano."
                );
            }

            setPlano(data);

        } catch (error) {

            console.error(
                "Erro ao carregar plano:",
                error
            );

            toast.error(
                "Não foi possível carregar os dados do plano."
            );

        } finally {

            setLoading(false);

        }
    }

    if (loading) {

        return (
            <div className="mx-auto w-full max-w-7xl p-6">

                <p className="text-slate-500">
                    Carregando informações do plano...
                </p>

            </div>
        );
    }

    if (!plano) {

        return (
            <div className="mx-auto w-full max-w-7xl p-6">

                <Card>

                    <CardContent className="py-10 text-center">

                        <AlertTriangle
                            className="mx-auto mb-3 text-amber-500"
                            size={36}
                        />

                        <p className="font-medium text-slate-800">
                            Não foi possível carregar seu plano.
                        </p>

                    </CardContent>

                </Card>

            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-3 sm:p-6">

            <PageHeader
                title="Meu Plano"
                subtitle="Consulte sua assinatura e a utilização dos recursos"
                icon={CreditCard}
            />

            {/* PLANO */}

            <Card>

                <CardHeader>
                    <CardTitle>
                        Plano atual
                    </CardTitle>
                </CardHeader>

                <CardContent>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                        <div>
                            <p className="text-sm text-slate-500">
                                Plano
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {plano.plano.nome}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Status
                            </p>

                            <div className="mt-1 flex items-center gap-2">

                                <CheckCircle2
                                    size={18}
                                    className="text-green-600"
                                />

                                <span className="font-semibold text-green-700">
                                    {plano.assinatura.status}
                                </span>

                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Início
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {formatarData(
                                    plano.assinatura.data_inicio
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Vencimento
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {formatarData(
                                    plano.assinatura.data_vencimento
                                )}
                            </p>
                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* RECURSOS */}

            <Card>

                <CardHeader>
                    <CardTitle>
                        Utilização do plano
                    </CardTitle>
                </CardHeader>

                <CardContent>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        <RecursoCard
                            nome="Pessoas"
                            utilizado={
                                plano.utilizados.pessoas
                            }
                            limite={
                                plano.limites.pessoas
                            }
                            icon={Users}
                        />

                        <RecursoCard
                            nome="Professores"
                            utilizado={
                                plano.utilizados.professores
                            }
                            limite={
                                plano.limites.professores
                            }
                            icon={BookOpen}
                        />

                        <RecursoCard
                            nome="Secretários"
                            utilizado={
                                plano.utilizados.secretarios
                            }
                            limite={
                                plano.limites.secretarios
                            }
                            icon={Users}
                        />

                        <RecursoCard
                            nome="Pastores"
                            utilizado={
                                plano.utilizados.pastores
                            }
                            limite={
                                plano.limites.pastores
                            }
                            icon={ShieldCheck}
                        />

                        <RecursoCard
                            nome="Administradores"
                            utilizado={
                                plano.utilizados.administradores
                            }
                            limite={
                                plano.limites.administradores
                            }
                            icon={ShieldCheck}
                        />

                        {/* CLASSES */}

                        <RecursoCard
                            nome="Classes"
                            utilizado={
                                plano.utilizados.classes
                            }
                            limite={
                                plano.limites.classes
                            }
                            icon={GraduationCap}
                        />

                        <RecursoCard
                            nome="Trimestres ativos"
                            utilizado={0}
                            limite={
                                plano.limites.trimestres_ativos
                            }
                            icon={BookOpen}
                        />

                    </div>

                </CardContent>

            </Card>

        </div>
    );
}