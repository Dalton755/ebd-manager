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

        console.log(
            "=========================================="
        );

        console.log(
            "[PUSH] Iniciando registro do dispositivo..."
        );

        console.log(
            "[PUSH] pessoaId:",
            pessoaId
        );

        // =====================================================
        // 1. VERIFICA SUPORTE
        // =====================================================

        console.log(
            "[PUSH] Notification:",
            "Notification" in window
        );

        console.log(
            "[PUSH] serviceWorker:",
            "serviceWorker" in navigator
        );

        console.log(
            "[PUSH] PushManager:",
            "PushManager" in window
        );

        if (
            !("Notification" in window) ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window)
        ) {

            console.warn(
                "[PUSH] Navegador não suporta Push."
            );

            return false;
        }


        // =====================================================
        // 2. PERMISSÃO
        // =====================================================

        console.log(
            "[PUSH] Permissão atual:",
            Notification.permission
        );


        let permissao =
            Notification.permission;


        if (permissao === "default") {

            console.log(
                "[PUSH] Solicitando permissão..."
            );

            try {

                permissao =
                    await Notification.requestPermission();

                console.log(
                    "[PUSH] Resultado da permissão:",
                    permissao
                );

            } catch (erro) {

                console.error(
                    "[PUSH] Erro ao solicitar permissão:",
                    erro
                );

                return false;
            }
        }


        if (permissao !== "granted") {

            console.warn(
                "[PUSH] Permissão não concedida:",
                permissao
            );

            return false;
        }


        // =====================================================
        // 3. SERVICE WORKER
        // =====================================================

        console.log(
            "[PUSH] Aguardando Service Worker..."
        );

        let registration:
            ServiceWorkerRegistration;

        try {

            registration =
                await navigator.serviceWorker.ready;

            console.log(
                "[PUSH] Service Worker pronto:",
                registration
            );

            console.log(
                "[PUSH] Service Worker ativo:",
                registration.active?.scriptURL
            );

        } catch (erro) {

            console.error(
                "[PUSH] Erro no Service Worker:",
                erro
            );

            return false;
        }


        // =====================================================
        // 4. VERIFICA SUBSCRIPTION EXISTENTE
        // =====================================================

        console.log(
            "[PUSH] Verificando subscription existente..."
        );

        let subscription:
            PushSubscription | null = null;

        try {

            subscription =
                await registration.pushManager.getSubscription();

            console.log(
                "[PUSH] Subscription existente:",
                subscription
            );

        } catch (erro) {

            console.error(
                "[PUSH] Erro ao consultar subscription:",
                erro
            );

            return false;
        }


        // =====================================================
        // 5. CRIA NOVA SUBSCRIPTION
        // =====================================================

        if (!subscription) {

            console.log(
                "[PUSH] Nenhuma subscription encontrada."
            );

            const vapidKey =
                import.meta.env
                    .VITE_VAPID_PUBLIC_KEY;

            console.log(
                "[PUSH] VAPID configurada:",
                Boolean(vapidKey)
            );

            if (!vapidKey) {

                console.error(
                    "[PUSH] VITE_VAPID_PUBLIC_KEY não encontrada."
                );

                return false;
            }


            try {

                console.log(
                    "[PUSH] Criando nova subscription..."
                );

                subscription =
                    await registration.pushManager.subscribe({
                        userVisibleOnly: true,

                        applicationServerKey:
                            converterChavePublica(
                                vapidKey.trim()
                            ),
                    });

                console.log(
                    "[PUSH] Subscription criada:",
                    subscription
                );

            } catch (erro) {

                console.error(
                    "[PUSH] ERRO AO CRIAR SUBSCRIPTION:",
                    erro
                );

                return false;
            }

        } else {

            console.log(
                "[PUSH] Usando subscription existente."
            );
        }


        // =====================================================
        // 6. EXTRAI DADOS
        // =====================================================

        const dados =
            subscription.toJSON();

        console.log(
            "[PUSH] Dados da subscription:",
            dados
        );


        if (
            !dados.endpoint ||
            !dados.keys?.p256dh ||
            !dados.keys?.auth
        ) {

            console.error(
                "[PUSH] Subscription inválida."
            );

            return false;
        }


        const pushData:
            PushSubscriptionData = {

            endpoint:
                dados.endpoint,

            p256dh:
                dados.keys.p256dh,

            auth:
                dados.keys.auth,
        };


        // =====================================================
        // 7. SALVA NO SUPABASE
        // =====================================================

        console.log(
            "[PUSH] Salvando subscription no Supabase..."
        );

        try {

            const {
                error,
            } =
                await supabase
                    .schema("ebd")
                    .from("push_subscriptions")
                    .upsert(
                        {
                            pessoa_id:
                                pessoaId,

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
                    "[PUSH] ERRO AO SALVAR NO SUPABASE:",
                    error
                );

                return false;
            }

        } catch (erro) {

            console.error(
                "[PUSH] Exceção ao salvar subscription:",
                erro
            );

            return false;
        }


        // =====================================================
        // 8. SUCESSO
        // =====================================================

        console.log(
            "[PUSH] ========================================"
        );

        console.log(
            "[PUSH] DISPOSITIVO REGISTRADO COM SUCESSO!"
        );

        console.log(
            "[PUSH] endpoint:",
            pushData.endpoint
        );

        console.log(
            "[PUSH] ========================================"
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