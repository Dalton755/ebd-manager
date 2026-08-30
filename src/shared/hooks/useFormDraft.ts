import {
    useEffect,
    useRef,
    useState,
} from "react";


function carregarRascunho<
    T extends Record<string, unknown>
>(
    chave: string,
    valoresIniciais: T
): {
    valores: T;
    recuperado: boolean;
} {

    try {

        const salvo =
            localStorage.getItem(
                chave
            );


        if (salvo) {

            const dadosSalvos =
                JSON.parse(
                    salvo
                ) as Partial<T>;


            return {
                valores: {
                    ...valoresIniciais,
                    ...dadosSalvos,
                },
                recuperado: true,
            };
        }

    } catch (error) {

        console.error(
            "Erro ao recuperar rascunho:",
            error
        );
    }


    return {
        valores:
            valoresIniciais,

        recuperado:
            false,
    };
}


export function useFormDraft<
    T extends Record<string, unknown>
>(
    chave: string,
    valoresIniciais: T
) {

    const valoresIniciaisRef =
        useRef(
            valoresIniciais
        );


    valoresIniciaisRef.current =
        valoresIniciais;


    const estadoInicial =
        carregarRascunho(
            chave,
            valoresIniciais
        );


    const [
        valores,
        setValores,
    ] =
        useState<T>(
            estadoInicial.valores
        );


    const [
        rascunhoRecuperado,
        setRascunhoRecuperado,
    ] =
        useState(
            estadoInicial.recuperado
        );


    const chaveAnteriorRef =
        useRef(
            chave
        );


    const ignorarProximaGravacaoRef =
        useRef(
            false
        );


    /*
     * Se a chave mudar, recuperamos o rascunho
     * correspondente à nova tela/formulário.
     *
     * Isso evita misturar, por exemplo:
     *
     * nova aula de Adultos
     * com
     * nova aula de Jovens.
     */
    useEffect(() => {

        if (
            chaveAnteriorRef.current ===
            chave
        ) {
            return;
        }


        chaveAnteriorRef.current =
            chave;


        const resultado =
            carregarRascunho(
                chave,
                valoresIniciaisRef.current
            );


        ignorarProximaGravacaoRef.current =
            true;


        setValores(
            resultado.valores
        );


        setRascunhoRecuperado(
            resultado.recuperado
        );

    }, [
        chave,
    ]);


    /*
     * Salva automaticamente toda alteração.
     */
    useEffect(() => {

        if (
            ignorarProximaGravacaoRef.current
        ) {

            ignorarProximaGravacaoRef.current =
                false;

            return;
        }


        try {

            localStorage.setItem(
                chave,
                JSON.stringify(
                    valores
                )
            );

        } catch (error) {

            console.error(
                "Erro ao salvar rascunho:",
                error
            );
        }

    }, [
        chave,
        valores,
    ]);


    function limparRascunho() {

        try {

            localStorage.removeItem(
                chave
            );


            setRascunhoRecuperado(
                false
            );


            /*
             * Evita que a próxima alteração,
             * normalmente a limpeza do formulário
             * após salvar, recrie imediatamente
             * o rascunho apagado.
             */
            ignorarProximaGravacaoRef.current =
                true;

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
        rascunhoRecuperado,
    };
}