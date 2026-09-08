export type ApresentacaoAula = {
    id: string;
    aula_id: string;
    arquivo_path: string;
    arquivo_nome: string;
    arquivo_tipo: string;
    total_paginas: number | null;
    enviado_por: string | null;
    versao_publicada_id: string | null;
    publicada_em: string | null;
    publicada_por: string | null;
    created_at: string;
    updated_at: string;
};