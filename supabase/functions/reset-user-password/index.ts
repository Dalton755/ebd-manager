import { createClient } from "@supabase/supabase-js";

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
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const supabaseUrl =
            Deno.env.get("SUPABASE_URL");

        const supabaseServiceRoleKey =
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (
            !supabaseUrl ||
            !supabaseServiceRoleKey
        ) {
            throw new Error(
                "Variáveis do Supabase não configuradas."
            );
        }

        const supabase = createClient(
            supabaseUrl,
            supabaseServiceRoleKey
        );

        const token =
            authorization.replace("Bearer ", "");

        const {
            data: {
                user: usuarioLogado,
            },
            error: authError,
        } = await supabase.auth.getUser(
            token
        );

        if (
            authError ||
            !usuarioLogado
        ) {
            return new Response(
                JSON.stringify({
                    error: "Sessão inválida.",
                }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const {
            data: admin,
            error: adminError,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .select(`
                id,
                perfil,
                ativo,
                status
            `)
            .eq(
                "user_id",
                usuarioLogado.id
            )
            .maybeSingle();

        if (adminError) {
            throw adminError;
        }

        const ehAdmin =
            admin &&
            admin.perfil === "ADMIN" &&
            admin.ativo === true &&
            admin.status === "ATIVO";

        if (!ehAdmin) {
            return new Response(
                JSON.stringify({
                    error:
                        "Você não possui permissão para redefinir senhas.",
                }),
                {
                    status: 403,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const {
            solicitacaoId,
            novaSenha,
        } = await req.json();

        if (
            !solicitacaoId ||
            !novaSenha
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "Solicitação e nova senha são obrigatórias.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (novaSenha.length < 6) {
            return new Response(
                JSON.stringify({
                    error:
                        "A nova senha deve ter pelo menos 6 caracteres.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const {
            data: solicitacao,
            error: solicitacaoError,
        } = await supabase
            .schema("ebd")
            .from("solicitacoes_senha")
            .select(`
                id,
                pessoa_id,
                status
            `)
            .eq(
                "id",
                solicitacaoId
            )
            .eq(
                "status",
                "PENDENTE"
            )
            .maybeSingle();

        if (solicitacaoError) {
            throw solicitacaoError;
        }

        if (!solicitacao) {
            return new Response(
                JSON.stringify({
                    error:
                        "Solicitação pendente não encontrada.",
                }),
                {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const {
            data: pessoa,
            error: pessoaError,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .select(`
                id,
                user_id,
                nome,
                telefone
            `)
            .eq(
                "id",
                solicitacao.pessoa_id
            )
            .single();

        if (pessoaError) {
            throw pessoaError;
        }

        if (!pessoa.user_id) {
            return new Response(
                JSON.stringify({
                    error:
                        "Este usuário não possui uma conta de autenticação vinculada.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const {
            error: updatePasswordError,
        } = await supabase.auth.admin.updateUserById(
            pessoa.user_id,
            {
                password: novaSenha,
            }
        );

        if (updatePasswordError) {
            throw updatePasswordError;
        }

        const {
            error: concluirError,
        } = await supabase
            .schema("ebd")
            .from("solicitacoes_senha")
            .update({
                status: "CONCLUIDA",
                concluido_em:
                    new Date().toISOString(),
                atendido_por:
                    admin.id,
            })
            .eq(
                "id",
                solicitacao.id
            );

        if (concluirError) {
            throw concluirError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "Senha redefinida com sucesso.",
                pessoa: {
                    nome: pessoa.nome,
                    telefone: pessoa.telefone,
                },
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );

    } catch (error) {
        console.error(
            "Erro ao redefinir senha:",
            error
        );

        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao redefinir senha.",
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );
    }
});