import { NavLink } from "react-router-dom";

import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    History,
    UserCog,
    UserRound,
    MapPin,
    KeyRound,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import {
    temPermissao,
    type Permissao,
} from "@/shared/auth/permissions";

type MenuItemProps = {
    to: string;
    icon: React.ElementType;
    label: string;
    permission: Permissao;
    end?: boolean;
};

export function Sidebar() {

    const { pessoa } = useAuth();

    function temAcesso(
        permissao: Permissao
    ) {
        if (
            !pessoa ||
            pessoa.perfil === "PENDENTE"
        ) {
            return false;
        }

        return temPermissao(
            pessoa.perfil,
            permissao
        );
    }

    function MenuItem({
        to,
        icon: Icon,
        label,
        permission,
        end = false,
    }: MenuItemProps) {

        if (!temAcesso(permission)) {
            return null;
        }

        return (
            <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                    `block rounded-md px-3 py-2 transition ${isActive
                        ? "bg-slate-100 font-semibold text-slate-900"
                        : "hover:bg-muted"
                    }`
                }
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{label}</span>
                </div>
            </NavLink>
        );
    }

    const temMenuAdministrativo =
        temAcesso("VER_DASHBOARD") ||
        temAcesso("VER_PESSOAS") ||
        temAcesso("GERENCIAR_CLASSES") ||
        temAcesso("VER_CLASSES") ||
        temAcesso("GERENCIAR_AULAS") ||
        temAcesso("VER_AULAS");

    const temMenuPresencas =
        temAcesso("REGISTRAR_PRESENCA") ||
        temAcesso("VER_PRESENCAS");

    const temMenuAluno =
        temAcesso("VER_MINHAS_AULAS") ||
        temAcesso("FAZER_CHECKIN") ||
        temAcesso("VER_MINHAS_PRESENCAS");

    return (
        <aside className="flex h-full w-full flex-col">

            <h1 className="mb-8 text-2xl font-bold">
                EBD Manager
            </h1>

            <nav className="space-y-2">

                {/* MENU ADMINISTRATIVO */}

                {temMenuAdministrativo && (
                    <>
                        <MenuItem
                            to="/"
                            end
                            icon={LayoutDashboard}
                            label="Dashboard"
                            permission="VER_DASHBOARD"
                        />

                        <MenuItem
                            to="/pessoas"
                            icon={Users}
                            label="Pessoas"
                            permission="VER_PESSOAS"
                        />

                        <MenuItem
                            to="/classes"
                            icon={GraduationCap}
                            label="Classes"
                            permission="VER_CLASSES"
                        />

                        <MenuItem
                            to="/aulas"
                            icon={BookOpen}
                            label="Aulas"
                            permission="VER_AULAS"
                        />
                    </>
                )}

                {/* PRESENÇAS */}

                {temMenuPresencas && (
                    <>
                        {temMenuAdministrativo && (
                            <div className="my-4 border-t border-slate-200" />
                        )}

                        <MenuItem
                            to="/checkin"
                            icon={ClipboardCheck}
                            label="Registrar presença"
                            permission="REGISTRAR_PRESENCA"
                        />

                        <MenuItem
                            to="/presencas"
                            icon={History}
                            label="Histórico de presenças"
                            permission="VER_PRESENCAS"
                        />
                    </>
                )}

                {/* ADMINISTRAÇÃO */}

                {temAcesso("APROVAR_USUARIOS") && (
                    <>
                        <div className="my-4 border-t border-slate-200" />

                        <MenuItem
                            to="/administracao/aprovacoes"
                            icon={UserCog}
                            label="Aprovação de usuários"
                            permission="APROVAR_USUARIOS"
                        />

                        <MenuItem
                            to="/administracao/solicitacoes-senha"
                            icon={KeyRound}
                            label="Solicitações de senha"
                            permission="APROVAR_USUARIOS"
                        />
                    </>
                )}

                {/* ÁREA DO ALUNO */}

                {temMenuAluno && (
                    <>
                        <MenuItem
                            to="/aulas"
                            icon={BookOpen}
                            label="Minhas aulas"
                            permission="VER_MINHAS_AULAS"
                        />

                        <MenuItem
                            to="/aluno/checkin"
                            icon={MapPin}
                            label="Check-in"
                            permission="FAZER_CHECKIN"
                        />

                        <MenuItem
                            to="/minhas-presencas"
                            icon={History}
                            label="Minhas presenças"
                            permission="VER_MINHAS_PRESENCAS"
                        />

                        <div className="my-4 border-t border-slate-200" />

                        <NavLink
                            to="/meus-dados"
                            className="block rounded-md px-3 py-2 hover:bg-muted"
                        >
                            <div className="flex items-center gap-3">
                                <UserRound size={18} />
                                <span>Meus dados</span>
                            </div>
                        </NavLink>
                    </>
                )}

            </nav>

        </aside>
    );
}