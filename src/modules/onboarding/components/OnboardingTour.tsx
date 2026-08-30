import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    ArrowRight,
    Check,
    X,
} from "lucide-react";


export type OnboardingStep = {
    id: string;

    titulo: string;

    descricao:
    React.ReactNode;

    /*
     * Exemplo:
     * [data-tour="nova-pessoa"]
     */
    alvo?: string;

    /*
     * Executado automaticamente
     * quando o passo começa.
     *
     * Servirá para abrir modal,
     * alterar perfil etc.
     */
    aoEntrar?: () =>
        void |
        Promise<void>;

    textoProximo?: string;
};


type Props = {
    aberto: boolean;

    passos:
    OnboardingStep[];

    onConcluir:
    () => void | Promise<void>;

    onPular:
    () => void | Promise<void>;
};


type AlvoPosicao = {
    top: number;
    left: number;
    width: number;
    height: number;
};

function encontrarElementoVisivel(
    seletor: string
): HTMLElement | null {

    const elementos =
        Array.from(
            document.querySelectorAll(
                seletor
            )
        ) as HTMLElement[];


    return (
        elementos.find(
            (elemento) => {

                const rect =
                    elemento
                        .getBoundingClientRect();


                const estilo =
                    window.getComputedStyle(
                        elemento
                    );


                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    estilo.display !== "none" &&
                    estilo.visibility !== "hidden"
                );

            }
        ) ??
        null
    );
}


