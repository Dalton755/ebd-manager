import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Classe } from "../types/Classe";
import { ClassService } from "../services/ClassService";
import { classSchema } from "../validations/classSchema";

type Props = {
  classe?: Classe;
  onSaved: () => void;
  podeGerenciar: boolean;
};

export function ClassForm({
  classe,
  onSaved,
  podeGerenciar,
}: Props) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [idadeMinima, setIdadeMinima] = useState(0);
  const [idadeMaxima, setIdadeMaxima] = useState(0);

  useEffect(() => {
    if (classe) {
      setNome(classe.nome);
      setDescricao(classe.descricao ?? "");
      setIdadeMinima(classe.idade_minima ?? 0);
      setIdadeMaxima(classe.idade_maxima ?? 0);
    } else {
      setNome("");
      setDescricao("");
      setIdadeMinima(0);
      setIdadeMaxima(0);
    }
  }, [classe]);

  async function salvar() {

    if (!podeGerenciar) {
      toast.error("Você não tem permissão para gerenciar classes.");
      return;
    }

    const validacao = classSchema.safeParse({
      nome,
      descricao,
      idade_minima: idadeMinima,
      idade_maxima: idadeMaxima,
      cor: "",
    });

    if (!validacao.success) {
      toast.error(validacao.error.issues[0].message);
      return;
    }

    try {
      if (classe) {
        await ClassService.editar(classe.id!, {
          nome,
          descricao,
          idade_minima: idadeMinima,
          idade_maxima: idadeMaxima,
        });

        toast.success("Classe atualizada.");
      } else {
        await ClassService.criar({
          nome,
          descricao,
          idade_minima: idadeMinima,
          idade_maxima: idadeMaxima,
        });

        toast.success("Classe cadastrada.");
      }

      onSaved();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar classe.");
    }
  }

  return (
    <>

      <input
        className="rounded border p-3"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        disabled={!podeGerenciar}
      />

      <textarea
        className="rounded border p-3"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        disabled={!podeGerenciar}
      />

      <div className="grid grid-cols-2 gap-4">

        <input
          type="number"
          className="rounded border p-3"
          placeholder="Idade mínima"
          value={idadeMinima}
          disabled={!podeGerenciar}
          onChange={(e) =>
            setIdadeMinima(Number(e.target.value))

          }
        />

        <input
          type="number"
          className="rounded border p-3"
          placeholder="Idade máxima"
          value={idadeMaxima}
          disabled={!podeGerenciar}
          onChange={(e) =>
            setIdadeMaxima(Number(e.target.value))
          }
        />

      </div>

      {podeGerenciar && (
        <button
          onClick={salvar}
          className="rounded bg-blue-600 p-3 text-white"
        >
          {classe ? "Salvar Alterações" : "Salvar"}
        </button>
      )}

    </>
  );
}