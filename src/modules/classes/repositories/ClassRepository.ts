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
    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "create-class-admin",
      {
        body: {
          nome: classe.nome,
          descricao: classe.descricao,
          idade_minima: classe.idade_minima,
          idade_maxima: classe.idade_maxima,
        },
      }
    );

    // =====================================================
    // ERRO DA EDGE FUNCTION
    // =====================================================

    if (error) {
      console.error(
        "Erro retornado pela Edge Function:",
        error
      );

      try {
        if (
          "context" in error &&
          error.context instanceof Response
        ) {
          const resposta =
            await error.context.json();

          console.error(
            "Resposta da Edge Function:",
            resposta
          );

          const erroComDados = new Error(
            resposta?.error ??
            "Não foi possível cadastrar a classe."
          ) as Error & {
            codigo?: string;
            utilizado?: number;
            limite?: number;
          };

          erroComDados.codigo =
            resposta?.codigo;

          erroComDados.utilizado =
            resposta?.utilizado;

          erroComDados.limite =
            resposta?.limite;

          throw erroComDados;
        }
      } catch (erroLeitura) {
        if (erroLeitura instanceof Error) {
          throw erroLeitura;
        }

        console.error(
          "Não foi possível interpretar a resposta da Edge Function:",
          erroLeitura
        );
      }

      throw new Error(
        "Não foi possível cadastrar a classe."
      );
    }

    // =====================================================
    // RESPOSTA INVÁLIDA
    // =====================================================

    if (!data?.success) {
      throw new Error(
        data?.error ??
        "Não foi possível cadastrar a classe."
      );
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    return data.classe;
  }


  static async editar(
    id: string,
    classe: Classe
  ) {

    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "update-class-admin",
      {
        body: {
          id,
          nome: classe.nome,
          descricao: classe.descricao,
          idade_minima: classe.idade_minima,
          idade_maxima: classe.idade_maxima,
        },
      }
    );

    // =====================================================
    // ERRO DA EDGE FUNCTION
    // =====================================================

    if (error) {

      console.error(
        "Erro retornado pela Edge Function:",
        error
      );

      try {

        if (
          "context" in error &&
          error.context instanceof Response
        ) {

          const resposta =
            await error.context.json();

          console.error(
            "Resposta da Edge Function:",
            resposta
          );

          const erroComDados =
            new Error(
              resposta?.error ??
              "Não foi possível atualizar a classe."
            ) as Error & {
              codigo?: string;
              utilizado?: number;
              limite?: number;
            };

          erroComDados.codigo =
            resposta?.codigo;

          erroComDados.utilizado =
            resposta?.utilizado;

          erroComDados.limite =
            resposta?.limite;

          throw erroComDados;
        }

      } catch (erroLeitura) {

        if (
          erroLeitura instanceof Error
        ) {
          throw erroLeitura;
        }

        console.error(
          "Não foi possível interpretar a resposta da Edge Function:",
          erroLeitura
        );
      }

      throw new Error(
        "Não foi possível atualizar a classe."
      );
    }

    // =====================================================
    // RESPOSTA INVÁLIDA
    // =====================================================

    if (!data?.success) {

      throw new Error(
        data?.error ??
        "Não foi possível atualizar a classe."
      );
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    return data.classe;
  }


  static async inativar(id: string) {

    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "inactivate-class-admin",
      {
        body: {
          id,
        },
      }
    );

    // =====================================================
    // ERRO DA EDGE FUNCTION
    // =====================================================

    if (error) {

      console.error(
        "Erro retornado pela Edge Function:",
        error
      );

      try {

        if (
          "context" in error &&
          error.context instanceof Response
        ) {

          const resposta =
            await error.context.json();

          console.error(
            "Resposta da Edge Function:",
            resposta
          );

          throw new Error(
            resposta?.error ??
            "Não foi possível inativar a classe."
          );
        }

      } catch (erroLeitura) {

        if (
          erroLeitura instanceof Error
        ) {
          throw erroLeitura;
        }

        console.error(
          "Não foi possível interpretar a resposta da Edge Function:",
          erroLeitura
        );
      }

      throw new Error(
        "Não foi possível inativar a classe."
      );
    }

    // =====================================================
    // RESPOSTA INVÁLIDA
    // =====================================================

    if (!data?.success) {

      throw new Error(
        data?.error ??
        "Não foi possível inativar a classe."
      );
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    return data.classe;
  }

}