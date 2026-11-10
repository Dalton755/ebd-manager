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
            const limiteEspaco = Math.max(30, segmento.fontSize * 3);
            if (grupoAtual.length && segmento.left - margemDireita > limiteEspaco) {
                grupos.push(grupoAtual);
                grupoAtual = [];
            }
            grupoAtual.push(segmento);
            margemDireita = Math.max(margemDireita, segmento.left + segmento.width);
        }
        if (grupoAtual.length) grupos.push(grupoAtual);

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

    return hotspots;
}
