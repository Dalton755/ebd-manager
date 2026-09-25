import {
    useEffect,
    useState,
} from "react";

import {
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    LogIn,
    ShieldCheck,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import {
    toast,
} from "sonner";

import {
    AuthService,
} from "../services/AuthService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    PasswordRecoveryService,
} from "@/modules/password-recovery/services/PasswordRecoveryService";

import {
    Modal,
} from "@/shared/components/ui/Modal";

import {
    Input,
} from "@/shared/components/ui/Input";

import {
    Button,
} from "@/shared/components/ui/Button";


export function LoginPage() {

    const navigate =
        useNavigate();

    const {
        user,
        pessoa,
        loading:
            authLoading,
    } =
        useAuth();

    const [
        email,
        setEmail,
    ] =
        useState("");

    const [
        password,
        setPassword,
    ] =
        useState("");

    const [
        showPassword,
        setShowPassword,
    ] =
        useState(false);

    const [
        mostrarSenha,
        setMostrarSenha,
    ] =
        useState(false);

    const [
        loading,
        setLoading,
    ] =
        useState(false);

    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(false);

    const [
        recoveryEmail,
        setRecoveryEmail,
    ] =
        useState("");

    const [
        sendingRecovery,
        setSendingRecovery,
    ] =
        useState(false);


    useEffect(() => {

        if (
            authLoading
        ) {
            return;
        }


        if (
            user &&
            !pessoa
        ) {

            navigate(
                "/entrar-classe",
                {
                    replace:
                        true,
                }
            );

            return;
        }


        if (
            !user ||
            !pessoa
        ) {
            return;
        }


        if (
            pessoa.perfil ===
            "PROFESSOR"
        ) {

            navigate(
                "/inicio",
                {
                    replace:
                        true,
                }
            );

            return;
        }


        navigate(
            "/",
            {
                replace:
                    true,
            }
        );

    }, [
        user,
        pessoa,
        authLoading,
        navigate,
    ]);


    async function handleGoogleLogin() {

        try {

            setLoading(
                true
            );


            const {
                error,
            } =
                await AuthService
                    .loginWithGoogle();


            if (error) {

                console.error(
                    "Erro no login com Google:",
                    error
                );

                toast.error(
                    "Não foi possível entrar com o Google."
                );
            }


        } catch (error) {

            console.error(
                "Erro inesperado no login com Google:",
                error
            );

            toast.error(
                "Não foi possível entrar com o Google."
            );

        } finally {

            setLoading(
                false
            );
        }
    }


    async function handleLogin(
        event:
            React.FormEvent
    ) {

        event.preventDefault();


        if (
            !email.trim() ||
            !password
        ) {

            toast.error(
                "Informe seu e-mail e senha."
            );

            return;
        }


        try {

            setLoading(
                true
            );


            const {
                data,
                error,
            } =
                await AuthService
                    .login(
                        email.trim(),
                        password
                    );


            if (error) {

                console.error(
                    "Erro no login:",
                    error
                );

                toast.error(
                    error.message
                );

                return;
            }


            if (
                !data.user
            ) {

                toast.error(
                    "Não foi possível identificar o usuário."
                );

                return;
            }


            toast.success(
                "Login realizado com sucesso!"
            );


        } catch (error) {

            console.error(
                "Erro inesperado no login:",
                error
            );

            toast.error(
                "Não foi possível realizar o login."
            );

        } finally {

            setLoading(
                false
            );
        }
    }


    async function handleRecovery() {

        if (
            !recoveryEmail.trim()
        ) {

            toast.error(
                "Informe seu e-mail."
            );

            return;
        }


        try {

            setSendingRecovery(
                true
            );


            await PasswordRecoveryService
                .solicitarRedefinicao(
                    recoveryEmail
                );


            setModalOpen(
                false
            );

            setRecoveryEmail(
                ""
            );


            toast.success(
                "Solicitação enviada. Aguarde o contato do administrador."
            );


        } catch (error) {

            console.error(
                "Erro ao solicitar redefinição de senha:",
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível enviar sua solicitação."
            );

        } finally {

            setSendingRecovery(
                false
            );
        }
    }


    const previewUx =
        window.location.hostname.includes(
            "git-feat-mobile-ux-premium"
        );

    return (
        <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-8">

            {previewUx && (
                <div className="fixed inset-x-0 top-0 z-50 bg-fuchsia-600 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg">
                    Preview UX — revisão mobile
                </div>
            )}

            <div className="w-full max-w-md">

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">

                    <div className="text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-200">
                            E
                        </div>

                        <h1 className="mt-4 text-3xl font-black text-slate-900">
                            EBD Manager
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Entre de forma simples e acesse sua Escola Bíblica.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleGoogleLogin
                        }
                        disabled={
                            loading
                        }
                        className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-blue-600">
                            G
                        </span>

                        {loading
                            ? "Abrindo Google..."
                            : "Continuar com Google"}

                    </button>


                    <div className="mt-4 flex items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">

                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                        <p>
                            Aluno novo entra com Google e depois informa apenas o número da classe. Não precisa criar senha nem confirmar e-mail.
                        </p>

                    </div>


                    <div className="mt-5 flex items-center gap-3">
                        <span className="h-px flex-1 bg-slate-200" />

                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            ou
                        </span>

                        <span className="h-px flex-1 bg-slate-200" />
                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            setMostrarSenha(
                                (atual) =>
                                    !atual
                            )
                        }
                        aria-expanded={
                            mostrarSenha
                        }
                        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 active:scale-[0.99]"
                    >

                        <span className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <LogIn className="h-4 w-4" />
                            </span>

                            <span className="flex flex-col">
                                <strong className="text-sm font-bold text-slate-800">
                                    Entrar com e-mail e senha
                                </strong>

                                <small className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    Para quem já possui uma conta
                                </small>
                            </span>
                        </span>

                        {mostrarSenha ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        )}

                    </button>


                    {mostrarSenha && (

                        <form
                            onSubmit={
                                handleLogin
                            }
                            className="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >

                            <div>

                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    E-mail
                                </label>

                                <input
                                    type="email"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                    placeholder="email@igreja.com"
                                    value={
                                        email
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            <div>

                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Senha
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                        placeholder="********"
                                        value={
                                            password
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (atual) =>
                                                    !atual
                                            )
                                        }
                                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-blue-600"
                                        aria-label={
                                            showPassword
                                                ? "Ocultar senha"
                                                : "Mostrar senha"
                                        }
                                    >

                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}

                                    </button>

                                </div>

                            </div>


                            <button
                                type="submit"
                                disabled={
                                    loading
                                }
                                className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                            >
                                {loading
                                    ? "Entrando..."
                                    : "Entrar com senha"}
                            </button>


                            <button
                                type="button"
                                onClick={() =>
                                    setModalOpen(
                                        true
                                    )
                                }
                                className="block w-full text-center text-sm font-semibold text-blue-600 hover:underline"
                            >
                                Esqueci minha senha
                            </button>

                        </form>

                    )}


                    <div className="mt-6 border-t border-slate-100 pt-5 text-center">

                        <p className="text-xs text-slate-400">
                            Ainda não conhece a plataforma?
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/cadastro-igreja"
                                )
                            }
                            className="mt-2 text-sm font-bold text-blue-600 hover:underline"
                        >
                            Testar o EBD Manager grátis
                        </button>

                    </div>

                </div>

            </div>


            <Modal
                open={
                    modalOpen
                }
                title="Solicitar nova senha"
                onClose={() =>
                    setModalOpen(
                        false
                    )
                }
            >

                <p className="mb-4 text-sm text-slate-600">
                    Informe seu e-mail. Sua solicitação será enviada para o administrador.
                </p>

                <Input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={
                        recoveryEmail
                    }
                    onChange={(
                        event
                    ) =>
                        setRecoveryEmail(
                            event.target.value
                        )
                    }
                />

                <Button
                    onClick={
                        handleRecovery
                    }
                    disabled={
                        sendingRecovery
                    }
                >
                    {sendingRecovery
                        ? "Enviando solicitação..."
                        : "Solicitar nova senha"}
                </Button>

            </Modal>

        </div>
    );
}
