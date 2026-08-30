import {
  Mail,
  Pencil,
  Phone,
  School,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import type { Pessoa } from "../types/Pessoa";
import type { Classe } from "@/modules/classes/types/Classe";
import { EmptyState } from "@/shared/components/ui/EmptyState";


type Props = {
  pessoas: Pessoa[];
  classes: Classe[];

  onEditar: (pessoa: Pessoa) => void;
  onInativar: (pessoa: Pessoa) => void;

  onAtualizarPerfil: (
    pessoa: Pessoa,
    perfil: Pessoa["perfil"]
  ) => void;

  podeGerenciar: boolean;
  podeGerenciarPerfis: boolean;
};


function nomePerfil(
  perfil: Pessoa["perfil"]
) {
  switch (perfil) {
    case "ADMIN":
      return "Administrador";
    case "PASTOR":
      return "Pastor";
    case "SUPERINTENDENTE":
      return "Superintendente";
    case "SECRETARIO":
      return "Secretário";
    case "PROFESSOR":
      return "Professor";
    case "ALUNO":
      return "Aluno";
    default:
      return perfil;
  }
}


function classeCorPerfil(
  perfil: Pessoa["perfil"]
) {
  switch (perfil) {
    case "ADMIN":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "PASTOR":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "SUPERINTENDENTE":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "SECRETARIO":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "PROFESSOR":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ALUNO":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}


export function PeopleCardList({
  pessoas,
  classes,
  onEditar,
  onInativar,
  podeGerenciar,
}: Props) {

  if (pessoas.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhuma pessoa encontrada"
        description="Nenhuma pessoa corresponde aos filtros selecionados."
      />
    );
  }


  function obterNomeClasse(
    classeId?: string | null
  ) {
    if (!classeId) return null;

    return (
      classes.find(
        (classe) =>
          classe.id === classeId
      )?.nome ?? "Classe"
    );
  }


  return (
    <div className="space-y-3">

      {pessoas.map((pessoa) => {

        const classeNome =
          obterNomeClasse(
            pessoa.classe_id
          );

        return (
          <article
            key={pessoa.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >

            <div className="flex items-start gap-3">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {pessoa.nome
                  .charAt(0)
                  .toUpperCase()}
              </div>


              <div className="min-w-0 flex-1">

                <h3 className="truncate text-base font-bold text-slate-900">
                  {pessoa.nome}
                </h3>


                <div className="mt-2 space-y-1.5 text-sm text-slate-500">

                  <div className="flex items-center gap-2">
                    <Mail size={15} />
                    <span className="truncate">
                      {pessoa.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={15} />
                    <span>
                      {pessoa.telefone || "Não informado"}
                    </span>
                  </div>

                </div>

              </div>

            </div>


            <div className="mt-4 flex flex-wrap gap-2">

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${classeCorPerfil(
                  pessoa.perfil
                )}`}
              >
                <ShieldCheck size={14} />

                {nomePerfil(
                  pessoa.perfil
                )}
              </span>


              {pessoa.perfil === "ALUNO" && (

                classeNome ? (

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <School size={14} />
                    {classeNome}
                  </span>

                ) : (

                  <span className="inline-flex items-center rounded-full border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-400">
                    Sem classe
                  </span>

                )

              )}

            </div>


            {podeGerenciar && (

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  data-tour="pessoas-editar"
                  onClick={() =>
                    onEditar(pessoa)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Pencil size={16} />
                  Editar
                </button>


                <button
                  type="button"
                  onClick={() =>
                    onInativar(pessoa)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Inativar
                </button>

              </div>

            )}

          </article>
        );
      })}

    </div>
  );
}