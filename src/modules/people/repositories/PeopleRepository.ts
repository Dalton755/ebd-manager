import { supabase } from "@/shared/lib/supabase/client";
import type { Pessoa } from "../types/Pessoa";

export class PeopleRepository {
  static async listar() {
    const { data, error } = await supabase
      .from("pessoas")
      .select("*")
      .order("nome");

    if (error) {
      throw error;
    }

    return data;
  }

  static async criar(pessoa: Pessoa)
   {
    const { data, error } = await supabase
      .from("pessoas")
      .insert(pessoa)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async editar(
  id: string,
  pessoa: Pessoa
) {
    const { data, error } = await supabase
      .from("pessoas")
      .update(pessoa)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async inativar(id: string) {
    const { error } = await supabase
      .from("pessoas")
      .update({
        ativo: false,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }
}