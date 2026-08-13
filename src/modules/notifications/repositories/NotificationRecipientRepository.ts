import { supabase } from "@/shared/lib/supabase/client";

export type AlunoNotificacao = {
    id: string;
    nome: string;
};

export const NotificationRecipientRepository = {

    async listarAlunosAtivos(): Promise<AlunoNotificacao[]> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    nome
                `)
                .eq("perfil", "ALUNO")
                .eq("ativo", true)
                .eq("status", "ATIVO");

        if (error) {
            throw error;
        }

        return data ?? [];
    },

};