export type TipoElementoApresentacao =
    | "TEXTO"
    | "REFERENCIA_BIBLICA"
    | "COBERTURA"
    | "IMAGEM";


export type ElementoApresentacao = {
    id: string;

    pagina: number;

    tipo: TipoElementoApresentacao;

    /*
     * Coordenadas proporcionais ao slide.
     *
     * 0 = início
     * 1 = final
     *
     * Isso permite que a edição continue
     * correta em celular, desktop,
     * TV e projetor.
     */
    x: number;
    y: number;

    largura: number;
    altura: number;

    conteudo?: string;

    arquivo_path?: string;

    arquivo_nome?: string;

    arquivo_tipo?: string;

    tamanho_fonte?: number;

    alinhamento?:
    | "left"
    | "center"
    | "right";

    negrito?: boolean;

    italico?: boolean;

    cor_texto?: string;

    cor_fundo?: string;

    opacidade?: number;
};


export type RascunhoApresentacao = {
    id: string;

    apresentacao_id: string;

    elementos: ElementoApresentacao[];

    editado_por: string | null;

    created_at: string;

    updated_at: string;
};


export type VersaoApresentacao = {
    id: string;

    apresentacao_id: string;

    numero: number;

    elementos: ElementoApresentacao[];

    criada_por: string | null;

    publicada: boolean;

    publicada_em: string | null;

    publicada_por: string | null;

    created_at: string;

    updated_at: string;
};