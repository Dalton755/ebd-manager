import { useEffect, useState } from "react";
import { Pencil, Trash2, BookOpen, Users } from "lucide-react";

import { EmptyState } from "@/shared/components/ui/EmptyState";

import type { Classe } from "../types/Classe";
import { ClassStudentService } from "../services/ClassStudentService";

type Props = {
  classes: Classe[];
  podeGerenciar: boolean;
  onEditar: (classe: Classe) => void;
  onInativar: (classe: Classe) => void;
  onGerenciarAlunos?: (classe: Classe) => void;
};

export function ClassTable({
  classes,
  podeGerenciar,
  onEditar,
  onInativar,
  onGerenciarAlunos,
}: Props) {

  const [quantidadeAlunos, setQuantidadeAlunos] =
    useState<Record<string, number>>({});

  useEffect(() => {
    let ativo = true;

    async function carregarQuantidadeAlunos() {
      const resultado: Record<string, number> = {};

      await Promise.all(
        classes.map(async (classe) => {
          if (!classe.id) return;

          try {
            resultado[classe.id] =
              await ClassStudentService.contarAlunos(classe.id);
          } catch (error) {
            console.error(
              `Erro ao contar alunos da classe ${classe.nome}:`,
              error
            );

            resultado[classe.id] = 0;
          }
        })
      );

      if (ativo) {
        setQuantidadeAlunos(resultado);
      }
    }

    carregarQuantidadeAlunos();

    return () => {
      ativo = false;
    };
  }, [classes]);

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhuma classe cadastrada"
        description="Crie a primeira classe da Escola Bíblica."
      />
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((classe) => (
        <div
          key={classe.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          {/* CABEÇALHO */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <BookOpen size={24} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {classe.nome}
                </h3>

                <p className="text-sm text-slate-500">
                  Classe da Escola Bíblica
                </p>
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          {classe.descricao && (
            <p className="mt-5 text-sm leading-6 text-slate-500">
              {classe.descricao}
            </p>
          )}

          {/* ALUNOS */}
          <Users
            size={16}
            className="inline mr-2"
          />

          {classe.id
            ? quantidadeAlunos[classe.id] ?? 0
            : 0}{" "}
          {(classe.id
            ? quantidadeAlunos[classe.id] ?? 0
            : 0) === 1
            ? "aluno"
            : "alunos"}

          {/* AÇÕES */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onGerenciarAlunos?.(classe)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Users size={17} />
              Gerenciar alunos
            </button>

            {podeGerenciar && (
              <>
                <button
                  type="button"
                  onClick={() => onEditar(classe)}
                  title="Editar classe"
                  className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50"
                >
                  <Pencil size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => onInativar(classe)}
                  title="Inativar classe"
                  className="flex items-center justify-center rounded-lg border border-red-200 px-3 py-2.5 text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}