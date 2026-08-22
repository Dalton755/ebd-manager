import {
    ArrowUpCircle,
    BarChart3,
    LockKeyhole,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export function FinancePageBloqueada() {

    const navigate = useNavigate();

    return (
        <div className="space-y-8">

            {/* CABEÇALHO */}

            <div>
                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                        <Wallet
                            size={22}
                            className="text-blue-600"
                        />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Financeiro
                        </h1>

                        <p className="text-sm text-slate-500">
                            Controle financeiro da sua EBD
                        </p>
                    </div>

                </div>
            </div>


            {/* BLOQUEIO */}

            <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 shadow-sm">

                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

                <div className="relative mx-auto max-w-3xl text-center">

                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">

                        <LockKeyhole
                            size={28}
                            className="text-white"
                        />

                    </div>

                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">

                        Recurso do plano Crescimento

                    </div>

                    <h2 className="text-3xl font-black tracking-tight text-slate-950">

                        Organize também as finanças da sua EBD

                    </h2>

                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">

                        O módulo financeiro permite acompanhar receitas,
                        despesas e saldo da sua EBD em um único lugar,
                        trazendo mais controle e transparência para a gestão.

                    </p>


                    {/* RECURSOS */}

                    <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">

                        <Recurso
                            icon={Wallet}
                            texto="Controle de receitas e despesas"
                        />

                        <Recurso
                            icon={BarChart3}
                            texto="Visão geral financeira"
                        />

                        <Recurso
                            icon={TrendingUp}
                            texto="Acompanhamento de receitas"
                        />

                        <Recurso
                            icon={TrendingDown}
                            texto="Controle de despesas"
                        />

                    </div>


                    {/* CTA */}

                    <div className="mt-9">

                        <button
                            type="button"
                            onClick={() => navigate("/planos")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-xl"
                        >

                            <ArrowUpCircle size={19} />

                            Fazer upgrade

                        </button>

                        <p className="mt-3 text-xs text-slate-500">

                            Desbloqueie o módulo financeiro no plano
                            Crescimento ou Igreja.

                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}


type RecursoProps = {
    icon: React.ElementType;
    texto: string;
};


function Recurso({
    icon: Icon,
    texto,
}: RecursoProps) {

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">

                <Icon
                    size={18}
                    className="text-blue-600"
                />

            </div>

            <span className="text-sm font-semibold text-slate-700">
                {texto}
            </span>

        </div>
    );
}