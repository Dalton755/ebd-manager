export type ReferenciaBiblica = {
    original: string;
    livro: string;
    livroAbreviado: string;
    capitulo: number;
    versiculoInicial: number | null;
    versiculoFinal: number | null;

    /*
     * Posição ocupada pela referência
     * dentro do texto analisado.
     */
    inicioTexto: number;
    fimTexto: number;
};


type LivroBiblico = {
    nome: string;
    abreviacao: string;
    aliases: string[];
};


const LIVROS: LivroBiblico[] = [
    { nome: "Gênesis", abreviacao: "Gn", aliases: ["gn", "gen", "gênesis", "genesis"] },
    { nome: "Êxodo", abreviacao: "Êx", aliases: ["ex", "êx", "exodo", "êxodo"] },
    { nome: "Levítico", abreviacao: "Lv", aliases: ["lv", "lev", "levítico", "levitico"] },
    { nome: "Números", abreviacao: "Nm", aliases: ["nm", "num", "números", "numeros"] },
    { nome: "Deuteronômio", abreviacao: "Dt", aliases: ["dt", "deut", "deuteronômio", "deuteronomio"] },
    { nome: "Josué", abreviacao: "Js", aliases: ["js", "josué", "josue"] },
    { nome: "Juízes", abreviacao: "Jz", aliases: ["jz", "juízes", "juizes"] },
    { nome: "Rute", abreviacao: "Rt", aliases: ["rt", "rute"] },

    { nome: "1 Samuel", abreviacao: "1Sm", aliases: ["1sm", "1 sm", "1sam", "1 sam", "1 samuel", "i sm", "i sam"] },
    { nome: "2 Samuel", abreviacao: "2Sm", aliases: ["2sm", "2 sm", "2sam", "2 sam", "2 samuel", "ii sm", "ii sam"] },
    { nome: "1 Reis", abreviacao: "1Rs", aliases: ["1rs", "1 rs", "1reis", "1 reis", "i rs"] },
    { nome: "2 Reis", abreviacao: "2Rs", aliases: ["2rs", "2 rs", "2reis", "2 reis", "ii rs"] },
    { nome: "1 Crônicas", abreviacao: "1Cr", aliases: ["1cr", "1 cr", "1cron", "1 cron", "1 crônicas", "1 cronicas", "i cr"] },
    { nome: "2 Crônicas", abreviacao: "2Cr", aliases: ["2cr", "2 cr", "2cron", "2 cron", "2 crônicas", "2 cronicas", "ii cr"] },

    { nome: "Esdras", abreviacao: "Ed", aliases: ["ed", "edr", "esdras"] },
    { nome: "Neemias", abreviacao: "Ne", aliases: ["ne", "nee", "neemias"] },
    { nome: "Ester", abreviacao: "Et", aliases: ["et", "est", "ester"] },
    { nome: "Jó", abreviacao: "Jó", aliases: ["jó", "jo", "job"] },
    { nome: "Salmos", abreviacao: "Sl", aliases: ["sl", "salmo", "salmos"] },
    { nome: "Provérbios", abreviacao: "Pv", aliases: ["pv", "prov", "provérbios", "proverbios"] },
    { nome: "Eclesiastes", abreviacao: "Ec", aliases: ["ec", "ecl", "eclesiastes"] },
    { nome: "Cantares", abreviacao: "Ct", aliases: ["ct", "cânticos", "canticos", "cantares"] },

    { nome: "Isaías", abreviacao: "Is", aliases: ["is", "isa", "isaías", "isaias"] },
    { nome: "Jeremias", abreviacao: "Jr", aliases: ["jr", "jer", "jeremias"] },
    { nome: "Lamentações", abreviacao: "Lm", aliases: ["lm", "lam", "lamentações", "lamentacoes"] },
    { nome: "Ezequiel", abreviacao: "Ez", aliases: ["ez", "eze", "ezequiel"] },
    { nome: "Daniel", abreviacao: "Dn", aliases: ["dn", "dan", "daniel"] },
    { nome: "Oseias", abreviacao: "Os", aliases: ["os", "oseias", "oséias"] },
    { nome: "Joel", abreviacao: "Jl", aliases: ["jl", "joel"] },
    { nome: "Amós", abreviacao: "Am", aliases: ["am", "amós", "amos"] },
    { nome: "Obadias", abreviacao: "Ob", aliases: ["ob", "obadias"] },
    { nome: "Jonas", abreviacao: "Jn", aliases: ["jn", "jonas"] },
    { nome: "Miqueias", abreviacao: "Mq", aliases: ["mq", "miq", "miqueias"] },
    { nome: "Naum", abreviacao: "Na", aliases: ["na", "naum"] },
    { nome: "Habacuque", abreviacao: "Hc", aliases: ["hc", "hab", "habacuque"] },
    { nome: "Sofonias", abreviacao: "Sf", aliases: ["sf", "sof", "sofonias"] },
    { nome: "Ageu", abreviacao: "Ag", aliases: ["ag", "ageu"] },
    { nome: "Zacarias", abreviacao: "Zc", aliases: ["zc", "zac", "zacarias"] },
    { nome: "Malaquias", abreviacao: "Ml", aliases: ["ml", "mal", "malaquias"] },

    { nome: "Mateus", abreviacao: "Mt", aliases: ["mt", "mat", "mateus"] },
    { nome: "Marcos", abreviacao: "Mc", aliases: ["mc", "mar", "marcos"] },
    { nome: "Lucas", abreviacao: "Lc", aliases: ["lc", "luc", "lucas"] },
    { nome: "João", abreviacao: "Jo", aliases: ["jo", "joão", "joao"] },
    { nome: "Atos", abreviacao: "At", aliases: ["at", "atos"] },
    { nome: "Romanos", abreviacao: "Rm", aliases: ["rm", "rom", "romanos"] },

    { nome: "1 Coríntios", abreviacao: "1Co", aliases: ["1co", "1 co", "1cor", "1 cor", "1 coríntios", "1 corintios", "i co", "i cor"] },
    { nome: "2 Coríntios", abreviacao: "2Co", aliases: ["2co", "2 co", "2cor", "2 cor", "2 coríntios", "2 corintios", "ii co", "ii cor"] },

    { nome: "Gálatas", abreviacao: "Gl", aliases: ["gl", "gal", "gálatas", "galatas"] },
    { nome: "Efésios", abreviacao: "Ef", aliases: ["ef", "efésios", "efesios"] },
    { nome: "Filipenses", abreviacao: "Fp", aliases: ["fp", "fil", "filipenses"] },
    { nome: "Colossenses", abreviacao: "Cl", aliases: ["cl", "col", "colossenses"] },

    { nome: "1 Tessalonicenses", abreviacao: "1Ts", aliases: ["1ts", "1 ts", "1 tess", "1 tessalonicenses", "i ts"] },
    { nome: "2 Tessalonicenses", abreviacao: "2Ts", aliases: ["2ts", "2 ts", "2 tess", "2 tessalonicenses", "ii ts"] },

    { nome: "1 Timóteo", abreviacao: "1Tm", aliases: ["1tm", "1 tm", "1 tim", "1 timóteo", "1 timoteo", "i tm"] },
    { nome: "2 Timóteo", abreviacao: "2Tm", aliases: ["2tm", "2 tm", "2 tim", "2 timóteo", "2 timoteo", "ii tm"] },
    { nome: "Tito", abreviacao: "Tt", aliases: ["tt", "tito"] },
    { nome: "Filemom", abreviacao: "Fm", aliases: ["fm", "filemom", "filemon"] },
    { nome: "Hebreus", abreviacao: "Hb", aliases: ["hb", "heb", "hebreus"] },
    { nome: "Tiago", abreviacao: "Tg", aliases: ["tg", "tiago"] },

    { nome: "1 Pedro", abreviacao: "1Pe", aliases: ["1pe", "1 pe", "1ped", "1 ped", "1 pedro", "i pe", "i ped"] },
    { nome: "2 Pedro", abreviacao: "2Pe", aliases: ["2pe", "2 pe", "2ped", "2 ped", "2 pedro", "ii pe", "ii ped"] },

    { nome: "1 João", abreviacao: "1Jo", aliases: ["1jo", "1 jo", "1joão", "1 joão", "1joao", "1 joao", "i jo"] },
    { nome: "2 João", abreviacao: "2Jo", aliases: ["2jo", "2 jo", "2joão", "2 joão", "2joao", "2 joao", "ii jo"] },
    { nome: "3 João", abreviacao: "3Jo", aliases: ["3jo", "3 jo", "3joão", "3 joão", "3joao", "3 joao", "iii jo"] },

    { nome: "Judas", abreviacao: "Jd", aliases: ["jd", "judas"] },
    { nome: "Apocalipse", abreviacao: "Ap", aliases: ["ap", "apo", "apocalipse"] },
];


