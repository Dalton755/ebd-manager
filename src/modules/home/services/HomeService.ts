import { supabase } from "@/shared/lib/supabase/client";

export type ProximaAulaHome = {
    id: string;
    numero: number;
    titulo: string;
    data: string;
    horario: string;
    link_drive: string | null;
    professor: string | null;
};

export type AulaEscalaHome = {
    id: string;
    numero: number;
    titulo: string;
    data: string;
    horario: string;
    link_drive: string | null;
};

export type FrequenciaHome = {
    totalAulas: number;
    presencas: number;
    faltas: number;
    sequencia: number;
    participouUltima: boolean;
};

export class HomeService {

    // =====================================================
    // PRÓXIMA AULA
    // =====================================================

    static async buscarProximaAula(
        classeId?: string
    ): Promise<ProximaAulaHome | null> {

        const hoje = new Date();

        const dataHoje =
            `${hoje.getFullYear()}-${String(
                hoje.getMonth() + 1
            ).padStart(2, "0")}-${String(
                hoje.getDate()
            ).padStart(2, "0")}`;


        let consulta =
            supabase
                .schema("ebd")
                .from("aulas")
                .select(`
                id,
                numero,
                titulo,
                data,
                hora_inicio,
                hora_fim,
                link_drive,
                classe_id,

                professor:pessoas!aulas_professor_id_fkey (
                    nome
                ),

                trimestre:trimestres!aulas_trimestre_id_fkey (
                    ativo
                )
            `)
                .eq(
                    "cancelada",
                    false
                )
                .gte(
                    "data",
                    dataHoje
                )
                .eq(
                    "trimestre.ativo",
                    true
                );


        /*
         * Quando uma classe é informada,
         * mostra somente aulas daquela classe.
         *
         * Usado principalmente para o perfil ALUNO.
         */
        if (classeId) {

            consulta =
                consulta.eq(
                    "classe_id",
                    classeId
                );

        }


        const {
            data,
            error,
        } =
            await consulta
                .order(
                    "data",
                    {
                        ascending: true,
                    }
                )
                .order(
                    "numero",
                    {
                        ascending: true,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {
            return null;
        }


        const professor =
            Array.isArray(
                data.professor
            )
                ? data.professor[0]
                : data.professor;


        return {
            id:
                data.id,

            numero:
                data.numero,

            titulo:
                data.titulo,

            data:
                data.data,

            horario:
                data.hora_inicio &&
                    data.hora_fim
                    ? `${data.hora_inicio.slice(
                        0,
                        5
                    )} às ${data.hora_fim.slice(
                        0,
                        5
                    )}`
                    : "Horário não definido",

            link_drive:
                data.link_drive,

            professor:
                professor?.nome ??
                null,
        };
    }

    // =====================================================
    // ESCALA DO PROFESSOR
    // =====================================================

    static async buscarEscalaProfessor(
        pessoaId: string
    ): Promise<AulaEscalaHome[]> {

        const hoje = new Date();

        const dataHoje =
            `${hoje.getFullYear()}-${String(
                hoje.getMonth() + 1
            ).padStart(2, "0")}-${String(
                hoje.getDate()
            ).padStart(2, "0")}`;

        const { data, error } =
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
                    link_drive,
                    trimestre:trimestres!aulas_trimestre_id_fkey (
                        ativo
                    )
                `)
                .eq(
                    "professor_id",
                    pessoaId
                )
                .eq(
                    "cancelada",
                    false
                )
                .gte("data", dataHoje)
                .eq("trimestre.ativo", true)
                .order("data", {
                    ascending: true,
                })
                .order("numero", {
                    ascending: true,
                });

        if (error) {
            throw error;
        }

        return (data ?? []).map(
            (aula) => ({
                id: aula.id,
                numero: aula.numero,
                titulo: aula.titulo,
                data: aula.data,
                horario:
                    aula.hora_inicio &&
                        aula.hora_fim
                        ? `${aula.hora_inicio.slice(0, 5)} às ${aula.hora_fim.slice(0, 5)}`
                        : "Horário não definido",
                link_drive:
                    aula.link_drive,
            })
        );
    }


    // =====================================================
    // FREQUÊNCIA DO ALUNO
    // =====================================================

    static async buscarFrequenciaAluno(
        pessoaId: string,
        classeId?: string | null
    ): Promise<FrequenciaHome> {

        /*
 * ALUNO SEM CLASSE:
 * não deve contabilizar aulas de outras classes.
 */
        if (classeId === null) {

            return {
                totalAulas: 0,
                presencas: 0,
                faltas: 0,
                sequencia: 0,
                participouUltima: false,
            };

        }


        let consultaAulas =
            supabase
                .schema("ebd")
                .from("aulas")
                .select(`
            id,
            data,
            classe_id,

            trimestre:trimestres!aulas_trimestre_id_fkey!inner (
                ativo
            )
        `)
                .eq(
                    "cancelada",
                    false
                )
                .eq(
                    "trimestre.ativo",
                    true
                );


        /*
         * Quando a classe é informada,
         * contabiliza somente aulas dessa classe.
         *
         * Para chamadas antigas sem classe,
         * preservamos o comportamento anterior.
         */
        if (classeId) {

            consultaAulas =
                consultaAulas.eq(
                    "classe_id",
                    classeId
                );

        }


        const {
            data: aulas,
            error: aulasError,
        } =
            await consultaAulas
                .order(
                    "data",
                    {
                        ascending: true,
                    }
                );

        if (aulasError) {
            throw aulasError;
        }

        const listaAulas =
            aulas ?? [];

        if (!listaAulas.length) {
            return {
                totalAulas: 0,
                presencas: 0,
                faltas: 0,
                sequencia: 0,
                participouUltima: false,
            };
        }

        const aulaIds =
            listaAulas.map(
                (aula) => aula.id
            );

        const { data: presencas, error: presencasError } =
            await supabase
                .schema("ebd")
                .from("presencas")
                .select(`
                    aula_id,
                    data
                `)
                .eq(
                    "pessoa_id",
                    pessoaId
                )
                .in(
                    "aula_id",
                    aulaIds
                );

        if (presencasError) {
            throw presencasError;
        }

        const presencasSet =
            new Set(
                (presencas ?? [])
                    .map(
                        (presenca) =>
                            presenca.aula_id
                    )
                    .filter(Boolean)
            );

        const aulasRealizadas =
            listaAulas.filter(
                (aula) =>
                    new Date(
                        `${aula.data}T00:00:00`
                    ) <= new Date()
            );

        const totalAulas =
            aulasRealizadas.length;

        const quantidadePresencas =
            aulasRealizadas.filter(
                (aula) =>
                    presencasSet.has(
                        aula.id
                    )
            ).length;

        const ultimaAula =
            aulasRealizadas[
            aulasRealizadas.length - 1
            ];

        const participouUltima =
            ultimaAula
                ? presencasSet.has(
                    ultimaAula.id
                )
                : false;

        let sequencia = 0;

        for (
            let i =
                aulasRealizadas.length - 1;
            i >= 0;
            i--
        ) {

            if (
                presencasSet.has(
                    aulasRealizadas[i].id
                )
            ) {
                sequencia++;
            } else {
                break;
            }
        }

        return {
            totalAulas,
            presencas:
                quantidadePresencas,
            faltas:
                totalAulas -
                quantidadePresencas,
            sequencia,
            participouUltima,
        };
    }
}