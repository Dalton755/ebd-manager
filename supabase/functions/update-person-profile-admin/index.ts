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

        const supabase = createClient(
            supabaseUrl,
            serviceRoleKey
        );

        // =====================================================
        // IDENTIFICA USUÁRIO LOGADO
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
        // DADOS DA REQUISIÇÃO
        // =====================================================

        const {
            pessoa_id,
            perfil,
        } = await req.json();

        const pessoaId =
            String(pessoa_id ?? "").trim();

        const novoPerfil =
            String(perfil ?? "").trim();

        if (!pessoaId || !novoPerfil) {
            return resposta(
                {
                    error:
                        "Pessoa e perfil são obrigatórios.",
                },
                400
            );
        }

        const perfisPermitidos = [
            "PENDENTE",
            "ADMIN",
            "PASTOR",
            "SUPERINTENDENTE",
            "SECRETARIO",
            "PROFESSOR",
            "ALUNO",
        ];

        if (
            !perfisPermitidos.includes(
                novoPerfil
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

        // =====================================================
        // BUSCA ADMINISTRADOR LOGADO
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

        const podeAlterar =
            admin &&
            (
                admin.perfil === "ADMIN" ||
                admin.perfil === "PASTOR" ||
                admin.perfil === "SUPERINTENDENTE"
            ) &&
            admin.ativo === true &&
            admin.status === "ATIVO";

        if (!podeAlterar) {
            return resposta(
                {
                    error:
                        "Você não possui permissão para alterar perfis.",
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
        // BUSCA A PESSOA
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
                    nome,
                    perfil,
                    ativo,
                    status,
                    igreja_id
                `)
                .eq(
                    "id",
                    pessoaId
                )
                .maybeSingle();

        if (pessoaError) {
            throw pessoaError;
        }

        if (!pessoa) {
            return resposta(
                {
                    error:
                        "Pessoa não encontrada.",
                },
                404
            );
        }

        // =====================================================
        // GARANTE QUE A PESSOA PERTENCE À IGREJA
        // =====================================================

        if (
            pessoa.igreja_id !==
            igrejaId
        ) {
            return resposta(
                {
                    error:
                        "A pessoa não pertence à sua igreja.",
                },
                403
            );
        }

        // =====================================================
        // SE NÃO HOUVE MUDANÇA
        // =====================================================

        if (
            pessoa.perfil ===
            novoPerfil
        ) {
            return resposta(
                {
                    success: true,
                    pessoa,
                },
                200
            );
        }

        // =====================================================
        // BUSCA ASSINATURA ATIVA
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
        // DESCOBRE QUAL LIMITE PRECISA SER VERIFICADO
        // =====================================================

        let colunaLimite:
            | "max_professores"
            | "max_secretarios"
            | "max_pastores"
            | "max_administradores"
            | "max_superintendentes"
            | null = null;

        let codigoLimite:
            | "LIMITE_PROFESSORES_ATINGIDO"
            | "LIMITE_SECRETARIOS_ATINGIDO"
            | "LIMITE_PASTORES_ATINGIDO"
            | "LIMITE_ADMINISTRADORES_ATINGIDO"
            | "LIMITE_SUPERINTENDENTES_ATINGIDO"
            | null = null;

        if (
            novoPerfil ===
            "PROFESSOR"
        ) {
            colunaLimite =
                "max_professores";

            codigoLimite =
                "LIMITE_PROFESSORES_ATINGIDO";
        }

        if (
            novoPerfil ===
            "SECRETARIO"
        ) {
            colunaLimite =
                "max_secretarios";

            codigoLimite =
                "LIMITE_SECRETARIOS_ATINGIDO";
        }

        if (
            novoPerfil ===
            "PASTOR"
        ) {
            colunaLimite =
                "max_pastores";

            codigoLimite =
                "LIMITE_PASTORES_ATINGIDO";
        }

        if (
            novoPerfil ===
            "ADMIN"
        ) {
            colunaLimite =
                "max_administradores";

            codigoLimite =
                "LIMITE_ADMINISTRADORES_ATINGIDO";
        }

        if (
            novoPerfil ===
            "SUPERINTENDENTE"
        ) {
            colunaLimite =
                "max_superintendentes";

            codigoLimite =
                "LIMITE_SUPERINTENDENTES_ATINGIDO";
        }

        // =====================================================
        // VERIFICA LIMITE
        // =====================================================

        if (
            colunaLimite &&
            codigoLimite
        ) {

            const {
                data: limites,
                error: limitesError,
            } =
                await supabase
                    .schema("ebd")
                    .from("plano_limites")
                    .select(
                        colunaLimite
                    )
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

            const limite =
                limites[
                colunaLimite
                ];

            if (
                limite !== -1
            ) {

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
                        )
                        .eq(
                            "perfil",
                            novoPerfil
                        )
                        .eq(
                            "ativo",
                            true
                        );

                if (countError) {
                    throw countError;
                }

                const utilizado =
                    count ?? 0;

                if (
                    utilizado >=
                    limite
                ) {

                    const nomesRecursos = {
                        PROFESSOR: "professores",
                        SECRETARIO: "secretários",
                        PASTOR: "pastores",
                        ADMIN: "administradores",
                        SUPERINTENDENTE: "superintendentes",
                    } as const;

                    const nomeRecurso =
                        nomesRecursos[
                        novoPerfil as keyof typeof nomesRecursos
                        ];

                    return resposta(
                        {
                            error:
                                `O limite de ${limite} ${nomeRecurso} do seu plano foi atingido.`,

                            codigo:
                                codigoLimite,

                            limite,

                            utilizado,
                        },
                        403
                    );
                }
            }
        }

        // =====================================================
        // ALTERA PERFIL
        // =====================================================

        const {
            data: pessoaAtualizada,
            error: updateError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .update({
                    perfil:
                        novoPerfil,
                })
                .eq(
                    "id",
                    pessoaId
                )
                .select()
                .single();

        if (updateError) {
            throw updateError;
        }

        // =====================================================
        // SUCESSO
        // =====================================================

        return resposta(
            {
                success: true,

                message:
                    "Perfil atualizado com sucesso.",

                pessoa:
                    pessoaAtualizada,
            },
            200
        );

    } catch (error) {

        console.error(
            "Erro ao atualizar perfil:",
            error
        );

        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao atualizar perfil.",
            },
            500
        );
    }
});