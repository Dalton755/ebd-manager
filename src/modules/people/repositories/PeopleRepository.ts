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
    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "create-user-admin",
      {
        body: {
          nome: pessoa.nome,
          email: pessoa.email,
          telefone: pessoa.telefone,
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
            "Não foi possível cadastrar o usuário."
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
        "Não foi possível cadastrar o usuário."
      );
    }

    // =====================================================
    // RESPOSTA INVÁLIDA
    // =====================================================

    if (!data?.success) {

      throw new Error(
        data?.error ??
        "Não foi possível cadastrar o usuário."
      );
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    return data.pessoa;
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
    const {
      data,
      error,
    } = await supabase.functions.invoke(
      "update-person-profile-admin",
      {
        body: {
          pessoa_id: id,
          perfil,
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
            "Não foi possível atualizar o perfil."
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
        "Não foi possível atualizar o perfil."
      );
    }

    // =====================================================
    // RESPOSTA INVÁLIDA
    // =====================================================

    if (!data?.success) {
      const erroComDados = new Error(
        data?.error ??
        "Não foi possível atualizar o perfil."
      ) as Error & {
        codigo?: string;
        utilizado?: number;
        limite?: number;
      };

      erroComDados.codigo =
        data?.codigo;

      erroComDados.utilizado =
        data?.utilizado;

      erroComDados.limite =
        data?.limite;

      throw erroComDados;
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    return data.pessoa;
  }

}