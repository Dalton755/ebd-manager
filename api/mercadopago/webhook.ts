import type {
    VercelRequest,
    VercelResponse,
} from "@vercel/node";

import {
    WebhookSignatureValidator,
} from "mercadopago";

import {
    createClient,
} from "@supabase/supabase-js";


const MERCADO_PAGO_ACCESS_TOKEN =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

const MERCADO_PAGO_WEBHOOK_SECRET =
    process.env.MERCADOPAGO_WEBHOOK_SECRET;

const SUPABASE_URL =
    process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


function responder(
    res: VercelResponse,
    status: number,
    body: unknown
) {

    return res
        .status(status)
        .json(body);

}


function criarSupabaseAdmin() {

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        throw new Error(
            "Credenciais do Supabase nÃ£o configuradas."
        );

    }


    return createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

}


/* =====================================================
   VALIDA ASSINATURA DO WEBHOOK
===================================================== */

function validarAssinaturaWebhook(
    req: VercelRequest
): boolean {

    const xSignature =
        req.headers["x-signature"];

    const xRequestId =
        req.headers["x-request-id"];

    const dataIdRaw =
        req.query["data.id"];

    const dataId =
        Array.isArray(dataIdRaw)
            ? dataIdRaw[0]
            : dataIdRaw;

    const signature =
        Array.isArray(xSignature)
            ? xSignature[0]
            : xSignature;

    const requestId =
        Array.isArray(xRequestId)
            ? xRequestId[0]
            : xRequestId;


    if (
        !signature ||
        !requestId ||
        !dataId ||
        !MERCADO_PAGO_WEBHOOK_SECRET
    ) {

        console.warn(
            "Dados necessÃ¡rios para validar webhook nÃ£o encontrados.",
            {
                possuiSignature: Boolean(signature),
                possuiRequestId: Boolean(requestId),
                possuiDataId: Boolean(dataId),
                possuiSecret: Boolean(MERCADO_PAGO_WEBHOOK_SECRET),
            }
        );

        return false;

    }


    try {

        WebhookSignatureValidator.validate({
            xSignature: String(signature),
            xRequestId: String(requestId),
            dataId: String(dataId),
            secret: MERCADO_PAGO_WEBHOOK_SECRET,
        });

        return true;

    } catch (error) {

        console.warn(
            "Falha na validaÃ§Ã£o da assinatura Mercado Pago:",
            error
        );

        return false;

    }

}


/* =====================================================
   MERCADO PAGO
===================================================== */

async function buscarAssinaturaMercadoPago(
    preapprovalId: string
) {

    if (
        !MERCADO_PAGO_ACCESS_TOKEN
    ) {

        throw new Error(
            "MERCADOPAGO_ACCESS_TOKEN nÃ£o configurado."
        );

    }


    const resposta =
        await fetch(
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    "Content-Type":
                        "application/json",
                },
            }
        );


    const dados =
        await resposta.json();


    if (
        !resposta.ok
    ) {

        console.error(
            "Erro ao consultar assinatura Mercado Pago:",
            resposta.status,
            dados
        );

        throw new Error(
            "Falha ao consultar assinatura no Mercado Pago."
        );

    }


    return dados;

}


function statusAssinaturaMercadoPagoCancelada(
    status: unknown
): boolean {

    const statusNormalizado =
        String(status ?? "")
            .trim()
            .toLowerCase();


    return (
        statusNormalizado === "canceled" ||
        statusNormalizado === "cancelled"
    );

}


function erroStatusCancelamentoInvalido(
    dados: any,
    statusTentado: string
): boolean {

    const mensagem =
        String(
            dados?.message ??
            ""
        )
            .trim()
            .toLowerCase();


    return (
        mensagem.includes(
            "invalid preapproval status param"
        ) &&
        mensagem.includes(
            statusTentado
                .trim()
                .toLowerCase()
        )
    );

}


async function enviarCancelamentoAssinaturaMercadoPago(
    preapprovalId: string,
    reason: string,
    statusCancelamento: "canceled" | "cancelled"
) {

    const resposta =
        await fetch(
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    "Content-Type":
                        "application/json",
                },
                body:
                    JSON.stringify({
                        reason,
                        status:
                            statusCancelamento,
                    }),
            }
        );


    let dados: any = null;


    try {

        dados =
            await resposta.json();

    } catch {

        dados = null;

    }


    return {
        ok:
            resposta.ok &&
            statusAssinaturaMercadoPagoCancelada(
                dados?.status
            ),
        statusHttp:
            resposta.status,
        dados,
        statusTentado:
            statusCancelamento,
    };

}


async function cancelarAssinaturaMercadoPago(
    preapprovalId: string
) {

    if (
        !MERCADO_PAGO_ACCESS_TOKEN
    ) {

        throw new Error(
            "MERCADOPAGO_ACCESS_TOKEN não configurado."
        );

    }


    let assinaturaMP: any = null;


    try {

        assinaturaMP =
            await buscarAssinaturaMercadoPago(
                preapprovalId
            );

    } catch (error) {

        return {
            ok: false,
            statusHttp: null,
            dados: null,
            jaCancelada: false,
            statusTentado: null,
            erro:
                error instanceof Error
                    ? error.message
                    : String(error),
        };

    }


    if (
        statusAssinaturaMercadoPagoCancelada(
            assinaturaMP?.status
        )
    ) {

        return {
            ok: true,
            statusHttp: 200,
            dados: assinaturaMP,
            jaCancelada: true,
            statusTentado: null,
            erro: null,
        };

    }


    const reason =
        typeof assinaturaMP?.reason === "string" &&
        assinaturaMP.reason.trim()
            ? assinaturaMP.reason.trim()
            : "EBD Manager";


    const primeiraTentativa =
        await enviarCancelamentoAssinaturaMercadoPago(
            preapprovalId,
            reason,
            "cancelled"
        );


    if (
        primeiraTentativa.ok
    ) {

        return {
            ...primeiraTentativa,
            jaCancelada: false,
            erro: null,
        };

    }


    const deveTentarStatusLegado =
        primeiraTentativa.statusHttp === 400 &&
        erroStatusCancelamentoInvalido(
            primeiraTentativa.dados,
            "cancelled"
        );


    if (
        deveTentarStatusLegado
    ) {

        console.warn(
            "Mercado Pago recusou status cancelled. Tentando fallback canceled:",
            {
                preapprovalId,
                statusHttp:
                    primeiraTentativa.statusHttp,
                resposta:
                    primeiraTentativa.dados,
            }
        );


        const segundaTentativa =
            await enviarCancelamentoAssinaturaMercadoPago(
                preapprovalId,
                reason,
                "canceled"
            );


        return {
            ...segundaTentativa,
            jaCancelada: false,
            erro:
                segundaTentativa.ok
                    ? null
                    : segundaTentativa.dados?.message ??
                        `HTTP ${segundaTentativa.statusHttp}`,
        };

    }


    return {
        ...primeiraTentativa,
        jaCancelada: false,
        erro:
            primeiraTentativa.dados?.message ??
            `HTTP ${primeiraTentativa.statusHttp}`,
    };

}


