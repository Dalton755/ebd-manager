import { supabase } from "@/shared/lib/supabase/client";

export type Notificacao = {
    id: string;
    pessoa_id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    aula_id: string | null;
    lida: boolean;
    created_at: string;
};

export const NotificationRepository = {

    async listarPorPessoa(
        pessoaId: string
    ): Promise<Notificacao[]> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("notificacoes")
                .select("*")
                .eq("pessoa_id", pessoaId)
                .order("created_at", {
                    ascending: false,
                });

        if (error) {
            throw error;
        }

        return data ?? [];
    },

    async contarNaoLidas(
        pessoaId: string
    ): Promise<number> {

        const { count, error } =
            await supabase
                .schema("ebd")
                .from("notificacoes")
                .select("*", {
                    count: "exact",
                    head: true,
                })
                .eq("pessoa_id", pessoaId)
                .eq("lida", false);

        if (error) {
            throw error;
        }

        return count ?? 0;
    },

    async marcarComoLida(
        notificacaoId: string
    ): Promise<void> {

        const { error } =
            await supabase
                .schema("ebd")
                .from("notificacoes")
                .update({
                    lida: true,
                })
                .eq("id", notificacaoId);

        if (error) {
            throw error;
        }
    },

};