import { createClient } from "@supabase/supabase-js";

/**
 * Endpoints de apoio voluntário do EBD Manager.
 * As chaves privadas são bindings do Worker (runtime), NUNCA variáveis VITE_*.
 * Esta implementação não é usada pela Vercel, que mantém as rotas legadas.
 */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ASAAS_API_KEY?: string;
  ASAAS_ENVIRONMENT?: string;
  ASAAS_WEBHOOK_TOKEN?: string;
}

type JsonObject = Record<string, unknown>;

function responder(status: number, body: JsonObject): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function lerJson(req: Request): Promise<JsonObject | null> {
  try {
    const json: unknown = await req.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
    return json as JsonObject;
  } catch {
    return null;
  }
}

function banco(env: Env) {
  const url = env.SUPABASE_URL;
  const role = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !role) return null;
  return createClient(url, role, {
    db: { schema: "ebd" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function usuarioAutenticado(req: Request, env: Env) {
  const db = banco(env);
  if (!db) return { db: null, user: null };
  const autorizacao = req.headers.get("Authorization") || "";
  if (!autorizacao.startsWith("Bearer ")) return { db, user: null };
  const token = autorizacao.slice("Bearer ".length).trim();
  if (!token) return { db, user: null };
  const { data, error } = await db.auth.getUser(token);
  return { db, user: error ? null : data.user };
}

function urlAsaas(env: Env): string {
  return env.ASAAS_ENVIRONMENT === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

async function asaas(env: Env, caminho: string, method = "GET", body?: unknown): Promise<any> {
  const resposta = await fetch(urlAsaas(env) + caminho, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "User-Agent": "EBDManager/1.0",
      access_token: env.ASAAS_API_KEY ?? "",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const dados: any = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error("Não foi possível concluir a operação no Asaas. Confira os dados ou contate o suporte.");
  return dados;
}

async function ofertar(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return responder(405, { error: "Método não permitido." });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ASAAS_API_KEY) {
    return responder(503, { error: "A contribuição voluntária ainda não está configurada." });
  }

  const { db, user } = await usuarioAutenticado(req, env);
  if (!db || !user?.id || !user.email) return responder(401, { error: "Faça login novamente." });
  const body = await lerJson(req);
  if (!body) return responder(400, { error: "JSON inválido." });

  const valor = Number(body.valor);
  const periodicidade = String(body.periodicidade ?? "");
  const formaPagamento = String(body.formaPagamento ?? "");
  const nome = String(body.nome ?? "").trim();
  const documento = String(body.cpfCnpj ?? "").replace(/\D/g, "");
  if (
    !Number.isFinite(valor) || valor < 5 || valor > 10000 ||
    Math.abs(valor * 100 - Math.round(valor * 100)) > 0.000001
  ) return responder(400, { error: "Valor deve estar entre R$ 5 e R$ 10.000, com centavos válidos." });

  if (
    !["UNICA", "MENSAL"].includes(periodicidade) ||
    !["PIX", "BOLETO", "CREDIT_CARD"].includes(formaPagamento) ||
    nome.length < 3 || ![11, 14].includes(documento.length)
  ) return responder(400, { error: "Confira seu nome, CPF/CNPJ e opções de oferta." });
  if (periodicidade === "MENSAL" && formaPagamento === "CREDIT_CARD") {
    return responder(400, { error: "O apoio mensal por cartão está indisponível. Utilize Pix ou boleto." });
  }

  const { data: pessoa } = await db.schema("ebd").from("pessoas")
    .select("igreja_id").eq("user_id", user.id).maybeSingle();
  const { data: recente, error: erroBusca } = await db.schema("ebd").from("ofertas_desenvolvedor")
    .select("id").eq("user_id", user.id).neq("status", "ERRO")
    .gte("criado_em", new Date(Date.now() - 60000).toISOString()).limit(1);
  if (erroBusca) return responder(503, { error: "Não foi possível verificar ofertas recentes." });
  if (recente?.length) return responder(429, { error: "Aguarde um minuto antes de solicitar outra oferta." });

  const id = crypto.randomUUID();
  const { error: insercao } = await db.schema("ebd").from("ofertas_desenvolvedor").insert({
    id, user_id: user.id, igreja_id: pessoa?.igreja_id ?? null,
    valor, periodicidade, forma_pagamento: formaPagamento, status: "CRIADA",
  });
  if (insercao) return responder(500, { error: "Não foi possível registrar a oferta." });

  try {
    const { data: anterior } = await db.schema("ebd").from("ofertas_desenvolvedor")
      .select("asaas_customer_id").eq("user_id", user.id)
      .not("asaas_customer_id", "is", null)
      .order("criado_em", { ascending: false }).limit(1).maybeSingle();

    const cliente: any = anterior?.asaas_customer_id
      ? { id: anterior.asaas_customer_id }
      : await asaas(env, "/customers", "POST", {
          name: nome, cpfCnpj: documento, email: user.email,
          externalReference: user.id, notificationDisabled: false,
        });

    const campos = {
      customer: cliente.id, billingType: formaPagamento, value: valor,
      description: "Oferta voluntária EBD Manager", externalReference: id,
    };
    const partes = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const dataHoje = String(partes.year) + "-" + String(partes.month) + "-" + String(partes.day);
    const criado: any = periodicidade === "UNICA"
      ? await asaas(env, "/payments", "POST", { ...campos, dueDate: dataHoje })
      : await asaas(env, "/subscriptions", "POST", {
          ...campos, cycle: "MONTHLY", nextDueDate: dataHoje,
        });
    const assinaturaId = periodicidade === "MENSAL" ? criado.id : null;

    const { error: registro } = await db.schema("ebd").from("ofertas_desenvolvedor")
      .update({
        status: "PENDENTE", asaas_customer_id: cliente.id,
        asaas_subscription_id: assinaturaId,
        asaas_payment_id: assinaturaId ? null : criado.id,
        invoice_url: assinaturaId ? null : criado.invoiceUrl ?? null,
      }).eq("id", id);
    if (registro) {
      throw new Error("A cobrança foi criada no Asaas, mas o registro não foi salvo. Contate o suporte antes de tentar outra oferta.");
    }

    let primeiro: any = assinaturaId ? null : criado;
    if (assinaturaId) {
      try {
        const parcelas = await asaas(env, "/subscriptions/" +
          encodeURIComponent(assinaturaId) + "/payments?limit=1");
        primeiro = parcelas?.data?.[0] ?? null;
      } catch (error) {
        console.error("[ASAAS] Primeira cobrança ainda indisponível", error);
      }
    }
    const pagamentoId: string | null = primeiro?.id ?? null;
    const link: string | null = primeiro?.invoiceUrl ?? null;
    if (assinaturaId && pagamentoId) {
      await db.schema("ebd").from("ofertas_desenvolvedor")
        .update({ asaas_payment_id: pagamentoId, invoice_url: link }).eq("id", id);
    }

    let pix: { payload: string; encodedImage: string } | null = null;
    if (formaPagamento === "PIX" && pagamentoId) {
      try {
        const codigo = await asaas(env, "/payments/" + encodeURIComponent(pagamentoId) + "/pixQrCode");
        pix = { payload: codigo.payload, encodedImage: codigo.encodedImage };
      } catch (error) {
        console.error("[ASAAS] QR Code ainda indisponível", error);
      }
    }
    return responder(200, {
      id, periodicidade, formaPagamento, invoiceUrl: link, pix,
      instrucoes: periodicidade === "MENSAL"
        ? "O Asaas emitirá cobranças mensais. No Pix e boleto, cada mês precisa ser pago pelo apoiador."
        : "O aplicativo permanece gratuito, independentemente do pagamento.",
    });
  } catch (error) {
    console.error("[ASAAS] Erro ao criar oferta:", error);
    const mensagem = error instanceof Error ? error.message : "Não foi possível gerar a cobrança.";
    const possivelmenteCriada = mensagem.includes("registro não foi salvo");
    await db.schema("ebd").from("ofertas_desenvolvedor")
      .update({ status: possivelmenteCriada ? "VERIFICACAO_MANUAL" : "ERRO" }).eq("id", id);
    return responder(502, { error: mensagem });
  }
}

async function cancelarApoio(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return responder(405, { error: "Método não permitido." });
  if (!env.ASAAS_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return responder(503, { error: "Integração não configurada." });
  }

  const { db, user } = await usuarioAutenticado(req, env);
  if (!db || !user?.id) return responder(401, { error: "Sessão inválida." });
  const body = await lerJson(req);
  if (!body) return responder(400, { error: "JSON inválido." });

  const id = String(body.id ?? "");
  const { data: oferta, error: erroBusca } = await db.schema("ebd").from("ofertas_desenvolvedor")
    .select("id,asaas_subscription_id,status").eq("id", id)
    .eq("user_id", user.id).maybeSingle();
  if (erroBusca) return responder(503, { error: "Falha ao consultar o apoio." });
  if (!oferta?.asaas_subscription_id) return responder(404, { error: "Apoio mensal não encontrado." });
  if (oferta.status === "CANCELADA") return responder(200, { ok: true });

  const resposta = await fetch(urlAsaas(env) + "/subscriptions/" +
    encodeURIComponent(oferta.asaas_subscription_id), {
      method: "DELETE",
      headers: { access_token: env.ASAAS_API_KEY, "User-Agent": "EBDManager/1.0" },
      signal: AbortSignal.timeout(25000),
    }).catch(() => null);
  if (!resposta?.ok) {
    return responder(502, { error: "Não foi possível cancelar no Asaas. Tente novamente ou contate o suporte." });
  }

  const { error } = await db.schema("ebd").from("ofertas_desenvolvedor")
    .update({ status: "CANCELADA" }).eq("id", id).eq("user_id", user.id);
  if (error) return responder(500, { error: "Assinatura cancelada no Asaas; não foi possível atualizar o registro." });
  return responder(200, { ok: true });
}

function compararToken(recebido: string, esperado: string): boolean {
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(esperado);
  if (!a.length || !b.length || a.length > 512 || b.length > 512) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

async function webhook(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return responder(405, { error: "Método não permitido." });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.ASAAS_WEBHOOK_TOKEN || env.ASAAS_WEBHOOK_TOKEN.length < 32) {
    return responder(503, { error: "Webhook não configurado." });
  }

  if (!compararToken(req.headers.get("asaas-access-token") ?? "", env.ASAAS_WEBHOOK_TOKEN)) {
    return responder(401, { error: "Origem não autenticada." });
  }
  const evento = await lerJson(req);
  if (!evento || typeof evento.id !== "string" || typeof evento.event !== "string") {
    return responder(400, { error: "Evento inválido." });
  }
  const payment = evento.payment && typeof evento.payment === "object"
    ? evento.payment as JsonObject : {};
  const subscription = evento.subscription && typeof evento.subscription === "object"
    ? evento.subscription as JsonObject : {};
  const assinaturaId = typeof payment.subscription === "string"
    ? payment.subscription
    : typeof evento.subscription === "string" ? evento.subscription
    : typeof subscription.id === "string" ? subscription.id : null;
  const pagamentoId = typeof payment.id === "string" ? payment.id : null;
  const referencia = typeof payment.externalReference === "string"
    ? payment.externalReference
    : typeof subscription.externalReference === "string" ? subscription.externalReference : null;

  if (!assinaturaId && !pagamentoId && !referencia) {
    return responder(200, { ok: true, resultado: "ignorado" });
  }
  const db = banco(env);
  if (!db) return responder(503, { error: "Webhook não configurado." });

  // A função SQL processar_webhook_asaas faz idempotência e transação.
  const { data, error } = await db.schema("ebd").rpc("processar_webhook_asaas", {
    p_event_id: evento.id,
    p_evento: evento.event,
    p_pagamento_id: pagamentoId,
    p_assinatura_id: assinaturaId,
    p_referencia: referencia,
  });
  if (error) {
    console.error("[ASAAS WEBHOOK] Falha na persistência:", error.code);
    return responder(500, { error: "Falha temporária ao registrar o evento." });
  }
  return responder(200, { ok: true, resultado: data });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const pathname = new URL(req.url).pathname;
    try {
      if (pathname === "/api/asaas/ofertar") return await ofertar(req, env);
      if (pathname === "/api/asaas/cancelar-apoio") return await cancelarApoio(req, env);
      if (pathname === "/api/asaas/webhook") return await webhook(req, env);
      if (pathname.startsWith("/api/asaas/")) return responder(404, { error: "Endpoint não encontrado." });
      return env.ASSETS.fetch(req);
    } catch (error) {
      console.error("[EBD Worker] Falha inesperada:", error);
      return responder(500, { error: "Erro interno. Tente novamente ou contate o suporte." });
    }
  },
};
