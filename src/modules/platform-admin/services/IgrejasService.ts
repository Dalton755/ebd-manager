import { supabase } from "@/shared/lib/supabase/client";

export type Igreja = {
    id: string;
    nome: string;
    sigla: string | null;
    cnpj: string | null;
    telefone: string | null;
    email: string | null;
    ativa: boolean;
    created_at: string;
    updated_at: string;
};

export type IgrejaInput = {
    nome: string;
    sigla: string;
    cnpj: string;
    telefone: string;
    email: string;
    ativa: boolean;
};

export class IgrejasService {

    static async listar(): Promise<Igreja[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("igrejas")
            .select(`
                id,
                nome,
                sigla,
                cnpj,
                telefone,
                email,
                ativa,
                created_at,
                updated_at
            `)
            .order("nome", { ascending: true });

        if (error) {
            console.error("Erro ao listar igrejas:", error);
            throw error;
        }

        return data ?? [];
    }

    static async criar(
        dados: IgrejaInput
    ): Promise<Igreja> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("igrejas")
            .insert({
                nome: dados.nome,
                sigla: dados.sigla || null,
                cnpj: dados.cnpj || null,
                telefone: dados.telefone || null,
                email: dados.email || null,
                ativa: dados.ativa,
            })
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar igreja:", error);
            throw error;
        }

        return data;
    }

    static async atualizar(
        id: string,
        dados: IgrejaInput
    ): Promise<Igreja> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("igrejas")
            .update({
                nome: dados.nome,
                sigla: dados.sigla || null,
                cnpj: dados.cnpj || null,
                telefone: dados.telefone || null,
                email: dados.email || null,
                ativa: dados.ativa,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar igreja:", error);
            throw error;
        }

        return data;
    }

    static async alterarStatus(
        id: string,
        ativa: boolean
    ): Promise<void> {

        const { error } = await supabase
            .schema("ebd")
            .from("igrejas")
            .update({
                ativa,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error(
                "Erro ao alterar status da igreja:",
                error
            );

            throw error;
        }
    }
}
