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
                        "Você não possui permissão para criar classes.",
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
                    max_classes
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
        // VERIFICA LIMITE DE CLASSES
        // =====================================================

        if (limites.max_classes !== -1) {

            const {
                count,
                error: countError,
            } =
                await supabase
                    .schema("ebd")
                    .from("classes")
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
                        "ativa",
                        true
                    );

            if (countError) {
                throw countError;
            }

            const quantidadeAtual =
                count ?? 0;

            if (
                quantidadeAtual >=
                limites.max_classes
            ) {
                return resposta(
                    {
                        error:
                            `O limite de ${limites.max_classes} classes do seu plano foi atingido.`,

                        codigo:
                            "LIMITE_CLASSES_ATINGIDO",

                        limite:
                            limites.max_classes,

                        utilizado:
                            quantidadeAtual,
                    },
                    403
                );
            }
        }

        // =====================================================
        // DADOS DA NOVA CLASSE
        // =====================================================

        const {
            nome,
            descricao,
            idade_minima,
            idade_maxima,
        } = await req.json();

        const nomeNormalizado =
            String(nome ?? "").trim();

        const descricaoNormalizada =
            String(descricao ?? "").trim();

        const idadeMinima =
            Number(idade_minima ?? 0);

        const idadeMaxima =
            Number(idade_maxima ?? 0);

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
        // CRIA CLASSE
        // =====================================================

        const {
            data: novaClasse,
            error: classeError,
        } =
            await supabase
                .schema("ebd")
                .from("classes")
                .insert({
                    nome:
                        nomeNormalizado,

                    descricao:
                        descricaoNormalizada,

                    idade_minima:
                        idadeMinima,

                    idade_maxima:
                        idadeMaxima,

                    igreja_id:
                        igrejaId,

                    ativa: true,
                })
                .select()
                .single();

        if (classeError) {
            throw classeError;
        }

        // =====================================================
        // SUCESSO
        // =====================================================

        return resposta(
            {
                success: true,

                message:
                    "Classe criada com sucesso.",

                classe:
                    novaClasse,
            },
            200
        );

    } catch (error) {

        console.error(
            "Erro ao criar classe:",
            error
        );

        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao criar classe.",
            },
            500
        );
    }
});