import {
  useEffect,
  useState,
} from "react";

import {
  GraduationCap,
  School,
} from "lucide-react";

import { toast } from "sonner";

import {
  PeopleService,
} from "../services/PeopleService";

import type {
  Pessoa,
} from "../types/Pessoa";

import {
  ClassService,
} from "@/modules/classes/services/ClassService";

import type {
  Classe,
} from "@/modules/classes/types/Classe";

import {
  useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
  maskTelefone,
} from "@/shared/lib/masks";

import {
  peopleSchema,
} from "../validations/peopleSchema";

import {
  Input,
} from "@/shared/components/ui/Input";

import {
  Button,
} from "@/shared/components/ui/Button";


type RecursoLimite =
  | "pessoas"
  | "professores"
  | "secretarios"
  | "pastores"
  | "administradores"
  | "superintendentes";


export type PessoaSalvaInfo = {
  tipo: "CRIACAO" | "EDICAO";
  nome: string;
  email: string;
  telefone: string;
  igreja_id: string;
};


type Props = {
  pessoa?: Pessoa;

  onSaved: (
    info: PessoaSalvaInfo
  ) => void;

  onLimitReached?: (
    recurso: RecursoLimite,
    utilizado: number,
    limite: number
  ) => void;
};


function recursoPorCodigo(
  codigo?: string
): RecursoLimite | null {

  switch (codigo) {

    case "LIMITE_PESSOAS_ATINGIDO":
      return "pessoas";

    case "LIMITE_PROFESSORES_ATINGIDO":
      return "professores";

    case "LIMITE_SECRETARIOS_ATINGIDO":
      return "secretarios";

    case "LIMITE_PASTORES_ATINGIDO":
      return "pastores";

    case "LIMITE_ADMINISTRADORES_ATINGIDO":
      return "administradores";

    case "LIMITE_SUPERINTENDENTES_ATINGIDO":
      return "superintendentes";

    default:
      return null;
  }
}


