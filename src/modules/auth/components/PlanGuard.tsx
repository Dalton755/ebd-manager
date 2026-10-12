import type { ReactNode } from "react";
import type { RecursoCodigo } from "@/shared/plans/PlanTypes";
// Permissões de perfis permanecem em PermissionRoute; nenhum recurso tem plano pago.
export function PlanGuard({ children }: { recurso: RecursoCodigo; children: ReactNode; fallback?: ReactNode }) {
    return <>{children}</>;
}
