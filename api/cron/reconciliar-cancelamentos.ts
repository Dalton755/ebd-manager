import type {
    VercelRequest,
    VercelResponse,
} from "@vercel/node";

import {
    createClient,
} from "@supabase/supabase-js";


const MERCADOPAGO_ACCESS_TOKEN =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

const SUPABASE_URL =
    process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const CRON_SECRET =
    process.env.CRON_SECRET;

const HORAS_PARA_CANCELAR_CHECKOUT_PENDENTE =
    24;


type ResultadoMercadoPago = {
    ok: boolean;
    statusHttp: number;
    dados: any;
};


function responder(
    res: VercelResponse,
    status: number,
    body: unknown
) {

    return res
        .status(status)
        .json(body);
}


function mensagemErro(
    statusHttp: number,
    dados: any
) {

    let detalhe = "";

    try {

        detalhe =
            JSON.stringify(
                dados
            );

    } catch {

        detalhe =
            String(
                dados
            );
    }


    return `HTTP ${statusHttp} - ${detalhe}`;
}


function statusCancelado(
    status: unknown
) {

    const valor =
        String(
            status ??
            ""
        )
            .trim()
            .toLowerCase();


    return (
        valor === "cancelled" ||
        valor === "canceled"
    );
}


async function consultarPreapproval(
    preapprovalId: string
): Promise<ResultadoMercadoPago> {

    const resposta =
        await fetch(
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(
                preapprovalId
            )}`,
            {
                method:
                    "GET",

                headers: {
                    Authorization:
                        `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,

                    "Content-Type":
                        "application/json",
                },
            }
        );


    let dados: any = null;

    try {

        dados =
            await resposta.json();

    } catch {

        dados =
            null;
    }


    return {
        ok:
            resposta.ok,

        statusHttp:
            resposta.status,

        dados,
    };
}


async function alterarStatusPreapproval(
    preapprovalId: string,
    status: "cancelled" | "canceled",
    reason:
        string =
        "EBD Manager - encerramento de plano anterior"
): Promise<ResultadoMercadoPago> {

    const resposta =
        await fetch(
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(
                preapprovalId
            )}`,
            {
                method:
                    "PUT",

                headers: {
                    Authorization:
                        `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,

                    "Content-Type":
                        "application/json",
                },

                body:
                    JSON.stringify({
                        reason,

                        status,
                    }),
            }
        );


    let dados: any = null;

    try {

        dados =
            await resposta.json();

    } catch {

        dados =
            null;
    }


    return {
        ok:
            resposta.ok,

        statusHttp:
            resposta.status,

        dados,
    };
}


async function cancelarPreapproval(
    preapprovalId: string,
    reason:
        string =
        "EBD Manager - encerramento de plano anterior"
) {

    // No ambiente de testes validado, "cancelled" é aceito.
    // Mantemos fallback para "canceled" por compatibilidade.
    const primeiraTentativa =
        await alterarStatusPreapproval(
            preapprovalId,
            "cancelled",
            reason
        );


    if (
        primeiraTentativa.ok
    ) {

        return primeiraTentativa;
    }


    const textoErro =
        mensagemErro(
            primeiraTentativa.statusHttp,
            primeiraTentativa.dados
        )
            .toLowerCase();


    const erroDeStatus =
        primeiraTentativa.statusHttp ===
            400 &&
        textoErro.includes(
            "invalid preapproval status param"
        );


    if (
        !erroDeStatus
    ) {

        return primeiraTentativa;
    }


    console.warn(
        "[CRON CANCELAMENTO] Mercado Pago rejeitou 'cancelled'. Tentando 'canceled'.",
        {
            preapprovalId,
        }
    );


    return alterarStatusPreapproval(
        preapprovalId,
        "canceled",
        reason
    );
}


