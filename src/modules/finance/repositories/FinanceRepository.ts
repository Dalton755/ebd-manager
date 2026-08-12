import { supabase } from "@/shared/lib/supabase/client";

import type {
    CategoriaFinanceira,
    MovimentacaoFinanceira,
    TipoMovimentacao,
} from "../types/MovimentacaoFinanceira";

export class FinanceRepository {

    // =====================================================
    // MOVIMENTAÇÕES
    // =====================================================

    static async listarMovimentacoes(): Promise<
        MovimentacaoFinanceira[]
    > {

        const { data, error } = await supabase
            .schema("ebd")
            .from("movimentacoes_financeiras")
            .select(`
        *,
        categoria:categorias_financeiras(*)
      `)
            .order("data", {
                ascending: false,
            })
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data ?? [];
    }


    static async criarMovimentacao(
        movimentacao: MovimentacaoFinanceira
    ) {

        const { data, error } = await supabase
            .schema("ebd")
            .from("movimentacoes_financeiras")
            .insert({
                tipo: movimentacao.tipo,
                categoria_id: movimentacao.categoria_id,
                valor: movimentacao.valor,
                data: movimentacao.data,
                descricao: movimentacao.descricao ?? null,
                criado_por: movimentacao.criado_por ?? null,
            })
            .select(`
        *,
        categoria:categorias_financeiras(*)
      `)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    // =====================================================
    // EDITAR MOVIMENTAÇÃO
    // =====================================================

    static async editarMovimentacao(
        id: string,
        movimentacao: Partial<MovimentacaoFinanceira>
    ) {

        const { data, error } = await supabase
            .schema("ebd")
            .from("movimentacoes_financeiras")
            .update({
                tipo: movimentacao.tipo,
                categoria_id: movimentacao.categoria_id,
                valor: movimentacao.valor,
                data: movimentacao.data,
                descricao: movimentacao.descricao ?? null,
            })
            .eq("id", id)
            .select(`
            *,
            categoria:categorias_financeiras(*)
        `)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }


    // =====================================================
    // EXCLUIR MOVIMENTAÇÃO
    // =====================================================

    static async excluirMovimentacao(
        id: string
    ) {

        // Primeiro buscamos o comprovante,
        // para podermos removê-lo do Storage.

        const { data: movimentacao, error: buscaError } =
            await supabase
                .schema("ebd")
                .from("movimentacoes_financeiras")
                .select("id, comprovante_path")
                .eq("id", id)
                .single();

        if (buscaError) {
            throw buscaError;
        }


        // Remove o comprovante do Storage, se existir.

        if (movimentacao?.comprovante_path) {

            const { error: storageError } =
                await supabase.storage
                    .from("comprovantes-financeiros")
                    .remove([
                        movimentacao.comprovante_path,
                    ]);

            if (storageError) {
                throw storageError;
            }
        }


        // Remove a movimentação do banco.

        const { error } = await supabase
            .schema("ebd")
            .from("movimentacoes_financeiras")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }
    }


    // =====================================================
    // CATEGORIAS
    // =====================================================

    static async listarCategorias(
        tipo?: TipoMovimentacao
    ): Promise<CategoriaFinanceira[]> {

        let query = supabase
            .schema("ebd")
            .from("categorias_financeiras")
            .select("*")
            .eq("ativa", true)
            .order("nome");

        if (tipo) {
            query = query.eq("tipo", tipo);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return data ?? [];
    }


    static async criarCategoria(
        categoria: CategoriaFinanceira
    ) {

        const { data, error } = await supabase
            .schema("ebd")
            .from("categorias_financeiras")
            .insert({
                nome: categoria.nome,
                tipo: categoria.tipo,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }


    // =====================================================
    // RESUMO FINANCEIRO
    // =====================================================

    static async obterResumo() {

        const { data, error } = await supabase
            .schema("ebd")
            .from("movimentacoes_financeiras")
            .select("tipo, valor");

        if (error) {
            throw error;
        }

        let receitas = 0;
        let despesas = 0;

        for (const movimentacao of data ?? []) {

            const valor = Number(
                movimentacao.valor
            );

            if (movimentacao.tipo === "RECEITA") {
                receitas += valor;
            }

            if (movimentacao.tipo === "DESPESA") {
                despesas += valor;
            }
        }

        return {
            receitas,
            despesas,
            saldo: receitas - despesas,
        };
    }

    static async enviarComprovante(
        arquivo: File,
        movimentacaoId: string
    ) {
        const extensao =
            arquivo.name.split(".").pop()?.toLowerCase() ?? "arquivo";

        const caminho =
            `movimentacoes/${movimentacaoId}/${crypto.randomUUID()}.${extensao}`;

        const { error } = await supabase.storage
            .from("comprovantes-financeiros")
            .upload(caminho, arquivo, {
                cacheControl: "3600",
                upsert: false,
                contentType: arquivo.type,
            });

        if (error) {
            throw error;
        }

        return {
            path: caminho,
            nome: arquivo.name,
            tipo: arquivo.type,
        };
    }



    static async atualizarComprovante(
        movimentacaoId: string,
        comprovante: {
            path: string;
            nome: string;
            tipo: string;
        }
    ) {
        const { data, error } = await supabase
            .schema("ebd")
            .from("movimentacoes_financeiras")
            .update({
                comprovante_path: comprovante.path,
                comprovante_nome: comprovante.nome,
                comprovante_tipo: comprovante.tipo,
            })
            .eq("id", movimentacaoId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    static async removerComprovante(
        movimentacaoId: string
    ) {
        const { data: movimentacao, error: buscaError } =
            await supabase
                .schema("ebd")
                .from("movimentacoes_financeiras")
                .select("comprovante_path")
                .eq("id", movimentacaoId)
                .single();

        if (buscaError) {
            throw buscaError;
        }

        if (movimentacao?.comprovante_path) {

            const { error: storageError } =
                await supabase.storage
                    .from("comprovantes-financeiros")
                    .remove([
                        movimentacao.comprovante_path,
                    ]);

            if (storageError) {
                throw storageError;
            }
        }

        const { data, error } =
            await supabase
                .schema("ebd")
                .from("movimentacoes_financeiras")
                .update({
                    comprovante_path: null,
                    comprovante_nome: null,
                    comprovante_tipo: null,
                })
                .eq("id", movimentacaoId)
                .select()
                .single();

        if (error) {
            throw error;
        }

        return data;
    }

    static async gerarUrlComprovante(
        caminho: string
    ) {
        const { data, error } = await supabase.storage
            .from("comprovantes-financeiros")
            .createSignedUrl(caminho, 60 * 5);

        if (error) {
            throw error;
        }

        if (!data?.signedUrl) {
            throw new Error(
                "Não foi possível gerar a URL do comprovante."
            );
        }

        return data.signedUrl;
    }

}