export type TrimestreClasse = {
    id: string;

    trimestre_id: string;

    classe_id: string;

    tema: string | null;

    created_at?: string;

    updated_at?: string;

    trimestre?: {
        id: string;
        numero: number;
        ano: number;
        ativo: boolean;
        igreja_id: string;
    } | null;

    classe?: {
        id: string;
        nome: string;
        cor: string | null;
        ativa: boolean;
        igreja_id: string;
    } | null;
};


export type ClasseNoTrimestre = {
    vinculo_id: string | null;

    classe_id: string;

    classe_nome: string;

    classe_cor: string | null;

    tema: string | null;

    total_aulas: number;
};


export type TrimestreComClasses = {
    id: string;

    numero: number;

    ano: number;

    ativo: boolean;

    classes: ClasseNoTrimestre[];
};