export function PeopleForm({
  pessoa,
  onSaved,
  onLimitReached,
}: Props) {

  const {
    pessoa: usuarioLogado,
  } = useAuth();


  const [
    nome,
    setNome,
  ] = useState(
    pessoa?.nome ?? ""
  );


  const [
    email,
    setEmail,
  ] = useState(
    pessoa?.email ?? ""
  );


  const [
    telefone,
    setTelefone,
  ] = useState(
    pessoa?.telefone ?? ""
  );


  const [
    perfil,
    setPerfil,
  ] = useState<Pessoa["perfil"]>(
    pessoa?.perfil ?? "ALUNO"
  );


  const [
    classeId,
    setClasseId,
  ] = useState(
    pessoa?.classe_id ?? ""
  );


  const [
    classes,
    setClasses,
  ] = useState<Classe[]>([]);


  const [
    carregandoClasses,
    setCarregandoClasses,
  ] = useState(false);


  const [
    salvando,
    setSalvando,
  ] = useState(false);


  // =====================================================
  // CARREGA CLASSES DA IGREJA
  // =====================================================

  useEffect(() => {

    async function carregarClasses() {

      if (
        !usuarioLogado?.igreja_id
      ) {
        setClasses([]);
        return;
      }

      try {

        setCarregandoClasses(true);

        const resultado =
          await ClassService.listar(
            usuarioLogado.igreja_id
          );

        setClasses(
          resultado ?? []
        );

      } catch (error) {

        console.error(
          "Erro ao carregar classes:",
          error
        );

        toast.error(
          "Não foi possível carregar as classes."
        );

      } finally {

        setCarregandoClasses(false);
      }
    }

    void carregarClasses();

  }, [
    usuarioLogado?.igreja_id,
  ]);


  // =====================================================
  // PREENCHE FORMULÁRIO
  // =====================================================

  useEffect(() => {

    if (pessoa) {

      setNome(
        pessoa.nome
      );

      setEmail(
        pessoa.email
      );

      setTelefone(
        pessoa.telefone
      );

      setPerfil(
        pessoa.perfil
      );

      setClasseId(
        pessoa.classe_id ?? ""
      );

    } else {

      setNome("");
      setEmail("");
      setTelefone("");
      setPerfil("ALUNO");
      setClasseId("");
    }

  }, [
    pessoa,
  ]);


  // =====================================================
  // AO SAIR DO PERFIL ALUNO, LIMPA CLASSE
  // =====================================================

  useEffect(() => {

    if (
      perfil !== "ALUNO"
    ) {
      setClasseId("");
    }

  }, [
    perfil,
  ]);


  async function salvar() {

    const validacao =
      peopleSchema.safeParse({
        nome,
        email,
        telefone,
      });


    if (
      !validacao.success
    ) {

      toast.error(
        validacao
          .error
          .issues[0]
          .message
      );

      return;
    }


    try {

      setSalvando(true);


      // =====================================================
      // EDIÇÃO
      // =====================================================

      if (
        pessoa
      ) {

        if (
          !pessoa.id
        ) {
          throw new Error(
            "Pessoa inválida."
          );
        }


        // PERFIL:
        // passa pela Edge Function para respeitar limites

        if (
          perfil !==
          pessoa.perfil
        ) {

          await PeopleService.atualizarPerfil(
            pessoa.id,
            perfil
          );
        }


        // DADOS + CLASSE

        await PeopleService.editar(
          pessoa.id,
          {
            nome,
            email,
            telefone,

            classe_id:
              perfil === "ALUNO"
                ? classeId || null
                : null,
          }
        );


        toast.success(
          "Pessoa atualizada com sucesso!"
        );

      } else {

        // =====================================================
        // NOVA PESSOA
        // =====================================================

        await PeopleService.criar({
          nome,
          email,
          telefone,

          perfil,

          classe_id:
            perfil === "ALUNO"
              ? classeId || null
              : null,

          status: "ATIVO",
        });


        toast.success(
          "Pessoa cadastrada com sucesso!"
        );
      }


      const infoSalva: PessoaSalvaInfo = {
        tipo:
          pessoa
            ? "EDICAO"
            : "CRIACAO",

        nome,
        email,
        telefone,
        igreja_id: usuarioLogado?.igreja_id ?? "",
      };


      setNome("");
      setEmail("");
      setTelefone("");
      setPerfil("ALUNO");
      setClasseId("");


      onSaved(
        infoSalva
      );


    } catch (
    error: any
    ) {

      console.error(
        "Erro ao salvar pessoa:",
        error
      );


      const recurso =
        recursoPorCodigo(
          error?.codigo
        );


      if (
        recurso
      ) {

        onLimitReached?.(
          recurso,
          error.utilizado ?? 0,
          error.limite ?? 0
        );

        return;
      }


      const mensagem =
        error instanceof Error
          ? error.message
          : pessoa
            ? "Erro ao atualizar pessoa."
            : "Erro ao cadastrar pessoa.";


      toast.error(
        mensagem
      );

    } finally {

      setSalvando(false);
    }
  }


  return (

    <div className="space-y-5">

      {/* NOME */}

      <div data-tour="pessoas-nome">

        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Nome
        </label>

        <Input
          className="text-base"
          placeholder="Nome completo"
          value={nome}
          onChange={(event) =>
            setNome(
              event.target.value
            )
          }
        />

      </div>


      {/* EMAIL */}

      <div data-tour="pessoas-email">

        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          E-mail
        </label>

        <Input
          className="text-base"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
        />

      </div>


      {/* TELEFONE */}

      <div data-tour="pessoas-telefone">

        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Telefone
        </label>

        <Input
          className="text-base"
          placeholder="(11) 99999-9999"
          value={telefone}
          onChange={(event) =>
            setTelefone(
              maskTelefone(
                event.target.value
              )
            )
          }
        />

      </div>


      {/* PERFIL */}

      <div data-tour="pessoas-perfil">

        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">

          <GraduationCap
            size={16}
            className="text-slate-400"
          />

          Perfil

        </label>


        <select
          value={perfil}

          onChange={(event) =>
            setPerfil(
              event.target
                .value as Pessoa["perfil"]
            )
          }

          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >

          <option value="ALUNO">
            Aluno
          </option>

          <option value="PROFESSOR">
            Professor
          </option>

          <option value="SUPERINTENDENTE">
            Superintendente
          </option>

          <option value="SECRETARIO">
            Secretário
          </option>

          <option value="PASTOR">
            Pastor
          </option>

          <option value="ADMIN">
            Administrador
          </option>

        </select>

      </div>


      {/* CLASSE */}

      {perfil === "ALUNO" && (

        <div data-tour="pessoas-classe">

          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">

            <School
              size={16}
              className="text-slate-400"
            />

            Classe

            <span className="font-normal text-slate-400">
              (opcional)
            </span>

          </label>


          <select
            value={classeId}

            onChange={(event) =>
              setClasseId(
                event.target.value
              )
            }

            disabled={
              carregandoClasses
            }

            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
          >

            <option value="">

              {carregandoClasses
                ? "Carregando classes..."
                : "Sem classe definida"}

            </option>


            {classes.map(
              (
                classe
              ) => (

                <option
                  key={
                    classe.id
                  }
                  value={
                    classe.id
                  }
                >
                  {classe.nome}
                </option>

              )
            )}

          </select>


          <p className="mt-1.5 text-xs text-slate-400">
            Você também poderá definir a classe posteriormente pelo módulo Classes.
          </p>

        </div>

      )}


      <div data-tour="pessoas-salvar">
        <Button
          onClick={
            salvar
          }

          disabled={
            salvando
          }

          className="w-full"
        >

          {salvando
            ? "Salvando..."
            : pessoa
              ? "Salvar alterações"
              : "Cadastrar pessoa"}

        </Button>

      </div>

    </div>
  );
}