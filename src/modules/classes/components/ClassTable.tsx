import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  Check,
  Copy,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  EmptyState,
} from "@/shared/components/ui/EmptyState";

import type {
  Classe,
} from "../types/Classe";

import {
  ClassStudentService,
} from "../services/ClassStudentService";


type Props = {
  classes: Classe[];
  podeGerenciar: boolean;
  mostrarCodigoAcesso: boolean;
  onEditar: (
    classe: Classe
  ) => void;
  onInativar: (
    classe: Classe
  ) => void;
  onGerenciarAlunos?: (
    classe: Classe
  ) => void;
};


function formatarCodigo(
  codigo:
    string | undefined
) {

  if (!codigo) {
    return "--------";
  }

  const limpo =
    codigo.replace(
      /\D/g,
      ""
    );

  if (
    limpo.length <=
    4
  ) {
    return limpo;
  }

  return (
    limpo.slice(
      0,
      4
    ) +
    " " +
    limpo.slice(
      4
    )
  );
}


export function ClassTable({
  classes,
  podeGerenciar,
  mostrarCodigoAcesso,
  onEditar,
  onInativar,
  onGerenciarAlunos,
}: Props) {

  const [
    quantidadeAlunos,
    setQuantidadeAlunos,
  ] =
    useState<
      Record<
        string,
        number
      >
    >({});

  const [
    codigoCopiado,
    setCodigoCopiado,
  ] =
    useState<
      string | null
    >(null);


  useEffect(() => {

    let ativo =
      true;


    async function carregarQuantidadeAlunos() {

      const resultado:
        Record<
          string,
          number
        > =
          {};


      await Promise.all(
        classes.map(
          async (
            classe
          ) => {

            if (
              !classe.id
            ) {
              return;
            }

            try {

              resultado[
                classe.id
              ] =
                await ClassStudentService
                  .contarAlunos(
                    classe.id
                  );

            } catch (error) {

              console.error(
                `Erro ao contar alunos da classe ${classe.nome}:`,
                error
              );

              resultado[
                classe.id
              ] =
                0;
            }
          }
        )
      );


      if (ativo) {

        setQuantidadeAlunos(
          resultado
        );
      }
    }


    void carregarQuantidadeAlunos();


    return () => {
      ativo =
        false;
    };

  }, [
    classes,
  ]);


  async function copiarCodigo(
    classe: Classe
  ) {

    if (
      !classe.codigo_acesso
    ) {
      return;
    }


    try {

      await navigator
        .clipboard
        .writeText(
          classe.codigo_acesso
        );


      setCodigoCopiado(
        classe.id ??
        classe.codigo_acesso
      );


      toast.success(
        `Número da classe ${classe.nome} copiado.`
      );


      window.setTimeout(
        () =>
          setCodigoCopiado(
            null
          ),
        1800
      );


    } catch {

      toast.error(
        "Não foi possível copiar o número da classe."
      );
    }
  }


  if (
    classes.length ===
    0
  ) {

    return (
      <EmptyState
        icon={
          BookOpen
        }
        title="Nenhuma classe cadastrada"
        description="Crie a primeira classe da Escola Bíblica."
      />
    );
  }


  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

      {classes.map(
        (
          classe
        ) => {

          const chaveCodigo =
            classe.id ??
            classe.codigo_acesso ??
            "";

          const copiado =
            codigoCopiado ===
            chaveCodigo;


          return (
            <div
              key={
                classe.id
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >

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


              {classe.descricao && (

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {classe.descricao}
                </p>

              )}


              {mostrarCodigoAcesso &&
                classe.codigo_acesso && (

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                    Número para entrar na classe
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">

                    <strong className="font-mono text-2xl font-black tracking-[0.12em] text-slate-900">
                      {formatarCodigo(
                        classe.codigo_acesso
                      )}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        void copiarCodigo(
                          classe
                        )
                      }
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-100"
                      title="Copiar número da classe"
                    >

                      {copiado ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}

                      {copiado
                        ? "Copiado"
                        : "Copiar"}

                    </button>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-blue-700/70">
                    Compartilhe com os alunos. Após entrar com Google, eles digitam este número uma única vez.
                  </p>

                </div>

              )}


              <div className="mt-5 flex items-center text-sm font-medium text-slate-600">

                <Users
                  size={16}
                  className="mr-2"
                />

                {classe.id
                  ? quantidadeAlunos[
                      classe.id
                    ] ??
                    0
                  : 0}{" "}

                {(classe.id
                  ? quantidadeAlunos[
                      classe.id
                    ] ??
                    0
                  : 0) ===
                1
                  ? "aluno"
                  : "alunos"}

              </div>


              <div className="mt-5 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    onGerenciarAlunos?.(
                      classe
                    )
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Users size={17} />
                  Gerenciar alunos
                </button>


                {podeGerenciar && (

                  <>

                    <button
                      type="button"
                      onClick={() =>
                        onEditar(
                          classe
                        )
                      }
                      title="Editar classe"
                      className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onInativar(
                          classe
                        )
                      }
                      title="Inativar classe"
                      className="flex items-center justify-center rounded-lg border border-red-200 px-3 py-2.5 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>

                  </>

                )}

              </div>

            </div>
          );
        }
      )}

    </div>
  );
}
