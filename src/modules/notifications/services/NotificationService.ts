import {
    NotificationRepository,
    type Notificacao,
} from "../repositories/NotificationRepository";

import { PushNotificationService } from "./PushNotificationService";

import {
    NotificationRecipientRepository,
} from "../repositories/NotificationRecipientRepository";

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

    async criar(
        notificacao: {
            pessoa_id: string;
            tipo: string;
            titulo: string;
            mensagem: string;
            aula_id?: string | null;
            url?: string;
        }
    ): Promise<Notificacao> {

        if (!notificacao.pessoa_id) {
            throw new Error(
                "pessoa_id é obrigatório."
            );
        }

        if (!notificacao.titulo?.trim()) {
            throw new Error(
                "O título da notificação é obrigatório."
            );
        }

        if (!notificacao.mensagem?.trim()) {
            throw new Error(
                "A mensagem da notificação é obrigatória."
            );
        }

        // 1. Grava a notificação no banco
        const criada =
            await NotificationRepository.criar({
                pessoa_id:
                    notificacao.pessoa_id,

                tipo:
                    notificacao.tipo,

                titulo:
                    notificacao.titulo,

                mensagem:
                    notificacao.mensagem,

                aula_id:
                    notificacao.aula_id ?? null,
            });

        // 2. Envia o Push para os dispositivos
        try {

            await PushNotificationService.enviar({
                pessoa_id:
                    notificacao.pessoa_id,

                titulo:
                    notificacao.titulo,

                mensagem:
                    notificacao.mensagem,

                aula_id:
                    notificacao.aula_id ?? null,

                url:
                    notificacao.url ?? "/",
            });

        } catch (error) {

            console.error(
                "Notificação criada, mas o Push não pôde ser enviado:",
                error
            );

            // Não desfazemos a notificação do banco.
            // O usuário continuará vendo a notificação
            // dentro do sistema.
        }

        return criada;
    },

    async notificarTodosOsAlunos(
        notificacao: {
            tipo: string;
            titulo: string;
            mensagem: string;
            aula_id?: string | null;
            url?: string;
        }
    ): Promise<void> {

        const alunos =
            await NotificationRecipientRepository
                .listarAlunosAtivos();

        if (alunos.length === 0) {
            return;
        }

        for (const aluno of alunos) {

            try {

                await this.criar({
                    pessoa_id: aluno.id,

                    tipo:
                        notificacao.tipo,

                    titulo:
                        notificacao.titulo,

                    mensagem:
                        notificacao.mensagem,

                    aula_id:
                        notificacao.aula_id ?? null,

                    url:
                        notificacao.url ?? "/aulas",
                });

            } catch (error) {

                console.error(
                    `Erro ao notificar o aluno ${aluno.id}:`,
                    error
                );

            }
        }
    },

};