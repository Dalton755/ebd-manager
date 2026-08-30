import { supabase } from "@/shared/lib/supabase/client";

export type OfertaPlano = {
    id: string;
    plano_id: string;
    preco_recorrente: number;
    gratuito: boolean;
    duracao_gratuita_dias: number;
    periodo_recorrente:
    | "MENSAL"
    | "TRIMESTRAL"
    | "SEMESTRAL"
    | "ANUAL";
    ativa: boolean;
    created_at?: string;
    updated_at?: string;
};

export type OfertaPlanoInput = {
    plano_id: string;
    preco_recorrente: number;
    gratuito: boolean;
    duracao_gratuita_dias: number;
    periodo_recorrente:
    | "MENSAL"
    | "TRIMESTRAL"
    | "SEMESTRAL"
    | "ANUAL";
    ativa: boolean;
};

export type Plano = {
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;

    limites?: PlanoLimites | null;
};

export type PlanoLimites = {
    id?: string;
    plano_id: string;
    max_pessoas: number;
    max_classes: number;
    max_professores: number;
    max_administradores: number;
    max_secretarios: number;
    max_pastores: number;
    max_superintendentes: number;
    max_trimestres_ativos: number;
    max_trimestres: number | null;
    created_at?: string;
    updated_at?: string;
};

export type PlanoInput = {
    nome: string;
    descricao: string;
    ordem: number;
    ativo: boolean;
};

export type PlanoLimitesInput = {
    max_pessoas: number;
    max_classes: number;
    max_professores: number;
    max_administradores: number;
    max_secretarios: number;
    max_pastores: number;
    max_superintendentes: number;
    max_trimestres_ativos: number;
    max_trimestres: number | null;
};

export class PlanosService {

    static async listar(): Promise<Plano[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("planos")
            .select(`
        id,
        nome,
        descricao,
        ordem,
        ativo,
        created_at,
        updated_at,
        plano_limites (
            id,
            plano_id,
            max_pessoas,
            max_classes,
            max_professores,
            max_administradores,
            max_secretarios,
            max_pastores,
            max_superintendentes,
            max_trimestres_ativos,
            max_trimestres,
            created_at,
            updated_at
        )
    `)
            .order("ordem", {
                ascending: true,
            });

        if (error) {
            console.error(
                "Erro ao listar planos:",
                error
            );

            throw error;
        }

        return (data ?? []).map((plano) => ({
            id: plano.id,
            nome: plano.nome,
            descricao: plano.descricao,
            ordem: plano.ordem,
            ativo: plano.ativo,
            created_at: plano.created_at,
            updated_at: plano.updated_at,

            limites: Array.isArray(plano.plano_limites)
                ? plano.plano_limites[0] ?? null
                : plano.plano_limites ?? null,
        }));
    }

    static async buscar(
        id: string
    ): Promise<Plano> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("planos")
            .select(`
                id,
                nome,
                descricao,
                ordem,
                ativo,
                created_at,
                updated_at
            `)
            .eq("id", id)
            .single();

        if (error) {
            console.error(
                "Erro ao buscar plano:",
                error
            );

            throw error;
        }

