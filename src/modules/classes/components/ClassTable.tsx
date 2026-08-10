import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

import type { Classe } from "../types/Classe";

type Props = {
  classes: Classe[];
  podeGerenciar: boolean;
  onEditar: (classe: Classe) => void;
  onInativar: (classe: Classe) => void;
};

export function ClassTable({
  classes,
  podeGerenciar,
  onEditar,
  onInativar,
}: Props) {
  if (classes.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhuma classe cadastrada"
        description="Cadastre a primeira classe."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full">

        <thead className="bg-gray-100">
          <tr>

            <th className="px-4 py-3 text-left">
              Nome
            </th>

            <th className="px-4 py-3 text-left">
              Faixa Etária
            </th>

            {podeGerenciar && (
              <th className="px-4 py-3 text-center">
                Ações
              </th>
            )}

          </tr>
        </thead>

        <tbody>

          {classes.map((classe) => (
            <tr
              key={classe.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-3">
                {classe.nome}
              </td>

              <td className="px-4 py-3">
                {classe.idade_minima} - {classe.idade_maxima} anos
              </td>

              {podeGerenciar && (
                <td className="space-x-2 px-4 py-3 text-center">

                  <button
                    onClick={() => onEditar(classe)}
                    title="Editar classe"
                  >
                    <Pencil
                      size={18}
                      className="inline text-yellow-600"
                    />
                  </button>

                  <button
                    onClick={() => onInativar(classe)}
                    title="Inativar classe"
                  >
                    <Trash2
                      size={18}
                      className="inline text-red-600"
                    />
                  </button>

                </td>
              )}

            </tr>
          ))}

        </tbody>

      </table>
    </div>
  );
}