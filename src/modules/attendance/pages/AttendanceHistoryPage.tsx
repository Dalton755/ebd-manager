import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Map,
  MapPin,
  Search,
  X,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  AttendanceService,
} from "../services/AttendanceService";

import {
  LessonService,
} from "@/modules/lessons/services/LessonService";

import type {
  Presenca,
} from "../types/Presenca";

import type {
  AulaComStatus,
} from "@/modules/lessons/services/LessonService";

import type {
  TrimestreComClasses,
} from "@/modules/lessons/types/TrimestreClasse";

import {
  useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
  useFormDraft,
} from "@/shared/hooks/useFormDraft";


type FiltroStatus =
  | "TODOS"
  | "PENDENTE"
  | "VALIDADO"
  | "REJEITADO";


const TODAS_AULAS =
  "__TODAS__";


export function AttendanceHistoryPage() {

  const {
    pessoa:
      usuarioLogado,
  } =
    useAuth();


  const [
    trimestres,
    setTrimestres,
  ] =
    useState<
      TrimestreComClasses[]
    >(
      []
    );


  const [
    aulas,
    setAulas,
  ] =
    useState<
      AulaComStatus[]
    >(
      []
    );


  const [
    presencas,
    setPresencas,
  ] =
    useState<
      Presenca[]
    >(
      []
    );


  const [
    pesquisa,
    setPesquisa,
  ] =
    useState(
      ""
    );


  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState<FiltroStatus>(
      "PENDENTE"
    );


  const [
    loadingEstrutura,
    setLoadingEstrutura,
  ] =
    useState(
      true
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );


  const [
    processingId,
    setProcessingId,
  ] =
    useState<string | null>(
      null
    );


  const [
    mostrandoLegados,
    setMostrandoLegados,
  ] =
    useState(
      false
    );


  const [
    totalLegados,
    setTotalLegados,
  ] =
    useState(
      0
    );


  const [
    localizacaoIgreja,
    setLocalizacaoIgreja,
  ] =
    useState<{
      latitude: number;
      longitude: number;
      raio_metros: number;
    } | null>(
      null
    );


  /*
   * Mantém os filtros mesmo ao sair
   * e voltar para a página.
   */
  const {
    valores:
      filtros,

    setValores:
      setFiltros,
  } =
    useFormDraft(
      `filtros-historico-presencas-${usuarioLogado?.igreja_id ?? "sem-igreja"}`,
      {
        trimestreId: "",
        classeId: "",
        aulaId:
          TODAS_AULAS,
      }
    );


  const trimestreSelecionado =
    useMemo(
      () =>
        trimestres.find(
          (
            trimestre
          ) =>
            trimestre.id ===
            filtros.trimestreId
        ) ??
        null,

      [
        trimestres,
        filtros.trimestreId,
      ]
    );


  const classesDisponiveis =
    trimestreSelecionado
      ?.classes ??
    [];


  /*
   * Carrega trimestre atual como padrão.
   */
  async function carregarEstrutura() {

    if (
      !usuarioLogado?.igreja_id
    ) {
      return;
    }


    try {

      setLoadingEstrutura(
        true
      );


      const dados =
        await LessonService
          .listarTrimestresComClasses(
            usuarioLogado.igreja_id
          );


      setTrimestres(
        dados
      );


      const trimestreSalvoValido =
        dados.some(
          (
            trimestre
          ) =>
            trimestre.id ===
            filtros.trimestreId
        );


      const trimestreId =
        trimestreSalvoValido
          ? filtros.trimestreId
          : dados.find(
              (
                trimestre
              ) =>
                trimestre.ativo
            )?.id ??
            dados[0]?.id ??
            "";


      const trimestre =
        dados.find(
          (
            item
          ) =>
            item.id ===
            trimestreId
        );


      const classes =
        trimestre?.classes ??
        [];


      const classeSalvaValida =
        classes.some(
          (
            classe
          ) =>
            classe.classe_id ===
            filtros.classeId
        );


      const classeId =
        classeSalvaValida
          ? filtros.classeId
          : classes[0]
              ?.classe_id ??
            "";


      let aulasDaClasse:
        AulaComStatus[] =
        [];


      if (
        trimestreId &&
        classeId
      ) {

        aulasDaClasse =
          await LessonService
            .listarAulasDaClasseNoTrimestre(
              trimestreId,
              classeId
            );
      }


      setAulas(
        aulasDaClasse
      );


      const aulaId =
        filtros.aulaId ===
          TODAS_AULAS ||
        aulasDaClasse.some(
          (
            aula
          ) =>
            aula.id ===
            filtros.aulaId
        )
          ? filtros.aulaId
          : TODAS_AULAS;


      setFiltros({
        trimestreId,
        classeId,
        aulaId,
      });


      /*
       * Descobre quantos registros antigos
       * existem sem aula vinculada.
       */
      const legados =
        await AttendanceService
          .listarSemAula();


      setTotalLegados(
        legados.length
      );

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        "Não foi possível carregar os filtros do histórico."
      );

    } finally {

      setLoadingEstrutura(
        false
      );
    }
  }


  async function carregarLocalizacaoIgreja() {

    if (
      !usuarioLogado?.igreja_id
    ) {
      return;
    }


    try {

      const configuracao =
        await AttendanceService
          .buscarConfiguracaoCheckin(
            usuarioLogado.igreja_id
          );


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

    if (
      !usuarioLogado?.igreja_id
    ) {
      return;
    }


    void carregarEstrutura();

    void carregarLocalizacaoIgreja();

  }, [
    usuarioLogado?.igreja_id,
  ]);


  /*
   * Troca de trimestre.
   */
  async function alterarTrimestre(
    trimestreId: string
  ) {

    const trimestre =
      trimestres.find(
        (
          item
        ) =>
          item.id ===
          trimestreId
      );


    const classeId =
      trimestre
        ?.classes[0]
        ?.classe_id ??
      "";


    let aulasDaClasse:
      AulaComStatus[] =
      [];


    try {

      setLoadingEstrutura(
        true
      );


      if (
        trimestreId &&
        classeId
      ) {

        aulasDaClasse =
          await LessonService
            .listarAulasDaClasseNoTrimestre(
              trimestreId,
              classeId
            );
      }


      setAulas(
        aulasDaClasse
      );


      setFiltros({
        trimestreId,
        classeId,
        aulaId:
          TODAS_AULAS,
      });


      setMostrandoLegados(
        false
      );

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        "Não foi possível carregar as aulas do trimestre."
      );

    } finally {

      setLoadingEstrutura(
        false
      );
    }
  }


  /*
   * Troca de classe.
   */
  async function alterarClasse(
    classeId: string
  ) {

    try {

      setLoadingEstrutura(
        true
      );


      let aulasDaClasse:
        AulaComStatus[] =
        [];


      if (
        filtros.trimestreId &&
        classeId
      ) {

        aulasDaClasse =
          await LessonService
            .listarAulasDaClasseNoTrimestre(
              filtros.trimestreId,
              classeId
            );
      }


      setAulas(
        aulasDaClasse
      );


      setFiltros(
        (
          atual
        ) => ({
          ...atual,

          classeId,

          aulaId:
            TODAS_AULAS,
        })
      );


      setMostrandoLegados(
        false
      );

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        "Não foi possível carregar as aulas da classe."
      );

    } finally {

      setLoadingEstrutura(
        false
      );
    }
  }


  /*
   * Carrega presenças da aula escolhida
   * ou de todas as aulas da classe.
   */
  async function carregarPresencas() {

    if (
      mostrandoLegados
    ) {

      try {

        setLoading(
          true
        );


        const resultado =
          await AttendanceService
            .listarSemAula();


        setPresencas(
          resultado as Presenca[]
        );

      } catch (error) {

        console.error(
          error
        );


        toast.error(
          "Erro ao carregar os registros antigos."
        );

      } finally {

        setLoading(
          false
        );
      }


      return;
    }


    if (
      !filtros.classeId
    ) {

      setPresencas(
        []
      );

      return;
    }


    try {

      setLoading(
        true
      );


      const aulaIds =
        filtros.aulaId ===
          TODAS_AULAS
          ? aulas.map(
              (
                aula
              ) =>
                aula.id
            )
          : [
              filtros.aulaId,
            ];


      const resultado =
        await AttendanceService
          .listarPorAulas(
            aulaIds
          );


      setPresencas(
        resultado as Presenca[]
      );

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        "Erro ao carregar as presenças."
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /*
   * Atualiza automaticamente.
   */
  useEffect(() => {

    if (
      loadingEstrutura
    ) {
      return;
    }


    void carregarPresencas();

  }, [
    filtros.aulaId,
    filtros.classeId,
    aulas,
    mostrandoLegados,
    loadingEstrutura,
  ]);


  async function validarPresenca(
    presenca: Presenca
  ) {

    if (
      !usuarioLogado?.id
    ) {

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

      console.error(
        error
      );


      toast.error(
        "Não foi possível validar a presença."
      );

    } finally {

      setProcessingId(
        null
      );
    }
  }


  async function rejeitarPresenca(
    presenca: Presenca
  ) {

    if (
      !usuarioLogado?.id
    ) {

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
          observacao ??
            undefined
        );


      toast.success(
        "Presença rejeitada."
      );


      await carregarPresencas();

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        "Não foi possível rejeitar a presença."
      );

    } finally {

      setProcessingId(
        null
      );
    }
  }


  const presencasFiltradas =
    useMemo(
      () => {

        return presencas.filter(
          (
            presenca
          ) => {

            const nome =
              presenca.pessoas
                ?.nome
                ?.toLowerCase() ??
              "";


            const aula =
              presenca.aula
                ?.titulo
                ?.toLowerCase() ??
              "";


            const termo =
              pesquisa
                .trim()
                .toLowerCase();


            const correspondePesquisa =
              nome.includes(
                termo
              ) ||
              aula.includes(
                termo
              );


            const status =
              presenca.status_validacao ??
              "PENDENTE";


            const correspondeStatus =
              filtroStatus ===
                "TODOS" ||
              status ===
                filtroStatus;


            return (
              correspondePesquisa &&
              correspondeStatus
            );
          }
        );

      },

      [
        presencas,
        pesquisa,
        filtroStatus,
      ]
    );


  const totalPendentes =
    presencas.filter(
      (
        presenca
      ) =>
        (
          presenca.status_validacao ??
          "PENDENTE"
        ) ===
        "PENDENTE"
    ).length;


  const totalValidados =
    presencas.filter(
      (
        presenca
      ) =>
        presenca.status_validacao ===
        "VALIDADO"
    ).length;


  const totalRejeitados =
    presencas.filter(
      (
        presenca
      ) =>
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
        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  }


  function obterClasseStatus(
    status: string
  ) {

    if (
      status ===
      "VALIDADO"
    ) {
      return "bg-green-100 text-green-700";
    }


    if (
      status ===
      "REJEITADO"
    ) {
      return "bg-red-100 text-red-700";
    }


    return "bg-yellow-100 text-yellow-700";
  }


  function obterTextoStatus(
    status: string
  ) {

    if (
      status ===
      "VALIDADO"
    ) {
      return "Validado";
    }


    if (
      status ===
      "REJEITADO"
    ) {
      return "Rejeitado";
    }


    return "Pendente";
  }


  function abrirNoMapa(
    presenca: Presenca
  ) {

    if (
      presenca.latitude ===
        null ||
      presenca.longitude ===
        null
    ) {

      toast.error(
        "Este check-in não possui localização registrada."
      );

      return;
    }


    if (
      !localizacaoIgreja
    ) {

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
      "?api=1" +
      `&origin=${encodeURIComponent(origem)}` +
      `&destination=${encodeURIComponent(destino)}` +
      "&travelmode=walking";


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }


  if (
    loadingEstrutura &&
    trimestres.length === 0
  ) {

    return (

      <div className="flex min-h-[55vh] items-center justify-center">

        <div className="text-center">

          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Carregando histórico...
          </p>

        </div>

      </div>
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
            Histórico de presenças
          </h1>


          <p className="mt-1 text-slate-500">
            Consulte e valide as presenças registradas nas aulas.
          </p>

        </div>

      </div>


      {/* FILTROS */}

      {!mostrandoLegados && (

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 lg:grid-cols-3">


            {/* TRIMESTRE */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-600">
                Trimestre
              </label>


              <select
                value={
                  filtros.trimestreId
                }

                onChange={(
                  event
                ) =>
                  void alterarTrimestre(
                    event.target.value
                  )
                }

                disabled={
                  loadingEstrutura
                }

                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-600"
              >

                {trimestres.map(
                  (
                    trimestre
                  ) => (

                    <option
                      key={
                        trimestre.id
                      }

                      value={
                        trimestre.id
                      }
                    >

                      {trimestre.numero}º Trimestre de{" "}
                      {trimestre.ano}

                      {trimestre.ativo
                        ? " — Atual"
                        : ""}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* CLASSE */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-600">
                Classe
              </label>


              <select
                value={
                  filtros.classeId
                }

                onChange={(
                  event
                ) =>
                  void alterarClasse(
                    event.target.value
                  )
                }

                disabled={
                  loadingEstrutura ||
                  !filtros.trimestreId
                }

                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-600"
              >

                {classesDisponiveis.map(
                  (
                    classe
                  ) => (

                    <option
                      key={
                        classe.classe_id
                      }

                      value={
                        classe.classe_id
                      }
                    >

                      {classe.classe_nome}

                      {classe.tema
                        ? ` — ${classe.tema}`
                        : ""}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* AULA */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-600">
                Aula
              </label>


              <select
                value={
                  filtros.aulaId
                }

                onChange={(
                  event
                ) =>
                  setFiltros(
                    (
                      atual
                    ) => ({
                      ...atual,

                      aulaId:
                        event.target.value,
                    })
                  )
                }

                disabled={
                  loadingEstrutura ||
                  !filtros.classeId
                }

                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-600"
              >

                <option
                  value={
                    TODAS_AULAS
                  }
                >
                  Todas as aulas
                </option>


                {aulas.map(
                  (
                    aula
                  ) => (

                    <option
                      key={
                        aula.id
                      }

                      value={
                        aula.id
                      }
                    >

                      Aula {aula.numero}
                      {" — "}
                      {aula.titulo}

                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        </section>

      )}


      {/* REGISTROS LEGADOS */}

      {totalLegados > 0 && (

        <div className="flex justify-end">

          <button
            type="button"

            onClick={() =>
              setMostrandoLegados(
                (
                  atual
                ) =>
                  !atual
              )
            }

            className={
              mostrandoLegados
                ? "rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
            }
          >

            {mostrandoLegados
              ? "Voltar para aulas"
              : `${totalLegados} registros antigos sem aula vinculada`}

          </button>

        </div>

      )}


      {mostrandoLegados && (

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">

          <strong>
            Registros antigos
          </strong>

          <p className="mt-1">
            Estes registros foram criados antes de a presença ser vinculada diretamente a uma aula.
          </p>

        </div>

      )}


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


      {/* STATUS */}

      <div className="flex flex-wrap gap-2">

        {[
          "TODOS",
          "PENDENTE",
          "VALIDADO",
          "REJEITADO",
        ].map(
          (
            status
          ) => (

            <button
              key={
                status
              }

              type="button"

              onClick={() =>
                setFiltroStatus(
                  status as FiltroStatus
                )
              }

              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filtroStatus ===
                status
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >

              {status ===
              "TODOS"
                ? "Todos"
                : status ===
                    "PENDENTE"
                  ? "Pendentes"
                  : status ===
                      "VALIDADO"
                    ? "Validados"
                    : "Rejeitados"}

            </button>

          )
        )}

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

            value={
              pesquisa
            }

            onChange={(
              event
            ) =>
              setPesquisa(
                event.target.value
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
            Presenças
          </h2>


          <span className="text-sm text-slate-500">

            {presencasFiltradas.length}{" "}

            {presencasFiltradas.length === 1
              ? "registro"
              : "registros"}

          </span>

        </div>


        {loading ? (

          <div className="flex items-center justify-center gap-2 py-10 text-slate-500">

            <Loader2 className="h-5 w-5 animate-spin" />

            Carregando presenças...

          </div>

        ) : presencasFiltradas.length ===
          0 ? (

          <div className="py-10 text-center">

            <BookOpen className="mx-auto h-9 w-9 text-slate-300" />

            <p className="mt-3 text-slate-500">
              Nenhum registro encontrado.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {presencasFiltradas.map(
              (
                presenca
              ) => {

                const status =
                  presenca.status_validacao ??
                  "PENDENTE";


                const processando =
                  processingId ===
                  presenca.id;


                return (

                  <div
                    key={
                      presenca.id
                    }

                    className="rounded-xl border border-slate-200 p-4"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


                      {/* ALUNO */}

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">

                          {presenca.pessoas
                            ?.nome
                            ?.charAt(
                              0
                            )
                            .toUpperCase() ??
                            "A"}

                        </div>


                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-900">

                            {presenca.pessoas
                              ?.nome ??
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

                            {presenca.hora_checkin && (
                              <>
                                {" • "}

                                {formatarHora(
                                  presenca.hora_checkin
                                )}
                              </>
                            )}

                          </p>

                        </div>

                      </div>


                      {/* INFORMAÇÕES */}

                      <div className="flex flex-wrap items-center gap-2">


                        {presenca.tipo_registro ===
                          "CHAMADA" && (

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            Chamada
                          </span>

                        )}


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


                        {presenca.tipo_registro ===
                          "CHECKIN" && (

                          <button
                            type="button"

                            onClick={() =>
                              abrirNoMapa(
                                presenca
                              )
                            }

                            disabled={
                              presenca.latitude ===
                                null ||
                              presenca.longitude ===
                                null ||
                              !localizacaoIgreja
                            }

                            title="Ver comparação no mapa"

                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            <Map size={16} />

                          </button>

                        )}


                        {presenca.localizacao_status &&
                          presenca.tipo_registro ===
                            "CHECKIN" && (

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              presenca.localizacao_status ===
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

                      {status ===
                        "PENDENTE" && (

                        <div className="flex gap-2">

                          <button
                            type="button"

                            disabled={
                              processando
                            }

                            onClick={() =>
                              void validarPresenca(
                                presenca
                              )
                            }

                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                          >

                            <Check size={17} />

                            Validar

                          </button>


                          <button
                            type="button"

                            disabled={
                              processando
                            }

                            onClick={() =>
                              void rejeitarPresenca(
                                presenca
                              )
                            }

                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >

                            <X size={17} />

                            Rejeitar

                          </button>

                        </div>

                      )}

                    </div>


                    {status ===
                      "REJEITADO" &&
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