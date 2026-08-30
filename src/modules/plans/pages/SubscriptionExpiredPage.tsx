import {
    useEffect,
    useState,
} from "react";

import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Crown,
    Sparkles,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    PlanService,
} from "@/shared/plans/PlanService";


export function SubscriptionExpiredPage() {

    const navigate =
        useNavigate();


    const {
        igrejaNome,
        igrejaId,
    } = useAuth();

    const [
        assinaturaFimEm,
        setAssinaturaFimEm,
    ] = useState<string | null>(null);

    useEffect(() => {

        if (!igrejaId) {
            return;
        }

        let ativo = true;

        async function carregarFimAssinatura() {

            try {

                const assinatura =
                    await PlanService.buscarAssinaturaDaIgreja(
                        igrejaId
                    );

                if (!ativo) {
                    return;
                }

                if (assinatura?.fim_em) {

                    setAssinaturaFimEm(
                        assinatura.fim_em
                    );

                    return;
                }

                // -------------------------------------------------
                // TESTE GRATUITO SEM FIM_EM
                // -------------------------------------------------

                if (
                    assinatura?.gratuito_contratado === true &&
                    assinatura.inicio_em &&
                    assinatura.duracao_gratuita_contratada_dias &&
                    assinatura.duracao_gratuita_contratada_dias > 0
                ) {

                    const inicio =
                        new Date(
                            assinatura.inicio_em
                        );

                    const fim =
                        new Date(
                            inicio
                        );

                    fim.setDate(
                        fim.getDate() +
                        assinatura.duracao_gratuita_contratada_dias
                    );

                    setAssinaturaFimEm(
                        fim.toISOString()
                    );

                    return;
                }

                setAssinaturaFimEm(
                    null
                );

            } catch (error) {

                console.error(
                    "Erro ao carregar vencimento da assinatura:",
                    error
                );

                if (ativo) {

                    setAssinaturaFimEm(
                        null
                    );
                }
            }
        }

        void carregarFimAssinatura();

        return () => {

            ativo = false;
        };

    }, [
        igrejaId,
    ]);


    function formatarData(
        valor: string | null
    ) {

        if (!valor) {
            return "";
        }


        return new Date(
            valor
        ).toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    }


    return (

        <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">

            <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">

                <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">


                    {/* ================================================= */}
                    {/* CABEÇALHO */}
                    {/* ================================================= */}

                    <div className="relative overflow-hidden bg-slate-950 px-6 py-12 text-center text-white sm:px-10">

                        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl" />

                        <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-purple-600/20 blur-3xl" />


                        <div className="relative">

                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">

                                <Clock3
                                    size={30}
                                    className="text-amber-300"
                                />

                            </div>


                            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">

                                Período de avaliação

                            </p>


                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">

                                Seu teste gratuito terminou

                            </h1>


                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">

                                {igrejaNome
                                    ? `${igrejaNome}, `
                                    : ""}

                                seu período gratuito no EBD Manager chegou ao fim.

                            </p>


                            {assinaturaFimEm && (

                                <p className="mt-3 text-xs text-slate-400">

                                    Período encerrado em{" "}

                                    <strong className="text-slate-300">

                                        {formatarData(
                                            assinaturaFimEm
                                        )}

                                    </strong>

                                </p>

                            )}

                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* CONTEÚDO */}
                    {/* ================================================= */}

                    <div className="px-6 py-10 sm:px-10">

                        <div className="mx-auto max-w-3xl text-center">


                            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">

                                Continue organizando sua EBD

                            </h2>


                            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">

                                Esperamos que esses dias tenham mostrado como o EBD Manager pode facilitar a gestão da sua Escola Bíblica.

                                <br />

                                <strong className="text-slate-900">

                                    Agora escolha o plano que melhor acompanha o momento da sua igreja.

                                </strong>

                            </p>


                            {/* ================================================= */}
                            {/* BENEFÍCIOS */}
                            {/* ================================================= */}

                            <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">


                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                    <CheckCircle2
                                        size={20}
                                        className="mb-3 text-green-600"
                                    />

                                    <p className="text-sm font-bold text-slate-900">

                                        Organização

                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">

                                        Centralize a gestão da sua EBD.

                                    </p>

                                </div>


                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                    <CheckCircle2
                                        size={20}
                                        className="mb-3 text-green-600"
                                    />

                                    <p className="text-sm font-bold text-slate-900">

                                        Acompanhamento

                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">

                                        Tenha uma visão melhor dos alunos.

                                    </p>

                                </div>


                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                    <CheckCircle2
                                        size={20}
                                        className="mb-3 text-green-600"
                                    />

                                    <p className="text-sm font-bold text-slate-900">

                                        Crescimento

                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">

                                        Estruture sua EBD para crescer.

                                    </p>

                                </div>

                            </div>


                            {/* ================================================= */}
                            {/* CTA */}
                            {/* ================================================= */}

                            <div className="mt-10">

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/planos"
                                        )
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                                >

                                    Conhecer os planos

                                    <ArrowRight
                                        size={18}
                                    />

                                </button>


                                <p className="mt-4 text-xs text-slate-400">

                                    Escolha o plano ideal para sua igreja.

                                </p>

                            </div>

                        </div>


                        {/* ================================================= */}
                        {/* PLANOS */}
                        {/* ================================================= */}

                        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">


                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                                <div className="mb-3 flex items-center gap-3">

                                    <div className="rounded-xl bg-blue-100 p-2 text-blue-600">

                                        <Sparkles
                                            size={20}
                                        />

                                    </div>


                                    <div>

                                        <p className="text-xs font-medium text-blue-600">

                                            Para igrejas em crescimento

                                        </p>

                                        <h3 className="font-black text-slate-900">

                                            Crescimento

                                        </h3>

                                    </div>

                                </div>


                                <p className="text-2xl font-black text-slate-950">

                                    R$ 59,90

                                    <span className="ml-1 text-xs font-medium text-slate-500">

                                        /mês

                                    </span>

                                </p>

                            </div>


                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                                <div className="mb-3 flex items-center gap-3">

                                    <div className="rounded-xl bg-amber-100 p-2 text-amber-600">

                                        <Crown
                                            size={20}
                                        />

                                    </div>


                                    <div>

                                        <p className="text-xs font-medium text-amber-600">

                                            Experiência completa

                                        </p>

                                        <h3 className="font-black text-slate-900">

                                            Igreja

                                        </h3>

                                    </div>

                                </div>


                                <p className="text-2xl font-black text-slate-950">

                                    R$ 99,90

                                    <span className="ml-1 text-xs font-medium text-slate-500">

                                        /mês

                                    </span>

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}