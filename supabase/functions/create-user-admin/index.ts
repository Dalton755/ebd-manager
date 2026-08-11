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
        // AUTENTICAÇÃO DO ADMINISTRADOR
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

        const defaultPassword =
            Deno.env.get(
                "ADMIN_DEFAULT_PASSWORD"
            );


        if (
            !supabaseUrl ||
            !serviceRoleKey ||
            !defaultPassword
        ) {
            throw new Error(
                "Configuração da função não está completa."
            );
        }


        // Cliente privilegiado.
        // Usado SOMENTE no backend.
        const supabase = createClient(
            supabaseUrl,
            serviceRoleKey
        );


        // =====================================================
        // IDENTIFICA O ADMIN LOGADO
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
        // VERIFICA SE É ADMIN ATIVO
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
                        "Você não possui permissão para cadastrar usuários.",
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
        // DADOS DO NOVO USUÁRIO
        // =====================================================

        const {
            nome,
            email,
            telefone,
        } = await req.json();


        const emailNormalizado =
            String(email ?? "")
                .trim()
                .toLowerCase();

        const nomeNormalizado =
            String(nome ?? "").trim();

        const telefoneNormalizado =
            String(telefone ?? "").trim();


        if (
            !nomeNormalizado ||
            !emailNormalizado
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "Nome e e-mail são obrigatórios.",
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
        // VERIFICA SE JÁ EXISTE PESSOA COM ESSE E-MAIL
        // =====================================================

        const {
            data: pessoaExistente,
            error: pessoaExistenteError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    user_id,
                    nome,
                    email,
                    ativo,
                    status
                `)
                .eq(
                    "email",
                    emailNormalizado
                )
                .maybeSingle();


        if (pessoaExistenteError) {
            throw pessoaExistenteError;
        }


        if (pessoaExistente) {
            return new Response(
                JSON.stringify({
                    error:
                        "Já existe um cadastro com este e-mail.",
                }),
                {
                    status: 409,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // CRIA USUÁRIO NO SUPABASE AUTH
        // =====================================================

        const {
            data: authData,
            error: createUserError,
        } =
            await supabase.auth.admin.createUser({
                email: emailNormalizado,
                password: defaultPassword,
                email_confirm: true,
                user_metadata: {
                    full_name:
                        nomeNormalizado,
                },
            });


        if (
            createUserError ||
            !authData.user
        ) {
            throw (
                createUserError ??
                new Error(
                    "Não foi possível criar o usuário."
                )
            );
        }


        const novoUserId =
            authData.user.id;


        // =====================================================
        // CRIA CADASTRO NA TABELA EBD.PESSOAS
        // =====================================================

        const {
            data: novaPessoa,
            error: pessoaError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .insert({
                    user_id:
                        novoUserId,

                    nome:
                        nomeNormalizado,

                    email:
                        emailNormalizado,

                    telefone:
                        telefoneNormalizado,

                    ativo: true,

                    status: "ATIVO",

                    perfil: "ALUNO",
                })
                .select()
                .single();


        // =====================================================
        // ROLLBACK
        // =====================================================

        if (pessoaError) {

            console.error(
                "Erro ao criar pessoa. Removendo usuário do Auth:",
                pessoaError
            );


            await supabase.auth.admin.deleteUser(
                novoUserId
            );


            throw pessoaError;
        }


        // =====================================================
        // SUCESSO
        // =====================================================

        return new Response(
            JSON.stringify({
                success: true,

                message:
                    "Usuário cadastrado com sucesso.",

                pessoa: novaPessoa,
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
            "Erro ao criar usuário administrativo:",
            error
        );


        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao criar usuário.",
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