async function buscarPagamentoMercadoPago(
    paymentId: string
) {

    if (
        !MERCADO_PAGO_ACCESS_TOKEN
    ) {

        throw new Error(
            "MERCADOPAGO_ACCESS_TOKEN nÃ£o configurado."
        );

    }


    const resposta =
        await fetch(
            `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    "Content-Type":
                        "application/json",
                },
            }
        );


    const dados =
        await resposta.json();


    return {
        ok: resposta.ok,
        statusHttp: resposta.status,
        dados,
    };

}


async function buscarPagamentoAutorizadoMercadoPago(
    authorizedPaymentId: string
) {

    if (
        !MERCADO_PAGO_ACCESS_TOKEN
    ) {

        throw new Error(
            "MERCADOPAGO_ACCESS_TOKEN nÃ£o configurado."
        );

    }


    const resposta =
        await fetch(
            `https://api.mercadopago.com/authorized_payments/${encodeURIComponent(authorizedPaymentId)}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    "Content-Type":
                        "application/json",
                },
            }
        );


    const dados =
        await resposta.json();


    return {
        ok: resposta.ok,
        statusHttp: resposta.status,
        dados,
    };

}


function mapearStatusPagamentoMercadoPago(
    statusMP: unknown,
    statusDetailMP?: unknown
) {

    const status =
        String(statusMP ?? "")
            .trim()
            .toLowerCase();

    const statusDetail =
        String(statusDetailMP ?? "")
            .trim()
            .toLowerCase();


    switch (
        status
    ) {

        case "approved":
            return "APROVADO";

        case "rejected":
            return "RECUSADO";

        case "cancelled":
        case "canceled":
            return "CANCELADO";

        case "refunded":
            return "ESTORNADO";

        case "charged_back":

            /*
             * Mercado Pago:
             *
             * in_process  -> contestação em análise.
             * reimbursed  -> decisão favorável ao vendedor.
             * settled     -> decisão contra o vendedor.
             *
             * Durante a análise mantemos o pagamento como aprovado
             * para não derrubar acesso antes da decisão final.
             */

            if (
                statusDetail ===
                "settled"
            ) {

                return "ESTORNADO";

            }


            if (
                statusDetail ===
                "reimbursed"
            ) {

                return "APROVADO";

            }


            return "APROVADO";

        default:
            return "PENDENTE";

    }

}


function pagamentoFoiEstornadoDefinitivamente(
    pagamentoMP: any
): boolean {

    const status =
        String(
            pagamentoMP?.status ??
            ""
        )
            .trim()
            .toLowerCase();

    const statusDetail =
        String(
            pagamentoMP?.status_detail ??
            ""
        )
            .trim()
            .toLowerCase();


    if (
        status ===
        "refunded"
    ) {

        return true;

    }


    return (
        status ===
        "charged_back" &&
        statusDetail ===
        "settled"
    );

}


const DIAS_CARENCIA_RENOVACAO =
    10;


function calcularCarenciaAte(
    fimEm: string | null
): string | null {

    if (
        !fimEm
    ) {

        return null;

    }


    const fim =
        new Date(
            fimEm
        );


    if (
        Number.isNaN(
            fim.getTime()
        )
    ) {

        return null;

    }


    const carencia =
        new Date(
            fim
        );


    carencia.setUTCDate(
        carencia.getUTCDate() +
        DIAS_CARENCIA_RENOVACAO
    );


    return carencia
        .toISOString();

}


