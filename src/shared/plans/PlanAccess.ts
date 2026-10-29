import type { PlanoCompleto, RecursoCodigo } from "@/shared/plans/PlanTypes";
export type LimitePlano = "max_pessoas" | "max_classes" | "max_professores" | "max_secretarios" | "max_pastores" | "max_administradores" | "max_trimestres" | "max_trimestres_ativos" | "max_superintendentes";
export function temRecurso(_plano: PlanoCompleto | null, _recurso: RecursoCodigo): boolean { return true; }
export function obterLimite(_plano: PlanoCompleto | null, limite: LimitePlano): number {
    return limite === "max_trimestres_ativos" ? 1 : -1;
}
export function possuiLimite(plano: PlanoCompleto | null, limite: LimitePlano, quantidadeAtual: number): boolean {
    const maximo = obterLimite(plano, limite);
    return maximo === -1 || quantidadeAtual < maximo;
}
