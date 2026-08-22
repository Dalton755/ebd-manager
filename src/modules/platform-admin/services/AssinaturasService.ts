import { supabase } from "@/shared/lib/supabase/client";

export type Assinatura = {
    id: string;
    igreja_id: string;
    plano_id: string;
    status: string;
    inicio_em: string;
    fim_em: string | null;
    created_at: string;
    updated_at: string;

    igreja?: {
        id: string;
        nome: string;
        telefone: string | null;
        email: string | null;
    } | null;

    plano?: {
        id: string;
        nome: string;
        descricao: string | null;
    } | null;
};

export type AssinaturaInput = {
    igreja_id: string;
    plano_id: string;
    status: string;
    inicio_em: string;
    fim_em: string;
};

export class AssinaturasService {

    static async listar(): Promise<Assinatura[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .select(`
                id,
                igreja_id,
                plano_id,
                status,
                inicio_em,
                fim_em,
                created_at,
                updated_at,
                igreja:igrejas (
                id,
                nome,
                telefone,
                email
            ),
                plano:planos (
                    id,
                    nome,
                    descricao
                )
            `)
            .order("inicio_em", {
                ascending: false,
            });

        if (error) {
            console.error(
                "Erro ao listar assinaturas:",
                error
            );

            throw error;
        }

        const resultado: Assinatura[] = (data ?? []).map((item) => ({
            id: item.id,
            igreja_id: item.igreja_id,
            plano_id: item.plano_id,
            status: item.status,
            inicio_em: item.inicio_em,
            fim_em: item.fim_em,
            created_at: item.created_at,
            updated_at: item.updated_at,

            igreja: item.igreja?.[0] ?? null,

            plano: item.plano?.[0] ?? null,
        }));

        return resultado;
    }

    static async criar(
        dados: AssinaturaInput
    ): Promise<Assinatura> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .insert({
                igreja_id: dados.igreja_id,
                plano_id: dados.plano_id,
                status: dados.status,
                inicio_em: dados.inicio_em,
                fim_em: dados.fim_em || null,
            })
            .select(`
                id,
                igreja_id,
                plano_id,
                status,
                inicio_em,
                fim_em,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            console.error(
                "Erro ao criar assinatura:",
                error
            );

            throw error;
        }

        return data as Assinatura;
    }

    static async atualizar(
        id: string,
        dados: AssinaturaInput
    ): Promise<Assinatura> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .update({
                igreja_id: dados.igreja_id,
                plano_id: dados.plano_id,
                status: dados.status,
                inicio_em: dados.inicio_em,
                fim_em: dados.fim_em || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(`
                id,
                igreja_id,
                plano_id,
                status,
                inicio_em,
                fim_em,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            console.error(
                "Erro ao atualizar assinatura:",
                error
            );

            throw error;
        }

        return data as Assinatura;
    }

    static async alterarStatus(
        id: string,
        status: string
    ): Promise<void> {

        const { error } = await supabase
            .schema("ebd")
            .from("assinaturas")
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error(
                "Erro ao alterar status da assinatura:",
                error
            );

            throw error;
        }
    }
}
