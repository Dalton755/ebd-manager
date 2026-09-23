import {
    supabase,
} from "@/shared/lib/supabase/client";


export type ClassJoinResult = {
    pessoa: {
        id: string;
        nome: string;
        email: string;
        perfil: string;
        classe_id: string | null;
        igreja_id: string | null;
    };

    classe: {
        id: string;
        nome: string;
    };

    igreja: {
        id: string;
        nome: string;
    };
};


export class ClassAccessService {

    static async entrar(
        codigo: string
    ): Promise<ClassJoinResult> {

        const numero =
            codigo.replace(
                /\D/g,
                ""
            );


        const {
            data,
            error,
        } =
            await supabase
                .schema("ebd")
                .rpc(
                    "entrar_em_classe_por_codigo",
                    {
                        p_codigo:
                            numero,
                    }
                );


        if (error) {

            throw new Error(
                error.message ||
                "Não foi possível entrar na classe."
            );
        }


        if (!data) {

            throw new Error(
                "Não foi possível identificar a classe."
            );
        }


        return (
            data as ClassJoinResult
        );
    }
}
