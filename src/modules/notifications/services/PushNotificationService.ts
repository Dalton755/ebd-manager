import { supabase } from "@/shared/lib/supabase/client";

type PushSubscriptionData = {
    endpoint: string;
    p256dh: string;
    auth: string;
};

export const PushNotificationService = {

    async enviar(
        dados: {
            pessoa_id: string;
            titulo: string;
            mensagem: string;
            aula_id?: string | null;
            url?: string;
        }
    ): Promise<void> {

        if (!dados.pessoa_id) {
            throw new Error(
                "pessoa_id é obrigatório para enviar Push."
            );
        }

        if (!dados.titulo?.trim()) {
            throw new Error(
                "titulo é obrigatório para enviar Push."
            );
        }

        if (!dados.mensagem?.trim()) {
            throw new Error(
                "mensagem é obrigatória para enviar Push."
            );
        }

        const { data, error } =
            await supabase.functions.invoke(
                "send-push",
                {
                    body: {
                        pessoa_id:
                            dados.pessoa_id,

                        titulo:
                            dados.titulo,

                        mensagem:
                            dados.mensagem,

                        aula_id:
                            dados.aula_id ?? null,

                        url:
                            dados.url ?? "/",
                    },
                }
            );

        if (error) {
            console.error(
                "Erro ao chamar Edge Function send-push:",
                error
            );

            throw error;
        }

        if (!data?.success) {
            throw new Error(
                data?.error ??
                "Não foi possível enviar a notificação Push."
            );
        }

        console.log(
            "Push enviado:",
            data
        );
    },


    async registrarDispositivo(
        pessoaId: string
    ): Promise<boolean> {

        if (
            !("Notification" in window) ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window)
        ) {
            console.warn(
                "Este navegador não suporta notificações push."
            );

            return false;
        }

        const permissao =
            await Notification.requestPermission();

        if (permissao !== "granted") {
            console.warn(
                "Permissão para notificações não concedida."
            );

            return false;
        }

        const registration =
            await navigator.serviceWorker.ready;

        let subscription =
            await registration.pushManager.getSubscription();

        if (!subscription) {

            subscription =
                await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey:
                        converterChavePublica(
                            import.meta.env
                                .VITE_VAPID_PUBLIC_KEY
                        ),
                });
        }

        const dados =
            subscription.toJSON();

        if (
            !dados.endpoint ||
            !dados.keys?.p256dh ||
            !dados.keys?.auth
        ) {
            console.error(
                "Assinatura Push inválida."
            );

            return false;
        }

        const pushData: PushSubscriptionData = {
            endpoint: dados.endpoint,
            p256dh: dados.keys.p256dh,
            auth: dados.keys.auth,
        };

        const { error } =
            await supabase
                .schema("ebd")
                .from("push_subscriptions")
                .upsert(
                    {
                        pessoa_id: pessoaId,
                        endpoint:
                            pushData.endpoint,
                        p256dh:
                            pushData.p256dh,
                        auth:
                            pushData.auth,
                        user_agent:
                            navigator.userAgent,
                        updated_at:
                            new Date().toISOString(),
                    },
                    {
                        onConflict:
                            "pessoa_id,endpoint",
                    }
                );

        if (error) {
            console.error(
                "Erro ao registrar dispositivo:",
                error
            );

            return false;
        }

        console.log(
            "Dispositivo registrado para Push."
        );

        return true;
    },
};


function converterChavePublica(
    base64String: string
): ArrayBuffer {

    const padding =
        "=".repeat(
            (4 - (base64String.length % 4)) % 4
        );

    const base64 =
        (
            base64String + padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    const buffer =
        new ArrayBuffer(
            rawData.length
        );

    const output =
        new Uint8Array(buffer);

    for (
        let i = 0;
        i < rawData.length;
        i++
    ) {
        output[i] =
            rawData.charCodeAt(i);
    }

    return buffer;
}