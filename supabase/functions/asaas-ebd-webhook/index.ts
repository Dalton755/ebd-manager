// Webhook Asaas do EBD Manager. Receptor público isolado dos previews da Vercel.
// Autenticação obrigatória pelo token exclusivo EBD_ASAAS_WEBHOOK_TOKEN.
// A chave administrativa do Supabase existe apenas no servidor/Edge Function.
import { createClient } from "jsr:@supabase/supabase-js@2";

function responder(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function compararSeguro(recebido: string, esperado: string): boolean {
  // O token tem alta entropia; evita comparação que retorne na primeira diferença.
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(esperado);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diferenca === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return responder(405, { error: "Método não permitido." });

  const segredo = Deno.env.get("EBD_ASAAS_WEBHOOK_TOKEN") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const chaves = Deno.env.get("SUPABASE_SECRET_KEYS");
  let serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey && chaves) {
    try { serviceRoleKey = JSON.parse(chaves).default; } catch { /* chave ausente */ }
  }
  if (!segredo || segredo.length < 32 || !supabaseUrl || !serviceRoleKey)
    return responder(503, { error: "Integração ainda não configurada." });

  if (!compararSeguro(req.headers.get("asaas-access-token") ?? "", segredo))
    return responder(401, { error: "Token inválido." });

  let evento: Record<string, unknown>;
  try {
    evento = await req.json();
  } catch {
    return responder(400, { error: "JSON inválido." });
  }
  if (typeof evento.id !== "string" || typeof evento.event !== "string")
    return responder(400, { error: "Evento inválido." });

  const pagamento = evento.payment && typeof evento.payment === "object"
    ? evento.payment as Record<string, unknown> : {};
  const assinatura = evento.subscription && typeof evento.subscription === "object"
    ? evento.subscription as Record<string, unknown> : {};
  const assinaturaId = typeof pagamento.subscription === "string"
    ? pagamento.subscription
    : typeof evento.subscription === "string" ? evento.subscription
    : typeof assinatura.id === "string" ? assinatura.id
    : null;
  const pagamentoId = typeof pagamento.id === "string" ? pagamento.id : null;
  const referencia = typeof pagamento.externalReference === "string"
    ? pagamento.externalReference
    : typeof assinatura.externalReference === "string" ? assinatura.externalReference
    : null;

  if (!assinaturaId && !pagamentoId && !referencia)
    return responder(200, { ok: true, resultado: "ignorado" });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "ebd" },
  });
  const { data, error } = await admin.schema("ebd").rpc("processar_webhook_asaas", {
    p_event_id: evento.id,
    p_evento: evento.event,
    p_pagamento_id: pagamentoId,
    p_assinatura_id: assinaturaId,
    p_referencia: referencia,
  });
  if (error) {
    console.error("[EBD Asaas] Erro no banco:", error.code);
    return responder(500, { error: "Falha temporária na persistência." });
  }
  return responder(200, { ok: true, resultado: data });
});
