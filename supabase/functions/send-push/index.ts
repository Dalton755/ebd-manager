import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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
                success: false,
                error:
                    "Método não permitido.",
            },
            405
        );
    }

    try {

        const authorization =
            req.headers.get(
                "Authorization"
            );

        if (
            !authorization ||
            !authorization.startsWith(
                "Bearer "
            )
        ) {
            return resposta(
                {
                    success: false,
                    error:
                        "Usuário não autenticado.",
                },
                401
            );
        }

        const token =
            authorization
                .substring(7)
                .trim();

        if (!token) {
            return resposta(
                {
                    success: false,
                    error:
                        "Sessão inválida.",
                },
                401
            );
        }

        const supabaseUrl =
            Deno.env.get(
                "SUPABASE_URL"
            );

        const serviceRoleKey =
            Deno.env.get(
                "EBD_MANAGER_ADMIN_KEY"
            );

        const vapidPublicKey =
            Deno.env.get(
                "VAPID_PUBLIC_KEY"
            );

        const vapidPrivateKey =
            Deno.env.get(
                "VAPID_PRIVATE_KEY"
            );

        const vapidSubject =
            Deno.env.get(
                "VAPID_SUBJECT"
            );

        if (
            !supabaseUrl ||
            !serviceRoleKey ||
            !vapidPublicKey ||
            !vapidPrivateKey ||
            !vapidSubject
        ) {
            throw new Error(
                "Configuração do Push incompleta."
            );
        }

        const supabase =
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

        const {
            data: authData,
            error: authError,
        } =
            await supabase
                .auth
                .getUser(
                    token
                );

        if (
            authError ||
            !authData.user
        ) {
            return resposta(
                {
                    success: false,
                    error:
                        "Sessão inválida.",
                },
                401
            );
        }

        const {
            data: remetente,
            error: remetenteError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    igreja_id,
                    perfil,
                    ativo,
                    status
                `)
                .eq(
                    "user_id",
                    authData.user.id
                )
                .maybeSingle();

        if (remetenteError) {
            throw remetenteError;
        }

        const podeEnviar =
            remetente &&
            remetente.igreja_id &&
            remetente.ativo === true &&
            remetente.status ===
                "ATIVO" &&
            (
                remetente.perfil ===
                    "ADMIN" ||
                remetente.perfil ===
                    "SUPERINTENDENTE"
            );

        if (!podeEnviar) {
            return resposta(
                {
                    success: false,
                    error:
                        "Você não possui permissão para enviar notificações.",
                },
                403
            );
        }

        const {
            pessoa_id,
            titulo,
            mensagem,
            aula_id,
            url,
        } = await req.json();

        const pessoaId =
            String(
                pessoa_id ?? ""
            ).trim();

        const tituloNormalizado =
            String(
                titulo ?? ""
            ).trim();

        const mensagemNormalizada =
            String(
                mensagem ?? ""
            ).trim();

        const aulaId =
            aula_id
                ? String(
                    aula_id
                ).trim()
                : null;

        const urlRecebida =
            String(
                url ?? "/"
            ).trim();

        const urlSegura =
            urlRecebida.startsWith("/")
                ? urlRecebida
                : "/";

        if (!pessoaId) {
            return resposta(
                {
                    success: false,
                    error:
                        "pessoa_id é obrigatório.",
                },
                400
            );
        }

        if (
            !tituloNormalizado ||
            !mensagemNormalizada
        ) {
            return resposta(
                {
                    success: false,
                    error:
                        "Título e mensagem são obrigatórios.",
                },
                400
            );
        }

        if (
            tituloNormalizado.length >
                120 ||
            mensagemNormalizada.length >
                500
        ) {
            return resposta(
                {
                    success: false,
                    error:
                        "Notificação excede o tamanho permitido.",
                },
                400
            );
        }

        const {
            data: destinatario,
            error: destinatarioError,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(
                    "id, igreja_id, ativo"
                )
                .eq(
                    "id",
                    pessoaId
                )
                .eq(
                    "igreja_id",
                    remetente.igreja_id
                )
                .maybeSingle();

        if (destinatarioError) {
            throw destinatarioError;
        }

        if (
            !destinatario ||
            destinatario.ativo !== true
        ) {
            return resposta(
                {
                    success: false,
                    error:
                        "Destinatário não encontrado nesta igreja.",
                },
                404
            );
        }

        const {
            data: subscriptions,
            error: subscriptionError,
        } =
            await supabase
                .schema("ebd")
                .from(
                    "push_subscriptions"
                )
                .select(`
                    id,
                    endpoint,
                    p256dh,
                    auth
                `)
                .eq(
                    "pessoa_id",
                    pessoaId
                );

        if (subscriptionError) {
            throw subscriptionError;
        }

        if (
            !subscriptions ||
            subscriptions.length === 0
        ) {
            return resposta(
                {
                    success: true,
                    enviados: 0,
                    mensagem:
                        "Nenhum dispositivo registrado.",
                },
                200
            );
        }

        webpush.setVapidDetails(
            vapidSubject,
            vapidPublicKey,
            vapidPrivateKey
        );

        const payload =
            JSON.stringify({
                title:
                    tituloNormalizado,
                body:
                    mensagemNormalizada,
                aula_id:
                    aulaId,
                url:
                    urlSegura,
            });

        let enviados = 0;
        let removidos = 0;

        for (
            const subscription
            of subscriptions
        ) {
            try {

                await webpush
                    .sendNotification(
                        {
                            endpoint:
                                subscription
                                    .endpoint,

                            keys: {
                                p256dh:
                                    subscription
                                        .p256dh,

                                auth:
                                    subscription
                                        .auth,
                            },
                        },

                        payload,

                        {
                            TTL: 60,
                            urgency:
                                "high",
                        }
                    );

                enviados += 1;

            } catch (error) {

                const statusCode =
                    typeof error ===
                            "object" &&
                        error !== null &&
                        "statusCode" in
                            error
                        ? Number(
                            (
                                error as {
                                    statusCode?:
                                        unknown;
                                }
                            )
                                .statusCode
                        )
                        : null;

                if (
                    statusCode === 404 ||
                    statusCode === 410
                ) {
                    const {
                        error:
                            deleteError,
                    } =
                        await supabase
                            .schema("ebd")
                            .from(
                                "push_subscriptions"
                            )
                            .delete()
                            .eq(
                                "id",
                                subscription
                                    .id
                            );

                    if (!deleteError) {
                        removidos += 1;
                    }
                } else {
                    console.error(
                        "[SEND-PUSH] Falha em dispositivo:",
                        statusCode
                    );
                }
            }
        }

        return resposta(
            {
                success: true,
                dispositivos:
                    subscriptions.length,
                enviados,
                removidos,
            },
            200
        );

    } catch (error) {

        console.error(
            "[SEND-PUSH] Erro interno:",
            error
        );

        return resposta(
            {
                success: false,
                error:
                    "Não foi possível enviar a notificação.",
            },
            500
        );
    }
});
