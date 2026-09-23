import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    LogOut,
    ShieldCheck,
    Users,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    toast,
} from "sonner";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    ClassAccessService,
} from "../services/ClassAccessService";


function somenteNumeros(
    valor: string
) {

    return valor
        .replace(
            /\D/g,
            ""
        )
        .slice(
            0,
            8
        );
}


function formatarCodigo(
    valor: string
) {

    const numeros =
        somenteNumeros(
            valor
        );


    if (
        numeros.length <=
        4
    ) {
        return numeros;
    }


    return (
        numeros.slice(
            0,
            4
        ) +
        " " +
        numeros.slice(
            4
        )
    );
}


export function JoinClassPage() {

    const navigate =
        useNavigate();

    const {
        user,
        pessoa,
        loading:
            authLoading,
        logout,
    } =
        useAuth();

    const [
        codigo,
        setCodigo,
    ] =
        useState("");

    const [
        entrando,
        setEntrando,
    ] =
        useState(false);


    useEffect(() => {

        if (
            authLoading
        ) {
            return;
        }


        if (!user) {

            navigate(
                "/login",
                {
                    replace:
                        true,
                }
            );

            return;
        }


        if (pessoa) {

            navigate(
                "/",
                {
                    replace:
                        true,
                }
            );
        }

    }, [
        user,
        pessoa,
        authLoading,
        navigate,
    ]);


    const nome =
        useMemo(
            () =>
                user?.user_metadata
                    ?.full_name ??
                user?.user_metadata
                    ?.name ??
                user?.email
                    ?.split("@")[0] ??
                "Olá",
            [
                user,
            ]
        );


    async function entrar(
        event:
            React.FormEvent
    ) {

        event.preventDefault();


        const numero =
            somenteNumeros(
                codigo
            );


        if (
            numero.length !==
            8
        ) {

            toast.error(
                "Digite os 8 números da classe."
            );

            return;
        }


        try {

            setEntrando(
                true
            );


            const resultado =
                await ClassAccessService
                    .entrar(
                        numero
                    );


            toast.success(
                `Pronto! Você entrou na classe ${resultado.classe.nome}.`
            );


            /*
             * Recarrega para o AuthProvider buscar o vínculo
             * recém-criado e montar as permissões de ALUNO.
             */
            window.location.assign(
                "/"
            );


        } catch (error) {

            console.error(
                "[ENTRAR CLASSE] Erro:",
                error
            );


            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Não foi possível entrar na classe.";


            if (
                mensagem
                    .toLowerCase()
                    .includes(
                        "número da classe"
                    )
            ) {

                toast.error(
                    "Número da classe não encontrado. Confira e tente novamente."
                );

                return;
            }


            toast.error(
                mensagem
            );

        } finally {

            setEntrando(
                false
            );
        }
    }


    async function trocarConta() {

        await logout();

        navigate(
            "/login",
            {
                replace:
                    true,
            }
        );
    }


    if (
        authLoading
    ) {

        return (
            <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
                Preparando seu acesso...
            </div>
        );
    }


    return (
        <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 px-4 py-6 text-white sm:py-10">

            <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-xl items-center justify-center">

                <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-900 shadow-2xl">

                    <div className="bg-gradient-to-br from-blue-700 to-indigo-700 p-6 text-white sm:p-8">

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                                <BookOpen className="h-6 w-6" />
                            </div>

                            <div>

                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
                                    EBD Manager
                                </p>

                                <h1 className="mt-1 text-2xl font-black">
                                    Olá, {nome}
                                </h1>

                            </div>

                        </div>


                        <p className="mt-5 text-sm leading-6 text-blue-100">
                            Sua conta Google já está conectada. Agora falta apenas informar o número da sua classe para entrar na EBD da sua igreja.
                        </p>

                    </div>


                    <div className="p-6 sm:p-8">

                        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                            <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                            <div>

                                <p className="text-sm font-bold text-slate-800">
                                    Peça o número da sua classe
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    O professor, secretário, superintendente ou administrador da EBD pode informar esse número.
                                </p>

                            </div>

                        </div>


                        <form
                            onSubmit={
                                entrar
                            }
                            className="mt-6"
                        >

                            <label className="block text-sm font-bold text-slate-700">
                                Número da classe
                            </label>

                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                autoFocus
                                value={
                                    formatarCodigo(
                                        codigo
                                    )
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCodigo(
                                        somenteNumeros(
                                            event.target.value
                                        )
                                    )
                                }
                                placeholder="0000 0000"
                                className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-center text-3xl font-black tracking-[0.18em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />


                            <button
                                type="submit"
                                disabled={
                                    entrando ||
                                    somenteNumeros(
                                        codigo
                                    ).length !==
                                        8
                                }
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-black text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {entrando
                                    ? "Entrando na classe..."
                                    : "Entrar na minha classe"}

                                {!entrando && (
                                    <ArrowRight className="h-5 w-5" />
                                )}

                            </button>

                        </form>


                        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">

                            <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                Você será vinculado automaticamente como aluno dessa classe.
                            </div>

                            <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                Não é necessário criar senha nem aguardar aprovação por e-mail.
                            </div>

                        </div>


                        <button
                            type="button"
                            onClick={
                                trocarConta
                            }
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                        >
                            <LogOut className="h-4 w-4" />
                            Entrar com outra conta Google
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}
