import {
    PresentationRepository,
} from "@/modules/lessons/repositories/PresentationRepository";

import {
    LessonRepository,
} from "@/modules/lessons/repositories/LessonRepository";

import type {
    ApresentacaoAula,
} from "@/modules/lessons/types/ApresentacaoAula";


const TAMANHO_MAXIMO =
    50 * 1024 * 1024;


function validarPdf(
    arquivo: File
): void {

    if (!arquivo) {
        throw new Error(
            "Selecione um arquivo PDF."
        );
    }


    const extensao =
        arquivo.name
            .split(".")
            .pop()
            ?.toLowerCase();


    if (
        arquivo.type !== "application/pdf" ||
        extensao !== "pdf"
    ) {
        throw new Error(
            "A apresentação deve ser um arquivo PDF."
        );
    }


    if (arquivo.size <= 0) {
        throw new Error(
            "O arquivo PDF está vazio."
        );
    }


    if (
        arquivo.size >
        TAMANHO_MAXIMO
    ) {
        throw new Error(
            "O PDF deve ter no máximo 50 MB."
        );
    }
}


async function validarAulaDaIgreja(
    aulaId: string,
    igrejaId: string
): Promise<void> {

    const igrejaDaAula =
        await LessonRepository
            .buscarIgrejaIdDaAula(
                aulaId
            );


    if (
        !igrejaDaAula ||
        igrejaDaAula !== igrejaId
    ) {
        throw new Error(
            "Aula não encontrada nesta igreja."
        );
    }
}


export class PresentationService {

    static async buscar(
        aulaId: string
    ): Promise<ApresentacaoAula | null> {

        return PresentationRepository
            .buscarPorAula(
                aulaId
            );
    }


    static async importar(
        arquivo: File,
        aulaId: string,
        igrejaId: string,
        pessoaId: string | null
    ): Promise<ApresentacaoAula> {

        validarPdf(
            arquivo
        );


        await validarAulaDaIgreja(
            aulaId,
            igrejaId
        );


        /*
         * Guarda a apresentação atual.
         *
         * Se já existir, somente apagaremos
         * o arquivo antigo DEPOIS que o novo
         * arquivo estiver salvo e o banco
         * apontar para ele.
         */
        const apresentacaoAnterior =
            await PresentationRepository
                .buscarPorAula(
                    aulaId
                );


        /*
         * 1. Envia o novo PDF.
         */
        const novoArquivo =
            await PresentationRepository
                .enviarArquivo(
                    arquivo,
                    igrejaId,
                    aulaId
                );


        let apresentacaoSalva:
            ApresentacaoAula;


        try {

            /*
             * 2. Registra o novo arquivo
             * ou atualiza a apresentação
             * existente.
             */
            if (
                apresentacaoAnterior
            ) {

                apresentacaoSalva =
                    await PresentationRepository
                        .atualizar(
                            apresentacaoAnterior.id,
                            {
                                arquivo_path:
                                    novoArquivo.path,

                                arquivo_nome:
                                    novoArquivo.nome,

                                arquivo_tipo:
                                    novoArquivo.tipo,

                                enviado_por:
                                    pessoaId,
                            }
                        );

            } else {

                apresentacaoSalva =
                    await PresentationRepository
                        .salvar({
                            aula_id:
                                aulaId,

                            arquivo_path:
                                novoArquivo.path,

                            arquivo_nome:
                                novoArquivo.nome,

                            arquivo_tipo:
                                novoArquivo.tipo,

                            enviado_por:
                                pessoaId,
                        });
            }

            if (
    apresentacaoSalva.arquivo_path !==
    novoArquivo.path
) {
    throw new Error(
        "O novo PDF foi enviado, mas a apresentação não foi atualizada corretamente. Tente novamente."
    );
            }

        } catch (error) {

            /*
             * O upload funcionou, mas o banco
             * falhou.
             *
             * Remove o novo arquivo para não
             * deixar lixo no Storage.
             */
            try {

                await PresentationRepository
                    .removerArquivo(
                        novoArquivo.path
                    );

            } catch (
                erroLimpeza
            ) {

                console.error(
                    "[APRESENTAÇÃO] Não foi possível remover o PDF após falha no banco:",
                    erroLimpeza
                );
            }


            throw error;
        }


        /*
         * 3. Agora o banco já aponta para
         * o arquivo novo.
         *
         * Podemos remover o PDF anterior.
         */
        if (
            apresentacaoAnterior &&
            apresentacaoAnterior
                .arquivo_path !==
                novoArquivo.path
        ) {

            try {

                await PresentationRepository
                    .removerArquivo(
                        apresentacaoAnterior
                            .arquivo_path
                    );

            } catch (error) {

                /*
                 * Não desfazemos a importação.
                 *
                 * O novo PDF está íntegro e
                 * registrado. No pior caso,
                 * sobra um arquivo órfão no
                 * Storage para limpeza futura.
                 */
                console.error(
                    "[APRESENTAÇÃO] PDF substituído, mas não foi possível remover o arquivo anterior:",
                    error
                );
            }
        }


        return apresentacaoSalva;
    }


    static async gerarUrl(
        aulaId: string
    ): Promise<string> {

        const apresentacao =
            await PresentationRepository
                .buscarPorAula(
                    aulaId
                );


        if (!apresentacao) {
            throw new Error(
                "Esta aula não possui apresentação."
            );
        }


        const url =
    await PresentationRepository
        .gerarUrl(
            apresentacao.arquivo_path
        );

const separador =
    url.includes("?")
        ? "&"
        : "?";

return `${url}${separador}_v=${Date.now()}`;
    }
}
