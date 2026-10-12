import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

const configurado = Boolean(process.env.ASAAS_WEBHOOK_TOKEN && process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL));
function sameToken(received: string, expected: string) {
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    if (!configurado) return res.status(503).json({ error: "Webhook não configurado." });
    const recebido = String(req.headers["asaas-access-token"] ?? "");
    if (!sameToken(recebido, process.env.ASAAS_WEBHOOK_TOKEN!)) return res.status(401).json({ error: "Token inválido." });

    const evento = req.body ?? {};
    if (typeof evento.id !== "string" || typeof evento.event !== "string") return res.status(400).json({ error: "Evento inválido." });
    const db = createClient(process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { db: { schema: "ebd" }, auth: { autoRefreshToken: false, persistSession: false } });
    const nome = evento.event;
    const pagamento = evento.payment;
    const idPagamento = typeof pagamento?.id === "string" ? pagamento.id : null;
    const idAssinatura = typeof pagamento?.subscription === "string" ? pagamento.subscription : typeof evento.subscription?.id === "string" ? evento.subscription.id : typeof evento.subscription === "string" ? evento.subscription : null;
    const idExterno = typeof pagamento?.externalReference === "string" ? pagamento.externalReference : null;
    if (!idPagamento && !idAssinatura && !idExterno) return res.status(200).json({ ok: true });

    // Só atualiza ofertas já vinculadas a IDs registrados pelo backend.
    const novosStatus: Record<string, string> = {
        PAYMENT_RECEIVED: "RECEBIDA", PAYMENT_CONFIRMED: "CONFIRMADA",
        PAYMENT_OVERDUE: "VENCIDA", PAYMENT_REFUNDED: "ESTORNADA",
        PAYMENT_DELETED: "PAGAMENTO_CANCELADO", PAYMENT_CREATED: "PENDENTE",
        SUBSCRIPTION_DELETED: "CANCELADA",
    };
    const status = novosStatus[nome];
    if (!status) return res.status(200).json({ ok: true });
    let query = db.schema("ebd").from("ofertas_desenvolvedor").update({
        status, ...(["RECEBIDA", "CONFIRMADA"].includes(status) ? { ultimo_pagamento_em: new Date().toISOString() } : {}),
    });
    // Cobranças seguintes de apoio mensal recebem novos payment.id.
    // A associação estável é subscription.id, não o primeiro payment.id.
    if (idAssinatura) query = query.eq("asaas_subscription_id", idAssinatura);
    else if (idPagamento) query = query.eq("asaas_payment_id", idPagamento);
    else query = query.eq("id", idExterno);
    if (nome !== "SUBSCRIPTION_DELETED") query = query.neq("status", "CANCELADA");
    const { error } = await query;
    if (error) {
        console.error("[ASAAS WEBHOOK]", error.message);
        return res.status(500).json({ error: "Erro ao registrar evento." });
    }
    return res.status(200).json({ ok: true });
}
