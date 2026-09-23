import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ImagePlus,
    Trash2,
} from "lucide-react";

import {
    toast,
} from "sonner";

import {
    LessonImageService,
} from "../services/LessonImageService";


type Props = {
    existingPath?: string | null;
    arquivo: File | null;
    onArquivoChange: (
        arquivo: File | null
    ) => void;
    removida: boolean;
    onRemovidaChange: (
        removida: boolean
    ) => void;
    posicaoX: number;
    posicaoY: number;
    zoom: number;
    onPosicaoXChange: (
        valor: number
    ) => void;
    onPosicaoYChange: (
        valor: number
    ) => void;
    onZoomChange: (
        valor: number
    ) => void;
    disabled?: boolean;
};


export function LessonImageEditor({
    existingPath,
    arquivo,
    onArquivoChange,
    removida,
    onRemovidaChange,
    posicaoX,
    posicaoY,
    zoom,
    onPosicaoXChange,
    onPosicaoYChange,
    onZoomChange,
    disabled = false,
}: Props) {

    const [
        urlExistente,
        setUrlExistente,
    ] =
        useState<string | null>(
            null
        );


    useEffect(() => {

        let ativo =
            true;


        if (
            !existingPath ||
            removida ||
            arquivo
        ) {

            setUrlExistente(
                null
            );

            return;
        }


        void LessonImageService
            .gerarUrl(
                existingPath
            )
            .then(
                (
                    url
                ) => {

                    if (ativo) {
                        setUrlExistente(
                            url
                        );
                    }
                }
            )
            .catch(
                (
                    error
                ) =>
                    console.error(
                        "[IMAGEM AULA] Preview existente:",
                        error
                    )
            );


        return () => {
            ativo =
                false;
        };

    }, [
        existingPath,
        removida,
        arquivo,
    ]);


    const urlArquivo =
        useMemo(
            () =>
                arquivo
                    ? URL.createObjectURL(
                        arquivo
                    )
                    : null,
            [
                arquivo,
            ]
        );


    useEffect(() => {

        return () => {

            if (
                urlArquivo
            ) {
                URL.revokeObjectURL(
                    urlArquivo
                );
            }
        };

    }, [
        urlArquivo,
    ]);


    const previewUrl =
        urlArquivo ??
        (
            removida
                ? null
                : urlExistente
        );


    function selecionarArquivo(
        event:
            React.ChangeEvent<HTMLInputElement>
    ) {

        const selecionado =
            event.target
                .files?.[0] ??
            null;

        event.target.value =
            "";


        if (!selecionado) {
            return;
        }


        try {

            LessonImageService
                .validarArquivo(
                    selecionado
                );

            onArquivoChange(
                selecionado
            );

            onRemovidaChange(
                false
            );


        } catch (error) {

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Imagem inválida."
            );
        }
    }


    const temImagem =
        Boolean(
            previewUrl
        );


    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div>

                    <p className="text-sm font-bold text-slate-800">
                        Imagem da aula
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        JPG, PNG ou WEBP · até 10 MB
                    </p>

                </div>


                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">

                    <ImagePlus className="h-4 w-4" />

                    {temImagem
                        ? "Trocar imagem"
                        : "Escolher imagem"}

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        disabled={
                            disabled
                        }
                        onChange={
                            selecionarArquivo
                        }
                    />

                </label>

            </div>


            {previewUrl ? (

                <>

                    <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-slate-200 shadow-inner">

                        <img
                            src={
                                previewUrl
                            }
                            alt="Prévia da imagem da aula"
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{
                                objectPosition:
                                    `${posicaoX}% ${posicaoY}%`,

                                transform:
                                    `scale(${zoom})`,

                                transformOrigin:
                                    `${posicaoX}% ${posicaoY}%`,
                            }}
                        />

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white">
                            É assim que a imagem aparecerá nos cards.
                        </div>

                    </div>


                    <div className="mt-4 grid gap-4 sm:grid-cols-3">

                        <label className="text-xs font-semibold text-slate-600">

                            Zoom
                            <span className="ml-1 text-slate-400">
                                {zoom.toFixed(
                                    2
                                )}x
                            </span>

                            <input
                                type="range"
                                min="1"
                                max="2"
                                step="0.05"
                                value={
                                    zoom
                                }
                                disabled={
                                    disabled
                                }
                                onChange={(
                                    event
                                ) =>
                                    onZoomChange(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                                className="mt-2 w-full accent-blue-600"
                            />

                        </label>


                        <label className="text-xs font-semibold text-slate-600">

                            Horizontal
                            <span className="ml-1 text-slate-400">
                                {posicaoX}%
                            </span>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={
                                    posicaoX
                                }
                                disabled={
                                    disabled
                                }
                                onChange={(
                                    event
                                ) =>
                                    onPosicaoXChange(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                                className="mt-2 w-full accent-blue-600"
                            />

                        </label>


                        <label className="text-xs font-semibold text-slate-600">

                            Vertical
                            <span className="ml-1 text-slate-400">
                                {posicaoY}%
                            </span>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={
                                    posicaoY
                                }
                                disabled={
                                    disabled
                                }
                                onChange={(
                                    event
                                ) =>
                                    onPosicaoYChange(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                                className="mt-2 w-full accent-blue-600"
                            />

                        </label>

                    </div>


                    <button
                        type="button"
                        disabled={
                            disabled
                        }
                        onClick={() => {

                            onArquivoChange(
                                null
                            );

                            onRemovidaChange(
                                true
                            );
                        }}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Remover imagem da aula
                    </button>

                </>

            ) : (

                <div className="mt-4 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">

                    <div className="px-6">

                        <ImagePlus className="mx-auto h-8 w-8 text-slate-300" />

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                            Nenhuma imagem definida
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            A aula continuará funcionando normalmente sem imagem.
                        </p>

                    </div>

                </div>

            )}

        </section>
    );
}
