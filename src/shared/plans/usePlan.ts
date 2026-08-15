import {
    temRecurso,
    obterLimite,
    possuiLimite,
    type LimitePlano,
} from "@/shared/plans/PlanAccess";

import type {
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

import {
    useAuth,
} from "@/app/providers/AuthProvider";

export function usePlan() {

    const {
        plano,
    } = useAuth();

    return {

        plano,

        limites: plano?.limites ?? null,

        temRecurso: (
            recurso: RecursoCodigo
        ) =>
            temRecurso(
                plano,
                recurso
            ),

        obterLimite: (
            limite: LimitePlano
        ) =>
            obterLimite(
                plano,
                limite
            ),

        possuiLimite: (
            limite: LimitePlano,
            quantidadeAtual: number
        ) =>
            possuiLimite(
                plano,
                limite,
                quantidadeAtual
            ),

        podeAdicionar: (
            limite: LimitePlano,
            quantidadeAtual: number
        ) =>
            possuiLimite(
                plano,
                limite,
                quantidadeAtual
            ),
    };
}
