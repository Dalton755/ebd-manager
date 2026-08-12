import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};

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
            return new Response(
                JSON.stringify({
                    error: "Usuário não autenticado.",
                }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
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
                "Configuração do Supabase não encontrada."
            );
        }


        const supabase = createClient(
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
                user,
            },
            error: authError,
        } =
            await supabase.auth.getUser(
                token
            );


        if (
            authError ||
            !user
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "Sessão inválida.",
                }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // RECEBE A NOVA SENHA
        // =====================================================

        const {
            novaSenha,
        } = await req.json();


        if (
            typeof novaSenha !== "string" ||
            novaSenha.length < 6
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "A nova senha deve ter pelo menos 6 caracteres.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // LOCALIZA O CADASTRO
        // =====================================================

        const {
            data: pessoa,
            error: pessoaError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    user_id,
                    nome,
                    ativo,
                    status,
                    senha_temporaria
                `)
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (pessoaError) {
            throw pessoaError;
        }


        if (!pessoa) {
            return new Response(
                JSON.stringify({
                    error:
                        "Cadastro do usuário não encontrado.",
                }),
                {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // VERIFICA SE A SENHA É TEMPORÁRIA
        // =====================================================

        if (
            pessoa.senha_temporaria !== true
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "Este usuário não possui uma senha temporária.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // VERIFICA SE A CONTA ESTÁ ATIVA
        // =====================================================

        if (
            pessoa.ativo !== true ||
            pessoa.status !== "ATIVO"
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "A conta do usuário não está ativa.",
                }),
                {
                    status: 403,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // ALTERA A SENHA NO SUPABASE AUTH
        // =====================================================

        const {
            error: updatePasswordError,
        } =
            await supabase.auth.admin.updateUserById(
                user.id,
                {
                    password: novaSenha,
                }
            );


        if (updatePasswordError) {
            throw updatePasswordError;
        }


        // =====================================================
        // MARCA A SENHA COMO NÃO TEMPORÁRIA
        // =====================================================

        const {
            error: updatePessoaError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .update({
                    senha_temporaria: false,
                })
                .eq(
                    "id",
                    pessoa.id
                );


        if (updatePessoaError) {
            throw updatePessoaError;
        }


        // =====================================================
        // SUCESSO
        // =====================================================

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "Senha alterada com sucesso.",
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type":
                        "application/json",
                },
            }
        );


    } catch (error) {

        console.error(
            "Erro ao alterar senha temporária:",
            error
        );


        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao alterar senha.",
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type":
                        "application/json",
                },
            }
        );
    }
});