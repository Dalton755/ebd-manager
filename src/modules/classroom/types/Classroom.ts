export type StatusSala =
    | "EM_AULA"
    | "SEM_ATIVIDADE";


export type AulaSala = {
    id: string;
    classe_id: string;
    numero: number;
    titulo: string;
    data: string;
    hora_inicio: string | null;
    hora_fim: string | null;
    professor_id: string | null;

    professor?: {
        id: string;
        nome: string;
    } | null;
};


export type AlunoEmAula = {
    presencaId: string;
    pessoaId: string;
    nome: string;
    horaCheckin: string;
    localizacaoStatus: string | null;
    statusValidacao: string | null;
};


export type SalaAula = {
    classeId: string;
    classeNome: string;
    classeDescricao: string | null;
    classeCor: string | null;

    status: StatusSala;

    aulaAtual: AulaSala | null;

    proximaAula: AulaSala | null;

    alunosEmAula: AlunoEmAula[];
};


export type PainelSalas = {
    totalSalas: number;
    salasEmAula: number;
    alunosEmAula: number;
    salas: SalaAula[];
};