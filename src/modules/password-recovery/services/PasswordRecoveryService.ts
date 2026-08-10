import { PasswordRecoveryRepository } from "../repositories/PasswordRecoveryRepository";

export const PasswordRecoveryService = {
    async solicitarRedefinicao(email: string) {
        const emailNormalizado = email.trim().toLowerCase();

        if (!emailNormalizado) {
            throw new Error(
                "Informe seu e-mail."
            );
        }

        return PasswordRecoveryRepository.criarSolicitacao(
            emailNormalizado
        );
    },
};
