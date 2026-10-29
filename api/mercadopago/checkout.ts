import type { VercelRequest, VercelResponse } from "@vercel/node";

// Encerrado para novas contratações: o EBD Manager agora é gratuito.
// Webhooks e histórico do Mercado Pago permanecem para conciliação legada.
export default function handler(_req: VercelRequest, res: VercelResponse) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(410).json({
        success: false,
        codigo: "PLANOS_ENCERRADOS",
        error: "O EBD Manager é gratuito. Não existem mais planos pagos.",
        apoiar: "/apoiar",
    });
}
