export type RecursoCodigo =
  | "ALUNOS_CLASSES"
  | "AULAS"
  | "CHECKIN"
  | "CHECKIN_LOCALIZACAO"
  | "CLASSES"
  | "DASHBOARD"
  | "FINANCEIRO"
  | "GESTAO_USUARIOS"
  | "NOTIFICACAO_PUSH"
  | "NOTIFICACOES"
  | "PESSOAS"
  | "PRESENCAS"
  | "PROFESSORES"
  | "RELATORIOS"
  | "TRIMESTRES";

export type PlanoNome =
  | "Semente"
  | "Crescimento"
  | "Igreja";

export type Plano = {
  id: string;
  nome: PlanoNome;
  descricao: string;
  ordem: number;
  ativo: boolean;
};

export type PlanoLimites = {
  max_pessoas: number;
  max_classes: number;
  max_professores: number;
  max_administradores: number;
  max_trimestres_ativos: number;
};

export type PlanoRecurso = {
  recurso_id: string;
  codigo: RecursoCodigo;
  ativo: boolean;
};

export type PlanoCompleto = {
  plano: Plano;
  limites: PlanoLimites;
  recursos: RecursoCodigo[];
};
