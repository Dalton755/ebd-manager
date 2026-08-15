export type Aula = {
    id: string;

    trimestre_id: string;

    numero: number;

    titulo: string;

    data: string;

    professor_id: string | null;

    professor?: {
        id: string;
        nome: string;
    } | null;

    link_drive: string | null;

    created_at?: string;

    updated_at?: string;
};