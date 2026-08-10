import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
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

    const [dialogOpen, setDialogOpen] = useState(false);

    const [classeParaInativar, setClasseParaInativar] =
        useState<Classe>();



    useEffect(() => {
        carregarClasses();
    }, []);

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
            await ClassService.inativar(classeParaInativar.id!);

            toast.success("Classe inativada.");

            carregarClasses();

        } catch (error) {
            console.error(error);
            toast.error("Erro ao inativar.");

        } finally {
            setDialogOpen(false);
            setClasseParaInativar(undefined);
        }
    }

    const {
        search,
        setSearch,
        filtered: classesFiltradas,
    } = useSearch(classes, (classe) => classe.nome);

    return (
        <div className="space-y-6">

            <PageHeader
                title="Classes"
                subtitle="Cadastro das classes da Escola Bíblica"
                icon={BookOpen}
            />

            <Card>
                <CardContent className="pt-6">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Pesquisar classes..."
                    />
                </CardContent>
            </Card>



            <Card>
                <CardHeader>
                    <CardTitle>
                        {podeGerenciar
                            ? classeSelecionada
                                ? "Editar Classe"
                                : "Nova Classe"
                            : "Detalhes da Classe"}
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <ClassForm
                        classe={classeSelecionada}
                        podeGerenciar={podeGerenciar}
                        onSaved={() => {
                            setClasseSelecionada(undefined);
                            carregarClasses();
                        }}
                    />
                </CardContent>
            </Card>




            <Card>

                <CardHeader>
                    <CardTitle>
                        Classes cadastradas
                    </CardTitle>
                </CardHeader>

                <CardContent>

                    {loading ? (
                        <LoadingSpinner text="Carregando classes..." />
                    ) : (
                        <ClassTable
                            classes={classesFiltradas}
                            podeGerenciar={podeGerenciar}
                            onEditar={setClasseSelecionada}
                            onInativar={abrirInativacao}
                        />
                    )}

                </CardContent>

            </Card>

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