import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};

const TERMOS_VERSAO =
    "2026-09-23";

const PRIVACIDADE_VERSAO =
    "2026-09-23";

const LGPD_VERSAO =
    "2026-09-23";

function resposta(
    body: Record<string, unknown>,
    status = 200
) {
    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type":
                    "application/json; charset=utf-8",
                "Cache-Control":
                    "no-store",
            },
        }
    );
}

Deno.serve(async (
    req: Request
) => {

    if (
        req.method ===
        "OPTIONS"
    ) {
        return new Response(
            "ok",
            {
                headers:
                    corsHeaders,
            }
        );
    }


    if (
        req.method !==
        "POST"
    ) {
        return resposta(
            {
                error:
                    "Método não permitido.",
            },
            405
        );
    }


    try {

        const supabaseUrl =
            Deno.env.get(
                "SUPABASE_URL"
            );

        const serviceRoleKey =
            Deno.env.get(
                "EBD_MANAGER_ADMIN_KEY"
            );


        if (
            !supabaseUrl ||
            !serviceRoleKey
        ) {
            throw new Error(
                "Configuração da função incompleta."
            );
        }


        const authorization =
            req.headers.get(
                "Authorization"
            ) ??
            "";

        const token =
            authorization
                .startsWith(
                    "Bearer "
                )
                ? authorization
                    .slice(
                        7
                    )
                    .trim()
                : "";


        if (!token) {
            return resposta(
                {
                    error:
                        "Sessão não encontrada.",
                },
                401
            );
        }


        const admin =
            createClient(
                supabaseUrl,
                serviceRoleKey,
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
            data:
                userData,
            error:
                userError,
        } =
            await admin.auth
                .getUser(
                    token
                );


        if (
            userError ||
            !userData.user
        ) {
            return resposta(
                {
                    error:
                        "Sessão inválida ou expirada.",
                },
                401
            );
        }


        const body =
            await req.json();


        const nomeIgreja =
            String(
                body?.igreja
                    ?.nome ??
                ""
            ).trim();

        const sigla =
            String(
                body?.igreja
                    ?.sigla ??
                ""
            ).trim();

        const cnpj =
            String(
                body?.igreja
                    ?.cnpj ??
                ""
            ).trim();

        const telefone =
            String(
                body?.igreja
                    ?.telefone ??
                ""
            ).trim();

        const email =
            String(
                body?.igreja
                    ?.email ??
                ""
            )
                .trim()
                .toLowerCase();

        const aceites =
            body?.aceites ??
            {};


        if (
            !nomeIgreja ||
            !telefone ||
            !email
        ) {
            return resposta(
                {
                    error:
                        "Informe o nome da igreja, telefone e e-mail de contato.",
                },
                400
            );
        }


        if (
            aceites.termos !==
                true ||
            aceites.privacidade !==
                true ||
            aceites.lgpd !==
                true ||
            aceites.representacao !==
                true
        ) {
            return resposta(
                {
                    error:
                        "Confirme os aceites obrigatórios para concluir a adesão.",
                },
                400
            );
        }


        const {
            data,
            error,
        } =
            await admin
                .schema("ebd")
                .rpc(
                    "converter_demo_em_igreja",
                    {
                        p_user_id:
                            userData
                                .user
                                .id,
                        p_nome_igreja:
                            nomeIgreja,
                        p_sigla:
                            sigla,
                        p_cnpj:
                            cnpj,
                        p_telefone:
                            telefone,
                        p_email:
                            email,
                        p_versao_termos:
                            TERMOS_VERSAO,
                        p_versao_privacidade:
                            PRIVACIDADE_VERSAO,
                        p_versao_lgpd:
                            LGPD_VERSAO,
                    }
                );


        if (error) {
            throw error;
        }


        return resposta({
            success:
                true,
            message:
                "Dados da igreja registrados. Agora escolha o plano.",
            igreja:
                data,
        });


    } catch (error) {

        console.error(
            "[DEMO-CONVERT] Erro:",
            error
        );


        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível concluir a adesão.",
            },
            500
        );
    }
});
