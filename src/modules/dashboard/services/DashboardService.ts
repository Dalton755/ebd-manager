import { supabase } from "@/shared/lib/supabase/client";

export type DashboardResumo = {
  alunos: number;
  professores: number;
  pessoas: number;
  aulas: number;
  presencas: number;
  classes: number;

  frequencia: number;

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

export class DashboardService {

  static async carregarResumo(): Promise<DashboardResumo> {

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
        .eq("ativo", true);

    if (pessoasError) {
      throw pessoasError;
    }


    // =====================================================
    // ALUNOS ATIVOS
    // =====================================================

    const {
      count: alunos,
      error: alunosError,
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
        .eq("perfil", "ALUNO");

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
        .eq("perfil", "PROFESSOR");

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
        .eq("ativa", true);

    if (classesError) {
      throw classesError;
    }


    // =====================================================
    // AULAS
    // =====================================================

    const {
      count: aulas,
      error: aulasError,
    } =
      await supabase
        .schema("ebd")
        .from("aulas")
        .select("*", {
          count: "exact",
          head: true,
        });

    if (aulasError) {
      throw aulasError;
    }


    // =====================================================
    // AULAS JÁ REALIZADAS
    // =====================================================

    const {
      data: aulasRealizadas,
      error: aulasRealizadasError,
    } =
      await supabase
        .schema("ebd")
        .from("aulas")
        .select("id")
        .lt("data", hoje);

    if (aulasRealizadasError) {
      throw aulasRealizadasError;
    }


    const idsAulasRealizadas =
      (aulasRealizadas ?? []).map(
        (aula) => aula.id
      );


    // =====================================================
    // PRESENÇAS
    // =====================================================

    const {
      count: presencas,
      error: presencasError,
    } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .select("*", {
          count: "exact",
          head: true,
        });

    if (presencasError) {
      throw presencasError;
    }


    // =====================================================
    // FREQUÊNCIA REAL
    // =====================================================

    let frequencia = 0;

    const totalAlunos =
      alunos ?? 0;

    const totalAulasRealizadas =
      idsAulasRealizadas.length;


    if (
      totalAlunos > 0 &&
      totalAulasRealizadas > 0
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
          .in("aula_id", idsAulasRealizadas);

      if (presencasRealizadasError) {
        throw presencasRealizadasError;
      }


      const presencasValidas =
        (presencasRealizadas ?? []).filter(
          (presenca) =>
            !!presenca.pessoa_id &&
            !!presenca.aula_id
        );


      const totalEsperado =
        totalAlunos *
        totalAulasRealizadas;


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

    const {
      count: aulasSemProfessor,
      error: aulasSemProfessorError,
    } =
      await supabase
        .schema("ebd")
        .from("aulas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .is("professor_id", null)
        .gte("data", hoje);

    if (aulasSemProfessorError) {
      throw aulasSemProfessorError;
    }


    // =====================================================
    // PRÓXIMA AULA
    // =====================================================

    const {
      data: proximaAulaData,
      error: proximaAulaError,
    } =
      await supabase
        .schema("ebd")
        .from("aulas")
        .select(`
          id,
          numero,
          titulo,
          data,
          professor_id
        `)
        .gte("data", hoje)
        .order("data", {
          ascending: true,
        })
        .order("numero", {
          ascending: true,
        })
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

    const {
      data: ultimaPresencaData,
      error: ultimaPresencaError,
    } =
      await supabase
        .schema("ebd")
        .from("presencas")
        .select("data")
        .order("data", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (ultimaPresencaError) {
      throw ultimaPresencaError;
    }


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

      proximaAula,

      ultimaPresenca:
        ultimaPresencaData?.data ??
        null,

      aulasSemProfessor:
        aulasSemProfessor ?? 0,

    };
  }
}