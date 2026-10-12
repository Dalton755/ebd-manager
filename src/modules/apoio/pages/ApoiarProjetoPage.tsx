import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, Copy, HeartHandshake, ShieldCheck, Wallet } from "lucide-react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase } from "@/shared/lib/supabase/client";

type Periodicidade = "UNICA" | "MENSAL";
type Forma = "PIX" | "BOLETO" | "CREDIT_CARD";
type Apoio = {
  id: string;
  valor: number;
  periodicidade: Periodicidade;
  status: string;
  asaas_subscription_id: string | null;
  criado_em: string;
};
type Retorno = {
  invoiceUrl?: string | null;
  pix?: { payload?: string; encodedImage?: string } | null;
  instrucoes?: string;
};

const dinheiro = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ApoiarProjetoPage() {
  const { pessoa, user } = useAuth();
  const [valor, setValor] = useState("20");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("UNICA");
  const [formaPagamento, setFormaPagamento] = useState<Forma>("PIX");
  const [nome, setNome] = useState(pessoa?.nome ?? "");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Retorno | null>(null);
  const [erro, setErro] = useState("");
  const [apoios, setApoios] = useState<Apoio[]>([]);
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => { if (pessoa?.nome && !nome) setNome(pessoa.nome); }, [pessoa?.nome, nome]);
  async function carregarApoios() {
    const { data } = await supabase.schema("ebd").from("ofertas_desenvolvedor")
      .select("id,valor,periodicidade,status,asaas_subscription_id,criado_em")
      .order("criado_em", { ascending: false }).limit(30);
    setApoios((data ?? []) as Apoio[]);
  }
  useEffect(() => { if (user) void carregarApoios(); }, [user]);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setResultado(null);
    const valorNumerico = Number(valor.replace(",", "."));
    if (!Number.isFinite(valorNumerico) || valorNumerico < 5 || valorNumerico > 10000) {
      setErro("Escolha um valor entre R$ 5,00 e R$ 10.000,00.");
      return;
    }
    setEnviando(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("Sua sessão expirou. Entre novamente.");
      const resposta = await fetch("/api/asaas/ofertar", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ valor: valorNumerico, periodicidade, formaPagamento, nome: nome.trim(), cpfCnpj }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.error ?? "Não foi possível gerar a oferta.");
      setResultado(dados as Retorno);
      setCpfCnpj("");
      await carregarApoios();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao gerar cobrança.");
    } finally { setEnviando(false); }
  }
  async function cancelar(id: string) {
    if (!window.confirm("Cancelar este apoio mensal? Os recursos do EBD Manager continuarão liberados.")) return;
    setCancelando(id);
    setErro("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("Sessão expirada.");
      const res = await fetch("/api/asaas/cancelar-apoio", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ id }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.error ?? "Não foi possível cancelar.");
      await carregarApoios();
    } catch (error) { setErro(error instanceof Error ? error.message : "Erro ao cancelar."); }
    finally { setCancelando(null); }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 pb-8">
      <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-5 shadow-sm sm:p-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <HeartHandshake size={27} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Ajude este projeto a permanecer
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
          O EBD Manager nasceu do desejo de ajudar nossos irmãos a organizar a Escola Bíblica Dominical,
          fortalecer o ensino da Palavra e facilitar o trabalho nas igrejas.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">
          Ele é gratuito e todos os recursos estão disponíveis, sem mensalidade obrigatória.
          Porém, manter o aplicativo funcionando tem custos com servidores, banco de dados e manutenção.
          Se este projeto tem abençoado sua igreja e você deseja contribuir, sua oferta voluntária faz a diferença.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
          <ShieldCheck size={16} /> Ofertar é opcional e nunca altera seu acesso.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Quero abençoar este projeto</h2>
          <p className="mt-1 text-sm text-slate-500">Você escolhe o valor e como deseja contribuir.</p>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-slate-800">Tipo de oferta</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["UNICA", "MENSAL"] as const).map(tipo => (
              <button key={tipo} type="button" onClick={() => { setPeriodicidade(tipo); if (tipo === "MENSAL" && formaPagamento === "CREDIT_CARD") setFormaPagamento("PIX"); setResultado(null); }}
                aria-pressed={periodicidade === tipo}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${periodicidade === tipo ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {tipo === "UNICA" ? "Oferta única" : "Oferta mensal"}
              </button>
            ))}
          </div>
          {periodicidade === "MENSAL" && <p className="mt-2 text-xs leading-5 text-slate-500">
            Você poderá cancelar quando desejar. Pix e boleto gerarão uma nova cobrança a cada mês. A opção de cartão recorrente ainda está indisponível.
          </p>}
        </fieldset>
        <div>
          <label htmlFor="valor-apoio" className="mb-2 block text-sm font-bold text-slate-800">Valor da oferta (R$)</label>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[10, 20, 50].map(v => (
              <button key={v} type="button" onClick={() => setValor(String(v))}
                className={`rounded-lg border px-2 py-2 text-sm font-semibold ${Number(valor.replace(",", ".")) === v ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"}`}>
                {dinheiro(v)}
              </button>
            ))}
          </div>
          <input id="valor-apoio" inputMode="decimal" value={valor} onChange={event => setValor(event.target.value)}
            placeholder="Digite o valor" required className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-600" />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-slate-800">Como deseja pagar?</legend>
          <div className="grid grid-cols-3 gap-2">
            {([{ valor: "PIX", rotulo: "Pix" }, { valor: "BOLETO", rotulo: "Boleto" }, { valor: "CREDIT_CARD", rotulo: "Cartão" }] as const).map(item => (
              <button key={item.valor} type="button" aria-pressed={formaPagamento === item.valor}
                onClick={() => { setFormaPagamento(item.valor); setResultado(null); }}
                disabled={periodicidade === "MENSAL" && item.valor === "CREDIT_CARD"}
                className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${formaPagamento === item.valor ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>{item.rotulo}</button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome-apoio" className="mb-2 block text-sm font-bold text-slate-800">Nome do ofertante</label>
            <input id="nome-apoio" value={nome} onChange={event => setNome(event.target.value)}
              autoComplete="name" required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
          </div>
          <div>
            <label htmlFor="documento-apoio" className="mb-2 block text-sm font-bold text-slate-800">CPF ou CNPJ</label>
            <input id="documento-apoio" inputMode="numeric" autoComplete="off" value={cpfCnpj}
              onChange={event => setCpfCnpj(event.target.value.replace(/[^\d.\-/]/g, "").slice(0, 18))}
              placeholder="Necessário para gerar a cobrança" required className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm" />
          </div>
        </div>
        <p className="text-xs leading-5 text-slate-500">Seu CPF/CNPJ será enviado ao Asaas apenas para emitir a cobrança. Não guardamos esse documento na tabela de ofertas.</p>
        {erro && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
        <button type="submit" disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-60">
          <Wallet size={19} /> {enviando ? "Gerando cobrança..." : "Ofertar com segurança"}
        </button>
        <p className="text-center text-xs text-slate-500">Cobrança processada pelo Asaas • Pagamento não é obrigatório.</p>
      </form>

      {resultado && <section aria-live="polite" className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7">
        <div className="flex items-center gap-2 font-extrabold text-emerald-900"><CheckCircle2 size={21} /> Cobrança gerada no Asaas</div>
        <p className="text-sm leading-6 text-emerald-900">{resultado.instrucoes}</p>
        {resultado.pix?.encodedImage && <img className="mx-auto h-52 w-52 rounded-xl bg-white p-2" alt="Código QR Pix da cobrança" src={`data:image/png;base64,${resultado.pix.encodedImage}`} />}
        {resultado.pix?.payload && <button type="button" onClick={() => void navigator.clipboard.writeText(resultado.pix?.payload ?? "")}
          className="flex w-full justify-center gap-2 rounded-xl border border-emerald-400 bg-white px-4 py-3 text-sm font-semibold text-emerald-800">
          <Copy size={18} /> Copiar Pix Copia e Cola
        </button>}
        {resultado.invoiceUrl && <a href={resultado.invoiceUrl} target="_blank" rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">
          Abrir cobrança no Asaas <ArrowUpRight size={18} />
        </a>}
        {!resultado.invoiceUrl && !resultado.pix?.payload && <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
          Sua oferta mensal foi registrada. O Asaas está preparando a primeira cobrança e poderá enviar as instruções por e-mail.
        </p>}
        <p className="text-xs text-emerald-800">Cobrança criada não significa pagamento confirmado.</p>
      </section>}

      {apoios.some(a => a.periodicidade === "MENSAL" && a.asaas_subscription_id && a.status !== "CANCELADA") && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-extrabold text-slate-900">Gerenciar meus apoios mensais</h2>
          <div className="space-y-3">
            {apoios.filter(a => a.periodicidade === "MENSAL" && a.asaas_subscription_id && a.status !== "CANCELADA").map(apoio => (
              <div key={apoio.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 text-sm">
                <span>{dinheiro(Number(apoio.valor))}/mês <small className="block text-slate-500">Status: {apoio.status}</small></span>
                <button onClick={() => void cancelar(apoio.id)} disabled={cancelando === apoio.id}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
                  {cancelando === apoio.id ? "Cancelando..." : "Cancelar apoio mensal"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
