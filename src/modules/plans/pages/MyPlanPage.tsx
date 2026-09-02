import { useEffect, useMemo, useState } from "react";

import {
    AlertTriangle,
    ArrowUpCircle,
    BookOpen,
    CheckCircle2,
    CreditCard,
    GraduationCap,
    ShieldCheck,
    Users,
    Clock3,
} from "lucide-react";

import { toast } from "sonner";
import { Link } from "react-router-dom";

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
        trimestres_ativos: number;
    };
};


type RecursoProps = {
    nome: string;
    utilizado: number;
    limite: number;
    icon: React.ElementType;
};


/*
|--------------------------------------------------------------------------
| CONFIGURAÇÃO DO PERÍODO GRATUITO
|--------------------------------------------------------------------------
|
| O plano Semente começa com 5 dias gratuitos.
|
| Quando o backend passar a fornecer data_vencimento,
| ela terá prioridade.
|
*/

const DURACAO_TESTE_GRATUITO_DIAS = 5;


/*
|--------------------------------------------------------------------------
| FORMATA DATA
|--------------------------------------------------------------------------
*/

function formatarData(
    data: string | null
) {

    if (!data) {
        return "Não informado";
    }


    const dataFormatada =
        new Date(data);


    if (
        Number.isNaN(
            dataFormatada.getTime()
        )
    ) {
        return "Não informado";
    }


    return dataFormatada.toLocaleDateString(
        "pt-BR",
        {
            timeZone:
                "America/Sao_Paulo",
        }
    );
}


/*
|--------------------------------------------------------------------------
| CALCULA PERCENTUAL
|--------------------------------------------------------------------------
*/

function calcularPercentual(
    utilizado: number,
    limite: number
) {

    if (
        limite === -1
    ) {
        return 0;
    }


    if (
        limite <= 0
    ) {
        return 100;
    }


    return Math.min(
        Math.round(
            (
                utilizado /
                limite
            ) * 100
        ),
        100
    );
}


/*
|--------------------------------------------------------------------------
| FORMATA TEMPO RESTANTE
|--------------------------------------------------------------------------
*/

function formatarTempoRestante(
    milissegundos: number
) {

    if (
        milissegundos <= 0
    ) {
        return "Período encerrado";
    }


    const totalSegundos =
        Math.floor(
            milissegundos /
            1000
        );


    const totalMinutos =
        Math.floor(
            totalSegundos /
            60
        );


    const totalHoras =
        Math.floor(
            totalMinutos /
            60
        );


    const dias =
        Math.floor(
            totalHoras /
            24
        );


    const horas =
        totalHoras % 24;


    const minutos =
        totalMinutos % 60;


    if (
        dias > 0
    ) {

        return `${dias} ${dias === 1
                ? "dia"
                : "dias"
            } e ${horas} ${horas === 1
                ? "hora"
                : "horas"
            }`;

    }


    if (
        horas > 0
    ) {

        return `${horas} ${horas === 1
                ? "hora"
                : "horas"
            } e ${minutos} ${minutos === 1
                ? "minuto"
                : "minutos"
            }`;

    }


    if (
        minutos > 0
    ) {

        return `${minutos} ${minutos === 1
                ? "minuto"
                : "minutos"
            }`;

    }


    return "menos de 1 minuto";
}


/*
|--------------------------------------------------------------------------
| CARD DE RECURSO
|--------------------------------------------------------------------------
*/

function RecursoCard({
    nome,
    utilizado,
    limite,
    icon: Icon,
}: RecursoProps) {

    const ilimitado =
        limite === -1;


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

                    /{" "}

                    {ilimitado
                        ? "Ilimitado"
                        : limite}

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
                                width:
                                    `${percentual}%`,
                            }}
                        />

                    </div>


                    <div className="mt-2 flex justify-between text-xs text-slate-500">

                        <span>

                            {percentual}%
                            {" "}
                            utilizado

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


/*
|--------------------------------------------------------------------------
| PÁGINA MEU PLANO
|--------------------------------------------------------------------------
*/

