import {
    BibleRepository,
} from "@/modules/bible/repositories/BibleRepository";

import {
    supabase,
} from "@/shared/lib/supabase/client";

import type {
    PassagemBiblica,
    TraducaoBiblia,
    VersiculoBiblia,
} from "@/modules/bible/types/Bible";

import type {
    ReferenciaBiblica,
} from "@/modules/lessons/utils/bibleReferenceParser";


const CHAVE_PREFERENCIA =
    "ebd:traducao-biblica";


export type OpcaoTraducaoBiblia = {
    codigo: string;
    abreviacao: string;
    nome: string;
    credito: string;
    fonte: string;
    local: boolean;
};


export const VERSOES_BIBLICAS:
    OpcaoTraducaoBiblia[] = [
        {
            codigo: "BLIVRE",
            abreviacao: "BLIVRE",
            nome: "Bíblia Livre",
            credito:
                "CC BY 4.0 · © 2018 Diego Santos, Mario Sérgio e Marco Teles",
            fonte:
                "Base bíblica local do EBD Manager / eBible.org",
            local: true,
        },
        {
            codigo: "ALM1911",
            abreviacao: "ALM1911",
            nome:
                "Almeida 1911 · ortografia modernizada",
            credito:
                "Texto de 1911 em domínio público",
            fonte:
                "bibliaalmeida.com",
            local: false,
        },
        {
            codigo: "ONBV",
            abreviacao: "ONBV",
            nome:
                "Biblica® Open Nova Bíblia Viva™ 2007",
            credito:
                "CC BY-SA 4.0 · © 2007, 2010 Biblica, Inc.",
            fonte:
                "eBible.org / Biblica",
            local: false,
        },
    ];


const CODIGOS_LIVROS:
    Record<string, string> = {
        "Gênesis": "GN",
        "Êxodo": "EX",
        "Levítico": "LV",
        "Números": "NM",
        "Deuteronômio": "DT",
        "Josué": "JS",
        "Juízes": "JZ",
        "Rute": "RT",
        "1 Samuel": "1SM",
        "2 Samuel": "2SM",
        "1 Reis": "1RS",
        "2 Reis": "2RS",
        "1 Crônicas": "1CR",
        "2 Crônicas": "2CR",
        "Esdras": "ED",
        "Neemias": "NE",
        "Ester": "ET",
        "Jó": "JO",
        "Salmos": "SL",
        "Provérbios": "PV",
        "Eclesiastes": "EC",
        "Cantares": "CT",
        "Isaías": "IS",
        "Jeremias": "JR",
        "Lamentações": "LM",
        "Ezequiel": "EZ",
        "Daniel": "DN",
        "Oseias": "OS",
        "Joel": "JL",
        "Amós": "AM",
        "Obadias": "OB",
        "Jonas": "JN",
        "Miqueias": "MQ",
        "Naum": "NA",
        "Habacuque": "HC",
        "Sofonias": "SF",
        "Ageu": "AG",
        "Zacarias": "ZC",
        "Malaquias": "ML",
        "Mateus": "MT",
        "Marcos": "MC",
        "Lucas": "LC",
        "João": "JOA",
        "Atos": "AT",
        "Romanos": "RM",
        "1 Coríntios": "1CO",
        "2 Coríntios": "2CO",
        "Gálatas": "GL",
        "Efésios": "EF",
        "Filipenses": "FP",
        "Colossenses": "CL",
        "1 Tessalonicenses": "1TS",
        "2 Tessalonicenses": "2TS",
        "1 Timóteo": "1TM",
        "2 Timóteo": "2TM",
        "Tito": "TT",
        "Filemom": "FM",
        "Hebreus": "HB",
        "Tiago": "TG",
        "1 Pedro": "1PE",
        "2 Pedro": "2PE",
        "1 João": "1JO",
        "2 João": "2JO",
        "3 João": "3JO",
        "Judas": "JD",
        "Apocalipse": "AP",
    };


function obterOpcaoTraducao(
    codigo?: string
): OpcaoTraducaoBiblia {

    return (
        VERSOES_BIBLICAS.find(
            (item) =>
                item.codigo ===
                codigo
        ) ??
        VERSOES_BIBLICAS[0]
    );
}


function limparColchetesBibliaLivre(
    texto: string
) {
    return texto
        .replace(
            /\[([^\]]+)\]/g,
            "$1"
        )
        .trim();
}


function formatarReferencia(
    referencia: ReferenciaBiblica
) {

    const inicio =
        referencia.versiculoInicial;

    const fim =
        referencia.versiculoFinal ??
        inicio;


    if (inicio === null) {
        return (
            `${referencia.livro} ${referencia.capitulo}`
        );
    }


    return inicio === fim
        ? `${referencia.livro} ${referencia.capitulo}:${inicio}`
        : `${referencia.livro} ${referencia.capitulo}:${inicio}-${fim}`;
}


