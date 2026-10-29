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

        // Perfis autorizados não dependem de plano nem de assinatura.

        // =====================================================
        // ALTERA PERFIL
        // =====================================================

        const dadosAtualizacao:
            Record<string, unknown> = {
            perfil:
                novoPerfil,
        };


        if (
            novoPerfil !==
            "ALUNO"
        ) {

            dadosAtualizacao.classe_id =
                null;
        }


        const {
            data: pessoaAtualizada,
            error: updateError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .update(
                    dadosAtualizacao
                )
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