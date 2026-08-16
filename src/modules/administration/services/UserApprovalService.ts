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

        const igrejaId = pessoa.igreja_id;

        // =================================================
        // BUSCA ASSINATURA ATIVA
        // =================================================

        const {
            data: assinatura,
            error: assinaturaError,
        } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                plano_id,
                status
            `)
            .eq("igreja_id", igrejaId)
            .eq("status", "ATIVA")
            .maybeSingle();

        if (assinaturaError) {
            throw assinaturaError;
        }

        if (!assinatura) {
            throw new Error(
                "A igreja não possui uma assinatura ativa."
            );
        }

        // =================================================
        // BUSCA LIMITE DO PLANO
        // =================================================

        const {
            data: limites,
            error: limitesError,
        } = await supabase
            .schema("ebd")
            .from("plano_limites")
            .select(`
                max_pessoas
            `)
            .eq("plano_id", assinatura.plano_id)
            .maybeSingle();

        if (limitesError) {
            throw limitesError;
        }

        if (!limites) {
            throw new Error(
                "Os limites do plano não foram encontrados."
            );
        }

        // =================================================
        // VERIFICA LIMITE DE PESSOAS
        // =================================================

        // -1 significa ilimitado.

        if (limites.max_pessoas !== -1) {

            const {
                count,
                error: countError,
            } = await supabase
                .schema("ebd")
                .from("pessoas")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true,
                    }
                )
                .eq(
                    "igreja_id",
                    igrejaId
                )
                .eq(
                    "ativo",
                    true
                );

            if (countError) {
                throw countError;
            }

            const quantidadeAtual =
                count ?? 0;

            // =============================================
            // LIMITE ATINGIDO
            // =============================================

            if (
                quantidadeAtual >=
                limites.max_pessoas
            ) {

                return {
                    permitido: false,
                    codigo:
                        "LIMITE_PESSOAS_ATINGIDO",
                    limite:
                        limites.max_pessoas,
                    utilizado:
                        quantidadeAtual,
                };
            }
        }

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
