import {
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";

import type { DashboardResumo } from "../services/DashboardService";

type Props = {
  resumo: DashboardResumo;
};

function Indicador({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {valor}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {descricao}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSemente({
  resumo,
}: Props) {
  return (
    <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-3">

        <Indicador
          titulo="Alunos"
          valor={resumo.alunos}
          descricao="Alunos ativos"
          icon={Users}
        />

        <Indicador
          titulo="Professores"
          valor={resumo.professores}
          descricao="Professores ativos"
          icon={GraduationCap}
        />

        <Indicador
          titulo="Classes"
          valor={resumo.classes}
          descricao="Classes ativas"
          icon={BookOpen}
        />

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">

          <h2 className="text-lg font-semibold text-slate-900">
            Frequência
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe os registros de frequência da Escola Bíblica.
          </p>

        </div>

        <div className="p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Registros realizados
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {resumo.presencas}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500">
                Última frequência
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {resumo.ultimaPresenca
                  ? new Date(
                      `${resumo.ultimaPresenca}T00:00:00`
                    ).toLocaleDateString("pt-BR")
                  : "Nenhum registro"}
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
