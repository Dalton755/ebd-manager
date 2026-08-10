import { supabase } from "@/shared/lib/supabase/client";
import type { Pessoa } from "@/modules/people/types/Pessoa";

type PerfilAprovacao =
    | "ALUNO"
    | "PASTOR"
    | "SUPERINTENDENTE"
    | "PROFESSOR";

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
    ) {
        const { error } = await supabase
            .schema("ebd")
            .from("pessoas")
            .update({
                status: "ATIVO",
                ativo: true,
                perfil,
            })
            .eq("id", id);

        if (error) {
            throw error;
        }
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