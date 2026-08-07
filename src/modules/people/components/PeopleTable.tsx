import type { Pessoa } from "../types/Pessoa";

type Props = {
  pessoas: Pessoa[];
};

export function PeopleTable({ pessoas }: Props) {
  if (pessoas.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
        Nenhuma pessoa cadastrada.
      </div>
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

              <td className="px-4 py-3 text-center space-x-2">
                <button
                  className="rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600"
                >
                  Editar
                </button>

                <button
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Inativar
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}