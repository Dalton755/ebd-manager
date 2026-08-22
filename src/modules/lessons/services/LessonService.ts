import type { Aula } from "../types/Aula";
import type { Trimestre } from "../types/Trimestre";

import { LessonRepository } from "../repositories/LessonRepository";
import { PeopleRepository } from "../../people/repositories/PeopleRepository";
import { NotificationService } from "../../notifications/services/NotificationService";


export type AulaComStatus = Aula & {
    statusProfessor: "DEFINIDO" | "PENDENTE";
};

export const LessonService = {

    async listarTrimestres(
        igrejaId: string
    ): Promise<Trimestre[]> {
        return LessonRepository.listarTrimestres(igrejaId);
    },

    async buscarTrimestreAtivo(
        igrejaId: string
    ): Promise<Trimestre | null> {
        return LessonRepository.buscarTrimestreAtivo(igrejaId);
    },

    async criarTrimestre(
        igrejaId: string,
        numero: number,
        ano: number,
        tema: string,
        maxTrimestres: number
    ): Promise<Trimestre> {

        const trimestres =
            await LessonRepository.listarTrimestres(igrejaId);

        const jaExiste = trimestres.some(
            (trimestre) =>
                trimestre.numero === numero &&
                trimestre.ano === ano
        );

        if (jaExiste) {
            throw new Error(
                "Este trimestre jÃ¡ estÃ¡ cadastrado."
            );
        }

        // -1 = ilimitado
        if (
            maxTrimestres !== -1 &&
            trimestres.length >= maxTrimestres
        ) {
            throw new Error(
                `Seu plano permite no mÃ¡ximo ${maxTrimestres} trimestre${maxTrimestres === 1 ? "" : "s"} cadastrados.`
            );
        }

        return LessonRepository.criarTrimestre(
            igrejaId,
            {
                numero,
                ano,
                tema,
                ativo: false,
            }
        );
    },

    async ativarTrimestre(
        igrejaId: string,
        trimestreId: string
    ): Promise<void> {

        const trimestres =
            await LessonRepository.listarTrimestres(igrejaId);

        const trimestreSelecionado =
            trimestres.find(
                (trimestre) =>
                    trimestre.id === trimestreId
            );

        if (!trimestreSelecionado) {
            throw new Error(
                "Trimestre não encontrado."
            );
        }

        if (trimestreSelecionado.ativo) {
            return;
        }

        const trimestreAtivo =
            trimestres.find(
                (trimestre) => trimestre.ativo
            );

        if (trimestreAtivo) {

            await LessonRepository.atualizarTrimestre(
                igrejaId,
                trimestreAtivo.id,
                {
                    ativo: false,
                }
            );
        }

        await LessonRepository.atualizarTrimestre(
            igrejaId,
            trimestreId,
            {
                ativo: true,
            }
        );
    },
    async atualizarTrimestre(
        igrejaId: string,
        trimestreId: string,
        dados: Partial<
            Pick<
                Trimestre,
                "numero" | "ano" | "tema" | "ativo"
            >
        >
    ): Promise<Trimestre> {

        if (dados.numero !== undefined) {
            if (
                !Number.isInteger(dados.numero) ||
                dados.numero < 1 ||
                dados.numero > 4
            ) {
                throw new Error(
                    "O nÃºmero do trimestre deve estar entre 1 e 4."
                );
            }
        }

        if (
            dados.ano !== undefined &&
            (!Number.isInteger(dados.ano) ||
                dados.ano < 2000)
        ) {
            throw new Error(
                "Informe um ano vÃ¡lido."
            );
        }

        if (
            dados.tema !== undefined &&
            !dados.tema.trim()
        ) {
            throw new Error(
                "Informe o tema do trimestre."
            );
        }

        return LessonRepository.atualizarTrimestre(
            igrejaId,
            trimestreId,
            dados
        );
    },

    async listarAulasDoTrimestre(
        trimestreId: string
    ): Promise<AulaComStatus[]> {

        const aulas =
            await LessonRepository
                .listarAulasPorTrimestre(trimestreId);

        return aulas.map((aula) => ({
            ...aula,
            statusProfessor: aula.professor_id
                ? "DEFINIDO"
                : "PENDENTE",
        }));
    },


    async criarAula(
        aula: Omit<
            Aula,
            "id" | "created_at" | "updated_at"
        >,
        igrejaId: string
    ): Promise<Aula> {

        if (!aula.numero || aula.numero < 1) {
            throw new Error(
                "Informe um nÃºmero de aula vÃ¡lido."
            );
        }

        if (!aula.titulo.trim()) {
            throw new Error(
                "Informe o tÃ­tulo da aula."
            );
        }

        if (!aula.data) {
            throw new Error(
                "Informe a data da aula."
            );
        }

        // 1. Cria a aula primeiro
        const aulaCriada =
            await LessonRepository.criarAula(aula);

        // 2. A partir daqui, qualquer erro de
        // notificaÃ§Ã£o NÃƒO deve impedir a criaÃ§Ã£o da aula.
        try {

            const pessoas =
                await PeopleRepository.listar(igrejaId);

            const alunos =
                pessoas.filter(
                    (pessoa) =>
                        pessoa.perfil === "ALUNO" &&
                        pessoa.ativo === true &&
                        pessoa.status === "ATIVO"
                );

            console.log(
                `Alunos ativos encontrados para notificaÃ§Ã£o: ${alunos.length}`
            );

            // 3. Cria a notificaÃ§Ã£o e envia Push
            // individualmente para cada aluno.
            for (const aluno of alunos) {

                try {

                    await NotificationService.criar({

                        pessoa_id:
                            aluno.id,

                        tipo:
                            "NOVA_AULA",

                        titulo:
                            "Nova aula disponÃ­vel",

                        mensagem:
                            `Aula ${aulaCriada.numero} â€” ${aulaCriada.titulo}`,

                        aula_id:
                            aulaCriada.id,

                        url:
                            `/aulas/${aulaCriada.trimestre_id}`,
                    });

                    console.log(
                        `NotificaÃ§Ã£o enviada para: ${aluno.nome}`
                    );

                } catch (error) {

                    console.error(
                        `Erro ao notificar o aluno ${aluno.nome}:`,
                        error
                    );

                }
            }

        } catch (error) {

            console.error(
                "Aula criada, mas ocorreu um erro ao buscar os alunos para notificaÃ§Ã£o:",
                error
            );

        }

        return aulaCriada;
    },

    async buscarProximaAula(
        igrejaId: string
    ): Promise<{
        trimestre: Trimestre;
        aula: AulaComStatus | null;
    } | null> {

        const trimestre =
            await LessonRepository.buscarTrimestreAtivo(
                igrejaId
            );

        if (!trimestre) {
            return null;
        }

        const aulas =
            await this.listarAulasDoTrimestre(
                trimestre.id
            );

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const proximaAula =
            aulas.find((aula) => {

                const dataAula =
                    new Date(
                        `${aula.data}T00:00:00`
                    );

                return dataAula >= hoje;

            }) ?? null;

        return {
            trimestre,
            aula: proximaAula,
        };
    },

    async definirProfessor(
        aulaId: string,
        professorId: string | null
    ): Promise<Aula> {

        // 1. Atualiza o professor da aula
        const aulaAtualizada =
            await LessonRepository.atualizarAula(
                aulaId,
                {
                    professor_id: professorId,
                }
            );

        // 2. Se nÃ£o existe professor, nÃ£o hÃ¡ ninguÃ©m para notificar
        if (!professorId) {
            return aulaAtualizada;
        }

        // 3. Cria a notificaÃ§Ã£o para o novo professor
        try {

            await NotificationService.criar({

                pessoa_id:
                    professorId,

                tipo:
                    "NOVA_AULA_PROFESSOR",

                titulo:
                    "Nova aula atribuÃ­da a vocÃª",

                mensagem:
                    `VocÃª foi escalado para ministrar a aula ${aulaAtualizada.numero} â€” ${aulaAtualizada.titulo} em ${aulaAtualizada.data}.`,

                aula_id:
                    aulaAtualizada.id,

                url:
                    "/minhas-aulas",
            });

            console.log(
                `[AULA] Professor ${professorId} notificado com sucesso.`
            );

        } catch (error) {

            console.error(
                "[AULA] Aula atribuÃ­da, mas nÃ£o foi possÃ­vel enviar a notificaÃ§Ã£o:",
                error
            );

            // A aula continua atribuÃ­da mesmo se a notificaÃ§Ã£o falhar.
        }

        return aulaAtualizada;
    },

    async atualizarAula(
        aulaId: string,
        dados: Partial<
            Omit<
                Aula,
                "id" | "created_at" | "updated_at"
            >
        >
    ): Promise<Aula> {

        return LessonRepository.atualizarAula(
            aulaId,
            dados
        );
    },

    async excluirAula(
        aulaId: string
    ): Promise<void> {

        return LessonRepository.excluirAula(
            aulaId
        );
    },

};



