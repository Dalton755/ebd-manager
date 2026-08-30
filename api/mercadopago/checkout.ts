import type {
    VercelRequest,
    VercelResponse,
} from "@vercel/node";

import {
    MercadoPagoConfig,
    PreApproval,
} from "mercadopago";

import {
    createClient,
} from "@supabase/supabase-js";

import dotenv from "dotenv";

import fs from "node:fs";
import path from "node:path";


// ============================================================
// AMBIENTE LOCAL
// ============================================================

const envLocal =
    path.resolve(
        process.cwd(),
        ".env.local"
    );

if (
    fs.existsSync(envLocal)
) {
    dotenv.config({
        path: envLocal,
    });
}


// ============================================================
// VARIÁVEIS
// ============================================================

const mercadopagoAccessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

const mercadoPagoBackUrl =
    process.env.MERCADOPAGO_BACK_URL;

const supabaseUrl =
    process.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY;

const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


// ============================================================
// RESPOSTA
// ============================================================

function responder(
    res: VercelResponse,
    status: number,
    body: unknown
) {
    return res
        .status(status)
        .json(body);
}


// ============================================================
// HANDLER
// ============================================================

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {

    // ========================================================
    // MÉTODO
    // ========================================================

    if (
        req.method !== "POST"
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


    // ========================================================
    // VERIFICAR AMBIENTE
    // ========================================================

    console.log(
        "[CHECKOUT ENV]",
        {
            cwd:
                process.cwd(),

            envLocal:
                fs.existsSync(
                    envLocal
                ),

            mercadopagoAccessToken:
                Boolean(
                    mercadopagoAccessToken
                ),

            supabaseUrl:
                Boolean(
                    supabaseUrl
                ),

            supabaseAnonKey:
                Boolean(
                    supabaseAnonKey
                ),

            supabaseServiceRoleKey:
                Boolean(
                    supabaseServiceRoleKey
                ),
        }
    );


    if (
        !mercadopagoAccessToken ||
        !supabaseUrl ||
        !supabaseAnonKey ||
        !supabaseServiceRoleKey
    ) {

        console.error(
            "[CHECKOUT] Variáveis de ambiente ausentes."
        );

        return responder(
            res,
            500,
            {
                success: false,
                error:
                    "Configuração do servidor incompleta.",
            }
        );

    }


    try {

        // ====================================================
        // AUTORIZAÇÃO
        // ====================================================

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


        // ====================================================
        // SUPABASE — USUÁRIO
        // ====================================================

        const supabaseAuth =
            createClient(
                supabaseUrl,
                supabaseAnonKey,
                {
                    auth: {
                        autoRefreshToken:
                            false,

                        persistSession:
                            false,
                    },
                }
            );


        // ====================================================
        // SUPABASE — ADMIN
        //
        // IMPORTANTE:
        // O schema ebd é configurado AQUI.
        //
        // Não usamos:
        //
        // .schema("ebd")
        //
        // Isso evita os GenericStringError.
        // ====================================================

        const supabaseAdmin: any =
            createClient(
                supabaseUrl,
                supabaseServiceRoleKey,
                {
                    db: {
                        schema: "ebd",
                    },

                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                }
            );


        // ====================================================
        // IDENTIFICAR USUÁRIO
        // ====================================================

        const {
            data: authData,
            error: authError,
        } =
            await supabaseAuth.auth.getUser(
                authorization.replace(
                    "Bearer ",
                    ""
                )
            );


        if (
            authError ||
            !authData.user
        ) {

            console.error(
                "[CHECKOUT] Usuário não autenticado:",
                authError
            );

            return responder(
                res,
                401,
                {
                    success: false,
                    error:
                        "Sessão inválida ou expirada.",
                }
            );

        }


        const user =
            authData.user;


        console.log(
            "[CHECKOUT] Usuário autenticado:",
            user.id
        );


        // ====================================================
        // OFERTA ID
        // ====================================================

        const ofertaId =
            typeof req.body?.oferta_id ===
                "string"
                ? req.body.oferta_id.trim()
                : "";


        console.log(
            "[CHECKOUT] ofertaId:",
            ofertaId
        );


        if (
            !ofertaId
        ) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "oferta_id não informado.",
                }
            );

        }


        // ====================================================
        // PESSOA
        //
        // TABELA REAL:
        //
        // ebd.pessoas
        // ====================================================

        const {
            data: pessoa,
            error: pessoaError,
        } =
            await supabaseAdmin
                .from("pessoas")
                .select(
                    [
                        "id",
                        "nome",
                        "email",
                        "user_id",
                        "igreja_id",
                        "ativo",
                        "status",
                    ].join(",")
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
                "[CHECKOUT] Erro ao consultar pessoa:",
                pessoaError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Erro ao consultar os dados do usuário.",
                    details:
                        pessoaError.message,
                }
            );

        }


        if (
            !pessoa
        ) {

            console.error(
                "[CHECKOUT] Pessoa não encontrada:",
                user.id
            );

            return responder(
                res,
                404,
                {
                    success: false,
                    error:
                        "Não foi possível localizar os dados do usuário.",
                }
            );

        }


        if (
            !pessoa.igreja_id
        ) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "O usuário não possui uma igreja vinculada.",
                }
            );

        }


        console.log(
            "[CHECKOUT] Pessoa encontrada:",
            {
                id:
                    pessoa.id,

                nome:
                    pessoa.nome,

                email:
                    pessoa.email,

                igreja_id:
                    pessoa.igreja_id,
            }
        );


        // ====================================================
        // E-MAIL DO PAGADOR
        // ====================================================

        const mercadopagoTestMode =
            String(
                process.env.MERCADOPAGO_TEST_MODE ?? ""
            )
                .trim()
                .toLowerCase() === "true";

        const testPayerEmail =
            process.env.MERCADOPAGO_TEST_PAYER_EMAIL?.trim();

        const emailUsuario =
            typeof pessoa.email === "string" &&
                pessoa.email.trim()
                ? pessoa.email.trim()
                : user.email?.trim();

        const payerEmail =
            mercadopagoTestMode
                ? (
                    testPayerEmail ||
                    emailUsuario
                )
                : emailUsuario;


        if (
            !payerEmail
        ) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "Não foi possível identificar o e-mail do usuário.",
                }
            );

        }


        // ====================================================
        // OFERTA
        //
        // TABELA REAL:
        //
        // ebd.ofertas_planos
        // ====================================================

        const {
            data: oferta,
            error: ofertaError,
        } =
            await supabaseAdmin
                .from("ofertas_planos")
                .select(
                    [
                        "id",
                        "plano_id",
                        "preco_recorrente",
                        "gratuito",
                        "duracao_gratuita_dias",
                        "periodo_recorrente",
                        "ativa",
                        "mercado_pago_plan_id",
                    ].join(",")
                )
                .eq(
                    "id",
                    ofertaId
                )
                .eq(
                    "ativa",
                    true
                )
                .maybeSingle();


        if (
            ofertaError
        ) {

            console.error(
                "[CHECKOUT] Erro ao consultar oferta:",
                ofertaError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Erro ao consultar a oferta.",
                    details:
                        ofertaError.message,
                }
            );

        }


        if (
            !oferta
        ) {

            console.error(
                "[CHECKOUT] Oferta não encontrada:",
                ofertaId
            );

            return responder(
                res,
                404,
                {
                    success: false,
                    error:
                        "Oferta não encontrada ou inativa.",
                }
            );

        }


        console.log(
            "[CHECKOUT] Oferta encontrada:",
            {
                id:
                    oferta.id,

                plano_id:
                    oferta.plano_id,

                preco:
                    oferta.preco_recorrente,

                periodo:
                    oferta.periodo_recorrente,
            }
        );


        // ====================================================
        // PLANO
        //
        // TABELA REAL:
        //
        // ebd.planos
        // ====================================================

        const {
            data: plano,
            error: planoError,
        } =
            await supabaseAdmin
                .from("planos")
                .select(
                    "id,nome"
                )
                .eq(
                    "id",
                    oferta.plano_id
                )
                .maybeSingle();


        if (
            planoError
        ) {

            console.error(
                "[CHECKOUT] Erro ao consultar plano:",
                planoError
            );

            return responder(
                res,
                500,
                {
                    success: false,
                    error:
                        "Erro ao consultar o plano.",
                    details:
                        planoError.message,
                }
            );

        }


        if (
            !plano
        ) {

            return responder(
                res,
                404,
                {
                    success: false,
                    error:
                        "Plano da oferta não encontrado.",
                }
            );

        }


        console.log(
            "[CHECKOUT] Plano encontrado:",
            plano
        );


        // ====================================================
        // VALOR
        // ====================================================

        const valor =
            Number(
                oferta.preco_recorrente
            );


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            return responder(
                res,
                400,
                {
                    success: false,
                    error:
                        "O valor da oferta é inválido.",
                }
            );

        }


        // ====================================================
        // PERÍODO
        // ====================================================

        const periodo =
            String(
                oferta.periodo_recorrente ??
                ""
            )
                .trim()
                .toUpperCase();


        let frequency = 1;

        let frequencyType:
            | "days"
            | "months" =
            "months";


        switch (
        periodo
        ) {

            case "MENSAL":

                frequency =
                    1;

                frequencyType =
                    "months";

                break;


            case "TRIMESTRAL":

                frequency =
                    3;

                frequencyType =
                    "months";

                break;


            case "SEMESTRAL":

                frequency =
                    6;

                frequencyType =
                    "months";

                break;


            case "ANUAL":

                frequency =
                    12;

                frequencyType =
                    "months";

                break;


            default:

                return responder(
                    res,
                    400,
                    {
                        success: false,
                        error:
                            `Período recorrente não suportado: ${periodo}`,
                    }
                );

        }


        // ====================================================
        // URL DO SISTEMA
        // ====================================================

        const appUrl =
            (
                process.env.APP_URL ||
                process.env.VITE_APP_URL ||
                ""
            )
                .trim()
                .replace(
                    /\/$/,
                    ""
                );


        // ====================================================
        // REFERÊNCIA
        // ====================================================

        const externalReference =
            [
                "EBD",
                pessoa.igreja_id,
                oferta.id,
                user.id,
                Date.now(),
            ].join("-");


        // ====================================================
        // MERCADO PAGO
        // ====================================================

        const mercadoPago =
            new MercadoPagoConfig({
                accessToken:
                    mercadopagoAccessToken,
            });


        const preApproval =
            new PreApproval(
                mercadoPago
            );


        // ====================================================
        // DADOS DO CHECKOUT
        // ====================================================

        const checkoutBody: Record<
            string,
            unknown
        > = {

            reason:
                `EBD Manager - ${plano.nome}`,

            external_reference:
                externalReference,

            payer_email:
                payerEmail,

            back_url:
                mercadoPagoBackUrl,

            auto_recurring: {

                frequency,

                frequency_type:
                    frequencyType,

                transaction_amount:
                    valor,

                currency_id:
                    "BRL",

            },

        };


        // ====================================================
        // PLANO MERCADO PAGO
        // ====================================================

        if (
            oferta.mercado_pago_plan_id
        ) {

            checkoutBody.preapproval_plan_id =
                oferta.mercado_pago_plan_id;

        }


        // ====================================================
        // BACK URL
        // ====================================================

        // ====================================================
        // BACK URL
        // ====================================================

        const backUrl =
            appUrl &&
                !appUrl.includes("localhost") &&
                !appUrl.includes("127.0.0.1")
                ? `${appUrl}/planos`
                : "https://ebd-manager-seven.vercel.app/planos";

        checkoutBody.back_url = backUrl;


        console.log(
            "[CHECKOUT] Criando assinatura:",
            {
                plano:
                    plano.nome,

                valor,

                periodo,

                payerEmail,

                externalReference,

                mercadoPagoPlanId:
                    oferta.mercado_pago_plan_id,

                checkoutBody,
            }
        );


        // ====================================================
        // CRIAR ASSINATURA
        // ====================================================

        let mercadoPagoResult: any;


        try {

            mercadoPagoResult =
                await preApproval.create(
                    {
                        body:
                            checkoutBody as any,
                    }
                );

        } catch (
        erroMercadoPago: any
        ) {

            console.error(
                "[CHECKOUT] Erro Mercado Pago:",
                erroMercadoPago
            );

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "O Mercado Pago recusou a criação do checkout.",
                    details:
                        erroMercadoPago?.message ??
                        erroMercadoPago?.cause?.message ??
                        String(
                            erroMercadoPago
                        ),
                }
            );

        }


        // ====================================================
        // RESULTADO MERCADO PAGO
        // ====================================================

        const preapprovalId =
            mercadoPagoResult?.id
                ? String(
                    mercadoPagoResult.id
                )
                : null;


        const checkoutUrl =
            mercadoPagoResult?.init_point
                ? String(
                    mercadoPagoResult.init_point
                )
                : mercadoPagoResult?.sandbox_init_point
                    ? String(
                        mercadoPagoResult.sandbox_init_point
                    )
                    : null;


        console.log(
            "[CHECKOUT] Resposta Mercado Pago:",
            {
                preapprovalId,

                checkoutUrl:
                    Boolean(
                        checkoutUrl
                    ),

                status:
                    mercadoPagoResult?.status,
            }
        );


        if (
            !preapprovalId
        ) {

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "Mercado Pago não retornou o ID da assinatura.",
                }
            );

        }


        if (
            !checkoutUrl
        ) {

            return responder(
                res,
                502,
                {
                    success: false,
                    error:
                        "Mercado Pago não retornou a URL de checkout.",
                }
            );

        }


        // ====================================================
        // REGISTRAR NO BANCO
        //
        // TABELA REAL:
        //
        // ebd.pagamentos_assinaturas
        // ====================================================

        const registro = {

            igreja_id:
                pessoa.igreja_id,

            assinatura_id:
                null,

            oferta_id:
                oferta.id,

            plano_id:
                oferta.plano_id,

            provedor:
                "MERCADO_PAGO",

            tipo:
                "ASSINATURA",

            status:
                "PENDENTE",

            valor,

            moeda:
                "BRL",

            periodo,

            mercado_pago_preapproval_id:
                preapprovalId,

            mercado_pago_payment_id:
                null,

            mercado_pago_external_reference:
                externalReference,

            checkout_url:
                checkoutUrl,

            pago_em:
                null,

            vencimento_em:
                null,

            metadata: {

                user_id:
                    user.id,

                pessoa_id:
                    pessoa.id,

                plano_nome:
                    plano.nome,

                gratuito:
                    Boolean(
                        oferta.gratuito
                    ),

                duracao_gratuita_dias:
                    oferta.duracao_gratuita_dias,

            },

        };


        const {
            data: pagamento,
            error: pagamentoError,
        } =
            await supabaseAdmin
                .from(
                    "pagamentos_assinaturas"
                )
                .insert(
                    registro
                )
                .select(
                    "id"
                )
                .single();


        if (
            pagamentoError
        ) {

            console.error(
                "[CHECKOUT] Erro ao registrar checkout:",
                pagamentoError
            );

            /**
             * O pagamento já foi criado no Mercado Pago.
             * Não descartamos a URL.
             */

            return responder(
                res,
                200,
                {
                    success: true,

                    checkout_url:
                        checkoutUrl,

                    mercado_pago_preapproval_id:
                        preapprovalId,

                    warning:
                        "Checkout criado no Mercado Pago, mas houve erro ao registrar no banco.",

                    database_error:
                        pagamentoError.message,
                }
            );

        }


        // ====================================================
        // SUCESSO
        // ====================================================

        console.log(
            "[CHECKOUT] SUCESSO",
            {
                pagamento_id:
                    pagamento?.id,

                preapprovalId,

                ofertaId,

                igreja_id:
                    pessoa.igreja_id,
            }
        );


        return responder(
            res,
            200,
            {
                success: true,

                checkout_url:
                    checkoutUrl,

                pagamento_id:
                    pagamento?.id ??
                    null,

                mercado_pago_preapproval_id:
                    preapprovalId,

                oferta_id:
                    oferta.id,

                plano_id:
                    oferta.plano_id,

                plano_nome:
                    plano.nome,

                valor,

                periodo,
            }
        );


    } catch (
    erro: any
    ) {

        console.error(
            "[CHECKOUT] Erro inesperado:",
            erro
        );

        return responder(
            res,
            500,
            {
                success: false,

                error:
                    "Erro interno ao iniciar o checkout.",

                details:
                    erro?.message ??
                    String(
                        erro
                    ),
            }
        );

    }

}