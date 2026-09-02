import { useNavigate } from "react-router-dom";

import { toast } from "sonner";
import {
    Share2,
} from "lucide-react";

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


    const podeCompartilharApp =
        pessoa?.perfil === "ADMIN" ||
        pessoa?.perfil === "SUPERINTENDENTE" ||
        pessoa?.perfil === "PASTOR" ||
        pessoa?.perfil === "PROFESSOR";


    async function compartilharApp() {

        if (!pessoa?.igreja_id) {

            toast.error(
                "Não foi possível identificar sua igreja."
            );

            return;
        }


        const link =
            `${window.location.origin}/login?igreja_id=${encodeURIComponent(
                pessoa.igreja_id
            )}`;


        const titulo =
            igrejaNome
                ? `EBD Manager - ${igrejaNome}`
                : "EBD Manager";


        const texto =
            igrejaNome
                ? `Acesse o EBD Manager da ${igrejaNome}.`
                : "Acesse o EBD Manager da nossa igreja.";


        try {

            if (
                typeof navigator.share ===
                "function"
            ) {

                await navigator.share({
                    title:
                        titulo,

                    text:
                        texto,

                    url:
                        link,
                });

                return;
            }


            await navigator.clipboard.writeText(
                link
            );


            toast.success(
                "Link do app copiado!"
            );


        } catch (error) {

            /*
             * Quando o usuário fecha o compartilhamento
             * nativo sem enviar, o navegador pode lançar
             * AbortError. Nesse caso não exibimos erro.
             */

            if (
                error instanceof DOMException &&
                error.name === "AbortError"
            ) {

                return;
            }


            console.error(
                "Erro ao compartilhar app:",
                error
            );


            try {

                await navigator.clipboard.writeText(
                    link
                );


                toast.success(
                    "Link do app copiado!"
                );


            } catch (
                clipboardError
            ) {

                console.error(
                    "Erro ao copiar link:",
                    clipboardError
                );


                toast.error(
                    "Não foi possível compartilhar o link."
                );

            }

        }

    }


    return (

        <header className="flex h-16 items-center justify-between border-b bg-background px-6">

            <div className="flex min-w-0 items-center gap-3">

                {plano?.plano?.nome === "Igreja" && igrejaLogoUrl && (

                    <img
                        src={
                            igrejaLogoUrl
                        }
                        alt={
                            igrejaNome ??
                            "Igreja"
                        }
                        className="h-9 w-9 shrink-0 rounded-lg object-contain"
                    />

                )}


                <h2 className="truncate text-lg font-semibold">

                    {plano?.plano?.nome === "Igreja" &&
                    igrejaNome
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


                {podeCompartilharApp && (

                    <button
                        type="button"
                        onClick={
                            compartilharApp
                        }
                        className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        title="Compartilhar app"
                    >

                        <Share2
                            size={
                                18
                            }
                        />


                        <span className="hidden sm:inline">
                            Compartilhar app
                        </span>

                    </button>

                )}


                <NotificationBell />


                {mostrarLogout && (

                    <button
                        onClick={
                            sair
                        }
                        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        Sair
                    </button>

                )}

            </div>

        </header>
    );
}