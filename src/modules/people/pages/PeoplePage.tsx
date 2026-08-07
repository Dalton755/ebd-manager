import { useEffect, useState } from "react";

import { PeopleService } from "../services/PeopleService";
import type { Pessoa } from "../types/Pessoa";
import { PeopleForm } from "../components/PeopleForm";
import { PeopleTable } from "../components/PeopleTable";
import { Users } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/Card";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";


export function PeoplePage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pessoaParaInativar, setPessoaParaInativar] = useState<Pessoa | undefined>();

  async function carregarPessoas() {
    setLoading(true);

    try {
      const dados = await PeopleService.listar();
      setPessoas(dados ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pessoas.");
    } finally {
      setLoading(false);
    }
  }

  function inativarPessoa(pessoa: Pessoa) {
    setPessoaParaInativar(pessoa);
    setDialogOpen(true);
  }

  async function confirmarInativacao() {
    if (!pessoaParaInativar) return;

    try {
      await PeopleService.inativar(pessoaParaInativar.id!);

      toast.success("Pessoa inativada com sucesso.");

      carregarPessoas();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao inativar pessoa.");

    } finally {
      setDialogOpen(false);
      setPessoaParaInativar(undefined);
    }
  }

  useEffect(() => {
    carregarPessoas();
  }, []);

  const pessoasFiltradas = pessoas.filter((pessoa) =>
    pessoa.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="p-8">

      <PageHeader
        title="Pessoas"
        subtitle="Cadastro de alunos, professores e colaboradores"
        icon={Users}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <SearchInput
            value={pesquisa}
            onChange={setPesquisa}
            placeholder="Pesquisar pessoas..."
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {pessoaSelecionada ? "Editar Pessoa" : "Nova Pessoa"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <PeopleForm
            pessoa={pessoaSelecionada}
            onSaved={() => {
              setPessoaSelecionada(undefined);
              carregarPessoas();
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pessoas cadastradas</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingSpinner text="Carregando pessoas..." />
          ) : (
            <PeopleTable
              pessoas={pessoasFiltradas}
              onEditar={(pessoa) => setPessoaSelecionada(pessoa)}
              onInativar={inativarPessoa}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={dialogOpen}
        title="Inativar pessoa"
        description={`Deseja realmente inativar "${pessoaParaInativar?.nome}"?`}
        confirmText="Inativar"
        cancelText="Cancelar"
        onConfirm={confirmarInativacao}
        onCancel={() => {
          setDialogOpen(false);
          setPessoaParaInativar(undefined);
        }}
      />

    </div>
  );
}