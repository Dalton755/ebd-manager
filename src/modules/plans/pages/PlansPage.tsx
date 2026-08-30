import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    motion,
} from "motion/react";

import {
    Bell,
    Check,
    Crown,
    MapPin,
    Sparkles,
    Users,
    Zap,
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

import {
    PlansCatalogService,
} from "@/shared/plans/PlansCatalogService";

import type {
    AssinaturaInfo,
} from "@/shared/plans/PlanService";

import type {
    PlanoCompleto,
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

import {
    supabase,
} from "@/shared/lib/supabase/client";


// ============================================================
// TIPOS
// ============================================================

type OfertaPlano = {
    id: string;

    plano_id: string;

    preco_recorrente: number;

    gratuito: boolean;

    duracao_gratuita_dias: number;

    periodo_recorrente: string;

    ativa: boolean;

    plano: {
        id: string;

        nome: string;

        descricao: string | null;

        ordem: number;

        ativo: boolean;
    } | null;
};


// ============================================================
// STORAGE DO CHECKOUT MERCADO PAGO
// ============================================================

const MERCADOPAGO_PREAPPROVAL_STORAGE_KEY =
    "mercadopago_preapproval_id";

const MERCADOPAGO_IGREJA_STORAGE_KEY =
    "mercadopago_preapproval_igreja_id";


function limparCheckoutMercadoPagoDoStorage() {

    sessionStorage.removeItem(
        MERCADOPAGO_PREAPPROVAL_STORAGE_KEY
    );

    sessionStorage.removeItem(
        MERCADOPAGO_IGREJA_STORAGE_KEY
    );
}


// ============================================================
// DESCRIÃ‡Ã•ES
// ============================================================

const DESCRICOES_PLANOS: Record<
    string,
    string
> = {

    Semente:
        "Comece sua organizaÃ§Ã£o sem compromisso e descubra como o EBD Manager pode transformar sua rotina.",

    Crescimento:
        "Para igrejas que estÃ£o crescendo e precisam de mais estrutura, organizaÃ§Ã£o e controle.",

    Igreja:
        "Para igrejas que querem escala, automaÃ§Ã£o e recursos avanÃ§ados para sua EBD.",
};


// ============================================================
// NOMES DOS RECURSOS
// ============================================================

const NOMES_RECURSOS: Record<
    RecursoCodigo,
    string
> = {

    ALUNOS_CLASSES:
        "Alunos por classe",

    AULAS:
        "GestÃ£o de aulas",

    CHECKIN:
        "Check-in",

    CHECKIN_LOCALIZACAO:
        "Check-in por geolocalizaÃ§Ã£o",

    CLASSES:
        "Classes",

    DASHBOARD:
        "Dashboard",

    FINANCEIRO:
        "Financeiro",

    GESTAO_USUARIOS:
        "GestÃ£o de usuÃ¡rios",

    SOLICITACOES_SENHA:
        "SolicitaÃ§Ãµes de senha",

    NOTIFICACAO_PUSH:
        "NotificaÃ§Ãµes automÃ¡ticas",

    NOTIFICACOES:
        "NotificaÃ§Ãµes",

    PESSOAS:
        "GestÃ£o de pessoas",

    PRESENCAS:
        "Controle de presenÃ§as",

    PROFESSORES:
        "Professores",

    RELATORIOS:
        "RelatÃ³rios",

    TRIMESTRES:
        "Trimestres",
};


// ============================================================
// FORMATAÃ‡Ã•ES
// ============================================================

function formatarPreco(
    valor: number
) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        }
    );
}


function formatarLimite(
    valor: number
) {

    if (valor === -1) {

        return "Ilimitado";
    }

    return valor.toString();
}


function formatarData(
    data: string | Date | null
) {

    if (!data) {

        return "NÃ£o informado";
    }

    const valor =
        data instanceof Date
            ? data
            : new Date(data);

    if (
        Number.isNaN(
            valor.getTime()
        )
    ) {

        return "NÃ£o informado";
    }

    return valor.toLocaleDateString(
        "pt-BR"
    );
}


function formatarPeriodo(
    periodo: string
) {

    switch (periodo) {

        case "MENSAL":
            return "/mÃªs";

        case "TRIMESTRAL":
            return "/trimestre";

        case "SEMESTRAL":
            return "/semestre";

        case "ANUAL":
            return "/ano";

        default:
            return "";
    }
}


function calcularFimTeste(
    inicioEm: string,
    duracaoDias: number
) {

    const inicio =
        new Date(inicioEm);

    const fim =
        new Date(inicio);

    fim.setDate(
        fim.getDate() +
        duracaoDias
    );

    return fim;
}


// ============================================================
// FUNÃ‡Ã•ES AUXILIARES
// ============================================================

function obterRecursosPrincipais(
    plano: PlanoCompleto
) {

    return plano.recursos
        .map(
            (codigo) =>
                NOMES_RECURSOS[codigo]
        )
        .filter(Boolean);
}


function obterIconePlano(
    nome: string
) {

    if (nome === "Igreja") {

        return Crown;
    }

    if (
        nome ===
        "Crescimento"
    ) {

        return Users;
    }

    return Sparkles;
}


