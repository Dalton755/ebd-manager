import { useState } from "react";
import {
    CheckCircle2,
    KeyRound,
    LogOut,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PeopleService } from "@/modules/people/services/PeopleService";
import { peopleSchema } from "@/modules/people/validations/peopleSchema";
import { maskTelefone } from "@/shared/lib/masks";

import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

export function MeusDadosPage() {

    const {
        pessoa,
        logout,
    } = useAuth();

    const navigate = useNavigate();

    const [nome, setNome] =
        useState(pessoa?.nome ?? "");

    const [telefone, setTelefone] =
        useState(pessoa?.telefone ?? "");

    const [salvando, setSalvando] =
        useState(false);

    const [saindo, setSaindo] =
        useState(false);


    async function salvar() {

        if (!pessoa?.id) {
            toast.error(
                "Não foi possível identificar seu cadastro."
            );

            return;
        }

        const validacao =
            peopleSchema.safeParse({
                nome,
                email: pessoa.email,
                telefone,
            });

        if (!validacao.success) {

            toast.error(
                validacao.error.issues[0].message
            );

            return;
        }

        try {

            setSalvando(true);

            await PeopleService.editar(
                pessoa.id,
                {
                    nome: nome.trim(),
                    telefone,
                }
            );

            toast.success(
                "Seus dados foram atualizados com sucesso!"
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível atualizar seus dados."
            );

        } finally {

            setSalvando(false);

        }
    }


    async function sair() {

        try {

            setSaindo(true);


            await logout();

            navigate(
                "/login",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível sair da conta."
            );

        } finally {

            setSaindo(false);

        }
    }


    function formatarPerfil(
        perfil?: string
    ) {

        switch (perfil) {

            case "ALUNO":
                return "Aluno";

            case "PROFESSOR":
                return "Professor";

            case "PASTOR":
                return "Pastor";

            case "SUPERINTENDENTE":
                return "Superintendente";

            case "ADMIN":
                return "Administrador";

            default:
                return perfil ?? "Não informado";
        }
    }


    if (!pessoa) {

        return (
            <div className="mx-auto max-w-3xl py-12 text-center">

                <p className="text-slate-500">
                    Não foi possível carregar seus dados.
                </p>

            </div>
        );
    }


    return (

        <div className="mx-auto w-full max-w-4xl space-y-6">

            {/* ================================================= */}
            {/* CABEÇALHO */}
            {/* ================================================= */}

            <section>

                <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">

                        <UserRound
                            size={28}
                            className="text-blue-600"
                        />

                    </div>

                    <div>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Meus dados
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Gerencie suas informações pessoais e sua conta.
                        </p>

                    </div>

                </div>

            </section>


            {/* ================================================= */}
            {/* DADOS PESSOAIS */}
            {/* ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">

                            <UserRound
                                size={20}
                                className="text-blue-600"
                            />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Dados pessoais
                            </h2>

                            <p className="text-sm text-slate-500">
                                Mantenha suas informações atualizadas.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="space-y-5 p-6">

                    {/* NOME */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Nome
                        </label>

                        <Input
                            value={nome}
                            onChange={(e) =>
                                setNome(
                                    e.target.value
                                )
                            }
                            placeholder="Seu nome"
                        />

                    </div>


                    {/* E-MAIL */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            E-mail
                        </label>

                        <div className="relative">

                            <Mail
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <Input
                                value={pessoa.email}
                                disabled
                                className="bg-slate-50 pl-10 text-slate-500"
                            />

                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                            O e-mail está vinculado à sua conta de login.
                        </p>

                    </div>


                    {/* TELEFONE */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Telefone
                        </label>

                        <div className="relative">

                            <Phone
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <Input
                                value={telefone}
                                onChange={(e) =>
                                    setTelefone(
                                        maskTelefone(
                                            e.target.value
                                        )
                                    )
                                }
                                placeholder="(11) 99999-9999"
                                className="pl-10"
                            />

                        </div>

                    </div>


                    {/* PERFIL / STATUS */}

                    <div className="grid gap-4 sm:grid-cols-2">

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Perfil
                            </p>

                            <div className="mt-2 flex items-center gap-2">

                                <ShieldCheck
                                    size={18}
                                    className="text-blue-600"
                                />

                                <span className="font-semibold text-slate-800">
                                    {formatarPerfil(
                                        pessoa.perfil
                                    )}
                                </span>

                            </div>

                        </div>


                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Status da conta
                            </p>

                            <div className="mt-2 flex items-center gap-2">

                                <CheckCircle2
                                    size={18}
                                    className="text-green-600"
                                />

                                <span className="font-semibold text-slate-800">
                                    {pessoa.status ===
                                    "ATIVO"
                                        ? "Ativa"
                                        : pessoa.status}
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* SALVAR */}

                    <div className="flex justify-end border-t border-slate-100 pt-5">

                        <Button
                            onClick={salvar}
                            disabled={salvando}
                        >
                            {salvando
                                ? "Salvando..."
                                : "Salvar alterações"}
                        </Button>

                    </div>

                </div>

            </section>


            {/* ================================================= */}
            {/* LOGIN E SEGURANÇA */}
            {/* ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                            <KeyRound
                                size={20}
                                className="text-slate-700"
                            />

                        </div>

                        <div>

                            <h2 className="font-bold text-slate-900">
                                Login e segurança
                            </h2>

                            <p className="text-sm text-slate-500">
                                Informações relacionadas ao acesso da sua conta.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="space-y-5 p-6">

                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">

                            <Mail
                                size={18}
                                className="text-slate-500"
                            />

                        </div>

                        <div className="min-w-0">

                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Conta de login
                            </p>

                            <p className="truncate font-medium text-slate-800">
                                {pessoa.email}
                            </p>

                        </div>

                    </div>


                    <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <div className="flex items-center gap-2">

                                <LogOut
                                    size={18}
                                    className="text-red-600"
                                />

                                <p className="font-semibold text-slate-900">
                                    Sair da conta
                                </p>

                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                Encerra sua sessão neste dispositivo.
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={sair}
                            disabled={saindo}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
                        >

                            <LogOut
                                size={17}
                            />

                            {saindo
                                ? "Saindo..."
                                : "Sair da conta"}

                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
}