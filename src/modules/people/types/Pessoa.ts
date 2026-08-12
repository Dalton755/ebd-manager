export interface Pessoa {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  ativo?: boolean;
  criado_em?: string;
  senha_temporaria?: boolean;

  perfil:
    | "PENDENTE"
    | "ADMIN"
    | "PASTOR"
    | "SUPERINTENDENTE"
    | "PROFESSOR"
    | "ALUNO";

  status:
    | "PENDENTE"
    | "ATIVO"
    | "INATIVO"
    | "BLOQUEADO";
}
