import {
    FlaskConical,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";


export function DemoBanner() {

    const {
        demoExpiraEm,
    } =
        useAuth();


    const expira =
        demoExpiraEm
            ? new Date(
                demoExpiraEm
            )
                .toLocaleDateString(
                    "pt-BR"
                )
            : null;


    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-start gap-3">

                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <FlaskConical className="h-5 w-5" />
                </div>

                <div className="min-w-0">

                    <p className="text-sm font-black">
                        Você está na demonstração completa
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-blue-700">
                        Dados fictícios · todos os recursos · 1 PDF próprio
                        {expira
                            ? ` · disponível até ${expira}`
                            : ""}
                    </p>

                </div>

            </div>


            <Link
                to="/adesao"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
                Usar na minha igreja
            </Link>

        </div>
    );
}
