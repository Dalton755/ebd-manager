import { HeartHandshake, ShieldCheck, Clock3 } from "lucide-react";

// A contribuição financeira ficará disponível apenas após validar
// o gateway em produção. A gratuidade do EBD Manager não depende disso.
export function ApoiarProjetoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 pb-8">
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-5 shadow-sm sm:p-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <HeartHandshake size={27} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Ajude este projeto a permanecer
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
          O EBD Manager nasceu para ajudar nossos irmãos a organizar a Escola Bíblica,
          fortalecer o ensino da Palavra e facilitar o trabalho nas igrejas.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">
          O aplicativo é gratuito e todos os recursos estão disponíveis, sem mensalidade
          obrigatória. Sua colaboração voluntária poderá ajudar com os custos de
          servidores, banco de dados e manutenção.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
          <ShieldCheck size={16} /> Seu acesso não depende de contribuições.
        </p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Clock3 size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Contribuições em breve</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
          Estamos preparando um meio seguro para receber ofertas voluntárias.
          Por enquanto, a geração de cobranças está indisponível. Você pode
          continuar utilizando todos os recursos normalmente.
        </p>
      </section>
    </main>
  );
}
