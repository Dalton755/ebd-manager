import type { ReactNode } from "react";

import { usePlan } from "@/shared/plans/usePlan";
import type { RecursoCodigo } from "@/shared/plans/PlanTypes";

type Props = {
    recurso: RecursoCodigo;
    children: ReactNode;
    fallback?: ReactNode;
};

export function PlanGuard({
    recurso,
    children,
    fallback = null,
}: Props) {
    const { temRecurso, loading } = usePlan();

    if (loading) {
        return null;
    }

    if (!temRecurso(recurso)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
