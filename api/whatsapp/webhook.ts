import type {
    VercelRequest,
    VercelResponse,
} from "@vercel/node";


const WHATSAPP_VERIFY_TOKEN =
    process.env.WHATSAPP_VERIFY_TOKEN;


export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {

    /* =====================================================
       VERIFICAÇÃO DO WEBHOOK PELA META
    ===================================================== */

    if (req.method === "GET") {

        const mode =
            req.query["hub.mode"];

        const token =
            req.query["hub.verify_token"];

        const challenge =
            req.query["hub.challenge"];


        const modeValue =
            Array.isArray(mode)
                ? mode[0]
                : mode;

        const tokenValue =
            Array.isArray(token)
                ? token[0]
                : token;

        const challengeValue =
            Array.isArray(challenge)
                ? challenge[0]
                : challenge;


        if (
            modeValue === "subscribe" &&
            tokenValue &&
            tokenValue === WHATSAPP_VERIFY_TOKEN
        ) {

            console.log(
                "Webhook WhatsApp verificado com sucesso."
            );

            return res
                .status(200)
                .send(challengeValue);

        }


        console.warn(
            "Falha na verificação do webhook WhatsApp."
        );

        return res
            .status(403)
            .json({
                success: false,
                error:
                    "Token de verificação inválido.",
            });

    }


    /* =====================================================
       RECEBIMENTO DE EVENTOS DO WHATSAPP
    ===================================================== */

    if (req.method === "POST") {

        console.log(
            "Webhook WhatsApp recebido:",
            JSON.stringify(
                req.body,
                null,
                2
            )
        );


        return res
            .status(200)
            .json({
                success: true,
            });

    }


    return res
        .status(405)
        .json({
            success: false,
            error:
                "Método não permitido.",
        });

}