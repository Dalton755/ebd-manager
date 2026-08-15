import type {
    PlanoCompleto,
    PlanoNome,
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

import { supabase } from "@/shared/lib/supabase/client";

export class PlanService {

    static async buscarPlanoDaIgreja(
        igrejaId: string
    ): Promise<PlanoCompleto | null> {

        const {
            data: assinatura,
            error: erroAssinatura,
        } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                plano_id,
                status,
                planos (
                    id,
                    nome,
                    descricao,
                    ordem,
                    ativo
                )
            `)
            .eq("igreja_id", igrejaId)
            .eq("status", "ATIVA")
            .maybeSingle();

        if (erroAssinatura) {
            console.error(
                "Erro ao buscar assinatura:",
                erroAssinatura
            );

            return null;
        }

        if (!assinatura?.plano_id || !assinatura.planos) {
            console.error(
                "Nenhuma assinatura ativa encontrada para a igreja."
            );

            return null;
        }

        const plano = Array.isArray(assinatura.planos)
            ? assinatura.planos[0]
            : assinatura.planos;

        if (!plano) {
            return null;
        }

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
                max_administradores,
                max_trimestres_ativos
            `)
            .eq("plano_id", assinatura.plano_id)
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
            .eq("plano_id", assinatura.plano_id)
            .eq("ativo", true);

        if (erroRecursos) {
            console.error(
                "Erro ao buscar recursos do plano:",
                erroRecursos
            );

            return null;
        }

        const codigos: RecursoCodigo[] = [];

        for (const item of recursos ?? []) {

            const recurso = Array.isArray(item.recursos)
                ? item.recursos[0]
                : item.recursos;

            if (recurso?.codigo) {
                codigos.push(
                    recurso.codigo as RecursoCodigo
                );
            }
        }

        return {
            plano: {
                id: plano.id,
                nome: plano.nome as PlanoNome,
                descricao: plano.descricao,
                ordem: plano.ordem,
                ativo: plano.ativo,
            },

            limites: {
                max_pessoas: limites.max_pessoas,
                max_classes: limites.max_classes,
                max_professores: limites.max_professores,
                max_administradores: limites.max_administradores,
                max_trimestres_ativos:
                    limites.max_trimestres_ativos,
            },

            recursos: codigos,
        };
    }
}
