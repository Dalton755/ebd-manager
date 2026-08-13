import {
    NotificationRepository,
    type Notificacao,
} from "../repositories/NotificationRepository";

export const NotificationService = {

    async listarPorPessoa(
        pessoaId: string
    ): Promise<Notificacao[]> {

        if (!pessoaId) {
            return [];
        }

        return NotificationRepository.listarPorPessoa(
            pessoaId
        );
    },

    async contarNaoLidas(
        pessoaId: string
    ): Promise<number> {

        if (!pessoaId) {
            return 0;
        }

        return NotificationRepository.contarNaoLidas(
            pessoaId
        );
    },

    async marcarComoLida(
        notificacaoId: string
    ): Promise<void> {

        if (!notificacaoId) {
            return;
        }

        await NotificationRepository.marcarComoLida(
            notificacaoId
        );
    },

};