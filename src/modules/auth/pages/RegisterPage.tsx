import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { toast } from "sonner";
import { AuthService } from "../services/AuthService";
import { Eye, EyeOff } from "lucide-react";


export function RegisterPage() {

    const navigate = useNavigate();

    const [
        searchParams,
    ] = useSearchParams();


    const igrejaId =
        searchParams.get(
            "igreja_id"
        );


    const [
        igrejaNome,
        setIgrejaNome,
    ] = useState<string | null>(
        null
    );


    const [
        validandoIgreja,
        setValidandoIgreja,
    ] = useState(true);


    const [nome, setNome] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [telefone, setTelefone] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] =
        useState("");


    const [
        showPassword,
        setShowPassword,
    ] =
        useState(false);


    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] =
        useState(false);


    const [
        loading,
        setLoading,
    ] =
        useState(false);


  // ============================================================
// VALIDA IGREJA DO LINK
// ============================================================

useEffect(() => {

    let ativo = true;


    async function validarIgreja() {

        if (!igrejaId) {

            if (ativo) {
                setValidandoIgreja(
                    false
                );
            }

            return;
        }


        try {

            const {
                data,
                error,
            } =
                await AuthService
                    .validarConviteAluno(
                        igrejaId
                    );


            if (error) {
                throw error;
            }


            if (!ativo) {
                return;
            }


            if (
                !data?.igreja
            ) {

                toast.error(
                    "Este link de acesso não pertence a uma igreja ativa."
                );

                setIgrejaNome(
                    null
                );

                return;
            }


            setIgrejaNome(
                data.igreja.nome
            );


        } catch (error) {

            console.error(
                "Erro ao validar igreja:",
                error
            );


            if (ativo) {

                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível validar a igreja."
                );

                setIgrejaNome(
                    null
                );
            }


        } finally {

            if (ativo) {

                setValidandoIgreja(
                    false
                );
            }

        }

    }


    validarIgreja();


    return () => {
        ativo = false;
    };

}, [
    igrejaId,
]);


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
            numeros.length <= 2
        ) {
            return numeros;
        }


        if (
            numeros.length <= 6
        ) {

            return `(${numeros.slice(
                0,
                2
            )}) ${numeros.slice(2)}`;
        }


        if (
            numeros.length <= 10
        ) {

            return `(${numeros.slice(
                0,
                2
            )}) ${numeros.slice(
                2,
                6
            )}-${numeros.slice(6)}`;
        }


        return `(${numeros.slice(
            0,
            2
        )}) ${numeros.slice(
            2,
            7
        )}-${numeros.slice(7)}`;

    }


    async function handleRegister(
        event: React.FormEvent
    ) {

        event.preventDefault();


        if (!igrejaId) {

            toast.error(
                "Este cadastro precisa ser iniciado pelo link da sua igreja."
            );

            return;
        }


        if (!igrejaNome) {

            toast.error(
                "Não foi possível identificar uma igreja válida para este cadastro."
            );

            return;
        }


        if (
            !nome.trim() ||
            !email.trim() ||
            !telefone.trim() ||
            !password
        ) {

            toast.error(
                "Preencha todos os campos."
            );

            return;
        }


        if (
            password.length < 6
        ) {

            toast.error(
                "A senha deve ter pelo menos 6 caracteres."
            );

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            toast.error(
                "As senhas não coincidem."
            );

            return;
        }


        try {

            setLoading(
                true
            );


            const {
                error,
            } =
                await AuthService
                    .register(
                        nome.trim(),
                        email.trim(),
                        telefone.trim(),
                        password,
                        igrejaId
                    );


            if (error) {

                toast.error(
                    error.message
                );

                return;
            }


            toast.success(
                "Conta criada com sucesso!"
            );


            navigate(
                `/login?igreja_id=${encodeURIComponent(
                    igrejaId
                )}`,
                {
                    replace: true,
                }
            );


        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível realizar o cadastro."
            );


        } finally {

            setLoading(
                false
            );

        }

    }


    if (validandoIgreja) {

        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

                <p className="text-sm text-slate-500">
                    Validando igreja...
                </p>

            </div>
        );

    }


    return (

        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">

                <div className="mb-8 text-center">

                    <h1 className="text-3xl font-bold text-blue-600">
                        EBD Manager
                    </h1>


                    <p className="mt-2 text-slate-500">
                        Crie sua conta para acessar a Escola Bíblica
                    </p>


                    {igrejaNome ? (

                        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

                            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                                Você está entrando na
                            </p>

                            <p className="mt-1 font-semibold text-blue-900">
                                {igrejaNome}
                            </p>

                        </div>

                    ) : (

                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

                            <p className="text-sm text-amber-800">
                                Este cadastro precisa ser iniciado pelo link compartilhado pela sua igreja.
                            </p>

                        </div>

                    )}

                </div>


                <form
                    onSubmit={
                        handleRegister
                    }
                    className="space-y-4"
                >

                    <div>

                        <label className="mb-2 block text-sm font-medium">
                            Nome completo
                        </label>


                        <input
                            type="text"
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
                            placeholder="Digite seu nome completo"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium">
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
                            placeholder="seuemail@exemplo.com"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium">
                            Telefone
                        </label>


                        <input
                            type="tel"
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
                            placeholder="(11) 99999-9999"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                        />

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium">
                            Senha
                        </label>


                        <div className="relative">

                            <input
                                type={
                                    showPassword
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
                                placeholder="Mínimo de 6 caracteres"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"
                            />


                            <button
                                type="button"
                                onClick={
                                    () =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                }
                                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-600"
                                aria-label={
                                    showPassword
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                            >

                                {showPassword ? (
                                    <EyeOff
                                        size={
                                            20
                                        }
                                    />
                                ) : (
                                    <Eye
                                        size={
                                            20
                                        }
                                    />
                                )}

                            </button>

                        </div>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium">
                            Confirmar senha
                        </label>


                        <div className="relative">

                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    confirmPassword
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setConfirmPassword(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                placeholder="Repita sua senha"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"
                            />


                            <button
                                type="button"
                                onClick={
                                    () =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                }
                                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-600"
                                aria-label={
                                    showConfirmPassword
                                        ? "Ocultar confirmação de senha"
                                        : "Mostrar confirmação de senha"
                                }
                            >

                                {showConfirmPassword ? (
                                    <EyeOff
                                        size={
                                            20
                                        }
                                    />
                                ) : (
                                    <Eye
                                        size={
                                            20
                                        }
                                    />
                                )}

                            </button>

                        </div>

                    </div>


                    <button
                        type="submit"
                        disabled={
                            loading ||
                            !igrejaId ||
                            !igrejaNome
                        }
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {loading
                            ? "Criando conta..."
                            : "Criar minha conta"}

                    </button>


                    <div className="pt-2 text-center">

                        <button
                            type="button"
                            onClick={
                                () => {

                                    if (
                                        igrejaId
                                    ) {

                                        navigate(
                                            `/login?igreja_id=${encodeURIComponent(
                                                igrejaId
                                            )}`
                                        );

                                        return;
                                    }


                                    navigate(
                                        "/login"
                                    );

                                }
                            }
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Já tenho uma conta
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}