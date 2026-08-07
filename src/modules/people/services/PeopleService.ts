import { PeopleRepository } from "../repositories/PeopleRepository";
import type { Pessoa } from "../types/Pessoa";

export class PeopleService {
  static async listar() {
    return await PeopleRepository.listar();
  }

  static async criar(pessoa: Pessoa) {
  return await PeopleRepository.criar(pessoa);
}

 static async editar(
  id: string,
  pessoa: Pessoa
) {
  return await PeopleRepository.editar(id, pessoa);
}

  static async inativar(id: string) {
    return await PeopleRepository.inativar(id);
  }
}