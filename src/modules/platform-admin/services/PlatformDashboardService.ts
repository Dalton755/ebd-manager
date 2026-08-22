import { supabase } from "@/shared/lib/supabase/client";

export type IgrejaResumo = {
    id: string;
    nome: string;
    sigla: string | null;
    telefone: string | null;
    email: string | null;
    ativa: boolean;
    created_at: string;

    pessoas: number;
    alunos: number;
    professores: number;
    administradores: number;
    pastores: number;
    superintendentes: number;
    secretarios: number;

    classes: number;

    assinatura: {
        id: string;
        status: string;
        inicio_em: string;
        fim_em: string | null;
        plano: {
            id: string;
            nome: string;
            descricao: string | null;
        } | null;
    } | null;
};

export class PlatformDashboardService {

    static async listarResumo(): Promise<IgrejaResumo[]> {

        const [
            igrejasResult,
            pessoasResult,
            classesResult,
            assinaturasResult,
        ] = await Promise.all([

            supabase
                .schema("ebd")
                .from("igrejas")
                .select(`
                    id,
                    nome,
                    sigla,
                    telefone,
                    email,
                    ativa,
                    created_at
                `)
                .order("created_at", {
                    ascending: false,
                }),

            supabase
                .schema("ebd")
                .from("pessoas")
                .select(`
                    id,
                    igreja_id,
                    perfil,
                    ativo
                `),

            supabase
                .schema("ebd")
                .from("classes")
                .select(`
                    id,
                    igreja_id,
                    ativa
                `),

            supabase
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
                    plano:planos (
                        id,
                        nome,
                        descricao
                    )
                `)
                .order("created_at", {
                    ascending: false,
                }),
        ]);

        if (igrejasResult.error) {
            throw igrejasResult.error;
        }

        if (pessoasResult.error) {
            throw pessoasResult.error;
        }

        if (classesResult.error) {
            throw classesResult.error;
        }

        if (assinaturasResult.error) {
            throw assinaturasResult.error;
        }

        const igrejas = igrejasResult.data ?? [];
        const pessoas = pessoasResult.data ?? [];
        const classes = classesResult.data ?? [];
        const assinaturas = assinaturasResult.data ?? [];

        return igrejas.map((igreja) => {

            const pessoasIgreja = pessoas.filter(
                (pessoa) =>
                    pessoa.igreja_id === igreja.id &&
                    pessoa.ativo === true
            );

            const classesIgreja = classes.filter(
                (classe) =>
                    classe.igreja_id === igreja.id &&
                    classe.ativa === true
            );

            const assinatura = assinaturas.find(
                (item) =>
                    item.igreja_id === igreja.id &&
                    [
                        "ATIVA",
                        "ATIVO",
                        "ACTIVE",
                    ].includes(
                        String(item.status).toUpperCase()
                    )
            ) ?? null;

            return {
                id: igreja.id,
                nome: igreja.nome,
                sigla: igreja.sigla,
                telefone: igreja.telefone,
                email: igreja.email,
                ativa: igreja.ativa,
                created_at: igreja.created_at,

                pessoas: pessoasIgreja.length,

                alunos: pessoasIgreja.filter(
                    (pessoa) =>
                        pessoa.perfil === "ALUNO"
                ).length,

                professores: pessoasIgreja.filter(
                    (pessoa) =>
                        pessoa.perfil === "PROFESSOR"
                ).length,

                administradores: pessoasIgreja.filter(
                    (pessoa) =>
                        pessoa.perfil === "ADMIN"
                ).length,

                pastores: pessoasIgreja.filter(
                    (pessoa) =>
                        pessoa.perfil === "PASTOR"
                ).length,

                superintendentes: pessoasIgreja.filter(
                    (pessoa) =>
                        pessoa.perfil === "SUPERINTENDENTE"
                ).length,

                secretarios: pessoasIgreja.filter(
                    (pessoa) =>
                        pessoa.perfil === "SECRETARIO"
                ).length,

                classes: classesIgreja.length,

                assinatura: assinatura
                    ? {
                        id: assinatura.id,
                        status: assinatura.status,
                        inicio_em: assinatura.inicio_em,
                        fim_em: assinatura.fim_em,
                        plano: Array.isArray(
                            assinatura.plano
                        )
                            ? assinatura.plano[0] ?? null
                            : assinatura.plano ?? null,
                    }
                    : null,
            };
        });
    }
}