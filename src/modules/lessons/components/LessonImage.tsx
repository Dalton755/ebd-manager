import {
    useEffect,
    useState,
} from "react";

import {
    Download,
    Loader2,
} from "lucide-react";

import {
    toast,
} from "sonner";

import {
    LessonImageService,
} from "../services/LessonImageService";


type ImagemDaAula = {
    numero: number;
    titulo: string;
    imagem_path?: string | null;
    imagem_nome?: string | null;
    imagem_posicao_x?: number | null;
    imagem_posicao_y?: number | null;
    imagem_zoom?: number | null;
};


type Props = {
    aula: ImagemDaAula;
    className?: string;
    downloadable?: boolean;
    downloadClassName?: string;
};


export function LessonImage({
    aula,
    className = "",
    downloadable = false,
    downloadClassName = "",
}: Props) {

    const [
        url,
        setUrl,
    ] =
        useState<string | null>(
            null
        );

    const [
        carregandoDownload,
        setCarregandoDownload,
    ] =
        useState(false);


    useEffect(() => {

        let ativo =
            true;


        if (
            !aula.imagem_path
        ) {

            setUrl(
                null
            );

            return;
        }


        void LessonImageService
            .gerarUrl(
                aula.imagem_path
            )
            .then(
                (
                    signedUrl
                ) => {

                    if (ativo) {
                        setUrl(
                            signedUrl
                        );
                    }
                }
            )
            .catch(
                (
                    error
                ) => {

                    console.error(
                        "[IMAGEM AULA] Não foi possível gerar URL:",
                        error
                    );

                    if (ativo) {
                        setUrl(
                            null
                        );
                    }
                }
            );


        return () => {
            ativo =
                false;
        };

    }, [
        aula.imagem_path,
    ]);


    if (
        !aula.imagem_path ||
        !url
    ) {
        return null;
    }


    const x =
        aula.imagem_posicao_x ??
        50;

    const y =
        aula.imagem_posicao_y ??
        50;

    const zoom =
        aula.imagem_zoom ??
        1;


    async function baixar(
        event:
            React.MouseEvent<HTMLButtonElement>
    ) {

        event.preventDefault();
        event.stopPropagation();


        try {

            setCarregandoDownload(
                true
            );

            await LessonImageService
                .baixarImagem(
                    aula
                );


        } catch (error) {

            console.error(
                "[IMAGEM AULA] Erro no download:",
                error
            );

            toast.error(
                "Não foi possível baixar a imagem da aula."
            );

        } finally {

            setCarregandoDownload(
                false
            );
        }
    }


    return (
        <div
            className={
                `relative overflow-hidden bg-slate-100 ${className}`
            }
        >

            <img
                src={
                    url
                }
                alt={
                    `Imagem da aula ${aula.numero} — ${aula.titulo}`
                }
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                    objectPosition:
                        `${x}% ${y}%`,

                    transform:
                        `scale(${zoom})`,

                    transformOrigin:
                        `${x}% ${y}%`,
                }}
                loading="lazy"
            />


            {downloadable && (

                <button
                    type="button"
                    onClick={
                        baixar
                    }
                    disabled={
                        carregandoDownload
                    }
                    className={
                        downloadClassName ||
                        "absolute bottom-2 right-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950/75 px-3 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-slate-950 disabled:opacity-60"
                    }
                    title="Baixar imagem da aula"
                >

                    {carregandoDownload ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}

                    Baixar

                </button>

            )}

        </div>
    );
}
