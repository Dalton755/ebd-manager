export interface AttendanceRecord {
    id: string;
    pessoa_id: string;
    nome: string;
    data: string;
    hora_checkin: string | null;
    latitude: number | null;
    longitude: number | null;
    precisao: number | null;
    distancia_metros: number | null;
    localizacao_status: "DENTRO" | "FORA" | null;
}