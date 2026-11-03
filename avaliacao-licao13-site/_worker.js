const UPSTREAM = "https://neqbrwzkrnkyxxaiwhoq.supabase.co/functions/v1/ebd-avaliacao-temporaria";
const ACTIONS = { status: "GET", submit: "POST", admin: "POST", toggle: "POST" };
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/quiz") return env.ASSETS.fetch(request);
    const action = url.searchParams.get("action");
    if (!Object.hasOwn(ACTIONS, action) || request.method !== ACTIONS[action]) {
      return new Response(JSON.stringify({ error: "Ação inválida." }), { status: 400, headers: JSON_HEADERS });
    }
    try {
      const payload = request.method === "POST" ? await request.text() : undefined;
      if (payload && payload.length > 6000) {
        return new Response(JSON.stringify({ error: "Envio excede o tamanho permitido." }), { status: 413, headers: JSON_HEADERS });
      }
      const target = new URL(UPSTREAM);
      target.searchParams.set("action", action);
      const response = await fetch(target.toString(), {
        method: request.method,
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: payload
      });
      return new Response(response.body, { status: response.status, headers: JSON_HEADERS });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Falha ao consultar a avaliação. Tente novamente." }), { status: 502, headers: JSON_HEADERS });
    }
  }
};