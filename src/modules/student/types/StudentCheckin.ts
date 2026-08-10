export interface StudentCheckin {
    pessoa_id: string;
    data: string;
    tipo_registro: string;
    latitude: number;
    longitude: number;
    precisao?: number | null;
    distancia_metros: number;
    localizacao_status: "DENTRO" | "FORA";
}