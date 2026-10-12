import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const base = process.env.ASAAS_ENVIRONMENT === "production"
  ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";

async function asaas(path: string, method = "GET", body?: unknown) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "User-Agent": "EBDManager/1.0",
      "access_token": process.env.ASAAS_API_KEY ?? "",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Não foi possível criar a cobrança no Asaas. Confira seus dados.");
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.ASAAS_API_KEY)
    return res.status(503).json({ error: "A contribuição voluntária ainda não está configurada." });

  const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const db = createClient(url, key, { db: { schema: "ebd" }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth } = await db.auth.getUser(token);
  if (!auth.user?.id || !auth.user.email) return res.status(401).json({ error: "Faça login novamente." });

  const body = req.body ?? {};
  const valor = Number(body.valor);
  const periodicidade = String(body.periodicidade);
  const formaPagamento = String(body.formaPagamento);
  const nome = String(body.nome ?? "").trim();
  const documento = String(body.cpfCnpj ?? "").replace(/\D/g, "");
  if (!Number.isFinite(valor) || valor < 5 || valor > 10000 || Math.round(valor * 100) !== valor * 100)
    return res.status(400).json({ error: "Valor deve estar entre R$ 5 e R$ 10.000, com centavos válidos." });
  if (!["UNICA", "MENSAL"].includes(periodicidade) || !["PIX", "BOLETO", "CREDIT_CARD"].includes(formaPagamento)
      || nome.length < 3 || ![11, 14].includes(documento.length))
    return res.status(400).json({ error: "Confira seu nome, CPF/CNPJ e opções de oferta." });

  const { data: pessoa } = await db.schema("ebd").from("pessoas")
    .select("igreja_id").eq("user_id", auth.user.id).maybeSingle();
  const { data: recente } = await db.schema("ebd").from("ofertas_desenvolvedor")
    .select("id").eq("user_id", auth.user.id)
    .gte("criado_em", new Date(Date.now() - 60000).toISOString()).limit(1);
  if (recente?.length) return res.status(429).json({ error: "Aguarde um minuto antes de solicitar outra oferta." });

  const id = randomUUID();
  const { error: insercao } = await db.schema("ebd").from("ofertas_desenvolvedor").insert({
    id, user_id: auth.user.id, igreja_id: pessoa?.igreja_id ?? null,
    valor, periodicidade, forma_pagamento: formaPagamento, status: "CRIADA",
  });
  if (insercao) return res.status(500).json({ error: "Não foi possível registrar a oferta." });

  try {
    const cliente = await asaas("/customers", "POST", {
      name: nome, cpfCnpj: documento, email: auth.user.email,
      externalReference: auth.user.id, notificationDisabled: false,
    });
    const campos = {
      customer: cliente.id, billingType: formaPagamento, value: valor,
      description: "Oferta voluntária EBD Manager", externalReference: id,
    };
    const dataHoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());

    const criado = periodicidade === "UNICA"
      ? await asaas("/payments", "POST", { ...campos, dueDate: dataHoje })
      : await asaas("/subscriptions", "POST", { ...campos, cycle: "MONTHLY", nextDueDate: dataHoje });
    const assinaturaId = periodicidade === "MENSAL" ? criado.id : null;
    const primeiro = assinaturaId
      ? (await asaas("/subscriptions/" + encodeURIComponent(assinaturaId) + "/payments?limit=1")).data?.[0]
      : criado;
    const pagamentoId = primeiro?.id ?? null;
    const link = primeiro?.invoiceUrl ?? null;
    let pix = null;
    if (formaPagamento === "PIX" && pagamentoId) {
      const codigo = await asaas("/payments/" + encodeURIComponent(pagamentoId) + "/pixQrCode");
      pix = { payload: codigo.payload, encodedImage: codigo.encodedImage };
    }

    const { error: atualizacao } = await db.schema("ebd").from("ofertas_desenvolvedor")
      .update({ status: "PENDENTE", asaas_customer_id: cliente.id,
        asaas_subscription_id: assinaturaId, asaas_payment_id: pagamentoId, invoice_url: link })
      .eq("id", id);
    if (atualizacao) throw new Error("Cobrança criada, mas registro não atualizado. Entre em contato com o suporte.");
    return res.status(200).json({ id, periodicidade, formaPagamento, invoiceUrl: link, pix,
      instrucoes: periodicidade === "MENSAL"
        ? "O Asaas emitirá cobranças mensais. No Pix e boleto, cada mês precisa ser pago pelo apoiador."
        : "Obrigado pelo gesto! O uso do app nunca depende de uma oferta." });
  } catch (error) {
    await db.schema("ebd").from("ofertas_desenvolvedor").update({ status: "ERRO" }).eq("id", id);
    return res.status(502).json({ error: error instanceof Error ? error.message : "Erro ao criar cobrança." });
  }
}
