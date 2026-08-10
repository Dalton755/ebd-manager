import { ClassRepository } from "../repositories/ClassRepository";
import type { Classe } from "../types/Classe";

export class ClassService {

  static listar() {
    return ClassRepository.listar();
  }

  static criar(classe: Classe) {
    return ClassRepository.criar(classe);
  }

  static editar(
    id: string,
    classe: Classe
  ) {
    return ClassRepository.editar(id, classe);
  }

  static inativar(id: string) {
    return ClassRepository.inativar(id);
  }

}