export type ProvedorBiblia =
    | "LOCAL"
    | "API_BIBLE";


export type TraducaoBiblia = {
    id: string;
    codigo: string;
    nome: string;
    idioma: string;
    provedor: ProvedorBiblia;
    licenca: string | null;
    fonte: string | null;
    atribuicao: string | null;
    ativa: boolean;
};


export type VersiculoBiblia = {
    id: number;
    traducao_id: string;
    livro_numero: number;
    livro: string;
    livro_abreviado: string;
    capitulo: number;
    versiculo: number;
    texto: string;
};


export type PassagemBiblica = {
    referencia: string;
    traducao: TraducaoBiblia;
    livro: string;
    livroAbreviado: string;
    capitulo: number;
    versiculoInicial: number;
    versiculoFinal: number;
    versiculos: VersiculoBiblia[];
};
