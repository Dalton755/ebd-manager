import type { Aula } from "../types/Aula";
import type { Trimestre } from "../types/Trimestre";

import { LessonRepository } from "../repositories/LessonRepository";

export type AulaComStatus = Aula & {
    statusProfessor: "DEFINIDO" | "PENDENTE";
};

export const LessonService = {

    async listarTrimestres(): Promise<Trimestre[]> {
        return LessonRepository.listarTrimestres();
    },

    async buscarTrimestreAtivo(): Promise<Trimestre | null> {
        return LessonRepository.buscarTrimestreAtivo();
    },

    async criarTrimestre(
        numero: number,
        ano: number,
        tema: string
    ): Promise<Trimestre> {

        const trimestres =
            await LessonRepository.listarTrimestres();

        const jaExiste = trimestres.some(
            (trimestre) =>
                trimestre.numero === numero &&
                trimestre.ano === ano
        );

        if (jaExiste) {
            throw new Error(
                "Este trimestre já está cadastrado."
            );
        }

        return LessonRepository.criarTrimestre({
            numero,
            ano,
            tema,
            ativo: false,
        });
    },

    async ativarTrimestre(
        trimestreId: string
    ): Promise<void> {

        const trimestres =
            await LessonRepository.listarTrimestres();

        const trimestreAtivo =
            trimestres.find(
                (trimestre) => trimestre.ativo
            );

        if (
            trimestreAtivo &&
            trimestreAtivo.id !== trimestreId
        ) {
            await LessonRepository.atualizarTrimestre(
                trimestreAtivo.id,
                {
                    ativo: false,
                }
            );
        }

        await LessonRepository.atualizarTrimestre(
            trimestreId,
            {
                ativo: true,
            }
        );
    },

    async atualizarTrimestre(
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
                    "O número do trimestre deve estar entre 1 e 4."
                );
            }
        }

        if (
            dados.ano !== undefined &&
            (!Number.isInteger(dados.ano) ||
                dados.ano < 2000)
        ) {
            throw new Error(
                "Informe um ano válido."
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
        >
    ): Promise<Aula> {

        if (!aula.numero || aula.numero < 1) {
            throw new Error(
                "Informe um número de aula válido."
            );
        }

        if (!aula.titulo.trim()) {
            throw new Error(
                "Informe o título da aula."
            );
        }

        if (!aula.data) {
            throw new Error(
                "Informe a data da aula."
            );
        }

        return LessonRepository.criarAula(aula);
    },

    async buscarProximaAula(): Promise<{
        trimestre: Trimestre;
        aula: AulaComStatus | null;
    } | null> {

        const trimestre =
            await LessonRepository.buscarTrimestreAtivo();

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

        return LessonRepository.atualizarAula(
            aulaId,
            {
                professor_id: professorId,
            }
        );
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