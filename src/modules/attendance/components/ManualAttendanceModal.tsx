import { useEffect, useState } from "react";
import {
  Check,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PeopleService } from "@/modules/people/services/PeopleService";
import { AttendanceService } from "../services/AttendanceService";
import { useAuth } from "@/modules/auth/hooks/useAuth";

import type { Pessoa } from "@/modules/people/types/Pessoa";

type Props = {
  open: boolean;
  data: string;
  onClose: () => void;
  onSaved: () => void;
};

export function ManualAttendanceModal({
  open,
  data,
  onClose,
  onSaved,
}: Props) {

  const { pessoa } = useAuth();

  const [alunos, setAlunos] = useState<Pessoa[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState<string | null>(null);

  const [adicionados, setAdicionados] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {

    if (!open) return;

    setPesquisa("");
    setAdicionados(new Set());

    async function carregarAlunos() {

      try {

        setLoading(true);

        const igrejaId = pessoa?.igreja_id;

        if (!pessoa?.igreja_id) {
          throw new Error(
            "NÃ£o foi possÃ­vel identificar a igreja do usuÃ¡rio."
          );
        }

        const pessoas =
          await PeopleService.listar(
            igrejaId
          );

        setAlunos(
          (pessoas ?? []).filter(
            (pessoa) =>
              pessoa.ativo &&
              pessoa.status === "ATIVO"
          )
        );

      } catch (error) {

        console.error(error);

        toast.error(
          "Erro ao carregar alunos."
        );

      } finally {

        setLoading(false);

      }
    }

    carregarAlunos();

  }, [open, pessoa?.igreja_id]);

  if (!open) return null;

  const alunosFiltrados = alunos.filter(
    (aluno) =>
      aluno.nome
        .toLowerCase()
        .includes(
          pesquisa.toLowerCase()
        )
  );

  async function adicionarChamada(
    aluno: Pessoa
  ) {

    if (!aluno.id) return;

    if (adicionados.has(aluno.id)) {
      return;
    }

    try {

      setSalvando(aluno.id);

      await AttendanceService.registrarChamada(
        aluno.id,
        data,
        aluno.id
      );

      setAdicionados(
        (anterior) => {

          const novo = new Set(anterior);

          novo.add(aluno.id!);

          return novo;
        }
      );

      toast.success(
        `${aluno.nome} adicionado.`
      );

      onSaved();

    } catch (error) {

      console.error(error);

      toast.error(
        `Erro ao adicionar ${aluno.nome}.`
      );

    } finally {

      setSalvando(null);

    }
  }

  function fechar() {

    setPesquisa("");
    setAdicionados(new Set());

    onClose();

  }

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">

        {/* CabeÃ§alho */}

        <div className="flex items-center justify-between border-b p-5">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Chamada manual
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecione todos os alunos presentes.
            </p>

          </div>

          <button
            type="button"
            onClick={fechar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>

        </div>

        {/* ConteÃºdo */}

        <div className="space-y-4 p-5">

          {/* Pesquisa */}

          <div className="relative">

            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600"
              autoFocus
            />

          </div>

          {/* Contador */}

          {adicionados.size > 0 && (

            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">

              {adicionados.size}{" "}
              {adicionados.size === 1
                ? "aluno adicionado"
                : "alunos adicionados"}

            </div>

          )}

          {/* Lista */}

          {loading ? (

            <div className="py-8 text-center text-slate-500">
              Carregando alunos...
            </div>

          ) : (

            <div className="max-h-80 space-y-2 overflow-y-auto">

              {alunosFiltrados.map(
                (aluno) => {

                  const adicionado =
                    aluno.id
                      ? adicionados.has(
                        aluno.id
                      )
                      : false;

                  const salvandoAluno =
                    salvando === aluno.id;

                  return (

                    <button
                      key={aluno.id}
                      type="button"
                      onClick={() =>
                        adicionarChamada(
                          aluno
                        )
                      }
                      disabled={
                        adicionado ||
                        salvando !== null
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${adicionado
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                        } disabled:cursor-default`}
                    >

                      {/* Avatar */}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${adicionado
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {aluno.nome
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      {/* Nome */}

                      <div className="min-w-0 flex-1">

                        <p className="font-semibold text-slate-900">
                          {aluno.nome}
                        </p>

                        <p
                          className={`text-sm ${adicionado
                            ? "text-green-600"
                            : "text-slate-500"
                            }`}
                        >
                          {salvandoAluno
                            ? "Salvando..."
                            : adicionado
                              ? "PresenÃ§a adicionada"
                              : "Adicionar presenÃ§a"}
                        </p>

                      </div>

                      {/* Status */}

                      {adicionado && (

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Check size={20} />
                        </div>

                      )}

                    </button>

                  );
                }
              )}

              {alunosFiltrados.length === 0 && (

                <div className="py-8 text-center text-slate-500">
                  Nenhum aluno encontrado.
                </div>

              )}

            </div>

          )}

        </div>

        {/* RodapÃ© */}

        <div className="border-t bg-slate-50 p-4">

          <button
            type="button"
            onClick={fechar}
            className="w-full rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-900"
          >
            Fechar
          </button>

        </div>

      </div>

    </div>

  );
}
