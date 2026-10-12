import { supabase } from "@/shared/lib/supabase/client";
import type { Pessoa } from "@/modules/people/types/Pessoa";

type PerfilAprovacao =
    | "ALUNO"
    | "PASTOR"
    | "SUPERINTENDENTE"
    | "PROFESSOR";

export type ResultadoAprovacao =
    | {
          permitido: true;
      }
    | {
          permitido: false;
          codigo: "LIMITE_PESSOAS_ATINGIDO";
          limite: number;
          utilizado: number;
      };

export const UserApprovalService = {

    async listarPendentes(): Promise<Pessoa[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("pessoas")
            .select("*")
            .eq("status", "PENDENTE")
            .order("criado_em", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data ?? [];
    },


    async aprovar(
        id: string,
        perfil: PerfilAprovacao
    ): Promise<ResultadoAprovacao> {

        // =================================================
        // BUSCA O USUÁRIO PENDENTE
        // =================================================

        const {
            data: pessoa,
            error: pessoaError,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .select(`
                id,
                igreja_id,
                status
            `)
            .eq("id", id)
            .maybeSingle();

        if (pessoaError) {
            throw pessoaError;
        }

        if (!pessoa) {
            throw new Error(
                "Usuário não encontrado."
            );
        }

        if (pessoa.status !== "PENDENTE") {
            throw new Error(
                "Este usuário não está mais pendente de aprovação."
            );
        }

        // =================================================
        // VERIFICA IGREJA
        // =================================================

        if (!pessoa.igreja_id) {
            throw new Error(
                "Este usuário não está vinculado a uma igreja."
            );
        }

        // A aprovação permanece sujeita ao perfil do usuário, não a cotas comerciais.

        // =================================================
        // APROVA USUÁRIO
        // =================================================

        const {
            error: aprovacaoError,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .update({
                status: "ATIVO",
                ativo: true,
                perfil,
            })
            .eq("id", id);

        if (aprovacaoError) {
            throw aprovacaoError;
        }

        return {
            permitido: true,
        };
    },


    async rejeitar(id: string) {

        const { error } = await supabase
            .schema("ebd")
            .from("pessoas")
            .update({
                status: "INATIVO",
                ativo: false,
            })
            .eq("id", id);

        if (error) {
            throw error;
        }
    },
};
