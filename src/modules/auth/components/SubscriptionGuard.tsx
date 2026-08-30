import type {
    ReactNode,
} from "react";

import {
    Navigate,
    useLocation,
} from "react-router-dom";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";


type Props = {
    children: ReactNode;
};


export function SubscriptionGuard({
    children,
}: Props) {

    const {
        loading,
        isSuperAdmin,
        assinaturaExpirada,
    } = useAuth();


    const location =
        useLocation();


    // =====================================================
    // AGUARDA CARREGAMENTO
    // =====================================================

    if (loading) {

        return null;

    }


    // =====================================================
    // SUPERADMIN
    // =====================================================

    if (isSuperAdmin) {

        return <>{children}</>;

    }


    // =====================================================
    // ROTAS PERMITIDAS APÓS EXPIRAÇÃO
    // =====================================================

    const rotasPermitidas = [

        "/planos",

        "/meu-plano",

        "/assinatura-expirada",

    ];


    const rotaPermitida =
        rotasPermitidas.some(
            (rota) =>
                location.pathname === rota
        );


    if (rotaPermitida) {

        return <>{children}</>;

    }


    // =====================================================
    // ASSINATURA EXPIRADA
    // =====================================================

    if (assinaturaExpirada) {

        return (
            <Navigate
                to="/assinatura-expirada"
                replace
            />
        );

    }


    return <>{children}</>;
}