import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  UserRound,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
} from "lucide-react";

import { useAuth } from "@/app/providers/AuthProvider";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

import {
  DashboardService,
  type DashboardResumo,
} from "../services/DashboardService";

import { DashboardIgrejaPage } from "./DashboardIgrejaPage";

export function DashboardPage() {

  const {
    plano,
    igrejaId,
  } = useAuth();

  const nomePlano =
    plano?.plano?.nome ?? "Semente";

  console.log("PLANO DO DASHBOARD:", nomePlano);

  const [resumo, setResumo] =
    useState<DashboardResumo | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        if (!igrejaId) {
          throw new Error(
            "Igreja do usuário não identificada."
          );
        }

        const dados =
          await DashboardService.carregarResumo(
            igrejaId
          );

        setResumo(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar Dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    carregarDashboard();
  }, [igrejaId]);

  if (loading) {
    return (
      <LoadingSpinner
        text="Carregando Dashboard..."
      />
    );
  }

  function formatarData(data: string) {
    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString("pt-BR");
  }

  // =====================================================
  // DASHBOARD PREMIUM — PLANO IGREJA
  // =====================================================

  if (nomePlano === "Igreja") {
    return (
      <DashboardIgrejaPage
        igrejaId={igrejaId}
        resumoInicial={resumo}
      />
    );
  }

  // =====================================================
  // DASHBOARD DO PLANO SEMENTE
  // =====================================================

  if (nomePlano === "Semente") {

    return (
      <div className="space-y-6">

        <PageHeader
          title="Dashboard"
          subtitle="Visão geral da Escola Bíblica"
          icon={LayoutDashboard}
        />

        {/* ================================================= */}
        {/* INDICADORES BÁSICOS */}
        {/* ================================================= */}

        <div className="grid gap-4 sm:grid-cols-3">

          {/* ALUNOS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Alunos
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {resumo?.alunos ?? 0}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Alunos ativos
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={21} />
              </div>

            </div>

          </div>


          {/* PROFESSORES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Professores
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Classes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
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

        </div>


        {/* ================================================= */}
        {/* FREQUÊNCIA */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <ClipboardCheck size={20} />
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Frequência
                </h2>

                <p className="text-sm text-slate-500">
                  Registros recentes de presença
                </p>

              </div>

            </div>

          </div>


          <div className="divide-y divide-slate-100">

            {resumo?.frequenciaRecente?.length ? (

              resumo.frequenciaRecente.map(
                (registro) => (

                  <div
                    key={registro.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-800">
                        {registro.pessoa}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatarData(registro.data)}
                      </p>

                    </div>


                    <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      {registro.tipo}
                    </div>

                  </div>

                )
              )

            ) : (

              <div className="p-8 text-center">

                <ClipboardCheck
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Nenhum registro de frequência
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Os registros aparecerão aqui quando houver presença.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>
    );
  }

  const frequencia =
    resumo?.frequencia ?? 0;

  const aulasSemProfessor =
    resumo?.aulasSemProfessor ?? 0;

  const sistemaOk =
    aulasSemProfessor === 0;

  return (
    <div className="space-y-8">

      {/* ================================================= */}
      {/* CABEÇALHO */}
      {/* ================================================= */}

      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da Escola Bíblica"
        icon={LayoutDashboard}
      />

      {/* ================================================= */}
      {/* VISÃO GERAL */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* ALUNOS */}

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

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

          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-blue-50 opacity-60 transition-transform duration-300 group-hover:scale-125" />

        </div>


        {/* PROFESSORES */}

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

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

          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-indigo-50 opacity-60 transition-transform duration-300 group-hover:scale-125" />

        </div>


        {/* CLASSES */}

        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

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

          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-50 opacity-60 transition-transform duration-300 group-hover:scale-125" />

        </div>


        {/* FREQUÊNCIA */}

        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-sm">

          <div className="relative z-10 flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-slate-300">
                Frequência geral
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {frequencia}%
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">

                <TrendingUp size={14} />

                <span>
                  Indicador geral da EBD
                </span>

              </div>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
              <TrendingUp size={21} />
            </div>

          </div>

          <div className="relative z-10 mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">

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

          <div className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -top-16 -left-12 h-32 w-32 rounded-full bg-white/5" />

        </div>

      </div>


      {/* ================================================= */}
      {/* PRÓXIMA AULA + ATENÇÃO */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* PRÓXIMA AULA */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

          <div className="border-b border-slate-100 p-6">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <CalendarDays size={21} />
                </div>

                <div>

                  <h2 className="text-lg font-bold text-slate-800">
                    Próxima aula
                  </h2>

                  <p className="text-sm text-slate-500">
                    Próxima atividade programada
                  </p>

                </div>

              </div>

              <ArrowUpRight
                size={20}
                className="text-slate-300"
              />

            </div>

          </div>


          {resumo?.proximaAula ? (

            <div className="p-6">

              <div className="rounded-2xl bg-slate-50 p-5">

                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                  <div className="min-w-0">

                    {resumo.proximaAula.numero && (

                      <span className="inline-flex rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                        Aula {resumo.proximaAula.numero}
                      </span>

                    )}

                    <h3 className="mt-3 text-xl font-bold text-slate-900">
                      {resumo.proximaAula.titulo}
                    </h3>

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                      <UserRound size={16} />

                      <span className="truncate">
                        {resumo.proximaAula.professor}
                      </span>

                    </div>

                  </div>


                  <div className="flex shrink-0 items-center gap-3">

                    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">

                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Data
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatarData(
                          resumo.proximaAula.data
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          ) : (

            <div className="p-6">

              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-6 py-10 text-center">

                <CalendarDays
                  size={28}
                  className="text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Nenhuma aula programada
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Cadastre uma aula para acompanhar a programação.
                </p>

              </div>

            </div>

          )}

        </div>


        {/* ATENÇÃO */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle size={21} />
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Atenção
                </h2>

                <p className="text-sm text-slate-500">
                  Situação da programação
                </p>

              </div>

            </div>

          </div>


          <div className="space-y-3 p-6">

            <div
              className={
                aulasSemProfessor > 0
                  ? "rounded-xl border border-amber-100 bg-amber-50 p-4"
                  : "rounded-xl border border-emerald-100 bg-emerald-50 p-4"
              }
            >

              <div className="flex items-start gap-3">

                {aulasSemProfessor > 0 ? (
                  <CircleAlert
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                ) : (
                  <CircleCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                )}

                <div className="min-w-0">

                  <p
                    className={
                      aulasSemProfessor > 0
                        ? "text-sm font-semibold text-amber-800"
                        : "text-sm font-semibold text-emerald-800"
                    }
                  >
                    {aulasSemProfessor > 0
                      ? `${aulasSemProfessor} aula${aulasSemProfessor > 1 ? "s" : ""} sem professor`
                      : "Todas as aulas têm professor"}
                  </p>

                  <p
                    className={
                      aulasSemProfessor > 0
                        ? "mt-1 text-xs text-amber-600"
                        : "mt-1 text-xs text-emerald-600"
                    }
                  >
                    {aulasSemProfessor > 0
                      ? "Verifique a programação das próximas aulas."
                      : "A programação está organizada."}
                  </p>

                </div>

              </div>

            </div>


            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

              <div className="flex items-center gap-3">

                <ShieldCheck
                  size={19}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Sistema operacional
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Dados carregados normalmente
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* RESUMOS */}
      {/* ================================================= */}

      <div className="grid gap-6 md:grid-cols-2">

        {/* PRESENÇAS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <ClipboardCheck size={21} />
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Presença
                </h2>

                <p className="text-sm text-slate-500">
                  Acompanhamento dos registros
                </p>

              </div>

            </div>

          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Registros
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {resumo?.presencas ?? 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Último registro
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {resumo?.ultimaPresenca
                  ? formatarData(
                    resumo.ultimaPresenca
                  )
                  : "Nenhum"}
              </p>

            </div>

          </div>

        </div>


        {/* ESTRUTURA */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpen size={21} />
            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Estrutura da EBD
              </h2>

              <p className="text-sm text-slate-500">
                Visão da organização pedagógica
              </p>

            </div>

          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Aulas
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {resumo?.aulas ?? 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Professores pendentes
              </p>

              <p
                className={
                  aulasSemProfessor > 0
                    ? "mt-2 text-2xl font-bold text-amber-600"
                    : "mt-2 text-2xl font-bold text-emerald-600"
                }
              >
                {aulasSemProfessor}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* STATUS */}
      {/* ================================================= */}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

        <div className="flex items-center gap-3">

          <div
            className={
              sistemaOk
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                : "flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600"
            }
          >
            <ShieldCheck size={18} />
          </div>

          <div>

            <p className="text-sm font-semibold text-slate-700">
              {sistemaOk
                ? "EBD Manager operacional"
                : "Existem pendências na programação"}
            </p>

            <p className="text-xs text-slate-400">
              Informações atualizadas nesta sessão
            </p>

          </div>

        </div>

        <div
          className={
            sistemaOk
              ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
              : "h-2.5 w-2.5 rounded-full bg-amber-500"
          }
        />

      </div>

    </div>
  );
}