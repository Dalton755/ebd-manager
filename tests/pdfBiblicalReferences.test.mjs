import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function carregarModulo(caminho, dependencias = {}) {
    const source = readFileSync(resolve(root, caminho), "utf8");
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2023,
        },
    });

    const module = { exports: {} };
    const requireLocal = (identificador) => {
        if (identificador in dependencias) return dependencias[identificador];
        throw new Error("Dependência não configurada: " + identificador);
    };
    new Function("exports", "require", "module", outputText)(
        module.exports, requireLocal, module
    );
    return module.exports;
}

const parser = carregarModulo("src/modules/lessons/utils/bibleReferenceParser.ts");
const hotspot = carregarModulo(
    "src/modules/lessons/utils/pdfBibleHotspots.ts",
    { "./bibleReferenceParser": parser },
);

test("referências padrão e com letras/números espaçados", () => {
    const casos = [
        ["Efésios 4:7–16", ["Efésios 4:7-16"]],
        ["E F É S I O S  4 : 7 – 1 6", ["Efésios 4:7-16"]],
        ["1  CO R Í N T I O S  1 2 : 4 – 1 1", ["1 Coríntios 12:4-11"]],
        ["R O M A N O S  1 2 : 6 – 8", ["Romanos 12:6-8"]],
        ["1  CO R Í N T I O S  1 2 : 7  ·  G Á L ATA S  5 : 2 2 – 2 3", [
            "1 Coríntios 12:7-7", "Gálatas 5:22-23",
        ]],
        ["1  CO R Í N T I O S  1 : 1 1  ·  1 4 : 2 6 – 3 3", [
            "1 Coríntios 1:11-11", "1 Coríntios 14:26-33",
        ]],
        ["1  P E D R O  4 : 1 0", ["1 Pedro 4:10-10"]],
        ["Ê XO D O  3 1 : 1 – 5", ["Êxodo 31:1-5"]],
        ["J U Í Z E S  1 4 : 6", ["Juízes 14:6-6"]],
        ["1 S A M U E L  1 6 : 1 3", ["1 Samuel 16:13-13"]],
        ["Atos 18", ["Atos 18"]],
        ["Romanos 12:6–8", ["Romanos 12:6-8"]],
    ];

    for (const [texto, esperado] of casos) {
        const refs = parser.extrairReferenciasBiblicas(texto);
        const resultado = refs.map((ref) =>
            ref.livro + " " + ref.capitulo +
            (ref.versiculoInicial === null
                ? ""
                : ":" + ref.versiculoInicial + "-" + ref.versiculoFinal)
        );

        assert.deepEqual(resultado, esperado, texto);
        for (const ref of refs) {
            assert.equal(texto.slice(ref.inicioTexto, ref.fimTexto), ref.original);
        }
    }
});

test("citações com vírgulas exibem somente os versículos indicados", () => {
    const ref = parser.extrairReferenciasBiblicas("1 CORÍNTIOS 14:5, 27–28")[0];
    assert.equal(ref.livro, "1 Coríntios");
    assert.equal(ref.versiculoInicial, 5);
    assert.equal(ref.versiculoFinal, 28);
    assert.deepEqual(ref.versiculosSelecionados, [5, 27, 28]);
});

test("capítulos inteiros e referências repetidas", () => {
    const [atos] = parser.extrairReferenciasBiblicas("Atos 18");
    assert.equal(atos.versiculoInicial, null);
    assert.equal(atos.versiculoFinal, null);

    const repetidas = parser.extrairReferenciasBiblicas("João 3:16 e João 3:16");
    assert.equal(repetidas.length, 2);
    assert.notEqual(repetidas[0].inicioTexto, repetidas[1].inicioTexto);
});

test("o hotspot funciona com livro e números em fragmentos separados", () => {
    const itens = [
        { str: "1  CO R Í N T I O S", width: 160, height: 12, transform: [12,0,0,12,20,120] },
        { str: "1 2 : 4 – 1 1", width: 124, height: 12, transform: [12,0,0,12,185,120] },
        { str: "R O M A N O S  1 2 : 6 – 8", width: 190, height: 12, transform: [12,0,0,12,20,175] },
    ];
    const encontrados = hotspot.extrairHotspotsReferenciasPdf(
        itens,
        { transform: [1,0,0,1,0,0], width: 1000, height: 650, scale: 1 },
        (_viewport, transform) => transform,
    );
    assert.deepEqual(encontrados.map((x) => x.referencia.livro), [
        "1 Coríntios", "Romanos",
    ]);
    assert.equal(encontrados.length, 2);
    assert.ok(encontrados.every((x) => x.width > 0 && x.height > 0));
    assert.ok(encontrados[0].width > 250);
});
