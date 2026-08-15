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

        const ehAdmin =
            admin &&
            admin.perfil === "ADMIN" &&
            admin.ativo === true &&
            admin.status === "ATIVO";

        if (!ehAdmin) {
            return resposta(
                {
                    error:
                        "Você não possui permissão para cadastrar usuários.",
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
        // BUSCA A ASSINATURA ATIVA
        // =====================================================

        const {
            data: assinatura,
            error: assinaturaError,
        } =
            await supabase
                .schema("ebd")
                .from("assinaturas")
                .select(`
                    id,
                    plano_id,
                    status
                `)
                .eq(
                    "igreja_id",
                    igrejaId
                )
                .eq(
                    "status",
                    "ATIVA"
                )
                .maybeSingle();

        if (assinaturaError) {
            throw assinaturaError;
        }

        if (!assinatura) {
            return resposta(
                {
                    error:
                        "A igreja não possui uma assinatura ativa.",
                },
                403
            );
        }

        // =====================================================
        // BUSCA O LIMITE DO PLANO
        // =====================================================

        const {
            data: limites,
            error: limitesError,
        } =
            await supabase
                .schema("ebd")
                .from("plano_limites")
                .select(`
                    max_pessoas
                `)
                .eq(
                    "plano_id",
                    assinatura.plano_id
                )
                .maybeSingle();

        if (limitesError) {
            throw limitesError;
        }

        if (!limites) {
            return resposta(
                {
                    error:
                        "Os limites do plano não foram encontrados.",
                },
                500
            );
        }

        // =====================================================
        // VERIFICA LIMITE DE PESSOAS
        // =====================================================

        if (limites.max_pessoas !== -1) {

            const {
                count,
                error: countError,
            } =
                await supabase
                    .schema("ebd")
                    .from("pessoas")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true,
                        }
                    )
                    .eq(
                        "igreja_id",
                        igrejaId
                    );

            if (countError) {
                throw countError;
            }

            const quantidadeAtual =
                count ?? 0;

            if (
                quantidadeAtual >=
                limites.max_pessoas
            ) {
                return resposta(
                    {
                        error:
                            `O limite de ${limites.max_pessoas} pessoas do seu plano foi atingido.`,
                        codigo:
                            "LIMITE_PESSOAS_ATINGIDO",
                        limite:
                            limites.max_pessoas,
                        utilizado:
                            quantidadeAtual,
                    },
                    403
                );
            }
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
            return resposta(
                {
                    error:
                        "Nome e e-mail são obrigatórios.",
                },
                400
            );
        }

        // =====================================================
        // VERIFICA E-MAIL DUPLICADO
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
            return resposta(
                {
                    error:
                        "Já existe um cadastro com este e-mail.",
                },
                409
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
                email:
                    emailNormalizado,

                password:
                    defaultPassword,

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
        // CRIA PESSOA
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

                    senha_temporaria: true,

                    igreja_id:
                        igrejaId,
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

        return resposta(
            {
                success: true,

                message:
                    "Usuário cadastrado com sucesso.",

                pessoa: novaPessoa,
            },
            200
        );

    } catch (error) {

        console.error(
            "Erro ao criar usuário administrativo:",
            error
        );

        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao criar usuário.",
            },
            500
        );
    }
});
