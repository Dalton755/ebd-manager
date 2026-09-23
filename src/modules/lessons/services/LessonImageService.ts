import {
    supabase,
} from "@/shared/lib/supabase/client";

import {
    LessonRepository,
} from "../repositories/LessonRepository";

import type {
    Aula,
} from "../types/Aula";


const BUCKET =
    "imagens-aulas";

const MAX_BYTES =
    10 * 1024 * 1024;

const MIME_PERMITIDOS =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
    ]);

const urlCache =
    new Map<
        string,
        {
            url: string;
            expiraEm: number;
        }
    >();


function extensaoArquivo(
    arquivo: File
) {

    if (
        arquivo.type ===
        "image/png"
    ) {
        return "png";
    }

    if (
        arquivo.type ===
        "image/webp"
    ) {
        return "webp";
    }

    return "jpg";
}


function nomeSeguro(
    nome: string
) {

    return nome
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9._-]+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        )
        .slice(
            0,
            120
        ) ||
        "imagem-aula";
}


export type AjusteImagemAula = {
    posicaoX: number;
    posicaoY: number;
    zoom: number;
};


export class LessonImageService {

    static validarArquivo(
        arquivo: File
    ) {

        const extensao =
            arquivo.name
                .split(".")
                .pop()
                ?.toLowerCase();

        const extensaoPermitida =
            extensao === "jpg" ||
            extensao === "jpeg" ||
            extensao === "png" ||
            extensao === "webp";

        if (
            !MIME_PERMITIDOS.has(
                arquivo.type
            ) &&
            !extensaoPermitida
        ) {
            throw new Error(
                "Use uma imagem JPG, PNG ou WEBP."
            );
        }

        if (
            arquivo.size >
            MAX_BYTES
        ) {
            throw new Error(
                "A imagem pode ter no máximo 10 MB."
            );
        }
    }


    static async gerarUrl(
        caminho:
            string | null | undefined
    ) {

        if (!caminho) {
            return null;
        }


        const cache =
            urlCache.get(
                caminho
            );

        if (
            cache &&
            cache.expiraEm >
                Date.now()
        ) {
            return cache.url;
        }


        const {
            data,
            error,
        } =
            await supabase.storage
                .from(
                    BUCKET
                )
                .createSignedUrl(
                    caminho,
                    60 * 60
                );


        if (error) {
            throw error;
        }


        urlCache.set(
            caminho,
            {
                url:
                    data.signedUrl,

                expiraEm:
                    Date.now() +
                    50 *
                        60 *
                        1000,
            }
        );


        return data.signedUrl;
    }


    static async salvarImagem(
        params: {
            aula: Aula;
            igrejaId: string;
            arquivo: File;
            ajuste: AjusteImagemAula;
        }
    ) {

        const {
            aula,
            igrejaId,
            arquivo,
            ajuste,
        } =
            params;


        this.validarArquivo(
            arquivo
        );


        const extensao =
            extensaoArquivo(
                arquivo
            );

        const caminho =
            `${igrejaId}/${aula.id}/${crypto.randomUUID()}.${extensao}`;


        const {
            error:
                uploadError,
        } =
            await supabase.storage
                .from(
                    BUCKET
                )
                .upload(
                    caminho,
                    arquivo,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            arquivo.type ||
                            (
                                extensao ===
                                    "png"
                                    ? "image/png"
                                    : extensao ===
                                        "webp"
                                        ? "image/webp"
                                        : "image/jpeg"
                            ),
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        try {

            const atualizada =
                await LessonRepository
                    .atualizarAula(
                        aula.id,
                        {
                            imagem_path:
                                caminho,

                            imagem_nome:
                                nomeSeguro(
                                    arquivo.name
                                ),

                            imagem_posicao_x:
                                Math.round(
                                    ajuste.posicaoX
                                ),

                            imagem_posicao_y:
                                Math.round(
                                    ajuste.posicaoY
                                ),

                            imagem_zoom:
                                Number(
                                    ajuste.zoom
                                        .toFixed(
                                            2
                                        )
                                ),
                        }
                    );


            if (
                aula.imagem_path &&
                aula.imagem_path !==
                    caminho
            ) {

                const {
                    error:
                        removeError,
                } =
                    await supabase.storage
                        .from(
                            BUCKET
                        )
                        .remove([
                            aula.imagem_path,
                        ]);


                if (removeError) {
                    console.warn(
                        "[IMAGEM AULA] Arquivo antigo não removido:",
                        removeError
                    );
                }


                urlCache.delete(
                    aula.imagem_path
                );
            }


            return atualizada;


        } catch (error) {

            await supabase.storage
                .from(
                    BUCKET
                )
                .remove([
                    caminho,
                ]);

            throw error;
        }
    }


    static async atualizarAjuste(
        aulaId: string,
        ajuste:
            AjusteImagemAula
    ) {

        return LessonRepository
            .atualizarAula(
                aulaId,
                {
                    imagem_posicao_x:
                        Math.round(
                            ajuste.posicaoX
                        ),

                    imagem_posicao_y:
                        Math.round(
                            ajuste.posicaoY
                        ),

                    imagem_zoom:
                        Number(
                            ajuste.zoom
                                .toFixed(
                                    2
                                )
                        ),
                }
            );
    }


    static async removerImagem(
        aula: Aula
    ) {

        const caminho =
            aula.imagem_path;


        const atualizada =
            await LessonRepository
                .atualizarAula(
                    aula.id,
                    {
                        imagem_path:
                            null,

                        imagem_nome:
                            null,

                        imagem_posicao_x:
                            50,

                        imagem_posicao_y:
                            50,

                        imagem_zoom:
                            1,
                    }
                );


        if (caminho) {

            const {
                error,
            } =
                await supabase.storage
                    .from(
                        BUCKET
                    )
                    .remove([
                        caminho,
                    ]);


            if (error) {
                console.warn(
                    "[IMAGEM AULA] Imagem removida do cadastro, mas o arquivo não pôde ser excluído:",
                    error
                );
            }


            urlCache.delete(
                caminho
            );
        }


        return atualizada;
    }


    static async baixarImagem(
        aula: Pick<
            Aula,
            | "numero"
            | "titulo"
            | "imagem_path"
            | "imagem_nome"
        >
    ) {

        if (
            !aula.imagem_path
        ) {
            throw new Error(
                "Esta aula não possui imagem."
            );
        }


        const {
            data,
            error,
        } =
            await supabase.storage
                .from(
                    BUCKET
                )
                .download(
                    aula.imagem_path
                );


        if (error) {
            throw error;
        }


        const url =
            URL.createObjectURL(
                data
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            aula.imagem_nome ||
            `aula-${aula.numero}-${nomeSeguro(
                aula.titulo
            )}.jpg`;

        document.body
            .appendChild(
                link
            );

        link.click();

        link.remove();


        window.setTimeout(
            () =>
                URL.revokeObjectURL(
                    url
                ),
            1000
        );
    }
}
