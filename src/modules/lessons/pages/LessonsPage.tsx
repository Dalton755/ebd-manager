import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    CalendarDays,
    ChevronLeft,
    ExternalLink,
    GraduationCap,
    Loader2,
    Plus,
    UserRound,
} from "lucide-react";

import { LessonService } from "../services/LessonService";
import { PeopleService } from "../../people/services/PeopleService";

import type { Aula } from "../types/Aula";
import type { Trimestre } from "../types/Trimestre";
import type { Pessoa } from "../../people/types/Pessoa";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { temPermissao } from "@/shared/auth/permissions";


export function LessonsPage() {

    const { pessoa } = useAuth();

    const perfilUsuario =
        pessoa?.perfil === "PENDENTE"
            ? undefined
            : pessoa?.perfil;

    const podeGerenciarAulas = temPermissao(
        perfilUsuario,
        "GERENCIAR_AULAS"
    );

    const podeVerProfessor =
        perfilUsuario === "ADMIN" ||
        perfilUsuario === "SUPERINTENDENTE" ||
        perfilUsuario === "PASTOR" ||
        perfilUsuario === "PROFESSOR";

    const { trimestreId } = useParams();

    const navigate = useNavigate();

    const [
        trimestre,
        setTrimestre,
    ] = useState<Trimestre | null>(null);

    const [
        aulas,
        setAulas,
    ] = useState<Aula[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const [
        numero,
        setNumero,
    ] = useState("");

    const [
        titulo,
        setTitulo,
    ] = useState("");

    const [
        data,
        setData,
    ] = useState("");

    const [
        linkDrive,
        setLinkDrive,
    ] = useState("");

    const [
        professores,
        setProfessores,
    ] = useState<Pessoa[]>([]);

    const [
        pessoas,
        setPessoas,
    ] = useState<Pessoa[]>([]);

    const [
        aulaSelecionada,
        setAulaSelecionada,
    ] = useState<Aula | null>(null);

    const [
        carregandoProfessores,
        setCarregandoProfessores,
    ] = useState(false);

    const [
        salvandoProfessor,
        setSalvandoProfessor,
    ] = useState(false);


    useEffect(() => {

        if (!trimestreId) {
            navigate("/aulas");
            return;
        }

        carregarDados();

    }, [trimestreId]);


    async function carregarDados() {

        if (!trimestreId) {
            return;
        }

        try {

            setLoading(true);

            setError("");

            const trimestres =
                await LessonService.listarTrimestres();

            const trimestreEncontrado =
                trimestres.find(
                    (item) =>
                        item.id === trimestreId
                );

            if (!trimestreEncontrado) {

                setError(
                    "Trimestre não encontrado."
                );

                return;
            }

            setTrimestre(
                trimestreEncontrado
            );

            const [
                aulasDoTrimestre,
                pessoasCadastradas,
            ] = await Promise.all([
                LessonService.listarAulasDoTrimestre(
                    trimestreId
                ),
                PeopleService.listar(),
            ]);

            setAulas(
                aulasDoTrimestre
            );

            setPessoas(
                pessoasCadastradas
            );

        } catch (error) {

            console.error(error);

            setError(
                "Não foi possível carregar as aulas."
            );

        } finally {

            setLoading(false);

        }

    }

    async function abrirSelecaoProfessor(
        aula: Aula
    ) {

        try {

            setCarregandoProfessores(true);

            setError("");

            const pessoas =
                await PeopleService.listar();

            const perfisQuePodemDarAula = [
                "ADMIN",
                "SUPERINTENDENTE",
                "PASTOR",
                "PROFESSOR",
            ];

            const professoresAtivos =
                pessoas.filter(
                    (pessoa) =>
                        perfisQuePodemDarAula.includes(
                            pessoa.perfil
                        )
                );

            setProfessores(
                professoresAtivos
            );

            setAulaSelecionada(aula);

        } catch (error) {

            console.error(error);

            setError(
                "Não foi possível carregar os professores."
            );

        } finally {

            setCarregandoProfessores(false);

        }

    }

    async function selecionarProfessor(
        professorId: string
    ) {

        if (!aulaSelecionada) {
            return;
        }

        try {

            setSalvandoProfessor(true);

            setError("");

            setSuccess("");

            await LessonService.definirProfessor(
                aulaSelecionada.id,
                professorId
            );

            const professor =
                professores.find(
                    (item) =>
                        item.id === professorId
                );

            const estavaEscalado =
                aulaSelecionada.professor_id !== null;

            setSuccess(
                professor
                    ? estavaEscalado
                        ? `${professor.nome} foi definido como novo professor da aula!`
                        : `${professor.nome} foi escalado com sucesso!`
                    : estavaEscalado
                        ? "Professor da aula atualizado com sucesso!"
                        : "Professor escalado com sucesso!"
            );

            setAulaSelecionada(null);

            await carregarDados();

        } catch (error) {

            console.error(error);

            setError(
                "Não foi possível escalar o professor."
            );

        } finally {

            setSalvandoProfessor(false);

        }

    }


    async function handleSubmit(
        event: React.FormEvent
    ) {

        event.preventDefault();

        if (!trimestreId) {
            return;
        }

        try {

            setSaving(true);

            setError("");

            setSuccess("");

            await LessonService.criarAula({
                trimestre_id: trimestreId,
                numero: Number(numero),
                titulo: titulo.trim(),
                data,
                professor_id: null,
                link_drive:
                    linkDrive.trim() || null,
            });

            setNumero("");

            setTitulo("");

            setData("");

            setLinkDrive("");

            setSuccess(
                "Aula cadastrada com sucesso!"
            );

            await carregarDados();

        } catch (error) {

            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível cadastrar a aula."
            );

        } finally {

            setSaving(false);

        }

    }


    function podeVisualizarAula(
        aula: Aula
    ) {

        if (
            perfilUsuario === "ADMIN" ||
            perfilUsuario === "SUPERINTENDENTE" ||
            perfilUsuario === "PASTOR"
        ) {
            return true;
        }

        if (
            perfilUsuario === "PROFESSOR"
        ) {
            return trimestre?.ativo === true;
        }

        if (
            perfilUsuario === "ALUNO"
        ) {

            if (
                trimestre?.ativo !== true
            ) {
                return false;
            }

            const hoje = new Date();

            const ano = hoje.getFullYear();

            const mes = String(
                hoje.getMonth() + 1
            ).padStart(2, "0");

            const dia = String(
                hoje.getDate()
            ).padStart(2, "0");

            const hojeFormatado =
                `${ano}-${mes}-${dia}`;

            return aula.data <= hojeFormatado;

        }

        return false;

    }


    function formatarData(
        valor: string
    ) {

        if (!valor) {
            return "";
        }

        const [
            ano,
            mes,
            dia,
        ] = valor.split("-");

        return `${dia}/${mes}/${ano}`;

    }

    function obterNomeProfessor(
        professorId: string | null
    ) {

        if (!professorId) {
            return null;
        }

        const professor =
            pessoas.find(
                (pessoa) =>
                    pessoa.id === professorId
            );

        return professor?.nome ?? "Professor definido";

    }

    const aulasVisiveis =
        aulas.filter(
            podeVisualizarAula
        );

    if (loading) {

        return (

            <div className="flex min-h-[300px] items-center justify-center">

                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />

            </div>

        );

    }


    return (

        <div className="mx-auto max-w-6xl space-y-6">

            <div className="flex items-start gap-4">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/aulas")
                    }
                    className="mt-1 rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                >

                    <ChevronLeft className="h-5 w-5" />

                </button>


                <div>

                    <h1 className="text-2xl font-bold text-slate-800">

                        {trimestre
                            ? `${trimestre.numero}º Trimestre de ${trimestre.ano}`
                            : "Aulas"}

                    </h1>

                    <p className="mt-1 text-slate-500">

                        {trimestre?.tema}

                    </p>

                </div>

            </div>


            {error && (

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    {error}

                </div>

            )}


            {success && (

                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                    {success}

                </div>

            )}


            <div
                className={
                    podeGerenciarAulas
                        ? "grid gap-6 lg:grid-cols-[380px_1fr]"
                        : "grid gap-6"
                }
            >

                {podeGerenciarAulas && (

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-5 flex items-center gap-2">

                            <Plus className="h-5 w-5 text-blue-600" />

                            <h2 className="font-semibold text-slate-800">

                                Nova aula

                            </h2>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >

                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">

                                    Número da aula

                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={numero}
                                    onChange={(event) =>
                                        setNumero(
                                            event.target.value
                                        )
                                    }
                                    required
                                    placeholder="Ex.: 1"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">

                                    Título da aula

                                </label>

                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={(event) =>
                                        setTitulo(
                                            event.target.value
                                        )
                                    }
                                    required
                                    placeholder="Ex.: Doutrina das Últimas Coisas"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">

                                    Data

                                </label>

                                <input
                                    type="date"
                                    value={data}
                                    onChange={(event) =>
                                        setData(
                                            event.target.value
                                        )
                                    }
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">

                                    Link do Google Drive

                                </label>

                                <input
                                    type="url"
                                    value={linkDrive}
                                    onChange={(event) =>
                                        setLinkDrive(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Opcional"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <button
                                type="submit"
                                disabled={saving}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {saving && (

                                    <Loader2 className="h-4 w-4 animate-spin" />

                                )}

                                {saving
                                    ? "Salvando..."
                                    : "Cadastrar aula"}

                            </button>

                        </form>

                    </section>

                )}


                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-5 py-4">

                        <h2 className="font-semibold text-slate-800">

                            Aulas cadastradas

                        </h2>

                    </div>


                    {aulasVisiveis.length === 0 ? (

                        <div className="p-8 text-center text-slate-500">

                            Nenhuma aula cadastrada neste trimestre.

                        </div>

                    ) : (

                        <div className="divide-y divide-slate-100">

                            {aulasVisiveis.map(
                                (aula) => (

                                    <div
                                        key={aula.id}
                                        className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                                    >

                                        <div className="flex items-start gap-4">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">

                                                {aula.numero}

                                            </div>


                                            <div>

                                                <h3 className="font-semibold text-slate-800">

                                                    {aula.titulo}

                                                </h3>


                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">

                                                    <span className="flex items-center gap-1">

                                                        <CalendarDays className="h-4 w-4" />

                                                        {formatarData(
                                                            aula.data
                                                        )}

                                                    </span>


                                                    {podeVerProfessor && (

                                                        aula.professor_id ? (

                                                            <span className="flex items-center gap-1 text-green-600">

                                                                <UserRound className="h-4 w-4" />

                                                                {obterNomeProfessor(
                                                                    aula.professor_id
                                                                )}

                                                            </span>

                                                        ) : (

                                                            <span className="flex items-center gap-1 text-amber-600">

                                                                <GraduationCap className="h-4 w-4" />

                                                                Professor pendente

                                                            </span>

                                                        )

                                                    )}

                                                </div>

                                            </div>

                                        </div>


                                        <div className="flex flex-wrap gap-2">

                                            {podeGerenciarAulas && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        abrirSelecaoProfessor(aula)
                                                    }
                                                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                                                >

                                                    {aula.professor_id
                                                        ? "Trocar professor"
                                                        : "Escalar professor"}

                                                </button>

                                            )}


                                            {aula.link_drive && (

                                                <a
                                                    href={aula.link_drive}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                >

                                                    <ExternalLink className="h-4 w-4" />

                                                    Material

                                                </a>

                                            )}

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>

            </div>

            {aulaSelecionada && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                            <div>

                                <h2 className="font-semibold text-slate-800">

                                    {aulaSelecionada.professor_id
                                        ? "Trocar professor"
                                        : "Escalar professor"}

                                </h2>

                                <p className="mt-1 text-sm text-slate-500">

                                    Aula {aulaSelecionada.numero}: {aulaSelecionada.titulo}

                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setAulaSelecionada(null)
                                }
                                disabled={salvandoProfessor}
                                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
                            >

                                Fechar

                            </button>

                        </div>


                        <div className="max-h-[400px] overflow-y-auto p-5">

                            {carregandoProfessores ? (

                                <div className="flex justify-center py-8">

                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />

                                </div>

                            ) : professores.length === 0 ? (

                                <p className="py-6 text-center text-sm text-slate-500">

                                    Nenhum professor ativo foi encontrado.

                                </p>

                            ) : (

                                <div className="space-y-2">

                                    {professores.map(
                                        (professor) => (

                                            <button
                                                key={professor.id}
                                                type="button"
                                                disabled={salvandoProfessor}
                                                onClick={() => {

                                                    if (professor.id) {

                                                        selecionarProfessor(
                                                            professor.id
                                                        );

                                                    }

                                                }}
                                                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >

                                                <div>

                                                    <p className="font-medium text-slate-800">

                                                        {professor.nome}

                                                    </p>

                                                    {professor.email && (

                                                        <p className="mt-1 text-sm text-slate-500">

                                                            {professor.email}

                                                        </p>

                                                    )}

                                                </div>

                                                {salvandoProfessor && (

                                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

                                                )}

                                            </button>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>



    );

}