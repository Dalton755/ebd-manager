import {
    PresentationEditorRepository,
} from "../repositories/PresentationEditorRepository";

import type {
    ElementoApresentacao,
    RascunhoApresentacao,
    VersaoApresentacao,
} from "../types/EditorApresentacao";


export class PresentationEditorService {

    static async buscarRascunho(
        apresentacaoId: string
    ): Promise<RascunhoApresentacao | null> {

        return PresentationEditorRepository
            .buscarRascunho(
                apresentacaoId
            );
    }


    static async salvarRascunho(params: {
        apresentacaoId: string;
        elementos: ElementoApresentacao[];
        pessoaId: string;
    }): Promise<RascunhoApresentacao> {

        const {
            apresentacaoId,
            elementos,
            pessoaId,
        } = params;


        for (const elemento of elementos) {

            if (
                elemento.pagina < 1 ||
                elemento.x < 0 ||
                elemento.y < 0 ||
                elemento.largura <= 0 ||
                elemento.altura <= 0 ||
                elemento.x +
                elemento.largura > 1 ||
                elemento.y +
                elemento.altura > 1
            ) {
                throw new Error(
                    "Existe um elemento fora dos limites da apresentação."
                );
            }
        }


        return PresentationEditorRepository
            .salvarRascunho({
                apresentacaoId,
                elementos,
                pessoaId,
            });
    }


    static async buscarVersaoPublicada(params: {
        apresentacaoId: string;
        versaoPublicadaId:
        string | null | undefined;
    }): Promise<VersaoApresentacao | null> {

        if (!params.versaoPublicadaId) {
            return null;
        }


        return PresentationEditorRepository
            .buscarVersaoPublicada(
                params.apresentacaoId,
                params.versaoPublicadaId
            );
    }

    static async publicar(
        apresentacaoId: string
    ): Promise<string> {

        if (!apresentacaoId) {
            throw new Error(
                "Apresentação não identificada."
            );
        }


        return PresentationEditorRepository
            .publicar(
                apresentacaoId
            );
    }
}