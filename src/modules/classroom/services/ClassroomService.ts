import { ClassroomRepository } from "../repositories/ClassroomRepository";

import type {
    AlunoEmAula,
    AulaSala,
    PainelSalas,
    SalaAula,
} from "../types/Classroom";


function dataLocal(): string {

    const agora =
        new Date();

    const ano =
        agora.getFullYear();

    const mes =
        String(
            agora.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            agora.getDate()
        ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


function horarioEmMinutos(
    horario: string | null
): number | null {

    if (!horario) {
        return null;
    }


    const [
        hora,
        minuto,
    ] =
        horario
            .slice(0, 5)
            .split(":")
            .map(Number);


    return (
        hora * 60 +
        minuto
    );
}


function minutosAgora(): number {

    const agora =
        new Date();

    return (
        agora.getHours() * 60 +
        agora.getMinutes()
    );
}


function aulaAcontecendoAgora(
    aula: AulaSala,
    hoje: string,
    agoraMinutos: number
): boolean {

    if (
        aula.data !== hoje ||
        !aula.hora_inicio ||
        !aula.hora_fim
    ) {
        return false;
    }


    const inicio =
        horarioEmMinutos(
            aula.hora_inicio
        );

    const fim =
        horarioEmMinutos(
            aula.hora_fim
        );


    if (
        inicio === null ||
        fim === null
    ) {
        return false;
    }


    return (
        agoraMinutos >= inicio &&
        agoraMinutos <= fim
    );
}


function aulaAindaVaiAcontecer(
    aula: AulaSala,
    hoje: string,
    agoraMinutos: number
): boolean {

    if (aula.data > hoje) {
        return true;
    }


    if (aula.data < hoje) {
        return false;
    }


    const inicio =
        horarioEmMinutos(
            aula.hora_inicio
        );


    if (inicio === null) {
        return true;
    }


    return inicio > agoraMinutos;
}


export const ClassroomService = {

    async carregarPainel(
        igrejaId: string
    ): Promise<PainelSalas> {

        const hoje =
            dataLocal();

        const agoraMinutos =
            minutosAgora();


        const [
            classes,
            aulasBanco,
        ] =
            await Promise.all([
                ClassroomRepository
                    .listarClassesAtivas(
                        igrejaId
                    ),

                ClassroomRepository
                    .listarAulas(
                        igrejaId,
                        hoje
                    ),
            ]);


        const aulas =
            aulasBanco
                .filter(
                    (aula) =>
                        Boolean(
                            aula.classe_id
                        )
                )
                .map(
                    (aula) =>
                        aula as unknown as AulaSala
                );


        const aulaAtualPorClasse =
            new Map<
                string,
                AulaSala
            >();


        const proximaAulaPorClasse =
            new Map<
                string,
                AulaSala
            >();


        for (const aula of aulas) {

            if (
                aulaAcontecendoAgora(
                    aula,
                    hoje,
                    agoraMinutos
                )
            ) {

                if (
                    !aulaAtualPorClasse.has(
                        aula.classe_id
                    )
                ) {
                    aulaAtualPorClasse.set(
                        aula.classe_id,
                        aula
                    );
                }

                continue;
            }


            if (
                aulaAindaVaiAcontecer(
                    aula,
                    hoje,
                    agoraMinutos
                ) &&
                !proximaAulaPorClasse.has(
                    aula.classe_id
                )
            ) {

                proximaAulaPorClasse.set(
                    aula.classe_id,
                    aula
                );
            }
        }


        const aulasAtuais =
            [...aulaAtualPorClasse.values()];


        const presencas =
            await ClassroomRepository
                .listarPresencas(
                    aulasAtuais.map(
                        (aula) => aula.id
                    )
                );


        const pessoas =
            await ClassroomRepository
                .listarPessoas(
                    presencas.map(
                        (presenca) =>
                            presenca.pessoa_id
                    )
                );


        const pessoasPorId =
            new Map(
                pessoas.map(
                    (pessoa) => [
                        pessoa.id,
                        pessoa,
                    ]
                )
            );


        const alunosPorAula =
            new Map<
                string,
                AlunoEmAula[]
            >();


        for (const presenca of presencas) {

            const pessoa =
                pessoasPorId.get(
                    presenca.pessoa_id
                );


            if (!pessoa) {
                continue;
            }


            const aluno: AlunoEmAula = {

                presencaId:
                    presenca.id,

                pessoaId:
                    presenca.pessoa_id,

                nome:
                    pessoa.nome,

                horaCheckin:
                    presenca.hora_checkin,

                localizacaoStatus:
                    presenca.localizacao_status,

                statusValidacao:
                    presenca.status_validacao,
            };


            const lista =
                alunosPorAula.get(
                    presenca.aula_id
                ) ?? [];


            lista.push(
                aluno
            );


            alunosPorAula.set(
                presenca.aula_id,
                lista
            );
        }


        const salas: SalaAula[] =
            classes.map(
                (classe) => {

                    const aulaAtual =
                        aulaAtualPorClasse.get(
                            classe.id
                        ) ?? null;


                    const proximaAula =
                        proximaAulaPorClasse.get(
                            classe.id
                        ) ?? null;


                    const alunosEmAula =
                        aulaAtual
                            ? (
                                alunosPorAula.get(
                                    aulaAtual.id
                                ) ?? []
                            )
                            : [];


                    return {

                        classeId:
                            classe.id,

                        classeNome:
                            classe.nome,

                        classeDescricao:
                            classe.descricao ?? null,

                        classeCor:
                            classe.cor ?? null,

                        status:
                            aulaAtual
                                ? "EM_AULA"
                                : "SEM_ATIVIDADE",

                        aulaAtual,

                        proximaAula,

                        alunosEmAula,
                    };
                }
            );


        const salasEmAula =
            salas.filter(
                (sala) =>
                    sala.status ===
                    "EM_AULA"
            ).length;


        const alunosEmAula =
            salas.reduce(
                (
                    total,
                    sala
                ) =>
                    total +
                    sala.alunosEmAula.length,
                0
            );


        return {

            totalSalas:
                salas.length,

            salasEmAula,

            alunosEmAula,

            salas,
        };
    },

};