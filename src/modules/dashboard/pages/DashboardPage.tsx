import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/dashboard/StatCard";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

import {
  DashboardService,
  type DashboardResumo,
} from "../services/DashboardService";


export function DashboardPage() {

  const [resumo, setResumo] =
    useState<DashboardResumo | null>(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    async function carregarDashboard() {

      try {

        const dados =
          await DashboardService.carregarResumo();

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

  }, []);


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
    ).toLocaleDateString(
      "pt-BR"
    );

  }


  return (

    <div className="space-y-8">

      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da Escola Bíblica"
        icon={LayoutDashboard}
      />


      {/* ================================================= */}
      {/* INDICADORES */}
      {/* ================================================= */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Pessoas"
          value={resumo?.pessoas ?? 0}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Classes"
          value={resumo?.classes ?? 0}
          icon={GraduationCap}
          color="bg-green-100 text-green-600"
        />

        <StatCard
          title="Aulas"
          value={resumo?.aulas ?? 0}
          icon={BookOpen}
          color="bg-purple-100 text-purple-600"
        />

        <StatCard
          title="Presenças"
          value={resumo?.presencas ?? 0}
          icon={ClipboardCheck}
          color="bg-orange-100 text-orange-600"
        />

      </div>


      {/* ================================================= */}
      {/* INFORMAÇÕES */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-2">


        {/* ================================================= */}
        {/* PRÓXIMA AULA */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">

              <CalendarDays size={22} />

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


          {resumo?.proximaAula ? (

            <div className="mt-6">

              <h3 className="text-xl font-bold text-slate-800">

                {resumo.proximaAula.titulo}

              </h3>


              <div className="mt-4 space-y-3 text-sm">

                <div className="flex items-center gap-3 text-slate-600">

                  <CalendarDays
                    size={18}
                    className="text-slate-400"
                  />

                  <span>
                    {formatarData(
                      resumo.proximaAula.data
                    )}
                  </span>

                </div>


                <div className="flex items-center gap-3 text-slate-600">

                  <UserRound
                    size={18}
                    className="text-slate-400"
                  />

                  <span>
                    {resumo.proximaAula.professor}
                  </span>

                </div>

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-xl bg-slate-50 p-5 text-center">

              <p className="text-sm text-slate-500">
                Nenhuma aula programada.
              </p>

            </div>

          )}

        </div>


        {/* ================================================= */}
        {/* RESUMO DE PRESENÇAS */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">

              <ClipboardCheck size={22} />

            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-800">
                Resumo de presenças
              </h2>

              <p className="text-sm text-slate-500">
                Acompanhamento dos registros
              </p>

            </div>

          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Registros
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {resumo?.presencas ?? 0}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Última presença
              </p>

              <p className="mt-1 text-lg font-bold text-slate-800">

                {resumo?.ultimaPresenca
                  ? formatarData(
                      resumo.ultimaPresenca
                    )
                  : "Nenhum registro"}

              </p>

            </div>

          </div>


          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">

            <p className="text-sm text-slate-500">

              O percentual de presença e os
              registros de ausência serão
              calculados quando as classes e
              seus alunos estiverem configurados.

            </p>

          </div>

        </div>

      </div>

    </div>

  );
}