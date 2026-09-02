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
                "Content-Type":
                    "application/json",
            },
        }
    );

}


Deno.serve(
    async (
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

            // =====================================================
            // CONFIGURAÇÃO
            // =====================================================

            const supabaseUrl =
                Deno.env.get(
                    "SUPABASE_URL"
                );


            const serviceRoleKey =
                Deno.env.get(
                    "SUPABASE_SERVICE_ROLE_KEY"
                );


            if (
                !supabaseUrl ||
                !serviceRoleKey
            ) {

                throw new Error(
                    "Configuração da função incompleta."
                );

            }


            const supabaseAdmin =
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


            // =====================================================
            // ENTRADA
            // =====================================================

            const body =
                await req.json();


            const action =
                String(
                    body?.action ??
                    ""
                )
                    .trim()
                    .toUpperCase();


            const igrejaId =
                String(
                    body?.igreja_id ??
                    ""
                )
                    .trim();


            if (
                !igrejaId
            ) {

                return resposta(
                    {
                        error:
                            "Igreja não informada.",

                        codigo:
                            "IGREJA_NAO_INFORMADA",
                    },
                    400
                );

            }


            // =====================================================
            // LOCALIZA E VALIDA IGREJA
            // =====================================================

            const {
                data:
                    igreja,

                error:
                    igrejaError,

            } =
                await supabaseAdmin
                    .schema(
                        "ebd"
                    )
                    .from(
                        "igrejas"
                    )
                    .select(`
                        id,
                        nome,
                        sigla,
                        ativa
                    `)
                    .eq(
                        "id",
                        igrejaId
                    )
                    .eq(
                        "ativa",
                        true
                    )
                    .maybeSingle();


            if (
                igrejaError
            ) {

                throw igrejaError;

            }


            if (
                !igreja
            ) {

                return resposta(
                    {
                        error:
                            "Este link de acesso não pertence a uma igreja ativa.",

                        codigo:
                            "IGREJA_INVALIDA",
                    },
                    404
                );

            }


            // =====================================================
            // SOMENTE VALIDAÇÃO
            // =====================================================

            if (
                action ===
                "VALIDATE"
            ) {

                return resposta(
                    {
                        success:
                            true,

                        igreja: {
                            id:
                                igreja.id,

                            nome:
                                igreja.nome,

                            sigla:
                                igreja.sigla,
                        },
                    },
                    200
                );

            }


            // =====================================================
            // CADASTRO
            // =====================================================

            if (
                action !==
                "REGISTER"
            ) {

                return resposta(
                    {
                        error:
                            "Operação inválida.",

                        codigo:
                            "OPERACAO_INVALIDA",
                    },
                    400
                );

            }


            const nome =
                String(
                    body?.nome ??
                    ""
                )
                    .trim();


            const email =
                String(
                    body?.email ??
                    ""
                )
                    .trim()
                    .toLowerCase();


            const telefone =
                String(
                    body?.telefone ??
                    ""
                )
                    .trim();


            const password =
                String(
                    body?.password ??
                    ""
                );


            if (
                !nome ||
                !email ||
                !telefone ||
                !password
            ) {

                return resposta(
                    {
                        error:
                            "Preencha todos os campos obrigatórios.",

                        codigo:
                            "DADOS_OBRIGATORIOS",
                    },
                    400
                );

            }


            if (
                password.length <
                6
            ) {

                return resposta(
                    {
                        error:
                            "A senha deve ter pelo menos 6 caracteres.",

                        codigo:
                            "SENHA_INVALIDA",
                    },
                    400
                );

            }


            // =====================================================
            // VERIFICA SE JÁ EXISTE PESSOA COM O E-MAIL
            // =====================================================

            const {
                data:
                    pessoaExistente,

                error:
                    pessoaExistenteError,

            } =
                await supabaseAdmin
                    .schema(
                        "ebd"
                    )
                    .from(
                        "pessoas"
                    )
                    .select(`
                        id,
                        igreja_id
                    `)
                    .eq(
                        "email",
                        email
                    )
                    .maybeSingle();


            if (
                pessoaExistenteError
            ) {

                throw pessoaExistenteError;

            }


            if (
                pessoaExistente
            ) {

                return resposta(
                    {
                        error:
                            "Já existe um cadastro com este e-mail.",

                        codigo:
                            "EMAIL_JA_CADASTRADO",
                    },
                    409
                );

            }


            // =====================================================
            // CRIA USUÁRIO NO SUPABASE AUTH
            // =====================================================

            const {
                data:
                    authData,

                error:
                    authError,

            } =
                await supabaseAdmin
                    .auth
                    .admin
                    .createUser({

                        email,

                        password,

                        email_confirm:
                            true,

                        user_metadata: {

                            full_name:
                                nome,

                        },

                    });


            if (
                authError ||
                !authData.user
            ) {

                return resposta(
                    {
                        error:
                            authError?.message ??
                            "Não foi possível criar o usuário.",

                        codigo:
                            "ERRO_AUTH",
                    },
                    400
                );

            }


            const userId =
                authData.user.id;


            // =====================================================
            // CRIA A PESSOA COMO ALUNO ATIVO
            // =====================================================

            const {
                data:
                    pessoa,

                error:
                    pessoaError,

            } =
                await supabaseAdmin
                    .schema(
                        "ebd"
                    )
                    .from(
                        "pessoas"
                    )
                    .insert({

                        user_id:
                            userId,

                        igreja_id:
                            igreja.id,

                        nome,

                        email,

                        telefone,

                        perfil:
                            "ALUNO",

                        status:
                            "ATIVO",

                        ativo:
                            true,

                        senha_temporaria:
                            false,

                    })
                    .select(`
                        id,
                        user_id,
                        igreja_id,
                        nome,
                        email,
                        telefone,
                        perfil,
                        status,
                        ativo
                    `)
                    .single();


            if (
                pessoaError
            ) {

                // Evita deixar usuário órfão no Auth.

                await supabaseAdmin
                    .auth
                    .admin
                    .deleteUser(
                        userId
                    );


                throw pessoaError;

            }


            // =====================================================
            // SUCESSO
            // =====================================================

            return resposta(
                {
                    success:
                        true,

                    message:
                        "Conta criada com sucesso.",

                    igreja: {
                        id:
                            igreja.id,

                        nome:
                            igreja.nome,
                    },

                    pessoa: {
                        id:
                            pessoa.id,

                        igreja_id:
                            pessoa.igreja_id,

                        nome:
                            pessoa.nome,

                        email:
                            pessoa.email,

                        perfil:
                            pessoa.perfil,

                        status:
                            pessoa.status,

                        ativo:
                            pessoa.ativo,
                    },
                },
                200
            );


        } catch (
            error
        ) {

            console.error(
                "Erro em public-student-invite:",
                error
            );


            return resposta(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Erro interno ao processar convite.",
                },
                500
            );

        }

    }
);