const fs = require("fs");
const path = require("path");

const origem = path.resolve(
    "scripts/biblia/importar-blivre.sql"
);

const pastaDestino = path.resolve(
    "scripts/biblia/partes"
);

fs.mkdirSync(
    pastaDestino,
    { recursive: true }
);

for (const arquivo of fs.readdirSync(pastaDestino)) {
    if (arquivo.endsWith(".sql")) {
        fs.unlinkSync(
            path.join(
                pastaDestino,
                arquivo
            )
        );
    }
}

const sql =
    fs.readFileSync(
        origem,
        "utf8"
    );

const inicioPrimeiroInsert =
    sql.indexOf(
        "insert into ebd.biblia_versiculos"
    );

if (inicioPrimeiroInsert < 0) {
    throw new Error(
        "Primeiro INSERT de versículos não encontrado."
    );
}

const cabecalho =
    sql
        .slice(
            0,
            inicioPrimeiroInsert
        )
        .replace(
            /^\s*begin;\s*/i,
            ""
        )
        .trim();

const corpo =
    sql.slice(
        inicioPrimeiroInsert
    );

const blocos =
    corpo
        .split(
            /(?=insert into ebd\.biblia_versiculos)/
        )
        .map(
            bloco =>
                bloco
                    .replace(
                        /\s*commit;\s*$/i,
                        ""
                    )
                    .trim()
        )
        .filter(Boolean);

console.log(
    "Blocos encontrados:",
    blocos.length
);

if (blocos.length !== 63) {
    throw new Error(
        `Esperados 63 blocos; encontrados ${blocos.length}.`
    );
}

/*
 * Parte 000:
 * cadastra/atualiza somente a tradução.
 */
fs.writeFileSync(
    path.join(
        pastaDestino,
        "000-traducao.sql"
    ),
    cabecalho + "\n",
    "utf8"
);

/*
 * Uma parte para cada bloco de
 * aproximadamente 500 versículos.
 */
blocos.forEach(
    (bloco, indice) => {

        const numero =
            String(
                indice + 1
            ).padStart(
                3,
                "0"
            );

        fs.writeFileSync(
            path.join(
                pastaDestino,
                `${numero}-versiculos.sql`
            ),
            bloco + "\n",
            "utf8"
        );
    }
);

console.log(
    "Arquivos gerados:",
    blocos.length + 1
);
