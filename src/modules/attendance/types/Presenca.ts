export type Presenca = {
  id: string;

  pessoa_id: string;

  aula_id: string | null;

  data: string;

  hora_checkin: string | null;

  tipo_registro: "CHECKIN" | "CHAMADA";

  registrado_por: string | null;

  localizacao_status:
  | "DENTRO"
  | "FORA"
  | null;

  distancia_metros: number | null;

  latitude: number | null;

  longitude: number | null;

  precisao: number | null;

  status_validacao:
  | "PENDENTE"
  | "VALIDADO"
  | "REJEITADO"
  | null;

  validado_por: string | null;

  validado_em: string | null;

  observacao_validacao: string | null;

  pessoas?: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
  };

  aula?: {
    id: string;
    numero: number;
    titulo: string;
    data: string;
  };
};