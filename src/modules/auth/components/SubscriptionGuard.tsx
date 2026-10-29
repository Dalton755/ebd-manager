import type { ReactNode } from "react";
// Assinatura não é mais requisito de acesso ao EBD Manager.
export function SubscriptionGuard({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
