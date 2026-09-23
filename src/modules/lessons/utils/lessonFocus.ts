import type { Aula } from "../types/Aula";

export type EstadoAula =
    | "AGORA"
    | "HOJE"
    | "PROXIMA"
    | "ENCERRADA";

function dataLocal(
    data: Date
) {
    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            data.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
}

function dataHoraAula(
    aula: Aula,
    usarFim = false
) {
    const hora =
        (
            usarFim
                ? aula.hora_fim
                : aula.hora_inicio
        )
            ?.slice(
                0,
                5
            ) ??
        (
            usarFim
                ? "23:59"
                : "00:00"
        );

    return new Date(
        `${aula.data}T${hora}:00`
    );
}

export function obterAulaEmFoco(
    aulas: Aula[],
    agora = new Date()
): Aula | null {

    const disponiveis =
        aulas.filter(
            (aula) =>
                !aula.cancelada
        );

    if (
        disponiveis.length ===
        0
    ) {
        return null;
    }

    const hoje =
        dataLocal(
            agora
        );

    const aulasHoje =
        disponiveis
            .filter(
                (aula) =>
                    aula.data ===
                    hoje
            )
            .sort(
                (a, b) =>
                    dataHoraAula(a)
                        .getTime() -
                    dataHoraAula(b)
                        .getTime()
            );

    const emAndamento =
        aulasHoje.find(
            (aula) => {

                const inicio =
                    dataHoraAula(
                        aula
                    )
                        .getTime();

                const fim =
                    dataHoraAula(
                        aula,
                        true
                    )
                        .getTime();

                return (
                    agora.getTime() >=
                        inicio &&
                    agora.getTime() <=
                        fim
                );
            }
        );

    if (emAndamento) {
        return emAndamento;
    }

    const proximaHoje =
        aulasHoje.find(
            (aula) =>
                dataHoraAula(
                    aula
                )
                    .getTime() >=
                agora.getTime()
        );

    if (proximaHoje) {
        return proximaHoje;
    }

    if (
        aulasHoje.length >
        0
    ) {
        return aulasHoje[
            aulasHoje.length - 1
        ];
    }

    const futuras =
        disponiveis
            .filter(
                (aula) =>
                    aula.data >
                    hoje
            )
            .sort(
                (a, b) =>
                    dataHoraAula(a)
                        .getTime() -
                    dataHoraAula(b)
                        .getTime()
            );

    if (
        futuras.length >
        0
    ) {
        return futuras[0];
    }

    return [
        ...disponiveis,
    ]
        .sort(
            (a, b) =>
                dataHoraAula(b)
                    .getTime() -
                dataHoraAula(a)
                    .getTime()
        )[0];
}

export function obterEstadoAula(
    aula: Aula,
    agora = new Date()
): {
    estado: EstadoAula;
    rotulo: string;
} {

    const hoje =
        dataLocal(
            agora
        );

    if (
        aula.data ===
        hoje
    ) {
        const inicio =
            dataHoraAula(
                aula
            )
                .getTime();

        const fim =
            dataHoraAula(
                aula,
                true
            )
                .getTime();

        if (
            agora.getTime() >=
                inicio &&
            agora.getTime() <=
                fim
        ) {
            return {
                estado:
                    "AGORA",
                rotulo:
                    "Em andamento",
            };
        }

        if (
            agora.getTime() <
            inicio
        ) {
            return {
                estado:
                    "HOJE",
                rotulo:
                    "Aula de hoje",
            };
        }

        return {
            estado:
                "HOJE",
            rotulo:
                "Aula de hoje",
        };
    }

    if (
        aula.data >
        hoje
    ) {
        return {
            estado:
                "PROXIMA",
            rotulo:
                "Próxima aula",
        };
    }

    return {
        estado:
            "ENCERRADA",
        rotulo:
            "Última aula",
    };
}

export function ordenarAulasPorRelevancia(
    aulas: Aula[],
    agora = new Date()
): Aula[] {

    const foco =
        obterAulaEmFoco(
            aulas,
            agora
        );

    if (!foco) {
        return [
            ...aulas,
        ];
    }

    const hoje =
        dataLocal(
            agora
        );

    const demais =
        aulas
            .filter(
                (aula) =>
                    aula.id !==
                    foco.id
            )
            .sort(
                (a, b) => {

                    const aFutura =
                        a.data >=
                        hoje;

                    const bFutura =
                        b.data >=
                        hoje;

                    if (
                        aFutura !==
                        bFutura
                    ) {
                        return aFutura
                            ? -1
                            : 1;
                    }

                    if (
                        aFutura
                    ) {
                        return (
                            dataHoraAula(
                                a
                            )
                                .getTime() -
                            dataHoraAula(
                                b
                            )
                                .getTime()
                        );
                    }

                    return (
                        dataHoraAula(
                            b
                        )
                            .getTime() -
                        dataHoraAula(
                            a
                        )
                            .getTime()
                    );
                }
            );

    return [
        foco,
        ...demais,
    ];
}
