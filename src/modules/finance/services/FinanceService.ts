import { FinanceRepository } from "../repositories/FinanceRepository";

import type {
    CategoriaFinanceira,
    MovimentacaoFinanceira,
    TipoMovimentacao,
} from "../types/MovimentacaoFinanceira";

export class FinanceService {

    static listarMovimentacoes() {
        return FinanceRepository.listarMovimentacoes();
    }


    static criarMovimentacao(
        movimentacao: MovimentacaoFinanceira
    ) {
        return FinanceRepository.criarMovimentacao(
            movimentacao
        );
    }

    static editarMovimentacao(
        id: string,
        movimentacao: Partial<MovimentacaoFinanceira>
    ) {
        return FinanceRepository.editarMovimentacao(
            id,
            movimentacao
        );
    }


    static excluirMovimentacao(
        id: string
    ) {
        return FinanceRepository.excluirMovimentacao(
            id
        );
    }


    static listarCategorias(
        tipo?: TipoMovimentacao
    ) {
        return FinanceRepository.listarCategorias(
            tipo
        );
    }


    static criarCategoria(
        categoria: CategoriaFinanceira
    ) {
        return FinanceRepository.criarCategoria(
            categoria
        );
    }


    static obterResumo() {
        return FinanceRepository.obterResumo();
    }

    static enviarComprovante(
        arquivo: File,
        movimentacaoId: string
    ) {
        return FinanceRepository.enviarComprovante(
            arquivo,
            movimentacaoId
        );
    }

    static atualizarComprovante(
        movimentacaoId: string,
        comprovante: {
            path: string;
            nome: string;
            tipo: string;
        }
    ) {
        return FinanceRepository.atualizarComprovante(
            movimentacaoId,
            comprovante
        );
    }

    static removerComprovante(
        movimentacaoId: string
    ) {
        return FinanceRepository.removerComprovante(
            movimentacaoId
        );
    }

    static gerarUrlComprovante(
        caminho: string
    ) {
        return FinanceRepository.gerarUrlComprovante(
            caminho
        );
    }

}