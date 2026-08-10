import { supabase } from "@/shared/lib/supabase/client";

import type {
    PasswordRecoveryRequest,
} from "../types/PasswordRecoveryRequest";

export const PasswordRecoveryAdminRepository = {
    async listarPendentes(): Promise<
        PasswordRecoveryRequest[]
    > {
        const { data, error } = await supabase
            .schema("ebd")
            .from("solicitacoes_senha")
            .select(`
                id,
                pessoa_id,
                status,
                solicitado_em,
                concluido_em,
                atendido_por,
                pessoa:pessoas!solicitacoes_senha_pessoa_id_fkey (
                    id,
                    nome,
                    email,
                    telefone
                )
            `)
            .eq("status", "PENDENTE")
            .order("solicitado_em", {
                ascending: true,
            });

        if (error) {
            throw error;
        }

        return (
            data as unknown as
            PasswordRecoveryRequest[]
        ) ?? [];
    },

    async redefinirSenha(
        solicitacaoId: string,
        novaSenha: string
    ) {
        const {
            data: {
                session,
            },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session?.access_token) {
            throw new Error(
                "Usuário não autenticado."
            );
        }

        const { data, error } =
            await supabase.functions.invoke(
                "reset-user-password",
                {
                    body: {
                        solicitacaoId,
                        novaSenha,
                    },
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`,
                    },
                }
            );

        if (error) {
            throw error;
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        return data;
    },
};