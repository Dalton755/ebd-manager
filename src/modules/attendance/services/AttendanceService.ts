import { AttendanceRepository } from "../repositories/AttendanceRepository";

export class AttendanceService {

  static async listarPorData(data: string) {
    return await AttendanceRepository.listarPorData(data);
  }

  static async registrarCheckin(
    pessoaId: string,
    data: string
  ) {
    return await AttendanceRepository.registrarPresenca(
      pessoaId,
      data,
      "CHECKIN"
    );
  }

  static async registrarChamada(
    pessoaId: string,
    data: string,
    registradoPor: string
  ) {
    return await AttendanceRepository.registrarPresenca(
      pessoaId,
      data,
      "CHAMADA",
      registradoPor
    );
  }

  static async removerPresenca(
    pessoaId: string,
    data: string
  ) {
    return await AttendanceRepository.removerPresenca(
      pessoaId,
      data
    );
  }

  static async listarPorPeriodo(
    dataInicial: string,
    dataFinal: string
  ) {
    return await AttendanceRepository.listarPorPeriodo(
      dataInicial,
      dataFinal
    );
  }

  static async validarPresenca(
    presencaId: string,
    validadoPor: string
  ) {
    return await AttendanceRepository
      .validarPresenca(
        presencaId,
        validadoPor
      );
  }

  static async rejeitarPresenca(
    presencaId: string,
    validadoPor: string,
    observacao?: string
  ) {
    return await AttendanceRepository
      .rejeitarPresenca(
        presencaId,
        validadoPor,
        observacao
      );
  }

  static async buscarConfiguracaoCheckin() {

    return await AttendanceRepository
      .buscarConfiguracaoCheckin();

  }

}