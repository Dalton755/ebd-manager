import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PeopleService } from "../services/PeopleService";
import type { Pessoa } from "../types/Pessoa";
import {
  PeopleForm,
  type PessoaSalvaInfo,
} from "../components/PeopleForm";
import { PeopleTable } from "../components/PeopleTable";
import { ClassService } from "@/modules/classes/services/ClassService";
import type { Classe } from "@/modules/classes/types/Classe";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  MessageCircle,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/Card";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { useSearch } from "@/shared/hooks/useSearch";
import { useCrud } from "@/shared/hooks/useCrud";
import { PeopleCardList } from "../components/PeopleCardList";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { temPermissao } from "@/shared/auth/permissions";
import { PlanLimitModal } from "@/shared/components/plans/PlanLimitModal";

import {
  OnboardingTour,
  type OnboardingStep,
} from "@/modules/onboarding/components/OnboardingTour";

import {
  useOnboardingTutorial,
} from "@/modules/onboarding/hooks/useOnboardingTutorial";


export function PeoplePage() {

  const { pessoa: usuarioLogado } = useAuth();

  const perfilUsuario =
    usuarioLogado?.perfil === "PENDENTE"
      ? undefined
      : usuarioLogado?.perfil;

  const podeGerenciarPessoas = temPermissao(
    perfilUsuario,
    "GERENCIAR_PESSOAS"
  );

  const podeGerenciarPerfis = temPermissao(
    perfilUsuario,
    "GERENCIAR_PERFIS"
  );

  const tutorialPessoas =
    useOnboardingTutorial({
      pessoaId:
        usuarioLogado?.id,

      tutorial:
        "PESSOAS",

      versao:
        1,

      habilitado:
        podeGerenciarPessoas,
    });

  const carregarPessoasCallback =
    useCallback(async () => {
      if (!usuarioLogado?.igreja_id) {
        return [];
      }

      return await PeopleService.listar(
        usuarioLogado.igreja_id
      );
    }, [usuarioLogado?.igreja_id]);

  const {
    data: pessoas,
    loading,
    refresh: carregarPessoas,
  } = useCrud<Pessoa>(
    carregarPessoasCallback,
    "Erro ao carregar pessoas."
  );

  useEffect(() => {

    async function carregarDados() {

      if (
        !usuarioLogado?.igreja_id
      ) {
        setClasses([]);
        return;
      }

      carregarPessoas();

      try {

        const classesIgreja =
          await ClassService.listar(
            usuarioLogado.igreja_id
          );

        setClasses(
          classesIgreja ?? []
        );

      } catch (error) {

        console.error(
          "Erro ao carregar classes:",
          error
        );

      }
    }

    void carregarDados();

  }, [
    usuarioLogado?.igreja_id,
  ]);

  const [
    classes,
    setClasses,
  ] = useState<Classe[]>([]);

  const [
    perfilFiltro,
    setPerfilFiltro,
  ] = useState("TODOS");

  const [
    classeFiltro,
    setClasseFiltro,
  ] = useState("TODAS");

  const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | undefined>();
  const [formModalOpen, setFormModalOpen,] = useState(false);
  const [acessoCriado, setAcessoCriado,] = useState<PessoaSalvaInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pessoaParaInativar, setPessoaParaInativar] = useState<Pessoa | undefined>();
  const [planLimitModalOpen, setPlanLimitModalOpen] = useState(false);
  const [pessoasUtilizadas, setPessoasUtilizadas] = useState(0);
  const [limitePessoas, setLimitePessoas] = useState(0);
  const [recursoLimite, setRecursoLimite] = useState<
    | "pessoas"
    | "classes"
    | "professores"
    | "secretarios"
    | "pastores"
    | "administradores"
    | "superintendentes"
  >("pessoas");

  const abrirNovaPessoa =
    useCallback(
      () => {

        setPessoaSelecionada(
          undefined
        );

        setFormModalOpen(
          true
        );

      },
      []
    );


  const abrirEdicao =
    useCallback(
      (
        pessoa: Pessoa
      ) => {

        setPessoaSelecionada(
          pessoa
        );

        setFormModalOpen(
          true
        );

      },
      []
    );


  const fecharFormulario =
    useCallback(
      () => {

        setFormModalOpen(
          false
        );

        setPessoaSelecionada(
          undefined
        );

      },
      []
    );

  function montarMensagemAcesso(
    info: PessoaSalvaInfo
  ) {

    const linkApp =
      `https://ebd-manager-seven.vercel.app/login?igreja_id=${info.igreja_id}`;

    return [
      `Olá, ${info.nome}!`,
      "",
      "Seu acesso ao EBD Manager foi criado com sucesso.",
      "",
      `E-mail: ${info.email}`,
      "Senha provisória: ebdadve@2026",
      "",
      "Acesse o EBD Manager pelo link abaixo:",
      linkApp,
      "",
      "No primeiro acesso, o sistema solicitará que você crie uma nova senha.",
      "",
      "Depois disso, entre normalmente utilizando seu e-mail e a nova senha.",
    ].join("\n");
  }


  async function copiarMensagemAcesso() {

    if (!acessoCriado) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        montarMensagemAcesso(
          acessoCriado
        )
      );


      toast.success(
        "Mensagem de acesso copiada!"
      );

    } catch (error) {

      console.error(
        "Erro ao copiar mensagem:",
        error
      );


      toast.error(
        "Não foi possível copiar a mensagem."
      );

    }

  }


  function abrirWhatsAppAcesso() {

    if (!acessoCriado) {
      return;
    }


    const telefone =
      acessoCriado.telefone
        .replace(/\D/g, "");


    if (!telefone) {

      toast.error(
        "Essa pessoa não possui telefone cadastrado."
      );

      return;
    }


    /*
     * Telefones brasileiros cadastrados
     * normalmente não possuem DDI.
     */
    const telefoneWhatsApp =
      telefone.startsWith("55")
        ? telefone
        : `55${telefone}`;


    const mensagem =
      montarMensagemAcesso(
        acessoCriado
      );


    window.open(
      `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(
        mensagem
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const passosTutorialPessoas =
    useMemo<OnboardingStep[]>(
      () => [

        // =====================================================
        // 1
        // =====================================================

        {
          id:
            "boas-vindas",

          titulo:
            "Vamos começar pelas pessoas",

          descricao: (
            <>
              Aqui você cadastra e gerencia
              <strong> alunos, professores, pastores, secretários, superintendentes e administradores</strong>
              {" "}da sua EBD.
              <br />
              <br />
              Vamos conhecer juntos como funciona.
            </>
          ),

          aoEntrar:
            fecharFormulario,

          textoProximo:
            "Começar",
        },


        // =====================================================
        // 2
        // =====================================================

        {
          id:
            "nova-pessoa",

          titulo:
            "Cadastrar uma nova pessoa",

          descricao: (
            <>
              Sempre que precisar cadastrar alguém,
              utilize o botão <strong>Nova pessoa</strong>.
              <br />
              <br />
              No próximo passo abriremos esse
              formulário para você conhecer cada campo.
            </>
          ),

          alvo:
            '[data-tour="pessoas-nova"]',
        },


        // =====================================================
        // 3
        // =====================================================

        {
          id:
            "formulario",

          titulo:
            "Cadastro de pessoa",

          descricao: (
            <>
              Este é o formulário usado para cadastrar
              uma pessoa no EBD Manager.
              <br />
              <br />
              Vamos entender os campos.
            </>
          ),

          alvo:
            '[data-tour="pessoas-modal"]',

          aoEntrar:
            abrirNovaPessoa,
        },


        // =====================================================
        // 4
        // =====================================================

        {
          id:
            "nome",

          titulo:
            "Nome da pessoa",

          descricao: (
            <>
              Informe o <strong>nome completo</strong>.
              Esse nome aparecerá nas chamadas,
              relatórios, aulas e demais áreas do sistema.
            </>
          ),

          alvo:
            '[data-tour="pessoas-nome"]',
        },


        // =====================================================
        // 5
        // =====================================================

        {
          id:
            "email",

          titulo:
            "O e-mail também será o login",

          descricao: (
            <>
              Informe um e-mail válido.
              <br />
              <br />
              <strong>
                Esse mesmo e-mail será utilizado pela
                pessoa para entrar no EBD Manager.
              </strong>
            </>
          ),

          alvo:
            '[data-tour="pessoas-email"]',
        },


        // =====================================================
        // 6
        // =====================================================

        {
          id:
            "telefone",

          titulo:
            "Telefone",

          descricao: (
            <>
              Informe o telefone da pessoa para manter
              o cadastro organizado e facilitar o contato
              quando necessário.
            </>
          ),

          alvo:
            '[data-tour="pessoas-telefone"]',
        },


        // =====================================================
        // 7
        // =====================================================

        {
          id:
            "perfil",

          titulo:
            "Escolha o perfil correto",

          descricao: (
            <>
              O <strong>Perfil</strong> determina o papel
              da pessoa dentro do EBD Manager.
              <br />
              <br />
              Por exemplo: Aluno, Professor, Pastor,
              Secretário, Superintendente ou Administrador.
              <br />
              <br />
              Cada perfil terá acesso às funcionalidades
              permitidas para sua função.
            </>
          ),

          alvo:
            '[data-tour="pessoas-perfil"]',
        },


        // =====================================================
        // 8
        // =====================================================

        {
          id:
            "classe",

          titulo:
            "Classe do aluno",

          descricao: (
            <>
              Quando o perfil escolhido for
              <strong> Aluno</strong>, você também poderá
              definir a classe em que ele estuda.
              <br />
              <br />
              Esse campo aparece somente para alunos e
              também poderá ser alterado posteriormente.
            </>
          ),

          alvo:
            '[data-tour="pessoas-classe"]',
        },


        // =====================================================
        // 9
        // =====================================================

        {
          id:
            "salvar",

          titulo:
            "Cadastrar pessoa",

          descricao: (
            <>
              Depois de conferir os dados,
              clique em <strong>Cadastrar pessoa</strong>.
              <br />
              <br />
              O EBD Manager criará também o acesso dessa
              pessoa ao sistema.
              <br />
              <br />
              Durante este tutorial você pode apenas
              conhecer o botão; não precisa cadastrar
              ninguém agora.
            </>
          ),

          alvo:
            '[data-tour="pessoas-salvar"]',
        },


        // =====================================================
        // 10
        // =====================================================

        {
          id:
            "primeiro-acesso",

          titulo:
            "Como funciona o primeiro acesso",

          descricao: (
            <>
              Depois que a pessoa for cadastrada, envie
              para ela:
              <br />
              <br />

              <strong>E-mail:</strong>{" "}
              o mesmo informado no cadastro.
              <br />

              <strong>Senha provisória:</strong>{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-900">
                ebdadve@2026
              </code>

              <br />
              <br />

              No primeiro login, o EBD Manager
              identificará automaticamente que essa é
              uma senha temporária e direcionará a pessoa
              para <strong>criar uma nova senha</strong>.
              <br />
              <br />

              Depois disso, ela poderá entrar normalmente
              utilizando seu e-mail e a nova senha.
            </>
          ),
        },


        // =====================================================
        // 11
        // =====================================================

        {
          id:
            "editar",

          titulo:
            "Editar uma pessoa",

          descricao: (
            <>
              Você também pode alterar posteriormente
              os dados de qualquer pessoa cadastrada.
              <br />
              <br />
              Utilize o botão com o
              <strong> lápis / Editar</strong>.
            </>
          ),

          alvo:
            '[data-tour="pessoas-editar"]',

          aoEntrar:
            fecharFormulario,
        },


        // =====================================================
        // 12
        // =====================================================

        {
          id:
            "formulario-edicao",

          titulo:
            "Formulário de edição",

          descricao: (
            <>
              Ao editar, o sistema abre novamente o
              cadastro com os dados atuais da pessoa.
              <br />
              <br />
              Você pode corrigir nome, e-mail, telefone,
              perfil e, quando for aluno, sua classe.
              <br />
              <br />
              Nenhuma alteração será feita automaticamente
              durante este tutorial.
            </>
          ),

          alvo:
            '[data-tour="pessoas-modal"]',

          aoEntrar:
            () => {

              const pessoaDemonstracao =
                pessoas[0];


              if (
                pessoaDemonstracao
              ) {

                abrirEdicao(
                  pessoaDemonstracao
                );

              }

            },
        },


        // =====================================================
        // 13
        // =====================================================

        {
          id:
            "salvar-edicao",

          titulo:
            "Salvar alterações",

          descricao: (
            <>
              Quando realmente fizer uma alteração,
              utilize <strong>Salvar alterações</strong>.
              <br />
              <br />
              Se um aluno for transferido de classe,
              o EBD Manager preservará o histórico das
              classes anteriores para manter os relatórios
              antigos corretos.
            </>
          ),

          alvo:
            '[data-tour="pessoas-salvar"]',
        },


        // =====================================================
        // 14
        // =====================================================

        {
          id:
            "conclusao",

          titulo:
            "Pronto!",

          descricao: (
            <>
              Agora você já sabe cadastrar e editar
              pessoas no EBD Manager.
              <br />
              <br />
              Nos próximos tutoriais vamos conhecer
              Classes, Trimestres, Aulas, Presenças
              e outras funcionalidades do sistema.
            </>
          ),

          aoEntrar:
            fecharFormulario,
        },

      ],
      [
        abrirEdicao,
        abrirNovaPessoa,
        fecharFormulario,
        pessoas,
      ]
    );


  async function atualizarPerfilPessoa(
    pessoa: Pessoa,
    perfil: Pessoa["perfil"]
  ) {
    if (!podeGerenciarPerfis) {
      toast.error(
        "Você não tem permissão para alterar perfis."
      );
      return;
    }

    if (!pessoa.id) return;

    try {
      await PeopleService.atualizarPerfil(
        pessoa.id,
        perfil
      );

      toast.success(
        `Perfil de ${pessoa.nome} atualizado para ${perfil}.`
      );

      carregarPessoas();
    } catch (error: any) {
      console.error(
        "Erro ao atualizar perfil:",
        error
      );

      // =====================================================
      // LIMITE DE PROFESSORES
      // =====================================================

      if (
        error?.codigo ===
        "LIMITE_PROFESSORES_ATINGIDO"
      ) {
        setPessoasUtilizadas(
          error.utilizado ?? 0
        );

        setLimitePessoas(
          error.limite ?? 0
        );

        setRecursoLimite("professores");

        setPlanLimitModalOpen(true);

        return;
      }

      // =====================================================
      // LIMITE DE ADMINISTRADORES
      // =====================================================

      if (
        error?.codigo ===
        "LIMITE_ADMINISTRADORES_ATINGIDO"
      ) {
        setPessoasUtilizadas(
          error.utilizado ?? 0
        );

        setLimitePessoas(
          error.limite ?? 0
        );

        setRecursoLimite("administradores");

        setPlanLimitModalOpen(true);

        return;
      }

      // =====================================================
      // LIMITE DE SECRETÁRIOS
      // =====================================================

      if (
        error?.codigo ===
        "LIMITE_SECRETARIOS_ATINGIDO"
      ) {
        setPessoasUtilizadas(
          error.utilizado ?? 0
        );

        setLimitePessoas(
          error.limite ?? 0
        );

        setRecursoLimite("secretarios");

        setPlanLimitModalOpen(true);

        return;
      }

      // =====================================================
      // LIMITE DE PASTORES
      // =====================================================

      if (
        error?.codigo ===
        "LIMITE_PASTORES_ATINGIDO"
      ) {
        setPessoasUtilizadas(
          error.utilizado ?? 0
        );

        setLimitePessoas(
          error.limite ?? 0
        );

        setRecursoLimite("pastores");

        setPlanLimitModalOpen(true);

        return;
      }

      // =====================================================
      // LIMITE DE SUPERINTENDENTES
      // =====================================================

      if (
        error?.codigo ===
        "LIMITE_SUPERINTENDENTES_ATINGIDO"
      ) {
        setPessoasUtilizadas(
          error.utilizado ?? 0
        );

        setLimitePessoas(
          error.limite ?? 0
        );

        setRecursoLimite(
          "superintendentes"
        );

        setPlanLimitModalOpen(true);

        return;
      }

      // =====================================================
      // ERRO GENÉRICO
      // =====================================================

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o perfil da pessoa.";

      toast.error(mensagem);
    }
  }

  function inativarPessoa(pessoa: Pessoa) {
    if (!podeGerenciarPessoas) {
      toast.error(
        "Você não tem permissão para inativar pessoas."
      );
      return;
    }

    setPessoaParaInativar(pessoa);
    setDialogOpen(true);
  }

  async function confirmarInativacao() {
    if (!podeGerenciarPessoas) {
      toast.error(
        "Você não tem permissão para inativar pessoas."
      );
      return;
    }

    if (!pessoaParaInativar) return;

    try {
      await PeopleService.inativar(pessoaParaInativar.id!);

      toast.success("Pessoa inativada com sucesso.");

      carregarPessoas();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao inativar pessoa.");

    } finally {
      setDialogOpen(false);
      setPessoaParaInativar(undefined);
    }
  }



  const {
    search,
    setSearch,
    filtered: pessoasPesquisadas,
  } = useSearch(
    pessoas,
    (pessoa) =>
      `${pessoa.nome} ${pessoa.email} ${pessoa.telefone}`
  );


  const pessoasFiltradas =
    useMemo(() => {

      return pessoasPesquisadas.filter(
        (pessoa) => {

          if (
            perfilFiltro !== "TODOS" &&
            pessoa.perfil !== perfilFiltro
          ) {
            return false;
          }


          if (
            classeFiltro ===
            "__SEM_CLASSE__"
          ) {
            return (
              pessoa.perfil === "ALUNO" &&
              !pessoa.classe_id
            );
          }


          if (
            classeFiltro !== "TODAS" &&
            pessoa.classe_id !== classeFiltro
          ) {
            return false;
          }


          return true;
        }
      );

    }, [
      pessoasPesquisadas,
      perfilFiltro,
      classeFiltro,
    ]);



  return (


    <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <PageHeader
          title="Pessoas"
          subtitle="Cadastre e gerencie alunos, professores e colaboradores"
          icon={Users}
        />


        {podeGerenciarPessoas && (

          <button
            type="button"
            data-tour="pessoas-nova"
            onClick={abrirNovaPessoa}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >

            <UserPlus size={18} />

            Nova pessoa

          </button>

        )}

      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Pesquisar por nome, e-mail ou telefone..."
            />


            <select
              value={perfilFiltro}
              onChange={(event) =>
                setPerfilFiltro(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="TODOS">
                Todos os perfis
              </option>

              <option value="ALUNO">
                Alunos
              </option>

              <option value="PROFESSOR">
                Professores
              </option>

              <option value="SUPERINTENDENTE">
                Superintendentes
              </option>

              <option value="SECRETARIO">
                Secretários
              </option>

              <option value="PASTOR">
                Pastores
              </option>

              <option value="ADMIN">
                Administradores
              </option>

            </select>


            <select
              value={classeFiltro}
              onChange={(event) =>
                setClasseFiltro(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="TODAS">
                Todas as classes
              </option>

              <option value="__SEM_CLASSE__">
                Alunos sem classe
              </option>


              {classes.map((classe) => (

                <option
                  key={classe.id}
                  value={classe.id}
                >
                  {classe.nome}
                </option>

              ))}

            </select>

          </div>
        </CardContent>
      </Card>



      <Card>
        <CardHeader>
          <CardTitle>Pessoas cadastradas</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingSpinner text="Carregando pessoas..." />
          ) : (
            <>
              <div className="hidden md:block">
                <PeopleTable
                  pessoas={pessoasFiltradas}
                  classes={classes}
                  onEditar={abrirEdicao}
                  onInativar={inativarPessoa}
                  onAtualizarPerfil={atualizarPerfilPessoa}
                  podeGerenciar={podeGerenciarPessoas}
                  podeGerenciarPerfis={podeGerenciarPerfis}
                />
              </div>

              <div className="md:hidden">
                <PeopleCardList
                  pessoas={pessoasFiltradas}
                  classes={classes}
                  onEditar={abrirEdicao}
                  onInativar={inativarPessoa}
                  onAtualizarPerfil={atualizarPerfilPessoa}
                  podeGerenciar={podeGerenciarPessoas}
                  podeGerenciarPerfis={podeGerenciarPerfis}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL NOVA / EDITAR PESSOA */}

      {formModalOpen &&
        podeGerenciarPessoas && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">

            <div
              data-tour="pessoas-modal"
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >


              {/* CABEÇALHO */}

              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                    {pessoaSelecionada
                      ? <Users size={21} />
                      : <UserPlus size={21} />}

                  </div>


                  <div>

                    <h2 className="text-xl font-bold text-slate-900">

                      {pessoaSelecionada
                        ? "Editar pessoa"
                        : "Nova pessoa"}

                    </h2>


                    <p className="mt-1 text-sm text-slate-500">

                      {pessoaSelecionada
                        ? "Atualize os dados da pessoa cadastrada."
                        : "Informe os dados para cadastrar uma nova pessoa."}

                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={fecharFormulario}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title="Fechar"
                >

                  <X size={20} />

                </button>

              </div>


              {/* FORMULÁRIO */}

              <div className="max-h-[75vh] overflow-y-auto p-6">

                <PeopleForm
                  pessoa={pessoaSelecionada}

                  onSaved={(info) => {

                    fecharFormulario();

                    void carregarPessoas();


                    /*
                     * Mostra credenciais somente
                     * quando uma conta acaba de ser criada.
                     *
                     * Editar uma pessoa não gera
                     * uma nova senha provisória.
                     */
                    if (
                      info.tipo ===
                      "CRIACAO"
                    ) {

                      setAcessoCriado(
                        info
                      );

                    }

                  }}

                  onLimitReached={(
                    recurso,
                    utilizado,
                    limite
                  ) => {

                    setRecursoLimite(
                      recurso
                    );

                    setPessoasUtilizadas(
                      utilizado
                    );

                    setLimitePessoas(
                      limite
                    );

                    setPlanLimitModalOpen(
                      true
                    );

                  }}
                />

              </div>

            </div>

          </div>

        )}

      <OnboardingTour

        aberto={
          tutorialPessoas.aberto
        }

        passos={
          passosTutorialPessoas
        }

        onConcluir={
          async () => {

            fecharFormulario();

            await tutorialPessoas
              .concluir();

          }
        }

        onPular={
          async () => {

            fecharFormulario();

            await tutorialPessoas
              .pular();

          }
        }

      />

      {/* ===================================================== */}
      {/* ACESSO CRIADO */}
      {/* ===================================================== */}

      {acessoCriado && (

        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* CABEÇALHO */}

            <div className="relative bg-slate-950 px-6 py-7 text-white">

              <button
                type="button"
                onClick={() =>
                  setAcessoCriado(null)
                }
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X size={19} />
              </button>


              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">

                <CheckCircle2 size={26} />

              </div>


              <h2 className="mt-4 text-2xl font-bold">
                Acesso criado
              </h2>


              <p className="mt-1 text-sm leading-6 text-slate-400">

                {acessoCriado.nome} já pode acessar
                o EBD Manager.

              </p>

            </div>


            <div className="space-y-5 p-6">

              {/* CREDENCIAIS */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="flex items-center gap-2 text-slate-700">

                  <KeyRound
                    size={18}
                    className="text-blue-600"
                  />

                  <p className="font-bold">
                    Dados para o primeiro acesso
                  </p>

                </div>


                <div className="mt-5 space-y-4">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      E-mail
                    </p>

                    <p className="mt-1 break-all font-semibold text-slate-900">
                      {acessoCriado.email}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Senha provisória
                    </p>

                    <div className="mt-1 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-base font-bold text-slate-900">

                      ebdadve@2026

                    </div>

                  </div>

                </div>

              </div>


              {/* EXPLICAÇÃO */}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-sm leading-6 text-blue-900">

                  No primeiro login, o EBD Manager
                  solicitará automaticamente a criação
                  de uma <strong>nova senha</strong>.

                  Depois disso, a pessoa utilizará o
                  e-mail cadastrado e sua nova senha
                  normalmente.

                </p>

              </div>


              {/* BOTÕES */}

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={
                    copiarMensagemAcesso
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >

                  <Copy size={17} />

                  Copiar mensagem

                </button>


                <button
                  type="button"
                  onClick={
                    abrirWhatsAppAcesso
                  }
                  disabled={
                    !acessoCriado.telefone
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <MessageCircle size={18} />

                  Enviar no WhatsApp

                </button>

              </div>


              {!acessoCriado.telefone && (

                <p className="text-center text-xs text-slate-400">
                  Cadastre um telefone para usar o envio direto pelo WhatsApp.
                </p>

              )}


              <button
                type="button"
                onClick={() =>
                  setAcessoCriado(null)
                }
                className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >

                Entendi

              </button>

            </div>

          </div>

        </div>

      )}

      <ConfirmDialog
        open={dialogOpen}
        title="Inativar pessoa"
        description={`Deseja realmente inativar "${pessoaParaInativar?.nome}"?`}
        confirmText="Inativar"
        cancelText="Cancelar"
        onConfirm={confirmarInativacao}
        onCancel={() => {
          setDialogOpen(false);
          setPessoaParaInativar(undefined);
        }}
      />

      <PlanLimitModal
        open={planLimitModalOpen}
        utilizado={pessoasUtilizadas}
        limite={limitePessoas}
        recurso={recursoLimite}
        onClose={() => setPlanLimitModalOpen(false)}
      />

    </div>
  );
}