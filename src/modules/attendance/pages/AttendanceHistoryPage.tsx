import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Map,
  MapPin,
  Search,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { AttendanceService } from "../services/AttendanceService";

import type { Presenca } from "../types/Presenca";

import { useAuth } from "@/modules/auth/hooks/useAuth";

type FiltroStatus =
  | "TODOS"
  | "PENDENTE"
  | "VALIDADO"
  | "REJEITADO";

export function AttendanceHistoryPage() {

  const hoje =
    new Date().toISOString().split("T")[0];

  const {
    pessoa: usuarioLogado,
  } = useAuth();

  const [dataInicial, setDataInicial] =
    useState(hoje);

  const [dataFinal, setDataFinal] =
    useState(hoje);

  const [pesquisa, setPesquisa] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>("PENDENTE");

  const [presencas, setPresencas] =
    useState<Presenca[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [
    localizacaoIgreja,
    setLocalizacaoIgreja,
  ] = useState<{
    latitude: number;
    longitude: number;
    raio_metros: number;
  } | null>(null);

  async function carregarPresencas() {

    if (dataInicial > dataFinal) {

      toast.error(
        "A data inicial não pode ser maior que a data final."
      );

      return;
    }

    try {

      setLoading(true);

      const resultado =
        await AttendanceService
          .listarPorPeriodo(
            dataInicial,
            dataFinal
          );

      setPresencas(
        resultado as Presenca[]
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Erro ao carregar as presenças."
      );

    } finally {

      setLoading(false);

    }

  }

  async function carregarLocalizacaoIgreja() {

    try {

      const configuracao =
        await AttendanceService
          .buscarConfiguracaoCheckin();

      if (!configuracao) {
        return;
      }

      setLocalizacaoIgreja(
        configuracao
      );

    } catch (error) {

      console.error(
        "Erro ao carregar localização da igreja:",
        error
      );

    }

  }

  useEffect(() => {

    carregarPresencas();

    carregarLocalizacaoIgreja();

  }, []);

  async function validarPresenca(
    presenca: Presenca
  ) {

    if (!usuarioLogado?.id) {

      toast.error(
        "Não foi possível identificar o usuário responsável pela validação."
      );

      return;
    }

    try {

      setProcessingId(
        presenca.id
      );

      await AttendanceService
        .validarPresenca(
          presenca.id,
          usuarioLogado.id
        );

      toast.success(
        "Presença validada com sucesso!"
      );

      await carregarPresencas();

    } catch (error) {

      console.error(error);

      toast.error(
        "Não foi possível validar a presença."
      );

    } finally {

      setProcessingId(null);

    }

  }

  async function rejeitarPresenca(
    presenca: Presenca
  ) {

    if (!usuarioLogado?.id) {

      toast.error(
        "Não foi possível identificar o usuário responsável pela validação."
      );

      return;
    }

    const observacao =
      window.prompt(
        "Informe o motivo da rejeição (opcional):"
      );

    try {

      setProcessingId(
        presenca.id
      );

      await AttendanceService
        .rejeitarPresenca(
          presenca.id,
          usuarioLogado.id,
          observacao ?? undefined
        );

      toast.success(
        "Presença rejeitada."
      );

      await carregarPresencas();

    } catch (error) {

      console.error(error);

      toast.error(
        "Não foi possível rejeitar a presença."
      );

    } finally {

      setProcessingId(null);

    }

  }

  const presencasFiltradas =
    useMemo(() => {

      return presencas.filter(
        (presenca) => {

          const nome =
            presenca.pessoas?.nome
              ?.toLowerCase() ?? "";

          const aula =
            presenca.aula?.titulo
              ?.toLowerCase() ?? "";

          const termo =
            pesquisa.toLowerCase();

          const correspondePesquisa =
            nome.includes(termo) ||
            aula.includes(termo);

          const status =
            presenca.status_validacao ??
            "PENDENTE";

          const correspondeStatus =
            filtroStatus === "TODOS" ||
            status === filtroStatus;

          return (
            correspondePesquisa &&
            correspondeStatus
          );

        }
      );

    }, [
      presencas,
      pesquisa,
      filtroStatus,
    ]);

  const totalPendentes =
    presencas.filter(
      (presenca) =>
        (presenca.status_validacao ??
          "PENDENTE") === "PENDENTE"
    ).length;

  const totalValidados =
    presencas.filter(
      (presenca) =>
        presenca.status_validacao ===
        "VALIDADO"
    ).length;

  const totalRejeitados =
    presencas.filter(
      (presenca) =>
        presenca.status_validacao ===
        "REJEITADO"
    ).length;

  function formatarData(
    data: string
  ) {

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString(
      "pt-BR"
    );

  }

  function formatarHora(
    dataHora: string | null
  ) {

    if (!dataHora) {
      return "-";
    }

    return new Date(
      dataHora
    ).toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  }

  function obterClasseStatus(
    status: string
  ) {

    if (status === "VALIDADO") {
      return "bg-green-100 text-green-700";
    }

    if (status === "REJEITADO") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";

  }

  function obterTextoStatus(
    status: string
  ) {

    if (status === "VALIDADO") {
      return "Validado";
    }

    if (status === "REJEITADO") {
      return "Rejeitado";
    }

    return "Pendente";

  }

  function abrirNoMapa(
    presenca: Presenca
  ) {

    if (
      presenca.latitude === null ||
      presenca.longitude === null
    ) {

      toast.error(
        "Este check-in não possui localização registrada."
      );

      return;
    }

    if (!localizacaoIgreja) {

      toast.error(
        "A localização da igreja não foi encontrada."
      );

      return;
    }

    const origem =
      `${presenca.latitude},${presenca.longitude}`;

    const destino =
      `${localizacaoIgreja.latitude},${localizacaoIgreja.longitude}`;

    const url =
      "https://www.google.com/maps/dir/" +
      `?api=1` +
      `&origin=${encodeURIComponent(origem)}` +
      `&destination=${encodeURIComponent(destino)}` +
      `&travelmode=walking`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (

    <div className="mx-auto w-full max-w-7xl space-y-6">

      {/* CABEÇALHO */}

      <div className="flex items-start gap-4">

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100">

          <ClipboardList
            size={28}
            className="text-blue-600"
          />

        </div>

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Validação de Presenças
          </h1>

          <p className="mt-1 text-slate-500">
            Analise e valide os check-ins realizados pelos alunos.
          </p>

        </div>

      </div>

      {/* FILTROS DE DATA */}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-600">
              Data inicial
            </label>

            <div className="relative">

              <CalendarDays
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={dataInicial}
                onChange={(e) =>
                  setDataInicial(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-blue-600"
              />

            </div>

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-600">
              Data final
            </label>

            <div className="relative">

              <CalendarDays
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={dataFinal}
                onChange={(e) =>
                  setDataFinal(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-blue-600"
              />

            </div>

          </div>

        </div>

        <button
          type="button"
          onClick={carregarPresencas}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Consultar período
        </button>

      </div>

      {/* RESUMO */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Pendentes
          </p>

          <p className="mt-1 text-3xl font-bold text-yellow-600">
            {totalPendentes}
          </p>

        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <CheckCircle2
            size={22}
            className="text-green-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Validadas
          </p>

          <p className="mt-1 text-3xl font-bold text-green-600">
            {totalValidados}
          </p>

        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Rejeitadas
          </p>

          <p className="mt-1 text-3xl font-bold text-red-600">
            {totalRejeitados}
          </p>

        </div>

      </div>

      {/* FILTRO DE STATUS */}

      <div className="flex flex-wrap gap-2">

        {[
          "TODOS",
          "PENDENTE",
          "VALIDADO",
          "REJEITADO",
        ].map((status) => (

          <button
            key={status}
            type="button"
            onClick={() =>
              setFiltroStatus(
                status as FiltroStatus
              )
            }
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filtroStatus === status
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
          >
            {status === "TODOS"
              ? "Todos"
              : status === "PENDENTE"
                ? "Pendentes"
                : status === "VALIDADO"
                  ? "Validados"
                  : "Rejeitados"}
          </button>

        ))}

      </div>

      {/* PESQUISA */}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Pesquisar aluno ou aula..."
            value={pesquisa}
            onChange={(e) =>
              setPesquisa(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600"
          />

        </div>

      </div>

      {/* LISTA */}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">

        <div className="mb-4 flex items-center justify-between gap-4">

          <h2 className="text-xl font-bold text-slate-900">
            Check-ins
          </h2>

          <span className="text-sm text-slate-500">
            {presencasFiltradas.length} registros
          </span>

        </div>

        {loading ? (

          <div className="py-10 text-center text-slate-500">
            Carregando presenças...
          </div>

        ) : presencasFiltradas.length === 0 ? (

          <div className="py-10 text-center text-slate-500">
            Nenhum registro encontrado.
          </div>

        ) : (

          <div className="space-y-4">

            {presencasFiltradas.map(
              (presenca) => {

                const status =
                  presenca.status_validacao ??
                  "PENDENTE";

                const processando =
                  processingId ===
                  presenca.id;

                return (

                  <div
                    key={presenca.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      {/* ALUNO */}

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">

                          {presenca.pessoas?.nome
                            ?.charAt(0)
                            .toUpperCase() ??
                            "A"}

                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-900">
                            {presenca.pessoas?.nome ??
                              "Aluno"}
                          </p>

                          <p className="text-sm text-slate-500">

                            {presenca.aula
                              ? `Aula ${presenca.aula.numero} — ${presenca.aula.titulo}`
                              : "Aula não identificada"}

                          </p>

                          <p className="mt-1 text-xs text-slate-400">

                            {formatarData(
                              presenca.data
                            )}

                            {" • "}

                            {formatarHora(
                              presenca.hora_checkin
                            )}

                          </p>

                        </div>

                      </div>

                      {/* INFORMAÇÕES */}

                      <div className="flex flex-wrap items-center gap-2">

                        {presenca.distancia_metros !==
                          null && (

                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">

                              <MapPin
                                size={14}
                              />

                              {Math.round(
                                presenca.distancia_metros
                              )}{" "}
                              m

                            </span>

                          )}

                        <button
                          type="button"
                          onClick={() =>
                            abrirNoMapa(
                              presenca
                            )
                          }
                          disabled={
                            presenca.latitude === null ||
                            presenca.longitude === null ||
                            !localizacaoIgreja
                          }
                          title="Ver comparação no mapa"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Map size={16} />
                        </button>

                        {presenca.localizacao_status && (

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${presenca.localizacao_status ===
                              "DENTRO"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                              }`}
                          >
                            {presenca.localizacao_status ===
                              "DENTRO"
                              ? "Dentro do local"
                              : "Fora do raio"}
                          </span>

                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${obterClasseStatus(
                            status
                          )}`}
                        >
                          {obterTextoStatus(
                            status
                          )}
                        </span>

                      </div>

                      {/* AÇÕES */}

                      {status === "PENDENTE" && (

                        <div className="flex gap-2">

                          <button
                            type="button"
                            disabled={
                              processando
                            }
                            onClick={() =>
                              validarPresenca(
                                presenca
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                          >
                            <Check
                              size={17}
                            />

                            Validar

                          </button>

                          <button
                            type="button"
                            disabled={
                              processando
                            }
                            onClick={() =>
                              rejeitarPresenca(
                                presenca
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <X
                              size={17}
                            />

                            Rejeitar

                          </button>

                        </div>

                      )}

                    </div>

                    {status === "REJEITADO" &&
                      presenca.observacao_validacao && (

                        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">

                          <strong>
                            Motivo:
                          </strong>{" "}

                          {
                            presenca.observacao_validacao
                          }

                        </div>

                      )}

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </div>

  );

}