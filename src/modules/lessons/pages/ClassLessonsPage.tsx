import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    ArrowLeft,
    Ban,
    BookOpen,
    CalendarDays,
    Clock3,
    ExternalLink,
    GraduationCap,
    Loader2,
    Pencil,
    Plus,
    UserRound,
    X,
} from "lucide-react";

import { toast } from "sonner";

import { LessonService } from "../services/LessonService";

import { PeopleService } from "../../people/services/PeopleService";

import type { Pessoa } from "../../people/types/Pessoa";

import type {
    AulaComStatus,
} from "../services/LessonService";

import type {
    ClasseNoTrimestre,
    TrimestreComClasses,
} from "../types/TrimestreClasse";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import { temPermissao } from "@/shared/auth/permissions";

import { useFormDraft } from "@/shared/hooks/useFormDraft";


function formatarData(
    data: string
) {

    if (!data) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "pt-BR"
    ).format(
        new Date(
            `${data}T00:00:00`
        )
    );
}


function formatarHora(
    hora: string | null
) {

    return hora
        ? hora.slice(
            0,
            5
        )
        : "-";
}


type ContextoPagina = {
    trimestre: TrimestreComClasses;
    classe: ClasseNoTrimestre;
};


const formularioVazio = {
    numero: "",
    titulo: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    linkDrive: "",
};


