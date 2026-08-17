import type {
    PlanoCompleto,
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

export type LimitePlano =
  | "max_pessoas"
  | "max_classes"
  | "max_professores"
  | "max_secretarios"
  | "max_pastores"
  | "max_administradores"
  | "max_trimestres"
  | "max_trimestres_ativos"
  | "max_superintendentes";

export function temRecurso(
    plano: PlanoCompleto | null,
    recurso: RecursoCodigo
): boolean {

    if (!plano) {
        return false;
    }

    return plano.recursos.includes(recurso);
}

export function obterLimite(
    plano: PlanoCompleto | null,
    limite: LimitePlano
): number {

    if (!plano) {
        return 0;
    }

    return plano.limites[limite];
}

export function possuiLimite(
    plano: PlanoCompleto | null,
    limite: LimitePlano,
    quantidadeAtual: number
): boolean {

    const limitePlano =
        obterLimite(plano, limite);

    // -1 = ilimitado
    if (limitePlano === -1) {
        return true;
    }

    return quantidadeAtual < limitePlano;
}
