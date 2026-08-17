import {
    useEffect,
    useState,
} from "react";

import { toast } from "sonner";
import {
    CheckCircle2,
    BookOpen,
    Pencil,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Trimestre } from "../types/Trimestre";
import { LessonService } from "../services/LessonService";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { usePlan } from "@/shared/plans/usePlan";
import { temPermissao } from "@/shared/auth/permissions";
import { PlanLimitModal } from "@/shared/components/plans/PlanLimitModal";

export function TrimestersPage() {

    const navigate = useNavigate();

    const { pessoa } = useAuth();

    const {
        obterLimite,
    } = usePlan();

    const maxTrimestresCadastrados =
    obterLimite("max_trimestres");

    const perfilUsuario =
        pessoa?.perfil === "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const podeGerenciarTrimestres = temPermissao(
        perfilUsuario,
        "GERENCIAR_AULAS"
    );

    const podeAcessarTodasAsAulas =
        perfilUsuario === "ADMIN" ||
        perfilUsuario === "SUPERINTENDENTE" ||
        perfilUsuario === "PASTOR";

    const podeAcessarAulasDoTrimestre =
        perfilUsuario === "PROFESSOR" ||
        perfilUsuario === "ALUNO";

    const [trimestres, setTrimestres] =
        useState<Trimestre[]>([]);

    const trimestresVisiveis =
        perfilUsuario === "ALUNO"
            ? trimestres.filter((trimestre) => trimestre.ativo)
            : trimestres;

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [mostrarModalLimite, setMostrarModalLimite] =
        useState(false);

    const [numero, setNumero] =
        useState("1");

    const [ano, setAno] =
        useState(
            new Date().getFullYear().toString()
        );

    const [tema, setTema] =
        useState("");

    const [trimestreSelecionado, setTrimestreSelecionado] =
        useState<Trimestre | undefined>();



    async function carregarTrimestres() {

        try {

            setLoading(true);

            const data =
                await LessonService.listarTrimestres();

            setTrimestres(data);

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar os trimestres."
            );

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {

        carregarTrimestres();

    }, []);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (!trimestreSelecionado) {

            const quantidadeTrimestres =
                trimestres.length;

            if (
                maxTrimestresCadastrados !== -1 &&
                quantidadeTrimestres >= maxTrimestresCadastrados
            ) {
                setMostrarModalLimite(true);
                return;
            }
        }

        try {

            setSaving(true);

            if (trimestreSelecionado) {

                await LessonService.atualizarTrimestre(
                    trimestreSelecionado.id,
                    {
                        numero: Number(numero),
                        ano: Number(ano),
                        tema,
                    }
                );

                toast.success(
                    "Trimestre atualizado com sucesso!"
                );

            } else {

                await LessonService.criarTrimestre(
                    Number(numero),
                    Number(ano),
                    tema,
                    maxTrimestresCadastrados
                );

                toast.success(
                    "Trimestre cadastrado com sucesso!"
                );
            }

            setTema("");

            setNumero("1");

            setAno(
                new Date().getFullYear().toString()
            );

            setTrimestreSelecionado(undefined);

            await carregarTrimestres();

        } catch (error) {

            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível cadastrar o trimestre."
            );

        } finally {

            setSaving(false);

        }
    }

    async function ativarTrimestre(
        trimestreId: string
    ) {

        try {

            await LessonService.ativarTrimestre(
                trimestreId
            );

            toast.success(
                "Trimestre ativado com sucesso!"
            );

            await carregarTrimestres();

        } catch (error) {

            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível ativar o trimestre."
            );
        }
    }

    return (

        <div className="mx-auto max-w-6xl">

            <div className="mb-8">

                <h1 className="text-2xl font-bold text-slate-800">
                    Trimestres
                </h1>

                <p className="mt-1 text-slate-500">
                    Cadastre e gerencie os temas da Escola Bíblica Dominical.
                </p>

            </div>

            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

                {podeGerenciarTrimestres && (

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                        <h2 className="mb-6 text-lg font-semibold text-slate-800">
                            {trimestreSelecionado
                                ? "Editar trimestre"
                                : "Novo trimestre"}
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Trimestre
                                </label>

                                <select
                                    value={numero}
                                    onChange={(event) =>
                                        setNumero(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                >
                                    <option value="1">
                                        1º Trimestre
                                    </option>

                                    <option value="2">
                                        2º Trimestre
                                    </option>

                                    <option value="3">
                                        3º Trimestre
                                    </option>

                                    <option value="4">
                                        4º Trimestre
                                    </option>

                                </select>

                            </div>

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Ano
                                </label>

                                <input
                                    type="number"
                                    value={ano}
                                    onChange={(event) =>
                                        setAno(
                                            event.target.value
                                        )
                                    }
                                    min="2020"
                                    max="2100"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                />

                            </div>

                            <div>

                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Tema do trimestre
                                </label>

                                <input
                                    type="text"
                                    value={tema}
                                    onChange={(event) =>
                                        setTema(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ex.: Escatologia"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Salvando..."
                                    : trimestreSelecionado
                                        ? "Salvar alterações"
                                        : "Cadastrar trimestre"}
                            </button>

                        </form>

                    </div>

                )}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-5">

                        <h2 className="font-semibold text-slate-800">
                            Trimestres cadastrados
                        </h2>

                    </div>

                    {loading ? (

                        <div className="p-8 text-center text-slate-500">
                            Carregando trimestres...
                        </div>

                    ) : trimestresVisiveis.length === 0 ? (

                        <div className="p-8 text-center text-slate-500">
                            Nenhum trimestre cadastrado.
                        </div>

                    ) : (

                        <div className="divide-y divide-slate-100">

                            {trimestresVisiveis.map((trimestre) => (

                                <div
                                    key={trimestre.id}
                                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                                >

                                    <div>

                                        <div className="flex items-center gap-3">

                                            <h3 className="font-semibold text-slate-800">
                                                {trimestre.numero}º Trimestre de {trimestre.ano}
                                            </h3>

                                            {trimestre.ativo && (

                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">

                                                    <CheckCircle2 size={14} />

                                                    Atual

                                                </span>

                                            )}

                                        </div>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {trimestre.tema}
                                        </p>

                                    </div>

                                    {podeGerenciarTrimestres && (

                                        <div className="flex flex-wrap gap-3">


                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTrimestreSelecionado(trimestre);

                                                    setNumero(
                                                        trimestre.numero.toString()
                                                    );

                                                    setAno(
                                                        trimestre.ano.toString()
                                                    );

                                                    setTema(
                                                        trimestre.tema
                                                    );

                                                    window.scrollTo({
                                                        top: 0,
                                                        behavior: "smooth",
                                                    });
                                                }}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <Pencil size={16} />

                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/aulas/${trimestre.id}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                            >
                                                <BookOpen size={16} />

                                                Gerenciar aulas
                                            </button>

                                            {!trimestre.ativo && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        ativarTrimestre(
                                                            trimestre.id
                                                        )
                                                    }
                                                    className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                                                >
                                                    Tornar atual
                                                </button>

                                            )}

                                        </div>

                                    )}

                                    {!podeGerenciarTrimestres &&
                                        (
                                            podeAcessarTodasAsAulas ||
                                            (
                                                podeAcessarAulasDoTrimestre &&
                                                trimestre.ativo
                                            )
                                        ) && (

                                            <div className="flex flex-wrap gap-3">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/aulas/${trimestre.id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                                >
                                                    <BookOpen size={16} />

                                                    Ver aulas
                                                </button>

                                            </div>

                                        )}



                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </div>

            <PlanLimitModal
                open={mostrarModalLimite}
                utilizado={trimestres.length}
                limite={maxTrimestresCadastrados}
                recurso="trimestres"
                onClose={() =>
                    setMostrarModalLimite(false)
                }
            />  

        </div>



    );
}