import type { PlanoLimites } from "@/shared/plans/PlanTypes";

export type TipoLimite =
    | "pessoas"
    | "classes"
    | "professores"
    | "administradores"
    | "trimestres_ativos";

export class PlanLimitService {

    static limiteAtingido(
        limites: PlanoLimites,
        tipo: TipoLimite,
        quantidadeAtual: number
    ): boolean {

        const mapa: Record<TipoLimite, number> = {
            pessoas: limites.max_pessoas,
            classes: limites.max_classes,
            professores: limites.max_professores,
            administradores: limites.max_administradores,
            trimestres_ativos: limites.max_trimestres_ativos,
        };

        const limite = mapa[tipo];

        // -1 = ilimitado
        if (limite === -1) {
            return false;
        }

        return quantidadeAtual >= limite;
    }

    static podeAdicionar(
        limites: PlanoLimites,
        tipo: TipoLimite,
        quantidadeAtual: number
    ): boolean {
        return !this.limiteAtingido(
            limites,
            tipo,
            quantidadeAtual
        );
    }
}
