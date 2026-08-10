import { supabase } from "@/shared/lib/supabase/client";
import type { StudentCheckin } from "../types/StudentCheckin";

export class StudentCheckinRepository {

    static async buscarAulaDeHoje(data: string) {

        const { data: aulas, error } = await supabase
            .schema("ebd")
            .from("aulas")
            .select(`
                id,
                numero,
                titulo,
                data,
                link_drive,
                trimestre:trimestres!aulas_trimestre_id_fkey (
                    numero,
                    ano,
                    tema,
                    ativo
                )
            `)
            .eq("data", data)
            .eq("trimestre.ativo", true);

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

    static async buscarConfiguracaoCheckin() {

        const { data, error } = await supabase
            .schema("ebd")
            .from("configuracoes_checkin")
            .select(`
                latitude,
                longitude,
                raio_metros
            `)
            .eq("ativo", true)
            .single();

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