import type {
    ReactNode,
} from "react";

import {
    ArrowLeft,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";


type Props = {
    titulo: string;
    subtitulo: string;
    versao: string;
    children: ReactNode;
};


export function LegalLayout({
    titulo,
    subtitulo,
    versao,
    children,
}: Props) {

    return (
        <div className="min-h-dvh bg-slate-100 px-4 py-6 sm:py-10">

            <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

                <header className="border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-8">

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        EBD Manager
                    </Link>

                    <h1 className="mt-5 text-3xl font-black">
                        {titulo}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        {subtitulo}
                    </p>

                    <p className="mt-4 text-xs text-slate-400">
                        Versão {versao} · atualização em 23/09/2026
                    </p>

                </header>


                <div className="space-y-7 p-5 text-sm leading-7 text-slate-700 sm:p-8">
                    {children}
                </div>


                <footer className="border-t border-slate-200 bg-slate-50 p-5 text-xs leading-5 text-slate-500 sm:px-8">
                    EBD Manager · Nethanel Tecnologia. Estes documentos descrevem o funcionamento pretendido do serviço e devem ser revisados juridicamente antes de serem tratados como aconselhamento legal específico.
                </footer>

            </article>

        </div>
    );
}
