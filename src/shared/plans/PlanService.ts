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

    static async buscarPlanoDaIgreja(_igrejaId: string): Promise<PlanoCompleto | null> {
        const recursos: RecursoCodigo[] = ["ALUNOS_CLASSES","APRESENTACOES_PDF","AULAS","CHECKIN","CHECKIN_LOCALIZACAO","CLASSES","DASHBOARD","FINANCEIRO","GESTAO_USUARIOS","NOTIFICACAO_PUSH","NOTIFICACOES","PESSOAS","PRESENCAS","PROFESSORES","RELATORIOS","SOLICITACOES_SENHA","TRIMESTRES"];
        return {
            plano: { id: "ebd-gratuito", nome: "Igreja" as PlanoNome, descricao: "Todos os recursos gratuitos", ordem: 1, ativo: true },
            limites: { max_pessoas: -1, max_classes: -1, max_professores: -1, max_secretarios: -1, max_pastores: -1, max_administradores: -1, max_trimestres: -1, max_trimestres_ativos: 1, max_superintendentes: -1 },
            recursos,
        };
    }
}
