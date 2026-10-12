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
                "EBD_MANAGER_ADMIN_KEY"
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
        // DEMO NÃO CRIA CONTAS REAIS DE TERCEIROS
        // =====================================================

        const {
            data: igreja,
            error: igrejaError,
        } =
            await supabase
                .schema("ebd")
                .from("igrejas")
                .select(
                    "modo_demo"
                )
                .eq(
                    "id",
                    igrejaId
                )
                .maybeSingle();


        if (igrejaError) {
            throw igrejaError;
        }


        if (
            igreja?.modo_demo ===
            true
        ) {
            return resposta(
                {
                    error:
                        "Na demonstração, explore os usuários fictícios já preparados. A criação de contas reais fica disponível após a adesão.",
                    codigo:
                        "ACAO_INDISPONIVEL_NA_DEMO",
                },
                403
            );
        }

        // Cadastro de usuários liberado sem assinaturas ou cotas.

        // =====================================================
        // DADOS DO NOVO USUÁRIO
        // =====================================================

        const {
            nome,
            email,
            telefone,
            perfil,
            classe_id,
        } = await req.json();


        const perfilNormalizado =
            String(
                perfil ?? "ALUNO"
            )
                .trim()
                .toUpperCase();


        const classeId =
            classe_id
                ? String(
                    classe_id
                ).trim()
                : null;


        const perfisPermitidos = [
            "ADMIN",
            "PASTOR",
            "SUPERINTENDENTE",
            "SECRETARIO",
            "PROFESSOR",
            "ALUNO",
        ];


        if (
            !perfisPermitidos.includes(
                perfilNormalizado
            )
        ) {
            return resposta(
                {
                    error:
                        "Perfil inválido.",
                },
                400
            );
        }

        // Papéis definidos pela administração, sem cotas comerciais.

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
        // VALIDA CLASSE INFORMADA
        // =====================================================

        let classeValidadaId:
            string | null =
            null;


        if (
            perfilNormalizado ===
            "ALUNO" &&
            classeId
        ) {

            const {
                data: classe,
                error: classeError,
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


            if (classeError) {
                throw classeError;
            }


            if (!classe) {

                return resposta(
                    {
                        error:
                            "A classe selecionada não foi encontrada.",
                    },
                    400
                );
            }


            if (
                classe.igreja_id !==
                igrejaId
            ) {

                return resposta(
                    {
                        error:
                            "A classe selecionada não pertence à sua igreja.",
                    },
                    403
                );
            }


            if (
                classe.ativa !==
                true
            ) {

                return resposta(
                    {
                        error:
                            "A classe selecionada está inativa.",
                    },
                    400
                );
            }


            classeValidadaId =
                classe.id;
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

                    perfil:
                        perfilNormalizado,

                    classe_id:
                        perfilNormalizado ===
                            "ALUNO"
                            ? classeValidadaId
                            : null,

                    senha_temporaria:
                        true,

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