function escaparRegex(
    valor: string
): string {
    return valor.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


const aliasesOrdenados =
    LIVROS.flatMap((livro) =>
        livro.aliases.map((alias) => ({
            alias,
            livro,
        }))
    ).sort(
        (a, b) =>
            b.alias.length -
            a.alias.length
    );


const mapaLivros =
    new Map<string, LivroBiblico>();

for (const item of aliasesOrdenados) {
    mapaLivros.set(
        item.alias.toLocaleLowerCase(
            "pt-BR"
        ),
        item.livro
    );
}


const PADRAO_LIVROS =
    aliasesOrdenados
        .map((item) =>
            escaparRegex(item.alias)
        )
        .join("|");


const REGEX_REFERENCIA =
    new RegExp(
        `(?:^|[\\s(])` +
        `(${PADRAO_LIVROS})` +
        `\\s*` +
        `(\\d{1,3})` +
        `(?:\\s*[.:]\\s*` +
        `(\\d{1,3})` +
        `(?:\\s*[-–—,]\\s*` +
        `(\\d{1,3}))?` +
        `)?`,
        "giu"
    );


function localizarLivro(
    valor: string
): LivroBiblico | null {
    const chave =
        valor
            .trim()
            .toLocaleLowerCase(
                "pt-BR"
            );

    return mapaLivros.get(chave) ??
        null;
}


export function extrairReferenciasBiblicas(
    texto: string
): ReferenciaBiblica[] {

    const referencias:
        ReferenciaBiblica[] = [];

    REGEX_REFERENCIA.lastIndex = 0;

    let resultado:
        RegExpExecArray | null;

    while (
        (
            resultado =
            REGEX_REFERENCIA.exec(
                texto
            )
        ) !== null
    ) {
        const livro =
            localizarLivro(
                resultado[1]
            );

        if (!livro) {
            continue;
        }

        const capitulo =
            Number(resultado[2]);

        const versiculoInicial =
            resultado[3]
                ? Number(resultado[3])
                : null;

        const versiculoFinal =
            resultado[4]
                ? Number(resultado[4])
                : versiculoInicial;

        const textoEncontrado =
            resultado[0];

        const espacosInicio =
            textoEncontrado.length -
            textoEncontrado.trimStart().length;

        const original =
            textoEncontrado.trim();

        const inicioTexto =
            resultado.index +
            espacosInicio;

        const fimTexto =
            inicioTexto +
            original.length;

        referencias.push({
            original,
            livro: livro.nome,
            livroAbreviado:
                livro.abreviacao,
            capitulo,
            versiculoInicial,
            versiculoFinal,
            inicioTexto,
            fimTexto,
        });

        /*
         * Referências que continuam usando
         * o mesmo livro:
         *
         * Is 11.2; 42.1
         *
         * significa:
         * Is 11.2
         * Is 42.1
         */
        const fimReferencia =
            REGEX_REFERENCIA.lastIndex;

        const restante =
            texto.slice(
                fimReferencia
            );

        const continuacao =
            restante.match(
                /^\s*;\s*(\d{1,3})\s*[.:]\s*(\d{1,3})(?:\s*[-–—,]\s*(\d{1,3}))?/
            );

        if (continuacao) {

            const capituloContinuacao =
                Number(
                    continuacao[1]
                );

            const inicioContinuacao =
                Number(
                    continuacao[2]
                );

            const fimContinuacao =
                continuacao[3]
                    ? Number(
                        continuacao[3]
                    )
                    : inicioContinuacao;

            const textoContinuacao =
                continuacao[0];

            const originalContinuacao =
                textoContinuacao
                    .replace(
                        /^\s*;\s*/,
                        ""
                    )
                    .trim();

            const indiceDentroContinuacao =
                textoContinuacao.indexOf(
                    originalContinuacao
                );

            const inicioTextoContinuacao =
                fimReferencia +
                indiceDentroContinuacao;

            const fimTextoContinuacao =
                inicioTextoContinuacao +
                originalContinuacao.length;

            referencias.push({
                original:
                    originalContinuacao,
                livro:
                    livro.nome,
                livroAbreviado:
                    livro.abreviacao,
                capitulo:
                    capituloContinuacao,
                versiculoInicial:
                    inicioContinuacao,
                versiculoFinal:
                    fimContinuacao,
                inicioTexto:
                    inicioTextoContinuacao,
                fimTexto:
                    fimTextoContinuacao,
            });
        }
    }

    return referencias;
}