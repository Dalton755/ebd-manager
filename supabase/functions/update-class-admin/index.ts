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
                        "Você não possui permissão para editar classes.",
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
        // RECEBE OS DADOS
        // =====================================================

        const {
            id,
            nome,
            descricao,
            idade_minima,
            idade_maxima,
        } = await req.json();

        const classeId =
            String(id ?? "").trim();

        const nomeNormalizado =
            String(nome ?? "").trim();

        const descricaoNormalizada =
            String(descricao ?? "").trim();

        const idadeMinima =
            Number(idade_minima ?? 0);

        const idadeMaxima =
            Number(idade_maxima ?? 0);

        if (!classeId) {
            return resposta(
                {
                    error:
                        "O ID da classe é obrigatório.",
                },
                400
            );
        }

        if (!nomeNormalizado) {
            return resposta(
                {
                    error:
                        "O nome da classe é obrigatório.",
                },
                400
            );
        }

        // =====================================================
        // LOCALIZA A CLASSE DENTRO DA IGREJA
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
        // ATUALIZA A CLASSE
        // =====================================================

        const {
            data: classeAtualizada,
            error: atualizacaoError,
        } =
            await supabase
                .schema("ebd")
                .from("classes")
                .update({
                    nome:
                        nomeNormalizado,

                    descricao:
                        descricaoNormalizada,

                    idade_minima:
                        idadeMinima,

                    idade_maxima:
                        idadeMaxima,

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
                    "Classe atualizada com sucesso.",

                classe:
                    classeAtualizada,
            },
            200
        );

    } catch (error) {

        console.error(
            "Erro ao atualizar classe:",
            error
        );

        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao atualizar classe.",
            },
            500
        );
    }
});