function criarTraducaoRemota(
    opcao: OpcaoTraducaoBiblia
): TraducaoBiblia {

    return {
        id:
            opcao.codigo,

        codigo:
            opcao.codigo,

        nome:
            opcao.nome,

        idioma:
            "pt-BR",

        provedor:
            "API_BIBLE",

        licenca:
            opcao.credito,

        fonte:
            opcao.fonte,

        atribuicao:
            opcao.credito,

        ativa:
            true,
    };
}


export class BibleService {

    static listarTraducoes() {
        return VERSOES_BIBLICAS;
    }


    static obterTraducaoPreferida() {

        if (
            typeof window ===
            "undefined"
        ) {
            return "BLIVRE";
        }


        const salva =
            window.localStorage
                .getItem(
                    CHAVE_PREFERENCIA
                );


        return VERSOES_BIBLICAS
            .some(
                (item) =>
                    item.codigo ===
                    salva
            )
            ? salva!
            : "BLIVRE";
    }


    static salvarTraducaoPreferida(
        codigo: string
    ) {

        if (
            typeof window ===
            "undefined"
        ) {
            return;
        }


        if (
            !VERSOES_BIBLICAS
                .some(
                    (item) =>
                        item.codigo ===
                        codigo
                )
        ) {
            return;
        }


        window.localStorage
            .setItem(
                CHAVE_PREFERENCIA,
                codigo
            );
    }


    static async buscarPassagem(
        referencia: ReferenciaBiblica,
        codigoTraducao =
            BibleService
                .obterTraducaoPreferida()
    ): Promise<PassagemBiblica> {

        if (
            referencia.versiculoInicial ===
            null
        ) {
            throw new Error(
                "A referência precisa informar o versículo."
            );
        }


        const opcao =
            obterOpcaoTraducao(
                codigoTraducao
            );


        if (opcao.local) {
            return await this
                .buscarPassagemLocal(
                    referencia,
                    opcao.codigo
                );
        }


        return await this
            .buscarPassagemRemota(
                referencia,
                opcao
            );
    }


    private static async buscarPassagemLocal(
        referencia: ReferenciaBiblica,
        codigoTraducao: string
    ): Promise<PassagemBiblica> {

        const traducao =
            await BibleRepository
                .buscarTraducaoAtiva(
                    codigoTraducao
                );


        if (!traducao) {
            throw new Error(
                "Esta tradução bíblica não está disponível."
            );
        }


        const versiculoInicial =
            referencia.versiculoInicial!;

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


        const versiculosExibicao =
            codigoTraducao ===
            "BLIVRE"
                ? versiculos.map(
                    (versiculo) => ({
                        ...versiculo,

                        texto:
                            limparColchetesBibliaLivre(
                                versiculo.texto
                            ),
                    })
                )
                : versiculos;


        return {
            referencia:
                formatarReferencia(
                    referencia
                ),

            traducao,

            livro:
                referencia.livro,

            livroAbreviado:
                referencia.livroAbreviado,

            capitulo:
                referencia.capitulo,

            versiculoInicial,
            versiculoFinal,
            versiculos:
                versiculosExibicao,
        };
    }


    private static async buscarPassagemRemota(
        referencia: ReferenciaBiblica,
        opcao: OpcaoTraducaoBiblia
    ): Promise<PassagemBiblica> {

        const livroCodigo =
            CODIGOS_LIVROS[
                referencia.livro
            ];


        if (!livroCodigo) {
            throw new Error(
                "Livro bíblico não suportado nesta tradução."
            );
        }


        const versiculoInicial =
            referencia.versiculoInicial!;

        const versiculoFinal =
            referencia.versiculoFinal ??
            versiculoInicial;


        const {
            data,
            error,
        } =
            await supabase
                .functions
                .invoke(
                    "bible-passage",
                    {
                        body: {
                            versao:
                                opcao.codigo,

                            livroCodigo,

                            capitulo:
                                referencia
                                    .capitulo,

                            versiculoInicio:
                                versiculoInicial,

                            versiculoFim:
                                versiculoFinal,
                        },
                    }
                );


        if (error) {
            throw error;
        }


        if (
            !data?.versos ||
            !Array.isArray(
                data.versos
            ) ||
            data.versos.length ===
            0
        ) {
            throw new Error(
                data?.error ??
                "Texto bíblico não encontrado para esta referência."
            );
        }


        const versiculos:
            VersiculoBiblia[] =
            data.versos.map(
                (
                    item: {
                        numero?: number;
                        versiculo?: number;
                        texto?: string;
                    },
                    indice: number
                ) => ({
                    id:
                        -(
                            indice +
                            1
                        ),

                    traducao_id:
                        opcao.codigo,

                    livro_numero:
                        0,

                    livro:
                        referencia.livro,

                    livro_abreviado:
                        referencia
                            .livroAbreviado,

                    capitulo:
                        referencia
                            .capitulo,

                    versiculo:
                        Number(
                            item.numero ??
                            item.versiculo
                        ),

                    texto:
                        String(
                            item.texto ??
                            ""
                        ),
                })
            );


        return {
            referencia:
                formatarReferencia(
                    referencia
                ),

            traducao:
                criarTraducaoRemota(
                    opcao
                ),

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