async function aplicarCarenciaRenovacao(
    supabase: any,
    assinaturaId: string
) {

    const {
        data: assinatura,
        error: assinaturaError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                id,
                status,
                fim_em,
                gratuito_contratado,
                preco_recorrente_contratado,
                carencia_ate
            `)
            .eq(
                "id",
                assinaturaId
            )
            .maybeSingle();


    if (
        assinaturaError
    ) {

        throw assinaturaError;

    }


    if (
        !assinatura
    ) {

        return {
            fimEm: null,
            carenciaAte: null,
        };

    }


    if (
        assinatura.status !==
        "ATIVA"
    ) {

        console.warn(
            "Carência não aplicada porque a assinatura EBD não está ativa:",
            {
                assinaturaId,
                status:
                    assinatura.status,
            }
        );

        return {
            fimEm:
                assinatura.fim_em ??
                null,
            carenciaAte:
                assinatura.carencia_ate ??
                null,
        };

    }


    if (
        assinatura.gratuito_contratado ===
        true
    ) {

        return {
            fimEm:
                assinatura.fim_em ??
                null,
            carenciaAte:
                assinatura.carencia_ate ??
                null,
        };

    }


    if (
        assinatura
            .preco_recorrente_contratado ==
        null
    ) {

        return {
            fimEm:
                assinatura.fim_em ??
                null,
            carenciaAte:
                assinatura.carencia_ate ??
                null,
        };

    }


    const carenciaAte =
        calcularCarenciaAte(
            assinatura.fim_em ??
            null
        );


    if (
        !carenciaAte
    ) {

        console.warn(
            "Não foi possível calcular carência para renovação recusada:",
            {
                assinaturaId,
                fimEm:
                    assinatura.fim_em ??
                    null,
            }
        );

        return {
            fimEm:
                assinatura.fim_em ??
                null,
            carenciaAte: null,
        };

    }


    const {
        error: atualizarCarenciaError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .update({
                carencia_ate:
                    carenciaAte,
                updated_at:
                    new Date()
                        .toISOString(),
            })
            .eq(
                "id",
                assinaturaId
            );


    if (
        atualizarCarenciaError
    ) {

        throw atualizarCarenciaError;

    }


    console.log(
        "CARÊNCIA DE RENOVAÇÃO APLICADA:",
        {
            assinaturaId,
            fimEm:
                assinatura.fim_em,
            carenciaAte,
        }
    );


    return {
        fimEm:
            assinatura.fim_em ??
            null,
        carenciaAte,
    };

}


/* =====================================================
   ASSINATURA EBD
===================================================== */

async function sincronizarVencimentoAssinatura(
    supabase: any,
    assinaturaId: string,
    preapprovalId: string
) {

    const {
        data: assinaturaEbd,
        error: assinaturaEbdError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                id,
                status
            `)
            .eq(
                "id",
                assinaturaId
            )
            .maybeSingle();


    if (
        assinaturaEbdError
    ) {

        throw assinaturaEbdError;

    }


    if (
        !assinaturaEbd ||
        assinaturaEbd.status !==
        "ATIVA"
    ) {

        console.warn(
            "Vencimento não sincronizado porque a assinatura EBD não está ativa:",
            {
                assinaturaId,
                preapprovalId,
                status:
                    assinaturaEbd?.status ??
                    null,
            }
        );

        return {
            assinaturaMP: null,
            novoFimEm: null,
        };

    }


    const assinaturaMP =
        await buscarAssinaturaMercadoPago(
            preapprovalId
        );


    /* =================================================
       NÃO REATIVA ASSINATURA CANCELADA/PAUSADA NO MP
    ================================================= */

    if (
        assinaturaMP?.status !==
        "authorized"
    ) {

        console.warn(
            "Vencimento nÃ£o sincronizado porque a assinatura Mercado Pago nÃ£o estÃ¡ autorizada:",
            {
                assinaturaId,
                preapprovalId,
                status:
                    assinaturaMP?.status ??
                    null,
            }
        );

        return {
            assinaturaMP,
            novoFimEm: null,
        };

    }


    const novoFimEm =
        assinaturaMP?.next_payment_date ??
        null;


    if (
        !novoFimEm
    ) {

        console.warn(
            "Assinatura Mercado Pago sem next_payment_date:",
            {
                assinaturaId,
                preapprovalId,
            }
        );

        return {
            assinaturaMP,
            novoFimEm: null,
        };

    }


    const {
        error: atualizarAssinaturaError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .update({
                status: "ATIVA",
                fim_em: novoFimEm,
                carencia_ate: null,
                mercado_pago_preapproval_id:
                    preapprovalId,
                renovacao_automatica:
                    true,
                cancelamento_provedor_pendente:
                    false,
                cancelamento_provedor_em:
                    null,
                cancelamento_provedor_erro:
                    null,
                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                assinaturaId
            );


    if (
        atualizarAssinaturaError
    ) {

        console.error(
            "Erro ao atualizar vencimento da assinatura:",
            atualizarAssinaturaError
        );

        throw new Error(
            "Erro ao atualizar vencimento da assinatura."
        );

    }


    return {
        assinaturaMP,
        novoFimEm,
    };

}


async function ativarPlano(
    pagamento: any,
    assinaturaMP: any
) {

    const supabase =
        criarSupabaseAdmin();


    /* =================================================
       PROTEÇÃO CONTRA DUPLICIDADE
    ================================================= */

    if (
        pagamento.assinatura_id
    ) {

        console.log(
            "Pagamento já possui assinatura:",
            pagamento.assinatura_id
        );

        return {
            assinaturaId:
                pagamento.assinatura_id,
            nova:
                false,
        };

    }


    const novoPreapprovalId =
        String(
            assinaturaMP?.id ??
            pagamento
                ?.mercado_pago_preapproval_id ??
            ""
        ).trim() || null;


    if (
        !novoPreapprovalId
    ) {

        throw new Error(
            "Assinatura paga sem preapproval_id do Mercado Pago."
        );

    }


    /* =================================================
       DATAS
    ================================================= */

    const inicioEm =
        assinaturaMP?.date_created ??
        new Date().toISOString();

    const fimEm =
        assinaturaMP?.next_payment_date ??
        null;


    if (
        !fimEm
    ) {

        console.error(
            "Assinatura Mercado Pago autorizada sem next_payment_date:",
            {
                preapprovalId:
                    novoPreapprovalId,
                pagamentoId:
                    pagamento?.id ??
                    null,
            }
        );

        throw new Error(
            "Assinatura paga autorizada sem data de próximo vencimento."
        );

    }


    /* =================================================
       BUSCA ASSINATURA ATUAL
    ================================================= */

    const {
        data: assinaturaAtual,
        error: assinaturaAtualError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                id,
                plano_id,
                status,
                inicio_em,
                fim_em,
                gratuito_contratado,
                mercado_pago_preapproval_id,
                renovacao_automatica,
                cancelamento_provedor_pendente
            `)
            .eq(
                "igreja_id",
                pagamento.igreja_id
            )
            .eq(
                "status",
                "ATIVA"
            )
            .order(
                "inicio_em",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();


    if (
        assinaturaAtualError
    ) {

        console.error(
            "Erro ao buscar assinatura atual:",
            assinaturaAtualError
        );

        throw new Error(
            "Erro ao buscar assinatura atual."
        );

    }


    /* =================================================
       MESMO PREAPPROVAL JÁ ESTÁ ATIVO
       APENAS VINCULA O PAGAMENTO AO REGISTRO EXISTENTE
    ================================================= */

    if (
        assinaturaAtual?.mercado_pago_preapproval_id &&
        assinaturaAtual
            .mercado_pago_preapproval_id ===
        novoPreapprovalId
    ) {

        const agora =
            new Date().toISOString();


        const {
            error: pagamentoVinculoError,
        } =
            await supabase
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .update({
                    assinatura_id:
                        assinaturaAtual.id,
                    status:
                        "APROVADO",
                    pago_em:
                        pagamento.pago_em ??
                        agora,
                    vencimento_em:
                        fimEm,
                    atualizado_em:
                        agora,
                })
                .eq(
                    "id",
                    pagamento.id
                );


        if (
            pagamentoVinculoError
        ) {

            throw pagamentoVinculoError;

        }


        await supabase
            .schema("ebd")
            .from("assinaturas")
            .update({
                fim_em:
                    fimEm,
                carencia_ate:
                    null,
                renovacao_automatica:
                    true,
                cancelamento_provedor_pendente:
                    false,
                cancelamento_provedor_em:
                    null,
                cancelamento_provedor_erro:
                    null,
                updated_at:
                    agora,
            })
            .eq(
                "id",
                assinaturaAtual.id
            );


        console.log(
            "PREAPPROVAL JÁ VINCULADO À ASSINATURA ATIVA:",
            {
                assinaturaId:
                    assinaturaAtual.id,
                preapprovalId:
                    novoPreapprovalId,
                pagamentoId:
                    pagamento.id,
            }
        );


        return {
            assinaturaId:
                assinaturaAtual.id,
            nova:
                false,
        };

    }


    /* =================================================
       FECHA ASSINATURA ANTERIOR NO EBD
    ================================================= */

    if (
        assinaturaAtual
    ) {

        const agora =
            new Date().toISOString();


        const {
            error: fecharError,
        } =
            await supabase
                .schema("ebd")
                .from("assinaturas")
                .update({
                    status:
                        "ENCERRADA",
                    fim_em:
                        agora,
                    carencia_ate:
                        null,
                    renovacao_automatica:
                        false,
                    updated_at:
                        agora,
                })
                .eq(
                    "id",
                    assinaturaAtual.id
                );


        if (
            fecharError
        ) {

            console.error(
                "Erro ao encerrar assinatura anterior:",
                fecharError
            );

            throw new Error(
                "Não foi possível encerrar a assinatura anterior."
            );

        }


        console.log(
            "Assinatura anterior encerrada:",
            assinaturaAtual.id
        );


        /* =============================================
           CANCELA RECORRÊNCIA ANTERIOR NO MERCADO PAGO
           FALHA NÃO IMPEDE A ATIVAÇÃO DO NOVO PLANO
        ============================================= */

        const preapprovalAnterior =
            assinaturaAtual
                .mercado_pago_preapproval_id
                ? String(
                    assinaturaAtual
                        .mercado_pago_preapproval_id
                )
                : null;


        if (
            preapprovalAnterior &&
            preapprovalAnterior !==
            novoPreapprovalId &&
            assinaturaAtual
                .gratuito_contratado !==
            true
        ) {

            let cancelamento: any;


            try {

                cancelamento =
                    await cancelarAssinaturaMercadoPago(
                        preapprovalAnterior
                    );

            } catch (error) {

                cancelamento = {
                    ok: false,
                    statusHttp: null,
                    dados: null,
                    erro:
                        error instanceof Error
                            ? error.message
                            : String(error),
                };

            }


            if (
                cancelamento.ok
            ) {

                await supabase
                    .schema("ebd")
                    .from("assinaturas")
                    .update({
                        renovacao_automatica:
                            false,
                        cancelamento_provedor_pendente:
                            false,
                        cancelamento_provedor_em:
                            new Date()
                                .toISOString(),
                        cancelamento_provedor_erro:
                            null,
                        updated_at:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "id",
                        assinaturaAtual.id
                    );


                console.log(
                    "RECORRÊNCIA ANTERIOR CANCELADA NO MERCADO PAGO:",
                    {
                        assinaturaId:
                            assinaturaAtual.id,
                        preapprovalId:
                            preapprovalAnterior,
                    }
                );

            } else {

                const erroCancelamento =
                    JSON.stringify({
                        statusHttp:
                            cancelamento
                                .statusHttp ??
                            null,
                        mensagem:
                            cancelamento
                                .erro ??
                            cancelamento
                                .dados
                                ?.message ??
                            "Falha desconhecida ao cancelar recorrência.",
                    }).slice(0, 2000);


                await supabase
                    .schema("ebd")
                    .from("assinaturas")
                    .update({
                        cancelamento_provedor_pendente:
                            true,
                        cancelamento_provedor_em:
                            null,
                        cancelamento_provedor_erro:
                            erroCancelamento,
                        updated_at:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "id",
                        assinaturaAtual.id
                    );


                console.error(
                    "FALHA AO CANCELAR RECORRÊNCIA ANTERIOR NO MERCADO PAGO:",
                    {
                        assinaturaId:
                            assinaturaAtual.id,
                        preapprovalId:
                            preapprovalAnterior,
                        statusHttp:
                            cancelamento
                                .statusHttp ??
                            null,
                        erro:
                            erroCancelamento,
                    }
                );

            }

        } else {

            await supabase
                .schema("ebd")
                .from("assinaturas")
                .update({
                    renovacao_automatica:
                        false,
                    cancelamento_provedor_pendente:
                        false,
                    cancelamento_provedor_erro:
                        null,
                    updated_at:
                        new Date()
                            .toISOString(),
                })
                .eq(
                    "id",
                    assinaturaAtual.id
                );

        }

    }


    /* =================================================
       CRIA NOVA ASSINATURA
    ================================================= */

    const {
        data: novaAssinatura,
        error: novaAssinaturaError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .insert({
                igreja_id:
                    pagamento.igreja_id,
                plano_id:
                    pagamento.plano_id,
                oferta_id:
                    pagamento.oferta_id,
                status:
                    "ATIVA",
                inicio_em:
                    inicioEm,
                fim_em:
                    fimEm,
                carencia_ate:
                    null,
                preco_contratado:
                    pagamento.valor,
                gratuito_contratado:
                    false,
                duracao_gratuita_contratada_dias:
                    0,
                preco_recorrente_contratado:
                    pagamento.valor,
                periodo_recorrente_contratado:
                    pagamento.periodo,
                mercado_pago_preapproval_id:
                    novoPreapprovalId,
                renovacao_automatica:
                    true,
                cancelamento_provedor_pendente:
                    false,
                cancelamento_provedor_em:
                    null,
                cancelamento_provedor_erro:
                    null,
            })
            .select("id")
            .single();


    if (
        novaAssinaturaError ||
        !novaAssinatura
    ) {

        console.error(
            "Erro ao criar assinatura:",
            novaAssinaturaError
        );

        throw new Error(
            "Não foi possível criar a assinatura no EBD."
        );

    }


    /* =================================================
       ATUALIZA PAGAMENTO
    ================================================= */

    const agora =
        new Date().toISOString();


    const {
        error: pagamentoUpdateError,
    } =
        await supabase
            .schema("ebd")
            .from("pagamentos_assinaturas")
            .update({
                assinatura_id:
                    novaAssinatura.id,
                status:
                    "APROVADO",
                pago_em:
                    agora,
                vencimento_em:
                    fimEm,
                atualizado_em:
                    agora,
            })
            .eq(
                "id",
                pagamento.id
            );


    if (
        pagamentoUpdateError
    ) {

        console.error(
            "Erro ao atualizar pagamento:",
            pagamentoUpdateError
        );

        throw new Error(
            "Assinatura criada, mas pagamento não foi atualizado."
        );

    }


    console.log(
        "PLANO ATIVADO COM SUCESSO:",
        {
            igrejaId:
                pagamento.igreja_id,
            planoId:
                pagamento.plano_id,
            assinaturaId:
                novaAssinatura.id,
            pagamentoId:
                pagamento.id,
            preapprovalId:
                novoPreapprovalId,
        }
    );


    return {
        assinaturaId:
            novaAssinatura.id,
        nova:
            true,
    };

}


/* =====================================================
   ESTORNO / CHARGEBACK DEFINITIVO
===================================================== */

async function tratarEstornoDefinitivo(
    supabase: any,
    pagamentoEbd: any,
    pagamentoMP: any,
    paymentId: string
) {

    if (
        !pagamentoEbd?.assinatura_id
    ) {

        console.warn(
            "ESTORNO recebido para pagamento ainda sem assinatura vinculada:",
            {
                paymentId,
                pagamentoId:
                    pagamentoEbd?.id ??
                    null,
            }
        );


        return {
            tratado: true,
            assinaturaAlterada: false,
            motivo:
                "Pagamento sem assinatura vinculada.",
        };

    }


    const assinaturaId =
        String(
            pagamentoEbd.assinatura_id
        );


    const {
        data: assinatura,
        error: assinaturaError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                id,
                status,
                fim_em,
                carencia_ate,
                mercado_pago_preapproval_id,
                renovacao_automatica
            `)
            .eq(
                "id",
                assinaturaId
            )
            .maybeSingle();


    if (
        assinaturaError
    ) {

        throw assinaturaError;

    }


    if (
        !assinatura
    ) {

        return {
            tratado: true,
            assinaturaAlterada: false,
            motivo:
                "Assinatura EBD não encontrada.",
        };

    }


    /*
     * Se essa cobrança é histórica e já existe outra cobrança
     * APROVADA posterior para a mesma assinatura, o estorno não
     * deve derrubar o período mais recente que foi pago.
     */

    let pagamentoMaisNovo: any =
        null;


    if (
        pagamentoEbd?.criado_em
    ) {

        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .select(`
                    id,
                    mercado_pago_payment_id,
                    vencimento_em,
                    criado_em
                `)
                .eq(
                    "assinatura_id",
                    assinaturaId
                )
                .eq(
                    "status",
                    "APROVADO"
                )
                .gt(
                    "criado_em",
                    pagamentoEbd.criado_em
                )
                .order(
                    "criado_em",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (
            error
        ) {

            throw error;

        }


        pagamentoMaisNovo =
            data;

    }


    if (
        pagamentoMaisNovo
    ) {

        console.log(
            "ESTORNO HISTÓRICO: assinatura mantida porque existe cobrança aprovada posterior.",
            {
                paymentId,
                pagamentoId:
                    pagamentoEbd.id,
                assinaturaId,
                pagamentoPosteriorId:
                    pagamentoMaisNovo.id,
            }
        );


        return {
            tratado: true,
            assinaturaAlterada: false,
            motivo:
                "Existe cobrança aprovada posterior.",
            pagamentoPosteriorId:
                pagamentoMaisNovo.id,
        };

    }


    /*
     * Busca a última cobrança aprovada anterior ao pagamento
     * estornado. Seu vencimento representa até quando existe
     * período efetivamente pago.
     */

    let pagamentoAnterior: any =
        null;


    if (
        pagamentoEbd?.criado_em
    ) {

        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .select(`
                    id,
                    vencimento_em,
                    criado_em
                `)
                .eq(
                    "assinatura_id",
                    assinaturaId
                )
                .eq(
                    "status",
                    "APROVADO"
                )
                .lt(
                    "criado_em",
                    pagamentoEbd.criado_em
                )
                .order(
                    "criado_em",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (
            error
        ) {

            throw error;

        }


        pagamentoAnterior =
            data;

    }


    const agora =
        new Date();

    const agoraIso =
        agora.toISOString();


    const vencimentoAnterior =
        pagamentoAnterior
            ?.vencimento_em
            ? String(
                pagamentoAnterior
                    .vencimento_em
            )
            : null;


    const vencimentoAnteriorData =
        vencimentoAnterior
            ? new Date(
                vencimentoAnterior
            )
            : null;


    const vencimentoAnteriorValido =
        vencimentoAnteriorData &&
        !Number.isNaN(
            vencimentoAnteriorData
                .getTime()
        );


    const aindaExistePeriodoPago =
        Boolean(
            vencimentoAnteriorValido &&
            vencimentoAnteriorData!.getTime() >
            agora.getTime()
        );


    const novoFimEm =
        aindaExistePeriodoPago
            ? vencimentoAnterior
            : agoraIso;


    const novoStatus =
        aindaExistePeriodoPago
            ? "ATIVA"
            : "ENCERRADA";


    /*
     * Só tentamos cancelar a recorrência se o preapproval do
     * pagamento estornado é o mesmo que pertence à assinatura.
     */

    const preapprovalPagamento =
        pagamentoEbd
            ?.mercado_pago_preapproval_id
            ? String(
                pagamentoEbd
                    .mercado_pago_preapproval_id
            )
            : null;

    const preapprovalAssinatura =
        assinatura
            ?.mercado_pago_preapproval_id
            ? String(
                assinatura
                    .mercado_pago_preapproval_id
            )
            : null;


    let cancelamento: any =
        null;


    if (
        preapprovalPagamento &&
        preapprovalAssinatura &&
        preapprovalPagamento ===
        preapprovalAssinatura
    ) {

        try {

            cancelamento =
                await cancelarAssinaturaMercadoPago(
                    preapprovalAssinatura
                );

        } catch (error) {

            cancelamento = {
                ok: false,
                statusHttp: null,
                dados: null,
                erro:
                    error instanceof Error
                        ? error.message
                        : String(error),
            };

        }

    }


    const cancelamentoNecessario =
        Boolean(
            preapprovalPagamento &&
            preapprovalAssinatura &&
            preapprovalPagamento ===
            preapprovalAssinatura
        );


    const cancelamentoOk =
        !cancelamentoNecessario ||
        Boolean(
            cancelamento?.ok
        );


    const erroCancelamento =
        cancelamentoNecessario &&
        !cancelamentoOk
            ? JSON.stringify({
                statusHttp:
                    cancelamento
                        ?.statusHttp ??
                    null,
                mensagem:
                    cancelamento
                        ?.erro ??
                    cancelamento
                        ?.dados
                        ?.message ??
                    "Falha ao cancelar recorrência após estorno.",
            }).slice(0, 2000)
            : null;


    const atualizacaoAssinatura: any = {
        status:
            novoStatus,
        fim_em:
            novoFimEm,
        carencia_ate:
            null,
        renovacao_automatica:
            false,
        cancelamento_provedor_pendente:
            cancelamentoNecessario
                ? !cancelamentoOk
                : false,
        cancelamento_provedor_em:
            cancelamentoNecessario &&
            cancelamentoOk
                ? agoraIso
                : null,
        cancelamento_provedor_erro:
            erroCancelamento,
        updated_at:
            agoraIso,
    };


    const {
        error: atualizarAssinaturaError,
    } =
        await supabase
            .schema("ebd")
            .from("assinaturas")
            .update(
                atualizacaoAssinatura
            )
            .eq(
                "id",
                assinaturaId
            );


    if (
        atualizarAssinaturaError
    ) {

        throw atualizarAssinaturaError;

    }


    console.log(
        "ESTORNO DEFINITIVO PROCESSADO:",
        {
            paymentId,
            pagamentoId:
                pagamentoEbd.id,
            assinaturaId,
            novoStatus,
            novoFimEm,
            periodoPagoAnteriorMantido:
                aindaExistePeriodoPago,
            cancelamentoRecorrenciaNecessario:
                cancelamentoNecessario,
            cancelamentoRecorrenciaOk:
                cancelamentoOk,
        }
    );


    return {
        tratado: true,
        assinaturaAlterada: true,
        assinaturaId,
        novoStatus,
        novoFimEm,
        periodoPagoAnteriorMantido:
            aindaExistePeriodoPago,
        cancelamentoRecorrenciaNecessario:
            cancelamentoNecessario,
        cancelamentoRecorrenciaOk:
            cancelamentoOk,
        cancelamentoErro:
            erroCancelamento,
    };

}


/* =====================================================
   PROCESSA PAGAMENTO
===================================================== */

async function processarPagamentoMercadoPago(
    supabase: any,
    pagamentoMP: any,
    paymentId: string
) {

    const statusMP =
        String(
            pagamentoMP?.status ??
            ""
        );

    const statusEbd =
        mapearStatusPagamentoMercadoPago(
            statusMP,
            pagamentoMP?.status_detail
        );

    const agora =
        new Date().toISOString();


    /* =================================================
       IDEMPOTÊNCIA PELO PAYMENT_ID
    ================================================= */

    const {
        data: pagamentoExistente,
        error: pagamentoExistenteError,
    } =
        await supabase
            .schema("ebd")
            .from("pagamentos_assinaturas")
            .select("*")
            .eq(
                "mercado_pago_payment_id",
                paymentId
            )
            .maybeSingle();


    if (
        pagamentoExistenteError
    ) {

        throw pagamentoExistenteError;

    }


    if (
        pagamentoExistente
    ) {

        const atualizacao: any = {
            status:
                statusEbd,
            atualizado_em:
                agora,
            metadata: {
                ...(
                    pagamentoExistente
                        .metadata &&
                    typeof pagamentoExistente
                        .metadata ===
                        "object" &&
                    !Array.isArray(
                        pagamentoExistente
                            .metadata
                    )
                        ? pagamentoExistente
                            .metadata
                        : {}
                ),
                mercado_pago_status:
                    statusMP,
                mercado_pago_status_detail:
                    pagamentoMP?.status_detail ??
                    null,
                webhook_atualizado_em:
                    agora,
            },
        };


        if (
            statusEbd ===
            "APROVADO"
        ) {

            atualizacao.pago_em =
                pagamentoExistente.pago_em ??
                pagamentoMP?.date_approved ??
                agora;

        }


        const {
            error: atualizarExistenteError,
        } =
            await supabase
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .update(atualizacao)
                .eq(
                    "id",
                    pagamentoExistente.id
                );


        if (
            atualizarExistenteError
        ) {

            throw atualizarExistenteError;

        }


        let novoFimEm =
            pagamentoExistente.vencimento_em ??
            null;

        let carenciaAte =
            null;


        if (
            statusEbd === "APROVADO" &&
            pagamentoExistente.assinatura_id &&
            pagamentoExistente.mercado_pago_preapproval_id
        ) {

            const sincronizacao =
                await sincronizarVencimentoAssinatura(
                    supabase,
                    pagamentoExistente.assinatura_id,
                    pagamentoExistente.mercado_pago_preapproval_id
                );

            novoFimEm =
                sincronizacao.novoFimEm;


            if (
                novoFimEm
            ) {

                await supabase
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        vencimento_em:
                            novoFimEm,
                        atualizado_em:
                            agora,
                    })
                    .eq(
                        "id",
                        pagamentoExistente.id
                    );

            }

        }


        if (
            statusEbd === "RECUSADO" &&
            pagamentoExistente.tipo === "RENOVACAO" &&
            pagamentoExistente.assinatura_id
        ) {

            const carencia =
                await aplicarCarenciaRenovacao(
                    supabase,
                    pagamentoExistente.assinatura_id
                );

            carenciaAte =
                carencia.carenciaAte;

        }


        let estornoResultado: any =
            null;


        if (
            pagamentoFoiEstornadoDefinitivamente(
                pagamentoMP
            )
        ) {

            estornoResultado =
                await tratarEstornoDefinitivo(
                    supabase,
                    pagamentoExistente,
                    pagamentoMP,
                    paymentId
                );

        }


        console.log(
            "Webhook de pagamento duplicado tratado com idempotência:",
            {
                paymentId,
                pagamentoId:
                    pagamentoExistente.id,
                assinaturaId:
                    pagamentoExistente.assinatura_id,
                status:
                    statusEbd,
                carenciaAte,
            }
        );


        return {
            processado: true,
            duplicado: true,
            renovacao:
                pagamentoExistente.tipo ===
                "RENOVACAO",
            pagamentoId:
                pagamentoExistente.id,
            assinaturaId:
                pagamentoExistente.assinatura_id,
            status:
                statusEbd,
            vencimentoEm:
                novoFimEm,
            carenciaAte,
            estorno:
                estornoResultado,
        };

    }


    /* =================================================
       LOCALIZA REGISTRO BASE PELO EXTERNAL_REFERENCE
    ================================================= */

    const externalReference =
        pagamentoMP?.external_reference;


    if (
        !externalReference
    ) {

        return {
            processado: false,
            ignorado: true,
            motivo:
                "Pagamento sem external_reference.",
        };

    }


    const {
        data: pagamentoBase,
        error: pagamentoBaseError,
    } =
        await supabase
            .schema("ebd")
            .from("pagamentos_assinaturas")
            .select("*")
            .eq(
                "mercado_pago_external_reference",
                externalReference
            )
            .order(
                "criado_em",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();


    if (
        pagamentoBaseError
    ) {

        throw pagamentoBaseError;

    }


    if (
        !pagamentoBase
    ) {

        return {
            processado: false,
            ignorado: true,
            motivo:
                "Pagamento não pertence ao EBD Manager.",
        };

    }


    const preapprovalId =
        pagamentoBase
            .mercado_pago_preapproval_id
            ? String(
                pagamentoBase
                    .mercado_pago_preapproval_id
            )
            : null;


    /* =================================================
       PRIMEIRA COBRANÇA
       O REGISTRO ORIGINAL AINDA NÃO TEM PAYMENT_ID
    ================================================= */

    if (
        !pagamentoBase.mercado_pago_payment_id
    ) {

        const atualizacaoInicial: any = {
            status:
                statusEbd,
            mercado_pago_payment_id:
                paymentId,
            atualizado_em:
                agora,
            metadata: {
                ...(
                    pagamentoBase
                        .metadata &&
                    typeof pagamentoBase
                        .metadata ===
                        "object" &&
                    !Array.isArray(
                        pagamentoBase
                            .metadata
                    )
                        ? pagamentoBase
                            .metadata
                        : {}
                ),
                mercado_pago_status:
                    statusMP,
                mercado_pago_status_detail:
                    pagamentoMP?.status_detail ??
                    null,
                webhook_atualizado_em:
                    agora,
            },
        };


        if (
            statusEbd ===
            "APROVADO"
        ) {

            atualizacaoInicial.pago_em =
                pagamentoMP?.date_approved ??
                agora;

        }


        const {
            error: atualizarInicialError,
        } =
            await supabase
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .update(atualizacaoInicial)
                .eq(
                    "id",
                    pagamentoBase.id
                );


        if (
            atualizarInicialError
        ) {

            throw atualizarInicialError;

        }


        let assinaturaId =
            pagamentoBase.assinatura_id ??
            null;

        let novoFimEm =
            pagamentoBase.vencimento_em ??
            null;


        if (
            statusEbd === "APROVADO" &&
            preapprovalId
        ) {

            const assinaturaMP =
                await buscarAssinaturaMercadoPago(
                    preapprovalId
                );


            if (
                !assinaturaId &&
                assinaturaMP?.status ===
                "authorized"
            ) {

                const resultado =
                    await ativarPlano(
                        {
                            ...pagamentoBase,
                            mercado_pago_payment_id:
                                paymentId,
                        },
                        assinaturaMP
                    );

                assinaturaId =
                    resultado.assinaturaId;

            }


            if (
                assinaturaId
            ) {

                const sincronizacao =
                    await sincronizarVencimentoAssinatura(
                        supabase,
                        assinaturaId,
                        preapprovalId
                    );

                novoFimEm =
                    sincronizacao.novoFimEm;


                await supabase
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        assinatura_id:
                            assinaturaId,
                        vencimento_em:
                            novoFimEm,
                        atualizado_em:
                            agora,
                    })
                    .eq(
                        "id",
                        pagamentoBase.id
                    );

            }

        }


        let estornoResultado: any =
            null;


        if (
            pagamentoFoiEstornadoDefinitivamente(
                pagamentoMP
            )
        ) {

            estornoResultado =
                await tratarEstornoDefinitivo(
                    supabase,
                    {
                        ...pagamentoBase,
                        assinatura_id:
                            assinaturaId,
                        mercado_pago_payment_id:
                            paymentId,
                    },
                    pagamentoMP,
                    paymentId
                );

        }


        console.log(
            "PRIMEIRA COBRANÇA PROCESSADA:",
            {
                paymentId,
                pagamentoId:
                    pagamentoBase.id,
                assinaturaId,
                status:
                    statusEbd,
                estorno:
                    estornoResultado,
            }
        );


        return {
            processado: true,
            duplicado: false,
            renovacao: false,
            pagamentoId:
                pagamentoBase.id,
            assinaturaId,
            status:
                statusEbd,
            vencimentoEm:
                novoFimEm,
            carenciaAte:
                null,
            estorno:
                estornoResultado,
        };

    }


    /* =================================================
       RENOVAÇÃO
       JÁ EXISTE UMA COBRANÇA ANTERIOR NO REGISTRO BASE
    ================================================= */

    let assinaturaId =
        pagamentoBase.assinatura_id ??
        null;

    let novoFimEm =
        null;

    let carenciaAte =
        null;


    if (
        statusEbd === "APROVADO" &&
        preapprovalId
    ) {

        if (
            !assinaturaId
        ) {

            const assinaturaMP =
                await buscarAssinaturaMercadoPago(
                    preapprovalId
                );


            if (
                assinaturaMP?.status ===
                "authorized"
            ) {

                const resultado =
                    await ativarPlano(
                        pagamentoBase,
                        assinaturaMP
                    );

                assinaturaId =
                    resultado.assinaturaId;

            }

        }


        if (
            assinaturaId
        ) {

            const sincronizacao =
                await sincronizarVencimentoAssinatura(
                    supabase,
                    assinaturaId,
                    preapprovalId
                );

            novoFimEm =
                sincronizacao.novoFimEm;

        }

    }


    if (
        statusEbd === "RECUSADO" &&
        assinaturaId
    ) {

        const carencia =
            await aplicarCarenciaRenovacao(
                supabase,
                assinaturaId
            );

        carenciaAte =
            carencia.carenciaAte;

    }


    const novoPagamento: any = {
        igreja_id:
            pagamentoBase.igreja_id,
        assinatura_id:
            assinaturaId,
        oferta_id:
            pagamentoBase.oferta_id,
        plano_id:
            pagamentoBase.plano_id,
        provedor:
            pagamentoBase.provedor,
        tipo:
            "RENOVACAO",
        status:
            statusEbd,
        valor:
            pagamentoMP?.transaction_amount ??
            pagamentoBase.valor,
        moeda:
            pagamentoMP?.currency_id ??
            pagamentoBase.moeda,
        periodo:
            pagamentoBase.periodo,
        mercado_pago_preapproval_id:
            preapprovalId,
        mercado_pago_payment_id:
            paymentId,
        mercado_pago_external_reference:
            externalReference,
        checkout_url:
            null,
        pago_em:
            statusEbd === "APROVADO"
                ? pagamentoMP?.date_approved ??
                    agora
                : null,
        vencimento_em:
            statusEbd === "APROVADO"
                ? novoFimEm
                : null,
        criado_em:
            agora,
        atualizado_em:
            agora,
        metadata: {
            origem:
                "WEBHOOK_MERCADO_PAGO",
            mercado_pago_status:
                statusMP,
            mercado_pago_status_detail:
                pagamentoMP?.status_detail ??
                null,
            carencia_ate:
                carenciaAte,
        },
    };


    const {
        data: pagamentoRenovacao,
        error: inserirRenovacaoError,
    } =
        await supabase
            .schema("ebd")
            .from("pagamentos_assinaturas")
            .insert(novoPagamento)
            .select("id")
            .single();


    if (
        inserirRenovacaoError
    ) {

        if (
            inserirRenovacaoError.code ===
            "23505"
        ) {

            console.log(
                "Renovação já registrada pelo payment_id:",
                paymentId
            );

            return {
                processado: true,
                duplicado: true,
                renovacao: true,
                pagamentoId: null,
                assinaturaId,
                status:
                    statusEbd,
                vencimentoEm:
                    novoFimEm,
                carenciaAte,
            };

        }


        console.error(
            "Erro ao registrar renovação:",
            inserirRenovacaoError
        );

        throw inserirRenovacaoError;

    }


    let estornoResultado: any =
        null;


    if (
        pagamentoFoiEstornadoDefinitivamente(
            pagamentoMP
        )
    ) {

        estornoResultado =
            await tratarEstornoDefinitivo(
                supabase,
                {
                    ...novoPagamento,
                    id:
                        pagamentoRenovacao.id,
                    assinatura_id:
                        assinaturaId,
                    criado_em:
                        agora,
                },
                pagamentoMP,
                paymentId
            );

    }


    console.log(
        "RENOVAÇÃO REGISTRADA COM SUCESSO:",
        {
            paymentId,
            pagamentoId:
                pagamentoRenovacao.id,
            assinaturaId,
            status:
                statusEbd,
            vencimentoEm:
                novoFimEm,
            carenciaAte,
            estorno:
                estornoResultado,
        }
    );


    return {
        processado: true,
        duplicado: false,
        renovacao: true,
        pagamentoId:
            pagamentoRenovacao.id,
        assinaturaId,
        status:
            statusEbd,
        vencimentoEm:
            novoFimEm,
        carenciaAte,
        estorno:
            estornoResultado,
    };

}


/* =====================================================
   HANDLER
===================================================== */

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {

    if (
        req.method !==
        "POST"
    ) {

        return responder(
            res,
            405,
            {
                success: false,
                error:
                    "MÃ©todo nÃ£o permitido.",
            }
        );

    }


    if (
        !MERCADO_PAGO_ACCESS_TOKEN ||
        !MERCADO_PAGO_WEBHOOK_SECRET ||
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        console.error(
            "ConfiguraÃ§Ã£o do webhook incompleta."
        );

        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "ConfiguraÃ§Ã£o do webhook incompleta.",
            }
        );

    }


    if (
        !validarAssinaturaWebhook(
            req
        )
    ) {

        console.warn(
            "Webhook Mercado Pago rejeitado: assinatura invÃ¡lida."
        );

        return responder(
            res,
            401,
            {
                success: false,
                error:
                    "Assinatura do webhook invÃ¡lida.",
            }
        );

    }


    const tipoRaw =
        req.query.type;

    const tipoEvento =
        Array.isArray(tipoRaw)
            ? tipoRaw[0]
            : tipoRaw;

    const dataIdRaw =
        req.query["data.id"];

    const dataId =
        Array.isArray(dataIdRaw)
            ? dataIdRaw[0]
            : dataIdRaw;


    console.log(
        "Webhook Mercado Pago recebido:",
        {
            tipo:
                tipoEvento,
            dataId,
        }
    );


    const eventosAceitos = [
        "subscription_preapproval",
        "payment",
        "subscription_authorized_payment",
    ];


    if (
        !tipoEvento ||
        !eventosAceitos.includes(
            tipoEvento
        )
    ) {

        return responder(
            res,
            200,
            {
                success: true,
                ignored: true,
                type:
                    tipoEvento ??
                    null,
            }
        );

    }


    if (
        !dataId
    ) {

        return responder(
            res,
            400,
            {
                success: false,
                error:
                    "data.id nÃ£o informado.",
            }
        );

    }


    try {

        const supabase =
            criarSupabaseAdmin();


        /* =================================================
           SUBSCRIPTION PREAPPROVAL
        ================================================= */

        if (
            tipoEvento ===
            "subscription_preapproval"
        ) {

            const preapprovalId =
                String(dataId);

            const assinaturaMP =
                await buscarAssinaturaMercadoPago(
                    preapprovalId
                );


            console.log(
                "Status assinatura Mercado Pago:",
                assinaturaMP?.status
            );


            const {
                data: pagamento,
                error: pagamentoError,
            } =
                await supabase
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .select("*")
                    .eq(
                        "mercado_pago_preapproval_id",
                        preapprovalId
                    )
                    .order(
                        "criado_em",
                        {
                            ascending: true,
                        }
                    )
                    .limit(1)
                    .maybeSingle();


            if (
                pagamentoError
            ) {

                console.error(
                    "Erro ao localizar pagamento:",
                    pagamentoError
                );

                return responder(
                    res,
                    500,
                    {
                        success: false,
                        error:
                            "Erro ao localizar pagamento.",
                    }
                );

            }


            if (
                !pagamento
            ) {

                console.warn(
                    "Nenhum pagamento encontrado para preapproval:",
                    preapprovalId
                );

                return responder(
                    res,
                    200,
                    {
                        success: true,
                        ignored: true,
                        reason:
                            "Pagamento nÃ£o encontrado.",
                        preapproval_id:
                            preapprovalId,
                    }
                );

            }


            if (
                assinaturaMP?.status ===
                "authorized"
            ) {

                const resultado =
                    await ativarPlano(
                        pagamento,
                        assinaturaMP
                    );


                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: true,
                        type:
                            tipoEvento,
                        preapproval_id:
                            preapprovalId,
                        status:
                            assinaturaMP.status,
                        assinatura:
                            resultado,
                    }
                );

            }


            if (
                statusAssinaturaMercadoPagoCancelada(
                    assinaturaMP?.status
                )
            ) {

                await supabase
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        status:
                            "CANCELADO",
                        atualizado_em:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "mercado_pago_preapproval_id",
                        preapprovalId
                    )
                    .eq(
                        "status",
                        "PENDENTE"
                    );


                const agoraCancelamento =
                    new Date()
                        .toISOString();


                await supabase
                    .schema("ebd")
                    .from("assinaturas")
                    .update({
                        renovacao_automatica:
                            false,
                        cancelamento_provedor_pendente:
                            false,
                        cancelamento_provedor_em:
                            agoraCancelamento,
                        cancelamento_provedor_erro:
                            null,
                        updated_at:
                            agoraCancelamento,
                    })
                    .eq(
                        "mercado_pago_preapproval_id",
                        preapprovalId
                    );



                console.log(
                    "ASSINATURA CANCELADA NO MERCADO PAGO: acesso mantido somente atÃ© o fim_em jÃ¡ pago.",
                    {
                        preapprovalId,
                        assinaturaId:
                            pagamento.assinatura_id ??
                            null,
                    }
                );

            }


            return responder(
                res,
                200,
                {
                    success: true,
                    processed: true,
                    type:
                        tipoEvento,
                    preapproval_id:
                        preapprovalId,
                    status:
                        assinaturaMP?.status,
                }
            );

        }


        /* =================================================
           PAYMENT
        ================================================= */

        if (
            tipoEvento ===
            "payment"
        ) {

            const paymentId =
                String(dataId);

            const consultaPagamento =
                await buscarPagamentoMercadoPago(
                    paymentId
                );


            if (
                !consultaPagamento.ok
            ) {

                console.error(
                    "Erro ao consultar pagamento MP:",
                    consultaPagamento.statusHttp,
                    consultaPagamento.dados
                );

                return responder(
                    res,
                    502,
                    {
                        success: false,
                        error:
                            "NÃ£o foi possÃ­vel consultar o pagamento no Mercado Pago.",
                    }
                );

            }


            const resultado =
                await processarPagamentoMercadoPago(
                    supabase,
                    consultaPagamento.dados,
                    paymentId
                );


            return responder(
                res,
                200,
                {
                    success: true,
                    processed:
                        resultado.processado,
                    ignored:
                        resultado.ignorado ??
                        false,
                    type:
                        tipoEvento,
                    payment_id:
                        paymentId,
                    status:
                        consultaPagamento.dados
                            ?.status,
                    resultado,
                }
            );

        }


        /* =================================================
           SUBSCRIPTION AUTHORIZED PAYMENT
        ================================================= */

        if (
            tipoEvento ===
            "subscription_authorized_payment"
        ) {

            const idRecebido =
                String(dataId);


            console.log(
                "Pagamento autorizado de assinatura recebido:",
                idRecebido
            );


            /* =================================================
               TENTA PRIMEIRO COMO AUTHORIZED_PAYMENT_ID
            ================================================= */

            const consultaAutorizado =
                await buscarPagamentoAutorizadoMercadoPago(
                    idRecebido
                );


            if (
                consultaAutorizado.ok
            ) {

                const pagamentoAutorizado =
                    consultaAutorizado.dados;

                const preapprovalId =
                    pagamentoAutorizado
                        ?.preapproval_id
                        ? String(
                            pagamentoAutorizado
                                .preapproval_id
                        )
                        : null;

                const paymentId =
                    pagamentoAutorizado
                        ?.payment?.id
                        ? String(
                            pagamentoAutorizado
                                .payment.id
                        )
                        : null;


                console.log(
                    "Pagamento autorizado Mercado Pago:",
                    {
                        authorizedPaymentId:
                            idRecebido,
                        preapprovalId,
                        paymentId,
                        status:
                            pagamentoAutorizado
                                ?.status,
                        paymentStatus:
                            pagamentoAutorizado
                                ?.payment?.status,
                    }
                );


                if (
                    paymentId
                ) {

                    const consultaPagamento =
                        await buscarPagamentoMercadoPago(
                            paymentId
                        );


                    if (
                        consultaPagamento.ok
                    ) {

                        const resultadoPagamento =
                            await processarPagamentoMercadoPago(
                                supabase,
                                consultaPagamento.dados,
                                paymentId
                            );


                        return responder(
                            res,
                            200,
                            {
                                success: true,
                                processed: true,
                                type:
                                    tipoEvento,
                                authorized_payment_id:
                                    idRecebido,
                                preapproval_id:
                                    preapprovalId,
                                payment_id:
                                    paymentId,
                                resultado:
                                    resultadoPagamento,
                            }
                        );

                    }

                }


                if (
                    preapprovalId
                ) {

                    const assinaturaMP =
                        await buscarAssinaturaMercadoPago(
                            preapprovalId
                        );


                    const {
                        data: pagamentoEbd,
                        error: pagamentoError,
                    } =
                        await supabase
                            .schema("ebd")
                            .from("pagamentos_assinaturas")
                            .select("*")
                            .eq(
                                "mercado_pago_preapproval_id",
                                preapprovalId
                            )
                            .order(
                                "criado_em",
                                {
                                    ascending: true,
                                }
                            )
                            .limit(1)
                            .maybeSingle();


                    if (
                        pagamentoError
                    ) {

                        throw pagamentoError;

                    }


                    if (
                        pagamentoEbd &&
                        assinaturaMP?.status ===
                        "authorized"
                    ) {

                        const resultado =
                            await ativarPlano(
                                pagamentoEbd,
                                assinaturaMP
                            );


                        return responder(
                            res,
                            200,
                            {
                                success: true,
                                processed: true,
                                type:
                                    tipoEvento,
                                authorized_payment_id:
                                    idRecebido,
                                preapproval_id:
                                    preapprovalId,
                                assinatura:
                                    resultado,
                            }
                        );

                    }

                }


                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: false,
                        ignored: true,
                        type:
                            tipoEvento,
                        authorized_payment_id:
                            idRecebido,
                        reason:
                            "Pagamento autorizado sem dados suficientes para processamento.",
                    }
                );

            }


            /* =================================================
               FALLBACK DO SIMULADOR

               No ambiente jÃ¡ observado, o simulador do Mercado
               Pago envia data.id como PREAPPROVAL_ID e a consulta
               /authorized_payments/{id} retorna 400.
            ================================================= */

            console.log(
                "Evento tratado como preapproval_id (fallback do simulador):",
                {
                    preapprovalId:
                        idRecebido,
                    authorizedPaymentHttpStatus:
                        consultaAutorizado
                            .statusHttp,
                }
            );


            let assinaturaMP: any;


            try {

                assinaturaMP =
                    await buscarAssinaturaMercadoPago(
                        idRecebido
                    );

            } catch (error) {

                console.warn(
                    "Evento subscription_authorized_payment nÃ£o pÃ´de ser tratado como authorized_payment nem como preapproval:",
                    {
                        dataId:
                            idRecebido,
                        authorizedPaymentHttpStatus:
                            consultaAutorizado
                                .statusHttp,
                    }
                );


                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: false,
                        ignored: true,
                        type:
                            tipoEvento,
                        authorized_payment_id:
                            idRecebido,
                        reason:
                            "Evento nÃ£o reconhecido como cobranÃ§a autorizada nem como preapproval.",
                    }
                );

            }


            const preapprovalId =
                idRecebido;


            const {
                data: pagamentoEbd,
                error: pagamentoError,
            } =
                await supabase
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .select("*")
                    .eq(
                        "mercado_pago_preapproval_id",
                        preapprovalId
                    )
                    .order(
                        "criado_em",
                        {
                            ascending: true,
                        }
                    )
                    .limit(1)
                    .maybeSingle();


            if (
                pagamentoError
            ) {

                throw pagamentoError;

            }


            if (
                !pagamentoEbd
            ) {

                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: false,
                        ignored: true,
                        type:
                            tipoEvento,
                        preapproval_id:
                            preapprovalId,
                        reason:
                            "Pagamento nÃ£o pertence ao EBD Manager.",
                    }
                );

            }


            if (
                assinaturaMP?.status !==
                "authorized"
            ) {

                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: false,
                        type:
                            tipoEvento,
                        preapproval_id:
                            preapprovalId,
                        status:
                            assinaturaMP?.status,
                    }
                );

            }


            if (
                !pagamentoEbd.assinatura_id
            ) {

                const resultado =
                    await ativarPlano(
                        pagamentoEbd,
                        assinaturaMP
                    );


                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: true,
                        type:
                            tipoEvento,
                        fallback_simulador:
                            true,
                        preapproval_id:
                            preapprovalId,
                        assinatura:
                            resultado,
                    }
                );

            }


            const sincronizacao =
                await sincronizarVencimentoAssinatura(
                    supabase,
                    pagamentoEbd.assinatura_id,
                    preapprovalId
                );


            console.log(
                "ASSINATURA EXISTENTE SINCRONIZADA PELO FALLBACK:",
                {
                    assinaturaId:
                        pagamentoEbd.assinatura_id,
                    preapprovalId,
                    novoFimEm:
                        sincronizacao
                            .novoFimEm,
                }
            );


            return responder(
                res,
                200,
                {
                    success: true,
                    processed: true,
                    type:
                        tipoEvento,
                    fallback_simulador:
                        true,
                    preapproval_id:
                        preapprovalId,
                    assinatura_id:
                        pagamentoEbd
                            .assinatura_id,
                    next_payment_date:
                        sincronizacao
                            .novoFimEm,
                }
            );

        }


        return responder(
            res,
            200,
            {
                success: true,
            }
        );

    } catch (error) {

        console.error(
            "Erro no webhook Mercado Pago:",
            error
        );

        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Erro interno no webhook.",
            }
        );

    }

}
