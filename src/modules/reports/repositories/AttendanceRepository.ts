import { supabase } from "@/shared/lib/supabase/client";
import type { AttendanceRecord } from "../types/AttendanceRecord";

export class AttendanceRepository {
    static async listar(): Promise<AttendanceRecord[]> {
        const { data, error } = await supabase
            .from("presencas")
            .select(`
                id,
                pessoa_id,
                data,
                hora_checkin,
                latitude,
                longitude,
                precisao,
                distancia_metros,
                localizacao_status,
                pessoas!presencas_pessoa_id_fkey (
                    nome
                )
            `)
            .order("data", {
                ascending: false,
            })
            .order("hora_checkin", {
                ascending: false,
            });

        if (error) {
            console.error(
                "Erro ao carregar presenças:",
                error
            );

            throw error;
        }

        return (data ?? []).map((registro) => ({
            id: registro.id,
            pessoa_id: registro.pessoa_id,
            nome:
                registro.pessoas?.[0]?.nome ??
                "Aluno não encontrado",
            data: registro.data,
            hora_checkin: registro.hora_checkin,
            latitude: registro.latitude,
            longitude: registro.longitude,
            precisao: registro.precisao,
            distancia_metros: registro.distancia_metros,
            localizacao_status: registro.localizacao_status,
        }));
    }
}