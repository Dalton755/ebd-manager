import {
    supabase,
} from "@/shared/lib/supabase/client";


export type TutorialCodigo =
    | "PESSOAS"
    | "CLASSES"
    | "TRIMESTRES"
    | "AULAS"
    | "PRESENCAS"
    | "DASHBOARD";


export type OnboardingRegistro = {
    id: string;
    pessoa_id: string;
    tutorial: string;
    versao: number;

    iniciado_em: string | null;
    concluido_em: string | null;
    pulado_em: string | null;

    created_at: string;
    updated_at: string;
};


export class OnboardingService {

    static async buscar(
        pessoaId: string,
        tutorial: TutorialCodigo,
        versao = 1
    ): Promise<OnboardingRegistro | null> {

        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("onboarding_usuarios")
                .select(`
                    id,
                    pessoa_id,
                    tutorial,
                    versao,
                    iniciado_em,
                    concluido_em,
                    pulado_em,
                    created_at,
                    updated_at
                `)
                .eq(
                    "pessoa_id",
                    pessoaId
                )
                .eq(
                    "tutorial",
                    tutorial
                )
                .eq(
                    "versao",
                    versao
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data;
    }


    static async deveExibir(
        pessoaId: string,
        tutorial: TutorialCodigo,
        versao = 1
    ): Promise<boolean> {

        const registro =
            await OnboardingService
                .buscar(
                    pessoaId,
                    tutorial,
                    versao
                );


        if (!registro) {
            return true;
        }


        return (
            !registro.concluido_em &&
            !registro.pulado_em
        );
    }


    static async iniciar(
        pessoaId: string,
        tutorial: TutorialCodigo,
        versao = 1
    ): Promise<void> {

        const registro =
            await OnboardingService
                .buscar(
                    pessoaId,
                    tutorial,
                    versao
                );


        /*
         * Já existe.
         * Não recria nem apaga progresso.
         */
        if (registro) {

            if (!registro.iniciado_em) {

                const {
                    error,
                } =
                    await supabase
                        .schema("ebd")
                        .from("onboarding_usuarios")
                        .update({
                            iniciado_em:
                                new Date().toISOString(),

                            updated_at:
                                new Date().toISOString(),
                        })
                        .eq(
                            "id",
                            registro.id
                        );


                if (error) {
                    throw error;
                }

            }


            return;
        }


        const agora =
            new Date().toISOString();


        const {
            error,
        } =
            await supabase
                .schema("ebd")
                .from("onboarding_usuarios")
                .insert({
                    pessoa_id:
                        pessoaId,

                    tutorial,

                    versao,

                    iniciado_em:
                        agora,

                    updated_at:
                        agora,
                });


        if (error) {
            throw error;
        }
    }


    static async concluir(
        pessoaId: string,
        tutorial: TutorialCodigo,
        versao = 1
    ): Promise<void> {

        const agora =
            new Date().toISOString();


        const registro =
            await OnboardingService
                .buscar(
                    pessoaId,
                    tutorial,
                    versao
                );


        if (!registro) {

            const {
                error,
            } =
                await supabase
                    .schema("ebd")
                    .from("onboarding_usuarios")
                    .insert({
                        pessoa_id:
                            pessoaId,

                        tutorial,

                        versao,

                        iniciado_em:
                            agora,

                        concluido_em:
                            agora,

                        updated_at:
                            agora,
                    });


            if (error) {
                throw error;
            }


            return;
        }


        const {
            error,
        } =
            await supabase
                .schema("ebd")
                .from("onboarding_usuarios")
                .update({
                    concluido_em:
                        agora,

                    pulado_em:
                        null,

                    updated_at:
                        agora,
                })
                .eq(
                    "id",
                    registro.id
                );


        if (error) {
            throw error;
        }
    }


    static async pular(
        pessoaId: string,
        tutorial: TutorialCodigo,
        versao = 1
    ): Promise<void> {

        const agora =
            new Date().toISOString();


        const registro =
            await OnboardingService
                .buscar(
                    pessoaId,
                    tutorial,
                    versao
                );


        if (!registro) {

            const {
                error,
            } =
                await supabase
                    .schema("ebd")
                    .from("onboarding_usuarios")
                    .insert({
                        pessoa_id:
                            pessoaId,

                        tutorial,

                        versao,

                        iniciado_em:
                            agora,

                        pulado_em:
                            agora,

                        updated_at:
                            agora,
                    });


            if (error) {
                throw error;
            }


            return;
        }


        const {
            error,
        } =
            await supabase
                .schema("ebd")
                .from("onboarding_usuarios")
                .update({
                    pulado_em:
                        agora,

                    updated_at:
                        agora,
                })
                .eq(
                    "id",
                    registro.id
                );


        if (error) {
            throw error;
        }
    }

}