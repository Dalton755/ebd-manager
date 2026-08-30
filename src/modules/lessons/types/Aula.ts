export type Aula = {
    id: string;

    trimestre_id: string;

    classe_id: string | null;

    classe?: {
        id: string;
        nome: string;
    } | null;

    numero: number;

    titulo: string;

    data: string;

    hora_inicio: string | null;

    hora_fim: string | null;

    professor_id: string | null;

    professor?: {
        id: string;
        nome: string;
    } | null;

    link_drive: string | null;

    cancelada?: boolean;

    cancelada_em?: string | null;

    cancelada_por?: string | null;

    motivo_cancelamento?: string | null;

    created_at?: string;

    updated_at?: string;
};