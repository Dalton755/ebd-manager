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

const SUPABASE_ANON_KEY =
    process.env.VITE_SUPABASE_ANON_KEY;

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
            "Credenciais do Supabase não configuradas."
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


async function buscarAssinaturaMercadoPago(
    preapprovalId: string
) {

    if (
        !MERCADOPAGO_ACCESS_TOKEN
    ) {

        throw new Error(
            "MERCADOPAGO_ACCESS_TOKEN não configurado."
        );
    }


    const resposta =
        await fetch(
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(
                preapprovalId
            )}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
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
            "[SYNC] Erro ao consultar Mercado Pago:",
            resposta.status,
            dados
        );

        throw new Error(
            "Não foi possível consultar a assinatura no Mercado Pago."
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
            `https://api.mercadopago.com/preapproval/${encodeURIComponent(
                preapprovalId
            )}`,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
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
        !MERCADOPAGO_ACCESS_TOKEN
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
            statusHttp: 0,
            dados: {
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            statusTentado: null,
            jaCancelada: false,
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
            statusTentado: null,
            jaCancelada: true,
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
        };
    }


    const deveTentarStatusAlternativo =
        primeiraTentativa.statusHttp === 400 &&
        erroStatusCancelamentoInvalido(
            primeiraTentativa.dados,
            "cancelled"
        );


    if (
        deveTentarStatusAlternativo
    ) {

        console.warn(
            "[SYNC] Mercado Pago recusou status cancelled. Tentando fallback canceled:",
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
        };
    }


    


    return {
        ...primeiraTentativa,
        jaCancelada: false,
    };
}


function montarErroCancelamento(
    statusHttp: number,
    dados: unknown
) {

    let detalhe = "";

    try {
        detalhe =
            JSON.stringify(dados);
    } catch {
        detalhe =
            String(dados ?? "");
    }


    const texto =
        `HTTP ${statusHttp}${detalhe ? ` - ${detalhe}` : ""}`;


    return texto.slice(
        0,
        4000
    );
}


async function sincronizarAssinaturaExistente(
    supabaseAdmin: any,
    assinaturaId: string,
    preapprovalId: string,
    fimEm: string
) {

    const agora =
        new Date().toISOString();


    const {
        error,
    } =
        await supabaseAdmin
            .schema("ebd")
            .from("assinaturas")
            .update({
                status:
                    "ATIVA",

                fim_em:
                    fimEm,

                carencia_ate:
                    null,

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
                    agora,
            })
            .eq(
                "id",
                assinaturaId
            );


    if (
        error
    ) {

        console.error(
            "[SYNC] Erro ao sincronizar assinatura existente:",
            error
        );

        throw error;
    }
}


