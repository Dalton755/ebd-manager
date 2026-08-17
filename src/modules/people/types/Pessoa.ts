export interface Pessoa {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  ativo?: boolean;
  criado_em?: string;
  senha_temporaria?: boolean;
  igreja_id?: string;

  perfil:
  | "PENDENTE"
  | "ADMIN"
  | "PASTOR"
  | "SUPERINTENDENTE"
  | "SECRETARIO"
  | "PROFESSOR"
  | "ALUNO";

  status:
  | "PENDENTE"
  | "ATIVO"
  | "INATIVO"
  | "BLOQUEADO";
}
