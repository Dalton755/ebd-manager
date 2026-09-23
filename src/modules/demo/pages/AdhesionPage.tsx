import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ShieldCheck,
} from "lucide-react";

import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    toast,
} from "sonner";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    DemoService,
} from "../services/DemoService";

import {
    PlansCatalogService,
} from "@/shared/plans/PlansCatalogService";


function formatarTelefone(
    valor: string
) {

    const numeros =
        valor
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                11
            );


    if (
        numeros.length <=
        2
    ) {
        return numeros;
    }


    if (
        numeros.length <=
        6
    ) {
        return `(${numeros.slice(
            0,
            2
        )}) ${numeros.slice(
            2
        )}`;
    }


    return `(${numeros.slice(
        0,
        2
    )}) ${numeros.slice(
        2,
        7
    )}-${numeros.slice(
        7
    )}`;
}


function formatarCnpj(
    valor: string
) {

    const n =
        valor
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                14
            );


    return n
        .replace(
            /^(\d{2})(\d)/,
            "$1.$2"
        )
        .replace(
            /^(\d{2})\.(\d{3})(\d)/,
            "$1.$2.$3"
        )
        .replace(
            /\.(\d{3})(\d)/,
            ".$1/$2"
        )
        .replace(
            /(\d{4})(\d)/,
            "$1-$2"
        );
}


