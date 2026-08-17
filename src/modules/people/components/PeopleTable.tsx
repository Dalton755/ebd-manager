import type { Pessoa } from "../types/Pessoa";
import { Users } from "lucide-react";
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

export function PeopleTable({
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
        description="Cadastre a primeira pessoa para começar."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <table className="min-w-full">

        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-left">E-mail</th>
            <th className="px-4 py-3 text-left">Telefone</th>
            <th className="px-4 py-3 text-left">Perfil</th>
            <th className="px-4 py-3 text-center">Ações</th>
          </tr>
        </thead>

        <tbody>
          {pessoas.map((pessoa) => (
            <tr
              key={pessoa.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                {pessoa.nome}
              </td>

              <td className="px-4 py-3">
                {pessoa.email}
              </td>

              <td className="px-4 py-3">
                {pessoa.telefone}
              </td>

              <td className="px-4 py-3">
                {podeGerenciarPerfis ? (
                  <select
                    value={pessoa.perfil}
                    onChange={(event) =>
                      onAtualizarPerfil(
                        pessoa,
                        event.target.value as Pessoa["perfil"]
                      )
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                  <span>{pessoa.perfil}</span>
                )}
              </td>

              <td className="px-4 py-3 text-center space-x-2">
                {podeGerenciar && (
                  <>
                    <button
                      onClick={() => {
                        onEditar(pessoa);
                      }}
                      className="rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => {
                        onInativar(pessoa);
                      }}
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Inativar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}