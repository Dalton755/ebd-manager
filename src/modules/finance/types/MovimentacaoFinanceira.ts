export type TipoMovimentacao =
    | "RECEITA"
    | "DESPESA";

export interface CategoriaFinanceira {
    id?: string;
    nome: string;
    tipo: TipoMovimentacao;
    ativa?: boolean;
    created_at?: string;
}

export interface MovimentacaoFinanceira {
    id?: string;

    tipo: TipoMovimentacao;

    categoria_id: string;

    valor: number;

    data: string;

    descricao?: string;

    criado_por?: string;

    created_at?: string;

    comprovante_path?: string;

    comprovante_nome?: string;

    comprovante_tipo?: string;

    categoria?: CategoriaFinanceira;
}