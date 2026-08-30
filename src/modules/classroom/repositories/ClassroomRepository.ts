import { supabase } from "@/shared/lib/supabase/client";


export const ClassroomRepository = {

    async listarClassesAtivas(
        igrejaId: string
    ) {

        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("classes")
                .select(`
                    id,
                    nome,
                    descricao,
                    cor,
                    ativa
                `)
                .eq(
                    "igreja_id",
                    igrejaId
                )
                .eq(
                    "ativa",
                    true
                )
                .order(
                    "nome",
                    {
                        ascending: true,
                    }
                );


        if (error) {
            throw error;
        }


        return data ?? [];
    },


    async listarAulas(
        igrejaId: string,
        dataInicial: string
    ) {

        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("aulas")
                .select(`
                    id,
                    classe_id,
                    numero,
                    titulo,
                    data,
                    hora_inicio,
                    hora_fim,
                    professor_id,

                    professor:pessoas!aulas_professor_id_fkey (
                        id,
                        nome
                    ),

                    trimestre:trimestres!aulas_trimestre_id_fkey!inner (
                        id,
                        ativo,
                        igreja_id
                    )
                `)
                .eq(
                    "cancelada",
                    false
                )
                .eq(
                    "trimestre.ativo",
                    true
                )
                .eq(
                    "trimestre.igreja_id",
                    igrejaId
                )
                .gte(
                    "data",
                    dataInicial
                )
                .order(
                    "data",
                    {
                        ascending: true,
                    }
                )
                .order(
                    "hora_inicio",
                    {
                        ascending: true,
                    }
                );


        if (error) {
            throw error;
        }


        return data ?? [];
    },


    async listarPresencas(
        aulaIds: string[]
    ) {

        if (aulaIds.length === 0) {
            return [];
        }


        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("presencas")
                .select(`
                    id,
                    aula_id,
                    pessoa_id,
                    hora_checkin,
                    localizacao_status,
                    status_validacao
                `)
                .in(
                    "aula_id",
                    aulaIds
                )
                .order(
                    "hora_checkin",
                    {
                        ascending: true,
                    }
                );


        if (error) {
            throw error;
        }


        return data ?? [];
    },


    async listarPessoas(
        pessoaIds: string[]
    ) {

        if (pessoaIds.length === 0) {
            return [];
        }


        const idsUnicos =
            [...new Set(pessoaIds)];


        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    nome,
                    classe_id
                `)
                .in(
                    "id",
                    idsUnicos
                );


        if (error) {
            throw error;
        }


        return data ?? [];
    },

};