export function OnboardingTour({
    aberto,
    passos,
    onConcluir,
    onPular,
}: Props) {

    const [
        indice,
        setIndice,
    ] =
        useState(0);


    const [
        alvo,
        setAlvo,
    ] =
        useState<AlvoPosicao | null>(
            null
        );


    const [
        processando,
        setProcessando,
    ] =
        useState(false);


    const passo =
        passos[indice];


    const ultimoPasso =
        indice ===
        passos.length - 1;


    useEffect(() => {

        if (!aberto) {

            setIndice(0);
            setAlvo(null);

            return;
        }


        if (!passo) {
            return;
        }


        let cancelado =
            false;


        async function prepararPasso() {

            try {

                await passo.aoEntrar?.();


                /*
                 * Pequeno intervalo para React
                 * terminar de renderizar modais
                 * ou elementos abertos no passo.
                 */
                await new Promise(
                    (resolve) =>
                        window.setTimeout(
                            resolve,
                            120
                        )
                );


                if (cancelado) {
                    return;
                }


                if (!passo.alvo) {

                    setAlvo(null);

                    return;
                }


                const elemento =
                    encontrarElementoVisivel(
                        passo.alvo
                    );


                if (!elemento) {

                    console.warn(
                        "[ONBOARDING] Elemento não encontrado:",
                        passo.alvo
                    );

                    setAlvo(null);

                    return;
                }


                elemento.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "center",

                    inline:
                        "nearest",
                });


                await new Promise(
                    (resolve) =>
                        window.setTimeout(
                            resolve,
                            250
                        )
                );


                if (cancelado) {
                    return;
                }


                const rect =
                    elemento
                        .getBoundingClientRect();


                setAlvo({
                    top:
                        Math.max(
                            6,
                            rect.top - 6
                        ),

                    left:
                        Math.max(
                            6,
                            rect.left - 6
                        ),

                    width:
                        rect.width + 12,

                    height:
                        rect.height + 12,
                });


            } catch (error) {

                console.error(
                    "[ONBOARDING] Erro ao preparar passo:",
                    error
                );

                setAlvo(null);

            }

        }


        void prepararPasso();


        function atualizarPosicao() {

            if (!passo.alvo) {
                return;
            }


            const elemento =
                encontrarElementoVisivel(
                    passo.alvo
                );


            if (!elemento) {
                return;
            }


            const rect =
                elemento
                    .getBoundingClientRect();


            setAlvo({
                top:
                    Math.max(
                        6,
                        rect.top - 6
                    ),

                left:
                    Math.max(
                        6,
                        rect.left - 6
                    ),

                width:
                    rect.width + 12,

                height:
                    rect.height + 12,
            });

        }


        window.addEventListener(
            "resize",
            atualizarPosicao
        );


        window.addEventListener(
            "scroll",
            atualizarPosicao,
            true
        );


        return () => {

            cancelado = true;

            window.removeEventListener(
                "resize",
                atualizarPosicao
            );

            window.removeEventListener(
                "scroll",
                atualizarPosicao,
                true
            );

        };

    }, [
        aberto,
        passo,
    ]);


    if (
        !aberto ||
        !passo ||
        passos.length === 0
    ) {
        return null;
    }


    async function avancar() {

        if (processando) {
            return;
        }


        if (!ultimoPasso) {

            setIndice(
                (atual) =>
                    atual + 1
            );

            return;
        }


        try {

            setProcessando(true);

            await onConcluir();

        } finally {

            setProcessando(false);

        }

    }


    function voltar() {

        if (
            processando ||
            indice === 0
        ) {
            return;
        }


        setIndice(
            (atual) =>
                Math.max(
                    0,
                    atual - 1
                )
        );

    }


    async function pularTutorial() {

        if (processando) {
            return;
        }


        try {

            setProcessando(true);

            await onPular();

        } finally {

            setProcessando(false);

        }

    }


    return (

        <>

            {/* ================================================= */}
            {/* ESCURECIMENTO */}
            {/* ================================================= */}

            {!alvo && (

                <div
                    className="pointer-events-none fixed inset-0 z-[90] bg-slate-950/60"
                    aria-hidden="true"
                />

            )}


            {/* ================================================= */}
            {/* DESTAQUE */}
            {/* ================================================= */}

            {alvo && (

                <div
                    className="pointer-events-none fixed z-[91] rounded-2xl border-2 border-blue-400 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.62),0_0_0_4px_rgba(59,130,246,0.25)] transition-all duration-300"
                    style={{
                        top:
                            alvo.top,

                        left:
                            alvo.left,

                        width:
                            alvo.width,

                        height:
                            alvo.height,
                    }}
                    aria-hidden="true"
                />

            )}


            {/* ================================================= */}
            {/* CARD DO PASSO */}
            {/* ================================================= */}

            <div className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[390px]">

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">

                    {/* PROGRESSO */}

                    <div className="h-1.5 bg-slate-100">

                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{
                                width:
                                    `${(
                                        (
                                            indice + 1
                                        ) /
                                        passos.length
                                    ) * 100}%`,
                            }}
                        />

                    </div>


                    <div className="p-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    Tutorial •{" "}
                                    {indice + 1} de{" "}
                                    {passos.length}
                                </p>


                                <h2 className="mt-2 text-lg font-bold text-slate-900">
                                    {passo.titulo}
                                </h2>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    pularTutorial
                                }
                                disabled={
                                    processando
                                }
                                title="Pular tutorial"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <div className="mt-3 text-sm leading-6 text-slate-600">
                            {passo.descricao}
                        </div>


                        <div className="mt-5 flex items-center justify-between gap-3">

                            <button
                                type="button"
                                onClick={
                                    pularTutorial
                                }
                                disabled={
                                    processando
                                }
                                className="text-sm font-semibold text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                            >
                                Pular tutorial
                            </button>


                            <div className="flex items-center gap-2">

                                {indice > 0 && (

                                    <button
                                        type="button"
                                        onClick={
                                            voltar
                                        }
                                        disabled={
                                            processando
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <ArrowLeft size={16} />

                                        Voltar
                                    </button>

                                )}


                                <button
                                    type="button"
                                    onClick={
                                        avancar
                                    }
                                    disabled={
                                        processando
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >

                                    {ultimoPasso ? (

                                        <>
                                            <Check size={16} />

                                            Concluir
                                        </>

                                    ) : (

                                        <>
                                            {passo.textoProximo ??
                                                "Próximo"}

                                            <ArrowRight size={16} />
                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </>

    );
}