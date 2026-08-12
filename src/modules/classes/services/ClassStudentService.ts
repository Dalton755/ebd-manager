import { ClassStudentRepository } from "../repositories/ClassStudentRepository";

export class ClassStudentService {

  static listarAlunosDaClasse(
    classeId: string
  ) {
    return ClassStudentRepository.listarAlunosDaClasse(
      classeId
    );
  }


  static listarAlunosDisponiveis() {
    return ClassStudentRepository.listarAlunosDisponiveis();
  }


  static vincularAluno(
    pessoaId: string,
    classeId: string
  ) {
    return ClassStudentRepository.vincularAluno(
      pessoaId,
      classeId
    );
  }


  static removerAluno(
    pessoaId: string
  ) {
    return ClassStudentRepository.removerAluno(
      pessoaId
    );
  }


  static contarAlunos(
    classeId: string
  ) {
    return ClassStudentRepository.contarAlunos(
      classeId
    );
  }

}