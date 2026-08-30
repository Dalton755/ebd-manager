import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};

function resposta(
    body: Record<string, unknown>,
    status: number
) {
    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        }
    );
}

Deno.serve(async (req: Request) => {

    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    try {

        // =====================================================
        // AUTENTICAÇÃO
        // =====================================================

        const authorization =
            req.headers.get("Authorization");

        if (!authorization) {
            return resposta(
                {
                    error:
                        "Usuário não autenticado.",
                },
                401
            );
        }

        const supabaseUrl =
            Deno.env.get("SUPABASE_URL");

        const serviceRoleKey =
            Deno.env.get(
                "SUPABASE_SERVICE_ROLE_KEY"
            );

        if (
            !supabaseUrl ||
            !serviceRoleKey
        ) {
            throw new Error(
                "Configuração da função não está completa."
            );
        }

        const supabase =
            createClient(
                supabaseUrl,
                serviceRoleKey
            );

        // =====================================================
        // IDENTIFICA O USUÁRIO LOGADO
        // =====================================================

        const token =
            authorization.replace(
                "Bearer ",
                ""
            );

        const {
            data: {
                user: usuarioLogado,
            },
            error: authError,
        } =
            await supabase.auth.getUser(
                token
            );

        if (
            authError ||
            !usuarioLogado
        ) {
            return resposta(
                {
                    error:
                        "Sessão inválida.",
                },
                401
            );
        }

        // =====================================================
        // BUSCA O ADMINISTRADOR E A IGREJA
        // =====================================================

        const {
            data: admin,
            error: adminError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    perfil,
                    ativo,
                    status,
                    igreja_id
                `)
                .eq(
                    "user_id",
                    usuarioLogado.id
                )
                .maybeSingle();

        if (adminError) {
            throw adminError;
        }

        const podeGerenciarClasses =
            admin &&
            (
                admin.perfil === "ADMIN" ||
                admin.perfil === "SUPERINTENDENTE"
            ) &&
            admin.ativo === true &&
            admin.status === "ATIVO";

        if (!podeGerenciarClasses) {
            return resposta(
                {
                    error:
                        "Você não possui permissão para inativar classes.",
                },
                403
            );
        }

        if (!admin.igreja_id) {
            return resposta(
                {
                    error:
                        "Seu usuário não está vinculado a uma igreja.",
                },
                400
            );
        }

        const igrejaId =
            admin.igreja_id;

        // =====================================================
        // RECEBE O ID DA CLASSE
        // =====================================================

        const {
            id,
        } = await req.json();

        const classeId =
            String(id ?? "").trim();

        if (!classeId) {
            return resposta(
                {
                    error:
                        "O ID da classe é obrigatório.",
                },
                400
            );
        }

        // =====================================================
        // LOCALIZA A CLASSE
        // =====================================================

        const {
            data: classeExistente,
            error: classeBuscaError,
        } =
            await supabase
                .schema("ebd")
                .from("classes")
                .select(`
                    id,
                    igreja_id,
                    ativa
                `)
                .eq(
                    "id",
                    classeId
                )
                .maybeSingle();

        if (classeBuscaError) {
            throw classeBuscaError;
        }

        if (!classeExistente) {
            return resposta(
                {
                    error:
                        "Classe não encontrada.",
                },
                404
            );
        }

        // =====================================================
        // PROTEÇÃO DE IGREJA
        // =====================================================

        if (
            classeExistente.igreja_id !==
            igrejaId
        ) {
            return resposta(
                {
                    error:
                        "Você não possui acesso a esta classe.",
                },
                403
            );
        }

        // =====================================================
        // VERIFICA SE JÁ ESTÁ INATIVA
        // =====================================================

        if (!classeExistente.ativa) {
            return resposta(
                {
                    error:
                        "Esta classe já está inativa.",
                },
                400
            );
        }

        // =====================================================
        // INATIVA A CLASSE
        // =====================================================

        const {
            data: classeInativada,
            error: atualizacaoError,
        } =
            await supabase
                .schema("ebd")
                .from("classes")
                .update({
                    ativa: false,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq(
                    "id",
                    classeId
                )
                .eq(
                    "igreja_id",
                    igrejaId
                )
                .select()
                .single();

        if (atualizacaoError) {
            throw atualizacaoError;
        }

        // =====================================================
        // SUCESSO
        // =====================================================

        return resposta(
            {
                success: true,

                message:
                    "Classe inativada com sucesso.",

                classe:
                    classeInativada,
            },
            200
        );

    } catch (error) {

        console.error(
            "Erro ao inativar classe:",
            error
        );

        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao inativar classe.",
            },
            500
        );
    }
});