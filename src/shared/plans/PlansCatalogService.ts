import type {
    PlanoCompleto,
    PlanoNome,
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

import { supabase } from "@/shared/lib/supabase/client";

export class PlansCatalogService {

    static async listarPlanos(): Promise<PlanoCompleto[]> {

        const {
            data: planos,
            error: erroPlanos,
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
            .eq("ativo", true)
            .order("ordem", {
                ascending: true,
            });

        if (erroPlanos) {
            throw erroPlanos;
        }

        if (!planos) {
            return [];
        }

        const resultado: PlanoCompleto[] = [];

        for (const plano of planos) {

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
                    max_trimestres_ativos
                `)
                .eq("plano_id", plano.id)
                .maybeSingle();

            if (erroLimites) {
                throw erroLimites;
            }

            if (!limites) {
                continue;
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
                .eq("plano_id", plano.id)
                .eq("ativo", true);

            if (erroRecursos) {
                throw erroRecursos;
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

            resultado.push({
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
                    max_secretarios: limites.max_secretarios,
                    max_pastores: limites.max_pastores,
                    max_administradores:
                        limites.max_administradores,
                    max_trimestres:
                        limites.max_trimestres,
                    max_trimestres_ativos:
                        limites.max_trimestres_ativos,
                },

                recursos: codigos,
            });
        }

        return resultado;
    }
}