function obterDestaquePlano(
    nome: string
) {

    if (
        nome ===
        "Crescimento"
    ) {

        return {
            texto: "Mais escolhido",
            classe:
                "bg-blue-600 text-white",
        };
    }

    if (
        nome === "Igreja"
    ) {

        return {
            texto:
                "ExperiÃªncia completa",

            classe:
                "bg-slate-900 text-white",
        };
    }

    return null;
}


// ============================================================
// COMPONENTE
// ============================================================

export function PlansPage() {

    const navigate =
        useNavigate();


    const {
        igrejaId,
        plano: planoAtual,
        loading: authLoading,
        isSuperAdmin,
    } =
        useAuth();


    const [
        planos,
        setPlanos,
    ] =
        useState<PlanoCompleto[]>([]);


    const [
        ofertas,
        setOfertas,
    ] =
        useState<OfertaPlano[]>([]);


    const [
        assinatura,
        setAssinatura,
    ] =
        useState<AssinaturaInfo | null>(
            null
        );


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        erro,
        setErro,
    ] =
        useState<string | null>(
            null
        );

    const [
        checkoutLoading,
        setCheckoutLoading,
    ] =
        useState(false);


    // ========================================================
    // CARREGA CATÃLOGO E ASSINATURA
    // ========================================================

    useEffect(() => {

        if (authLoading) {

            return;
        }


        let ativo = true;


        async function carregarDados() {

            try {

                setLoading(true);

                setErro(null);


                const [
                    planosData,
                    ofertasData,
                    assinaturaData,
                ] =
                    await Promise.all([

                        PlansCatalogService
                            .listarPlanos(),

                        PlansCatalogService
                            .listarOfertasAtivas(),

                        igrejaId
                            ? PlanService
                                .buscarAssinaturaDaIgreja(
                                    igrejaId
                                )
                            : Promise.resolve(
                                null
                            ),

                    ]);


                if (!ativo) {

                    return;
                }


                setPlanos(
                    planosData
                );


                const ofertasOrdenadas =
                    [
                        ...(ofertasData as OfertaPlano[]),
                    ].sort(
                        (
                            a,
                            b
                        ) =>
                            (
                                a.plano?.ordem ??
                                99
                            ) -
                            (
                                b.plano?.ordem ??
                                99
                            )
                    );


                setOfertas(
                    ofertasOrdenadas
                );


                setAssinatura(
                    assinaturaData
                );

            } catch (error) {

                console.error(
                    "Erro ao carregar catÃ¡logo de planos:",
                    error
                );


                if (ativo) {

                    setErro(
                        "NÃ£o foi possÃ­vel carregar os planos disponÃ­veis."
                    );
                }

            } finally {

                if (ativo) {

                    setLoading(
                        false
                    );
                }
            }
        }


        void carregarDados();


        return () => {

            ativo = false;
        };

    }, [
        authLoading,
        igrejaId,
    ]);


    // ========================================================
    // SINCRONIZA ASSINATURA APÃ“S RETORNO DO MERCADO PAGO
    // ========================================================

    useEffect(() => {

        if (
            authLoading ||
            !igrejaId
        ) {

            return;
        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const preapprovalIdUrl =
            params.get(
                "preapproval_id"
            )
                ?.trim() ||
            null;


        const preapprovalIdStorage =
            sessionStorage.getItem(
                MERCADOPAGO_PREAPPROVAL_STORAGE_KEY
            )
                ?.trim() ||
            null;


        const igrejaIdStorage =
            sessionStorage.getItem(
                MERCADOPAGO_IGREJA_STORAGE_KEY
            )
                ?.trim() ||
            null;


        // Um preapproval salvo no navegador só pode ser
        // sincronizado pela mesma igreja que iniciou o checkout.
        // Registros antigos, sem igreja associada, são descartados.
        if (
            preapprovalIdStorage &&
            igrejaIdStorage !== igrejaId
        ) {

            console.warn(
                "[PLANOS] Checkout antigo ignorado por pertencer a outra igreja ou não possuir igreja associada.",
                {
                    igrejaAtual:
                        igrejaId,

                    igrejaCheckout:
                        igrejaIdStorage,
                }
            );

            limparCheckoutMercadoPagoDoStorage();

            if (
                preapprovalIdUrl
            ) {

                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );
            }

            return;
        }


        const preapprovalId =
            preapprovalIdUrl ||
            (
                igrejaIdStorage === igrejaId
                    ? preapprovalIdStorage
                    : null
            );


        if (
            !preapprovalId
        ) {

            return;
        }


        let ativo =
            true;


        async function esperar(
            milissegundos: number
        ) {

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        milissegundos
                    )
            );
        }


        async function sincronizar() {

            try {

                setLoading(
                    true
                );

                setErro(
                    null
                );


                const {
                    data: sessionData,
                } =
                    await supabase.auth
                        .getSession();


                const accessToken =
                    sessionData.session
                        ?.access_token;


                if (
                    !accessToken
                ) {

                    throw new Error(
                        "SessÃ£o nÃ£o encontrada."
                    );
                }


                let sincronizado =
                    false;


                // O retorno do Mercado Pago pode acontecer alguns
                // segundos antes da confirmaÃ§Ã£o final da assinatura.
                // Tentamos algumas vezes antes de desistir.
                for (
                    let tentativa = 1;
                    tentativa <= 6;
                    tentativa += 1
                ) {

                    if (
                        !ativo
                    ) {

                        return;
                    }


                    const resposta =
                        await fetch(
                            "/api/mercadopago/sincronizar-assinatura",
                            {
                                method:
                                    "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Authorization:
                                        `Bearer ${accessToken}`,
                                },

                                body:
                                    JSON.stringify({
                                        preapprovalId,
                                    }),
                            }
                        );


                    const resultado =
                        await resposta.json();


                    if (
                        !resposta.ok
                    ) {

                        throw new Error(
                            resultado?.error ??
                            "Falha ao sincronizar assinatura."
                        );
                    }


                    console.log(
                        "[PLANOS] SincronizaÃ§Ã£o Mercado Pago:",
                        {
                            tentativa,
                            resultado,
                        }
                    );


                    if (
                        resultado?.status ===
                        "authorized"
                    ) {

                        sincronizado =
                            true;

                        break;
                    }


                    if (
                        tentativa < 6
                    ) {

                        await esperar(
                            1500
                        );
                    }
                }


                if (
                    !ativo
                ) {

                    return;
                }


                const assinaturaAtualizada =
                    await PlanService
                        .buscarAssinaturaDaIgreja(
                            igrejaId
                        );


                if (
                    !ativo
                ) {

                    return;
                }


                setAssinatura(
                    assinaturaAtualizada
                );


                if (
                    sincronizado
                ) {

                    limparCheckoutMercadoPagoDoStorage();


                    window.history
                        .replaceState(
                            {},
                            document.title,
                            window.location.pathname
                        );
                }


            } catch (error) {

                console.error(
                    "[PLANOS] Erro ao sincronizar assinatura:",
                    error
                );


                if (
                    ativo
                ) {

                    setErro(
                        error instanceof Error
                            ? error.message
                            : "NÃ£o foi possÃ­vel atualizar sua assinatura."
                    );
                }


            } finally {

                if (
                    ativo
                ) {

                    setLoading(
                        false
                    );
                }
            }
        }


        void sincronizar();


        return () => {

            ativo =
                false;
        };

    }, [
        authLoading,
        igrejaId,
    ]);


    // ========================================================
    // PLANO ATUAL
    // ========================================================

    const nomePlanoAtual =
        (
            assinatura
                ? planos.find(
                    (item) =>
                        item.plano.id ===
                        assinatura.plano_id
                )?.plano.nome
                : null
        ) ??
        planoAtual?.plano.nome ??
        null;


    // ========================================================
    // IGREJA NÃƒO DEVE TER ACESSO Ã€ PÃGINA DE PLANOS
    // ========================================================

    useEffect(() => {

        if (
            authLoading ||
            !nomePlanoAtual
        ) {

            return;
        }


        if (
            nomePlanoAtual ===
            "Igreja" &&
            !isSuperAdmin
        ) {

            navigate(
                "/meu-plano",
                {
                    replace:
                        true,
                }
            );
        }

    }, [
        authLoading,
        nomePlanoAtual,
        isSuperAdmin,
        navigate,
    ]);


    const assinaturaGratuita =
        assinatura?.gratuito_contratado ===
        true;


    // ========================================================
    // DATA DE VENCIMENTO
    // ========================================================

    const vencimentoAtual =
        useMemo(() => {

            if (!assinatura) {

                return null;
            }


            if (
                assinatura.fim_em
            ) {

                return new Date(
                    assinatura.fim_em
                );
            }


            if (
                assinaturaGratuita &&
                assinatura.inicio_em &&
                assinatura
                    .duracao_gratuita_contratada_dias
            ) {

                return calcularFimTeste(
                    assinatura.inicio_em,
                    assinatura
                        .duracao_gratuita_contratada_dias
                );
            }


            return null;

        }, [
            assinatura,
            assinaturaGratuita,
        ]);


    // ========================================================
    // PREÃ‡O EFETIVAMENTE CONTRATADO
    // ========================================================

    const precoAtual =
        useMemo(() => {

            if (!assinatura) {

                return 0;
            }


            if (
                assinaturaGratuita
            ) {

                return 0;
            }


            if (
                assinatura.preco_contratado !==
                null
            ) {

                return assinatura
                    .preco_contratado;
            }


            if (
                assinatura.preco_recorrente_contratado !==
                null
            ) {

                return assinatura
                    .preco_recorrente_contratado;
            }


            return 0;

        }, [
            assinatura,
            assinaturaGratuita,
        ]);


    // ========================================================
    // OFERTA DO SEMENETE PAGO
    // ========================================================

    const ofertaSemente =
        ofertas.find(
            (oferta) =>
                oferta.plano?.nome ===
                "Semente"
        );

    async function iniciarCheckout(
        ofertaId: string
    ) {

        console.log("[CHECKOUT] ofertaId enviado:", ofertaId);

        if (
            checkoutLoading
        ) {
            return;
        }


        try {

            setCheckoutLoading(
                true
            );


            const {
                data: {
                    session,
                },
            } =
                await supabase.auth.getSession();


            if (
                !session?.access_token
            ) {

                window.alert(
                    "Sua sessÃ£o expirou. FaÃ§a login novamente."
                );

                return;
            }


            const resposta =
                await fetch(
                    "/api/mercadopago/checkout",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },

                        body:
                            JSON.stringify({
                                oferta_id: ofertaId,
                            }),
                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok ||
                !resultado.success
            ) {

                throw new Error(
                    resultado.error ??
                    "NÃ£o foi possÃ­vel iniciar o checkout."
                );
            }


            if (
                !resultado.checkout_url
            ) {

                throw new Error(
                    "O Mercado Pago nÃ£o retornou a URL de pagamento."
                );
            }


            const preapprovalId =
                resultado.mercado_pago_preapproval_id ??
                resultado.preapproval_id ??
                null;


            if (
                preapprovalId &&
                igrejaId
            ) {

                sessionStorage.setItem(
                    MERCADOPAGO_PREAPPROVAL_STORAGE_KEY,
                    String(
                        preapprovalId
                    )
                );

                sessionStorage.setItem(
                    MERCADOPAGO_IGREJA_STORAGE_KEY,
                    igrejaId
                );
            }


            window.location.href =
                resultado.checkout_url;

        } catch (erro) {

            console.error(
                "Erro ao iniciar checkout:",
                erro
            );


            window.alert(
                erro instanceof Error
                    ? erro.message
                    : "Erro ao iniciar o pagamento."
            );

        } finally {

            setCheckoutLoading(
                false
            );

        }

    }


    // ========================================================
    // CARREGAMENTO
    // ========================================================

    if (
        authLoading ||
        loading
    ) {



        return (
            <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center p-6">

                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="text-sm text-slate-500">
                        Carregando planos...
                    </p>

                </div>

            </div>
        );
    }


    // ========================================================
    // SE IGREJA, NÃƒO RENDERIZA A PÃGINA
    // ========================================================

    if (
        nomePlanoAtual ===
        "Igreja" &&
        !isSuperAdmin
    ) {

        return null;
    }


    // ========================================================
    // ERRO
    // ========================================================

    if (erro) {

        return (
            <div className="mx-auto w-full max-w-3xl p-6">

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

                    <p className="font-semibold text-red-800">
                        {erro}
                    </p>

                </div>

            </div>
        );
    }


    // ========================================================
    // NENHUMA OFERTA
    // ========================================================

    if (
        ofertas.length === 0
    ) {

        return (
            <div className="mx-auto w-full max-w-3xl p-6">

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">

                    <p className="font-semibold text-amber-800">
                        Nenhum plano estÃ¡ disponÃ­vel para contrataÃ§Ã£o no momento.
                    </p>

                </div>

            </div>
        );
    }


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ================================================= */}
            {/* PLANO ATUAL */}
            {/* ================================================= */}

            {nomePlanoAtual && (
                <section className="px-4 pt-8 sm:px-6">

                    <div className="mx-auto max-w-7xl">

                        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">

                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                                <div>

                                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">

                                        <Check
                                            size={14}
                                        />

                                        Seu plano atual

                                    </div>

                                    <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">

                                        Plano{" "}

                                        {nomePlanoAtual}

                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">

                                        Sua assinatura estÃ¡ ativa.

                                    </p>

                                </div>


                                <div className="grid gap-3 sm:grid-cols-3">

                                    <div className="rounded-2xl bg-slate-50 px-5 py-4">

                                        <p className="text-xs font-medium text-slate-500">
                                            Valor contratado
                                        </p>

                                        <p className="mt-1 text-lg font-black text-slate-950">

                                            {assinaturaGratuita
                                                ? "GrÃ¡tis"
                                                : formatarPreco(
                                                    precoAtual
                                                )}

                                        </p>

                                    </div>


                                    <div className="rounded-2xl bg-slate-50 px-5 py-4">

                                        <p className="text-xs font-medium text-slate-500">
                                            Vencimento
                                        </p>

                                        <p className="mt-1 text-lg font-black text-slate-950">

                                            {formatarData(
                                                vencimentoAtual
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-2xl bg-slate-50 px-5 py-4">

                                        <p className="text-xs font-medium text-slate-500">
                                            Status
                                        </p>

                                        <p className="mt-1 text-lg font-black text-green-600">

                                            Ativa

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* SEMENTE GRATUITO */}

                            {nomePlanoAtual ===
                                "Semente" &&
                                assinaturaGratuita &&
                                ofertaSemente && (

                                    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center sm:justify-between">

                                        <div>

                                            <p className="font-bold text-green-900">

                                                VocÃª estÃ¡ utilizando o perÃ­odo gratuito.

                                            </p>

                                            <p className="mt-1 text-sm text-green-800">

                                                Depois do perÃ­odo gratuito, o plano Semente custa{" "}

                                                <strong>
                                                    {formatarPreco(
                                                        ofertaSemente.preco_recorrente
                                                    )}

                                                    {formatarPeriodo(
                                                        ofertaSemente.periodo_recorrente
                                                    )}
                                                </strong>

                                                .

                                            </p>

                                        </div>


                                        <button
                                            type="button"
                                            onClick={() => {
                                                document
                                                    .getElementById(
                                                        "planos-disponiveis"
                                                    )
                                                    ?.scrollIntoView({
                                                        behavior:
                                                            "smooth",
                                                    });
                                            }}
                                            className="shrink-0 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                                        >
                                            Escolher Semente pago
                                        </button>

                                    </div>

                                )}


                            {/* CRESCIMENTO */}

                            {nomePlanoAtual ===
                                "Crescimento" && (

                                    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">

                                        <div>

                                            <p className="font-bold text-blue-900">

                                                Seu plano estÃ¡ ativo.

                                            </p>

                                            <p className="mt-1 text-sm text-blue-800">

                                                Quando precisar de mais recursos, faÃ§a upgrade para o plano Igreja.

                                            </p>

                                        </div>


                                        <button
                                            type="button"
                                            onClick={() => {
                                                document
                                                    .getElementById(
                                                        "plano-igreja"
                                                    )
                                                    ?.scrollIntoView({
                                                        behavior:
                                                            "smooth",
                                                    });
                                            }}
                                            className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                                        >
                                            Ver plano Igreja
                                        </button>

                                    </div>

                                )}

                        </div>

                    </div>

                </section>
            )}


            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <section className="relative mt-8 overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 lg:py-20">

                <div className="absolute inset-0 opacity-20">

                    <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />

                    <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-purple-500 blur-3xl" />

                </div>


                <div className="relative mx-auto max-w-5xl text-center">

                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">

                        <Sparkles
                            size={16}
                            className="text-yellow-300"
                        />

                        Escolha o prÃ³ximo nÃ­vel da sua igreja

                    </div>


                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">

                        Sua igreja estÃ¡ crescendo.

                        <br />

                        <span className="text-blue-400">
                            Agora Ã© hora de organizar esse crescimento.
                        </span>

                    </h1>


                    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">

                        Tenha uma EBD mais organizada, acompanhe seus
                        alunos, facilite o trabalho da equipe e tenha os
                        recursos certos para cada fase da sua igreja.

                    </p>


                    <div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center gap-3 text-sm sm:flex-row">

                        <div className="flex items-center gap-2">

                            <Check
                                size={17}
                                className="text-green-400"
                            />

                            Comece sem risco

                        </div>

                        <div className="hidden h-4 w-px bg-white/20 sm:block" />

                        <div className="flex items-center gap-2">

                            <Check
                                size={17}
                                className="text-green-400"
                            />

                            CresÃ§a quando precisar

                        </div>

                        <div className="hidden h-4 w-px bg-white/20 sm:block" />

                        <div className="flex items-center gap-2">

                            <Check
                                size={17}
                                className="text-green-400"
                            />

                            Sem complicaÃ§Ã£o

                        </div>

                    </div>

                </div>

            </section>


            {/* ================================================= */}
            {/* TESTE GRATUITO */}
            {/* ================================================= */}

            {ofertaSemente &&
                ofertaSemente.gratuito &&
                ofertaSemente.duracao_gratuita_dias > 0 &&
                nomePlanoAtual !==
                "Semente" && (

                    <section className="px-4 py-8 sm:px-6">

                        <div className="mx-auto max-w-5xl">

                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 20,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.6,
                                }}
                                className="relative overflow-hidden rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 shadow-lg sm:p-8"
                            >

                                <div className="relative flex flex-col items-center text-center">

                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-100 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-green-800">

                                        <Zap
                                            size={15}
                                            className="fill-green-500 text-green-500"
                                        />

                                        Comece gratuitamente

                                    </div>


                                    <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">

                                        Experimente o EBD Manager

                                        <span className="text-green-600">
                                            {" "}sem pagar nada.
                                        </span>

                                    </h2>


                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">

                                        Tenha acesso ao plano Semente durante{" "}

                                        <strong className="text-slate-900">

                                            {
                                                ofertaSemente
                                                    .duracao_gratuita_dias
                                            }{" "}
                                            dias

                                        </strong>

                                        {" "}e descubra como organizar melhor sua EBD.

                                    </p>


                                    <div className="mt-6 flex items-center gap-2 text-sm font-bold text-green-700">

                                        <Check
                                            size={18}
                                        />

                                        {
                                            ofertaSemente
                                                .duracao_gratuita_dias
                                        }{" "}
                                        dias grÃ¡tis

                                    </div>


                                    <p className="mt-3 text-xs font-medium text-slate-500">

                                        Depois do perÃ­odo gratuito:{" "}

                                        <strong className="text-slate-700">

                                            {formatarPreco(
                                                ofertaSemente
                                                    .preco_recorrente
                                            )}

                                            {formatarPeriodo(
                                                ofertaSemente
                                                    .periodo_recorrente
                                            )}

                                        </strong>

                                    </p>

                                </div>

                            </motion.div>

                        </div>

                    </section>
                )}


            {/* ================================================= */}
            {/* PLANOS DISPONÃVEIS */}
            {/* ================================================= */}

            <section
                id="planos-disponiveis"
                className="px-4 pb-16 sm:px-6"
            >

                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">

                    {ofertas
                        .filter((oferta) => {
                            // O Semente deve aparecer apenas uma vez.
                            // Mantemos o Semente gratuito como o card principal.
                            if (oferta.plano?.nome === "Semente") {
                                return oferta.gratuito;
                            }

                            return true;
                        })
                        .map(
                            (
                                oferta
                            ) => {

                                const plano =
                                    planos.find(
                                        (
                                            item
                                        ) =>
                                            item.plano.id ===
                                            oferta.plano_id
                                    );


                                if (
                                    !plano ||
                                    !oferta.plano
                                ) {

                                    return null;
                                }


                                const nomePlano =
                                    oferta.plano.nome;


                                const isIgreja =
                                    nomePlano ===
                                    "Igreja";


                                const isSemente =
                                    nomePlano ===
                                    "Semente";

                                const ofertaSementePaga =
                                    isSemente
                                        ? ofertas.find(
                                            (item) =>
                                                item.plano_id ===
                                                oferta.plano_id &&
                                                !item.gratuito
                                        )
                                        : null;


                                const isCrescimento =
                                    nomePlano ===
                                    "Crescimento";


                                const isPlanoAtual =
                                    nomePlano ===
                                    nomePlanoAtual;


                                const Icone =
                                    obterIconePlano(
                                        nomePlano
                                    );


                                const destaque =
                                    obterDestaquePlano(
                                        nomePlano
                                    );


                                const recursos =
                                    obterRecursosPrincipais(
                                        plano
                                    );


                                const recursosExibicao =
                                    recursos.map(
                                        (
                                            recurso
                                        ) => {

                                            if (
                                                isIgreja &&
                                                recurso ===
                                                "Dashboard"
                                            ) {

                                                return "Dashboard AvanÃ§ado";
                                            }

                                            return recurso;
                                        }
                                    );


                                let textoBotao =
                                    "Escolher este plano";


                                let botaoClasse =
                                    "bg-slate-900 text-white hover:bg-slate-800";


                                let mostrarBotao =
                                    true;


                                // ------------------------------------
                                // SEMENTE
                                // ------------------------------------

                                if (
                                    isSemente
                                ) {

                                    if (
                                        isPlanoAtual &&
                                        !assinaturaGratuita
                                    ) {

                                        mostrarBotao =
                                            false;

                                    } else if (
                                        isPlanoAtual &&
                                        assinaturaGratuita
                                    ) {

                                        textoBotao =
                                            "Escolher Semente pago";

                                        botaoClasse =
                                            "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50";

                                    } else {

                                        textoBotao =
                                            "ComeÃ§ar gratuitamente";

                                        botaoClasse =
                                            "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50";
                                    }
                                }


                                // ------------------------------------
                                // CRESCIMENTO
                                // ------------------------------------

                                if (
                                    isCrescimento
                                ) {

                                    if (
                                        isPlanoAtual
                                    ) {

                                        mostrarBotao =
                                            false;

                                    } else {

                                        textoBotao =
                                            "Escolher este plano";

                                        botaoClasse =
                                            "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700";
                                    }
                                }


                                // ------------------------------------
                                // IGREJA
                                // ------------------------------------

                                if (
                                    isIgreja
                                ) {

                                    if (
                                        isPlanoAtual
                                    ) {

                                        mostrarBotao =
                                            false;

                                    } else {

                                        textoBotao =
                                            "Upgrade para Igreja";

                                        botaoClasse =
                                            "bg-slate-900 text-white hover:bg-slate-800";
                                    }
                                }


                                return (
                                    <motion.div
                                        key={
                                            oferta.id
                                        }
                                        id={
                                            isIgreja
                                                ? "plano-igreja"
                                                : undefined
                                        }
                                        initial={{
                                            opacity: 0,
                                            y: 30,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            delay:
                                                (
                                                    plano
                                                        .plano
                                                        .ordem ??
                                                    1
                                                ) *
                                                0.12,
                                        }}
                                        whileHover={{
                                            y: -6,
                                        }}
                                        className={[
                                            "relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition duration-300 hover:shadow-xl",

                                            isCrescimento
                                                ? "border-blue-500 ring-2 ring-blue-500/20"
                                                : "border-slate-200",

                                            isPlanoAtual
                                                ? "ring-2 ring-green-500/30"
                                                : "",
                                        ].join(" ")}
                                    >

                                        {/* PLANO ATUAL */}

                                        {isPlanoAtual && (
                                            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">

                                                <Check
                                                    size={14}
                                                />

                                                Seu plano atual

                                            </div>
                                        )}


                                        {/* DESTAQUE */}

                                        {destaque &&
                                            !isPlanoAtual && (
                                                <div
                                                    className={[
                                                        "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold shadow-sm",
                                                        destaque.classe,
                                                    ].join(" ")}
                                                >
                                                    {
                                                        destaque.texto
                                                    }
                                                </div>
                                            )}


                                        {/* CABEÃ‡ALHO */}

                                        <div className="mb-6">

                                            <div className="mb-4 flex items-center justify-between">

                                                <div>

                                                    <p className="text-sm font-medium text-slate-500">
                                                        Plano
                                                    </p>

                                                    <h2 className="text-2xl font-black text-slate-900">
                                                        {
                                                            nomePlano
                                                        }
                                                    </h2>

                                                </div>


                                                <div
                                                    className={[
                                                        "rounded-xl p-3",

                                                        isIgreja
                                                            ? "bg-amber-100 text-amber-600"
                                                            : isCrescimento
                                                                ? "bg-blue-100 text-blue-600"
                                                                : "bg-green-100 text-green-600",
                                                    ].join(" ")}
                                                >

                                                    <Icone
                                                        size={
                                                            23
                                                        }
                                                    />

                                                </div>

                                            </div>


                                            <p className="min-h-[72px] text-sm leading-6 text-slate-600">

                                                {
                                                    DESCRICOES_PLANOS[
                                                    nomePlano
                                                    ] ??
                                                    oferta
                                                        .plano
                                                        .descricao ??
                                                    ""
                                                }

                                            </p>

                                        </div>


                                        {/* PREÃ‡O */}

                                        <div className="mb-6 rounded-2xl bg-slate-50 p-5">

                                            <div className="flex items-end gap-2">

                                                {isPlanoAtual &&
                                                    assinaturaGratuita ? (

                                                    <>
                                                        <span className="text-4xl font-black tracking-tight text-slate-950">
                                                            GrÃ¡tis
                                                        </span>

                                                        <span className="pb-1 text-sm text-slate-500">
                                                            perÃ­odo atual
                                                        </span>
                                                    </>

                                                ) : (

                                                    <>
                                                        <span className="text-4xl font-black tracking-tight text-slate-950">

                                                            {formatarPreco(
                                                                isPlanoAtual
                                                                    ? precoAtual
                                                                    : oferta.preco_recorrente
                                                            )}

                                                        </span>

                                                        <span className="pb-1 text-sm text-slate-500">

                                                            {formatarPeriodo(
                                                                isPlanoAtual &&
                                                                    assinatura?.periodo_recorrente_contratado
                                                                    ? assinatura
                                                                        .periodo_recorrente_contratado
                                                                    : oferta.periodo_recorrente
                                                            )}

                                                        </span>
                                                    </>

                                                )}

                                            </div>


                                            {isCrescimento && (
                                                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600">

                                                    <Zap
                                                        size={
                                                            14
                                                        }
                                                        className="fill-amber-500"
                                                    />

                                                    Melhor equilÃ­brio entre preÃ§o e recursos

                                                </div>
                                            )}


                                            {isSemente &&
                                                oferta.gratuito &&
                                                !isPlanoAtual && (
                                                    <p className="mt-2 text-sm font-semibold text-green-600">

                                                        Depois dos{" "}

                                                        {
                                                            oferta
                                                                .duracao_gratuita_dias
                                                        }{" "}
                                                        dias:{" "}

                                                        {
                                                            formatarPreco(
                                                                oferta
                                                                    .preco_recorrente
                                                            )
                                                        }

                                                        {
                                                            formatarPeriodo(
                                                                oferta
                                                                    .periodo_recorrente
                                                            )
                                                        }

                                                    </p>
                                                )}


                                            {isPlanoAtual && (
                                                <div className="mt-4 border-t border-slate-200 pt-4">

                                                    <p className="text-xs font-medium text-slate-500">
                                                        Vencimento
                                                    </p>

                                                    <p className="mt-1 text-sm font-black text-slate-900">

                                                        {
                                                            formatarData(
                                                                vencimentoAtual
                                                            )
                                                        }

                                                    </p>

                                                </div>
                                            )}

                                        </div>


                                        {/* CTA */}

                                        {mostrarBotao && (
                                            <button
                                                type="button"
                                                disabled={
                                                    checkoutLoading
                                                }
                                                onClick={() => {

                                                    // SEMENTE PAGO durante perÃ­odo gratuito
                                                    if (
                                                        isSemente &&
                                                        assinaturaGratuita &&
                                                        ofertaSementePaga
                                                    ) {
                                                        void iniciarCheckout(
                                                            ofertaSementePaga.id
                                                        );

                                                        return;
                                                    }

                                                    // Qualquer outro plano pago
                                                    if (
                                                        !oferta.gratuito &&
                                                        oferta.id
                                                    ) {
                                                        void iniciarCheckout(
                                                            oferta.id
                                                        );

                                                        return;
                                                    }

                                                    // Semente gratuito
                                                    // Aqui nÃ£o abrimos o Mercado Pago.
                                                    // O fluxo gratuito deverÃ¡ ser tratado separadamente.
                                                    if (
                                                        isSemente &&
                                                        oferta.gratuito
                                                    ) {
                                                        console.log(
                                                            "[PLANOS] Selecionado Semente gratuito:",
                                                            oferta.id
                                                        );

                                                        return;
                                                    }

                                                }}
                                                className={[
                                                    "mb-7 w-full rounded-xl px-5 py-3.5 text-sm font-bold transition",
                                                    botaoClasse,

                                                    checkoutLoading
                                                        ? "cursor-not-allowed opacity-60"
                                                        : "",
                                                ].join(" ")}
                                            >

                                                {checkoutLoading &&
                                                    isSemente &&
                                                    assinaturaGratuita ? (
                                                    "Abrindo pagamento..."
                                                ) : (
                                                    textoBotao
                                                )}

                                            </button>
                                        )}


                                        {!mostrarBotao && (
                                            <div className="mb-7 flex min-h-[50px] items-center justify-center rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-center text-sm font-bold text-green-700">

                                                Seu plano atual

                                            </div>
                                        )}


                                        {/* LIMITES */}

                                        <div className="mb-6">

                                            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                                                Limites do plano
                                            </p>


                                            <div className="space-y-3">

                                                <div className="flex items-center justify-between gap-4 text-sm">

                                                    <span className="text-slate-600">
                                                        Pessoas
                                                    </span>

                                                    <strong className="text-slate-900">

                                                        {
                                                            formatarLimite(
                                                                plano
                                                                    .limites
                                                                    .max_pessoas
                                                            )
                                                        }

                                                    </strong>

                                                </div>


                                                <div className="flex items-center justify-between gap-4 text-sm">

                                                    <span className="text-slate-600">
                                                        Classes
                                                    </span>

                                                    <strong className="text-slate-900">

                                                        {
                                                            formatarLimite(
                                                                plano
                                                                    .limites
                                                                    .max_classes
                                                            )
                                                        }

                                                    </strong>

                                                </div>


                                                <div className="flex items-center justify-between gap-4 text-sm">

                                                    <span className="text-slate-600">
                                                        Professores
                                                    </span>

                                                    <strong className="text-slate-900">

                                                        {
                                                            formatarLimite(
                                                                plano
                                                                    .limites
                                                                    .max_professores
                                                            )
                                                        }

                                                    </strong>

                                                </div>


                                                <div className="flex items-center justify-between gap-4 text-sm">

                                                    <span className="text-slate-600">
                                                        Superintendentes
                                                    </span>

                                                    <strong className="text-slate-900">

                                                        {
                                                            formatarLimite(
                                                                plano
                                                                    .limites
                                                                    .max_superintendentes
                                                            )
                                                        }

                                                    </strong>

                                                </div>


                                                <div className="flex items-center justify-between gap-4 text-sm">

                                                    <span className="text-slate-600">
                                                        Trimestres
                                                    </span>

                                                    <strong className="text-slate-900">

                                                        {
                                                            formatarLimite(
                                                                plano
                                                                    .limites
                                                                    .max_trimestres
                                                            )
                                                        }

                                                    </strong>

                                                </div>

                                            </div>

                                        </div>


                                        {/* RECURSOS */}

                                        <div className="flex-1 border-t border-slate-100 pt-6">

                                            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
                                                Recursos incluÃ­dos
                                            </p>


                                            <div className="space-y-3">

                                                {recursosExibicao.map(
                                                    (
                                                        recurso
                                                    ) => {

                                                        const isNotificacao =
                                                            recurso ===
                                                            "NotificaÃ§Ãµes automÃ¡ticas";


                                                        const isCheckin =
                                                            recurso ===
                                                            "Check-in por geolocalizaÃ§Ã£o";


                                                        const isDashboardAvancado =
                                                            recurso ===
                                                            "Dashboard AvanÃ§ado";


                                                        const isRelatorios =
                                                            recurso ===
                                                            "RelatÃ³rios";


                                                        return (
                                                            <div
                                                                key={
                                                                    recurso
                                                                }
                                                                className={[
                                                                    "flex items-center gap-3 text-sm",

                                                                    isNotificacao ||
                                                                        isCheckin ||
                                                                        isDashboardAvancado ||
                                                                        isRelatorios
                                                                        ? "font-semibold text-slate-900"
                                                                        : "text-slate-600",
                                                                ].join(" ")}
                                                            >

                                                                {isNotificacao ? (

                                                                    <Bell
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="shrink-0 text-blue-600"
                                                                    />

                                                                ) : isCheckin ? (

                                                                    <MapPin
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="shrink-0 text-blue-600"
                                                                    />

                                                                ) : isDashboardAvancado ? (

                                                                    <Sparkles
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="shrink-0 text-purple-600"
                                                                    />

                                                                ) : (

                                                                    <Check
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="shrink-0 text-green-600"
                                                                    />

                                                                )}

                                                                <span>
                                                                    {
                                                                        recurso
                                                                    }
                                                                </span>

                                                            </div>
                                                        );
                                                    }
                                                )}

                                            </div>

                                        </div>

                                    </motion.div>
                                );
                            }
                        )}

                </div>

            </section>


            {/* ================================================= */}
            {/* FECHAMENTO */}
            {/* ================================================= */}

            <section className="border-t border-slate-200 bg-white px-4 py-14 sm:px-6">

                <div className="mx-auto max-w-3xl text-center">

                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">

                        <Crown
                            size={27}
                        />

                    </div>


                    <h2 className="text-3xl font-black tracking-tight text-slate-950">

                        NÃ£o espere sua igreja crescer

                        <br className="hidden sm:block" />

                        para organizar melhor.

                    </h2>


                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">

                        Escolha hoje uma estrutura que permita
                        sua EBD crescer sem precisar trocar de sistema
                        amanhÃ£.

                    </p>

                </div>

            </section>

        </div>
    );
}