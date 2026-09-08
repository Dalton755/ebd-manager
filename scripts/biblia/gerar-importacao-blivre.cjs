const fs = require("fs");
const path = require("path");

const origem = path.resolve(
    "scripts/biblia/porbr2018_vpl/porbr2018_vpl.txt"
);

const destino = path.resolve(
    "scripts/biblia/importar-blivre.sql"
);

const LIVROS = [
    ["GEN", 1, "Gênesis", "Gn"],
    ["EXO", 2, "Êxodo", "Êx"],
    ["LEV", 3, "Levítico", "Lv"],
    ["NUM", 4, "Números", "Nm"],
    ["DEU", 5, "Deuteronômio", "Dt"],
    ["JOS", 6, "Josué", "Js"],
    ["JDG", 7, "Juízes", "Jz"],
    ["RUT", 8, "Rute", "Rt"],
    ["1SA", 9, "1 Samuel", "1Sm"],
    ["2SA", 10, "2 Samuel", "2Sm"],
    ["1KI", 11, "1 Reis", "1Rs"],
    ["2KI", 12, "2 Reis", "2Rs"],
    ["1CH", 13, "1 Crônicas", "1Cr"],
    ["2CH", 14, "2 Crônicas", "2Cr"],
    ["EZR", 15, "Esdras", "Ed"],
    ["NEH", 16, "Neemias", "Ne"],
    ["EST", 17, "Ester", "Et"],
    ["JOB", 18, "Jó", "Jó"],
    ["PSA", 19, "Salmos", "Sl"],
    ["PRO", 20, "Provérbios", "Pv"],
    ["ECC", 21, "Eclesiastes", "Ec"],
    ["SOL", 22, "Cânticos", "Ct"],
    ["ISA", 23, "Isaías", "Is"],
    ["JER", 24, "Jeremias", "Jr"],
    ["LAM", 25, "Lamentações", "Lm"],
    ["EZE", 26, "Ezequiel", "Ez"],
    ["DAN", 27, "Daniel", "Dn"],
    ["HOS", 28, "Oséias", "Os"],
    ["JOE", 29, "Joel", "Jl"],
    ["AMO", 30, "Amós", "Am"],
    ["OBA", 31, "Obadias", "Ob"],
    ["JON", 32, "Jonas", "Jn"],
    ["MIC", 33, "Miquéias", "Mq"],
    ["NAH", 34, "Naum", "Na"],
    ["HAB", 35, "Habacuque", "Hc"],
    ["ZEP", 36, "Sofonias", "Sf"],
    ["HAG", 37, "Ageu", "Ag"],
    ["ZEC", 38, "Zacarias", "Zc"],
    ["MAL", 39, "Malaquias", "Ml"],

    ["MAT", 40, "Mateus", "Mt"],
    ["MAR", 41, "Marcos", "Mc"],
    ["LUK", 42, "Lucas", "Lc"],
    ["JOH", 43, "João", "Jo"],
    ["ACT", 44, "Atos", "At"],
    ["ROM", 45, "Romanos", "Rm"],
    ["1CO", 46, "1 Coríntios", "1Co"],
    ["2CO", 47, "2 Coríntios", "2Co"],
    ["GAL", 48, "Gálatas", "Gl"],
    ["EPH", 49, "Efésios", "Ef"],
    ["PHI", 50, "Filipenses", "Fp"],
    ["COL", 51, "Colossenses", "Cl"],
    ["1TH", 52, "1 Tessalonicenses", "1Ts"],
    ["2TH", 53, "2 Tessalonicenses", "2Ts"],
    ["1TI", 54, "1 Timóteo", "1Tm"],
    ["2TI", 55, "2 Timóteo", "2Tm"],
    ["TIT", 56, "Tito", "Tt"],
    ["PHM", 57, "Filemom", "Fm"],
    ["HEB", 58, "Hebreus", "Hb"],
    ["JAM", 59, "Tiago", "Tg"],
    ["1PE", 60, "1 Pedro", "1Pe"],
    ["2PE", 61, "2 Pedro", "2Pe"],
    ["1JO", 62, "1 João", "1Jo"],
    ["2JO", 63, "2 João", "2Jo"],
    ["3JO", 64, "3 João", "3Jo"],
    ["JUD", 65, "Judas", "Jd"],
    ["REV", 66, "Apocalipse", "Ap"],
];