        return data;
    }

    static async buscarLimites(
        planoId: string
    ): Promise<PlanoLimites | null> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("plano_limites")
            .select(`
                id,
                plano_id,
                max_pessoas,
                max_classes,
                max_professores,
                max_administradores,
                max_secretarios,
                max_pastores,
                max_superintendentes,
                max_trimestres_ativos,
                max_trimestres,
                created_at,
                updated_at
            `)
            .eq("plano_id", planoId)
            .maybeSingle();

        if (error) {
            console.error(
                "Erro ao buscar limites do plano:",
                error
            );

            throw error;
        }

        return data;
    }

    static async criar(
        dados: PlanoInput,
        limites: PlanoLimitesInput,
        recursoIds: string[]
    ): Promise<Plano> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("planos")
            .insert({
                nome: dados.nome,
                descricao: dados.descricao || null,
                ordem: dados.ordem,
                ativo: dados.ativo,
            })
            .select(`
                id,
                nome,
                descricao,
                ordem,
                ativo,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            console.error(
                "Erro ao criar plano:",
                error
            );

            throw error;
        }

        try {

            await this.salvarLimites(
                data.id,
                limites
            );

            await this.salvarRecursosDoPlano(
                data.id,
                recursoIds
            );

        } catch (erro) {

            console.error(
                "Erro ao criar limites do plano:",
                erro
            );

            throw erro;
        }

        return data;
    }

    static async atualizar(
        id: string,
        dados: PlanoInput,
        limites: PlanoLimitesInput,
        recursoIds: string[]
    ): Promise<Plano> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("planos")
            .update({
                nome: dados.nome,
                descricao: dados.descricao || null,
                ordem: dados.ordem,
                ativo: dados.ativo,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(`
                id,
                nome,
                descricao,
                ordem,
                ativo,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            console.error(
                "Erro ao atualizar plano:",
                error
            );

            throw error;
        }

        await this.salvarLimites(
            id,
            limites
        );

        await this.salvarRecursosDoPlano(
            id,
            recursoIds
        );

        return data;
    }

    static async salvarLimites(
        planoId: string,
        limites: PlanoLimitesInput
    ): Promise<PlanoLimites> {

        const existentes =
            await this.buscarLimites(planoId);

        if (existentes) {

            const { data, error } = await supabase
                .schema("ebd")
                .from("plano_limites")
                .update({
                    max_pessoas:
                        limites.max_pessoas,
                    max_classes:
                        limites.max_classes,
                    max_professores:
                        limites.max_professores,
                    max_administradores:
                        limites.max_administradores,
                    max_secretarios:
                        limites.max_secretarios,
                    max_pastores:
                        limites.max_pastores,
                    max_superintendentes:
                        limites.max_superintendentes,
                    max_trimestres_ativos:
                        limites.max_trimestres_ativos,
                    max_trimestres:
                        limites.max_trimestres,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("plano_id", planoId)
                .select()
                .single();

            if (error) {
                console.error(
                    "Erro ao atualizar limites:",
                    error
                );

                throw error;
            }

            return data;
        }

        const { data, error } = await supabase
            .schema("ebd")
            .from("plano_limites")
            .insert({
                plano_id: planoId,
                max_pessoas:
                    limites.max_pessoas,
                max_classes:
                    limites.max_classes,
                max_professores:
                    limites.max_professores,
                max_administradores:
                    limites.max_administradores,
                max_secretarios:
                    limites.max_secretarios,
                max_pastores:
                    limites.max_pastores,
                max_superintendentes:
                    limites.max_superintendentes,
                max_trimestres_ativos:
                    limites.max_trimestres_ativos,
                max_trimestres:
                    limites.max_trimestres,
            })
            .select()
            .single();

        if (error) {
            console.error(
                "Erro ao criar limites:",
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
            .from("planos")
            .update({
                ativo,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error(
                "Erro ao alterar status do plano:",
                error
            );

            throw error;
        }
    }

    static async listarRecursos(): Promise<{
        id: string;
        codigo: string;
        nome: string;
        descricao: string | null;
        ativo: boolean;
    }[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("recursos")
            .select(`
                id,
                codigo,
                nome,
                descricao,
                ativo
            `)
            .eq("ativo", true)
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

    static async buscarRecursosDoPlano(
        planoId: string
    ): Promise<string[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("plano_recursos")
            .select(`
                recurso_id
            `)
            .eq("plano_id", planoId)
            .eq("ativo", true);

        if (error) {
            console.error(
                "Erro ao buscar recursos do plano:",
                error
            );

            throw error;
        }

        return (data ?? []).map(
            (item) => item.recurso_id
        );
    }

    static async salvarRecursosDoPlano(
        planoId: string,
        recursoIds: string[]
    ): Promise<void> {

        const { error: erroRemocao } = await supabase
            .schema("ebd")
            .from("plano_recursos")
            .delete()
            .eq("plano_id", planoId);

        if (erroRemocao) {
            console.error(
                "Erro ao remover recursos anteriores do plano:",
                erroRemocao
            );

            throw erroRemocao;
        }

        if (recursoIds.length === 0) {
            return;
        }

        const registros = recursoIds.map(
            (recursoId) => ({
                plano_id: planoId,
                recurso_id: recursoId,
                ativo: true,
            })
        );

        const { error: erroInsercao } = await supabase
            .schema("ebd")
            .from("plano_recursos")
            .insert(registros);

        if (erroInsercao) {
            console.error(
                "Erro ao salvar recursos do plano:",
                erroInsercao
            );

            throw erroInsercao;
        }


    }

    // ============================================================
    // OFERTAS COMERCIAIS
    // ============================================================

    static async buscarOfertaAtiva(
        planoId: string
    ): Promise<OfertaPlano | null> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("ofertas_planos")
            .select(`
                id,
                plano_id,
                preco_recorrente,
                gratuito,
                duracao_gratuita_dias,
                periodo_recorrente,
                ativa,
                created_at,
                updated_at
            `)
            .eq("plano_id", planoId)
            .eq("ativa", true)
            .maybeSingle();

        if (error) {

            console.error(
                "Erro ao buscar oferta ativa:",
                error
            );

            throw error;
        }

        if (!data) {
            return null;
        }

        return {
            id: data.id,
            plano_id: data.plano_id,
            preco_recorrente:
                Number(data.preco_recorrente ?? 0),
            gratuito:
                Boolean(data.gratuito),
            duracao_gratuita_dias:
                Number(
                    data.duracao_gratuita_dias ?? 0
                ),
            periodo_recorrente:
                data.periodo_recorrente,
            ativa:
                Boolean(data.ativa),
            created_at:
                data.created_at,
            updated_at:
                data.updated_at,
        };
    }


    static async listarOfertas(): Promise<OfertaPlano[]> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("ofertas_planos")
            .select(`
                id,
                plano_id,
                preco_recorrente,
                gratuito,
                duracao_gratuita_dias,
                periodo_recorrente,
                ativa,
                created_at,
                updated_at
            `)
            .order("created_at", {
                ascending: false,
            });

        if (error) {

            console.error(
                "Erro ao listar ofertas:",
                error
            );

            throw error;
        }

        return (data ?? []).map((item) => ({
            id: item.id,
            plano_id: item.plano_id,
            preco_recorrente:
                Number(item.preco_recorrente ?? 0),
            gratuito:
                Boolean(item.gratuito),
            duracao_gratuita_dias:
                Number(
                    item.duracao_gratuita_dias ?? 0
                ),
            periodo_recorrente:
                item.periodo_recorrente,
            ativa:
                Boolean(item.ativa),
            created_at:
                item.created_at,
            updated_at:
                item.updated_at,
        }));
    }


    static async criarOferta(
        dados: OfertaPlanoInput
    ): Promise<OfertaPlano> {

        const { data, error } = await supabase
            .schema("ebd")
            .from("ofertas_planos")
            .insert({
                plano_id:
                    dados.plano_id,

                preco_recorrente:
                    dados.preco_recorrente,

                gratuito:
                    dados.gratuito,

                duracao_gratuita_dias:
                    dados.gratuito
                        ? dados.duracao_gratuita_dias
                        : 0,

                periodo_recorrente:
                    dados.periodo_recorrente,

                ativa:
                    dados.ativa,
            })
            .select(`
                id,
                plano_id,
                preco_recorrente,
                gratuito,
                duracao_gratuita_dias,
                periodo_recorrente,
                ativa,
                created_at,
                updated_at
            `)
            .single();

        if (error) {

            console.error(
                "Erro ao criar oferta:",
                error
            );

            throw error;
        }

        return {
            id: data.id,
            plano_id: data.plano_id,
            preco_recorrente:
                Number(data.preco_recorrente ?? 0),
            gratuito:
                Boolean(data.gratuito),
            duracao_gratuita_dias:
                Number(
                    data.duracao_gratuita_dias ?? 0
                ),
            periodo_recorrente:
                data.periodo_recorrente,
            ativa:
                Boolean(data.ativa),
            created_at:
                data.created_at,
            updated_at:
                data.updated_at,
        };
    }


    static async atualizarOferta(
        id: string,
        dados: OfertaPlanoInput
    ): Promise<OfertaPlano> {

        /*
         * IMPORTANTE:
         *
         * A oferta antiga não deve ser alterada
         * quando já foi utilizada por uma assinatura.
         *
         * Portanto, este método NÃO será usado para
         * modificar uma oferta contratada.
         *
         * A tela do SuperAdmin deverá criar uma NOVA
         * oferta e desativar a anterior.
         */

        const { data, error } = await supabase
            .schema("ebd")
            .from("ofertas_planos")
            .update({
                preco_recorrente:
                    dados.preco_recorrente,

                gratuito:
                    dados.gratuito,

                duracao_gratuita_dias:
                    dados.gratuito
                        ? dados.duracao_gratuita_dias
                        : 0,

                periodo_recorrente:
                    dados.periodo_recorrente,

                ativa:
                    dados.ativa,

                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .select(`
                id,
                plano_id,
                preco_recorrente,
                gratuito,
                duracao_gratuita_dias,
                periodo_recorrente,
                ativa,
                created_at,
                updated_at
            `)
            .single();

        if (error) {

            console.error(
                "Erro ao atualizar oferta:",
                error
            );

            throw error;
        }

        return {
            id: data.id,
            plano_id: data.plano_id,
            preco_recorrente:
                Number(data.preco_recorrente ?? 0),
            gratuito:
                Boolean(data.gratuito),
            duracao_gratuita_dias:
                Number(
                    data.duracao_gratuita_dias ?? 0
                ),
            periodo_recorrente:
                data.periodo_recorrente,
            ativa:
                Boolean(data.ativa),
            created_at:
                data.created_at,
            updated_at:
                data.updated_at,
        };
    }


    static async desativarOferta(
        id: string
    ): Promise<void> {

        const { error } = await supabase
            .schema("ebd")
            .from("ofertas_planos")
            .update({
                ativa: false,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {

            console.error(
                "Erro ao desativar oferta:",
                error
            );

            throw error;
        }
    }


}