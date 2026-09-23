import {
    BookOpen,
    ClipboardCheck,
    Home,
    Menu,
    Users,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
} from "@/shared/auth/permissions";

type Props = {
    onOpenMenu: () => void;
};

type Item = {
    label: string;
    to: string;
    icon: React.ElementType;
    ativo: (
        pathname: string
    ) => boolean;
};

export function MobileBottomNav({
    onOpenMenu,
}: Props) {

    const {
        pessoa,
    } =
        useAuth();

    const location =
        useLocation();

    const navigate =
        useNavigate();

    const perfil =
        pessoa?.perfil ===
        "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const itens: Item[] = [];

    const rotaInicio =
        temPermissao(
            perfil,
            "VER_DASHBOARD"
        )
            ? "/"
            : "/inicio";

    itens.push({
        label:
            "Início",
        to:
            rotaInicio,
        icon:
            Home,
        ativo: (
            pathname
        ) =>
            rotaInicio === "/"
                ? pathname === "/"
                : pathname ===
                    "/inicio",
    });

    if (
        temPermissao(
            perfil,
            "VER_AULAS"
        ) ||
        temPermissao(
            perfil,
            "VER_MINHAS_AULAS"
        )
    ) {

        const minhasAulas =
            pessoa?.perfil ===
                "PROFESSOR" ||
            pessoa?.perfil ===
                "ALUNO";

        const rotaAulas =
            minhasAulas
                ? "/minhas-aulas"
                : "/aulas";

        itens.push({
            label:
                "Aulas",
            to:
                rotaAulas,
            icon:
                BookOpen,
            ativo: (
                pathname
            ) =>
                pathname.startsWith(
                    rotaAulas
                ) ||
                (
                    !minhasAulas &&
                    pathname.startsWith(
                        "/aulas/"
                    )
                ),
        });
    }

    if (
        temPermissao(
            perfil,
            "REGISTRAR_PRESENCA"
        )
    ) {

        itens.push({
            label:
                "Chamada",
            to:
                "/checkin",
            icon:
                ClipboardCheck,
            ativo: (
                pathname
            ) =>
                pathname ===
                "/checkin",
        });

    } else if (
        temPermissao(
            perfil,
            "FAZER_CHECKIN"
        )
    ) {

        itens.push({
            label:
                "Check-in",
            to:
                "/aluno/checkin",
            icon:
                ClipboardCheck,
            ativo: (
                pathname
            ) =>
                pathname ===
                "/aluno/checkin",
        });
    }

    if (
        temPermissao(
            perfil,
            "VER_PESSOAS"
        )
    ) {

        itens.push({
            label:
                "Pessoas",
            to:
                "/pessoas",
            icon:
                Users,
            ativo: (
                pathname
            ) =>
                pathname.startsWith(
                    "/pessoas"
                ),
        });
    }

    return (
        <nav
            aria-label="Navegação principal"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/92 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
        >
            <div className="mx-auto flex max-w-lg items-stretch justify-around">

                {itens
                    .slice(
                        0,
                        4
                    )
                    .map(
                        (
                            item
                        ) => {

                            const Icon =
                                item.icon;

                            const ativo =
                                item.ativo(
                                    location.pathname
                                );

                            return (
                                <button
                                    key={
                                        item.to
                                    }
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            item.to
                                        )
                                    }
                                    className={
                                        ativo
                                            ? "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl bg-blue-50 px-2 py-2 text-blue-700"
                                            : "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-slate-500 transition active:bg-slate-100"
                                    }
                                >
                                    <Icon
                                        size={
                                            20
                                        }
                                        strokeWidth={
                                            ativo
                                                ? 2.4
                                                : 2
                                        }
                                    />

                                    <span className="max-w-full truncate text-[11px] font-semibold">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }
                    )}


                <button
                    type="button"
                    onClick={
                        onOpenMenu
                    }
                    className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-slate-500"
                >
                    <Menu
                        size={
                            20
                        }
                    />

                    <span className="text-[11px] font-semibold">
                        Menu
                    </span>
                </button>

            </div>
        </nav>
    );
}