const mapa = new Map(
    LIVROS.map(
        ([codigo, numero, nome, abreviacao]) => [
            codigo,
            { numero, nome, abreviacao },
        ]
    )
);

function sqlTexto(valor) {
    return "'" + valor.replace(/'/g, "''") + "'";
}

const conteudo =
    fs.readFileSync(origem, "utf8");

const linhas =
    conteudo.split(/\r?\n/);

const versiculos = [];

for (const linha of linhas) {
    if (!linha.trim()) {
        continue;
    }

    const resultado =
        linha.match(
            /^([A-Z0-9]+)\s+(\d+):(\d+)\s+(.*)$/
        );

    if (!resultado) {
        throw new Error(
            `Linha não reconhecida: ${linha}`
        );
    }

    const [, codigo, capitulo, versiculo, texto] =
        resultado;

    const livro = mapa.get(codigo);

    if (!livro) {
        throw new Error(
            `Livro desconhecido: ${codigo}`
        );
    }

    versiculos.push({
        ...livro,
        capitulo: Number(capitulo),
        versiculo: Number(versiculo),
        texto,
    });
}

if (versiculos.length !== 31102) {
    throw new Error(
        `Esperados 31102 versículos; encontrados ${versiculos.length}.`
    );
}

const blocos = [];
const TAMANHO_BLOCO = 500;

for (
    let inicio = 0;
    inicio < versiculos.length;
    inicio += TAMANHO_BLOCO
) {
    const bloco =
        versiculos.slice(
            inicio,
            inicio + TAMANHO_BLOCO
        );

    const valores =
        bloco.map((v) =>
            [
                "(select id from ebd.biblia_traducoes where codigo = 'BLIVRE')",
                v.numero,
                sqlTexto(v.nome),
                sqlTexto(v.abreviacao),
                v.capitulo,
                v.versiculo,
                sqlTexto(v.texto),
            ].join(", ")
        );

    blocos.push(
        `insert into ebd.biblia_versiculos (` +
        `traducao_id, livro_numero, livro, livro_abreviado, capitulo, versiculo, texto` +
        `)\nvalues\n` +
        valores.map(v => `(${v})`).join(",\n") +
        `\non conflict (traducao_id, livro_numero, capitulo, versiculo)\n` +
        `do update set\n` +
        `    livro = excluded.livro,\n` +
        `    livro_abreviado = excluded.livro_abreviado,\n` +
        `    texto = excluded.texto;\n`
    );
}

const cabecalho = `
begin;

insert into ebd.biblia_traducoes (
    codigo,
    nome,
    idioma,
    provedor,
    licenca,
    fonte,
    atribuicao,
    ativa
)
values (
    'BLIVRE',
    'Bíblia Livre',
    'pt-BR',
    'LOCAL',
    'CC BY 4.0',
    'eBible.org / porbr2018',
    'Bíblia Livre (BLIVRE), disponibilizada sob licença CC BY 4.0.',
    true
)
on conflict (codigo)
do update set
    nome = excluded.nome,
    idioma = excluded.idioma,
    provedor = excluded.provedor,
    licenca = excluded.licenca,
    fonte = excluded.fonte,
    atribuicao = excluded.atribuicao,
    ativa = excluded.ativa;

`;

const rodape = `
commit;
`;

fs.writeFileSync(
    destino,
    cabecalho +
    blocos.join("\n\n") +
    rodape,
    "utf8"
);

console.log(
    `SQL gerado: ${destino}`
);
console.log(
    `Versículos: ${versiculos.length}`
);
console.log(
    `Blocos: ${blocos.length}`
);
