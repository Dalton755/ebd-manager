import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Classe } from "../types/Classe";
import { ClassService } from "../services/ClassService";
import { classSchema } from "../validations/classSchema";

type Props = {
  classe?: Classe;
  onSaved: () => void;
  podeGerenciar: boolean;
  onLimitReached?: (
    utilizado: number,
    limite: number
  ) => void;
};

export function ClassForm({
  classe,
  onSaved,
  podeGerenciar,
  onLimitReached,
}: Props) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [idadeMinima, setIdadeMinima] = useState(0);
  const [idadeMaxima, setIdadeMaxima] = useState(0);
  const [salvando, setSalvando] = useState(false);

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
      toast.error(
        "Você não tem permissão para gerenciar classes."
      );
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
      toast.error(
        validacao.error.issues[0].message
      );
      return;
    }

    try {
      setSalvando(true);

      if (classe) {
        await ClassService.editar(
          classe.id!,
          {
            ...classe,
            nome,
            descricao,
            idade_minima: idadeMinima,
            idade_maxima: idadeMaxima,
          }
        );

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
    } catch (error: any) {
      console.error(
        "Erro ao salvar classe:",
        error
      );

      // =====================================================
      // LIMITE DE CLASSES
      // =====================================================

      if (
        error?.codigo ===
        "LIMITE_CLASSES_ATINGIDO"
      ) {
        onLimitReached?.(
          error.utilizado ?? 0,
          error.limite ?? 0
        );

        return;
      }

      // =====================================================
      // ERRO GENÉRICO
      // =====================================================

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao salvar classe.";

      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5">

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Nome da classe
        </label>

        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Ex.: Adultos"
          value={nome}
          onChange={(e) =>
            setNome(e.target.value)
          }
          disabled={!podeGerenciar || salvando}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Descrição
        </label>

        <textarea
          className="min-h-24 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Descrição da classe..."
          value={descricao}
          onChange={(e) =>
            setDescricao(e.target.value)
          }
          disabled={!podeGerenciar || salvando}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Idade mínima
          </label>

          <input
            type="number"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={idadeMinima}
            onChange={(e) =>
              setIdadeMinima(
                Number(e.target.value)
              )
            }
            disabled={!podeGerenciar || salvando}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Idade máxima
          </label>

          <input
            type="number"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={idadeMaxima}
            onChange={(e) =>
              setIdadeMaxima(
                Number(e.target.value)
              )
            }
            disabled={!podeGerenciar || salvando}
          />
        </div>

      </div>

      <div className="flex justify-end pt-2">

        <button
          type="button"
          onClick={salvar}
          disabled={
            !podeGerenciar ||
            salvando
          }
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvando
            ? "Salvando..."
            : classe
              ? "Salvar alterações"
              : "Criar classe"}
        </button>

      </div>

    </div>
  );
}