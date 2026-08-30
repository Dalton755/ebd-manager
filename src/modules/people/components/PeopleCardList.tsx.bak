import { Pencil, Trash2, Mail, Phone, Users } from "lucide-react";
import type { Pessoa } from "../types/Pessoa";
import { EmptyState } from "@/shared/components/ui/EmptyState";

type Props = {
  pessoas: Pessoa[];
  onEditar: (pessoa: Pessoa) => void;
  onInativar: (pessoa: Pessoa) => void;
  onAtualizarPerfil: (
    pessoa: Pessoa,
    perfil: Pessoa["perfil"]
  ) => void;
  podeGerenciar: boolean;
  podeGerenciarPerfis: boolean;
};

export function PeopleCardList({
  pessoas,
  onEditar,
  onInativar,
  onAtualizarPerfil,
  podeGerenciar,
  podeGerenciarPerfis,
}: Props) {
  if (pessoas.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhuma pessoa encontrada"
        description="Cadastre uma nova pessoa."
      />
    );
  }

  return (
    <div className="space-y-3">

      {pessoas.map((pessoa) => (

        <div
          key={pessoa.id}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >

          <h3 className="text-lg font-semibold">
            {pessoa.nome}
          </h3>

          <div className="mt-3 space-y-2 text-sm text-gray-600">

            <div className="flex items-center gap-2">
              <Mail size={16} />
              {pessoa.email}
            </div>

            <div className="flex items-center gap-2">
              <Phone size={16} />
              {pessoa.telefone}
            </div>

          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Perfil
            </label>

            {podeGerenciarPerfis ? (
              <select
                value={pessoa.perfil}
                onChange={(event) =>
                  onAtualizarPerfil(
                    pessoa,
                    event.target.value as Pessoa["perfil"]
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
                <option value="SUPERINTENDENTE">
                  Superintendente
                </option>
                <option value="SECRETARIO">Secretário</option>
                <option value="PASTOR">Pastor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            ) : (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                {pessoa.perfil}
              </p>
            )}

          </div>

          {podeGerenciar && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onEditar(pessoa)}
                className="flex-1 rounded-lg bg-yellow-500 py-2 text-white"
              >
                <Pencil className="mx-auto" size={18} />
              </button>

              <button
                onClick={() => onInativar(pessoa)}
                className="flex-1 rounded-lg bg-red-600 py-2 text-white"
              >
                <Trash2 className="mx-auto" size={18} />
              </button>
            </div>
          )}

        </div>

      ))}

    </div>
  );
}