async function registrarCancelamentoAssinaturaAnterior(
    supabaseAdmin: any,
    assinaturaAnterior: any,
    novoPreapprovalId: string
) {

    if (
        !assinaturaAnterior
    ) {

        return;
    }


    const preapprovalAnterior =
        assinaturaAnterior
            ?.mercado_pago_preapproval_id
            ? String(
                assinaturaAnterior
                    .mercado_pago_preapproval_id
            )
            : null;


    if (
        !preapprovalAnterior ||
        preapprovalAnterior ===
        novoPreapprovalId
    ) {

        return;
    }


    console.log(
        "[SYNC] Tentando cancelar recorrência anterior no Mercado Pago:",
        {
            assinaturaId:
                assinaturaAnterior.id,
            preapprovalId:
                preapprovalAnterior,
        }
    );


    try {

        const cancelamento =
            await cancelarAssinaturaMercadoPago(
                preapprovalAnterior
            );


        const agora =
            new Date().toISOString();


        if (
            cancelamento.ok
        ) {

            const {
                error,
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
                        assinaturaAnterior.id
                    );


            if (
                error
            ) {
                throw error;
            }


            console.log(
                "[SYNC] Recorrência anterior cancelada no Mercado Pago:",
                {
                    assinaturaId:
                        assinaturaAnterior.id,
                    preapprovalId:
                        preapprovalAnterior,
                }
            );


            return;
        }


        const erroTexto =
            montarErroCancelamento(
                cancelamento.statusHttp,
                cancelamento.dados
            );


        const {
            error,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("assinaturas")
                .update({
                    renovacao_automatica:
                        false,

                    cancelamento_provedor_pendente:
                        true,

                    cancelamento_provedor_em:
                        null,

                    cancelamento_provedor_erro:
                        erroTexto,

                    updated_at:
                        agora,
                })
                .eq(
                    "id",
                    assinaturaAnterior.id
                );


        if (
            error
        ) {
            throw error;
        }


        console.warn(
            "[SYNC] Cancelamento da recorrência anterior ficou pendente:",
            {
                assinaturaId:
                    assinaturaAnterior.id,
                preapprovalId:
                    preapprovalAnterior,
                statusHttp:
                    cancelamento.statusHttp,
                erro:
                    erroTexto,
            }
        );

    } catch (error) {

        const agora =
            new Date().toISOString();

        const erroTexto =
            error instanceof Error
                ? error.message
                : String(error);


        console.error(
            "[SYNC] Erro ao cancelar recorrência anterior:",
            error
        );


        await supabaseAdmin
            .schema("ebd")
            .from("assinaturas")
            .update({
                renovacao_automatica:
                    false,

                cancelamento_provedor_pendente:
                    true,

                cancelamento_provedor_em:
                    null,

                cancelamento_provedor_erro:
                    erroTexto.slice(
                        0,
                        4000
                    ),

                updated_at:
                    agora,
            })
            .eq(
                "id",
                assinaturaAnterior.id
            );
    }
}


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
                    "Método não permitido.",
            }
        );
    }


    if (
        !MERCADOPAGO_ACCESS_TOKEN ||
        !SUPABASE_URL ||
        !SUPABASE_ANON_KEY ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {

        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Configuração incompleta.",
            }
        );
    }


    try {

        /* =================================================
           AUTENTICAÇÃO DO USUÁRIO
        ================================================= */

        const authorization =
            req.headers.authorization;


        if (
            !authorization ||
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return responder(
                res,
                401,
                {
                    success: false,
                    error:
                        "Usuário não autenticado.",
                }
            );
        }


        const accessToken =
            authorization
                .replace(
                    "Bearer ",
                    ""
                )
                .trim();


        const supabaseAuth =
            createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY,
                {
                    auth: {
                        autoRefreshToken:
                            false,
                        persistSession:
                            false,
                    },
                }
            );


        const {
            data: userData,
            error: userError,
        } =
            await supabaseAuth.auth
                .getUser(
                    accessToken
                );


        if (
            userError ||
            !userData.user
        ) {

            return responder(
                res,
                401,
                {
                    success: false,
                    error:
                        "Usuário não autenticado.",
                }
            );
        }


        const user =
            userData.user;


        /* =================================================
           PREAPPROVAL
        ================================================= */

        const preapprovalId =
            typeof req.body?.preapprovalId ===
                "string"
                ? req.body.preapprovalId.trim()
                : "";


        if (
            !preapprovalId
        ) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "preapprovalId não informado.",
                }
            );
        }


        const supabaseAdmin =
            criarSupabaseAdmin();


        /* =================================================
           LOCALIZA A IGREJA DO USUÁRIO
        ================================================= */

        const {
            data: pessoa,
            error: pessoaError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pessoas")
                .select(
                    "id, igreja_id"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (
            pessoaError
        ) {

            console.error(
                "[SYNC] Erro ao localizar pessoa:",
                pessoaError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Erro ao localizar usuário.",
                }
            );
        }


        if (
            !pessoa?.igreja_id
        ) {

            return responder(
                res,
                403,
                {
                    success: false,
                    error:
                        "Igreja do usuário não encontrada.",
                }
            );
        }


        /* =================================================
           LOCALIZA PAGAMENTO EBD
        ================================================= */

        const {
            data: pagamento,
            error: pagamentoError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .select("*")
                .eq(
                    "mercado_pago_preapproval_id",
                    preapprovalId
                )
                .eq(
                    "igreja_id",
                    pessoa.igreja_id
                )
                .order(
                    "criado_em",
                    {
                        ascending:
                            false,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (
            pagamentoError
        ) {

            console.error(
                "[SYNC] Erro ao localizar pagamento:",
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

            return responder(
                res,
                404,
                {
                    success: false,
                    error:
                        "Pagamento não encontrado.",
                }
            );
        }


        /* =================================================
           CONSULTA MERCADO PAGO
        ================================================= */

        const assinaturaMP =
            await buscarAssinaturaMercadoPago(
                preapprovalId
            );


        console.log(
            "[SYNC] Assinatura Mercado Pago:",
            {
                preapprovalId,

                status:
                    assinaturaMP?.status,

                valor:
                    assinaturaMP
                        ?.auto_recurring
                        ?.transaction_amount,

                nextPaymentDate:
                    assinaturaMP
                        ?.next_payment_date,
            }
        );


        /* =================================================
           AINDA NÃO AUTORIZADO
        ================================================= */

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
                    status:
                        assinaturaMP?.status ??
                        null,
                }
            );
        }


        const fimEm =
            assinaturaMP?.next_payment_date
                ? String(
                    assinaturaMP
                        .next_payment_date
                )
                : null;


        if (
            !fimEm
        ) {

            console.error(
                "[SYNC] Assinatura autorizada sem next_payment_date:",
                {
                    preapprovalId,
                    pagamentoId:
                        pagamento.id,
                }
            );

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "Assinatura autorizada sem data de próximo vencimento.",
                }
            );
        }


        const agora =
            new Date().toISOString();

        const pagoEm =
            assinaturaMP
                ?.summarized
                ?.last_charged_date ??
            agora;


        /* =================================================
           RECARREGA PAGAMENTO PARA EVITAR ESTADO ANTIGO
        ================================================= */

        const {
            data: pagamentoAtual,
            error: pagamentoAtualError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .select("*")
                .eq(
                    "id",
                    pagamento.id
                )
                .maybeSingle();


        if (
            pagamentoAtualError
        ) {
            throw pagamentoAtualError;
        }


        const pagamentoEfetivo =
            pagamentoAtual ??
            pagamento;


        /* =================================================
           JÁ PROCESSADO
        ================================================= */

        if (
            pagamentoEfetivo.assinatura_id
        ) {

            await sincronizarAssinaturaExistente(
                supabaseAdmin,
                pagamentoEfetivo.assinatura_id,
                preapprovalId,
                fimEm
            );


            const {
                error: atualizarPagamentoError,
            } =
                await supabaseAdmin
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        status:
                            "APROVADO",

                        pago_em:
                            pagamentoEfetivo.pago_em ??
                            pagoEm,

                        vencimento_em:
                            fimEm,

                        atualizado_em:
                            agora,
                    })
                    .eq(
                        "id",
                        pagamentoEfetivo.id
                    );


            if (
                atualizarPagamentoError
            ) {
                throw atualizarPagamentoError;
            }


            return responder(
                res,
                200,
                {
                    success: true,
                    processed: true,
                    alreadyProcessed: true,
                    status:
                        assinaturaMP.status,
                    assinaturaId:
                        pagamentoEfetivo.assinatura_id,
                }
            );
        }


        /* =================================================
           VERIFICA SE O WEBHOOK JÁ CRIOU A ASSINATURA
           MAS O PAGAMENTO AINDA NÃO FOI VINCULADO
        ================================================= */

        const {
            data: assinaturaMesmoPlano,
            error: assinaturaMesmoPlanoError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("assinaturas")
                .select(`
                    id,
                    plano_id,
                    oferta_id,
                    status,
                    inicio_em,
                    fim_em,
                    mercado_pago_preapproval_id
                `)
                .eq(
                    "igreja_id",
                    pagamentoEfetivo.igreja_id
                )
                .eq(
                    "plano_id",
                    pagamentoEfetivo.plano_id
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
                .limit(1)
                .maybeSingle();


        if (
            assinaturaMesmoPlanoError
        ) {
            throw assinaturaMesmoPlanoError;
        }


        if (
            assinaturaMesmoPlano
        ) {

            await sincronizarAssinaturaExistente(
                supabaseAdmin,
                assinaturaMesmoPlano.id,
                preapprovalId,
                fimEm
            );


            const {
                error: vincularPagamentoError,
            } =
                await supabaseAdmin
                    .schema("ebd")
                    .from("pagamentos_assinaturas")
                    .update({
                        assinatura_id:
                            assinaturaMesmoPlano.id,

                        status:
                            "APROVADO",

                        pago_em:
                            pagoEm,

                        vencimento_em:
                            fimEm,

                        atualizado_em:
                            agora,
                    })
                    .eq(
                        "id",
                        pagamentoEfetivo.id
                    );


            if (
                vincularPagamentoError
            ) {
                throw vincularPagamentoError;
            }


            return responder(
                res,
                200,
                {
                    success: true,
                    processed: true,
                    recovered: true,
                    status:
                        assinaturaMP.status,
                    assinaturaId:
                        assinaturaMesmoPlano.id,
                }
            );
        }


        /* =================================================
           LOCALIZA ASSINATURA ATUAL
        ================================================= */

        const {
            data: assinaturaAtual,
            error: assinaturaAtualError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("assinaturas")
                .select(`
                    id,
                    plano_id,
                    status,
                    fim_em,
                    carencia_ate,
                    gratuito_contratado,
                    mercado_pago_preapproval_id,
                    renovacao_automatica
                `)
                .eq(
                    "igreja_id",
                    pagamentoEfetivo.igreja_id
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
                .limit(1)
                .maybeSingle();


        if (
            assinaturaAtualError
        ) {
            throw assinaturaAtualError;
        }


        /* =================================================
           ENCERRA ASSINATURA ANTERIOR ANTES DE CRIAR A NOVA

           IMPORTANTE:
           Existe um índice único garantindo no máximo uma
           assinatura ATIVA por igreja. Portanto a antiga precisa
           ser encerrada antes da inserção da nova.

           Se outro processo (webhook/sync concorrente) criar a
           nova assinatura primeiro, recuperamos o registro vencedor.
        ================================================= */

        let assinaturaAnteriorEncerrada =
            false;


        if (
            assinaturaAtual
        ) {

            const {
                error: encerrarError,
            } =
                await supabaseAdmin
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
                    )
                    .eq(
                        "status",
                        "ATIVA"
                    );


            if (
                encerrarError
            ) {

                console.error(
                    "[SYNC] Erro ao encerrar assinatura anterior:",
                    encerrarError
                );

                throw encerrarError;
            }


            assinaturaAnteriorEncerrada =
                true;
        }


        /* =================================================
           CRIA NOVA ASSINATURA
        ================================================= */

        const {
            data: novaAssinatura,
            error: novaAssinaturaError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("assinaturas")
                .insert({
                    igreja_id:
                        pagamentoEfetivo.igreja_id,

                    plano_id:
                        pagamentoEfetivo.plano_id,

                    oferta_id:
                        pagamentoEfetivo.oferta_id,

                    status:
                        "ATIVA",

                    inicio_em:
                        assinaturaMP.date_created ??
                        agora,

                    fim_em:
                        fimEm,

                    carencia_ate:
                        null,

                    preco_contratado:
                        pagamentoEfetivo.valor,

                    gratuito_contratado:
                        false,

                    duracao_gratuita_contratada_dias:
                        0,

                    preco_recorrente_contratado:
                        pagamentoEfetivo.valor,

                    periodo_recorrente_contratado:
                        pagamentoEfetivo.periodo,

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
                })
                .select(
                    "id"
                )
                .single();


        if (
            novaAssinaturaError ||
            !novaAssinatura
        ) {

            /*
             * Corrida legítima:
             * webhook ou outra chamada de sincronização pode ter
             * criado a assinatura depois que encerramos a antiga.
             * Nesse caso recuperamos a assinatura ATIVA vencedora.
             */

            const {
                data: assinaturaConcorrente,
                error: assinaturaConcorrenteError,
            } =
                await supabaseAdmin
                    .schema("ebd")
                    .from("assinaturas")
                    .select(
                        "id, plano_id, mercado_pago_preapproval_id"
                    )
                    .eq(
                        "igreja_id",
                        pagamentoEfetivo.igreja_id
                    )
                    .eq(
                        "status",
                        "ATIVA"
                    )
                    .eq(
                        "plano_id",
                        pagamentoEfetivo.plano_id
                    )
                    .order(
                        "inicio_em",
                        {
                            ascending:
                                false,
                        }
                    )
                    .limit(1)
                    .maybeSingle();


            if (
                assinaturaConcorrenteError
            ) {

                throw assinaturaConcorrenteError;
            }


            if (
                assinaturaConcorrente &&
                (
                    !assinaturaConcorrente
                        .mercado_pago_preapproval_id ||
                    assinaturaConcorrente
                        .mercado_pago_preapproval_id ===
                    preapprovalId
                )
            ) {

                await sincronizarAssinaturaExistente(
                    supabaseAdmin,
                    assinaturaConcorrente.id,
                    preapprovalId,
                    fimEm
                );


                const {
                    error: vincularConcorrenteError,
                } =
                    await supabaseAdmin
                        .schema("ebd")
                        .from("pagamentos_assinaturas")
                        .update({
                            assinatura_id:
                                assinaturaConcorrente.id,

                            status:
                                "APROVADO",

                            pago_em:
                                pagoEm,

                            vencimento_em:
                                fimEm,

                            atualizado_em:
                                agora,
                        })
                        .eq(
                            "id",
                            pagamentoEfetivo.id
                        );


                if (
                    vincularConcorrenteError
                ) {

                    throw vincularConcorrenteError;
                }


                return responder(
                    res,
                    200,
                    {
                        success: true,
                        processed: true,
                        recovered: true,
                        concurrent: true,
                        status:
                            assinaturaMP.status,
                        assinaturaId:
                            assinaturaConcorrente.id,
                    }
                );
            }


            /*
             * Nenhum processo concorrente venceu.
             * Restauramos a assinatura anterior para não deixar
             * a igreja sem plano ativo por uma falha de inserção.
             */

            if (
                assinaturaAtual &&
                assinaturaAnteriorEncerrada
            ) {

                const {
                    error: restaurarError,
                } =
                    await supabaseAdmin
                        .schema("ebd")
                        .from("assinaturas")
                        .update({
                            status:
                                "ATIVA",

                            fim_em:
                                assinaturaAtual.fim_em ??
                                null,

                            carencia_ate:
                                assinaturaAtual.carencia_ate ??
                                null,

                            renovacao_automatica:
                                assinaturaAtual.renovacao_automatica ??
                                false,

                            updated_at:
                                new Date()
                                    .toISOString(),
                        })
                        .eq(
                            "id",
                            assinaturaAtual.id
                        );


                if (
                    restaurarError
                ) {

                    console.error(
                        "[SYNC] Falha ao restaurar assinatura anterior após erro de inserção:",
                        restaurarError
                    );
                }
            }


            throw novaAssinaturaError ??
            new Error(
                "Falha ao criar assinatura."
            );
        }


        /* =================================================
           ATUALIZA PAGAMENTO
        ================================================= */

        const {
            error: atualizarPagamentoError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pagamentos_assinaturas")
                .update({
                    assinatura_id:
                        novaAssinatura.id,

                    status:
                        "APROVADO",

                    pago_em:
                        pagoEm,

                    vencimento_em:
                        fimEm,

                    atualizado_em:
                        agora,
                })
                .eq(
                    "id",
                    pagamentoEfetivo.id
                );


        if (
            atualizarPagamentoError
        ) {

            await supabaseAdmin
                .schema("ebd")
                .from("assinaturas")
                .delete()
                .eq(
                    "id",
                    novaAssinatura.id
                );


            if (
                assinaturaAtual &&
                assinaturaAnteriorEncerrada
            ) {

                await supabaseAdmin
                    .schema("ebd")
                    .from("assinaturas")
                    .update({
                        status:
                            "ATIVA",

                        fim_em:
                            assinaturaAtual.fim_em ??
                            null,

                        carencia_ate:
                            assinaturaAtual.carencia_ate ??
                            null,

                        renovacao_automatica:
                            assinaturaAtual.renovacao_automatica ??
                            false,

                        updated_at:
                            new Date()
                                .toISOString(),
                    })
                    .eq(
                        "id",
                        assinaturaAtual.id
                    );
            }


            throw atualizarPagamentoError;
        }


        /* =================================================
           CANCELA RECORRÊNCIA DA ASSINATURA ANTERIOR
        ================================================= */

        if (
            assinaturaAtual &&
            assinaturaAtual.id !==
            novaAssinatura.id
        ) {

            await registrarCancelamentoAssinaturaAnterior(
                supabaseAdmin,
                assinaturaAtual,
                preapprovalId
            );
        }


        console.log(
            "[SYNC] Plano sincronizado:",
            {
                igrejaId:
                    pagamentoEfetivo.igreja_id,

                planoId:
                    pagamentoEfetivo.plano_id,

                assinaturaId:
                    novaAssinatura.id,

                preapprovalId,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,
                processed: true,
                status:
                    assinaturaMP.status,
                assinaturaId:
                    novaAssinatura.id,
            }
        );

    } catch (error) {

        console.error(
            "[SYNC] Erro:",
            error
        );


        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Erro interno ao sincronizar assinatura.",
            }
        );
    }
}