export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {

    // =================================================
    // MÉTODO
    // =================================================

    if (
        req.method !==
        "GET"
    ) {

        return responder(
            res,
            405,
            {
                success:
                    false,

                error:
                    "Método não permitido.",
            }
        );
    }


    // =================================================
    // SEGURANÇA DO CRON
    // =================================================

    const authorization =
        req.headers.authorization;


    if (
        !CRON_SECRET ||
        authorization !==
            `Bearer ${CRON_SECRET}`
    ) {

        return responder(
            res,
            401,
            {
                success:
                    false,

                error:
                    "Não autorizado.",
            }
        );
    }


    // =================================================
    // CONFIGURAÇÃO
    // =================================================

    if (
        !MERCADOPAGO_ACCESS_TOKEN ||
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        return responder(
            res,
            500,
            {
                success:
                    false,

                error:
                    "Configuração incompleta.",
            }
        );
    }


    const supabaseAdmin =
        createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken:
                        false,

                    persistSession:
                        false,
                },
            }
        );


    try {

        // =================================================
        // BUSCA SOMENTE ASSINATURAS ENCERRADAS
        // COM CANCELAMENTO DO PROVEDOR PENDENTE
        // =================================================

        const {
            data: pendencias,
            error: pendenciasError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("assinaturas")
                .select(
                    "id, igreja_id, status, mercado_pago_preapproval_id, renovacao_automatica, cancelamento_provedor_pendente, cancelamento_provedor_em"
                )
                .eq(
                    "status",
                    "ENCERRADA"
                )
                .eq(
                    "cancelamento_provedor_pendente",
                    true
                )
                .not(
                    "mercado_pago_preapproval_id",
                    "is",
                    null
                )
                .order(
                    "updated_at",
                    {
                        ascending:
                            true,
                    }
                )
                .limit(
                    50
                );


        if (
            pendenciasError
        ) {

            throw pendenciasError;
        }


        const resultados: Array<{
            assinaturaId: string;
            preapprovalId: string;
            resultado:
                "JA_CANCELADA" |
                "CANCELADA" |
                "PENDENTE" |
                "ERRO";
            statusMercadoPago?: string | null;
            erro?: string;
        }> = [];


        for (
            const assinatura of
            pendencias ??
            []
        ) {

            const assinaturaId =
                String(
                    assinatura.id
                );

            const preapprovalId =
                String(
                    assinatura
                        .mercado_pago_preapproval_id
                );


            try {

                // =========================================
                // PRIMEIRO CONFIRMA O ESTADO NO PROVEDOR
                // =========================================

                const consulta =
                    await consultarPreapproval(
                        preapprovalId
                    );


                if (
                    !consulta.ok
                ) {

                    const erro =
                        mensagemErro(
                            consulta.statusHttp,
                            consulta.dados
                        );


                    await supabaseAdmin
                        .schema("ebd")
                        .from("assinaturas")
                        .update({
                            renovacao_automatica:
                                false,

                            cancelamento_provedor_pendente:
                                true,

                            cancelamento_provedor_erro:
                                erro,

                            updated_at:
                                new Date()
                                    .toISOString(),
                        })
                        .eq(
                            "id",
                            assinaturaId
                        );


                    resultados.push({
                        assinaturaId,
                        preapprovalId,
                        resultado:
                            "ERRO",
                        erro,
                    });


                    continue;
                }


                const statusAtual =
                    String(
                        consulta.dados
                            ?.status ??
                        ""
                    );


                // =========================================
                // JÁ ESTÁ CANCELADA NO MERCADO PAGO
                // =========================================

                if (
                    statusCancelado(
                        statusAtual
                    )
                ) {

                    const agora =
                        new Date()
                            .toISOString();


                    const {
                        error:
                            atualizarError,
                    } =
                        await supabaseAdmin
                            .schema("ebd")
                            .from("assinaturas")
                            .update({
                                renovacao_automatica:
                                    false,

                                cancelamento_provedor_pendente:
                                    false,

                                cancelamento_provedor_em:
                                    assinatura
                                        .cancelamento_provedor_em ??
                                    agora,

                                cancelamento_provedor_erro:
                                    null,

                                updated_at:
                                    agora,
                            })
                            .eq(
                                "id",
                                assinaturaId
                            );


                    if (
                        atualizarError
                    ) {

                        throw atualizarError;
                    }


                    resultados.push({
                        assinaturaId,
                        preapprovalId,
                        resultado:
                            "JA_CANCELADA",
                        statusMercadoPago:
                            statusAtual,
                    });


                    continue;
                }


                // =========================================
                // AINDA NÃO CANCELADA: TENTA CANCELAR
                // =========================================

                console.log(
                    "[CRON CANCELAMENTO] Tentando cancelar recorrência pendente:",
                    {
                        assinaturaId,
                        preapprovalId,
                        statusAtual,
                    }
                );


                const cancelamento =
                    await cancelarPreapproval(
                        preapprovalId
                    );


                if (
                    cancelamento.ok &&
                    statusCancelado(
                        cancelamento
                            .dados
                            ?.status
                    )
                ) {

                    const agora =
                        new Date()
                            .toISOString();


                    const {
                        error:
                            atualizarError,
                    } =
                        await supabaseAdmin
                            .schema("ebd")
                            .from("assinaturas")
                            .update({
                                renovacao_automatica:
                                    false,

                                cancelamento_provedor_pendente:
                                    false,

                                cancelamento_provedor_em:
                                    agora,

                                cancelamento_provedor_erro:
                                    null,

                                updated_at:
                                    agora,
                            })
                            .eq(
                                "id",
                                assinaturaId
                            );


                    if (
                        atualizarError
                    ) {

                        throw atualizarError;
                    }


                    resultados.push({
                        assinaturaId,
                        preapprovalId,
                        resultado:
                            "CANCELADA",
                        statusMercadoPago:
                            cancelamento
                                .dados
                                ?.status ??
                            null,
                    });


                    continue;
                }


                const erro =
                    mensagemErro(
                        cancelamento.statusHttp,
                        cancelamento.dados
                    );


                await supabaseAdmin
                    .schema("ebd")
                    .from("assinaturas")
                    .update({
                        renovacao_automatica:
                            false,

                        cancelamento_provedor_pendente:
                            true,

                        cancelamento_provedor_erro:
                            erro,

                        updated_at:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "id",
                        assinaturaId
                    );


                resultados.push({
                    assinaturaId,
                    preapprovalId,
                    resultado:
                        "PENDENTE",
                    statusMercadoPago:
                        cancelamento
                            .dados
                            ?.status ??
                        null,
                    erro,
                });

            } catch (error) {

                const erro =
                    error instanceof Error
                        ? error.message
                        : String(
                            error
                        );


                console.error(
                    "[CRON CANCELAMENTO] Erro ao reconciliar assinatura:",
                    {
                        assinaturaId,
                        preapprovalId,
                        erro,
                    }
                );


                await supabaseAdmin
                    .schema("ebd")
                    .from("assinaturas")
                    .update({
                        renovacao_automatica:
                            false,

                        cancelamento_provedor_pendente:
                            true,

                        cancelamento_provedor_erro:
                            erro,

                        updated_at:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "id",
                        assinaturaId
                    );


                resultados.push({
                    assinaturaId,
                    preapprovalId,
                    resultado:
                        "ERRO",
                    erro,
                });
            }
        }



        // =================================================
        // RECONCILIA PAGAMENTOS PENDENTES / CHECKOUTS
        // =================================================

        const {
            data: pagamentosPendentes,
            error: pagamentosPendentesError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .select(
                    "id, igreja_id, assinatura_id, status, mercado_pago_preapproval_id, mercado_pago_payment_id, criado_em, metadata"
                )
                .eq(
                    "status",
                    "PENDENTE"
                )
                .is(
                    "assinatura_id",
                    null
                )
                .is(
                    "mercado_pago_payment_id",
                    null
                )
                .not(
                    "mercado_pago_preapproval_id",
                    "is",
                    null
                )
                .order(
                    "criado_em",
                    {
                        ascending:
                            true,
                    }
                )
                .limit(
                    100
                );


        if (
            pagamentosPendentesError
        ) {

            throw pagamentosPendentesError;
        }


        const resultadosPagamentos: Array<{
            pagamentoId: string;
            preapprovalId: string;
            resultado:
                "JA_CANCELADO" |
                "CANCELADO_AGORA" |
                "AGUARDANDO" |
                "RECUPERADO" |
                "AUTORIZADO_ORFAO" |
                "ERRO";
            statusMercadoPago?: string | null;
            erro?: string;
        }> = [];


        for (
            const pagamento of
            pagamentosPendentes ??
            []
        ) {

            const pagamentoId =
                String(
                    pagamento.id
                );

            const preapprovalId =
                String(
                    pagamento
                        .mercado_pago_preapproval_id
                );

            const metadataAtual =
                pagamento.metadata &&
                typeof pagamento.metadata ===
                    "object" &&
                !Array.isArray(
                    pagamento.metadata
                )
                    ? pagamento.metadata
                    : {};


            try {

                const consulta =
                    await consultarPreapproval(
                        preapprovalId
                    );


                if (
                    !consulta.ok
                ) {

                    const erro =
                        mensagemErro(
                            consulta.statusHttp,
                            consulta.dados
                        );

                    const agora =
                        new Date()
                            .toISOString();


                    await supabaseAdmin
                        .schema("ebd")
                        .from("pagamentos_assinaturas")
                        .update({
                            atualizado_em:
                                agora,

                            metadata: {
                                ...metadataAtual,

                                reconciliacao_ultimo_erro:
                                    erro,

                                reconciliacao_http_status:
                                    consulta.statusHttp,

                                reconciliacao_em:
                                    agora,
                            },
                        })
                        .eq(
                            "id",
                            pagamentoId
                        );


                    resultadosPagamentos.push({
                        pagamentoId,
                        preapprovalId,
                        resultado:
                            "ERRO",
                        erro,
                    });


                    continue;
                }


                const statusAtual =
                    String(
                        consulta.dados
                            ?.status ??
                        ""
                    )
                        .trim()
                        .toLowerCase();


                // =========================================
                // PROVIDER JÁ CANCELADO
                // =========================================

                if (
                    statusCancelado(
                        statusAtual
                    )
                ) {

                    const agora =
                        new Date()
                            .toISOString();


                    const {
                        error:
                            atualizarPagamentoError,
                    } =
                        await supabaseAdmin
                            .schema("ebd")
                            .from("pagamentos_assinaturas")
                            .update({
                                status:
                                    "CANCELADO",

                                atualizado_em:
                                    agora,

                                metadata: {
                                    ...metadataAtual,

                                    reconciliacao_resultado:
                                        "PREAPPROVAL_JA_CANCELADO",

                                    reconciliacao_status_mercado_pago:
                                        statusAtual,

                                    reconciliacao_em:
                                        agora,
                                },
                            })
                            .eq(
                                "id",
                                pagamentoId
                            )
                            .eq(
                                "status",
                                "PENDENTE"
                            );


                    if (
                        atualizarPagamentoError
                    ) {

                        throw atualizarPagamentoError;
                    }


                    resultadosPagamentos.push({
                        pagamentoId,
                        preapprovalId,
                        resultado:
                            "JA_CANCELADO",
                        statusMercadoPago:
                            statusAtual,
                    });


                    continue;
                }


                // =========================================
                // AUTORIZADO: TENTA RECUPERAR VÍNCULO
                // =========================================

                if (
                    statusAtual ===
                    "authorized"
                ) {

                    const {
                        data: assinaturaExistente,
                        error: assinaturaExistenteError,
                    } =
                        await supabaseAdmin
                            .schema("ebd")
                            .from("assinaturas")
                            .select(
                                "id, status, mercado_pago_preapproval_id"
                            )
                            .eq(
                                "mercado_pago_preapproval_id",
                                preapprovalId
                            )
                            .eq(
                                "status",
                                "ATIVA"
                            )
                            .order(
                                "inicio_em",
                                {
                                    ascending:
                                        false,
                                }
                            )
                            .limit(
                                1
                            )
                            .maybeSingle();


                    if (
                        assinaturaExistenteError
                    ) {

                        throw assinaturaExistenteError;
                    }


                    if (
                        assinaturaExistente
                    ) {

                        const agora =
                            new Date()
                                .toISOString();

                        const pagoEm =
                            consulta.dados
                                ?.summarized
                                ?.last_charged_date ??
                            consulta.dados
                                ?.date_created ??
                            agora;


                        const {
                            error:
                                recuperarPagamentoError,
                        } =
                            await supabaseAdmin
                                .schema("ebd")
                                .from("pagamentos_assinaturas")
                                .update({
                                    assinatura_id:
                                        assinaturaExistente.id,

                                    status:
                                        "APROVADO",

                                    pago_em:
                                        pagoEm,

                                    vencimento_em:
                                        consulta.dados
                                            ?.next_payment_date ??
                                        null,

                                    atualizado_em:
                                        agora,

                                    metadata: {
                                        ...metadataAtual,

                                        reconciliacao_resultado:
                                            "PAGAMENTO_RECUPERADO",

                                        reconciliacao_status_mercado_pago:
                                            statusAtual,

                                        reconciliacao_em:
                                            agora,
                                    },
                                })
                                .eq(
                                    "id",
                                    pagamentoId
                                )
                                .eq(
                                    "status",
                                    "PENDENTE"
                                );


                        if (
                            recuperarPagamentoError
                        ) {

                            throw recuperarPagamentoError;
                        }


                        resultadosPagamentos.push({
                            pagamentoId,
                            preapprovalId,
                            resultado:
                                "RECUPERADO",
                            statusMercadoPago:
                                statusAtual,
                        });


                        continue;
                    }


                    const agora =
                        new Date()
                            .toISOString();


                    await supabaseAdmin
                        .schema("ebd")
                        .from("pagamentos_assinaturas")
                        .update({
                            atualizado_em:
                                agora,

                            metadata: {
                                ...metadataAtual,

                                reconciliacao_resultado:
                                    "AUTHORIZED_SEM_ASSINATURA",

                                reconciliacao_status_mercado_pago:
                                    statusAtual,

                                reconciliacao_acao_requerida:
                                    true,

                                reconciliacao_em:
                                    agora,
                            },
                        })
                        .eq(
                            "id",
                            pagamentoId
                        );


                    console.error(
                        "[CRON PAGAMENTOS] Preapproval autorizado sem assinatura local:",
                        {
                            pagamentoId,
                            preapprovalId,
                        }
                    );


                    resultadosPagamentos.push({
                        pagamentoId,
                        preapprovalId,
                        resultado:
                            "AUTORIZADO_ORFAO",
                        statusMercadoPago:
                            statusAtual,
                    });


                    continue;
                }


                // =========================================
                // PENDING: SÓ CANCELA APÓS 24H
                // =========================================

                if (
                    statusAtual ===
                    "pending"
                ) {

                    const criadoEmMs =
                        new Date(
                            pagamento.criado_em
                        )
                            .getTime();

                    const idadeMs =
                        Date.now() -
                        criadoEmMs;

                    const limiteMs =
                        HORAS_PARA_CANCELAR_CHECKOUT_PENDENTE *
                        60 *
                        60 *
                        1000;

                    const checkoutAntigo =
                        Number.isFinite(
                            criadoEmMs
                        ) &&
                        idadeMs >=
                            limiteMs;


                    if (
                        !checkoutAntigo
                    ) {

                        resultadosPagamentos.push({
                            pagamentoId,
                            preapprovalId,
                            resultado:
                                "AGUARDANDO",
                            statusMercadoPago:
                                statusAtual,
                        });


                        continue;
                    }


                    const cancelamento =
                        await cancelarPreapproval(
                            preapprovalId,
                            "EBD Manager - checkout abandonado"
                        );


                    if (
                        cancelamento.ok &&
                        statusCancelado(
                            cancelamento
                                .dados
                                ?.status
                        )
                    ) {

                        const agora =
                            new Date()
                                .toISOString();


                        const {
                            error:
                                cancelarPagamentoError,
                        } =
                            await supabaseAdmin
                                .schema("ebd")
                                .from("pagamentos_assinaturas")
                                .update({
                                    status:
                                        "CANCELADO",

                                    atualizado_em:
                                        agora,

                                    metadata: {
                                        ...metadataAtual,

                                        reconciliacao_resultado:
                                            "CHECKOUT_ABANDONADO_CANCELADO",

                                        reconciliacao_status_mercado_pago:
                                            cancelamento
                                                .dados
                                                ?.status ??
                                            null,

                                        reconciliacao_em:
                                            agora,
                                    },
                                })
                                .eq(
                                    "id",
                                    pagamentoId
                                )
                                .eq(
                                    "status",
                                    "PENDENTE"
                                );


                        if (
                            cancelarPagamentoError
                        ) {

                            throw cancelarPagamentoError;
                        }


                        resultadosPagamentos.push({
                            pagamentoId,
                            preapprovalId,
                            resultado:
                                "CANCELADO_AGORA",
                            statusMercadoPago:
                                cancelamento
                                    .dados
                                    ?.status ??
                                null,
                        });


                        continue;
                    }


                    const erro =
                        mensagemErro(
                            cancelamento.statusHttp,
                            cancelamento.dados
                        );

                    const agora =
                        new Date()
                            .toISOString();


                    await supabaseAdmin
                        .schema("ebd")
                        .from("pagamentos_assinaturas")
                        .update({
                            atualizado_em:
                                agora,

                            metadata: {
                                ...metadataAtual,

                                reconciliacao_ultimo_erro:
                                    erro,

                                reconciliacao_http_status:
                                    cancelamento.statusHttp,

                                reconciliacao_status_mercado_pago:
                                    statusAtual,

                                reconciliacao_em:
                                    agora,
                            },
                        })
                        .eq(
                            "id",
                            pagamentoId
                        );


                    resultadosPagamentos.push({
                        pagamentoId,
                        preapprovalId,
                        resultado:
                            "ERRO",
                        statusMercadoPago:
                            statusAtual,
                        erro,
                    });


                    continue;
                }


                // =========================================
                // STATUS NÃO MAPEADO: NÃO ALTERA FINANCEIRO
                // =========================================

                const agora =
                    new Date()
                        .toISOString();

                const erro =
                    `Status de preapproval não tratado: ${statusAtual || "vazio"}`;


                await supabaseAdmin
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        atualizado_em:
                            agora,

                        metadata: {
                            ...metadataAtual,

                            reconciliacao_ultimo_erro:
                                erro,

                            reconciliacao_status_mercado_pago:
                                statusAtual ||
                                null,

                            reconciliacao_em:
                                agora,
                        },
                    })
                    .eq(
                        "id",
                        pagamentoId
                    );


                resultadosPagamentos.push({
                    pagamentoId,
                    preapprovalId,
                    resultado:
                        "ERRO",
                    statusMercadoPago:
                        statusAtual ||
                        null,
                    erro,
                });

            } catch (error) {

                const erro =
                    error instanceof Error
                        ? error.message
                        : String(
                            error
                        );

                const agora =
                    new Date()
                        .toISOString();


                console.error(
                    "[CRON PAGAMENTOS] Erro ao reconciliar pagamento:",
                    {
                        pagamentoId,
                        preapprovalId,
                        erro,
                    }
                );


                await supabaseAdmin
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        atualizado_em:
                            agora,

                        metadata: {
                            ...metadataAtual,

                            reconciliacao_ultimo_erro:
                                erro,

                            reconciliacao_em:
                                agora,
                        },
                    })
                    .eq(
                        "id",
                        pagamentoId
                    );


                resultadosPagamentos.push({
                    pagamentoId,
                    preapprovalId,
                    resultado:
                        "ERRO",
                    erro,
                });
            }
        }


        const resumoPagamentos = {
            total:
                resultadosPagamentos.length,

            jaCancelados:
                resultadosPagamentos.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "JA_CANCELADO"
                ).length,

            canceladosAgora:
                resultadosPagamentos.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "CANCELADO_AGORA"
                ).length,

            aguardando:
                resultadosPagamentos.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "AGUARDANDO"
                ).length,

            recuperados:
                resultadosPagamentos.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "RECUPERADO"
                ).length,

            autorizadosOrfaos:
                resultadosPagamentos.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "AUTORIZADO_ORFAO"
                ).length,

            erros:
                resultadosPagamentos.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "ERRO"
                ).length,
        };


        const resumo = {
            total:
                resultados.length,

            jaCanceladas:
                resultados.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "JA_CANCELADA"
                ).length,

            canceladasAgora:
                resultados.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "CANCELADA"
                ).length,

            pendentes:
                resultados.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "PENDENTE"
                ).length,

            erros:
                resultados.filter(
                    (
                        item
                    ) =>
                        item.resultado ===
                        "ERRO"
                ).length,
        };


        console.log(
            "[CRON CANCELAMENTO] Reconciliação concluída:",
            resumo
        );


        console.log(
            "[CRON PAGAMENTOS] Reconciliação concluída:",
            resumoPagamentos
        );


        return responder(
            res,
            200,
            {
                success:
                    true,

                cancelamentos: {
                    resumo,
                    resultados,
                },

                pagamentos: {
                    resumo:
                        resumoPagamentos,

                    resultados:
                        resultadosPagamentos,
                },
            }
        );

    } catch (error) {

        console.error(
            "[CRON CANCELAMENTO] Erro geral:",
            error
        );


        return responder(
            res,
            500,
            {
                success:
                    false,

                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno na reconciliação.",
            }
        );
    }
}
