import {
    extrairReferenciasBiblicas,
} from "./bibleReferenceParser";
import type {
    ReferenciaBiblica,
} from "./bibleReferenceParser";

export type ItemTextoReferenciaPdf = {
    str: string;
    width: number;
    height: number;
    transform: number[];
};

type SegmentoPdf = {
    texto: string;
    left: number;
    baseline: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
};

export type HotspotReferenciaPdf = {
    referencia: ReferenciaBiblica;
    left: number;
    top: number;
    width: number;
    height: number;
};

export function extrairHotspotsReferenciasPdf(
    itens: ItemTextoReferenciaPdf[],
    viewport: {
        transform: number[];
        scale: number;
        width: number;
        height: number;
    },
    transformar: (viewport: number[], texto: number[]) => number[]
): HotspotReferenciaPdf[] {
    const linhas: Array<{
        baseline: number;
        fontSize: number;
        segmentos: SegmentoPdf[];
    }> = [];

    for (const item of itens) {
        if (!item.str.trim()) continue;

        const matriz = transformar(viewport.transform, item.transform);
        const fontSize = Math.max(6, Math.hypot(matriz[2], matriz[3]));
        const segmento: SegmentoPdf = {
            texto: item.str,
            left: matriz[4],
            baseline: matriz[5],
            top: matriz[5] - fontSize,
            width: Math.max(item.width * viewport.scale, 2),
            height: Math.max(fontSize, item.height * viewport.scale, 8),
            fontSize,
        };

        const linha = linhas.find((existente) =>
            Math.abs(existente.baseline - segmento.baseline) <=
            Math.max(3, Math.min(existente.fontSize, segmento.fontSize) * 0.45)
        );

        if (linha) linha.segmentos.push(segmento);
        else linhas.push({
            baseline: segmento.baseline,
            fontSize,
            segmentos: [segmento],
        });
    }

    const hotspots: HotspotReferenciaPdf[] = [];

    for (const linha of linhas) {
        const ordenados = linha.segmentos.sort((a, b) => a.left - b.left);
        const grupos: SegmentoPdf[][] = [];
        let grupoAtual: SegmentoPdf[] = [];
        let margemDireita = -Infinity;

        for (const segmento of ordenados) {
            // Não associa livros e números de colunas distantes.
            // PDFs exportados de slides podem ter grande espaço entre
            // o nome do livro e o capítulo, mesmo estando na mesma linha.
            const limiteEspaco = Math.max(72, segmento.fontSize * 7);
            if (grupoAtual.length && segmento.left - margemDireita > limiteEspaco) {
                grupos.push(grupoAtual);
                grupoAtual = [];
            }
            grupoAtual.push(segmento);
            margemDireita = Math.max(margemDireita, segmento.left + segmento.width);
        }
        if (grupoAtual.length) grupos.push(grupoAtual);

        // Conectar também referências cujo livro e números foram separados
        // em grupos distantes na mesma linha (sem juntar colunas inteiras).
        for (let indice = 0; indice < grupos.length - 1; indice += 1) {
            const primeiro = grupos[indice];
            const proximo = grupos[indice + 1];
            const lacuna = proximo[0].left -
                Math.max(...primeiro.map((s) => s.left + s.width));
            const proximoTexto = proximo.map((s) => s.texto).join(" ").trim();

            if (
                lacuna >= 0 &&
                lacuna <= Math.max(180, linha.fontSize * 12) &&
                /^\\d{1,3}\\s*[:.]\\s*\\d{1,3}/u.test(proximoTexto)
            ) {
                const textoCombinado = primeiro.map((s) => s.texto).join(" ") +
                    " " + proximoTexto;
                const referenciasCombinadas =
                    extrairReferenciasBiblicas(textoCombinado);

                if (referenciasCombinadas.length > 0) {
                    grupos.splice(indice, 2, [...primeiro, ...proximo]);
                    indice -= 1;
                }
            }
        }

        for (const grupo of grupos) {
            let texto = "";
            const posicoes = grupo.map((segmento) => {
                if (texto) texto += " ";
                const inicio = texto.length;
                texto += segmento.texto;
                return { ...segmento, inicio, fim: texto.length };
            });

            for (const referencia of extrairReferenciasBiblicas(texto)) {
                let left = Infinity;
                let right = -Infinity;
                let top = Infinity;
                let bottom = -Infinity;

                for (const segmento of posicoes) {
                    const inicio = Math.max(referencia.inicioTexto, segmento.inicio);
                    const fim = Math.min(referencia.fimTexto, segmento.fim);
                    if (fim <= inicio) continue;

                    const tamanho = Math.max(segmento.texto.length, 1);
                    const x0 = segmento.left +
                        segmento.width * ((inicio - segmento.inicio) / tamanho);
                    const x1 = segmento.left +
                        segmento.width * ((fim - segmento.inicio) / tamanho);

                    left = Math.min(left, x0);
                    right = Math.max(right, x1);
                    top = Math.min(top, segmento.top);
                    bottom = Math.max(bottom, segmento.top + segmento.height);
                }

                if (!Number.isFinite(left) || right <= left) continue;

                hotspots.push({
                    referencia,
                    left: Math.max(0, left - 2),
                    top: Math.max(0, top - 2),
                    width: Math.max(right - left + 4, 18),
                    height: Math.max(bottom - top + 4, 16),
                });
            }
        }
    }

    // Alguns PDFs quebram a referência entre duas linhas:
    // "1 CORÍNTIOS" na primeira e "12:12-27" logo abaixo.
    // Produz duas áreas clicáveis ligadas à mesma passagem bíblica.
    const ordenadas = [...linhas].sort((a, b) => a.baseline - b.baseline);
    const referenciaJaExistente = (
        referencia: ReferenciaBiblica,
        x: number,
        y: number
    ) => hotspots.some((atual) =>
        atual.referencia.livro === referencia.livro &&
        atual.referencia.capitulo === referencia.capitulo &&
        atual.referencia.versiculoInicial === referencia.versiculoInicial &&
        atual.referencia.versiculoFinal === referencia.versiculoFinal &&
        Math.abs(atual.top - y) < 10 &&
        Math.abs(atual.left - x) < 12
    );

    for (let i = 0; i < ordenadas.length - 1; i += 1) {
        const primeira = ordenadas[i];
        const segunda = ordenadas[i + 1];
        const distancia = segunda.baseline - primeira.baseline;

        if (
            distancia <= 0 ||
            distancia > Math.max(43, primeira.fontSize * 2.2)
        ) continue;

        const partesA = [...primeira.segmentos].sort((a, b) => a.left - b.left);
        const partesB = [...segunda.segmentos].sort((a, b) => a.left - b.left);

        // Evita captar qualquer número de outra seção do slide.
        const candidatosB = partesB.filter((item) =>
            /^\\s*\\d(?:\\s*\\d){0,2}\\s*[:.]\\s*\\d/u.test(item.texto)
        );

        for (const fim of candidatosB) {
            const antes = partesA.filter((item) => {
                const separacaoX = Math.abs(item.left - fim.left);
                return separacaoX < Math.max(190, primeira.fontSize * 15);
            });
            if (antes.length === 0) continue;

            // O nome do livro também pode estar dividido em 2–3 fragmentos.
            // Limitamos o texto analisado para não associar parágrafos inteiros.
            const primeiro = antes[0];
            const livroCandidato = antes.map((item) => item.texto).join(" ").trim();
            const numeroCandidato = fim.texto.trim();
            if (livroCandidato.length > 80) continue;

            const refs = extrairReferenciasBiblicas(
                livroCandidato + " " + numeroCandidato
            );
            for (const referencia of refs) {
                if (
                    referencia.versiculoInicial === null ||
                    referencia.inicioTexto >= livroCandidato.length ||
                    referencia.fimTexto <= livroCandidato.length + 1
                ) continue;

                if (!referenciaJaExistente(referencia, primeiro.left, primeiro.top)) {
                    hotspots.push({
                        referencia,
                        left: Math.max(0, primeiro.left - 2),
                        top: Math.max(0, Math.min(...antes.map((item) => item.top)) - 2),
                        width: Math.max(
                            Math.max(...antes.map((item) => item.left + item.width)) -
                                primeiro.left + 4,
                            18
                        ),
                        height: Math.max(
                            ...antes.map((item) => item.height + 4),
                            16
                        ),
                    });
                }
                if (!referenciaJaExistente(referencia, fim.left, fim.top)) {
                    hotspots.push({
                        referencia,
                        left: Math.max(0, fim.left - 2),
                        top: Math.max(0, fim.top - 2),
                        width: Math.max(fim.width + 4, 18),
                        height: Math.max(fim.height + 4, 16),
                    });
                }
            }
        }
    }

    return hotspots;
}
