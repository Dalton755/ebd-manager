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

  evolucaoPontosPercentuais:
  number | null;

  trimestreAnterior: {
    id: string;
    numero: number;
    ano: number;
    tema: string;
    frequencia: number;
  } | null;

  alunosCriticos:
  DashboardAlunoAtencao[];
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

export class DashboardService {

  static async carregarResumo(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<DashboardResumo> {

    // =====================================================
    // DATA ATUAL
    // =====================================================

    const hoje =
      new Date()
        .toISOString()
        .split("T")[0];


    // =====================================================
    // PESSOAS ATIVAS
    // =====================================================

    const {
      count: pessoas,
      error: pessoasError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("ativo", true)
        .eq("igreja_id", igrejaId);

    if (pessoasError) {
      throw pessoasError;
    }


    // =====================================================
    // ALUNOS ATIVOS
    // =====================================================

    const {
      data: alunosData,
      count: alunos,
      error: alunosError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select(
          `
        id,
        classe_id
      `,
          {
            count: "exact",
          }
        )
        .eq("ativo", true)
        .eq("status", "ATIVO")
        .eq("perfil", "ALUNO")
        .eq("igreja_id", igrejaId);

    if (alunosError) {
      throw alunosError;
    }


    // =====================================================
    // PROFESSORES ATIVOS
    // =====================================================

    const {
      count: professores,
      error: professoresError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("ativo", true)
        .eq("status", "ATIVO")
        .eq("perfil", "PROFESSOR")
        .eq("igreja_id", igrejaId);

    if (professoresError) {
      throw professoresError;
    }


    // =====================================================
    // CLASSES ATIVAS
    // =====================================================

    const {
      count: classes,
      error: classesError,
    } =
      await supabase
        .schema("ebd")
        .from("classes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("ativa", true)
        .eq("igreja_id", igrejaId);

    if (classesError) {
      throw classesError;
    }


    // =====================================================
    // AULAS
    // =====================================================

    let aulasQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(
          `
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
      `,
          {
            count: "exact",
          }
        )
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

    const {
      data: aulasData,
      count: aulas,
      error: aulasError,
    } = await aulasQuery;

    if (aulasError) {
      throw aulasError;
    }

    const idsAulasIgreja =
      (aulasData ?? []).map(
        (aula) => aula.id
      );



    // =====================================================
    // AULAS JÁ REALIZADAS
    // =====================================================

    const aulasRealizadas =
      (aulasData ?? []).filter(
        (aula) =>
          aula.data < hoje
      );

    const idsAulasRealizadas =
      aulasRealizadas.map(
        (aula) => aula.id
      );






    // =====================================================
    // PRESENÇAS
    // =====================================================

    let presencas = 0;

    if (idsAulasIgreja.length > 0) {

      const {
        count,
        error: presencasError,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select("*", {
            count: "exact",
            head: true,
          })
          .in(
            "aula_id",
            idsAulasIgreja
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          );

      if (presencasError) {
        throw presencasError;
      }

      presencas = count ?? 0;
    }


    // =====================================================
    // FREQUÊNCIA REAL
    // =====================================================

    let frequencia = 0;

    const totalAlunos =
      alunos ?? 0;

    /*
     * Alunos ativos por classe.
     *
     * Isso evita que uma aula de Adultos, por exemplo,
     * considere alunos de Jovens no total esperado.
     */
    const alunosPorClasse =
      new Map<string, Set<string>>();

    const todosAlunos =
      new Set<string>();

    for (const aluno of alunosData ?? []) {

      todosAlunos.add(
        aluno.id
      );

      if (!aluno.classe_id) {
        continue;
      }

      if (
        !alunosPorClasse.has(
          aluno.classe_id
        )
      ) {
        alunosPorClasse.set(
          aluno.classe_id,
          new Set<string>()
        );
      }

      alunosPorClasse
        .get(aluno.classe_id)
        ?.add(aluno.id);
    }


    /*
     * Calcula quantas presenças seriam esperadas
     * considerando a classe de cada aula.
     */
    let totalEsperado = 0;

    for (
      const aula of aulasRealizadas
    ) {

      if (aula.classe_id) {

        totalEsperado +=
          alunosPorClasse
            .get(aula.classe_id)
            ?.size ?? 0;

      } else {

        /*
         * Compatibilidade com alguma aula antiga
         * que ainda não possua classe.
         */
        totalEsperado +=
          totalAlunos;
      }
    }


    if (
      totalEsperado > 0 &&
      idsAulasRealizadas.length > 0
    ) {

      const {
        data: presencasRealizadas,
        error: presencasRealizadasError,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select(`
        pessoa_id,
        aula_id
      `)
          .in(
            "aula_id",
            idsAulasRealizadas
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          );

      if (
        presencasRealizadasError
      ) {
        throw presencasRealizadasError;
      }


      const aulasMap =
        new Map(
          aulasRealizadas.map(
            (aula) => [
              aula.id,
              aula,
            ]
          )
        );


      const presencasValidas =
        (
          presencasRealizadas ?? []
        ).filter(
          (presenca) => {

            if (
              !presenca.pessoa_id ||
              !presenca.aula_id
            ) {
              return false;
            }

            /*
             * Só aluno ativo entra na frequência.
             */
            if (
              !todosAlunos.has(
                presenca.pessoa_id
              )
            ) {
              return false;
            }

            const aula =
              aulasMap.get(
                presenca.aula_id
              );

            if (!aula) {
              return false;
            }

            /*
             * Aula antiga sem classe:
             * aceita qualquer aluno ativo.
             */
            if (!aula.classe_id) {
              return true;
            }

            /*
             * Aula com classe:
             * presença só conta se o aluno
             * pertence àquela classe.
             */
            return (
              alunosPorClasse
                .get(aula.classe_id)
                ?.has(
                  presenca.pessoa_id
                ) ?? false
            );
          }
        );


      frequencia =
        Math.min(
          100,
          Math.round(
            (
              presencasValidas.length /
              totalEsperado
            ) * 100
          )
        );
    }

    // =====================================================
    // AULAS SEM PROFESSOR
    // =====================================================

    let aulasSemProfessorQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(
          `
        id,

        trimestre:trimestres!aulas_trimestre_id_fkey!inner (
          igreja_id
        )
      `,
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "trimestre.igreja_id",
          igrejaId
        )
        .eq(
          "cancelada",
          false
        )
        .is(
          "professor_id",
          null
        )
        .gte(
          "data",
          hoje
        );

    if (trimestreId) {
      aulasSemProfessorQuery =
        aulasSemProfessorQuery.eq(
          "trimestre_id",
          trimestreId
        );
    }

    const {
      count: aulasSemProfessor,
      error: aulasSemProfessorError,
    } = await aulasSemProfessorQuery;

    if (aulasSemProfessorError) {
      throw aulasSemProfessorError;
    }


    // =====================================================
    // PRÓXIMA AULA
    // =====================================================

    let proximaAulaQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(`
      id,
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
        )
        .gte(
          "data",
          hoje
        );

    if (trimestreId) {
      proximaAulaQuery =
        proximaAulaQuery.eq(
          "trimestre_id",
          trimestreId
        );
    }

    const {
      data: proximaAulaData,
      error: proximaAulaError,
    } =
      await proximaAulaQuery
        .order(
          "data",
          {
            ascending: true,
          }
        )
        .order(
          "numero",
          {
            ascending: true,
          }
        )
        .limit(1)
        .maybeSingle();

    if (proximaAulaError) {
      throw proximaAulaError;
    }


    let proximaAula = null;


    if (proximaAulaData) {

      let professor =
        "Professor não informado";


      if (proximaAulaData.professor_id) {

        const {
          data: professorData,
        } =
          await supabase
            .schema("ebd")
            .from("pessoas")
            .select("nome")
            .eq(
              "id",
              proximaAulaData.professor_id
            )
            .eq(
              "igreja_id",
              igrejaId
            )
            .maybeSingle();


        if (professorData?.nome) {
          professor =
            professorData.nome;
        }
      }


      proximaAula = {

        id:
          proximaAulaData.id,

        numero:
          proximaAulaData.numero ?? null,

        titulo:
          proximaAulaData.titulo,

        data:
          proximaAulaData.data,

        professor,

      };
    }


    // =====================================================
    // ÚLTIMA PRESENÇA
    // =====================================================

    let ultimaPresencaData: {
      data: string;
    } | null = null;

    if (idsAulasIgreja.length > 0) {

      const {
        data,
        error: ultimaPresencaError,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select("data")
          .in(
            "aula_id",
            idsAulasIgreja
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          )
          .order("data", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (ultimaPresencaError) {
        throw ultimaPresencaError;
      }

      ultimaPresencaData =
        data;
    }

    // =====================================================
    // FREQUÊNCIA RECENTE
    // =====================================================

    let frequenciaRecenteData: {
      id: string;
      data: string;
      pessoa_id: string | null;
      tipo_registro: string | null;
      aula_id: string;
      criado_em: string;
    }[] = [];

    if (idsAulasIgreja.length > 0) {

      const {
        data,
        error: frequenciaRecenteError,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select(`
            id,
            data,
            pessoa_id,
            tipo_registro,
            aula_id,
            criado_em
          `)
          .in(
            "aula_id",
            idsAulasIgreja
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          )
          .order("data", {
            ascending: false,
          })
          .order("criado_em", {
            ascending: false,
          })
          .limit(10);

      if (frequenciaRecenteError) {
        throw frequenciaRecenteError;
      }

      frequenciaRecenteData =
        data ?? [];
    }

    const idsPessoas =
      [
        ...new Set(
          (frequenciaRecenteData ?? [])
            .map((registro) => registro.pessoa_id)
            .filter(Boolean)
        ),
      ];

    let pessoasMap =
      new Map<string, string>();

    if (idsPessoas.length > 0) {

      const {
        data: pessoasData,
        error: pessoasRecentesError,
      } =
        await supabase
          .schema("ebd")
          .from("pessoas")
          .select("id, nome")
          .in("id", idsPessoas);

      if (pessoasRecentesError) {
        throw pessoasRecentesError;
      }

      pessoasMap =
        new Map(
          (pessoasData ?? []).map(
            (pessoa) => [
              pessoa.id,
              pessoa.nome,
            ]
          )
        );
    }

    const frequenciaRecente =
      (frequenciaRecenteData ?? []).map(
        (registro) => ({
          id: registro.id,

          data:
            registro.data,

          pessoa:
            registro.pessoa_id
              ? pessoasMap.get(registro.pessoa_id) ??
              "Pessoa não identificada"
              : "Pessoa não identificada",

          tipo:
            registro.tipo_registro ??
            "Presença",
        })
      );


    // =====================================================
    // RETORNO
    // =====================================================

    return {

      alunos:
        totalAlunos,

      professores:
        professores ?? 0,

      pessoas:
        pessoas ?? 0,

      aulas:
        aulas ?? 0,

      presencas:
        presencas ?? 0,

      classes:
        classes ?? 0,

      frequencia,

      frequenciaRecente,

      proximaAula,

      ultimaPresenca:
        ultimaPresencaData?.data ??
        null,

      aulasSemProfessor:
        aulasSemProfessor ?? 0,

    };
  }

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

    return data ?? [];
  }

  static async carregarAnalise(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<DashboardAnalise> {

    const hoje =
      new Date()
        .toISOString()
        .split("T")[0];


    // =====================================================
    // ALUNOS ATIVOS
    // =====================================================

    const {
      data: alunosData,
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
        );

    if (alunosError) {
      throw alunosError;
    }


    // =====================================================
    // AULAS DO PERÍODO
    // =====================================================

    let aulasQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(`
        id,
        trimestre_id,
        classe_id,
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

    const {
      data: aulasData,
      error: aulasError,
    } =
      await aulasQuery;

    if (aulasError) {
      throw aulasError;
    }


    const aulasRealizadas =
      (aulasData ?? []).filter(
        (aula) =>
          aula.data < hoje
      );


    const idsAulasRealizadas =
      aulasRealizadas.map(
        (aula) =>
          aula.id
      );


    // =====================================================
    // MAPA DE ALUNOS
    // =====================================================

    const alunosMap =
      new Map(
        (alunosData ?? []).map(
          (aluno) => [
            aluno.id,
            aluno,
          ]
        )
      );


    const desempenhoAlunos =
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
      const aluno of
      alunosData ?? []
    ) {

      desempenhoAlunos.set(
        aluno.id,
        {
          id:
            aluno.id,

          nome:
            aluno.nome,

          esperado:
            0,

          presencas:
            0,
        }
      );

    }


    // =====================================================
    // AULAS ESPERADAS POR ALUNO
    // =====================================================

    for (
      const aula of
      aulasRealizadas
    ) {

      for (
        const aluno of
        alunosData ?? []
      ) {

        /*
         * Aula antiga sem classe:
         * todos os alunos entram no esperado.
         */
        if (
          !aula.classe_id
        ) {

          const desempenho =
            desempenhoAlunos.get(
              aluno.id
            );

          if (desempenho) {
            desempenho.esperado++;
          }

          continue;
        }


        /*
         * Aula normal:
         * somente alunos da classe.
         */
        if (
          aluno.classe_id ===
          aula.classe_id
        ) {

          const desempenho =
            desempenhoAlunos.get(
              aluno.id
            );

          if (desempenho) {
            desempenho.esperado++;
          }

        }

      }

    }


    // =====================================================
    // PRESENÇAS VALIDADAS
    // =====================================================

    let presencasData: {
      pessoa_id: string | null;
      aula_id: string | null;
    }[] = [];


    if (
      idsAulasRealizadas.length > 0
    ) {

      const {
        data,
        error,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select(`
          pessoa_id,
          aula_id
        `)
          .in(
            "aula_id",
            idsAulasRealizadas
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          );

      if (error) {
        throw error;
      }

      presencasData =
        data ?? [];

    }


    const aulasMap =
      new Map(
        aulasRealizadas.map(
          (aula) => [
            aula.id,
            aula,
          ]
        )
      );


    /*
     * Mesmo que futuramente alguma duplicidade
     * seja inserida por erro, cada aluno conta
     * somente uma vez por aula.
     */
    const presencasUnicas =
      new Set<string>();


    for (
      const presenca of
      presencasData
    ) {

      if (
        !presenca.pessoa_id ||
        !presenca.aula_id
      ) {
        continue;
      }


      const chave =
        `${presenca.pessoa_id}:${presenca.aula_id}`;


      if (
        presencasUnicas.has(
          chave
        )
      ) {
        continue;
      }


      const aluno =
        alunosMap.get(
          presenca.pessoa_id
        );

      const aula =
        aulasMap.get(
          presenca.aula_id
        );


      if (
        !aluno ||
        !aula
      ) {
        continue;
      }


      /*
       * Só conta se aquela presença
       * pertence a uma aula esperada
       * daquele aluno.
       */
      if (
        aula.classe_id &&
        aluno.classe_id !==
        aula.classe_id
      ) {
        continue;
      }


      presencasUnicas.add(
        chave
      );


      const desempenho =
        desempenhoAlunos.get(
          aluno.id
        );


      if (desempenho) {
        desempenho.presencas++;
      }

    }


    // =====================================================
    // INDICADORES INDIVIDUAIS
    // =====================================================

    const desempenhos =
      [
        ...desempenhoAlunos.values(),
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
                  ) *
                  100
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


    /*
     * Alunos com zero presença ficam em
     * uma categoria própria.
     */
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
        .slice(
          0,
          10
        );


    // =====================================================
    // FREQUÊNCIA GERAL
    // =====================================================

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
            ) *
            100
          )
        )
        : 0;


    // =====================================================
    // MÉDIA DE ALUNOS POR AULA
    // =====================================================

    const mediaAlunosPorAula =
      aulasRealizadas.length > 0
        ? Math.round(
          (
            totalPresencas /
            aulasRealizadas.length
          ) *
          10
        ) /
        10
        : 0;


    // =====================================================
    // COBERTURA DE PROFESSORES
    // =====================================================

    const totalAulasPeriodo =
      (aulasData ?? []).length;


    const aulasComProfessor =
      (aulasData ?? []).filter(
        (aula) =>
          !!aula.professor_id
      ).length;


    const coberturaProfessores =
      totalAulasPeriodo > 0
        ? Math.round(
          (
            aulasComProfessor /
            totalAulasPeriodo
          ) *
          100
        )
        : 0;


    // =====================================================
    // COMPARAÇÃO COM TRIMESTRE ANTERIOR
    // =====================================================

    let trimestreAnterior:
      DashboardAnalise["trimestreAnterior"] =
      null;

    let evolucaoPontosPercentuais:
      number | null =
      null;


    if (trimestreId) {

      const {
        data: trimestresData,
        error: trimestresError,
      } =
        await supabase
          .schema("ebd")
          .from("trimestres")
          .select(`
          id,
          numero,
          ano,
          tema
        `)
          .eq(
            "igreja_id",
            igrejaId
          )
          .order(
            "ano",
            {
              ascending: true,
            }
          )
          .order(
            "numero",
            {
              ascending: true,
            }
          );


      if (trimestresError) {
        throw trimestresError;
      }


      const trimestres =
        trimestresData ?? [];


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


    // =====================================================
    // RETORNO
    // =====================================================

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

  static async carregarEvolucaoTrimestres(
    igrejaId: string
  ): Promise<DashboardEvolucaoTrimestre[]> {

    const trimestres =
      await DashboardService
        .listarTrimestres(
          igrejaId
        );


    /*
     * listarTrimestres retorna do mais
     * recente para o mais antigo.
     *
     * Para o gráfico queremos ordem
     * cronológica.
     */
    const ordemCronologica =
      [...trimestres].reverse();


    const resultados =
      await Promise.all(

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


    return resultados;
  }

  static async carregarDesempenhoClasses(
    igrejaId: string,
    trimestreId: string | null = null
  ): Promise<DashboardDesempenhoClasse[]> {

    const hoje =
      new Date()
        .toISOString()
        .split("T")[0];


    // =====================================================
    // CLASSES ATIVAS
    // =====================================================

    const {
      data: classesData,
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
        .eq(
          "ativa",
          true
        )
        .order(
          "nome"
        );

    if (classesError) {
      throw classesError;
    }


    // =====================================================
    // ALUNOS ATIVOS
    // =====================================================

    const {
      data: alunosData,
      error: alunosError,
    } =
      await supabase
        .schema("ebd")
        .from("pessoas")
        .select(`
        id,
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
        );

    if (alunosError) {
      throw alunosError;
    }


    // =====================================================
    // AULAS REALIZADAS
    // =====================================================

    let aulasQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(`
        id,
        classe_id,
        data,

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
        )
        .lt(
          "data",
          hoje
        );

    if (trimestreId) {

      aulasQuery =
        aulasQuery.eq(
          "trimestre_id",
          trimestreId
        );

    }


    const {
      data: aulasData,
      error: aulasError,
    } =
      await aulasQuery;

    if (aulasError) {
      throw aulasError;
    }


    const idsAulas =
      (aulasData ?? []).map(
        (aula) =>
          aula.id
      );


    // =====================================================
    // PRESENÇAS
    // =====================================================

    let presencasData: {
      pessoa_id: string | null;
      aula_id: string | null;
    }[] = [];


    if (
      idsAulas.length > 0
    ) {

      const {
        data,
        error,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select(`
          pessoa_id,
          aula_id
        `)
          .in(
            "aula_id",
            idsAulas
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          );

      if (error) {
        throw error;
      }

      presencasData =
        data ?? [];
    }


    // =====================================================
    // PRESENÇAS ÚNICAS
    // =====================================================

    const presencasUnicas =
      new Set<string>();


    for (
      const presenca of
      presencasData
    ) {

      if (
        !presenca.pessoa_id ||
        !presenca.aula_id
      ) {
        continue;
      }

      presencasUnicas.add(
        `${presenca.pessoa_id}:${presenca.aula_id}`
      );

    }


    // =====================================================
    // DESEMPENHO DAS CLASSES
    // =====================================================

    const resultado =
      (classesData ?? []).map(
        (classe) => {

          const alunosClasse =
            (alunosData ?? []).filter(
              (aluno) =>
                aluno.classe_id ===
                classe.id
            );


          const aulasClasse =
            (aulasData ?? []).filter(
              (aula) =>
                aula.classe_id ===
                classe.id
            );


          const idsAulasClasse =
            new Set(
              aulasClasse.map(
                (aula) =>
                  aula.id
              )
            );


          let totalPresencas =
            0;

          let alunosAssiduos =
            0;

          let alunosAtencao =
            0;

          let alunosSemParticipacao =
            0;


          for (
            const aluno of
            alunosClasse
          ) {

            let presencasAluno =
              0;


            for (
              const aulaId of
              idsAulasClasse
            ) {

              if (
                presencasUnicas.has(
                  `${aluno.id}:${aulaId}`
                )
              ) {

                presencasAluno++;

              }

            }


            totalPresencas +=
              presencasAluno;


            const totalEsperadoAluno =
              aulasClasse.length;


            if (
              totalEsperadoAluno === 0
            ) {
              continue;
            }


            const frequenciaAluno =
              Math.min(
                100,
                Math.round(
                  (
                    presencasAluno /
                    totalEsperadoAluno
                  ) *
                  100
                )
              );


            if (
              presencasAluno === 0
            ) {

              alunosSemParticipacao++;

            } else if (
              frequenciaAluno < 50
            ) {

              alunosAtencao++;

            }


            if (
              frequenciaAluno >= 75
            ) {

              alunosAssiduos++;

            }

          }


          const totalEsperado =
            alunosClasse.length *
            aulasClasse.length;


          const frequencia =
            totalEsperado > 0
              ? Math.min(
                100,
                Math.round(
                  (
                    totalPresencas /
                    totalEsperado
                  ) *
                  100
                )
              )
              : 0;


          const mediaAlunosPorAula =
            aulasClasse.length > 0
              ? Math.round(
                (
                  totalPresencas /
                  aulasClasse.length
                ) *
                10
              ) /
              10
              : 0;


          return {

            id:
              classe.id,

            nome:
              classe.nome,

            alunos:
              alunosClasse.length,

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




    return resultado;
  }





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


    if (
      idsClasses.length > 0
    ) {

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


  static async carregarDesempenhoIndividual(
    igrejaId: string,
    alunoId: string,
    trimestreId: string | null = null
  ): Promise<DashboardDesempenhoIndividual> {

    const hoje =
      new Date()
        .toISOString()
        .split("T")[0];


    // =====================================================
    // ALUNO
    // =====================================================

    const {
      data: aluno,
      error: alunoError,
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
          "id",
          alunoId
        )
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
        .maybeSingle();


    if (alunoError) {
      throw alunoError;
    }


    if (!aluno) {
      throw new Error(
        "Aluno não encontrado."
      );
    }


    // =====================================================
    // CLASSE
    // =====================================================

    let classeNome =
      "Sem classe";


    if (
      aluno.classe_id
    ) {

      const {
        data: classe,
        error: classeError,
      } =
        await supabase
          .schema("ebd")
          .from("classes")
          .select(`
            nome
          `)
          .eq(
            "id",
            aluno.classe_id
          )
          .eq(
            "igreja_id",
            igrejaId
          )
          .maybeSingle();


      if (classeError) {
        throw classeError;
      }


      classeNome =
        classe?.nome ??
        "Classe não identificada";

    }


    // =====================================================
    // AULAS DA IGREJA
    // =====================================================

    let aulasQuery =
      supabase
        .schema("ebd")
        .from("aulas")
        .select(`
          id,
          numero,
          titulo,
          data,
          classe_id,
          trimestre_id,

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
        )
        .lt(
          "data",
          hoje
        );


    if (
      trimestreId
    ) {

      aulasQuery =
        aulasQuery.eq(
          "trimestre_id",
          trimestreId
        );

    }


    const {
      data: aulasData,
      error: aulasError,
    } =
      await aulasQuery;


    if (aulasError) {
      throw aulasError;
    }


    /*
     * Para o aluno contam:
     *
     * - aulas da classe atual;
     * - aulas antigas sem classe definida.
     *
     * Observação:
     * enquanto não houver matrícula histórica,
     * períodos antigos usam a classe atual do aluno.
     */
    const aulasAluno =
      (aulasData ?? [])
        .filter(
          (aula) =>
            !aula.classe_id ||
            aula.classe_id ===
            aluno.classe_id
        )
        .sort(
          (a, b) =>
            a.data.localeCompare(
              b.data
            )
        );


    const idsAulas =
      aulasAluno.map(
        (aula) =>
          aula.id
      );


    // =====================================================
    // PRESENÇAS DO ALUNO
    // =====================================================

    let presencasAluno: {
      aula_id: string | null;
      tipo_registro: string | null;
    }[] = [];


    if (
      idsAulas.length > 0
    ) {

      const {
        data,
        error,
      } =
        await supabase
          .schema("ebd")
          .from("presencas")
          .select(`
            aula_id,
            tipo_registro
          `)
          .eq(
            "pessoa_id",
            aluno.id
          )
          .in(
            "aula_id",
            idsAulas
          )
          .eq(
            "status_validacao",
            "VALIDADO"
          );


      if (error) {
        throw error;
      }


      presencasAluno =
        data ?? [];

    }


    /*
     * Garante uma presença por aula,
     * mesmo que algum dado duplicado
     * apareça no futuro.
     */
    const presencasMap =
      new Map<
        string,
        string | null
      >();


    for (
      const presenca of
      presencasAluno
    ) {

      if (
        !presenca.aula_id
      ) {
        continue;
      }

      if (
        !presencasMap.has(
          presenca.aula_id
        )
      ) {

        presencasMap.set(
          presenca.aula_id,
          presenca.tipo_registro
        );

      }

    }


    const aulasEsperadas =
      aulasAluno.length;


    const totalPresencas =
      aulasAluno.filter(
        (aula) =>
          presencasMap.has(
            aula.id
          )
      ).length;


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
            ) *
            100
          )
        )
        : 0;


    // =====================================================
    // MÉDIA DA CLASSE
    // =====================================================

    let mediaClasse =
      0;


    if (
      aluno.classe_id &&
      idsAulas.length > 0
    ) {

      const {
        data: alunosClasse,
        error: alunosClasseError,
      } =
        await supabase
          .schema("ebd")
          .from("pessoas")
          .select(`
            id
          `)
          .eq(
            "igreja_id",
            igrejaId
          )
          .eq(
            "classe_id",
            aluno.classe_id
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
          );


      if (
        alunosClasseError
      ) {
        throw alunosClasseError;
      }


      const idsAlunosClasse =
        (alunosClasse ?? []).map(
          (item) =>
            item.id
        );


      if (
        idsAlunosClasse.length >
        0
      ) {

        const {
          data: presencasClasse,
          error: presencasClasseError,
        } =
          await supabase
            .schema("ebd")
            .from("presencas")
            .select(`
              pessoa_id,
              aula_id
            `)
            .in(
              "pessoa_id",
              idsAlunosClasse
            )
            .in(
              "aula_id",
              idsAulas
            )
            .eq(
              "status_validacao",
              "VALIDADO"
            );


        if (
          presencasClasseError
        ) {
          throw presencasClasseError;
        }


        const presencasClasseUnicas =
          new Set<string>();


        for (
          const registro of
          presencasClasse ?? []
        ) {

          if (
            !registro.pessoa_id ||
            !registro.aula_id
          ) {
            continue;
          }


          presencasClasseUnicas.add(
            `${registro.pessoa_id}:${registro.aula_id}`
          );

        }


        const totalEsperadoClasse =
          idsAlunosClasse.length *
          aulasEsperadas;


        mediaClasse =
          totalEsperadoClasse > 0
            ? Math.min(
              100,
              Math.round(
                (
                  presencasClasseUnicas.size /
                  totalEsperadoClasse
                ) *
                100
              )
            )
            : 0;

      }

    }


    const diferencaMediaClasse =
      aluno.classe_id &&
        aulasEsperadas > 0
        ? frequencia -
        mediaClasse
        : null;


    // =====================================================
    // SEQUÊNCIA ATUAL
    // =====================================================

    let sequenciaAtual =
      0;


    /*
     * Começa pela aula mais recente.
     * Para na primeira falta encontrada.
     */
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


    // =====================================================
    // HISTÓRICO
    // =====================================================

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


    // =====================================================
    // RETORNO
    // =====================================================

    return {

      aluno: {

        id:
          aluno.id,

        nome:
          aluno.nome,

        classeId:
          aluno.classe_id,

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

  static async carregarEvolucaoAlunoTrimestres(
    igrejaId: string,
    alunoId: string
  ): Promise<DashboardEvolucaoAlunoTrimestre[]> {

    const trimestres =
      await DashboardService
        .listarTrimestres(
          igrejaId
        );


    /*
     * O método listarTrimestres retorna
     * do mais recente para o mais antigo.
     *
     * Para evolução queremos ordem cronológica.
     */
    const ordemCronologica =
      [...trimestres].reverse();


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


    /*
     * Não mostramos trimestre em que
     * não existiu nenhuma aula esperada
     * para esse aluno.
     */
    return resultados.filter(
      (item) =>
        item.aulasEsperadas > 0
    );
  }

}

