import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

function verificarToken(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!url || !chave || !token) return res.status(503).json({ error: "Webhook não configurado." });

  if (!verificarToken(String(req.headers["asaas-access-token"] ?? ""), token))
    return res.status(401).json({ error: "Origem não autenticada." });

  const evento = req.body ?? {};
  if (typeof evento.id !== "string" || typeof evento.event !== "string")
    return res.status(400).json({ error: "Evento inválido." });

  const payment = evento.payment ?? {};
  const subscription = evento.subscription ?? null;
  const assinaturaId = typeof payment.subscription === "string"
    ? payment.subscription
    : typeof subscription === "string"
      ? subscription
      : typeof subscription?.id === "string"
        ? subscription.id
        : null;
  const pagamentoId = typeof payment.id === "string" ? payment.id : null;
  const referencia = typeof payment.externalReference === "string"
    ? payment.externalReference
    : typeof subscription?.externalReference === "string"
      ? subscription.externalReference
      : null;

  if (!assinaturaId && !pagamentoId && !referencia)
    return res.status(200).json({ ok: true, resultado: "ignorado" });

  const db = createClient(url, chave, {
    db: { schema: "ebd" },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // A rotina no Postgres registra o ID do evento e atualiza a oferta
  // na MESMA transação. Duplicidades recebem 200 sem reprocessamento.
  const { data, error } = await db.schema("ebd").rpc("processar_webhook_asaas", {
    p_event_id: evento.id,
    p_evento: evento.event,
    p_pagamento_id: pagamentoId,
    p_assinatura_id: assinaturaId,
    p_referencia: referencia,
  });

  if (error) {
    console.error("[ASAAS WEBHOOK] Falha de persistência:", error.code);
    return res.status(500).json({ error: "Falha temporária ao registrar o evento." });
  }

  return res.status(200).json({ ok: true, resultado: data });
}
