import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
        "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {

    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    try {

        // =====================================================
        // CONFIGURAÇÕES
        // =====================================================

        const supabaseUrl =
            Deno.env.get("SUPABASE_URL");

        const serviceRoleKey =
            Deno.env.get(
                "SUPABASE_SERVICE_ROLE_KEY"
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
                "Configuração do Push não está completa."
            );
        }


        // =====================================================
        // SUPABASE ADMIN
        // =====================================================

        const supabase =
            createClient(
                supabaseUrl,
                serviceRoleKey
            );


        // =====================================================
        // DADOS DA NOTIFICAÇÃO
        // =====================================================

        const {
            pessoa_id,
            titulo,
            mensagem,
            aula_id,
            url,
        } = await req.json();


        if (!pessoa_id) {

            return new Response(
                JSON.stringify({
                    error:
                        "pessoa_id é obrigatório.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        if (!titulo || !mensagem) {

            return new Response(
                JSON.stringify({
                    error:
                        "titulo e mensagem são obrigatórios.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // BUSCA DISPOSITIVOS
        // =====================================================

        const {
            data: subscriptions,
            error: subscriptionError,
        } =
            await supabase
                .schema("ebd")
                .from("push_subscriptions")
                .select(`
                    id,
                    endpoint,
                    p256dh,
                    auth
                `)
                .eq(
                    "pessoa_id",
                    pessoa_id
                );


        if (subscriptionError) {
            throw subscriptionError;
        }


        if (
            !subscriptions ||
            subscriptions.length === 0
        ) {

            return new Response(
                JSON.stringify({
                    success: true,
                    enviados: 0,
                    mensagem:
                        "Nenhum dispositivo registrado.",
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }


        // =====================================================
        // CONFIGURA VAPID
        // =====================================================

        webpush.setVapidDetails(
            vapidSubject,
            vapidPublicKey,
            vapidPrivateKey
        );


        // =====================================================
        // PAYLOAD
        // =====================================================

        const payload =
            JSON.stringify({
                title: titulo,
                body: mensagem,
                aula_id:
                    aula_id ?? null,
                url:
                    url ?? "/",
            });


        let enviados = 0;
        let removidos = 0;
        const erros: unknown[] = [];


        // =====================================================
        // ENVIA PARA CADA DISPOSITIVO
        // =====================================================

        for (
            const subscription
            of subscriptions
        ) {

            try {

                await webpush.sendNotification(

                    {
                        endpoint:
                            subscription.endpoint,

                        keys: {
                            p256dh:
                                subscription.p256dh,

                            auth:
                                subscription.auth,
                        },
                    },

                    payload,

                    {
                        TTL: 60,

                        urgency:
                            "high",
                    }
                );


                enviados++;

            } catch (error) {

                console.error(
                    "Erro ao enviar Push:",
                    error
                );


                const statusCode =
                    error?.statusCode;


                // =================================================
                // SUBSCRIPTION EXPIRADA / INVÁLIDA
                // =================================================

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
                                subscription.id
                            );


                    if (!deleteError) {
                        removidos++;
                    }

                } else {

                    erros.push({
                        subscription_id:
                            subscription.id,

                        status:
                            statusCode ??
                            null,

                        erro:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                }
            }
        }


        // =====================================================
        // RESPOSTA
        // =====================================================

        return new Response(
            JSON.stringify({
                success: true,

                dispositivos:
                    subscriptions.length,

                enviados,

                removidos,

                erros,
            }),
            {
                status: 200,

                headers: {
                    ...corsHeaders,

                    "Content-Type":
                        "application/json",
                },
            }
        );

      } catch (error) {

        console.error(
            "Erro na função send-push:",
            error
        );

        const erroDetalhado =
            error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                }
                : error;

        console.error(
            "Erro detalhado:",
            JSON.stringify(
                erroDetalhado,
                null,
                2
            )
        );

        return new Response(
            JSON.stringify({
                success: false,
                error: erroDetalhado,
            }),
            {
                status: 500,

                headers: {
                    ...corsHeaders,

                    "Content-Type":
                        "application/json",
                },
            }
        );
    }
});