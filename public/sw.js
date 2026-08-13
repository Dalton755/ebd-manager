self.addEventListener("push", (event) => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = {
            title: "EBD Manager",
            body: event.data?.text() ?? "Você recebeu uma nova notificação.",
        };
    }

    const title = data.title || "EBD Manager";

    const options = {
        body:
            data.body ||
            data.mensagem ||
            "Você recebeu uma nova notificação.",
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        data: {
            url: data.url || "/",
            aula_id: data.aula_id || null,
        },
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url =
        event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then((clientList) => {

            for (const client of clientList) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(url);
            }

        })
    );
});