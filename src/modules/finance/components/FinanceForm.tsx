import { useEffect, useRef, useState } from "react";
import { Camera, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFormDraft } from "@/shared/hooks/useFormDraft";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

import { FinanceService } from "../services/FinanceService";

import type {
  CategoriaFinanceira,
  MovimentacaoFinanceira,
  TipoMovimentacao,
} from "../types/MovimentacaoFinanceira";

type Props = {
  onSaved: () => void;
  movimentacao?: MovimentacaoFinanceira;
  onCancel?: () => void;
};

function formatarValorNumerico(valor: number) {
  return valor.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarValor(valor: string) {

  const somenteNumeros =
    valor.replace(/\D/g, "");

  if (!somenteNumeros) {
    return "";
  }

  const numero =
    Number(somenteNumeros) / 100;

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function converterValor(valor: string) {

  const somenteNumeros =
    valor.replace(/\D/g, "");

  if (!somenteNumeros) {
    return 0;
  }

  return Number(somenteNumeros) / 100;
}

export function FinanceForm({
  onSaved,
  movimentacao,
  onCancel,
}: Props) {

  const editando = Boolean(
    movimentacao?.id
  );

  const [categorias, setCategorias] =
    useState<CategoriaFinanceira[]>([]);

  const {
    valores: formulario,
    setValores: setFormulario,
    limparRascunho,
  } = useFormDraft(
    "financeiro-nova-movimentacao",
    {
      tipo: movimentacao?.tipo ?? "RECEITA" as TipoMovimentacao,
      categoriaId: movimentacao?.categoria_id ?? "",
      valor: movimentacao
        ? formatarValorNumerico(
          movimentacao.valor
        )
        : "",
      data: movimentacao?.data ??
        new Date()
          .toISOString()
          .split("T")[0],
      descricao:
        movimentacao?.descricao ?? "",
    }
  );

  const tipo =
    formulario.tipo;

  const categoriaId =
    formulario.categoriaId;

  const valor =
    formulario.valor;

  const data =
    formulario.data;

  const descricao =
    formulario.descricao;

  const [novaCategoria, setNovaCategoria] =
    useState("");

  const [mostrarNovaCategoria, setMostrarNovaCategoria] =
    useState(false);

  function setTipo(
    novoTipo: TipoMovimentacao
  ) {
    setFormulario((atual) => ({
      ...atual,
      tipo: novoTipo,
    }));
  }

  function setCategoriaId(
    novaCategoriaId: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      categoriaId: novaCategoriaId,
    }));
  }

  function setValor(
    novoValor: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      valor: novoValor,
    }));
  }

  function setData(
    novaData: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      data: novaData,
    }));
  }

  function setDescricao(
    novaDescricao: string
  ) {
    setFormulario((atual) => ({
      ...atual,
      descricao: novaDescricao,
    }));
  }

  const [comprovante, setComprovante] =
    useState<File | null>(null);

  const [removerComprovante, setRemoverComprovante] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const inputArquivoRef =
    useRef<HTMLInputElement>(null);

  const inputCameraRef =
    useRef<HTMLInputElement>(null);


  async function carregarCategorias() {

    try {

      const resultado =
        await FinanceService.listarCategorias(
          tipo
        );

      setCategorias(resultado);

      if (
        movimentacao &&
        tipo === movimentacao.tipo &&
        movimentacao.categoria_id
      ) {

        const categoriaExiste =
          resultado.some(
            (categoria) =>
              categoria.id ===
              movimentacao.categoria_id
          );

        if (categoriaExiste) {

          setCategoriaId(
            movimentacao.categoria_id
          );

        }

      }

    } catch (error) {

      console.error(error);

      toast.error(
        "Erro ao carregar categorias."
      );
    }
  }


  useEffect(() => {

    carregarCategorias();

  }, [tipo]);


  useEffect(() => {

    if (!movimentacao) {
      return;
    }

    setTipo(
      movimentacao.tipo
    );

    setCategoriaId(
      movimentacao.categoria_id
    );

    setValor(
      formatarValorNumerico(
        movimentacao.valor
      )
    );

    setData(
      movimentacao.data
    );

    setDescricao(
      movimentacao.descricao ??
      ""
    );

    setComprovante(null);

    setRemoverComprovante(false);

  }, [movimentacao]);


  async function criarNovaCategoria() {

    const nome =
      novaCategoria.trim();

    if (!nome) {

      toast.error(
        "Informe o nome da categoria."
      );

      return;
    }

    try {

      const categoria =
        await FinanceService.criarCategoria({
          nome,
          tipo,
        });

      setCategorias(
        (anteriores) => [
          ...anteriores,
          categoria,
        ]
      );

      setCategoriaId(
        categoria.id!
      );

      setNovaCategoria("");

      setMostrarNovaCategoria(
        false
      );

      toast.success(
        "Categoria criada com sucesso."
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Não foi possível criar a categoria."
      );
    }
  }


  function selecionarArquivo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (
      !tiposPermitidos.includes(
        arquivo.type
      )
    ) {

      toast.error(
        "Formato não permitido. Use JPG, PNG, WEBP ou PDF."
      );

      event.target.value = "";

      return;
    }

    const tamanhoMaximo =
      10 * 1024 * 1024;

    if (
      arquivo.size >
      tamanhoMaximo
    ) {

      toast.error(
        "O comprovante deve ter no máximo 10 MB."
      );

      event.target.value = "";

      return;
    }

    setComprovante(
      arquivo
    );

    setRemoverComprovante(
      false
    );
  }


  async function salvar() {

    if (!categoriaId) {

      toast.error(
        "Selecione uma categoria."
      );

      return;
    }

    const valorNumerico =
      converterValor(valor);

    if (
      valorNumerico <= 0
    ) {

      toast.error(
        "Informe um valor válido."
      );

      return;
    }

    if (!data) {

      toast.error(
        "Informe a data."
      );

      return;
    }

    try {

      setLoading(true);


      // =====================================================
      // EDIÇÃO
      // =====================================================

      if (
        editando &&
        movimentacao?.id
      ) {

        await FinanceService.editarMovimentacao(
          movimentacao.id,
          {
            tipo,
            categoria_id:
              categoriaId,
            valor:
              valorNumerico,
            data,
            descricao:
              descricao.trim() ||
              undefined,
          }
        );


        // =================================================
        // REMOVER COMPROVANTE
        // =================================================

        if (
          removerComprovante &&
          !comprovante &&
          movimentacao.comprovante_path
        ) {

          await FinanceService.removerComprovante(
            movimentacao.id
          );
        }


        // =================================================
        // SUBSTITUIR / ADICIONAR COMPROVANTE
        // =================================================

        if (comprovante) {

          if (
            movimentacao.comprovante_path
          ) {

            await FinanceService.removerComprovante(
              movimentacao.id
            );
          }

          const arquivo =
            await FinanceService.enviarComprovante(
              comprovante,
              movimentacao.id
            );

          await FinanceService.atualizarComprovante(
            movimentacao.id,
            arquivo
          );
        }


        toast.success(
          "Movimentação atualizada com sucesso."
        );

        onSaved();

        return;
      }


      // =====================================================
      // NOVA MOVIMENTAÇÃO
      // =====================================================

      const novaMovimentacao =
        await FinanceService.criarMovimentacao({
          tipo,
          categoria_id:
            categoriaId,
          valor:
            valorNumerico,
          data,
          descricao:
            descricao.trim() ||
            undefined,
        });


      if (
        comprovante &&
        novaMovimentacao?.id
      ) {

        const arquivo =
          await FinanceService.enviarComprovante(
            comprovante,
            novaMovimentacao.id
          );

        await FinanceService.atualizarComprovante(
          novaMovimentacao.id,
          arquivo
        );
      }


      toast.success(
        "Movimentação registrada com sucesso."
      );


      limparRascunho();

      setFormulario({
        tipo: "RECEITA",
        categoriaId: "",
        valor: "",
        data: new Date()
          .toISOString()
          .split("T")[0],
        descricao: "",
      });

      setComprovante(null);

      setRemoverComprovante(
        false
      );


      if (
        inputArquivoRef.current
      ) {

        inputArquivoRef.current.value =
          "";
      }


      if (
        inputCameraRef.current
      ) {

        inputCameraRef.current.value =
          "";
      }


      onSaved();

    } catch (error) {

      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : editando
            ? "Erro ao atualizar movimentação."
            : "Erro ao registrar movimentação."
      );

    } finally {

      setLoading(false);
    }
  }


  return (
    <div className="space-y-5">

      {/* TIPO */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Tipo
        </label>

        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() =>
              setTipo("RECEITA")
            }
            className={`rounded-lg border p-3 font-medium ${tipo === "RECEITA"
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-slate-200"
              }`}
          >
            Receita
          </button>


          <button
            type="button"
            onClick={() =>
              setTipo("DESPESA")
            }
            className={`rounded-lg border p-3 font-medium ${tipo === "DESPESA"
              ? "border-red-600 bg-red-50 text-red-700"
              : "border-slate-200"
              }`}
          >
            Despesa
          </button>

        </div>

      </div>


      {/* CATEGORIA */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Categoria
        </label>

        <div className="flex gap-2">

          <select
            value={categoriaId}
            onChange={(e) =>
              setCategoriaId(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 bg-white p-3"
          >

            <option value="">
              Selecione uma categoria
            </option>

            {categorias.map(
              (categoria) => (

                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nome}
                </option>

              )
            )}

          </select>


          <Button
            type="button"
            onClick={() =>
              setMostrarNovaCategoria(
                !mostrarNovaCategoria
              )
            }
          >
            <Plus size={18} />
          </Button>

        </div>


        {mostrarNovaCategoria && (

          <div className="mt-3 flex gap-2">

            <Input
              placeholder="Nome da categoria"
              value={novaCategoria}
              onChange={(e) =>
                setNovaCategoria(
                  e.target.value
                )
              }
            />

            <Button
              type="button"
              onClick={
                criarNovaCategoria
              }
            >
              Criar
            </Button>

          </div>

        )}

      </div>


      {/* VALOR */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Valor
        </label>

        <Input
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={valor}
          onChange={(e) =>
            setValor(
              formatarValor(
                e.target.value
              )
            )
          }
        />

      </div>


      {/* DATA */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Data
        </label>

        <Input
          type="date"
          value={data}
          onChange={(e) =>
            setData(
              e.target.value
            )
          }
        />

      </div>


      {/* DESCRIÇÃO */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Descrição
        </label>

        <textarea
          value={descricao}
          onChange={(e) =>
            setDescricao(
              e.target.value
            )
          }
          placeholder="Descrição da movimentação"
          className="min-h-24 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
        />

      </div>


      {/* COMPROVANTE */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Comprovante
        </label>


        {editando &&
          movimentacao?.comprovante_path &&
          !comprovante &&
          !removerComprovante && (

            <div className="mb-3 rounded-lg border bg-slate-50 p-3">

              <p className="text-sm font-medium">
                Comprovante atual
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {
                  movimentacao.comprovante_nome ??
                  "Arquivo anexado"
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  setRemoverComprovante(
                    true
                  )
                }
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Remover comprovante
              </button>

            </div>
          )}


        {removerComprovante &&
          !comprovante && (

            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">

              O comprovante atual será removido ao salvar.

              <button
                type="button"
                onClick={() =>
                  setRemoverComprovante(
                    false
                  )
                }
                className="ml-2 font-medium underline"
              >
                Cancelar
              </button>

            </div>
          )}


        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() =>
              inputCameraRef.current?.click()
            }
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
          >
            <Camera size={18} />
            Tirar foto
          </button>


          <button
            type="button"
            onClick={() =>
              inputArquivoRef.current?.click()
            }
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
          >
            <Paperclip size={18} />
            Escolher arquivo
          </button>

        </div>


        <input
          ref={inputCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={
            selecionarArquivo
          }
        />


        <input
          ref={inputArquivoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={
            selecionarArquivo
          }
        />


        {comprovante && (

          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">

            <p className="font-medium">
              {comprovante.name}
            </p>

            <p className="text-slate-500">
              {(
                comprovante.size /
                1024 /
                1024
              ).toFixed(2)}{" "}
              MB
            </p>

            <button
              type="button"
              onClick={() => {

                setComprovante(
                  null
                );

              }}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Remover novo comprovante
            </button>

          </div>

        )}

      </div>


      {/* BOTÕES */}

      <div className="flex gap-3">

        {editando &&
          onCancel && (

            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>

          )}


        <Button
          type="button"
          onClick={salvar}
          disabled={loading}
          className="flex-1"
        >
          {loading
            ? "Salvando..."
            : editando
              ? "Salvar alterações"
              : "Registrar movimentação"}
        </Button>

      </div>

    </div>
  );
}