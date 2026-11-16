import {
    extrairReferenciasBiblicas,
} from "./bibleReferenceParser";

import type {
    ReferenciaBiblica,
} from "./bibleReferenceParser";

/**
 * Lista as referências citadas no slide, independentemente das áreas
 * geométricas clicáveis. Mantém um caminho alternativo quando o PDF
 * divide livro, capítulo e versículos em itens de texto diferentes.
 */
export function listarReferenciasBiblicasDoTextoPdf(
    fragmentos: readonly string[]
): ReferenciaBiblica[] {
    const texto = fragmentos
        .filter((fragmento) => fragmento.trim().length > 0)
        .join(" ");

    const referencias = extrairReferenciasBiblicas(texto);
    const vistas = new Set<string>();

    return referencias.filter((ref) => {
        const chave = [
            ref.livroAbreviado,
            ref.capitulo,
            ref.versiculoInicial ?? "",
            ref.versiculoFinal ?? "",
            ref.versiculosSelecionados?.join(",") ?? "",
        ].join("|");

        if (vistas.has(chave)) return false;
        vistas.add(chave);
        return true;
    });
}

export function rotuloReferenciaBiblica(
    ref: ReferenciaBiblica
): string {
    const capitulo = ref.livro + " " + ref.capitulo;
    if (ref.versiculoInicial === null) return capitulo;

    if (ref.versiculosSelecionados?.length) {
        return capitulo + ":" + ref.versiculosSelecionados.join(",");
    }

    const inicio = ref.versiculoInicial;
    const fim = ref.versiculoFinal;
    return capitulo + ":" + inicio +
        (fim !== null && fim !== inicio ? "-" + fim : "");
}
