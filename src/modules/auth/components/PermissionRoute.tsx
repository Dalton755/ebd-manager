import { Navigate } from "react-router-dom";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
    type Permissao,
} from "@/shared/auth/permissions";

type Props = {
    permission?: Permissao;
    permissions?: Permissao[];
    children: React.ReactNode;
};

export function PermissionRoute({
    permission,
    permissions,
    children,
}: Props) {
    const { pessoa } = useAuth();

    const perfil =
        pessoa?.perfil === "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const permissoesNecessarias =
        permissions ?? (permission ? [permission] : []);

    const possuiPermissao =
        permissoesNecessarias.some((permissao) =>
            temPermissao(
                perfil,
                permissao
            )
        );

    if (!possuiPermissao) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <>{children}</>;
}