export function MyPlanPage() {

    const [plano, setPlano] =
        useState<MeuPlano | null>(
            null
        );


    const [loading, setLoading] =
        useState(true);


    /*
    |--------------------------------------------------------------------------
    | CONTADOR
    |--------------------------------------------------------------------------
    */

    const [agora, setAgora] =
        useState(
            () => Date.now()
        );


    /*
    |--------------------------------------------------------------------------
    | CARREGA PLANO
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        carregarPlano();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | ATUALIZA O RELÓGIO A CADA SEGUNDO
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const intervalo =
            window.setInterval(
                () => {

                    setAgora(
                        Date.now()
                    );

                },
                1000
            );


        return () => {

            window.clearInterval(
                intervalo
            );

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | BUSCA PLANO
    |--------------------------------------------------------------------------
    */

    async function carregarPlano() {

        try {

            setLoading(
                true
            );


            const {
                data: sessionData,
                error: sessionError,
            } =
                await supabase.auth.getSession();


            if (sessionError) {

                throw sessionError;

            }


            const session =
                sessionData.session;


            if (
                !session?.access_token
            ) {

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
            } =
                await supabase.functions.invoke(
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


            if (
                !data?.success
            ) {

                throw new Error(
                    data?.error ??
                    "Não foi possível carregar o plano."
                );

            }


            setPlano(
                data
            );


        } catch (error) {

            console.error(
                "Erro ao carregar plano:",
                error
            );


            toast.error(
                "Não foi possível carregar os dados do plano."
            );


        } finally {

            setLoading(
                false
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | INFORMAÇÕES DO TESTE GRATUITO
    |--------------------------------------------------------------------------
    */

    const informacoesTeste =
        useMemo(() => {

            if (!plano) {

                return null;

            }


            /*
            | Só tratamos como teste gratuito
            | o plano Semente.
            */

            if (
                plano.plano.nome !==
                "Semente"
            ) {

                return null;

            }


            if (
                !plano.assinatura.data_inicio
            ) {

                return null;

            }


            const inicio =
                new Date(
                    plano.assinatura.data_inicio
                );


            if (
                Number.isNaN(
                    inicio.getTime()
                )
            ) {

                return null;

            }


            /*
            | Se o backend já fornecer
            | data_vencimento, usamos ela.
            |
            | Caso contrário, calculamos
            | os 5 dias gratuitos.
            */

            let vencimento: Date;


            if (
                plano.assinatura.data_vencimento
            ) {

                vencimento =
                    new Date(
                        plano.assinatura.data_vencimento
                    );

            } else {

                vencimento =
                    new Date(
                        inicio.getTime()
                        +
                        (
                            DURACAO_TESTE_GRATUITO_DIAS
                            *
                            24
                            *
                            60
                            *
                            60
                            *
                            1000
                        )
                    );

            }


            if (
                Number.isNaN(
                    vencimento.getTime()
                )
            ) {

                return null;

            }


            const restante =
                vencimento.getTime()
                -
                agora;


            const expirado =
                restante <= 0;


            return {

                inicio,

                vencimento,

                restante,

                expirado,

                texto:
                    formatarTempoRestante(
                        restante
                    ),

            };

        }, [
            plano,
            agora,
        ]);


    /*
    |--------------------------------------------------------------------------
    | UPGRADE
    |--------------------------------------------------------------------------
    */

    const podeFazerUpgrade =
        plano?.plano.nome ===
        "Semente" ||
        plano?.plano.nome ===
        "Crescimento";


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (

            <div className="mx-auto w-full max-w-7xl p-6">

                <p className="text-slate-500">

                    Carregando informações do plano...

                </p>

            </div>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | SEM PLANO
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <div className="mx-auto w-full max-w-7xl space-y-6 p-3 sm:p-6">

            <PageHeader
                title="Meu Plano"
                subtitle="Consulte sua assinatura e a utilização dos recursos"
                icon={CreditCard}
            />


            {/* ========================================================= */}
            {/* PLANO ATUAL */}
            {/* ========================================================= */}

            <Card>

                <CardHeader>

                    <CardTitle>
                        Plano atual
                    </CardTitle>

                </CardHeader>


                <CardContent>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                        {/* PLANO */}

                        <div>

                            <p className="text-sm text-slate-500">
                                Plano
                            </p>


                            <p className="mt-1 text-xl font-bold text-slate-900">

                                {plano.plano.nome}

                            </p>

                        </div>


                        {/* STATUS */}

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


                        {/* INÍCIO */}

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


                        {/* VENCIMENTO */}

                        <div>

                            <p className="text-sm text-slate-500">

                                {informacoesTeste
                                    ? "Fim do teste"
                                    : "Vencimento"}

                            </p>


                            <p className="mt-1 font-semibold text-slate-900">

                                {informacoesTeste

                                    ? formatarData(
                                        informacoesTeste.vencimento.toISOString()
                                    )

                                    : formatarData(
                                        plano.assinatura.data_vencimento
                                    )}

                            </p>

                        </div>

                    </div>


                    {/* ===================================================== */}
                    {/* CONTADOR DO TESTE */}
                    {/* ===================================================== */}

                    {informacoesTeste && (

                        <div
                            className={[
                                "mt-6 rounded-2xl border p-5",
                                informacoesTeste.expirado
                                    ? "border-red-200 bg-red-50"
                                    : "border-blue-200 bg-blue-50",
                            ].join(" ")}
                        >

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <div className="flex items-start gap-4">

                                    <div
                                        className={[
                                            "rounded-xl p-3",
                                            informacoesTeste.expirado
                                                ? "bg-red-100 text-red-600"
                                                : "bg-blue-100 text-blue-600",
                                        ].join(" ")}
                                    >

                                        <Clock3
                                            size={24}
                                        />

                                    </div>


                                    <div>

                                        <p className="text-sm font-medium text-slate-500">

                                            Período gratuito

                                        </p>


                                        <p
                                            className={[
                                                "mt-1 text-2xl font-bold",
                                                informacoesTeste.expirado
                                                    ? "text-red-700"
                                                    : "text-blue-700",
                                            ].join(" ")}
                                        >

                                            {informacoesTeste.expirado
                                                ? "Período encerrado"
                                                : `${informacoesTeste.texto} restantes`}

                                        </p>


                                        <p className="mt-1 text-sm text-slate-600">

                                            {informacoesTeste.expirado

                                                ? "Escolha um plano para continuar utilizando o EBD Manager."

                                                : `Seu teste gratuito termina em ${formatarData(
                                                    informacoesTeste.vencimento.toISOString()
                                                )}.`}

                                        </p>

                                    </div>

                                </div>


                                {!informacoesTeste.expirado && (

                                    <div className="shrink-0">

                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                                            TESTE GRATUITO

                                        </span>

                                    </div>

                                )}

                            </div>

                        </div>

                    )}


                    {/* ===================================================== */}
                    {/* UPGRADE */}
                    {/* ===================================================== */}

                    {podeFazerUpgrade && (

                        <div className="mt-6 flex justify-center sm:justify-end">

                            <Link
                                to="/planos"
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                            >

                                <ArrowUpCircle
                                    size={20}
                                />

                                Fazer upgrade

                            </Link>

                        </div>

                    )}

                </CardContent>

            </Card>


            {/* ========================================================= */}
            {/* RECURSOS */}
            {/* ========================================================= */}

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
                            utilizado={
                                plano.utilizados.trimestres_ativos
                            }
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