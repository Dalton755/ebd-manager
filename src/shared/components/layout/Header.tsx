import { useNavigate } from "react-router-dom";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { AuthService } from "@/modules/auth/services/AuthService";
import { NotificationBell } from "@/shared/components/notifications/NotificationBell";

export function Header() {

    const navigate =
        useNavigate();

    const {
        pessoa,
    } = useAuth();


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

            <h2 className="text-lg font-semibold">
                EBD MANAGER
            </h2>


            <div className="flex items-center gap-3">

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