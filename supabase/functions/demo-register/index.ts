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
    status = 200
) {
    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type":
                    "application/json; charset=utf-8",
                "Cache-Control":
                    "no-store",
            },
        }
    );
}

function emailValido(
    email: string
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

Deno.serve(async (
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

        const supabaseUrl =
            Deno.env.get(
                "SUPABASE_URL"
            );

        const serviceRoleKey =
            Deno.env.get(
                "EBD_MANAGER_ADMIN_KEY"
            );

        if (
            !supabaseUrl ||
            !serviceRoleKey
        ) {
            throw new Error(
                "Configuração da função incompleta."
            );
        }


        const admin =
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


        const body =
            await req.json();


        const nome =
            String(
                body?.nome ??
                ""
            ).trim();

        const email =
            String(
                body?.email ??
                ""
            )
                .trim()
                .toLowerCase();

        const password =
            String(
                body?.password ??
                ""
            );


        if (
            nome.length <
                2 ||
            !email ||
            !password
        ) {
            return resposta(
                {
                    error:
                        "Informe nome, e-mail e senha.",
                },
                400
            );
        }


        if (
            !emailValido(
                email
            )
        ) {
            return resposta(
                {
                    error:
                        "Informe um e-mail válido.",
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
                },
                400
            );
        }


        const inicioHoje =
            new Date();

        inicioHoje.setUTCHours(
            0,
            0,
            0,
            0
        );


        const {
            count:
                demosHoje,
            error:
                countError,
        } =
            await admin
                .schema("ebd")
                .from("igrejas")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true,
                    }
                )
                .eq(
                    "modo_demo",
                    true
                )
                .gte(
                    "created_at",
                    inicioHoje
                        .toISOString()
                );


        if (countError) {
            throw countError;
        }


        if (
            (
                demosHoje ??
                0
            ) >=
            100
        ) {
            return resposta(
                {
                    error:
                        "O limite diário de demonstrações foi atingido. Tente novamente mais tarde.",
                },
                429
            );
        }


        const {
            data:
                pessoaExistente,
            error:
                pessoaError,
        } =
            await admin
                .schema("ebd")
                .from("pessoas")
                .select("id")
                .eq(
                    "email",
                    email
                )
                .maybeSingle();


        if (pessoaError) {
            throw pessoaError;
        }


        if (
            pessoaExistente
        ) {
            return resposta(
                {
                    error:
                        "Não foi possível criar este acesso. Se você já possui conta, entre pela tela de login.",
                },
                400
            );
        }


        const {
            data:
                authData,
            error:
                authError,
        } =
            await admin.auth.admin
                .createUser({
                    email,
                    password,
                    email_confirm:
                        true,
                    user_metadata: {
                        full_name:
                            nome,
                        ebd_demo:
                            true,
                    },
                });


        if (
            authError ||
            !authData.user
        ) {
            return resposta(
                {
                    error:
                        "Não foi possível criar este acesso. Verifique os dados ou tente entrar se já possuir conta.",
                },
                400
            );
        }


        const userId =
            authData.user.id;


        const {
            data:
                ambiente,
            error:
                ambienteError,
        } =
            await admin
                .schema("ebd")
                .rpc(
                    "criar_ambiente_demo",
                    {
                        p_user_id:
                            userId,
                        p_nome:
                            nome,
                        p_email:
                            email,
                    }
                );


        if (
            ambienteError
        ) {

            await admin
                .auth
                .admin
                .deleteUser(
                    userId
                );

            throw ambienteError;
        }


        return resposta({
            success:
                true,
            message:
                "Sua demonstração está pronta.",
            ambiente,
        });


    } catch (error) {

        console.error(
            "[DEMO-REGISTER] Erro:",
            error
        );


        return resposta(
            {
                error:
                    "Não foi possível criar a demonstração agora. Tente novamente.",
            },
            500
        );
    }
});