export function ClassLessonsPage() {

    const {
        trimestreId,
        classeId,
    } =
        useParams();


    const navigate =
        useNavigate();


    const {
        pessoa,
    } =
        useAuth();


    const perfilUsuario =
        pessoa?.perfil ===
            "PENDENTE"
            ? undefined
            : pessoa?.perfil;


    const podeGerenciarAulas =
        temPermissao(
            perfilUsuario,
            "GERENCIAR_AULAS"
        );


    const [
        contexto,
        setContexto,
    ] =
        useState<ContextoPagina | null>(
            null
        );


    const [
        aulas,
        setAulas,
    ] =
        useState<AulaComStatus[]>(
            []
        );


    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );


    const [
        modalNovaAula,
        setModalNovaAula,
    ] =
        useState(
            false
        );


    const [
        aulaSelecionada,
        setAulaSelecionada,
    ] =
        useState<AulaComStatus | null>(
            null
        );


    const [
        aulaParaEditar,
        setAulaParaEditar,
    ] =
        useState<AulaComStatus | null>(
            null
        );


    const [
        formularioEdicao,
        setFormularioEdicao,
    ] =
        useState(
            formularioVazio
        );


    const [
        saving,
        setSaving,
    ] =
        useState(
            false
        );

    const [
        professores,
        setProfessores,
    ] =
        useState<Pessoa[]>(
            []
        );


    const [
        modalProfessor,
        setModalProfessor,
    ] =
        useState(
            false
        );


    const [
        carregandoProfessores,
        setCarregandoProfessores,
    ] =
        useState(
            false
        );


    const [
        salvandoProfessor,
        setSalvandoProfessor,
    ] =
        useState(
            false
        );


    const [
        professorSelecionadoId,
        setProfessorSelecionadoId,
    ] =
        useState(
            ""
        );

    const [
        modalCancelarAula,
        setModalCancelarAula,
    ] =
        useState(
            false
        );


    const [
        motivoCancelamento,
        setMotivoCancelamento,
    ] =
        useState(
            ""
        );


    const [
        cancelandoAula,
        setCancelandoAula,
    ] =
        useState(
            false
        );


    const {
        valores:
        formulario,

        setValores:
        setFormulario,

        limparRascunho,

        rascunhoRecuperado,
    } =
        useFormDraft(
            `nova-aula-${trimestreId ?? "sem-trimestre"}-${classeId ?? "sem-classe"}`,
            formularioVazio
        );

    const formularioAtivo =
        aulaParaEditar
            ? formularioEdicao
            : formulario;


    async function carregarDados(
        silencioso = false
    ) {

        if (
            !trimestreId ||
            !classeId ||
            !pessoa?.igreja_id
        ) {
            return;
        }


        try {

            if (!silencioso) {
                setLoading(
                    true
                );
            }


            const [
                trimestres,
                aulasDaClasse,
            ] =
                await Promise.all([
                    LessonService
                        .listarTrimestresComClasses(
                            pessoa.igreja_id
                        ),

                    LessonService
                        .listarAulasDaClasseNoTrimestre(
                            trimestreId,
                            classeId
                        ),
                ]);


            const trimestre =
                trimestres.find(
                    (item) =>
                        item.id ===
                        trimestreId
                );


            const classe =
                trimestre?.classes.find(
                    (item) =>
                        item.classe_id ===
                        classeId
                );


            if (
                !trimestre ||
                !classe
            ) {

                throw new Error(
                    "Classe ou trimestre não encontrado."
                );
            }


            setContexto({
                trimestre,
                classe,
            });


            setAulas(
                aulasDaClasse
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar as aulas."
            );

        } finally {

            if (!silencioso) {
                setLoading(
                    false
                );
            }
        }
    }


    useEffect(() => {

        if (
            !trimestreId ||
            !classeId
        ) {

            navigate(
                "/aulas"
            );

            return;
        }


        if (
            !pessoa?.igreja_id
        ) {
            return;
        }


        void carregarDados();

    }, [
        trimestreId,
        classeId,
        pessoa?.igreja_id,
    ]);


    function atualizarCampo(
        campo:
            keyof typeof formularioVazio,
        valor: string
    ) {

        if (aulaParaEditar) {

            setFormularioEdicao(
                (
                    atual
                ) => ({
                    ...atual,
                    [campo]:
                        valor,
                })
            );

            return;
        }


        setFormulario(
            (
                atual
            ) => ({
                ...atual,
                [campo]:
                    valor,
            })
        );
    }

    function abrirNovaAula() {

        setAulaParaEditar(
            null
        );

        setModalNovaAula(
            true
        );
    }


    function abrirEdicaoAula() {

        if (!aulaSelecionada) {
            return;
        }


        setFormularioEdicao({

            numero:
                String(
                    aulaSelecionada.numero
                ),

            titulo:
                aulaSelecionada.titulo,

            data:
                aulaSelecionada.data,

            horaInicio:
                aulaSelecionada.hora_inicio
                    ?.slice(
                        0,
                        5
                    ) ?? "",

            horaFim:
                aulaSelecionada.hora_fim
                    ?.slice(
                        0,
                        5
                    ) ?? "",

            linkDrive:
                aulaSelecionada.link_drive ??
                "",
        });


        setAulaParaEditar(
            aulaSelecionada
        );


        setAulaSelecionada(
            null
        );


        setModalNovaAula(
            true
        );
    }


    function fecharModalAula() {

        setModalNovaAula(
            false
        );


        if (aulaParaEditar) {

            setAulaParaEditar(
                null
            );

            setFormularioEdicao(
                formularioVazio
            );
        }
    }

    async function abrirSelecaoProfessor() {

        if (
            !aulaSelecionada ||
            !pessoa?.igreja_id
        ) {
            return;
        }


        setProfessorSelecionadoId(
            aulaSelecionada.professor_id ??
            ""
        );


        setModalProfessor(
            true
        );


        try {

            setCarregandoProfessores(
                true
            );


            const pessoas =
                await PeopleService.listar(
                    pessoa.igreja_id
                );


            const ministrantesAtivos =
                pessoas
                    .filter(
                        (item) =>
                            item.perfil !== "ALUNO" &&
                            item.perfil !== "PENDENTE" &&
                            item.ativo === true &&
                            item.status === "ATIVO"
                    )
                    .sort(
                        (a, b) =>
                            a.nome.localeCompare(
                                b.nome,
                                "pt-BR"
                            )
                    );


            setProfessores(
                ministrantesAtivos
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                "Não foi possível carregar os professores."
            );


            setModalProfessor(
                false
            );

        } finally {

            setCarregandoProfessores(
                false
            );
        }
    }

    async function salvarProfessor() {

        if (
            !aulaSelecionada
        ) {
            return;
        }


        try {

            setSalvandoProfessor(
                true
            );


            const professorId =
                professorSelecionadoId ||
                null;


            await LessonService
                .definirProfessor(
                    aulaSelecionada.id,
                    professorId
                );


            const professor =
                professores.find(
                    (item) =>
                        item.id ===
                        professorId
                );


            if (professor) {

                toast.success(
                    aulaSelecionada.professor_id
                        ? `${professor.nome} foi definido como novo professor.`
                        : `${professor.nome} foi escalado com sucesso.`
                );

            } else {

                toast.success(
                    "Professor removido da aula."
                );
            }


            setModalProfessor(
                false
            );


            setAulaSelecionada(
                null
            );


            await carregarDados(
                true
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível atualizar o professor."
            );

        } finally {

            setSalvandoProfessor(
                false
            );
        }
    }

    async function confirmarCancelamentoAula() {

        if (
            !aulaSelecionada ||
            !pessoa?.id
        ) {
            return;
        }


        try {

            setCancelandoAula(
                true
            );


            await LessonService
                .cancelarAula(
                    aulaSelecionada.id,
                    pessoa.id,
                    motivoCancelamento
                );


            toast.success(
                "Aula cancelada com sucesso."
            );


            setModalCancelarAula(
                false
            );

            setMotivoCancelamento(
                ""
            );

            setAulaSelecionada(
                null
            );


            await carregarDados(
                true
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível cancelar a aula."
            );

        } finally {

            setCancelandoAula(
                false
            );
        }
    }


    async function salvarAula(
        event:
            React.FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();


        if (
            !trimestreId ||
            !classeId ||
            !pessoa?.igreja_id
        ) {
            return;
        }


        try {

            setSaving(
                true
            );


            const dadosAula = {

                numero:
                    Number(
                        formularioAtivo.numero
                    ),

                titulo:
                    formularioAtivo.titulo
                        .trim(),

                data:
                    formularioAtivo.data,

                hora_inicio:
                    formularioAtivo.horaInicio,

                hora_fim:
                    formularioAtivo.horaFim,

                link_drive:
                    formularioAtivo.linkDrive
                        .trim()
                        ? formularioAtivo.linkDrive
                            .trim()
                        : null,
            };


            /*
             * EDIÇÃO
             */
            if (aulaParaEditar) {

                await LessonService
                    .atualizarAula(
                        aulaParaEditar.id,
                        dadosAula
                    );


                toast.success(
                    "Aula atualizada com sucesso!"
                );


                setAulaParaEditar(
                    null
                );


                setFormularioEdicao(
                    formularioVazio
                );

            } else {

                /*
                 * NOVA AULA
                 */
                await LessonService
                    .criarAula(
                        {
                            trimestre_id:
                                trimestreId,

                            classe_id:
                                classeId,

                            ...dadosAula,

                            professor_id:
                                null,
                        },

                        pessoa.igreja_id
                    );


                limparRascunho();


                setFormulario(
                    formularioVazio
                );


                toast.success(
                    "Aula cadastrada com sucesso!"
                );
            }


            setModalNovaAula(
                false
            );


            await carregarDados(
                true
            );

        } catch (error) {

            console.error(
                error
            );


            toast.error(

                error instanceof Error

                    ? error.message

                    : aulaParaEditar

                        ? "Não foi possível atualizar a aula."

                        : "Não foi possível cadastrar a aula."
            );

        } finally {

            setSaving(
                false
            );
        }
    }


    if (loading) {

        return (
            <div className="flex min-h-[55vh] items-center justify-center">

                <div className="text-center">

                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                        Carregando aulas...
                    </p>

                </div>

            </div>
        );
    }


    if (!contexto) {

        return (
            <div className="p-6">

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
                    Não foi possível localizar esta classe no trimestre.
                </div>

            </div>
        );
    }


    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">

            {/* CABEÇALHO */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-4">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/aulas"
                                )
                            }
                            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                            title="Voltar"
                        >
                            <ArrowLeft size={19} />
                        </button>


                        <div>

                            <div className="flex flex-wrap items-center gap-2">

                                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                    {contexto.classe.classe_nome}
                                </h1>


                                {contexto.trimestre.ativo && (
                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                        Trimestre atual
                                    </span>
                                )}

                            </div>


                            <p className="mt-1 text-sm text-slate-500">

                                {contexto.trimestre.numero}º Trimestre de{" "}
                                {contexto.trimestre.ano}

                            </p>


                            <p className="mt-2 text-base font-medium text-blue-700">

                                {contexto.classe.tema ??
                                    "Tema não definido"}

                            </p>

                        </div>

                    </div>


                    {podeGerenciarAulas && (

                        <button
                            type="button"
                            onClick={
                                abrirNovaAula
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Adicionar aula
                        </button>

                    )}

                </div>

            </section>


            {/* LISTA */}

            <section>

                <div className="mb-4 flex items-center justify-between">

                    <div>

                        <h2 className="text-lg font-semibold text-slate-900">
                            Aulas
                        </h2>

                        <p className="text-sm text-slate-500">

                            {aulas.length}{" "}
                            {aulas.length === 1
                                ? "aula cadastrada"
                                : "aulas cadastradas"}

                        </p>

                    </div>

                </div>


                {aulas.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                        <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

                        <h3 className="mt-4 font-semibold text-slate-700">
                            Nenhuma aula cadastrada
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Adicione a primeira aula desta classe.
                        </p>

                    </div>

                ) : (

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                        {aulas.map(
                            (
                                aula
                            ) => (

                                <button
                                    key={aula.id}
                                    type="button"
                                    onClick={() =>
                                        setAulaSelecionada(
                                            aula
                                        )
                                    }
                                    className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                >

                                    <div className="flex items-start justify-between gap-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
                                                {aula.numero}
                                            </div>


                                            <div>

                                                <div className="flex flex-wrap items-center gap-2">

                                                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                                        Aula {aula.numero}
                                                    </p>


                                                    {aula.cancelada && (

                                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                                                            Cancelada
                                                        </span>

                                                    )}

                                                </div>

                                                <h3 className="mt-1 font-semibold text-slate-900">
                                                    {aula.titulo}
                                                </h3>

                                            </div>

                                        </div>


                                        <span className="text-slate-300 transition group-hover:text-blue-500">
                                            →
                                        </span>

                                    </div>


                                    <div className="mt-5 space-y-2 text-sm text-slate-500">

                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={16} />
                                            {formatarData(
                                                aula.data
                                            )}
                                        </div>


                                        <div className="flex items-center gap-2">
                                            <Clock3 size={16} />

                                            {formatarHora(
                                                aula.hora_inicio
                                            )}

                                            {" às "}

                                            {formatarHora(
                                                aula.hora_fim
                                            )}

                                        </div>


                                        <div
                                            className={
                                                aula.professor_id
                                                    ? "flex items-center gap-2 text-green-700"
                                                    : "flex items-center gap-2 text-amber-600"
                                            }
                                        >

                                            <GraduationCap size={16} />

                                            {aula.professor_id
                                                ? aula.professor?.nome ??
                                                "Professor escalado"
                                                : "Professor pendente"}

                                        </div>

                                    </div>

                                </button>
                            )
                        )}

                    </div>

                )}

            </section>


            {/* MODAL NOVA AULA */}

            {modalNovaAula && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

                    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    {aulaParaEditar
                                        ? "Editar aula"
                                        : "Adicionar aula"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {contexto.classe.classe_nome}
                                    {" • "}
                                    {contexto.classe.tema ??
                                        "Tema não definido"}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    fecharModalAula
                                }
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <form
                            onSubmit={
                                salvarAula
                            }
                            className="space-y-5 p-6"
                        >

                            {!aulaParaEditar &&
                                rascunhoRecuperado && (

                                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                        Rascunho recuperado. Continuamos de onde você parou.
                                    </div>

                                )}


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Número da aula
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={
                                        formularioAtivo.numero
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarCampo(
                                            "numero",
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Título
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={
                                        formularioAtivo.titulo
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarCampo(
                                            "titulo",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ex.: A justificação pela fé"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Data
                                </label>

                                <input
                                    type="date"
                                    required
                                    value={
                                        formularioAtivo.data
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarCampo(
                                            "data",
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>

                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Hora de início
                                    </label>

                                    <input
                                        type="time"
                                        required
                                        value={
                                            formularioAtivo.horaInicio
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "horaInicio",
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                                    />

                                </div>


                                <div>

                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Hora de término
                                    </label>

                                    <input
                                        type="time"
                                        required
                                        value={
                                            formularioAtivo.horaFim
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarCampo(
                                                "horaFim",
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                                    />

                                </div>

                            </div>


                            <div>

                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Link do material
                                </label>

                                <input
                                    type="url"
                                    value={
                                        formularioAtivo.linkDrive
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarCampo(
                                            "linkDrive",
                                            event.target.value
                                        )
                                    }
                                    placeholder="https://..."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                                />

                            </div>


                            {!aulaParaEditar && (

                                <p className="text-xs text-slate-400">
                                    Rascunho salvo automaticamente.
                                </p>

                            )}


                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                                <button
                                    type="button"
                                    disabled={
                                        saving
                                    }
                                    onClick={
                                        fecharModalAula
                                    }
                                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Fechar
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                >

                                    {saving && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}

                                    {aulaParaEditar
                                        ? "Salvar alterações"
                                        : "Salvar aula"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* DETALHES DA AULA */}

            {aulaSelecionada && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-start justify-between border-b border-slate-100 p-6">

                            <div>

                                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                    Aula {aulaSelecionada.numero}
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {aulaSelecionada.titulo}
                                </h2>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setAulaSelecionada(
                                        null
                                    )
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>

                        </div>


                        <div className="space-y-4 p-6">

                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <CalendarDays size={18} />
                                {formatarData(
                                    aulaSelecionada.data
                                )}
                            </div>


                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Clock3 size={18} />

                                {formatarHora(
                                    aulaSelecionada.hora_inicio
                                )}

                                {" às "}

                                {formatarHora(
                                    aulaSelecionada.hora_fim
                                )}

                            </div>


                            <div className="flex items-center gap-3 text-sm text-slate-600">

                                <UserRound size={18} />

                                {aulaSelecionada.professor_id
                                    ? aulaSelecionada.professor?.nome ??
                                    "Professor escalado"
                                    : "Professor ainda não escalado"}

                            </div>

                            {aulaSelecionada.cancelada && (

                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                                    <div className="flex items-center gap-2 font-semibold text-red-700">
                                        <Ban size={18} />
                                        Aula cancelada
                                    </div>


                                    {aulaSelecionada.motivo_cancelamento && (

                                        <p className="mt-2 text-sm text-red-600">
                                            Motivo:{" "}
                                            {aulaSelecionada.motivo_cancelamento}
                                        </p>

                                    )}

                                </div>

                            )}

                            {podeGerenciarAulas &&
                                !aulaSelecionada.cancelada && (

                                    <div className="grid gap-3 sm:grid-cols-2">

                                        <button
                                            type="button"

                                            onClick={
                                                abrirEdicaoAula
                                            }

                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                        >

                                            <Pencil
                                                size={18}
                                            />

                                            Editar aula

                                        </button>


                                        <button
                                            type="button"

                                            onClick={
                                                abrirSelecaoProfessor
                                            }

                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                        >

                                            <GraduationCap
                                                size={18}
                                            />

                                            {aulaSelecionada.professor_id
                                                ? "Trocar professor"
                                                : "Escalar professor"}

                                        </button>

                                        <button
                                            type="button"

                                            onClick={() => {
                                                setMotivoCancelamento(
                                                    ""
                                                );

                                                setModalCancelarAula(
                                                    true
                                                );
                                            }}

                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:col-span-2"
                                        >

                                            <Ban size={18} />

                                            Cancelar aula

                                        </button>

                                    </div>

                                )}


                            {aulaSelecionada.link_drive && (

                                <a
                                    href={
                                        aulaSelecionada.link_drive
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    <ExternalLink size={16} />
                                    Abrir material
                                </a>

                            )}

                        </div>

                    </div>

                </div>

            )}

            {/* CANCELAR AULA */}
            {modalCancelarAula &&
                aulaSelecionada && (

                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4">

                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">


                            <div className="flex items-start justify-between border-b border-slate-100 p-5">

                                <div>

                                    <h2 className="text-lg font-bold text-slate-900">
                                        Cancelar aula
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Aula {aulaSelecionada.numero}
                                        {" • "}
                                        {aulaSelecionada.titulo}
                                    </p>

                                </div>


                                <button
                                    type="button"

                                    disabled={
                                        cancelandoAula
                                    }

                                    onClick={() =>
                                        setModalCancelarAula(
                                            false
                                        )
                                    }

                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={20} />
                                </button>

                            </div>


                            <div className="space-y-5 p-6">

                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                    A aula permanecerá registrada no sistema, mas será marcada como cancelada.
                                    Alunos e professor serão notificados.
                                </div>


                                <div>

                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Motivo do cancelamento
                                        <span className="ml-1 font-normal text-slate-400">
                                            (opcional)
                                        </span>
                                    </label>


                                    <textarea
                                        rows={3}

                                        value={
                                            motivoCancelamento
                                        }

                                        onChange={(
                                            event
                                        ) =>
                                            setMotivoCancelamento(
                                                event.target.value
                                            )
                                        }

                                        disabled={
                                            cancelandoAula
                                        }

                                        placeholder="Ex.: atividade especial da igreja"

                                        className="w-full resize-none rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-500 disabled:bg-slate-50"
                                    />

                                </div>


                                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                                    <button
                                        type="button"

                                        disabled={
                                            cancelandoAula
                                        }

                                        onClick={() =>
                                            setModalCancelarAula(
                                                false
                                            )
                                        }

                                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Voltar
                                    </button>


                                    <button
                                        type="button"

                                        disabled={
                                            cancelandoAula
                                        }

                                        onClick={
                                            confirmarCancelamentoAula
                                        }

                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                    >

                                        {cancelandoAula
                                            ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )
                                            : (
                                                <Ban size={17} />
                                            )
                                        }

                                        {cancelandoAula
                                            ? "Cancelando..."
                                            : "Confirmar cancelamento"}

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            {/* ESCALAR PROFESSOR */}

            {modalProfessor &&
                aulaSelecionada && (

                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4">

                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">


                            {/* CABEÇALHO */}

                            <div className="flex items-start justify-between border-b border-slate-100 p-5">

                                <div>

                                    <h2 className="text-lg font-bold text-slate-900">

                                        {aulaSelecionada.professor_id
                                            ? "Trocar professor"
                                            : "Escalar professor"}

                                    </h2>


                                    <p className="mt-1 text-sm text-slate-500">

                                        Aula {aulaSelecionada.numero}
                                        {" • "}
                                        {aulaSelecionada.titulo}

                                    </p>

                                </div>


                                <button
                                    type="button"

                                    disabled={
                                        salvandoProfessor
                                    }

                                    onClick={() =>
                                        setModalProfessor(
                                            false
                                        )
                                    }

                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >

                                    <X size={20} />

                                </button>

                            </div>


                            {/* CONTEÚDO */}

                            <div className="space-y-5 p-6">

                                {carregandoProfessores ? (

                                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">

                                        <Loader2 className="h-5 w-5 animate-spin" />

                                        Carregando professores...

                                    </div>

                                ) : (

                                    <>

                                        <div>

                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Professor
                                            </label>


                                            <select
                                                value={
                                                    professorSelecionadoId
                                                }

                                                onChange={(
                                                    event
                                                ) =>
                                                    setProfessorSelecionadoId(
                                                        event.target.value
                                                    )
                                                }

                                                disabled={
                                                    salvandoProfessor
                                                }

                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-blue-500"
                                            >

                                                <option value="">
                                                    Sem professor escalado
                                                </option>


                                                {professores.map(
                                                    (professor) => (

                                                        <option
                                                            key={
                                                                professor.id
                                                            }

                                                            value={
                                                                professor.id
                                                            }
                                                        >
                                                            {professor.nome}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>


                                        {professores.length === 0 && (

                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                                Nenhum professor ativo foi encontrado.
                                            </div>

                                        )}

                                    </>

                                )}


                                {/* BOTÕES */}

                                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                                    <button
                                        type="button"

                                        disabled={
                                            salvandoProfessor
                                        }

                                        onClick={() =>
                                            setModalProfessor(
                                                false
                                            )
                                        }

                                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>


                                    <button
                                        type="button"

                                        disabled={
                                            salvandoProfessor ||
                                            carregandoProfessores
                                        }

                                        onClick={
                                            salvarProfessor
                                        }

                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                    >

                                        {salvandoProfessor && (

                                            <Loader2 className="h-4 w-4 animate-spin" />

                                        )}


                                        Salvar professor

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

        </div>
    );
}