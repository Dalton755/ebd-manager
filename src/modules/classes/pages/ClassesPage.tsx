import { useEffect, useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
    Card,
    CardContent,
} from "@/shared/components/ui/Card";

import { PageHeader } from "@/shared/components/ui/PageHeader";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";

import { ClassService } from "../services/ClassService";
import type { Classe } from "../types/Classe";
import { ClassForm } from "../components/ClassForm";
import { ClassTable } from "../components/ClassTable";

import { useSearch } from "@/shared/hooks/useSearch";
import { useCrud } from "@/shared/hooks/useCrud";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { temPermissao } from "@/shared/auth/permissions";

import { ManageClassStudents } from "../components/ManageClassStudents";
import { Modal } from "@/shared/components/ui/Modal";

export function ClassesPage() {
    const { pessoa } = useAuth();

    const podeGerenciar =
        pessoa?.perfil !== "PENDENTE" &&
        temPermissao(
            pessoa?.perfil,
            "GERENCIAR_CLASSES"
        );

    const {
        data: classes,
        loading,
        refresh: carregarClasses,
    } = useCrud<Classe>(
        ClassService.listar,
        "Erro ao carregar classes."
    );

    const [classeSelecionada, setClasseSelecionada] =
        useState<Classe>();

    const [classeAlunos, setClasseAlunos] =
        useState<Classe>();

    const [alunosModalOpen, setAlunosModalOpen] =
        useState(false);

    const [formOpen, setFormOpen] = useState(false);

    const [classeParaInativar, setClasseParaInativar] =
        useState<Classe>();

    const [dialogOpen, setDialogOpen] =
        useState(false);

    useEffect(() => {
        carregarClasses();
    }, []);

    function abrirNovaClasse() {
        if (!podeGerenciar) {
            toast.error(
                "Você não tem permissão para criar classes."
            );
            return;
        }

        setClasseSelecionada(undefined);
        setFormOpen(true);
    }

    function abrirEdicao(classe: Classe) {
        if (!podeGerenciar) {
            toast.error(
                "Você não tem permissão para editar classes."
            );
            return;
        }

        setClasseSelecionada(classe);
        setFormOpen(true);
    }

    function fecharFormulario() {
        setFormOpen(false);
        setClasseSelecionada(undefined);
    }

    function abrirInativacao(classe: Classe) {
        if (!podeGerenciar) {
            toast.error(
                "Você não tem permissão para inativar classes."
            );
            return;
        }

        setClasseParaInativar(classe);
        setDialogOpen(true);
    }

    async function confirmarInativacao() {
        if (!podeGerenciar) {
            toast.error(
                "Você não tem permissão para inativar classes."
            );
            return;
        }

        if (!classeParaInativar) return;

        try {
            await ClassService.inativar(
                classeParaInativar.id!
            );

            toast.success("Classe inativada.");

            await carregarClasses();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao inativar.");
        } finally {
            setDialogOpen(false);
            setClasseParaInativar(undefined);
        }
    }

    function gerenciarAlunos(classe: Classe) {
        setClasseAlunos(classe);
        setAlunosModalOpen(true);
    }

    const {
        search,
        setSearch,
        filtered: classesFiltradas,
    } = useSearch(
        classes,
        (classe) => classe.nome
    );

    return (
        <div className="space-y-6">

            {/* CABEÇALHO */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <PageHeader
                    title="Classes"
                    subtitle="Organização das classes da Escola Bíblica"
                    icon={BookOpen}
                />

                {podeGerenciar && (
                    <button
                        type="button"
                        onClick={abrirNovaClasse}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Criar classe
                    </button>
                )}

            </div>

            {/* PESQUISA */}
            <Card>
                <CardContent className="pt-6">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Pesquisar classes..."
                    />
                </CardContent>
            </Card>

            {/* LISTA */}
            <Card>
                <CardContent className="pt-6">

                    {loading ? (
                        <LoadingSpinner
                            text="Carregando classes..."
                        />
                    ) : (
                        <ClassTable
                            classes={classesFiltradas}
                            podeGerenciar={podeGerenciar}
                            onEditar={abrirEdicao}
                            onInativar={abrirInativacao}
                            onGerenciarAlunos={gerenciarAlunos}
                        />
                    )}

                </CardContent>
            </Card>

            {/* MODAL CRIAR / EDITAR */}
            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        {/* CABEÇALHO DO MODAL */}
                        <div className="flex items-center justify-between border-b px-6 py-5">

                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {classeSelecionada
                                        ? "Editar classe"
                                        : "Criar classe"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {classeSelecionada
                                        ? "Atualize os dados da classe."
                                        : "Cadastre uma nova classe da Escola Bíblica."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={fecharFormulario}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* FORMULÁRIO */}
                        <div className="p-6">

                            <ClassForm
                                classe={classeSelecionada}
                                podeGerenciar={podeGerenciar}
                                onSaved={async () => {
                                    fecharFormulario();
                                    await carregarClasses();
                                }}
                            />

                        </div>

                    </div>

                </div>
            )}

            <Modal
                open={alunosModalOpen}
                title={`Alunos — ${classeAlunos?.nome ?? ""}`}
                onClose={() => {
                    setAlunosModalOpen(false);
                    setClasseAlunos(undefined);
                }}
            >
                {classeAlunos && (
                    <ManageClassStudents
                        classe={classeAlunos}
                        onClose={() => {
                            setAlunosModalOpen(false);
                            setClasseAlunos(undefined);
                        }}
                        onChanged={async () => {
                            await carregarClasses();
                        }}
                    />
                )}
            </Modal>

            {/* CONFIRMAÇÃO DE INATIVAÇÃO */}
            <ConfirmDialog
                open={dialogOpen}
                title="Inativar classe"
                description={`Deseja realmente inativar "${classeParaInativar?.nome}"?`}
                confirmText="Inativar"
                cancelText="Cancelar"
                onConfirm={confirmarInativacao}
                onCancel={() => {
                    setDialogOpen(false);
                    setClasseParaInativar(undefined);
                }}
            />

        </div>
    );
}