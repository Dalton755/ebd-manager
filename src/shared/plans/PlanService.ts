import type {
    PlanoCompleto,
    PlanoNome,
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

import { supabase } from "@/shared/lib/supabase/client";


export type AssinaturaInfo = {
    id: string;
    plano_id: string;
    status: string;
    inicio_em: string;
    fim_em: string | null;
    carencia_ate: string | null;
    oferta_id: string | null;
    preco_contratado: number | null;
    gratuito_contratado: boolean | null;
    duracao_gratuita_contratada_dias: number | null;
    preco_recorrente_contratado: number | null;
    periodo_recorrente_contratado: string | null;
};


export class PlanService {


    // =====================================================
    // BUSCA A ASSINATURA DA IGREJA
    // =====================================================

    static async buscarAssinaturaDaIgreja(
        igrejaId: string
    ): Promise<AssinaturaInfo | null> {

        const {
            data,
            error,
        } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                id,
                plano_id,
                status,
                inicio_em,
                fim_em,
                carencia_ate,
                oferta_id,
                preco_contratado,
                gratuito_contratado,
                duracao_gratuita_contratada_dias,
                preco_recorrente_contratado,
                periodo_recorrente_contratado
            `)
            .eq(
                "igreja_id",
                igrejaId
            )
            .eq(
                "status",
                "ATIVA"
            )
            .order(
                "inicio_em",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao buscar assinatura:",
                error
            );

            return null;
        }


        return data;
    }


    // =====================================================
    // VERIFICA SE A ASSINATURA ESTÁ EXPIRADA
    // =====================================================

    static assinaturaExpirada(
        assinatura: AssinaturaInfo | null
    ): boolean {

        if (!assinatura) {
            return false;
        }


        if (
            assinatura.status !==
            "ATIVA"
        ) {

            return true;
        }


        const agora =
            Date.now();


        if (
            assinatura.fim_em
        ) {

            const fim =
                new Date(
                    assinatura.fim_em
                );


            if (
                fim.getTime() >
                agora
            ) {

                return false;
            }


            if (
                assinatura.carencia_ate
            ) {

                const carencia =
                    new Date(
                        assinatura.carencia_ate
                    );


                if (
                    carencia.getTime() >
                    agora
                ) {

                    return false;
                }

            }


            return true;
        }


        if (
            assinatura.gratuito_contratado ===
            true
        ) {

            return false;
        }


        if (
            assinatura
                .preco_recorrente_contratado !=
            null
        ) {

            return true;
        }


        return false;
    }


    // =====================================================
    // BUSCA O PLANO VÁLIDO DA IGREJA
    // =====================================================

    static async buscarPlanoDaIgreja(
        igrejaId: string
    ): Promise<PlanoCompleto | null> {

        const assinatura =
            await this.buscarAssinaturaDaIgreja(
                igrejaId
            );


        if (!assinatura) {

            console.error(
                "Nenhuma assinatura encontrada para a igreja."
            );

            return null;
        }


        // =================================================
        // ASSINATURA EXPIRADA
        // =================================================

        if (
            this.assinaturaExpirada(
                assinatura
            )
        ) {

            console.warn(
                "A assinatura da igreja está expirada:",
                assinatura.fim_em
            );

            return null;
        }


        // =================================================
        // BUSCA O PLANO
        // =================================================

        const {
            data: plano,
            error: erroPlano,
        } = await supabase
            .schema("ebd")
            .from("planos")
            .select(`
                id,
                nome,
                descricao,
                ordem,
                ativo
            `)
            .eq(
                "id",
                assinatura.plano_id
            )
            .maybeSingle();


        if (erroPlano) {

            console.error(
                "Erro ao buscar plano:",
                erroPlano
            );

            return null;
        }


        if (
            !plano ||
            !plano.ativo
        ) {

            console.error(
                "Plano não encontrado ou inativo."
            );

            return null;
        }


        // =================================================
        // BUSCA LIMITES
        // =================================================

        const {
            data: limites,
            error: erroLimites,
        } = await supabase
            .schema("ebd")
            .from("plano_limites")
            .select(`
                max_pessoas,
                max_classes,
                max_professores,
                max_secretarios,
                max_pastores,
                max_administradores,
                max_trimestres,
                max_trimestres_ativos,
                max_superintendentes
            `)
            .eq(
                "plano_id",
                assinatura.plano_id
            )
            .maybeSingle();


        if (erroLimites) {

            console.error(
                "Erro ao buscar limites do plano:",
                erroLimites
            );

            return null;
        }


        if (!limites) {

            console.error(
                "Limites não encontrados para o plano:",
                assinatura.plano_id
            );

            return null;
        }


        // =================================================
        // BUSCA RECURSOS
        // =================================================

        const {
            data: recursos,
            error: erroRecursos,
        } = await supabase
            .schema("ebd")
            .from("plano_recursos")
            .select(`
                ativo,
                recursos (
                    codigo
                )
            `)
            .eq(
                "plano_id",
                assinatura.plano_id
            )
            .eq(
                "ativo",
                true
            );


        if (erroRecursos) {

            console.error(
                "Erro ao buscar recursos do plano:",
                erroRecursos
            );

            return null;
        }


        const codigos: RecursoCodigo[] = [];


        for (
            const item of recursos ?? []
        ) {

            const recurso =
                Array.isArray(
                    item.recursos
                )
                    ? item.recursos[0]
                    : item.recursos;


            if (
                recurso?.codigo
            ) {

                codigos.push(
                    recurso.codigo as RecursoCodigo
                );

            }

        }


        // =================================================
        // RETORNO
        // =================================================

        return {

            plano: {

                id:
                    plano.id,

                nome:
                    plano.nome as PlanoNome,

                descricao:
                    plano.descricao,

                ordem:
                    plano.ordem,

                ativo:
                    plano.ativo,

            },


            limites: {

                max_pessoas:
                    limites.max_pessoas,

                max_classes:
                    limites.max_classes,

                max_professores:
                    limites.max_professores,

                max_secretarios:
                    limites.max_secretarios,

                max_pastores:
                    limites.max_pastores,

                max_administradores:
                    limites.max_administradores,

                max_trimestres:
                    limites.max_trimestres,

                max_trimestres_ativos:
                    limites.max_trimestres_ativos,

                max_superintendentes:
                    limites.max_superintendentes,

            },


            recursos:
                codigos,

        };
    }
}
