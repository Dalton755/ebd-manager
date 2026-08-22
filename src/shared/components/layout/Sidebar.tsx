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
    Wallet,
    CreditCard,
    Crown,
    Settings,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import { PlanGuard } from "@/modules/auth/components/PlanGuard";

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
    onNavigate?: () => void;
};

type SidebarProps = {
    onNavigate?: () => void;
};

export function Sidebar({
    onNavigate,
}: SidebarProps) {

    const {
        pessoa,
        isSuperAdmin,
    } = useAuth();

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
        onNavigate,
    }: MenuItemProps) {

        if (!temAcesso(permission)) {
            return null;
        }

        return (
            <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                    `block rounded-md px-3 py-2 transition ${isActive
                        ? "bg-blue-50 font-semibold text-blue-800"
                        : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
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

    const podeVerPlanos =
        pessoa?.perfil === "ADMIN" ||
        pessoa?.perfil === "PASTOR";

    return (
        <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white">

            <div className="mb-8 flex justify-center px-4">
                <img
                    src="/logo-ebd-manager.png"
                    alt="EBD Manager"
                    className="h-auto w-full max-w-[180px] object-contain"
                />
            </div>

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
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/pessoas"
                            icon={Users}
                            label="Pessoas"
                            permission="VER_PESSOAS"
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/classes"
                            icon={GraduationCap}
                            label="Classes"
                            permission="VER_CLASSES"
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/aulas"
                            icon={BookOpen}
                            label="Aulas"
                            permission="VER_AULAS"
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/financeiro"
                            icon={Wallet}
                            label="Financeiro"
                            permission="VER_FINANCEIRO"
                            onNavigate={onNavigate}
                        />
                    </>
                )}

                {/* PRESENÇAS */}

                {temMenuPresencas && (
                    <>
                        {temMenuAdministrativo && (
                            <div className="my-4 border-t border-[#E8DFD1]" />
                        )}

                        <MenuItem
                            to="/checkin"
                            icon={ClipboardCheck}
                            label="Registrar presença"
                            permission="REGISTRAR_PRESENCA"
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/presencas"
                            icon={History}
                            label="Histórico de presenças"
                            permission="VER_PRESENCAS"
                            onNavigate={onNavigate}
                        />
                    </>
                )}

                {/* ADMINISTRAÇÃO */}

                {temAcesso("APROVAR_USUARIOS") && (
                    <>
                        <div className="my-4 border-t border-[#E8DFD1]" />

                        <MenuItem
                            to="/administracao/aprovacoes"
                            icon={UserCog}
                            label="Aprovação de usuários"
                            permission="APROVAR_USUARIOS"
                            onNavigate={onNavigate}
                        />

                        <PlanGuard recurso="SOLICITACOES_SENHA">
                            <MenuItem
                                to="/administracao/solicitacoes-senha"
                                icon={KeyRound}
                                label="Solicitações de senha"
                                permission="APROVAR_USUARIOS"
                                onNavigate={onNavigate}
                            />
                        </PlanGuard>
                    </>
                )}

                {/* ÁREA DO ALUNO */}

                {temMenuAluno && (
                    <>
                        <MenuItem
                            to="/minhas-aulas"
                            icon={BookOpen}
                            label="Minhas aulas"
                            permission="VER_MINHAS_AULAS"
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/aluno/checkin"
                            icon={MapPin}
                            label="Check-in"
                            permission="FAZER_CHECKIN"
                            onNavigate={onNavigate}
                        />

                        <MenuItem
                            to="/minhas-presencas"
                            icon={History}
                            label="Minhas presenças"
                            permission="VER_MINHAS_PRESENCAS"
                            onNavigate={onNavigate}
                        />

                        <div className="my-4 border-t border-[#E8DFD1]" />

                        <NavLink
                            to="/meus-dados"
                            onClick={() => onNavigate?.()}
                            className={({ isActive }) =>
                                `block rounded-md px-3 py-2 transition ${isActive
                                    ? "bg-blue-50 font-semibold text-blue-800"
                                    : "text-slate-700 hover:bg-[#F0E9DE] hover:text-blue-700"
                                }`
                            }
                        >

                            <div className="flex items-center gap-3">
                                <UserRound size={18} />
                                <span>Meus dados</span>
                            </div>
                        </NavLink>
                    </>
                )}

                {/* PLANOS */}

                {podeVerPlanos && (
                    <>
                        <NavLink
                            to="/planos"
                            onClick={() => onNavigate?.()}
                            className={({ isActive }) =>
                                `group block rounded-md border px-3 py-2 transition ${isActive
                                    ? "border-blue-300 bg-gradient-to-r from-blue-100 to-purple-100 font-bold text-blue-800 shadow-sm"
                                    : "border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 font-semibold text-blue-700 hover:border-blue-300 hover:from-blue-100 hover:to-purple-100 hover:text-purple-700"
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <Crown
                                    size={18}
                                    className="text-purple-600 transition-transform group-hover:scale-110"
                                />

                                <span>Planos</span>

                                <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                                    Upgrade
                                </span>
                            </div>
                        </NavLink>

                        {/* MEU PLANO */}

                        <NavLink
                            to="/meu-plano"
                            onClick={() => onNavigate?.()}
                            className={({ isActive }) =>
                                `block rounded-md px-3 py-2 transition ${isActive
                                    ? "bg-blue-50 font-semibold text-blue-800"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard size={18} />
                                <span>Meu Plano</span>
                            </div>
                        </NavLink>
                    </>
                )}

                {/* ADMINISTRAÇÃO DA PLATAFORMA */}

                {isSuperAdmin && (
                    <>
                        <div className="my-4 border-t border-[#E8DFD1]" />

                        <NavLink
                            to="/administracao/plataforma"
                            onClick={() => onNavigate?.()}
                            className={({ isActive }) =>
                                `block rounded-md px-3 py-2 transition ${isActive
                                    ? "bg-slate-100 font-semibold text-slate-900"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <Settings size={18} />
                                <span>Administração da plataforma</span>
                            </div>
                        </NavLink>
                    </>
                )}

            </nav>

        </aside>
    );
}