import { supabase } from "@/shared/lib/supabase/client";
import type { Classe } from "../types/Classe";

export class ClassRepository {

  static async listar() {

    const { data, error } =
      await supabase
        .schema("ebd")
        .from("classes")
        .select("*")
        .eq("ativa", true)
        .order("nome");

    if (error) {
      throw error;
    }

    return data;
  }


  static async criar(classe: Classe) {

    const { data, error } =
      await supabase
        .schema("ebd")
        .from("classes")
        .insert(classe)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }


  static async editar(
    id: string,
    classe: Classe
  ) {

    const { data, error } =
      await supabase
        .schema("ebd")
        .from("classes")
        .update({
          ...classe,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }


  static async inativar(id: string) {

    const { error } =
      await supabase
        .schema("ebd")
        .from("classes")
        .update({
          ativa: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      throw error;
    }
  }

}