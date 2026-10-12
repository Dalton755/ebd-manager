import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
    const key = process.env.ASAAS_API_KEY;
    const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const role = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || !url || !role) return res.status(503).json({ error: "Integração não configurada." });
    const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    const db = createClient(url, role, { db: { schema: "ebd" }, auth: { autoRefreshToken: false, persistSession: false } });
    const { data: auth } = await db.auth.getUser(token);
    if (!auth.user) return res.status(401).json({ error: "Sessão inválida." });
    const id = String(req.body?.id ?? "");
    const { data: oferta } = await db.schema("ebd").from("ofertas_desenvolvedor")
        .select("id,asaas_subscription_id,status").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
    if (!oferta?.asaas_subscription_id) return res.status(404).json({ error: "Apoio mensal não encontrado." });
    if (oferta.status === "CANCELADA") return res.status(200).json({ ok: true });
    const host = process.env.ASAAS_ENVIRONMENT === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
    const resposta = await fetch(host + "/subscriptions/" + encodeURIComponent(oferta.asaas_subscription_id), {
        method: "DELETE", headers: { access_token: key, "User-Agent": "EBDManager/1.0" },
        signal: AbortSignal.timeout(25000),
    }).catch(() => null);
    if (!resposta?.ok) return res.status(502).json({ error: "Não foi possível cancelar no Asaas. Tente novamente ou contate o suporte." });
    const { error } = await db.schema("ebd").from("ofertas_desenvolvedor").update({ status: "CANCELADA" }).eq("id", id).eq("user_id", auth.user.id);
    if (error) return res.status(500).json({ error: "Assinatura cancelada no Asaas; não foi possível atualizar o registro." });
    return res.status(200).json({ ok: true });
}
