self.addEventListener("push", (event) => {

    console.log("Push recebido pelo Service Worker.");

    event.waitUntil(

        (async () => {

            let data = {};

            try {

                if (event.data) {

                    const texto =
                        event.data.text();

                    console.log(
                        "Payload recebido:",
                        texto
                    );

                    try {

                        data =
                            JSON.parse(texto);

                    } catch {

                        data = {
                            title: "EBD Manager",
                            body: texto,
                        };

                    }

                }

            } catch (erro) {

                console.error(
                    "Erro ao processar Push:",
                    erro
                );

                data = {
                    title: "EBD Manager",
                    body:
                        "Você recebeu uma nova notificação.",
                };
            }


            const title =
                data.title ||
                "EBD Manager";


            const options = {

                body:
                    data.body ||
                    data.mensagem ||
                    "Você recebeu uma nova notificação.",

                icon:
                    data.icon ||
                    "/favicon.svg",

                badge:
                    data.badge ||
                    "/favicon.svg",

                data: {

                    url:
                        data.url ||
                        "/",

                    aula_id:
                        data.aula_id ||
                        null,
                },

            };


            console.log(
                "Exibindo notificação:",
                title,
                options
            );


            await self.registration.showNotification(
                title,
                options
            );

        })()

    );

});


self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();


        const url =
            event.notification.data?.url ||
            "/";


        event.waitUntil(

            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true,
                })

                .then((clientList) => {

                    for (
                        const client of clientList
                    ) {

                        if (
                            "focus" in client
                        ) {

                            client.navigate(url);

                            return client.focus();
                        }
                    }


                    if (
                        clients.openWindow
                    ) {

                        return clients.openWindow(
                            url
                        );
                    }

                })

        );

    }
);