import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
  UserRound,
  AlertTriangle,
} from "lucide-react";

import type { DashboardResumo } from "../services/DashboardService";

type Props = {
  resumo: DashboardResumo | null;
};

export function DashboardIgrejaPage({
  resumo,
}: Props) {
  const frequencia = resumo?.frequencia ?? 0;

  const aulasSemProfessor =
    resumo?.aulasSemProfessor ?? 0;

  const sistemaOk =
    aulasSemProfessor === 0;

  function formatarData(data: string | null) {
    if (!data) {
      return "Nenhum registro";
    }

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString("pt-BR");
  }

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl">

        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative z-10">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">

                <ShieldCheck size={14} />

                Plano Igreja

              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">

                Visão geral da EBD

              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                Acompanhe a saúde da Escola Bíblica,
                frequência, estrutura e programação
                em uma única visão executiva.

              </p>

            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">

                <Activity size={20} />

              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Status da EBD
                </p>

                <p className="text-sm font-semibold text-white">

                  {sistemaOk
                    ? "Operação normal"
                    : "Requer atenção"}

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* INDICADORES PRINCIPAIS */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* ALUNOS */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Alunos ativos
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {resumo?.alunos ?? 0}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {resumo?.pessoas ?? 0} pessoas cadastradas
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <Users size={21} />

            </div>

          </div>

        </div>


        {/* PROFESSORES */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Professores
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {resumo?.professores ?? 0}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Professores ativos
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

              <GraduationCap size={21} />

            </div>

          </div>

        </div>


        {/* CLASSES */}

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Classes
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {resumo?.classes ?? 0}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Classes ativas
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <BookOpen size={21} />

            </div>

          </div>

        </div>


        {/* FREQUÊNCIA */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-lg">

          <div className="relative z-10">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-blue-100">
                  Frequência geral
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {frequencia}%
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">

                <TrendingUp size={21} />

              </div>

            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">

              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, frequencia)
                  )}%`,
                }}
              />

            </div>

            <p className="mt-2 text-xs text-blue-100">
              Indicador geral de participação
            </p>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* PRÓXIMA AULA + STATUS */}
      {/* ================================================= */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* PRÓXIMA AULA */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                <CalendarDays size={20} />

              </div>

              <div>

                <h2 className="font-bold text-slate-900">
                  Próxima aula
                </h2>

                <p className="text-xs text-slate-500">
                  Próxima atividade programada
                </p>

              </div>

            </div>

            <ArrowUpRight
              size={18}
              className="text-slate-400"
            />

          </div>

          <div className="p-6">

            {resumo?.proximaAula ? (

              <div className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="mb-2 inline-flex rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">

                    Aula {resumo.proximaAula.numero ?? "-"}

                  </div>

                  <h3 className="text-xl font-bold text-slate-900">

                    {resumo.proximaAula.titulo}

                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                    <UserRound size={15} />

                    {resumo.proximaAula.professor}

                  </div>

                </div>

                <div className="rounded-xl bg-white px-5 py-4 shadow-sm">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Data
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {formatarData(
                      resumo.proximaAula.data
                    )}
                  </p>

                </div>

              </div>

            ) : (

              <div className="rounded-2xl bg-slate-50 p-8 text-center">

                <CalendarDays
                  className="mx-auto text-slate-300"
                  size={32}
                />

                <p className="mt-3 font-semibold text-slate-700">
                  Nenhuma aula programada
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Cadastre uma aula para acompanhar
                  a programação.
                </p>

              </div>

            )}

          </div>

        </div>


        {/* SAÚDE DA PROGRAMAÇÃO */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                <AlertTriangle size={20} />

              </div>

              <div>

                <h2 className="font-bold text-slate-900">
                  Saúde da programação
                </h2>

                <p className="text-xs text-slate-500">
                  Indicadores operacionais
                </p>

              </div>

            </div>

          </div>

          <div className="space-y-3 p-5">

            <div
              className={
                aulasSemProfessor > 0
                  ? "rounded-xl border border-amber-100 bg-amber-50 p-4"
                  : "rounded-xl border border-emerald-100 bg-emerald-50 p-4"
              }
            >

              <div className="flex items-center gap-3">

                {aulasSemProfessor > 0 ? (
                  <AlertTriangle
                    size={19}
                    className="text-amber-600"
                  />
                ) : (
                  <CheckCircle2
                    size={19}
                    className="text-emerald-600"
                  />
                )}

                <div>

                  <p className="text-sm font-semibold text-slate-800">

                    {aulasSemProfessor > 0
                      ? `${aulasSemProfessor} aula${
                          aulasSemProfessor > 1
                            ? "s"
                            : ""
                        } sem professor`
                      : "Todas as aulas têm professor"}

                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">

                    {aulasSemProfessor > 0
                      ? "A programação precisa de atenção."
                      : "A programação está organizada."}

                  </p>

                </div>

              </div>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center gap-3">

                <ShieldCheck
                  size={19}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Sistema operacional
                  </p>

                  <p className="text-xs text-slate-400">
                    Dados carregados normalmente
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* DESEMPENHO DA EBD */}
      {/* ================================================= */}

      <div className="grid gap-6 md:grid-cols-3">

        {/* PRESENÇAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">

              <ClipboardCheck size={20} />

            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Presença
              </h2>

              <p className="text-xs text-slate-500">
                Registros realizados
              </p>

            </div>

          </div>

          <div className="mt-6">

            <p className="text-3xl font-bold text-slate-900">
              {resumo?.presencas ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              registros de presença
            </p>

          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">

            <CheckCircle2
              size={14}
              className="text-emerald-500"
            />

            Último registro:{" "}
            <strong>
              {formatarData(
                resumo?.ultimaPresenca ?? null
              )}
            </strong>

          </div>

        </div>


        {/* ESTRUTURA */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

              <BookOpen size={20} />

            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Estrutura
              </h2>

              <p className="text-xs text-slate-500">
                Organização pedagógica
              </p>

            </div>

          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Aulas
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {resumo?.aulas ?? 0}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Classes
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {resumo?.classes ?? 0}
              </p>

            </div>

          </div>

        </div>


        {/* COMUNIDADE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <Users size={20} />

            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Comunidade
              </h2>

              <p className="text-xs text-slate-500">
                Pessoas envolvidas
              </p>

            </div>

          </div>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Users
                  size={15}
                  className="text-slate-400"
                />

                <span className="text-sm text-slate-600">
                  Alunos
                </span>

              </div>

              <strong className="text-slate-900">
                {resumo?.alunos ?? 0}
              </strong>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <GraduationCap
                  size={15}
                  className="text-slate-400"
                />

                <span className="text-sm text-slate-600">
                  Professores
                </span>

              </div>

              <strong className="text-slate-900">
                {resumo?.professores ?? 0}
              </strong>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <UserRound
                  size={15}
                  className="text-slate-400"
                />

                <span className="text-sm text-slate-600">
                  Pessoas cadastradas
                </span>

              </div>

              <strong className="text-slate-900">
                {resumo?.pessoas ?? 0}
              </strong>

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* RODAPÉ EXECUTIVO */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">

            <ShieldCheck size={18} />

          </div>

          <div>

            <p className="text-sm font-semibold text-slate-700">
              EBD Manager • Plano Igreja
            </p>

            <p className="text-xs text-slate-400">
              Visão executiva da Escola Bíblica
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">

          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          Sistema operacional

        </div>

      </div>

    </div>
  );
}