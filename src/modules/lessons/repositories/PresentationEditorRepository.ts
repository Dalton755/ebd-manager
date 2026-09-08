import { supabase } from "@/shared/lib/supabase/client";

import type {
    ElementoApresentacao,
    RascunhoApresentacao,
    VersaoApresentacao,
} from "@/modules/lessons/types/EditorApresentacao";


export class PresentationEditorRepository {

    static async buscarRascunho(
        apresentacaoId: string
    ): Promise<RascunhoApresentacao | null> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("apresentacoes_rascunhos")
                .select("*")
                .eq(
                    "apresentacao_id",
                    apresentacaoId
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data as
            RascunhoApresentacao | null;
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


        const { data, error } =
            await supabase
                .schema("ebd")
                .from("apresentacoes_rascunhos")
                .upsert(
                    {
                        apresentacao_id:
                            apresentacaoId,

                        elementos,

                        editado_por:
                            pessoaId,

                        updated_at:
                            new Date()
                                .toISOString(),
                    },
                    {
                        onConflict:
                            "apresentacao_id",
                    }
                )
                .select("*")
                .single();


        if (error) {
            throw error;
        }


        return data as RascunhoApresentacao;
    }


    static async buscarVersaoPublicada(
        apresentacaoId: string,
        versaoPublicadaId: string
    ): Promise<VersaoApresentacao | null> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("apresentacoes_versoes")
                .select("*")
                .eq(
                    "apresentacao_id",
                    apresentacaoId
                )
                .eq(
                    "id",
                    versaoPublicadaId
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data as
            VersaoApresentacao | null;
    }

    static async publicar(
        apresentacaoId: string
    ): Promise<string> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .rpc(
                    "publicar_apresentacao",
                    {
                        p_apresentacao_id:
                            apresentacaoId,
                    }
                );


        if (error) {
            throw error;
        }


        if (!data) {
            throw new Error(
                "Não foi possível identificar a versão publicada."
            );
        }


        return data as string;
    }
}