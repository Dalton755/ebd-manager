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
        // CONFIGURAÇÃO
        // =====================================================

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
        // DADOS DO CADASTRO
        // =====================================================

        const {
            nome,
            email,
            telefone,
            igreja_id,
            password,
        } = await req.json();

        const nomeNormalizado =
            String(nome ?? "").trim();

        const emailNormalizado =
            String(email ?? "")
                .trim()
                .toLowerCase();

        const telefoneNormalizado =
            String(telefone ?? "").trim();

        const igrejaId =
            String(igreja_id ?? "").trim();

        const senha =
            String(password ?? "");

        // =====================================================
        // VALIDAÇÃO BÁSICA
        // =====================================================

        if (
            !nomeNormalizado ||
            !emailNormalizado ||
            !igrejaId ||
            !senha
        ) {
            return resposta(
                {
                    error:
                        "Nome, e-mail, senha e igreja são obrigatórios.",
                },
                400
            );
        }

        if (senha.length < 6) {
            return resposta(
                {
                    error:
                        "A senha deve ter pelo menos 6 caracteres.",
                },
                400
            );
        }

        // =====================================================
        // BUSCA A IGREJA
        // =====================================================

        const {
            data: igreja,
            error: igrejaError,
        } =
            await supabase
                .schema("ebd")
                .from("igrejas")
                .select(`
                    id,
                    nome,
                    ativa
                `)
                .eq(
                    "id",
                    igrejaId
                )
                .maybeSingle();

        if (igrejaError) {
            throw igrejaError;
        }

        if (!igreja) {
            return resposta(
                {
                    error:
                        "A igreja informada não foi encontrada.",
                    codigo:
                        "IGREJA_NAO_ENCONTRADA",
                },
                404
            );
        }

        if (!igreja.ativa) {
            return resposta(
                {
                    error:
                        "Esta igreja não está disponível para novos cadastros.",
                    codigo:
                        "IGREJA_INATIVA",
                },
                403
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
                        "Esta igreja não possui uma assinatura ativa.",
                    codigo:
                        "SEM_ASSINATURA_ATIVA",
                },
                403
            );
        }

        // =====================================================
// LIMITE DE PESSOAS
// =====================================================
//
// O cadastro público não verifica limite de pessoas.
//
// O usuário pode se cadastrar normalmente e ficará
// com status PENDENTE.
//
// O limite do plano será verificado somente quando
// o administrador tentar aprovar o cadastro.
//
// =====================================================



        // =====================================================
// LIMITE DE PESSOAS
// =====================================================
//
// IMPORTANTE:
// O cadastro público NÃO é bloqueado pelo limite.
//
// Pessoas com status PENDENTE não ocupam vaga.
// O limite será verificado somente quando
// o administrador tentar aprovar o cadastro.
//
// =====================================================

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
                    status,
                    igreja_id
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
            data: authData,
            error: createUserError,
        } =
            await supabase.auth.admin.createUser({
                email:
                    emailNormalizado,

                password:
                    senha,

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
            return resposta(
                {
                    error:
                        createUserError?.message ??
                        "Não foi possível criar o usuário.",
                },
                400
            );
        }

        const novoUserId =
            authData.user.id;

        // =====================================================
        // CRIA PESSOA PENDENTE
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

                    ativo:
                        false,

                    status:
                        "PENDENTE",

                    perfil:
                        "ALUNO",

                    senha_temporaria:
                        false,

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
                    "Cadastro realizado com sucesso. Aguarde a aprovação da igreja.",

                pessoa:
                    novaPessoa,

                igreja: {
                    id:
                        igreja.id,

                    nome:
                        igreja.nome,
                },
            },
            200
        );

    } catch (error) {

        console.error(
            "Erro no cadastro público:",
            error
        );

        return resposta(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro interno ao realizar cadastro.",
            },
            500
        );
    }
});