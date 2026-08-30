import { supabase } from "@/shared/lib/supabase/client";

export type DashboardResumo = {
  alunos: number;
  professores: number;
  pessoas: number;
  aulas: number;
  presencas: number;
  classes: number;

  frequencia: number;

  frequenciaRecente: {
    id: string;
    data: string;
    pessoa: string;
    tipo: string;
  }[];

  proximaAula: {
    id: string;
    numero: number | null;
    titulo: string;
    data: string;
    professor: string;
  } | null;

  ultimaPresenca: string | null;

  aulasSemProfessor: number;
};

export type DashboardTrimestre = {
  id: string;
  numero: number;
  ano: number;
  tema: string;
  ativo: boolean;
};

export type DashboardAlunoAtencao = {
  id: string;
  nome: string;
  frequencia: number;
  presencas: number;
  aulasEsperadas: number;
};

export type DashboardAnalise = {
  aulasRealizadas: number;
  frequenciaMedia: number;
  alunosAssiduos: number;
  alunosAtencao: number;
  alunosSemParticipacao: number;
  mediaAlunosPorAula: number;
  coberturaProfessores: number;
  evolucaoPontosPercentuais: number | null;

  trimestreAnterior: {
    id: string;
    numero: number;
    ano: number;
    tema: string;
    frequencia: number;
  } | null;

  alunosCriticos: DashboardAlunoAtencao[];
};

export type DashboardEvolucaoTrimestre = {
  id: string;
  numero: number;
  ano: number;
  tema: string;
  ativo: boolean;
  frequencia: number;
};

export type DashboardDesempenhoClasse = {
  id: string;
  nome: string;
  alunos: number;
  aulasRealizadas: number;
  frequencia: number;
  mediaAlunosPorAula: number;
  alunosAssiduos: number;
  alunosAtencao: number;
  alunosSemParticipacao: number;
};

export type DashboardAlunoOpcao = {
  id: string;
  nome: string;
  classeId: string | null;
  classeNome: string;
};

export type DashboardHistoricoAluno = {
  aulaId: string;
  numero: number | null;
  titulo: string;
  data: string;
  presente: boolean;
  tipoRegistro: string | null;
};

export type DashboardDesempenhoIndividual = {
  aluno: {
    id: string;
    nome: string;
    classeId: string | null;
    classeNome: string;
  };

  frequencia: number;
  presencas: number;
  faltas: number;
  aulasEsperadas: number;
  mediaClasse: number;
  diferencaMediaClasse: number | null;
  sequenciaAtual: number;
  historico: DashboardHistoricoAluno[];
};

export type DashboardEvolucaoAlunoTrimestre = {
  id: string;
  numero: number;
  ano: number;
  tema: string;
  ativo: boolean;
  frequencia: number;
  presencas: number;
  faltas: number;
  aulasEsperadas: number;
};

type PessoaDashboard = {
  id: string;
  nome: string;
  classe_id: string | null;
  perfil: string;
  ativo: boolean;
  status: string;
};

type ClasseDashboard = {
  id: string;
  nome: string;
  ativa: boolean;
};

type AulaDashboard = {
  id: string;
  trimestre_id: string;
  classe_id: string | null;
  numero: number | null;
  titulo: string;
  data: string;
  professor_id: string | null;
};

type MatriculaDashboard = {
  pessoa_id: string;
  classe_id: string;
  trimestre_id: string;
  inicio_em: string;
  fim_em: string | null;
};

type PresencaDashboard = {
  id: string;
  pessoa_id: string | null;
  aula_id: string | null;
  data: string;
  tipo_registro: string | null;
  criado_em: string;
};

type BaseDashboard = {
  hoje: string;
  pessoas: PessoaDashboard[];
  classes: ClasseDashboard[];
  aulas: AulaDashboard[];
  matriculas: MatriculaDashboard[];
  presencas: PresencaDashboard[];
  matriculasPorPessoaTrimestre: Map<string, MatriculaDashboard[]>;
  presencasPorPessoaAula: Map<string, PresencaDashboard>;
};

export class DashboardService {
  // =====================================================
  // HELPERS INTERNOS
  // =====================================================

