import {
    useEffect,
    useState,
} from "react";

import {
    Check,
    Sparkles,
    X,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    PlansCatalogService,
} from "@/shared/plans/PlansCatalogService";


type Oferta = {
    id: string;
    preco: number;
    periodo: string;
    nome: string;
    descricao: string | null;
    ordem: number;
};


const STORAGE_DISPENSADO =
    "ebd_demo_offer_dismissed_at";


export function DemoOfferModal() {

    const location =
        useLocation();

    const navigate =
        useNavigate();

    const [
        open,
        setOpen,
    ] =
        useState(false);

    const [
        ofertas,
        setOfertas,
    ] =
        useState<Oferta[]>([]);


    useEffect(() => {

        let ativo =
            true;


        void PlansCatalogService
            .listarOfertasAtivas()
            .then(
                (
                    itens
                ) => {

                    if (!ativo) {
                        return;
                    }


                    const lista =
                        itens
                            .filter(
                                (
                                    item
                                ) =>
                                    !item.gratuito &&
                                    Boolean(
                                        item.plano
                                    )
                            )
                            .map(
                                (
                                    item
                                ) => ({
                                    id:
                                        item.id,
                                    preco:
                                        item
                                            .preco_recorrente,
                                    periodo:
                                        item
                                            .periodo_recorrente,
                                    nome:
                                        item
                                            .plano
                                            ?.nome ??
                                        "Plano",
                                    descricao:
                                        item
                                            .plano
                                            ?.descricao ??
                                        null,
                                    ordem:
                                        item
                                            .plano
                                            ?.ordem ??
                                        99,
                                })
                            )
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    a.ordem -
                                    b.ordem
                            );


                    setOfertas(
                        lista
                    );
                }
            )
            .catch(
                (
                    error
                ) =>
                    console.error(
                        "[DEMO] Erro ao carregar ofertas:",
                        error
                    )
            );


        return () => {
            ativo =
                false;
        };

    }, []);


    useEffect(() => {

        if (
            location.pathname ===
                "/adesao" ||
            location.pathname.includes(
                "/apresentacao"
            )
        ) {
            return;
        }


        const dispensadoEm =
            Number(
                localStorage.getItem(
                    STORAGE_DISPENSADO
                ) ??
                "0"
            );


        if (
            dispensadoEm &&
            Date.now() -
                dispensadoEm <
                12 *
                    60 *
                    60 *
                    1000
        ) {
            return;
        }


        const atual =
            Number(
                sessionStorage.getItem(
                    "ebd_demo_visits"
                ) ??
                "0"
            ) +
            1;


        sessionStorage.setItem(
            "ebd_demo_visits",
            String(
                atual
            )
        );


        if (
            atual >= 4
        ) {

            const timer =
                window.setTimeout(
                    () =>
                        setOpen(
                            true
                        ),
                    700
                );


            return () =>
                window.clearTimeout(
                    timer
                );
        }

    }, [
        location.pathname,
    ]);


    useEffect(() => {

        const timer =
            window.setTimeout(
                () => {

                    const dispensadoEm =
                        Number(
                            localStorage
                                .getItem(
                                    STORAGE_DISPENSADO
                                ) ??
                                "0"
                        );

                    if (!dispensadoEm) {
                        setOpen(
                            true
                        );
                    }
                },
                120000
            );


        return () =>
            window.clearTimeout(
                timer
            );

    }, []);


    if (!open) {
        return null;
    }


    function fechar() {

        localStorage.setItem(
            STORAGE_DISPENSADO,
            String(
                Date.now()
            )
        );

        setOpen(false);
    }


    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">

            <div className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">

                <div className="flex items-start justify-between gap-4">

                    <div>

                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            <Sparkles className="h-4 w-4" />
                            Gostou do EBD Manager?
                        </span>

                        <h2 className="mt-3 text-2xl font-black text-slate-900">
                            Leve esta organização para sua igreja
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Agora os dados reais da igreja só serão pedidos se você decidir continuar.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            fechar
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
                    >
                        <X className="h-5 w-5" />
                    </button>

                </div>


                <div className="mt-5 grid gap-3 md:grid-cols-3">

                    {ofertas.map(
                        (
                            oferta
                        ) => (

                            <button
                                key={
                                    oferta.id
                                }
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/adesao?oferta=${encodeURIComponent(
                                            oferta.id
                                        )}`
                                    )
                                }
                                className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                            >
                                <p className="font-black text-slate-900">
                                    {oferta.nome}
                                </p>

                                <p className="mt-1 text-2xl font-black text-blue-700">
                                    {oferta.preco.toLocaleString(
                                        "pt-BR",
                                        {
                                            style:
                                                "currency",
                                            currency:
                                                "BRL",
                                        }
                                    )}
                                </p>

                                <p className="text-xs text-slate-400">
                                    por mês
                                </p>

                                <p className="mt-3 min-h-12 text-xs leading-5 text-slate-500">
                                    {oferta.descricao}
                                </p>

                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                                    <Check className="h-4 w-4" />
                                    Escolher plano
                                </span>
                            </button>

                        )
                    )}

                </div>


                <button
                    type="button"
                    onClick={
                        fechar
                    }
                    className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                    Continuar explorando
                </button>

            </div>

        </div>
    );
}