export function AdhesionPage() {

    const navigate =
        useNavigate();

    const [
        searchParams,
    ] =
        useSearchParams();

    const {
        user,
        modoDemo,
        loading:
            authLoading,
    } =
        useAuth();

    const ofertaId =
        searchParams.get(
            "oferta"
        );


    const [
        nome,
        setNome,
    ] =
        useState("");

    const [
        sigla,
        setSigla,
    ] =
        useState("");

    const [
        cnpj,
        setCnpj,
    ] =
        useState("");

    const [
        telefone,
        setTelefone,
    ] =
        useState("");

    const [
        email,
        setEmail,
    ] =
        useState(
            user?.email ??
            ""
        );

    const [
        termos,
        setTermos,
    ] =
        useState(false);

    const [
        privacidade,
        setPrivacidade,
    ] =
        useState(false);

    const [
        lgpd,
        setLgpd,
    ] =
        useState(false);

    const [
        representacao,
        setRepresentacao,
    ] =
        useState(false);

    const [
        ofertaNome,
        setOfertaNome,
    ] =
        useState<string | null>(
            null
        );

    const [
        ofertaPreco,
        setOfertaPreco,
    ] =
        useState<number | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(false);


    useEffect(() => {

        if (
            authLoading
        ) {
            return;
        }


        if (
            !modoDemo
        ) {

            navigate(
                "/",
                {
                    replace:
                        true,
                }
            );
        }

    }, [
        authLoading,
        modoDemo,
        navigate,
    ]);


    useEffect(() => {

        if (
            user?.email
        ) {
            setEmail(
                user.email
            );
        }

    }, [
        user?.email,
    ]);


    useEffect(() => {

        if (!ofertaId) {
            return;
        }


        void PlansCatalogService
            .listarOfertasAtivas()
            .then(
                (
                    ofertas
                ) => {

                    const oferta =
                        ofertas.find(
                            (
                                item
                            ) =>
                                item.id ===
                                ofertaId
                        );


                    if (
                        oferta
                    ) {
                        setOfertaNome(
                            oferta.plano
                                ?.nome ??
                                null
                        );

                        setOfertaPreco(
                            oferta
                                .preco_recorrente
                        );
                    }
                }
            )
            .catch(
                (
                    error
                ) =>
                    console.error(
                        "[ADESÃO] Erro ao carregar oferta:",
                        error
                    )
            );

    }, [
        ofertaId,
    ]);


    async function concluir(
        event:
            React.FormEvent
    ) {

        event.preventDefault();


        if (
            !nome.trim() ||
            !telefone.trim() ||
            !email.trim()
        ) {
            toast.error(
                "Informe nome, telefone e e-mail da igreja."
            );

            return;
        }


        if (
            !termos ||
            !privacidade ||
            !lgpd ||
            !representacao
        ) {
            toast.error(
                "Confirme os aceites obrigatórios para continuar."
            );

            return;
        }


        try {

            setLoading(
                true
            );


            await DemoService
                .converterEmIgreja({
                    igreja: {
                        nome:
                            nome.trim(),
                        sigla:
                            sigla.trim(),
                        cnpj:
                            cnpj.trim(),
                        telefone:
                            telefone.trim(),
                        email:
                            email
                                .trim()
                                .toLowerCase(),
                    },

                    aceites: {
                        termos,
                        privacidade,
                        lgpd,
                        representacao,
                    },
                });


            toast.success(
                "Igreja cadastrada. Agora escolha a condição do seu plano."
            );


            const destino =
                ofertaId
                    ? `/planos?oferta=${encodeURIComponent(
                        ofertaId
                    )}&adesao=1`
                    : "/planos?adesao=1";


            window.location.assign(
                destino
            );


        } catch (error) {

            console.error(
                "[ADESÃO] Erro:",
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível concluir a adesão."
            );

        } finally {

            setLoading(
                false
            );
        }
    }


    if (
        authLoading
    ) {
        return null;
    }


    return (
        <div className="min-h-dvh bg-slate-100 px-4 py-6 sm:py-10">

            <div className="mx-auto w-full max-w-3xl">

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            -1
                        )
                    }
                    className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para a demonstração
                </button>


                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

                    <div className="border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-7">

                        <div className="flex items-start gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                                <Building2 className="h-6 w-6" />
                            </div>

                            <div>

                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-300">
                                    Adesão
                                </p>

                                <h1 className="mt-1 text-2xl font-black">
                                    Agora sim, os dados reais da sua igreja
                                </h1>

                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    A demonstração termina aqui. O ambiente real será criado limpo, sem os dados fictícios.
                                </p>

                            </div>

                        </div>


                        {ofertaNome &&
                            ofertaPreco !==
                                null && (

                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">

                                <p className="text-xs font-bold uppercase text-blue-200">
                                    Plano selecionado
                                </p>

                                <div className="mt-1 flex items-end justify-between gap-3">

                                    <strong className="text-lg">
                                        {ofertaNome}
                                    </strong>

                                    <span className="text-xl font-black">
                                        {ofertaPreco.toLocaleString(
                                            "pt-BR",
                                            {
                                                style:
                                                    "currency",
                                                currency:
                                                    "BRL",
                                            }
                                        )}
                                        <small className="text-xs font-medium text-slate-300">
                                            /mês
                                        </small>
                                    </span>

                                </div>

                            </div>

                        )}

                    </div>


                    <form
                        onSubmit={
                            concluir
                        }
                        className="space-y-6 p-5 sm:p-7"
                    >

                        <section>

                            <h2 className="font-black text-slate-900">
                                Dados da igreja
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                CNPJ é opcional. Informe apenas se sua igreja utiliza esse dado no cadastro comercial.
                            </p>


                            <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-semibold">
                                        Nome da igreja *
                                    </label>

                                    <input
                                        value={
                                            nome
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setNome(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                                        placeholder="Ex.: Igreja Batista Central"
                                    />
                                </div>


                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold">
                                        Sigla
                                    </label>

                                    <input
                                        value={
                                            sigla
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setSigla(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                                        placeholder="IBC"
                                    />
                                </div>


                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold">
                                        CNPJ (se houver)
                                    </label>

                                    <input
                                        value={
                                            cnpj
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setCnpj(
                                                    formatarCnpj(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>


                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold">
                                        Telefone/WhatsApp *
                                    </label>

                                    <input
                                        value={
                                            telefone
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setTelefone(
                                                    formatarTelefone(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>


                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold">
                                        E-mail da igreja *
                                    </label>

                                    <input
                                        type="email"
                                        value={
                                            email
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setEmail(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                                    />
                                </div>

                            </div>

                        </section>


                        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                            <div className="flex items-start gap-3">

                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                <div>

                                    <h2 className="font-black text-slate-900">
                                        Termos, privacidade e LGPD
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        Registramos a versão aceita e a data do aceite para manter o histórico contratual.
                                    </p>

                                </div>

                            </div>


                            <div className="mt-4 space-y-3">

                                <label className="flex items-start gap-3 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={
                                            termos
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setTermos(
                                                    event
                                                        .target
                                                        .checked
                                                )
                                        }
                                        className="mt-1 h-4 w-4"
                                    />
                                    <span>
                                        Li e concordo com os{" "}
                                        <Link
                                            to="/termos-de-uso"
                                            target="_blank"
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            Termos de Uso
                                        </Link>
                                        .
                                    </span>
                                </label>


                                <label className="flex items-start gap-3 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={
                                            privacidade
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setPrivacidade(
                                                    event
                                                        .target
                                                        .checked
                                                )
                                        }
                                        className="mt-1 h-4 w-4"
                                    />
                                    <span>
                                        Li a{" "}
                                        <Link
                                            to="/privacidade"
                                            target="_blank"
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            Política de Privacidade
                                        </Link>
                                        {" "}e estou ciente de como meus dados serão tratados.
                                    </span>
                                </label>


                                <label className="flex items-start gap-3 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={
                                            lgpd
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setLgpd(
                                                    event
                                                        .target
                                                        .checked
                                                )
                                        }
                                        className="mt-1 h-4 w-4"
                                    />
                                    <span>
                                        Li as{" "}
                                        <Link
                                            to="/lgpd"
                                            target="_blank"
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            informações sobre LGPD
                                        </Link>
                                        {" "}e responsabilidades no uso de dados de membros e alunos.
                                    </span>
                                </label>


                                <label className="flex items-start gap-3 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={
                                            representacao
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setRepresentacao(
                                                    event
                                                        .target
                                                        .checked
                                                )
                                        }
                                        className="mt-1 h-4 w-4"
                                    />
                                    <span>
                                        Declaro que tenho autorização para realizar esta adesão em nome da igreja.
                                    </span>
                                </label>

                            </div>

                        </section>


                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            {loading
                                ? "Criando ambiente real..."
                                : "Continuar para o plano e pagamento"}
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}
