// EBD Manager — contribuições de teste via Asaas sandbox.
// Somente sandbox: esta função não aceita chave de produção e não gera cobrança real.
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

type Json = Record<string, unknown>;

const origens = new Set([
  "https://chore-ebd-cloudflare-asaas-preview-ebd-manager.rochadalton00.workers.dev",
  "https://ebd-manager.rochadalton00.workers.dev",
  "https://ebd.nethanel.com.br",
]);

function cors(request: Request): Headers {
  const origin = request.headers.get("origin") ?? "";
  const h = new Headers({
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  if (origens.has(origin)) h.set("Access-Control-Allow-Origin", origin);
  return h;
}

function resposta(request: Request, status: number, data: Json) {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ ...Object.fromEntries(cors(request)), "Content-Type": "application/json" }),
  });
}
function serviceKey(): string {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (key) return key;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return typeof keys.default === "string" ? keys.default : "";
  } catch { return ""; }
}
async function bodyJson(req: Request): Promise<Json | null> {
  try {
    const data: unknown = await req.json();
    return data && typeof data === "object" && !Array.isArray(data) ? data as Json : null;
  } catch { return null; }
}
function sandboxKey(): string {
  return Deno.env.get("EBD_ASAAS_SANDBOX_API_KEY") ?? "";
}
async function asaas(path: string, method = "GET", body?: unknown): Promise<any> {
  const res = await fetch("https://api-sandbox.asaas.com/v3" + path, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "User-Agent": "EBDManager-Sandbox/1.0",
      access_token: sandboxKey(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Não foi possível concluir a operação de teste no Asaas.");
  return data;
}

Deno.serve(async (request) => {
  const headers = cors(request);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return resposta(request, 405, { error: "Método não permitido." });

  // Fail-closed enquanto a credencial de TESTE não estiver cadastrada.
  if (!sandboxKey()) return resposta(request, 503, { error: "Asaas Sandbox ainda não está configurado." });
  const url = Deno.env.get("SUPABASE_URL");
  const key = serviceKey();
  if (!url || !key) return resposta(request, 503, { error: "Autenticação administrativa indisponível." });

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  if (!token) return resposta(request, 401, { error: "Faça login novamente." });

  const db = createClient(url, key, {
    db: { schema: "ebd" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user?.id || !auth.user.email) {
    return resposta(request, 401, { error: "Sessão inválida." });
  }
  const user = auth.user;
  const body = await bodyJson(request);
  if (!body) return resposta(request, 400, { error: "JSON inválido." });

  if (body.acao === "ofertar") {
    const valor = Number(body.valor);
    const periodicidade = String(body.periodicidade ?? "");
    const formaPagamento = String(body.formaPagamento ?? "");
    const nome = String(body.nome ?? "").trim();
    const documento = String(body.cpfCnpj ?? "").replace(/\D/g, "");
    if (!Number.isFinite(valor) || valor < 5 || valor > 10000 ||
        Math.abs(valor * 100 - Math.round(valor * 100)) > 0.000001) {
      return resposta(request, 400, { error: "Valor inválido: escolha entre R$ 5 e R$ 10.000." });
    }
    if (!["UNICA", "MENSAL"].includes(periodicidade) ||
        !["PIX", "BOLETO", "CREDIT_CARD"].includes(formaPagamento) ||
        nome.length < 3 || ![11, 14].includes(documento.length)) {
      return resposta(request, 400, { error: "Confira nome, CPF/CNPJ e as opções de apoio." });
    }
    if (periodicidade === "MENSAL" && formaPagamento === "CREDIT_CARD") {
      return resposta(request, 400, { error: "Para apoio mensal, escolha Pix ou boleto." });
    }

    // Registros de sandbox ficam identificados; não reutilizar customer_id de produção.
    const { data: pessoa } = await db.schema("ebd").from("pessoas")
      .select("igreja_id").eq("user_id", user.id).maybeSingle();
    const { data: recentes, error: erroRecentes } = await db.schema("ebd").from("ofertas_desenvolvedor")
      .select("id").eq("user_id", user.id).neq("status", "ERRO")
      .gte("criado_em", new Date(Date.now() - 60000).toISOString()).limit(1);
    if (erroRecentes) return resposta(request, 503, { error: "Não foi possível verificar ofertas recentes." });
    if (recentes?.length) return resposta(request, 429, { error: "Aguarde um minuto antes de outra tentativa." });

    const id = crypto.randomUUID();
    const { error: erroInserir } = await db.schema("ebd").from("ofertas_desenvolvedor").insert({
      id,
      user_id: user.id,
      igreja_id: pessoa?.igreja_id ?? null,
      valor,
      periodicidade,
      forma_pagamento: formaPagamento,
      status: "CRIADA",
    });
    if (erroInserir) return resposta(request, 500, { error: "Não foi possível registrar a contribuição de teste." });

    let criadaNoAsaas = false;
    try {
      const cliente = await asaas("/customers", "POST", {
        name: nome, cpfCnpj: documento, email: user.email,
        externalReference: user.id, notificationDisabled: true,
      });
      const campos = {
        customer: cliente.id, billingType: formaPagamento, value: valor,
        description: "TESTE SANDBOX — Oferta EBD Manager", externalReference: id,
      };
      const partes = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(new Date()).map(p => [p.type, p.value]));
      const dataHoje = partes.year + "-" + partes.month + "-" + partes.day;
      const criado = periodicidade === "UNICA"
        ? await asaas("/payments", "POST", { ...campos, dueDate: dataHoje })
        : await asaas("/subscriptions", "POST", {
            ...campos, cycle: "MONTHLY", nextDueDate: dataHoje,
          });
      criadaNoAsaas = true;
      const assinaturaId = periodicidade === "MENSAL" ? criado.id : null;
      const { error: erroRegistro } = await db.schema("ebd").from("ofertas_desenvolvedor")
        .update({
          status: "PENDENTE", asaas_customer_id: cliente.id,
          asaas_subscription_id: assinaturaId,
          asaas_payment_id: assinaturaId ? null : criado.id,
          invoice_url: assinaturaId ? null : criado.invoiceUrl ?? null,
        }).eq("id", id);
      if (erroRegistro) throw new Error("A cobrança de teste foi criada, mas o banco não foi atualizado; não tente novamente.");

      let primeiro: any = assinaturaId ? null : criado;
      if (assinaturaId) {
        try {
          const pagamentos = await asaas("/subscriptions/" +
            encodeURIComponent(assinaturaId) + "/payments?limit=1");
          primeiro = pagamentos?.data?.[0] ?? null;
        } catch (e) { console.warn("[EBD SANDBOX] Primeira cobrança ainda indisponível", e); }
      }
      const pagamentoId = primeiro?.id ?? null;
      const link = primeiro?.invoiceUrl ?? null;
      if (assinaturaId && pagamentoId) {
        await db.schema("ebd").from("ofertas_desenvolvedor")
          .update({ asaas_payment_id: pagamentoId, invoice_url: link }).eq("id", id);
      }
      let pix: Json | null = null;
      if (formaPagamento === "PIX" && pagamentoId) {
        try {
          const codigo = await asaas("/payments/" + encodeURIComponent(pagamentoId) + "/pixQrCode");
          pix = { payload: codigo.payload, encodedImage: codigo.encodedImage };
        } catch (e) { console.warn("[EBD SANDBOX] QR Pix ainda indisponível", e); }
      }
      return resposta(request, 200, {
        id, periodicidade, formaPagamento, invoiceUrl: link, pix,
        instrucoes: "Cobrança de teste criada no Asaas Sandbox. Não faça pagamento real.",
        sandbox: true,
      });
    } catch (error) {
      console.error("[EBD SANDBOX] Falha ao criar oferta", error);
      await db.schema("ebd").from("ofertas_desenvolvedor")
        .update({ status: criadaNoAsaas ? "VERIFICACAO_MANUAL" : "ERRO" }).eq("id", id);
      return resposta(request, 502, { error: error instanceof Error ? error.message : "Falha ao criar oferta." });
    }
  }

  if (body.acao === "cancelar") {
    const id = String(body.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return resposta(request, 400, { error: "Identificador inválido." });
    const { data: oferta, error: erroBusca } = await db.schema("ebd").from("ofertas_desenvolvedor")
      .select("id,asaas_subscription_id,status,invoice_url").eq("id", id)
      .eq("user_id", user.id).maybeSingle();
    if (erroBusca) return resposta(request, 503, { error: "Falha ao consultar contribuição." });
    if (!oferta?.asaas_subscription_id) return resposta(request, 404, { error: "Apoio mensal não encontrado." });
    if (oferta.status === "CANCELADA") return resposta(request, 200, { ok: true });

    // Evita usar este endpoint sandbox em assinaturas do Asaas de produção.
    const resp = await fetch("https://api-sandbox.asaas.com/v3/subscriptions/" +
      encodeURIComponent(oferta.asaas_subscription_id), {
        method: "DELETE",
        headers: { access_token: sandboxKey(), "User-Agent": "EBDManager-Sandbox/1.0" },
        signal: AbortSignal.timeout(25000),
      }).catch(() => null);
    if (!resp?.ok) return resposta(request, 502, { error: "Não foi possível cancelar a assinatura de teste." });
    const { error: erroAtualizar } = await db.schema("ebd").from("ofertas_desenvolvedor")
      .update({ status: "CANCELADA" }).eq("id", id).eq("user_id", user.id);
    if (erroAtualizar) return resposta(request, 500, { error: "Asaas cancelou, mas o registro não foi atualizado." });
    return resposta(request, 200, { ok: true });
  }

  return resposta(request, 400, { error: "Ação não reconhecida." });
});
