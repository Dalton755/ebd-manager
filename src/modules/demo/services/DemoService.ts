import {
    supabase,
} from "@/shared/lib/supabase/client";


export type DemoRegistrationInput = {
    nome: string;
    email: string;
    password: string;
};


export type DemoConversionInput = {
    igreja: {
        nome: string;
        sigla: string;
        cnpj: string;
        telefone: string;
        email: string;
    };

    aceites: {
        termos: boolean;
        privacidade: boolean;
        lgpd: boolean;
        representacao: boolean;
    };
};


export class DemoService {

    static async criarDemonstracao(
        dados: DemoRegistrationInput
    ) {

        const {
            data,
            error,
        } =
            await supabase.functions
                .invoke(
                    "demo-register",
                    {
                        body:
                            dados,
                    }
                );


        if (error) {
            throw error;
        }


        if (
            data?.error
        ) {
            throw new Error(
                data.error
            );
        }


        return data;
    }


    static async converterEmIgreja(
        dados: DemoConversionInput
    ) {

        const {
            data,
            error,
        } =
            await supabase.functions
                .invoke(
                    "demo-convert",
                    {
                        body:
                            dados,
                    }
                );


        if (error) {
            throw error;
        }


        if (
            data?.error
        ) {
            throw new Error(
                data.error
            );
        }


        return data;
    }
}
