import { supabase } from "@/shared/lib/supabase/client";
import type { Pessoa } from "@/modules/people/types/Pessoa";

export class ClassStudentRepository {

  static async listarAlunosDaClasse(
    classeId: string
  ): Promise<Pessoa[]> {

    const { data, error } = await supabase
      .schema("ebd")
      .from("pessoas")
      .select("*")
      .eq("classe_id", classeId)
      .eq("perfil", "ALUNO")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      throw error;
    }

    return data ?? [];
  }


  static async listarAlunosDisponiveis(): Promise<Pessoa[]> {

    const { data, error } = await supabase
      .schema("ebd")
      .from("pessoas")
      .select("*")
      .eq("perfil", "ALUNO")
      .eq("ativo", true)
      .is("classe_id", null)
      .order("nome");

    if (error) {
      throw error;
    }

    return data ?? [];
  }


  static async vincularAluno(
    pessoaId: string,
    classeId: string
  ) {

    const { data, error } = await supabase
      .schema("ebd")
      .from("pessoas")
      .update({
        classe_id: classeId,
      })
      .eq("id", pessoaId)
      .eq("perfil", "ALUNO")
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }


  static async removerAluno(
    pessoaId: string
  ) {

    const { data, error } = await supabase
      .schema("ebd")
      .from("pessoas")
      .update({
        classe_id: null,
      })
      .eq("id", pessoaId)
      .eq("perfil", "ALUNO")
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }


  static async contarAlunos(
    classeId: string
  ) {

    const { count, error } = await supabase
      .schema("ebd")
      .from("pessoas")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("classe_id", classeId)
      .eq("perfil", "ALUNO")
      .eq("ativo", true);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

}