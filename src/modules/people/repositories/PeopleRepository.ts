import { supabase } from "@/shared/lib/supabase/client";
import type { Pessoa } from "../types/Pessoa";

export class PeopleRepository {
  static async listar() {
    const { data, error } = await supabase
      .from("pessoas")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      throw error;
    }

    return data;
  }

  static async criar(pessoa: Pessoa) {
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
  pessoa: Partial<Pessoa>
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
    const { data, error } = await supabase
      .from("pessoas")
      .update({
        ativo: false,
      })
      .eq("id", id)
      .select();

    console.log("Pessoa inativada:", data);

    if (error) {
      throw error;
    }
  }

  static async atualizarPerfil(
    id: string,
    perfil: Pessoa["perfil"]
  ) {
    const { data, error } = await supabase
      .from("pessoas")
      .update({ perfil })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

}