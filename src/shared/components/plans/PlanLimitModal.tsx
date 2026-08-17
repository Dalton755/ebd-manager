import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  utilizado: number;
  limite: number;
  recurso:
  | "pessoas"
  | "classes"
  | "professores"
  | "secretarios"
  | "pastores"
  | "administradores"
  | "superintendentes"
  | "trimestres";
  onClose: () => void;
};

export function PlanLimitModal({
  open,
  utilizado,
  limite,
  recurso,
  onClose,
}: Props) {
  const navigate = useNavigate();

  const nomesRecursos = {
  pessoas: "pessoas",
  classes: "classes",
  professores: "professores",
  secretarios: "secretários",
  pastores: "pastores",
  administradores: "administradores",
  superintendentes: "superintendentes",
  trimestres: "trimestres",
};

  const nomeRecurso = nomesRecursos[recurso];

  if (!open) {
    return null;
  }

  function irParaPlanos() {
    onClose();
    navigate("/planos");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <span className="text-2xl">
            !
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-800">
          O limite do seu plano foi atingido
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sua igreja já utiliza{" "}
          <strong>
            {utilizado} de {limite}
          </strong>{" "}
          {nomeRecurso} disponíveis no plano atual.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          O limite de {nomeRecurso} do seu plano atual foi atingido.
          Para continuar adicionando {nomeRecurso}, é necessário
          ampliar o limite do seu plano.
        </p>

        <div className="mt-5 rounded-xl bg-blue-50 p-4">
          <p className="font-semibold text-blue-800">
            Temos uma solução para você.
          </p>

          <p className="mt-1 text-sm text-blue-700">
            Encontre um plano que acompanhe o crescimento
            da sua igreja.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Agora não
          </button>

          <button
            type="button"
            onClick={irParaPlanos}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ver planos
          </button>

        </div>

      </div>
    </div>
  );
}