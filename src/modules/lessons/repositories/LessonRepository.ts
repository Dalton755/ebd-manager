import { supabase } from "@/shared/lib/supabase/client";

import type { Aula } from "../types/Aula";
import type { Trimestre } from "../types/Trimestre";

export const LessonRepository = {

    async listarTrimestres(
        igrejaId: string
    ): Promise<Trimestre[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("trimestres")
            .select("*")
            .eq("igreja_id", igrejaId)
            .order("ano", {
                ascending: false,
            })
            .order("numero", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data ?? [];
    },


    async buscarTrimestreAtivo(
        igrejaId: string
    ): Promise<Trimestre | null> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("trimestres")
            .select("*")
            .eq("igreja_id", igrejaId)
            .eq("ativo", true)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    },


    async criarTrimestre(
        igrejaId: string,
        trimestre: {
            numero: number;
            ano: number;
            tema: string;
            ativo: boolean;
        }
    ): Promise<Trimestre> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("trimestres")
            .insert({
                ...trimestre,
                igreja_id: igrejaId,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    },


    async atualizarTrimestre(
        igrejaId: string,
        trimestreId: string,
        dados: Partial<
            Pick<
                Trimestre,
                "numero" | "ano" | "tema" | "ativo"
            >
        >
    ): Promise<Trimestre> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("trimestres")
            .update(dados)
            .eq("id", trimestreId)
            .eq("igreja_id", igrejaId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    },


    async listarAulasPorTrimestre(
        trimestreId: string
    ): Promise<Aula[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("aulas")
            .select(`
                *,
                professor:pessoas!aulas_professor_id_fkey (
                    id,
                    nome
                )
            `)
            .eq("trimestre_id", trimestreId)
            .order("numero", {
                ascending: true,
            });

        if (error) {
            throw error;
        }

        return data ?? [];
    },


    async criarAula(
        aula: Omit<
            Aula,
            "id" | "created_at" | "updated_at"
        >
    ): Promise<Aula> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("aulas")
            .insert(aula)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    },


    async atualizarAula(
        aulaId: string,
        dados: Partial<
            Omit<
                Aula,
                "id" | "created_at" | "updated_at"
            >
        >
    ): Promise<Aula> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("aulas")
            .update(dados)
            .eq("id", aulaId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    },


    async excluirAula(
        aulaId: string
    ): Promise<void> {

        const { error } = await supabase
            .schema("ebd")
            .from("aulas")
            .delete()
            .eq("id", aulaId);

        if (error) {
            throw error;
        }
    },
};