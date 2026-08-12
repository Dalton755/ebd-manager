import { useEffect, useState } from "react";
import { UserPlus, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import type { Classe } from "../types/Classe";
import type { Pessoa } from "@/modules/people/types/Pessoa";

import { ClassStudentService } from "../services/ClassStudentService";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

type Props = {
  classe: Classe;
  onClose: () => void;
  onChanged: () => void;
};

export function ManageClassStudents({
  classe,
  onClose,
  onChanged,
}: Props) {

  const [alunos, setAlunos] =
    useState<Pessoa[]>([]);

  const [alunosDisponiveis, setAlunosDisponiveis] =
    useState<Pessoa[]>([]);

  const [alunoSelecionado, setAlunoSelecionado] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);


  async function carregar() {

    try {

      setLoading(true);

      const [
        alunosDaClasse,
        alunosLivres,
      ] = await Promise.all([
        ClassStudentService.listarAlunosDaClasse(
          classe.id!
        ),
        ClassStudentService.listarAlunosDisponiveis(),
      ]);

      setAlunos(alunosDaClasse);
      setAlunosDisponiveis(alunosLivres);

    } catch (error) {

      console.error(error);

      toast.error(
        "Erro ao carregar alunos."
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    carregar();
  }, [classe.id]);


  async function adicionarAluno() {

    if (!alunoSelecionado) {

      toast.error(
        "Selecione um aluno."
      );

      return;
    }

    try {

      setSalvando(true);

      await ClassStudentService.vincularAluno(
        alunoSelecionado,
        classe.id!
      );

      toast.success(
        "Aluno vinculado à classe."
      );

      setAlunoSelecionado("");

      await carregar();

      onChanged();

    } catch (error) {

      console.error(error);

      toast.error(
        "Erro ao vincular aluno."
      );

    } finally {

      setSalvando(false);

    }
  }


  async function removerAluno(
    aluno: Pessoa
  ) {

    try {

      setSalvando(true);

      await ClassStudentService.removerAluno(
        aluno.id!
      );

      toast.success(
        "Aluno removido da classe."
      );

      await carregar();

      onChanged();

    } catch (error) {

      console.error(error);

      toast.error(
        "Erro ao remover aluno."
      );

    } finally {

      setSalvando(false);

    }
  }


  return (
    <div className="space-y-6">

      {/* CABEÇALHO */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-xl font-bold text-slate-800">
            {classe.nome}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gerenciamento dos alunos da classe
          </p>

        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={20} />
        </button>

      </div>


      {/* ADICIONAR ALUNO */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

        <div className="mb-3 flex items-center gap-2">

          <UserPlus
            size={18}
            className="text-blue-600"
          />

          <h3 className="font-semibold text-slate-800">
            Adicionar aluno
          </h3>

        </div>


        <div className="flex flex-col gap-3 sm:flex-row">

          <select
            value={alunoSelecionado}
            onChange={(e) =>
              setAlunoSelecionado(
                e.target.value
              )
            }
            disabled={
              salvando ||
              alunosDisponiveis.length === 0
            }
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >

            <option value="">
              {alunosDisponiveis.length === 0
                ? "Nenhum aluno disponível"
                : "Selecione um aluno"}
            </option>

            {alunosDisponiveis.map(
              (aluno) => (
                <option
                  key={aluno.id}
                  value={aluno.id}
                >
                  {aluno.nome}
                </option>
              )
            )}

          </select>


          <button
            type="button"
            onClick={adicionarAluno}
            disabled={
              salvando ||
              !alunoSelecionado
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <UserPlus size={17} />

            Adicionar

          </button>

        </div>

      </div>


      {/* ALUNOS */}

      <div>

        <div className="mb-3 flex items-center justify-between">

          <h3 className="font-semibold text-slate-800">
            Alunos da classe
          </h3>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {alunos.length}{" "}
            {alunos.length === 1
              ? "aluno"
              : "alunos"}
          </span>

        </div>


        {loading ? (

          <LoadingSpinner
            text="Carregando alunos..."
          />

        ) : alunos.length === 0 ? (

          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">

            <UserRound
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              Nenhum aluno vinculado a esta classe.
            </p>

          </div>

        ) : (

          <div className="space-y-2">

            {alunos.map((aluno) => (

              <div
                key={aluno.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UserRound size={17} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-800">
                      {aluno.nome}
                    </p>

                    <p className="text-xs text-slate-500">
                      {aluno.email}
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    removerAluno(aluno)
                  }
                  disabled={salvando}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                >
                  Remover
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}