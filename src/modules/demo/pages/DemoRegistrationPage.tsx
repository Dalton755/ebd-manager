import {
    useState,
} from "react";

import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    FileText,
    LayoutDashboard,
    ShieldCheck,
    Users,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    toast,
} from "sonner";

import {
    DemoService,
} from "../services/DemoService";

import {
    AuthService,
} from "@/modules/auth/services/AuthService";


export function DemoRegistrationPage() {

    const navigate =
        useNavigate();

    const [nome, setNome] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [
        confirmarSenha,
        setConfirmarSenha,
    ] =
        useState("");

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


    async function criarDemo(
        event:
            React.FormEvent
    ) {

        event.preventDefault();


        if (
            !nome.trim() ||
            !email.trim() ||
            !password
        ) {
            toast.error(
                "Informe nome, e-mail e senha."
            );

            return;
        }


        if (
            password.length <
            6
        ) {
            toast.error(
                "A senha deve ter pelo menos 6 caracteres."
            );

            return;
        }


        if (
            password !==
            confirmarSenha
        ) {
            toast.error(
                "As senhas não coincidem."
            );

            return;
        }


        try {

            setLoading(true);


            await DemoService
                .criarDemonstracao({
                    nome:
                        nome.trim(),

                    email:
                        email
                            .trim()
                            .toLowerCase(),

                    password,
                });


            const {
                error,
            } =
                await AuthService
                    .login(
                        email
                            .trim()
                            .toLowerCase(),

                        password
                    );


            if (error) {
                throw error;
            }


            toast.success(
                "Sua demonstração está pronta."
            );


            /*
             * Recarrega uma única vez para que o AuthProvider
             * reconstrua a sessão já com a igreja demo criada,
             * sem corrida entre o evento SIGNED_IN e a rota.
             */
            window.location.assign(
                "/"
            );


        } catch (error) {

            console.error(
                "[DEMO] Erro ao criar demonstração:",
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível criar a demonstração."
            );

        } finally {

            setLoading(false);
        }
    }


    const beneficios = [
        {
            icon:
                LayoutDashboard,
            titulo:
                "EBD pronta para explorar",
            texto:
                "Dados fictícios de alunos, equipe, classe, aulas e presenças.",
        },
        {
            icon:
                FileText,
            titulo:
                "Teste seu próprio PDF",
            texto:
                "Importe uma apresentação e experimente referências bíblicas clicáveis.",
        },
        {
            icon:
                Users,
            titulo:
                "Veja a operação completa",
            texto:
                "Pessoas, classes, chamada, relatórios, financeiro e gestão de aulas.",
        },
        {
            icon:
                ShieldCheck,
            titulo:
                "Sem dados sensíveis agora",
            texto:
                "Nenhum CNPJ, cartão ou dado real da igreja nesta etapa.",
        },
    ];


    return (
        <div className="min-h-dvh bg-slate-950 px-4 py-6 text-white sm:py-10">

            <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.08fr_0.92fr]">

                <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-10">

                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]">
                        Demonstração completa
                    </span>

                    <h1 className="mt-5 max-w-xl text-3xl font-black leading-tight sm:text-5xl">
                        Veja sua EBD organizada antes de cadastrar sua igreja.
                    </h1>

                    <p className="mt-4 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
                        Crie apenas seu acesso. O EBD Manager prepara uma igreja demonstrativa só para você, com informações fictícias e todos os recursos liberados.
                    </p>


                    <div className="mt-8 grid gap-3 sm:grid-cols-2">

                        {beneficios.map(
                            (
                                item
                            ) => {

                                const Icon =
                                    item.icon;

                                return (
                                    <div
                                        key={
                                            item.titulo
                                        }
                                        className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                                    >
                                        <Icon className="h-5 w-5" />

                                        <p className="mt-3 font-bold">
                                            {item.titulo}
                                        </p>

                                        <p className="mt-1 text-sm leading-5 text-blue-100">
                                            {item.texto}
                                        </p>
                                    </div>
                                );
                            }
                        )}

                    </div>


                    <div className="mt-8 flex items-center gap-2 text-sm text-blue-100">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        7 dias de demonstração · 1 PDF próprio · sem cartão
                    </div>

                </section>


                <section className="p-6 text-slate-900 sm:p-10">

                    <div className="mx-auto max-w-md">

                        <p className="text-sm font-bold text-blue-600">
                            Comece em menos de 1 minuto
                        </p>

                        <h2 className="mt-2 text-2xl font-black">
                            Criar acesso à demonstração
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Nesta etapa pedimos somente seus dados de acesso.
                        </p>


                        <form
                            onSubmit={
                                criarDemo
                            }
                            className="mt-7 space-y-4"
                        >

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold">
                                    Seu nome
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
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                                    placeholder="Como podemos chamar você?"
                                    autoComplete="name"
                                />
                            </div>


                            <div>
                                <label className="mb-1.5 block text-sm font-semibold">
                                    E-mail
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
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                                    placeholder="voce@email.com"
                                    autoComplete="email"
                                />
                            </div>


                            <div>
                                <label className="mb-1.5 block text-sm font-semibold">
                                    Senha
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            mostrarSenha
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            password
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setPassword(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                                        placeholder="Mínimo de 6 caracteres"
                                        autoComplete="new-password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarSenha(
                                                (
                                                    atual
                                                ) =>
                                                    !atual
                                            )
                                        }
                                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400"
                                    >
                                        {mostrarSenha ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>

                                </div>
                            </div>


                            <div>
                                <label className="mb-1.5 block text-sm font-semibold">
                                    Confirmar senha
                                </label>

                                <input
                                    type={
                                        mostrarSenha
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        confirmarSenha
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            setConfirmarSenha(
                                                event
                                                    .target
                                                    .value
                                            )
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                                    placeholder="Repita sua senha"
                                    autoComplete="new-password"
                                />
                            </div>


                            <button
                                type="submit"
                                disabled={
                                    loading
                                }
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Preparando sua EBD..."
                                    : "Entrar na demonstração"}

                                {!loading && (
                                    <ArrowRight className="h-5 w-5" />
                                )}
                            </button>

                        </form>


                        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                            Ao continuar, seus dados de acesso serão tratados conforme nossa{" "}
                            <Link
                                to="/privacidade"
                                className="font-semibold text-blue-600 hover:underline"
                            >
                                Política de Privacidade
                            </Link>
                            .
                        </p>


                        <div className="mt-5 text-center">

                            <Link
                                to="/login"
                                className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                                Já tenho uma conta
                            </Link>

                        </div>

                    </div>

                </section>

            </div>

        </div>
    );
}
