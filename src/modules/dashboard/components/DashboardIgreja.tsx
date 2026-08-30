import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import type { DashboardResumo } from "../services/DashboardService";

type Props = {
  resumo: DashboardResumo;
};

function CardIndicador({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

      <div className="relative z-10 flex items-start justify-between">

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

export function DashboardIgreja({
  resumo,
}: Props) {

  const frequencia = resumo.frequencia ?? 0;

  const sistemaOk =
    resumo.aulasSemProfessor === 0;

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* DESTAQUE */}
      {/* ================================================= */}

      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg sm:p-8">

        <div className="relative z-10 max-w-3xl">

          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Activity size={16} />
            Gestão da Escola Bíblica
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Visão estratégica da sua EBD
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Acompanhe pessoas, classes, frequência e atividades
            da sua Escola Bíblica em uma única visão.
          </p>

        </div>

        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5" />

      </div>


      {/* ================================================= */}
      {/* INDICADORES */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <CardIndicador
          titulo="Alunos"
          valor={resumo.alunos}
          descricao="Alunos ativos"
          icon={Users}
        />

        <CardIndicador
          titulo="Professores"
          valor={resumo.professores}
          descricao="Professores ativos"
          icon={GraduationCap}
        />

        <CardIndicador
          titulo="Classes"
          valor={resumo.classes}
          descricao="Classes ativas"
          icon={BookOpen}
        />

        <CardIndicador
          titulo="Frequência"
          valor={`${frequencia}%`}
          descricao="Indicador geral da EBD"
          icon={TrendingUp}
        />

      </div>


      {/* ================================================= */}
      {/* FREQUÊNCIA + STATUS */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Frequência geral
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {frequencia}%
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Participação dos alunos nas aulas realizadas.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={22} />
            </div>

          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-700"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, frequencia)
                )}%`,
              }}
            />

          </div>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div
              className={
                sistemaOk
                  ? "flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                  : "flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
              }
            >
              {sistemaOk
                ? <CheckCircle2 size={21} />
                : <AlertTriangle size={21} />}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Situação da EBD
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {sistemaOk
                  ? "Tudo em ordem"
                  : "Requer atenção"}
              </p>
            </div>

          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">

            <p className="text-sm text-slate-500">
              Aulas sem professor
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {resumo.aulasSemProfessor}
            </p>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* PRÓXIMA AULA */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CalendarDays size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Próxima aula
              </h2>

              <p className="text-sm text-slate-500">
                Próxima atividade programada da EBD.
              </p>
            </div>

          </div>

        </div>

        <div className="p-6">

          {resumo.proximaAula ? (

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Aula {resumo.proximaAula.numero ?? ""}
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {resumo.proximaAula.titulo}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Professor:{" "}
                  <span className="font-medium text-slate-700">
                    {resumo.proximaAula.professor}
                  </span>
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 px-5 py-4">

                <p className="text-xs text-slate-400">
                  Data
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {new Date(
                    `${resumo.proximaAula.data}T00:00:00`
                  ).toLocaleDateString("pt-BR")}
                </p>

              </div>

            </div>

          ) : (

            <div className="py-6 text-center">

              <CalendarDays
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-medium text-slate-700">
                Nenhuma aula programada
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Cadastre a próxima aula para acompanhar sua EBD.
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ================================================= */}
      {/* RESUMO OPERACIONAL */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Pessoas cadastradas
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {resumo.pessoas}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Aulas cadastradas
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {resumo.aulas}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Registros de presença
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {resumo.presencas}
          </p>

        </div>

      </div>

    </div>
  );
}
