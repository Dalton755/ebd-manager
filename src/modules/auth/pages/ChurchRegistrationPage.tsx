import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Eye,
    EyeOff,
} from "lucide-react";

import { AuthService } from "../services/AuthService";

function formatarTelefone(valor: string) {
    const numeros =
        valor
            .replace(/\D/g, "")
            .slice(0, 11);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 6) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(
            2,
            6
        )}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        7
    )}-${numeros.slice(7)}`;
}

function formatarCnpj(valor: string) {
    const numeros =
        valor
            .replace(/\D/g, "")
            .slice(0, 14);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 5) {
        return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
    }

    if (numeros.length <= 8) {
        return `${numeros.slice(
            0,
            2
        )}.${numeros.slice(
            2,
            5
        )}.${numeros.slice(5)}`;
    }

    if (numeros.length <= 12) {
        return `${numeros.slice(
            0,
            2
        )}.${numeros.slice(
            2,
            5
        )}.${numeros.slice(
            5,
            8
        )}/${numeros.slice(8)}`;
    }

    return `${numeros.slice(
        0,
        2
    )}.${numeros.slice(
        2,
        5
    )}.${numeros.slice(
        5,
        8
    )}/${numeros.slice(
        8,
        12
    )}-${numeros.slice(12)}`;
}

export function ChurchRegistrationPage() {

    const navigate =
        useNavigate();

    const [
        nomeIgreja,
        setNomeIgreja,
    ] = useState("");

    const [
        sigla,
        setSigla,
    ] = useState("");

    const [
        cnpj,
        setCnpj,
    ] = useState("");

    const [
        telefoneIgreja,
        setTelefoneIgreja,
    ] = useState("");

    const [
        emailIgreja,
        setEmailIgreja,
    ] = useState("");

    const [
        nomeAdministrador,
        setNomeAdministrador,
    ] = useState("");

    const [
        emailAdministrador,
        setEmailAdministrador,
    ] = useState("");

    const [
        telefoneAdministrador,
        setTelefoneAdministrador,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);


    async function handleRegister(
        event: React.FormEvent
    ) {

        event.preventDefault();


        // =====================================================
        // VALIDAÇÃO
        // =====================================================

        if (
            !nomeIgreja.trim() ||
            !nomeAdministrador.trim() ||
            !emailAdministrador.trim() ||
            !telefoneAdministrador.trim() ||
            !password ||
            !confirmPassword
        ) {

            toast.error(
                "Preencha todos os campos obrigatórios."
            );

            return;
        }


        if (password.length < 6) {

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

            setLoading(true);


            // =================================================
            // CADASTRO
            // =================================================
            //
            // IMPORTANTE:
            //
            // O frontend NÃO escolhe o plano.
            //
            // O backend public-register é responsável por:
            //
            // 1. Criar o usuário
            // 2. Criar a igreja
            // 3. Criar o administrador
            // 4. Localizar a oferta Semente
            // 5. Criar a assinatura gratuita
            // 6. Calcular o vencimento do teste
            //
            // Portanto NÃO existe:
            //
            // ofertaSelecionada
            // oferta_id
            // PlansCatalogService
            //
            // aqui.
            // =================================================

            const {
                error,
            } =
                await AuthService.registerIgreja({

                    igreja: {

                        nome:
                            nomeIgreja.trim(),

                        sigla:
                            sigla.trim(),

                        cnpj:
                            cnpj.trim(),

                        telefone:
                            telefoneIgreja.trim(),

                        email:
                            emailIgreja.trim(),

                    },

                    administrador: {

                        nome:
                            nomeAdministrador.trim(),

                        email:
                            emailAdministrador.trim(),

                        telefone:
                            telefoneAdministrador.trim(),

                        password,

                    },

                });


            if (error) {

                toast.error(
                    error.message
                );

                return;
            }


            // =================================================
            // SUCESSO
            // =================================================

            toast.success(
                "Igreja cadastrada com sucesso!"
            );


            // =================================================
            // APÓS O CADASTRO
            // =================================================
            //
            // O AuthService realiza o login automático.
            //
            // A igreja já recebe o plano Semente gratuito.
            //
            // Agora enviamos o administrador para a tela
            // principal.
            //
            // A partir daqui o SubscriptionGuard controla
            // o acesso conforme a validade da assinatura.
            // =================================================

            navigate(
                "/",
                {
                    replace: true,
                }
            );


        } catch (error) {

            console.error(
                "Erro ao cadastrar igreja:",
                error
            );

            toast.error(
                "Não foi possível concluir o cadastro."
            );

        } finally {

            setLoading(false);
        }
    }


    return (

        <div className="min-h-screen bg-slate-100 px-4 py-10">

            <div className="mx-auto w-full max-w-2xl">


                {/* ================================================= */}
                {/* CABEÇALHO */}
                {/* ================================================= */}

                <div className="mb-8 text-center">

                    <h1 className="text-3xl font-bold text-blue-600">
                        EBD Manager
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Cadastre sua Igreja
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Crie a conta da sua igreja e defina
                        o primeiro administrador.
                    </p>

                </div>


                {/* ================================================= */}
                {/* FORMULÁRIO */}
                {/* ================================================= */}

                <form
                    onSubmit={handleRegister}
                    className="rounded-2xl bg-white p-6 shadow-lg sm:p-8"
                >


                    {/* ================================================= */}
                    {/* DADOS DA IGREJA */}
                    {/* ================================================= */}

                    <div className="mb-8">

                        <h2 className="text-xl font-semibold text-slate-800">
                            Dados da Igreja
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Informe os dados básicos da sua igreja.
                        </p>


                        <div className="mt-5 space-y-4">


                            {/* NOME */}

                            <div>

                                <label className="mb-2 block text-sm font-medium">
                                    Nome da igreja *
                                </label>

                                <input
                                    type="text"
                                    value={nomeIgreja}
                                    onChange={(event) =>
                                        setNomeIgreja(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ex.: Igreja Adoradores"
                                    autoComplete="organization"
                                    disabled={loading}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                />

                            </div>


                            {/* SIGLA / CNPJ */}

                            <div className="grid gap-4 sm:grid-cols-2">


                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Sigla
                                    </label>

                                    <input
                                        type="text"
                                        value={sigla}
                                        onChange={(event) =>
                                            setSigla(
                                                event.target.value
                                                    .toUpperCase()
                                            )
                                        }
                                        placeholder="Ex.: ADVE"
                                        maxLength={20}
                                        disabled={loading}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 uppercase outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />

                                </div>


                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        CNPJ
                                    </label>

                                    <input
                                        type="text"
                                        value={cnpj}
                                        onChange={(event) =>
                                            setCnpj(
                                                formatarCnpj(
                                                    event.target.value
                                                )
                                            )
                                        }
                                        placeholder="00.000.000/0000-00"
                                        inputMode="numeric"
                                        disabled={loading}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />

                                </div>

                            </div>


                            {/* TELEFONE / E-MAIL */}

                            <div className="grid gap-4 sm:grid-cols-2">


                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Telefone da igreja
                                    </label>

                                    <input
                                        type="text"
                                        value={telefoneIgreja}
                                        onChange={(event) =>
                                            setTelefoneIgreja(
                                                formatarTelefone(
                                                    event.target.value
                                                )
                                            )
                                        }
                                        placeholder="(11) 99999-9999"
                                        inputMode="tel"
                                        disabled={loading}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />

                                </div>


                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        E-mail da igreja
                                    </label>

                                    <input
                                        type="email"
                                        value={emailIgreja}
                                        onChange={(event) =>
                                            setEmailIgreja(
                                                event.target.value
                                            )
                                        }
                                        placeholder="contato@igreja.com"
                                        autoComplete="email"
                                        disabled={loading}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="my-8 border-t border-slate-200" />


                    {/* ================================================= */}
                    {/* ADMINISTRADOR */}
                    {/* ================================================= */}

                    <div>

                        <h2 className="text-xl font-semibold text-slate-800">
                            Administrador
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Esta pessoa será o primeiro administrador
                            da igreja.
                        </p>


                        <div className="mt-5 space-y-4">


                            {/* NOME */}

                            <div>

                                <label className="mb-2 block text-sm font-medium">
                                    Nome completo *
                                </label>

                                <input
                                    type="text"
                                    value={nomeAdministrador}
                                    onChange={(event) =>
                                        setNomeAdministrador(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ex.: João da Silva"
                                    autoComplete="name"
                                    disabled={loading}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                />

                            </div>


                            {/* E-MAIL */}

                            <div>

                                <label className="mb-2 block text-sm font-medium">
                                    E-mail *
                                </label>

                                <input
                                    type="email"
                                    value={emailAdministrador}
                                    onChange={(event) =>
                                        setEmailAdministrador(
                                            event.target.value
                                        )
                                    }
                                    placeholder="administrador@igreja.com"
                                    autoComplete="email"
                                    disabled={loading}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                />

                            </div>


                            {/* TELEFONE */}

                            <div>

                                <label className="mb-2 block text-sm font-medium">
                                    Telefone *
                                </label>

                                <input
                                    type="text"
                                    value={telefoneAdministrador}
                                    onChange={(event) =>
                                        setTelefoneAdministrador(
                                            formatarTelefone(
                                                event.target.value
                                            )
                                        )
                                    }
                                    placeholder="(11) 99999-9999"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    disabled={loading}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                />

                            </div>


                            {/* SENHA */}

                            <div>

                                <label className="mb-2 block text-sm font-medium">
                                    Senha *
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Mínimo de 6 caracteres"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (atual) =>
                                                    !atual
                                            )
                                        }
                                        disabled={loading}
                                        aria-label={
                                            showPassword
                                                ? "Ocultar senha"
                                                : "Mostrar senha"
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-blue-600 disabled:opacity-50"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>

                                </div>

                            </div>


                            {/* CONFIRMAÇÃO */}

                            <div>

                                <label className="mb-2 block text-sm font-medium">
                                    Confirmar senha *
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Repita sua senha"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (atual) =>
                                                    !atual
                                            )
                                        }
                                        disabled={loading}
                                        aria-label={
                                            showConfirmPassword
                                                ? "Ocultar confirmação de senha"
                                                : "Mostrar confirmação de senha"
                                        }
                                        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-blue-600 disabled:opacity-50"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* AVISO DO TESTE */}
                    {/* ================================================= */}

                    <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">

                        <p className="font-semibold">
                            Plano Semente gratuito
                        </p>

                        <p className="mt-1 leading-6">
                            Sua igreja será criada automaticamente
                            no plano Semente e terá acesso gratuito
                            durante o período de teste.
                        </p>

                        <p className="mt-1 leading-6">
                            Depois do período gratuito, você poderá
                            escolher o plano que melhor atende à sua igreja.
                        </p>

                    </div>


                    {/* ================================================= */}
                    {/* BOTÃO */}
                    {/* ================================================= */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? "Criando sua igreja..."
                            : "Criar minha igreja"}
                    </button>


                    {/* ================================================= */}
                    {/* LOGIN */}
                    {/* ================================================= */}

                    <div className="pt-4 text-center">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/login")
                            }
                            disabled={loading}
                            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                        >
                            Já tenho uma conta
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}