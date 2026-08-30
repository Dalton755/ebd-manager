import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    OnboardingService,
    type TutorialCodigo,
} from "../services/OnboardingService";


type Params = {
    pessoaId?: string | null;

    tutorial:
        TutorialCodigo;

    versao?: number;

    habilitado?: boolean;
};


export function useOnboardingTutorial({
    pessoaId,
    tutorial,
    versao = 1,
    habilitado = true,
}: Params) {

    const [
        aberto,
        setAberto,
    ] =
        useState(false);


    const [
        carregando,
        setCarregando,
    ] =
        useState(true);


    useEffect(() => {

        let ativo =
            true;


        async function verificar() {

            if (
                !pessoaId ||
                !habilitado
            ) {

                if (ativo) {
                    setAberto(false);
                    setCarregando(false);
                }

                return;
            }


            try {

                setCarregando(true);


                const deveExibir =
                    await OnboardingService
                        .deveExibir(
                            pessoaId,
                            tutorial,
                            versao
                        );


                if (!ativo) {
                    return;
                }


                if (deveExibir) {

                    await OnboardingService
                        .iniciar(
                            pessoaId,
                            tutorial,
                            versao
                        );


                    if (ativo) {
                        setAberto(true);
                    }

                } else {

                    setAberto(false);

                }


            } catch (error) {

                console.error(
                    `Erro ao verificar tutorial ${tutorial}:`,
                    error
                );


                /*
                 * Falha no onboarding nunca deve
                 * impedir o uso normal do sistema.
                 */
                if (ativo) {
                    setAberto(false);
                }


            } finally {

                if (ativo) {
                    setCarregando(false);
                }

            }

        }


        void verificar();


        return () => {
            ativo = false;
        };

    }, [
        pessoaId,
        tutorial,
        versao,
        habilitado,
    ]);


    const concluir =
        useCallback(
            async () => {

                if (!pessoaId) {
                    return;
                }


                await OnboardingService
                    .concluir(
                        pessoaId,
                        tutorial,
                        versao
                    );


                setAberto(false);

            },
            [
                pessoaId,
                tutorial,
                versao,
            ]
        );


    const pular =
        useCallback(
            async () => {

                if (!pessoaId) {
                    return;
                }


                await OnboardingService
                    .pular(
                        pessoaId,
                        tutorial,
                        versao
                    );


                setAberto(false);

            },
            [
                pessoaId,
                tutorial,
                versao,
            ]
        );


    /*
     * Permitirá futuramente:
     * Ajuda → Rever tutorial.
     */
    const reabrir =
        useCallback(
            () => {
                setAberto(true);
            },
            []
        );


    return {
        aberto,
        carregando,
        concluir,
        pular,
        reabrir,
        setAberto,
    };
}