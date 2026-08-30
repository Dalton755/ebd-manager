import {
  Mail,
  Pencil,
  Phone,
  School,
  ShieldCheck,
  Trash2,
  UserRound,
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

  // Mantidos temporariamente por compatibilidade
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

    case "PENDENTE":
      return "Pendente";

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


export function PeopleTable({
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
    if (!classeId) {
      return null;
    }

    return (
      classes.find(
        (classe) =>
          classe.id === classeId
      )?.nome ?? "Classe"
    );
  }


  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

      <table className="min-w-full">

        <thead className="bg-slate-50">

          <tr className="border-b border-slate-200">

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pessoa
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contato
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Perfil
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Classe
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ações
            </th>

          </tr>

        </thead>


        <tbody className="divide-y divide-slate-100">

          {pessoas.map((pessoa) => {

            const classeNome =
              obterNomeClasse(
                pessoa.classe_id
              );

            return (
              <tr
                key={pessoa.id}
                className="transition hover:bg-slate-50/70"
              >

                <td className="px-5 py-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

                      {pessoa.nome
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    <div className="min-w-0">

                      <p className="truncate font-semibold text-slate-900">
                        {pessoa.nome}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <UserRound size={13} />
                        Pessoa cadastrada
                      </div>

                    </div>

                  </div>

                </td>


                <td className="px-5 py-4">

                  <div className="space-y-1.5 text-sm text-slate-600">

                    <div className="flex items-center gap-2">

                      <Mail
                        size={15}
                        className="shrink-0 text-slate-400"
                      />

                      <span className="truncate">
                        {pessoa.email}
                      </span>

                    </div>


                    <div className="flex items-center gap-2">

                      <Phone
                        size={15}
                        className="shrink-0 text-slate-400"
                      />

                      <span>
                        {pessoa.telefone || "Não informado"}
                      </span>

                    </div>

                  </div>

                </td>


                <td className="px-5 py-4">

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

                </td>


                <td className="px-5 py-4">

                  {pessoa.perfil === "ALUNO" ? (

                    classeNome ? (

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">

                        <School size={14} />

                        {classeNome}

                      </span>

                    ) : (

                      <span className="text-xs text-slate-400">
                        Sem classe
                      </span>

                    )

                  ) : (

                    <span className="text-xs text-slate-300">
                      —
                    </span>

                  )}

                </td>


                <td className="px-5 py-4">

                  {podeGerenciar && (

                    <div className="flex items-center justify-end gap-2">

                      <button
                        type="button"
                        data-tour="pessoas-editar"
                        onClick={() =>
                          onEditar(pessoa)
                        }
                        title="Editar pessoa"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={17} />
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          onInativar(pessoa)
                        }
                        title="Inativar pessoa"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  )}

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}