import { useEffect, useState } from "react";

export function useFormDraft<T>(
    chave: string,
    valoresIniciais: T
) {
    const [valores, setValores] = useState<T>(() => {

        try {

            const salvo =
                localStorage.getItem(chave);

            if (salvo) {
                return JSON.parse(salvo) as T;
            }

        } catch (error) {

            console.error(
                "Erro ao recuperar rascunho:",
                error
            );
        }

        return valoresIniciais;
    });


    useEffect(() => {

        try {

            localStorage.setItem(
                chave,
                JSON.stringify(valores)
            );

        } catch (error) {

            console.error(
                "Erro ao salvar rascunho:",
                error
            );
        }

    }, [chave, valores]);


    function limparRascunho() {

        try {

            localStorage.removeItem(
                chave
            );

        } catch (error) {

            console.error(
                "Erro ao limpar rascunho:",
                error
            );
        }
    }


    return {
        valores,
        setValores,
        limparRascunho,
    };
}