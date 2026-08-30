import { supabase } from "@/shared/lib/supabase/client";
import type { StudentCheckin } from "../types/StudentCheckin";

export class StudentCheckinRepository {

    static async buscarAulaDeHoje(
        data: string,
        igrejaId: string,
        classeId: string
    ) {

        const { data: aulas, error } = await supabase
            .schema("ebd")
            .from("aulas")
            .select(`
                id,
                numero,
                titulo,
                data,
                hora_inicio,
                hora_fim,
                classe_id,
                professor_id,
                link_drive,

                professor:pessoas!aulas_professor_id_fkey (
                    id,
                    nome
                ),

                trimestre:trimestres!aulas_trimestre_id_fkey!inner (
                    numero,
                    ano,
                    tema,
                    ativo,
                    igreja_id
                )
            `)
            .eq("data", data)
            .eq("classe_id", classeId)
            .eq("cancelada", false)
            .eq("trimestre.ativo", true)
            .eq("trimestre.igreja_id", igrejaId)
            .order("numero", {
                ascending: true,
            });

        if (error) {
            throw error;
        }

        return aulas?.[0] ?? null;
    }

    static async verificarCheckinDaAula(
        pessoaId: string,
        aulaId: string
    ) {

        const { data: presenca, error } = await supabase
            .schema("ebd")
            .from("presencas")
            .select("*")
            .eq("pessoa_id", pessoaId)
            .eq("aula_id", aulaId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return presenca;
    }

    static async buscarConfiguracaoCheckin(
        igrejaId: string
    ) {

        const { data, error } = await supabase
            .schema("ebd")
            .from("configuracoes_checkin")
            .select(`
            latitude,
            longitude,
            raio_metros
        `)
            .eq("igreja_id", igrejaId)
            .eq("ativo", true)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    }

    static async registrar(
        checkin: StudentCheckin & {
            aula_id: string;
        }
    ) {

        const { data, error } = await supabase
            .schema("ebd")
            .from("presencas")
            .insert({
                pessoa_id: checkin.pessoa_id,
                aula_id: checkin.aula_id,
                data: checkin.data,
                hora_checkin: new Date().toISOString(),
                tipo_registro: "CHECKIN",
                latitude: checkin.latitude,
                longitude: checkin.longitude,
                precisao: checkin.precisao ?? null,
                distancia_metros: checkin.distancia_metros,
                localizacao_status: checkin.localizacao_status,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}