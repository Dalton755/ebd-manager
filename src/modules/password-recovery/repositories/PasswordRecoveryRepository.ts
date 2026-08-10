import { supabase } from "@/shared/lib/supabase/client";

export const PasswordRecoveryRepository = {
    async criarSolicitacao(email: string) {
        const { data, error } = await supabase
            .schema("ebd")
            .rpc("solicitar_redefinicao_senha", {
                p_email: email,
            });

        if (error) {
            throw error;
        }

        return data;
    },
};
