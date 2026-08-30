import { useNavigate } from "react-router-dom";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { AuthService } from "@/modules/auth/services/AuthService";
import { NotificationBell } from "@/shared/components/notifications/NotificationBell";
import { useClassroomStatus } from "@/shared/hooks/useClassroomStatus";

export function Header() {

    const navigate =
        useNavigate();

    const {
        pessoa,
        igrejaNome,
        igrejaLogoUrl,
        plano,
    } = useAuth();

    const {
        emAula,
    } = useClassroomStatus();


    async function sair() {

        await AuthService.logout();

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    }


    const mostrarLogout =
        pessoa?.perfil !== "ALUNO";


    return (

        <header className="flex h-16 items-center justify-between border-b bg-background px-6">

            <div className="flex items-center gap-3">

                {plano?.plano?.nome === "Igreja" && igrejaLogoUrl && (
                    <img
                        src={igrejaLogoUrl}
                        alt={igrejaNome ?? "Igreja"}
                        className="h-9 w-9 rounded-lg object-contain"
                    />
                )}

                <h2 className="text-lg font-semibold">
                    {plano?.plano?.nome === "Igreja" && igrejaNome
                        ? igrejaNome
                        : "EBD MANAGER"}
                </h2>

            </div>


            <div className="flex items-center gap-3">

                {emAula && (

                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">

                        <span className="relative flex h-2.5 w-2.5">

                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />

                        </span>

                        <span>
                            Em aula
                        </span>

                    </div>

                )}

                <NotificationBell />

                {mostrarLogout && (

                    <button
                        onClick={sair}
                        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        Sair
                    </button>

                )}

            </div>

        </header>
    );
}