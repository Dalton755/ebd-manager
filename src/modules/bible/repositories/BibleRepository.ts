import { supabase } from "@/shared/lib/supabase/client";

import type {
    TraducaoBiblia,
    VersiculoBiblia,
} from "@/modules/bible/types/Bible";


export class BibleRepository {

    static async buscarTraducaoAtiva(
        codigo?: string
    ): Promise<TraducaoBiblia | null> {

        let consulta =
            supabase
                .schema("ebd")
                .from("biblia_traducoes")
                .select("*")
                .eq("ativa", true);


        if (codigo) {
            consulta =
                consulta.eq(
                    "codigo",
                    codigo
                );
        }


        const { data, error } =
            await consulta
                .order(
                    "created_at",
                    {
                        ascending: true,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data;
    }


    static async buscarVersiculos(
        traducaoId: string,
        livroAbreviado: string,
        capitulo: number,
        versiculoInicial: number,
        versiculoFinal: number
    ): Promise<VersiculoBiblia[]> {

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("biblia_versiculos")
                .select("*")
                .eq(
                    "traducao_id",
                    traducaoId
                )
                .ilike(
                    "livro_abreviado",
                    livroAbreviado
                )
                .eq(
                    "capitulo",
                    capitulo
                )
                .gte(
                    "versiculo",
                    versiculoInicial
                )
                .lte(
                    "versiculo",
                    versiculoFinal
                )
                .order(
                    "versiculo",
                    {
                        ascending: true,
                    }
                );


        if (error) {
            throw error;
        }


        return data ?? [];
    }
}
