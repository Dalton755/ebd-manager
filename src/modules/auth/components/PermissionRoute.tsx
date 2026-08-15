import { Navigate } from "react-router-dom";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
    type Permissao,
} from "@/shared/auth/permissions";

import {
    temRecurso,
} from "@/shared/plans/PlanAccess";

import type {
    RecursoCodigo,
} from "@/shared/plans/PlanTypes";

type Props = {
    permission?: Permissao;
    permissions?: Permissao[];
    recurso?: RecursoCodigo;
    children: React.ReactNode;
};

export function PermissionRoute({
    permission,
    permissions,
    recurso,
    children,
}: Props) {

    const {
        pessoa,
        plano,
    } = useAuth();

    const perfil =
        pessoa?.perfil === "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const permissoesNecessarias =
        permissions ??
        (permission ? [permission] : []);

    const possuiPermissao =
        permissoesNecessarias.some(
            (permissao) =>
                temPermissao(
                    perfil,
                    permissao
                )
        );

    const possuiRecurso =
        recurso
            ? temRecurso(
                plano,
                recurso
            )
            : true;

    if (
        !possuiPermissao ||
        !possuiRecurso
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <>{children}</>;
}
