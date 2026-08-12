import { supabase } from "@/shared/lib/supabase/client";

export type DashboardResumo = {
  pessoas: number;
  aulas: number;
  presencas: number;
  classes: number;

  proximaAula: {
    id: string;
    titulo: string;
    data: string;
    professor: string;
  } | null;

  ultimaPresenca: string | null;
};

export class DashboardService {

  static async carregarResumo(): Promise<DashboardResumo> {

    // =====================================================
    // PESSOAS
    // =====================================================

    const { count: pessoas, error: pessoasError } =
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
    // AULAS
    // =====================================================

    const { count: aulas, error: aulasError } =
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
    // PRESENÇAS
    // =====================================================

    const { count: presencas, error: presencasError } =
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
    // PRÓXIMA AULA
    // =====================================================

    const hoje = new Date()
      .toISOString()
      .split("T")[0];

    const {
      data: proximaAulaData,
      error: proximaAulaError,
    } = await supabase
      .schema("ebd")
      .from("aulas")
      .select(`
        id,
        titulo,
        data,
        professor_id
      `)
      .gte("data", hoje)
      .order("data", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (proximaAulaError) {
      throw proximaAulaError;
    }


    let proximaAula = null;

    if (proximaAulaData) {

      let professor = "Professor não informado";

      if (proximaAulaData.professor_id) {

        const {
          data: professorData,
        } = await supabase
          .schema("ebd")
          .from("pessoas")
          .select("nome")
          .eq(
            "id",
            proximaAulaData.professor_id
          )
          .maybeSingle();

        if (professorData?.nome) {
          professor = professorData.nome;
        }
      }

      proximaAula = {
        id: proximaAulaData.id,
        titulo: proximaAulaData.titulo,
        data: proximaAulaData.data,
        professor,
      };
    }


    // =====================================================
    // ÚLTIMA PRESENÇA
    // =====================================================

    const {
      data: ultimaPresencaData,
      error: ultimaPresencaError,
    } = await supabase
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


    return {
      pessoas: pessoas ?? 0,
      aulas: aulas ?? 0,
      presencas: presencas ?? 0,
      classes: 0,

      proximaAula,

      ultimaPresenca:
        ultimaPresencaData?.data ?? null,
    };
  }
}