import {
    useEffect,
    useState,
} from "react";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase } from "@/shared/lib/supabase/client";


type AulaEmAndamento = {
    id: string;
    numero: number;
    titulo: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
};


function obterDataLocal(): string {

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
    horario: string
): number {

    const [
        hora,
        minuto,
    ] = horario
        .slice(0, 5)
        .split(":")
        .map(Number);

    return (
        hora * 60 +
        minuto
    );
}


function agoraEmMinutos(): number {

    const agora =
        new Date();

    return (
        agora.getHours() * 60 +
        agora.getMinutes()
    );
}


export function useClassroomStatus() {

    const {
        pessoa,
    } = useAuth();

    const [
        emAula,
        setEmAula,
    ] = useState(false);

    const [
        aulaAtual,
        setAulaAtual,
    ] =
        useState<AulaEmAndamento | null>(
            null
        );


    useEffect(() => {

        let ativo = true;


        async function verificarEmAula() {

            if (
                pessoa?.perfil !== "ALUNO" ||
                !pessoa.id ||
                !pessoa.igreja_id ||
                !pessoa.classe_id
            ) {

                if (ativo) {
                    setEmAula(false);
                    setAulaAtual(null);
                }

                return;
            }


            try {

                const hoje =
                    obterDataLocal();

                const {
                    data: aulas,
                    error: aulasError,
                } =
                    await supabase
                        .schema("ebd")
                        .from("aulas")
                        .select(`
                            id,
                            numero,
                            titulo,
                            data,
                            hora_inicio,
                            hora_fim,
                            trimestre:trimestres!aulas_trimestre_id_fkey!inner (
                                ativo,
                                igreja_id
                            )
                        `)
                        .eq(
                            "data",
                            hoje
                        )

                        .eq(
                            "cancelada",
                            false
                        )
                        .eq(
                            "classe_id",
                            pessoa.classe_id
                        )
                        .eq(
                            "trimestre.ativo",
                            true
                        )
                        .eq(
                            "trimestre.igreja_id",
                            pessoa.igreja_id
                        )
                        .not(
                            "hora_inicio",
                            "is",
                            null
                        )
                        .not(
                            "hora_fim",
                            "is",
                            null
                        );


                if (aulasError) {
                    throw aulasError;
                }


                const minutosAgora =
                    agoraEmMinutos();


                const aulaNoHorario =
                    (aulas ?? []).find(
                        (aula) => {

                            if (
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

                            return (
                                minutosAgora >= inicio &&
                                minutosAgora <= fim
                            );
                        }
                    );


                if (!aulaNoHorario) {

                    if (ativo) {
                        setEmAula(false);
                        setAulaAtual(null);
                    }

                    return;
                }


                const {
                    data: presenca,
                    error: presencaError,
                } =
                    await supabase
                        .schema("ebd")
                        .from("presencas")
                        .select("id")
                        .eq(
                            "pessoa_id",
                            pessoa.id
                        )
                        .eq(
                            "aula_id",
                            aulaNoHorario.id
                        )
                        .maybeSingle();


                if (presencaError) {
                    throw presencaError;
                }


                if (!ativo) {
                    return;
                }


                if (presenca) {

                    setEmAula(true);

                    setAulaAtual({
                        id:
                            aulaNoHorario.id,

                        numero:
                            aulaNoHorario.numero,

                        titulo:
                            aulaNoHorario.titulo,

                        data:
                            aulaNoHorario.data,

                        hora_inicio:
                            aulaNoHorario.hora_inicio,

                        hora_fim:
                            aulaNoHorario.hora_fim,
                    });

                } else {

                    setEmAula(false);
                    setAulaAtual(null);
                }


            } catch (error) {

                console.error(
                    "Erro ao verificar status da sala de aula:",
                    error
                );

                if (ativo) {
                    setEmAula(false);
                    setAulaAtual(null);
                }
            }
        }


        void verificarEmAula();


        /*
         * Também verificamos periodicamente.
         *
         * Isso é importante porque o relógio muda mesmo que
         * nenhuma informação seja alterada no banco.
         *
         * Exemplo:
         * check-in às 19:40
         * aula começa às 20:00
         * o indicador precisa aparecer sozinho às 20:00.
         */
        const intervalo =
            window.setInterval(
                () => {
                    void verificarEmAula();
                },
                30_000
            );


        let canal:
            ReturnType<
                typeof supabase.channel
            > | null =
            null;


        if (pessoa?.id) {

            canal =
                supabase
                    .channel(
                        `status-em-aula-${pessoa.id}`
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "ebd",
                            table: "presencas",
                            filter:
                                `pessoa_id=eq.${pessoa.id}`,
                        },
                        () => {
                            void verificarEmAula();
                        }
                    )
                    .subscribe();
        }


        return () => {

            ativo = false;

            window.clearInterval(
                intervalo
            );

            if (canal) {
                void supabase.removeChannel(
                    canal
                );
            }
        };

    }, [
        pessoa?.id,
        pessoa?.perfil,
        pessoa?.igreja_id,
        pessoa?.classe_id,
    ]);


    return {
        emAula,
        aulaAtual,
    };
}