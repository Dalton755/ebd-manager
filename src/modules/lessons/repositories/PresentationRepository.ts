import { supabase } from "@/shared/lib/supabase/client";

import type {
    ApresentacaoAula,
} from "@/modules/lessons/types/ApresentacaoAula";


const BUCKET =
    "apresentacoes-aulas";


export class PresentationRepository {

    static async buscarPorAula(
        aulaId: string
    ): Promise<ApresentacaoAula | null> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("apresentacoes_aula")
                .select("*")
                .eq("aula_id", aulaId)
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data;
    }


    static async enviarArquivo(
        arquivo: File,
        igrejaId: string,
        aulaId: string
    ) {

        const caminho =
            `${igrejaId}/${aulaId}/${crypto.randomUUID()}.pdf`;


        const { error } =
            await supabase.storage
                .from(BUCKET)
                .upload(
                    caminho,
                    arquivo,
                    {
    cacheControl: "0",
    upsert: false,
    contentType:
        "application/pdf",
                    }
                );


        if (error) {
            throw error;
        }


        return {
            path: caminho,
            nome: arquivo.name,
            tipo: "application/pdf",
        };
    }


    static async enviarImagemEditor(
        arquivo: File,
        igrejaId: string,
        aulaId: string
    ) {

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!tiposPermitidos.includes(arquivo.type)) {
            throw new Error(
                "Use uma imagem JPG, PNG ou WebP."
            );
        }


        const extensao =
            arquivo.type === "image/png"
                ? "png"
                : arquivo.type === "image/webp"
                    ? "webp"
                    : "jpg";


        const caminho =
            `${igrejaId}/${aulaId}/editor/${crypto.randomUUID()}.${extensao}`;


        const { error } =
            await supabase.storage
                .from(BUCKET)
                .upload(
                    caminho,
                    arquivo,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: arquivo.type,
                    }
                );


        if (error) {
            throw error;
        }


        return {
            path: caminho,
            nome: arquivo.name,
            tipo: arquivo.type,
        };
    }


    static async gerarUrlImagemEditor(
        caminho: string
    ): Promise<string> {

        return this.gerarUrl(
            caminho
        );
    }


    static async salvar(
        dados: {
            aula_id: string;
            arquivo_path: string;
            arquivo_nome: string;
            arquivo_tipo: string;
            enviado_por: string | null;
        }
    ): Promise<ApresentacaoAula> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("apresentacoes_aula")
                .insert(dados)
                .select("*")
                .single();


        if (error) {
            throw error;
        }


        return data;
    }


    static async atualizar(
        id: string,
        dados: {
            arquivo_path: string;
            arquivo_nome: string;
            arquivo_tipo: string;
            enviado_por: string | null;
        }
    ): Promise<ApresentacaoAula> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("apresentacoes_aula")
                .update({
                    ...dados,
                    total_paginas: null,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("id", id)
                .select("*")
                .single();


        if (error) {
            throw error;
        }


        return data;
    }


    static async removerArquivo(
        caminho: string
    ): Promise<void> {

        const { error } =
            await supabase.storage
                .from(BUCKET)
                .remove([caminho]);


        if (error) {
            throw error;
        }
    }


    static async gerarUrl(
        caminho: string
    ): Promise<string> {

        const { data, error } =
            await supabase.storage
                .from(BUCKET)
                .createSignedUrl(
                    caminho,
                    60 * 5
                );


        if (error) {
            throw error;
        }


        if (!data?.signedUrl) {
            throw new Error(
                "NÃ£o foi possÃ­vel gerar a URL da apresentaÃ§Ã£o."
            );
        }


        return data.signedUrl;
    }
}
