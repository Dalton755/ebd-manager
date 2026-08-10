import { AttendanceRepository } from "../repositories/AttendanceRepository";

export class AttendanceService {
    static async listarPresencas() {
        return await AttendanceRepository.listar();
    }
}