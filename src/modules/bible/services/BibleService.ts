import {
    BibleRepository,
} from "@/modules/bible/repositories/BibleRepository";

import type {
    PassagemBiblica,
} from "@/modules/bible/types/Bible";

import type {
    ReferenciaBiblica,
} from "@/modules/lessons/utils/bibleReferenceParser";


export class BibleService {

    static async buscarPassagem(
        referencia: ReferenciaBiblica,
        codigoTraducao?: string
    ): Promise<PassagemBiblica> {

        if (
            referencia.versiculoInicial ===
            null
        ) {
            throw new Error(
                "A referência precisa informar o versículo."
            );
        }


        const traducao =
            await BibleRepository
                .buscarTraducaoAtiva(
                    codigoTraducao
                );


        if (!traducao) {
            throw new Error(
                "Nenhuma tradução bíblica está disponível."
            );
        }


        const versiculoInicial =
            referencia.versiculoInicial;

        const versiculoFinal =
            referencia.versiculoFinal ??
            versiculoInicial;


        const versiculos =
            await BibleRepository
                .buscarVersiculos(
                    traducao.id,
                    referencia.livroAbreviado,
                    referencia.capitulo,
                    versiculoInicial,
                    versiculoFinal
                );


        if (versiculos.length === 0) {
            throw new Error(
                "Texto bíblico não encontrado para esta referência."
            );
        }


        const referenciaFormatada =
            versiculoInicial ===
            versiculoFinal
                ? `${referencia.livro} ${referencia.capitulo}:${versiculoInicial}`
                : `${referencia.livro} ${referencia.capitulo}:${versiculoInicial}-${versiculoFinal}`;


        return {
            referencia:
                referenciaFormatada,

            traducao,

            livro:
                referencia.livro,

            livroAbreviado:
                referencia.livroAbreviado,

            capitulo:
                referencia.capitulo,

            versiculoInicial,
            versiculoFinal,
            versiculos,
        };
    }
}
