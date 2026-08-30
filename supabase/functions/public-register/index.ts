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
        return new Response(
            "ok",
            {
                headers: corsHeaders,
            }
        );
    }

    if (req.method !== "POST") {
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
                "Configuração da função não está completa."
            );
        }

        const supabaseAdmin =
            createClient(
                supabaseUrl,
                serviceRoleKey
            );


        // =====================================================
        // RECEBE DADOS
        // =====================================================

        const body =
            await req.json();

        const igrejaInput =
            body?.igreja ?? {};

        const administradorInput =
            body?.administrador ?? {};


        // =====================================================
        // DADOS DA IGREJA
        // =====================================================

        const nomeIgreja =
            String(
                igrejaInput.nome ?? ""
            ).trim();

        const sigla =
            String(
                igrejaInput.sigla ?? ""
            )
                .trim()
                .toUpperCase();

        const cnpj =
            String(
                igrejaInput.cnpj ?? ""
            ).trim();

        const telefoneIgreja =
            String(
                igrejaInput.telefone ?? ""
            ).trim();

        const emailIgreja =
            String(
                igrejaInput.email ?? ""
            )
                .trim()
                .toLowerCase();


        // =====================================================
        // DADOS DO ADMINISTRADOR
        // =====================================================

        const nomeAdministrador =
            String(
                administradorInput.nome ?? ""
            ).trim();

        const emailAdministrador =
            String(
                administradorInput.email ?? ""
            )
                .trim()
                .toLowerCase();

        const telefoneAdministrador =
            String(
                administradorInput.telefone ?? ""
            ).trim();

        const password =
            String(
                administradorInput.password ?? ""
            );


        // =====================================================
        // VALIDAÇÃO
        // =====================================================

        if (
            !nomeIgreja ||
            !nomeAdministrador ||
            !emailAdministrador ||
            !telefoneAdministrador ||
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


        if (password.length < 6) {

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
        // VERIFICA E-MAIL
        // =====================================================

        const {
            data: pessoaExistente,
            error: pessoaExistenteError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pessoas")
                .select("id")
                .eq(
                    "email",
                    emailAdministrador
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
        // LOCALIZA A OFERTA GRATUITA DA SEMENTER
        // =====================================================

        const {
            data: oferta,
            error: ofertaError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("ofertas_planos")
                .select(`
            id,
            plano_id,
            preco_recorrente,
            gratuito,
            duracao_gratuita_dias,
            periodo_recorrente,
            ativa,
            planos (
                id,
                nome,
                ativo
            )
        `)
                .eq("ativa", true)
                .eq("gratuito", true)
                .eq("duracao_gratuita_dias", 5)
                .maybeSingle();


        if (ofertaError) {

            throw ofertaError;

        }


        if (!oferta) {

            return resposta(
                {
                    error:
                        "O período de teste gratuito não está disponível no momento.",

                    codigo:
                        "TESTE_GRATUITO_INDISPONIVEL",
                },
                400
            );

        }


        const plano =
            Array.isArray(oferta.planos)
                ? oferta.planos[0]
                : oferta.planos;


        if (
            !plano ||
            !plano.ativo ||
            plano.nome !== "Semente"
        ) {

            return resposta(
                {
                    error:
                        "O plano gratuito Semente não está disponível no momento.",

                    codigo:
                        "PLANO_SEMENTE_INDISPONIVEL",
                },
                400
            );

        }


        // =====================================================
        // CRIA USUÁRIO AUTH
        // =====================================================

        const {
            data: authData,
            error: authError,
        } =
            await supabaseAdmin.auth.admin.createUser({

                email:
                    emailAdministrador,

                password:
                    password,

                email_confirm:
                    true,

                user_metadata: {

                    full_name:
                        nomeAdministrador,

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
                },
                400
            );
        }


        const userId =
            authData.user.id;


        // =====================================================
        // CRIA IGREJA
        // =====================================================

        const {
            data: igreja,
            error: igrejaError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("igrejas")
                .insert({

                    nome:
                        nomeIgreja,

                    sigla:
                        sigla || null,

                    cnpj:
                        cnpj || null,

                    telefone:
                        telefoneIgreja || null,

                    email:
                        emailIgreja || null,

                    ativa:
                        true,

                })
                .select()
                .single();


        if (igrejaError) {

            await supabaseAdmin.auth.admin.deleteUser(
                userId
            );

            throw igrejaError;
        }


        // =====================================================
        // CRIA ADMINISTRADOR
        // =====================================================

        const {
            data: pessoa,
            error: pessoaError,
        } =
            await supabaseAdmin
                .schema("ebd")
                .from("pessoas")
                .insert({

                    user_id:
                        userId,

                    nome:
                        nomeAdministrador,

                    email:
                        emailAdministrador,

                    telefone:
                        telefoneAdministrador,

                    ativo:
                        true,

                    status:
                        "ATIVO",

                    perfil:
                        "ADMIN",

                    senha_temporaria:
                        false,

                    igreja_id:
                        igreja.id,

                })
                .select()
                .single();


        if (pessoaError) {

            await supabaseAdmin
                .schema("ebd")
                .from("igrejas")
                .delete()
                .eq(
                    "id",
                    igreja.id
                );

            await supabaseAdmin.auth.admin.deleteUser(
                userId
            );

            throw pessoaError;
        }


        // =====================================================
        // IMPORTANTE
        // =====================================================
        // A assinatura NÃO é criada aqui.
        //
        // A igreja acabou de ser cadastrada.
        // O próximo passo será o administrador escolher
        // uma oferta na tela /planos.
        //
        // Isso garante que:
        //
        // cadastro da igreja
        //        ↓
        // escolha da oferta
        //        ↓
        // criação da assinatura
        //
        // A condição comercial ficará congelada
        // no momento da contratação.


        // =====================================================
        // SUCESSO
        // =====================================================

        return resposta(
            {

                success:
                    true,

                message:
                    "Igreja cadastrada com sucesso. Escolha agora o plano desejado.",


                igreja: {

                    id:
                        igreja.id,

                    nome:
                        igreja.nome,

                },


                pessoa: {

                    id:
                        pessoa.id,

                    nome:
                        pessoa.nome,

                    email:
                        pessoa.email,

                    perfil:
                        pessoa.perfil,

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