import {
    PasswordRecoveryAdminRepository,
} from "../repositories/PasswordRecoveryAdminRepository";

export const PasswordRecoveryAdminService = {
    async listarPendentes() {
        return PasswordRecoveryAdminRepository
            .listarPendentes();
    },

    async redefinirSenha(
        solicitacaoId: string,
        novaSenha: string
    ) {
        if (!solicitacaoId) {
            throw new Error(
                "Solicitação de recuperação inválida."
            );
        }

        if (!novaSenha || novaSenha.length < 6) {
            throw new Error(
                "A nova senha deve ter pelo menos 6 caracteres."
            );
        }

        return PasswordRecoveryAdminRepository
            .redefinirSenha(
                solicitacaoId,
                novaSenha
            );
    },
};