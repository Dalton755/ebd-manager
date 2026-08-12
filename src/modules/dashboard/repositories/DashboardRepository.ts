import { supabase } from "@/shared/lib/supabase/client";

export class DashboardRepository {
  static async contarPessoas() {
    const { count, error } = await supabase
      .schema("ebd")
      .from("pessoas")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("ativo", true);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  static async contarAulas() {
    const { count, error } = await supabase
      .schema("ebd")
      .from("aulas")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  static async contarPresencas() {
    const { count, error } = await supabase
      .schema("ebd")
      .from("presencas")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }
}