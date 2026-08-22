import { supabase } from "@/shared/lib/supabase/client";

export type Recurso = {
    id: string;
    codigo: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    created_at: string;
};

export type RecursoInput = {
    codigo: string;
    nome: string;
    descricao: string;
    ativo: boolean;
};

export class RecursosService {

    static async listar(): Promise<Recurso[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("recursos")
            .select(`
                id,
                codigo,
                nome,
                descricao,
                ativo,
                created_at
            `)
            .order("nome", {
                ascending: true,
            });

        if (error) {
            console.error(
                "Erro ao listar recursos:",
                error
            );

            throw error;
        }

        return data ?? [];
    }

    static async buscar(
        id: string
    ): Promise<Recurso> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("recursos")
            .select(`
                id,
                codigo,
                nome,
                descricao,
                ativo,
                created_at
            `)
            .eq("id", id)
            .single();

        if (error) {
            console.error(
                "Erro ao buscar recurso:",
                error
            );

            throw error;
        }

        return data;
    }

    static async criar(
        dados: RecursoInput
    ): Promise<Recurso> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("recursos")
            .insert({
                codigo: dados.codigo,
                nome: dados.nome,
                descricao:
                    dados.descricao || null,
                ativo: dados.ativo,
            })
            .select(`
                id,
                codigo,
                nome,
                descricao,
                ativo,
                created_at
            `)
            .single();

        if (error) {
            console.error(
                "Erro ao criar recurso:",
                error
            );

            throw error;
        }

        return data;
    }

    static async atualizar(
        id: string,
        dados: RecursoInput
    ): Promise<Recurso> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("recursos")
            .update({
                codigo: dados.codigo,
                nome: dados.nome,
                descricao:
                    dados.descricao || null,
                ativo: dados.ativo,
            })
            .eq("id", id)
            .select(`
                id,
                codigo,
                nome,
                descricao,
                ativo,
                created_at
            `)
            .single();

        if (error) {
            console.error(
                "Erro ao atualizar recurso:",
                error
            );

            throw error;
        }

        return data;
    }

    static async alterarStatus(
        id: string,
        ativo: boolean
    ): Promise<void> {

        const { error } = await supabase
            .schema("ebd")
            .from("recursos")
            .update({
                ativo,
            })
            .eq("id", id);

        if (error) {
            console.error(
                "Erro ao alterar status do recurso:",
                error
            );

            throw error;
        }
    }
}