  private static dataHoje(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(
      agora.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
      agora.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  private static chavePessoaTrimestre(
    pessoaId: string,
    trimestreId: string
  ) {
    return `${pessoaId}:${trimestreId}`;
  }

  private static chavePessoaAula(
    pessoaId: string,
    aulaId: string
  ) {
    return `${pessoaId}:${aulaId}`;
  }

  private static alunoAtualValido(
    pessoa: PessoaDashboard
  ) {
    return (
      pessoa.perfil === "ALUNO" &&
      pessoa.ativo === true &&
      pessoa.status === "ATIVO"
    );
  }

  private static matriculaVigenteNaData(
    matricula: MatriculaDashboard,
    data: string
  ) {
    return (
      matricula.inicio_em <= data &&
      (
        matricula.fim_em === null ||
        matricula.fim_em >= data
      )
    );
  }

  /*
   * Regra central do Dashboard:
   *
   * 1. Se existe histórico em matriculas_classes para
   *    pessoa + trimestre, ele é a fonte da verdade.
   *
   * 2. Se NÃO existe nenhuma matrícula histórica naquele
   *    trimestre, usamos pessoas.classe_id apenas como
   *    fallback para dados legados.
   *
   * Isso evita que uma transferência futura de classe
   * reescreva o passado.
   */
  private static pessoaPertenceAula(
    pessoa: PessoaDashboard,
    aula: AulaDashboard,
    base: BaseDashboard
  ) {
    const chave =
      DashboardService
        .chavePessoaTrimestre(
          pessoa.id,
          aula.trimestre_id
        );

    const matriculas =
      base
        .matriculasPorPessoaTrimestre
        .get(chave) ?? [];

    if (matriculas.length > 0) {
      const vigentes =
        matriculas.filter(
          (matricula) =>
            DashboardService
              .matriculaVigenteNaData(
                matricula,
                aula.data
              )
        );

      if (!aula.classe_id) {
        return vigentes.length > 0;
      }

      return vigentes.some(
        (matricula) =>
          matricula.classe_id ===
          aula.classe_id
      );
    }

    // Fallback controlado para trimestres legados.
    if (
      !DashboardService
        .alunoAtualValido(pessoa)
    ) {
      return false;
    }

    if (!aula.classe_id) {
      return true;
    }

    return (
      pessoa.classe_id ===
      aula.classe_id
    );
  }

  private static async carregarBase(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<BaseDashboard> {
    const hoje =
      DashboardService.dataHoje();

    const [
      pessoasResult,
      classesResult,
    ] =
      await Promise.all([
        supabase
          .schema("ebd")
          .from("pessoas")
          .select(`
            id,
            nome,
            classe_id,
            perfil,
            ativo,
            status
          `)
          .eq(
            "igreja_id",
            igrejaId
          ),

        supabase
          .schema("ebd")
          .from("classes")
          .select(`
            id,
            nome,
            ativa
          `)
          .eq(
            "igreja_id",
            igrejaId
          )
          .order(
            "nome"
          ),
      ]);

    if (pessoasResult.error) {
      throw pessoasResult.error;
    }

    if (classesResult.error) {
      throw classesResult.error;
    }

    let aulasQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(`
          id,
          trimestre_id,
          classe_id,
          numero,
          titulo,
          data,
          professor_id,

          trimestre:trimestres!aulas_trimestre_id_fkey!inner (
            igreja_id
          )
        `)
        .eq(
          "trimestre.igreja_id",
          igrejaId
        )
        .eq(
          "cancelada",
          false
        );

    if (trimestreId) {
      aulasQuery =
        aulasQuery.eq(
          "trimestre_id",
          trimestreId
        );
    }

    const aulasResult =
      await aulasQuery;

    if (aulasResult.error) {
      throw aulasResult.error;
    }

    const pessoas =
      (pessoasResult.data ?? []) as PessoaDashboard[];

    const classes =
      (classesResult.data ?? []) as ClasseDashboard[];

    const aulas =
      (aulasResult.data ?? []) as unknown as AulaDashboard[];

    const idsTrimestres =
      [
        ...new Set(
          aulas.map(
            (aula) =>
              aula.trimestre_id
          )
        ),
      ];

    const idsAulas =
      aulas.map(
        (aula) =>
          aula.id
      );

    let matriculas:
      MatriculaDashboard[] = [];

    if (idsTrimestres.length > 0) {
      const matriculasResult =
        await supabase
          .schema("ebd")
          .from("matriculas_classes")
          .select(`
            pessoa_id,
            classe_id,
            trimestre_id,
            inicio_em,
            fim_em
          `)
          .eq(
            "igreja_id",
            igrejaId
          )
          .in(
            "trimestre_id",
            idsTrimestres
          );

      if (matriculasResult.error) {
        throw matriculasResult.error;
      }

      matriculas =
        (matriculasResult.data ?? []) as MatriculaDashboard[];
    }

    let presencas:
      PresencaDashboard[] = [];

    if (idsAulas.length > 0) {
      const presencasResult =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select(`
            id,
            pessoa_id,
            aula_id,
            data,
            tipo_registro,
            criado_em
          `)
          .in(
            "aula_id",
            idsAulas
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          );

      if (presencasResult.error) {
        throw presencasResult.error;
      }

      presencas =
        (presencasResult.data ?? []) as PresencaDashboard[];
    }

    const matriculasPorPessoaTrimestre =
      new Map<
        string,
        MatriculaDashboard[]
      >();

    for (
      const matricula of
      matriculas
    ) {
      const chave =
        DashboardService
          .chavePessoaTrimestre(
            matricula.pessoa_id,
            matricula.trimestre_id
          );

      const existentes =
        matriculasPorPessoaTrimestre
          .get(chave) ?? [];

      existentes.push(
        matricula
      );

      matriculasPorPessoaTrimestre
        .set(
          chave,
          existentes
        );
    }

    for (
      const registros of
      matriculasPorPessoaTrimestre.values()
    ) {
      registros.sort(
        (a, b) =>
          a.inicio_em.localeCompare(
            b.inicio_em
          )
      );
    }

    /*
     * Se por qualquer motivo existir duplicidade histórica
     * na tabela de presença, uma pessoa conta somente
     * uma vez por aula.
     */
    const presencasPorPessoaAula =
      new Map<
        string,
        PresencaDashboard
      >();

    const presencasOrdenadas =
      [...presencas].sort(
        (a, b) => {
          const porData =
            a.data.localeCompare(
              b.data
            );

          if (porData !== 0) {
            return porData;
          }

          return a.criado_em
            .localeCompare(
              b.criado_em
            );
        }
      );

    for (
      const presenca of
      presencasOrdenadas
    ) {
      if (
        !presenca.pessoa_id ||
        !presenca.aula_id
      ) {
        continue;
      }

      const chave =
        DashboardService
          .chavePessoaAula(
            presenca.pessoa_id,
            presenca.aula_id
          );

      if (
        !presencasPorPessoaAula
          .has(chave)
      ) {
        presencasPorPessoaAula
          .set(
            chave,
            presenca
          );
      }
    }

    return {
      hoje,
      pessoas,
      classes,
      aulas,
      matriculas,
      presencas,
      matriculasPorPessoaTrimestre,
      presencasPorPessoaAula,
    };
  }

  private static aulasRealizadas(
    base: BaseDashboard
  ) {
    return base.aulas.filter(
      (aula) =>
        aula.data < base.hoje
    );
  }

  private static presencaValidaParaAula(
    pessoa: PessoaDashboard,
    aula: AulaDashboard,
    base: BaseDashboard
  ) {
    if (
      !DashboardService
        .pessoaPertenceAula(
          pessoa,
          aula,
          base
        )
    ) {
      return false;
    }

    return base
      .presencasPorPessoaAula
      .has(
        DashboardService
          .chavePessoaAula(
            pessoa.id,
            aula.id
          )
      );
  }

  // =====================================================
  // RESUMO
  // =====================================================

  static async carregarResumo(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<DashboardResumo> {
    const base =
      await DashboardService
        .carregarBase(
          igrejaId,
          trimestreId
        );

    const pessoasAtivas =
      base.pessoas.filter(
        (pessoa) =>
          pessoa.ativo === true
      );

    const alunosAtuais =
      base.pessoas.filter(
        (pessoa) =>
          DashboardService
            .alunoAtualValido(
              pessoa
            )
      );

    const professoresAtivos =
      base.pessoas.filter(
        (pessoa) =>
          pessoa.ativo === true &&
          pessoa.status === "ATIVO" &&
          pessoa.perfil === "PROFESSOR"
      );

    const classesAtivas =
      base.classes.filter(
        (classe) =>
          classe.ativa === true
      );

    const realizadas =
      DashboardService
        .aulasRealizadas(base);

    let totalEsperado =
      0;

    let totalPresencas =
      0;

    for (
      const aula of
      realizadas
    ) {
      for (
        const pessoa of
        base.pessoas
      ) {
        if (
          !DashboardService
            .pessoaPertenceAula(
              pessoa,
              aula,
              base
            )
        ) {
          continue;
        }

        totalEsperado++;

        if (
          DashboardService
            .presencaValidaParaAula(
              pessoa,
              aula,
              base
            )
        ) {
          totalPresencas++;
        }
      }
    }

    const frequencia =
      totalEsperado > 0
        ? Math.min(
            100,
            Math.round(
              (
                totalPresencas /
                totalEsperado
              ) * 100
            )
          )
        : 0;

    const aulasSemProfessor =
      base.aulas.filter(
        (aula) =>
          aula.professor_id === null &&
          aula.data >= base.hoje
      ).length;

    const proximaAulaData =
      [...base.aulas]
        .filter(
          (aula) =>
            aula.data >=
            base.hoje
        )
        .sort(
          (a, b) => {
            const data =
              a.data.localeCompare(
                b.data
              );

            if (data !== 0) {
              return data;
            }

            return (
              (a.numero ?? 0) -
              (b.numero ?? 0)
            );
          }
        )[0] ?? null;

    const pessoasMap =
      new Map(
        base.pessoas.map(
          (pessoa) => [
            pessoa.id,
            pessoa.nome,
          ]
        )
      );

    const aulasMap =
      new Map(
        base.aulas.map(
          (aula) => [
            aula.id,
            aula,
          ]
        )
      );

    const presencasValidas =
      [
        ...base
          .presencasPorPessoaAula
          .values(),
      ]
        .filter(
          (presenca) => {
            if (
              !presenca.pessoa_id ||
              !presenca.aula_id
            ) {
              return false;
            }

            const pessoa =
              base.pessoas.find(
                (item) =>
                  item.id ===
                  presenca.pessoa_id
              );

            const aula =
              aulasMap.get(
                presenca.aula_id
              );

            if (
              !pessoa ||
              !aula
            ) {
              return false;
            }

            return DashboardService
              .pessoaPertenceAula(
                pessoa,
                aula,
                base
              );
          }
        )
        .sort(
          (a, b) => {
            const data =
              b.data.localeCompare(
                a.data
              );

            if (data !== 0) {
              return data;
            }

            return b.criado_em
              .localeCompare(
                a.criado_em
              );
          }
        );

    const frequenciaRecente =
      presencasValidas
        .slice(0, 10)
        .map(
          (registro) => ({
            id:
              registro.id,

            data:
              registro.data,

            pessoa:
              registro.pessoa_id
                ? pessoasMap.get(
                    registro.pessoa_id
                  ) ??
                  "Pessoa não identificada"
                : "Pessoa não identificada",

            tipo:
              registro.tipo_registro ??
              "Presença",
          })
        );

    let proximaAula:
      DashboardResumo["proximaAula"] =
      null;

    if (proximaAulaData) {
      const professor =
        proximaAulaData.professor_id
          ? pessoasMap.get(
              proximaAulaData.professor_id
            ) ??
            "Professor não informado"
          : "Professor não informado";

      proximaAula = {
        id:
          proximaAulaData.id,

        numero:
          proximaAulaData.numero,

        titulo:
          proximaAulaData.titulo,

        data:
          proximaAulaData.data,

        professor,
      };
    }

    return {
      alunos:
        alunosAtuais.length,

      professores:
        professoresAtivos.length,

      pessoas:
        pessoasAtivas.length,

      aulas:
        base.aulas.length,

      presencas:
        presencasValidas.length,

      classes:
        classesAtivas.length,

      frequencia,

      frequenciaRecente,

      proximaAula,

      ultimaPresenca:
        presencasValidas[0]?.data ??
        null,

      aulasSemProfessor,
    };
  }

  // =====================================================
  // TRIMESTRES
  // =====================================================

  static async listarTrimestres(
    igrejaId: string
  ): Promise<DashboardTrimestre[]> {
    const {
      data,
      error,
    } =
      await supabase
        .schema("ebd")
        .from("trimestres")
        .select(`
          id,
          numero,
          ano,
          tema,
          ativo
        `)
        .eq(
          "igreja_id",
          igrejaId
        )
        .order(
          "ano",
          {
            ascending: false,
          }
        )
        .order(
          "numero",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    return (
      data ?? []
    ) as DashboardTrimestre[];
  }

  // =====================================================
  // ANÁLISE GERAL
  // =====================================================

  static async carregarAnalise(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<DashboardAnalise> {
    const base =
      await DashboardService
        .carregarBase(
          igrejaId,
          trimestreId
        );

    const aulasRealizadas =
      DashboardService
        .aulasRealizadas(base);

    const desempenho =
      new Map<
        string,
        {
          id: string;
          nome: string;
          esperado: number;
          presencas: number;
        }
      >();

    for (
      const aula of
      aulasRealizadas
    ) {
      for (
        const pessoa of
        base.pessoas
      ) {
        if (
          !DashboardService
            .pessoaPertenceAula(
              pessoa,
              aula,
              base
            )
        ) {
          continue;
        }

        if (
          !desempenho.has(
            pessoa.id
          )
        ) {
          desempenho.set(
            pessoa.id,
            {
              id:
                pessoa.id,

              nome:
                pessoa.nome,

              esperado:
                0,

              presencas:
                0,
            }
          );
        }

        const item =
          desempenho.get(
            pessoa.id
          )!;

        item.esperado++;

        if (
          DashboardService
            .presencaValidaParaAula(
              pessoa,
              aula,
              base
            )
        ) {
          item.presencas++;
        }
      }
    }

    const desempenhos =
      [
        ...desempenho
          .values(),
      ]
        .filter(
          (item) =>
            item.esperado > 0
        )
        .map(
          (item) => {
            const frequencia =
              Math.min(
                100,
                Math.round(
                  (
                    item.presencas /
                    item.esperado
                  ) * 100
                )
              );

            return {
              id:
                item.id,

              nome:
                item.nome,

              frequencia,

              presencas:
                item.presencas,

              aulasEsperadas:
                item.esperado,
            };
          }
        );

    const alunosAssiduos =
      desempenhos.filter(
        (item) =>
          item.frequencia >= 75
      ).length;

    const alunosSemParticipacao =
      desempenhos.filter(
        (item) =>
          item.presencas === 0
      ).length;

    const alunosAtencao =
      desempenhos.filter(
        (item) =>
          item.presencas > 0 &&
          item.frequencia < 50
      ).length;

    const alunosCriticos =
      desempenhos
        .filter(
          (item) =>
            item.frequencia < 50
        )
        .sort(
          (a, b) =>
            a.frequencia -
            b.frequencia
        )
        .slice(0, 10);

    const totalEsperado =
      desempenhos.reduce(
        (
          total,
          item
        ) =>
          total +
          item.aulasEsperadas,
        0
      );

    const totalPresencas =
      desempenhos.reduce(
        (
          total,
          item
        ) =>
          total +
          item.presencas,
        0
      );

    const frequenciaMedia =
      totalEsperado > 0
        ? Math.min(
            100,
            Math.round(
              (
                totalPresencas /
                totalEsperado
              ) * 100
            )
          )
        : 0;

    const mediaAlunosPorAula =
      aulasRealizadas.length > 0
        ? Math.round(
            (
              totalPresencas /
              aulasRealizadas.length
            ) * 10
          ) / 10
        : 0;

    const totalAulasPeriodo =
      base.aulas.length;

    const aulasComProfessor =
      base.aulas.filter(
        (aula) =>
          !!aula.professor_id
      ).length;

    const coberturaProfessores =
      totalAulasPeriodo > 0
        ? Math.round(
            (
              aulasComProfessor /
              totalAulasPeriodo
            ) * 100
          )
        : 0;

    let trimestreAnterior:
      DashboardAnalise["trimestreAnterior"] =
      null;

    let evolucaoPontosPercentuais:
      number | null =
      null;

    if (trimestreId) {
      const trimestres =
        [
          ...await DashboardService
            .listarTrimestres(
              igrejaId
            ),
        ]
          .sort(
            (a, b) =>
              a.ano - b.ano ||
              a.numero - b.numero
          );

      const indiceAtual =
        trimestres.findIndex(
          (item) =>
            item.id ===
            trimestreId
        );

      if (indiceAtual > 0) {
        const anterior =
          trimestres[
            indiceAtual - 1
          ];

        const resumoAnterior =
          await DashboardService
            .carregarResumo(
              igrejaId,
              anterior.id
            );

        trimestreAnterior = {
          id:
            anterior.id,

          numero:
            anterior.numero,

          ano:
            anterior.ano,

          tema:
            anterior.tema,

          frequencia:
            resumoAnterior.frequencia,
        };

        evolucaoPontosPercentuais =
          frequenciaMedia -
          resumoAnterior.frequencia;
      }
    }

    return {
      aulasRealizadas:
        aulasRealizadas.length,

      frequenciaMedia,

      alunosAssiduos,

      alunosAtencao,

      alunosSemParticipacao,

      mediaAlunosPorAula,

      coberturaProfessores,

      evolucaoPontosPercentuais,

      trimestreAnterior,

      alunosCriticos,
    };
  }

  // =====================================================
  // EVOLUÇÃO DA IGREJA
  // =====================================================

  static async carregarEvolucaoTrimestres(
    igrejaId: string
  ): Promise<DashboardEvolucaoTrimestre[]> {
    const trimestres =
      await DashboardService
        .listarTrimestres(
          igrejaId
        );

    const ordemCronologica =
      [...trimestres]
        .sort(
          (a, b) =>
            a.ano - b.ano ||
            a.numero - b.numero
        );

    return Promise.all(
      ordemCronologica.map(
        async (trimestre) => {
          const resumo =
            await DashboardService
              .carregarResumo(
                igrejaId,
                trimestre.id
              );

          return {
            id:
              trimestre.id,

            numero:
              trimestre.numero,

            ano:
              trimestre.ano,

            tema:
              trimestre.tema,

            ativo:
              trimestre.ativo,

            frequencia:
              resumo.frequencia,
          };
        }
      )
    );
  }

  // =====================================================
  // DESEMPENHO POR CLASSE
  // =====================================================

  static async carregarDesempenhoClasses(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<DashboardDesempenhoClasse[]> {
    const base =
      await DashboardService
        .carregarBase(
          igrejaId,
          trimestreId
        );

    const realizadas =
      DashboardService
        .aulasRealizadas(base);

    const classesVisiveis =
      base.classes.filter(
        (classe) =>
          classe.ativa === true ||
          realizadas.some(
            (aula) =>
              aula.classe_id ===
              classe.id
          )
      );

    return classesVisiveis.map(
      (classe) => {
        const aulasClasse =
          realizadas.filter(
            (aula) =>
              aula.classe_id ===
              classe.id
          );

        const desempenho =
          new Map<
            string,
            {
              esperado: number;
              presencas: number;
            }
          >();

        for (
          const aula of
          aulasClasse
        ) {
          for (
            const pessoa of
            base.pessoas
          ) {
            if (
              !DashboardService
                .pessoaPertenceAula(
                  pessoa,
                  aula,
                  base
                )
            ) {
              continue;
            }

            if (
              !desempenho.has(
                pessoa.id
              )
            ) {
              desempenho.set(
                pessoa.id,
                {
                  esperado:
                    0,

                  presencas:
                    0,
                }
              );
            }

            const item =
              desempenho.get(
                pessoa.id
              )!;

            item.esperado++;

            if (
              DashboardService
                .presencaValidaParaAula(
                  pessoa,
                  aula,
                  base
                )
            ) {
              item.presencas++;
            }
          }
        }

        let totalEsperado =
          0;

        let totalPresencas =
          0;

        let alunosAssiduos =
          0;

        let alunosAtencao =
          0;

        let alunosSemParticipacao =
          0;

        for (
          const item of
          desempenho.values()
        ) {
          totalEsperado +=
            item.esperado;

          totalPresencas +=
            item.presencas;

          if (
            item.esperado <= 0
          ) {
            continue;
          }

          const frequencia =
            Math.min(
              100,
              Math.round(
                (
                  item.presencas /
                  item.esperado
                ) * 100
              )
            );

          if (
            item.presencas === 0
          ) {
            alunosSemParticipacao++;
          } else if (
            frequencia < 50
          ) {
            alunosAtencao++;
          }

          if (
            frequencia >= 75
          ) {
            alunosAssiduos++;
          }
        }

        const frequencia =
          totalEsperado > 0
            ? Math.min(
                100,
                Math.round(
                  (
                    totalPresencas /
                    totalEsperado
                  ) * 100
                )
              )
            : 0;

        const mediaAlunosPorAula =
          aulasClasse.length > 0
            ? Math.round(
                (
                  totalPresencas /
                  aulasClasse.length
                ) * 10
              ) / 10
            : 0;

        return {
          id:
            classe.id,

          nome:
            classe.nome,

          alunos:
            desempenho.size,

          aulasRealizadas:
            aulasClasse.length,

          frequencia,

          mediaAlunosPorAula,

          alunosAssiduos,

          alunosAtencao,

          alunosSemParticipacao,
        };
      }
    );
  }

  // =====================================================
  // ALUNOS PARA O DASHBOARD INDIVIDUAL
  // =====================================================

  static async listarAlunosDashboard(
    igrejaId: string
  ): Promise<DashboardAlunoOpcao[]> {
    const {
      data: alunos,
      error: alunosError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select(`
          id,
          nome,
          classe_id
        `)
        .eq(
          "igreja_id",
          igrejaId
        )
        .eq(
          "ativo",
          true
        )
        .eq(
          "status",
          "ATIVO"
        )
        .eq(
          "perfil",
          "ALUNO"
        )
        .order(
          "nome"
        );

    if (alunosError) {
      throw alunosError;
    }

    const idsClasses =
      [
        ...new Set(
          (alunos ?? [])
            .map(
              (aluno) =>
                aluno.classe_id
            )
            .filter(
              (
                id
              ): id is string =>
                !!id
            )
        ),
      ];

    let classesMap =
      new Map<
        string,
        string
      >();

    if (idsClasses.length > 0) {
      const {
        data: classes,
        error: classesError,
      } =
        await supabase
          .schema("ebd")
          .from("classes")
          .select(`
            id,
            nome
          `)
          .eq(
            "igreja_id",
            igrejaId
          )
          .in(
            "id",
            idsClasses
          );

      if (classesError) {
        throw classesError;
      }

      classesMap =
        new Map(
          (classes ?? []).map(
            (classe) => [
              classe.id,
              classe.nome,
            ]
          )
        );
    }

    return (
      alunos ?? []
    ).map(
      (aluno) => ({
        id:
          aluno.id,

        nome:
          aluno.nome,

        classeId:
          aluno.classe_id,

        classeNome:
          aluno.classe_id
            ? classesMap.get(
                aluno.classe_id
              ) ??
              "Classe não identificada"
            : "Sem classe",
      })
    );
  }

  // =====================================================
  // DESEMPENHO INDIVIDUAL
  // =====================================================

  static async carregarDesempenhoIndividual(
    igrejaId: string,
    alunoId: string,
    trimestreId: string | null = null
  ): Promise<DashboardDesempenhoIndividual> {
    const base =
      await DashboardService
        .carregarBase(
          igrejaId,
          trimestreId
        );

    const aluno =
      base.pessoas.find(
        (pessoa) =>
          pessoa.id ===
          alunoId
      );

    if (
      !aluno ||
      !DashboardService
        .alunoAtualValido(
          aluno
        )
    ) {
      throw new Error(
        "Aluno não encontrado."
      );
    }

    const classesMap =
      new Map(
        base.classes.map(
          (classe) => [
            classe.id,
            classe.nome,
          ]
        )
      );

    let classeIdExibicao:
      string | null =
      aluno.classe_id;

    let classeNome =
      aluno.classe_id
        ? classesMap.get(
            aluno.classe_id
          ) ??
          "Classe não identificada"
        : "Sem classe";

    /*
     * Quando um trimestre específico é selecionado,
     * exibimos a trajetória real de classe daquele
     * aluno no período.
     */
    if (trimestreId) {
      const matriculas =
        base
          .matriculasPorPessoaTrimestre
          .get(
            DashboardService
              .chavePessoaTrimestre(
                aluno.id,
                trimestreId
              )
          ) ?? [];

      if (matriculas.length > 0) {
        const idsClassesHistoricas =
          [
            ...new Set(
              [...matriculas]
                .sort(
                  (a, b) =>
                    a.inicio_em
                      .localeCompare(
                        b.inicio_em
                      )
                )
                .map(
                  (matricula) =>
                    matricula.classe_id
                )
            ),
          ];

        classeIdExibicao =
          idsClassesHistoricas[
            idsClassesHistoricas.length -
            1
          ] ?? null;

        const nomes =
          idsClassesHistoricas.map(
            (classeId) =>
              classesMap.get(
                classeId
              ) ??
              "Classe não identificada"
          );

        classeNome =
          nomes.join(
            " → "
          );
      }
    }

    const aulasAluno =
      DashboardService
        .aulasRealizadas(base)
        .filter(
          (aula) =>
            DashboardService
              .pessoaPertenceAula(
                aluno,
                aula,
                base
              )
        )
        .sort(
          (a, b) =>
            a.data.localeCompare(
              b.data
            ) ||
            (a.numero ?? 0) -
            (b.numero ?? 0)
        );

    const presencasMap =
      new Map<
        string,
        string | null
      >();

    for (
      const aula of
      aulasAluno
    ) {
      const registro =
        base
          .presencasPorPessoaAula
          .get(
            DashboardService
              .chavePessoaAula(
                aluno.id,
                aula.id
              )
          );

      if (registro) {
        presencasMap.set(
          aula.id,
          registro.tipo_registro
        );
      }
    }

    const aulasEsperadas =
      aulasAluno.length;

    const totalPresencas =
      presencasMap.size;

    const faltas =
      Math.max(
        0,
        aulasEsperadas -
        totalPresencas
      );

    const frequencia =
      aulasEsperadas > 0
        ? Math.min(
            100,
            Math.round(
              (
                totalPresencas /
                aulasEsperadas
              ) * 100
            )
          )
        : 0;

    /*
     * A média da classe também é histórica.
     *
     * Para cada aula do aluno, o denominador é composto
     * somente pelas pessoas que pertenciam àquela classe
     * naquela data.
     */
    let totalEsperadoClasse =
      0;

    let totalPresencasClasse =
      0;

    for (
      const aula of
      aulasAluno
    ) {
      for (
        const pessoa of
        base.pessoas
      ) {
        if (
          !DashboardService
            .pessoaPertenceAula(
              pessoa,
              aula,
              base
            )
        ) {
          continue;
        }

        totalEsperadoClasse++;

        if (
          DashboardService
            .presencaValidaParaAula(
              pessoa,
              aula,
              base
            )
        ) {
          totalPresencasClasse++;
        }
      }
    }

    const mediaClasse =
      totalEsperadoClasse > 0
        ? Math.min(
            100,
            Math.round(
              (
                totalPresencasClasse /
                totalEsperadoClasse
              ) * 100
            )
          )
        : 0;

    const diferencaMediaClasse =
      aulasEsperadas > 0
        ? frequencia -
          mediaClasse
        : null;

    let sequenciaAtual =
      0;

    for (
      const aula of
      [...aulasAluno].reverse()
    ) {
      if (
        presencasMap.has(
          aula.id
        )
      ) {
        sequenciaAtual++;
      } else {
        break;
      }
    }

    const historico =
      [...aulasAluno]
        .reverse()
        .map(
          (aula) => ({
            aulaId:
              aula.id,

            numero:
              aula.numero,

            titulo:
              aula.titulo,

            data:
              aula.data,

            presente:
              presencasMap.has(
                aula.id
              ),

            tipoRegistro:
              presencasMap.get(
                aula.id
              ) ??
              null,
          })
        );

    return {
      aluno: {
        id:
          aluno.id,

        nome:
          aluno.nome,

        classeId:
          classeIdExibicao,

        classeNome,
      },

      frequencia,

      presencas:
        totalPresencas,

      faltas,

      aulasEsperadas,

      mediaClasse,

      diferencaMediaClasse,

      sequenciaAtual,

      historico,
    };
  }

  // =====================================================
  // EVOLUÇÃO INDIVIDUAL
  // =====================================================

  static async carregarEvolucaoAlunoTrimestres(
    igrejaId: string,
    alunoId: string
  ): Promise<DashboardEvolucaoAlunoTrimestre[]> {
    const trimestres =
      await DashboardService
        .listarTrimestres(
          igrejaId
        );

    const ordemCronologica =
      [...trimestres]
        .sort(
          (a, b) =>
            a.ano - b.ano ||
            a.numero - b.numero
        );

    const resultados =
      await Promise.all(
        ordemCronologica.map(
          async (trimestre) => {
            const desempenho =
              await DashboardService
                .carregarDesempenhoIndividual(
                  igrejaId,
                  alunoId,
                  trimestre.id
                );

            return {
              id:
                trimestre.id,

              numero:
                trimestre.numero,

              ano:
                trimestre.ano,

              tema:
                trimestre.tema,

              ativo:
                trimestre.ativo,

              frequencia:
                desempenho.frequencia,

              presencas:
                desempenho.presencas,

              faltas:
                desempenho.faltas,

              aulasEsperadas:
                desempenho.aulasEsperadas,
            };
          }
        )
      );

    return resultados.filter(
      (item) =>
        item.aulasEsperadas > 0
    );
  }
}
