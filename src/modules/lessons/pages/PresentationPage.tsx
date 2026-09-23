import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ArrowLeft,
    BookOpenText,
    ChevronLeft,
    ChevronRight,
    FileText,
    ImagePlus,
    Loader2,
    Maximize,
    Minimize,
    Save,
    Square,
    RotateCcw,
    Trash2,
} from "lucide-react";

import {
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from
    "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
    PresentationService,
} from "@/modules/lessons/services/PresentationService";

import {
    PresentationEditorService,
} from "@/modules/lessons/services/PresentationEditorService";

import {
    PresentationRepository,
} from "@/modules/lessons/repositories/PresentationRepository";

import type {
    ElementoApresentacao,
} from "@/modules/lessons/types/EditorApresentacao";

import {
    extrairReferenciasBiblicas,
} from "@/modules/lessons/utils/bibleReferenceParser";

import type {
    ReferenciaBiblica,
} from "@/modules/lessons/utils/bibleReferenceParser";

import {
    BibleService,
} from "@/modules/bible/services/BibleService";

import type {
    PassagemBiblica,
} from "@/modules/bible/types/Bible";


pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker;

type TextoPdfOverlay = {
    id: string;
    texto: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
};


type ReferenciaOverlay = {
    id: string;
    original: string;
    rotulo: string;
    referencia: ReferenciaBiblica;
    left: number;
    top: number;
    width: number;
    height: number;
};

type EstadoApresentacaoSalvo = {
    pagina: number;
    tamanhoFonteBiblia: number;
    referenciaAberta: ReferenciaBiblica | null;
};

function chaveEstadoApresentacao(
    aulaId: string,
    modo:
        | "aula"
        | "apresentacao"
        | "edicao"
) {
    return `ebd:${modo}:${aulaId}`;
}

function lerEstadoApresentacao(
    aulaId: string,
    modo:
        | "aula"
        | "apresentacao"
        | "edicao"
): EstadoApresentacaoSalvo | null {

    try {

        const salvo =
            localStorage.getItem(
                chaveEstadoApresentacao(
                    aulaId,
                    modo
                )
            );

        if (!salvo) {
            return null;
        }

        return JSON.parse(
            salvo
        ) as EstadoApresentacaoSalvo;

    } catch {

        return null;

    }
}


export function PresentationPage() {

    const { aulaId } =
        useParams<{
            aulaId: string;
        }>();

    const { pessoa } =
        useAuth();

    const navigate =
        useNavigate();

    const [searchParams] =
        useSearchParams();

    const modoParam =
        searchParams.get("modo");

    const modo:
        | "aula"
        | "apresentacao"
        | "edicao" =
        modoParam === "aula"
            ? "aula"
            : modoParam === "edicao"
                ? "edicao"
                : "apresentacao";

    const modoAula =
        modo === "aula";

    const modoEdicao =
        modo === "edicao";

    const canvasRef =
        useRef<HTMLCanvasElement | null>(
            null
        );

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const presentationRootRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const estadoRestauradoRef =
        useRef(false);

    const inputImagemRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const [
        documento,
        setDocumento,
    ] = useState<
        pdfjsLib.PDFDocumentProxy | null
    >(null);

    const [
        paginaAtual,
        setPaginaAtual,
    ] = useState(1);

    const [
        totalPaginas,
        setTotalPaginas,
    ] = useState(0);

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        renderizando,
        setRenderizando,
    ] = useState(false);

    const [
        telaCheiaAtiva,
        setTelaCheiaAtiva,
    ] = useState(false);

    const [
        versaoLayout,
        setVersaoLayout,
    ] = useState(0);

    const [
        urlsImagensEditor,
        setUrlsImagensEditor,
    ] = useState<
        Record<string, string>
    >({});

    const [
        erro,
        setErro,
    ] = useState<string | null>(
        null
    );

    const [
        referenciasOverlay,
        setReferenciasOverlay,
    ] = useState<ReferenciaOverlay[]>([]);

    const [
        editandoConteudoPdf,
        setEditandoConteudoPdf,
    ] = useState(false);

    const [
        textosPdfOverlay,
        setTextosPdfOverlay,
    ] = useState<TextoPdfOverlay[]>(
        []
    );

    const [
        referenciaSelecionada,
        setReferenciaSelecionada,
    ] = useState<ReferenciaBiblica | null>(
        null
    );

    const [
        passagemBiblica,
        setPassagemBiblica,
    ] = useState<PassagemBiblica | null>(
        null
    );

    const [
        carregandoPassagem,
        setCarregandoPassagem,
    ] = useState(false);

    const [
        erroPassagem,
        setErroPassagem,
    ] = useState<string | null>(
        null
    );

    const [
        tamanhoFonteBiblia,
        setTamanhoFonteBiblia,
    ] = useState(22);


    const [
        apresentacaoId,
        setApresentacaoId,
    ] = useState<string | null>(
        null
    );

    const [
        elementosEdicao,
        setElementosEdicao,
    ] = useState<ElementoApresentacao[]>(
        []
    );

    const [
        elementosPublicados,
        setElementosPublicados,
    ] = useState<ElementoApresentacao[]>(
        []
    );

    const [
        elementoSelecionadoId,
        setElementoSelecionadoId,
    ] = useState<string | null>(
        null
    );

    const [
        historicoEdicao,
        setHistoricoEdicao,
    ] = useState<ElementoApresentacao[][]>(
        []
    );

    const interacaoRef = useRef<{
        tipo: "mover" | "redimensionar";
        elementoId: string;
        pointerId: number;
        inicioX: number;
        inicioY: number;
        original: ElementoApresentacao;
    } | null>(null);

    const elementoSelecionado =
        elementosEdicao.find(
            (elemento) =>
                elemento.id ===
                elementoSelecionadoId
        ) ?? null;

    const [
        carregandoRascunho,
        setCarregandoRascunho,
    ] = useState(false);

    const [
        erroRascunho,
        setErroRascunho,
    ] = useState<string | null>(
        null
    );

    const [
        publicando,
        setPublicando,
    ] = useState(false);

    const [
        publicacaoConcluida,
        setPublicacaoConcluida,
    ] = useState(false);

    function registrarHistorico() {

        setHistoricoEdicao(
            (historico) => [
                ...historico.slice(-49),
                elementosEdicao.map(
                    (elemento) => ({
                        ...elemento,
                    })
                ),
            ]
        );
    }


    function desfazerEdicao() {

        setHistoricoEdicao(
            (historico) => {

                if (
                    historico.length === 0
                ) {
                    return historico;
                }

                const anterior =
                    historico[
                    historico.length - 1
                    ];

                setElementosEdicao(
                    anterior.map(
                        (elemento) => ({
                            ...elemento,
                        })
                    )
                );

                setElementoSelecionadoId(
                    null
                );

                return historico.slice(
                    0,
                    -1
                );
            }
        );
    }


    function atualizarElemento(
        id: string,
        alteracoes:
            Partial<ElementoApresentacao>
    ) {

        setElementosEdicao(
            (atuais) =>
                atuais.map(
                    (elemento) =>
                        elemento.id === id
                            ? {
                                ...elemento,
                                ...alteracoes,
                            }
                            : elemento
                )
        );
    }


    function excluirElemento(
        id: string
    ) {

        registrarHistorico();

        setElementosEdicao(
            (atuais) =>
                atuais.filter(
                    (elemento) =>
                        elemento.id !== id
                )
        );

        setElementoSelecionadoId(
            null
        );
    }

    function editarTextoOriginalPdf(
        textoPdf: TextoPdfOverlay
    ) {

        const canvas =
            canvasRef.current;

        if (!canvas) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return;
        }

        registrarHistorico();

        const x =
            Math.max(
                0,
                Math.min(
                    textoPdf.left /
                    rect.width,
                    0.99
                )
            );

        const y =
            Math.max(
                0,
                Math.min(
                    textoPdf.top /
                    rect.height,
                    0.99
                )
            );

        const largura =
            Math.max(
                0.03,
                Math.min(
                    textoPdf.width /
                    rect.width,
                    1 - x
                )
            );

        const altura =
            Math.max(
                0.025,
                Math.min(
                    textoPdf.height /
                    rect.height,
                    1 - y
                )
            );

        const coberturaId =
            crypto.randomUUID();

        const textoId =
            crypto.randomUUID();


        const cobertura:
            ElementoApresentacao = {

            id:
                coberturaId,

            pagina:
                paginaAtual,

            tipo:
                "COBERTURA",

            x,
            y,

            largura,
            altura,

            conteudo: "",

            cor_fundo:
                "#ffffff",

            opacidade: 1,
        };


        const texto:
            ElementoApresentacao = {

            id:
                textoId,

            pagina:
                paginaAtual,

            tipo:
                "TEXTO",

            x,
            y,

            largura:
                Math.min(
                    Math.max(
                        largura,
                        0.08
                    ),
                    1 - x
                ),

            altura:
                Math.min(
                    Math.max(
                        altura * 1.35,
                        0.035
                    ),
                    1 - y
                ),

            conteudo:
                textoPdf.texto,

            tamanho_fonte:
                Math.max(
                    10,
                    Math.round(
                        textoPdf.fontSize
                    )
                ),

            alinhamento:
                "left",

            cor_texto:
                "#111827",

            cor_fundo:
                "transparent",

            opacidade: 1,
        };


        setElementosEdicao(
            (atuais) => [
                ...atuais,
                cobertura,
                texto,
            ]
        );

        setElementoSelecionadoId(
            textoId
        );

        setEditandoConteudoPdf(
            false
        );
    }

    function adicionarElemento(
        tipo: ElementoApresentacao["tipo"]
    ) {

        const novoElemento:
            ElementoApresentacao = {
            id: crypto.randomUUID(),
            pagina: paginaAtual,

            x: 0.15,
            y: 0.15,

            largura: 0.35,
            altura: 0.1,

            tipo,

            conteudo:
                tipo === "TEXTO"
                    ? "Novo texto"
                    : tipo ===
                        "REFERENCIA_BIBLICA"
                        ? "Jo 3.16"
                        : "",

            tamanho_fonte:
                tipo === "COBERTURA"
                    ? undefined
                    : 24,

            alinhamento: "left",

            cor_texto: "#111827",

            cor_fundo:
                tipo === "COBERTURA"
                    ? "#ffffff"
                    : "transparent",

            opacidade: 1,
        };

        registrarHistorico();


        setElementosEdicao(
            (atuais) => [
                ...atuais,
                novoElemento,
            ]
        );

        setElementoSelecionadoId(
            novoElemento.id
        );
    }

    function iniciarInteracao(
        event:
            React.PointerEvent<HTMLDivElement>,
        elemento: ElementoApresentacao,
        tipo: "mover" | "redimensionar"
    ) {

        event.preventDefault();
        event.stopPropagation();

        registrarHistorico();

        setElementoSelecionadoId(
            elemento.id
        );

        event.currentTarget
            .setPointerCapture(
                event.pointerId
            );

        interacaoRef.current = {
            tipo,
            elementoId:
                elemento.id,
            pointerId:
                event.pointerId,
            inicioX:
                event.clientX,
            inicioY:
                event.clientY,
            original: {
                ...elemento,
            },
        };
    }


    function moverInteracao(
        event:
            React.PointerEvent<HTMLDivElement>
    ) {

        const interacao =
            interacaoRef.current;

        if (
            !interacao ||
            interacao.pointerId !==
            event.pointerId
        ) {
            return;
        }

        const canvas =
            canvasRef.current;

        if (!canvas) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return;
        }

        const deltaX =
            (
                event.clientX -
                interacao.inicioX
            ) /
            rect.width;

        const deltaY =
            (
                event.clientY -
                interacao.inicioY
            ) /
            rect.height;

        const original =
            interacao.original;

        if (
            interacao.tipo === "mover"
        ) {

            const novoX =
                Math.max(
                    0,
                    Math.min(
                        1 -
                        original.largura,
                        original.x +
                        deltaX
                    )
                );

            const novoY =
                Math.max(
                    0,
                    Math.min(
                        1 -
                        original.altura,
                        original.y +
                        deltaY
                    )
                );

            atualizarElemento(
                interacao.elementoId,
                {
                    x: novoX,
                    y: novoY,
                }
            );

            return;
        }

        const novaLargura =
            Math.max(
                0.05,
                Math.min(
                    1 - original.x,
                    original.largura +
                    deltaX
                )
            );

        const novaAltura =
            Math.max(
                0.04,
                Math.min(
                    1 - original.y,
                    original.altura +
                    deltaY
                )
            );

        atualizarElemento(
            interacao.elementoId,
            {
                largura:
                    novaLargura,

                altura:
                    novaAltura,
            }
        );
    }


    function finalizarInteracao(
        event:
            React.PointerEvent<HTMLDivElement>
    ) {

        if (
            interacaoRef.current
                ?.pointerId !==
            event.pointerId
        ) {
            return;
        }

        interacaoRef.current =
            null;
    }

    async function adicionarImagem(
        arquivo: File
    ) {

        if (
            !aulaId ||
            !pessoa?.igreja_id
        ) {
            setErroRascunho(
                "Não foi possível identificar a aula ou a igreja."
            );

            return;
        }


        try {

            setErroRascunho(
                null
            );


            const upload =
                await PresentationRepository
                    .enviarImagemEditor(
                        arquivo,
                        pessoa.igreja_id,
                        aulaId
                    );


            const url =
                await PresentationRepository
                    .gerarUrlImagemEditor(
                        upload.path
                    );


            const imagem =
                await new Promise<
                    HTMLImageElement
                >(
                    (
                        resolve,
                        reject
                    ) => {

                        const img =
                            new Image();

                        img.onload =
                            () =>
                                resolve(
                                    img
                                );

                        img.onerror =
                            reject;

                        img.src =
                            url;
                    }
                );


            const proporcao =
                imagem.naturalWidth /
                imagem.naturalHeight;


            let largura =
                0.35;

            let altura =
                largura /
                proporcao;


            /*
             * Como largura e altura são
             * proporcionais ao slide e o
             * slide pode não ser quadrado,
             * limitamos aqui apenas o tamanho
             * inicial. Depois o usuário pode
             * redimensionar livremente.
             */
            altura =
                Math.max(
                    0.08,
                    Math.min(
                        altura,
                        0.5
                    )
                );


            const elemento:
                ElementoApresentacao = {

                id:
                    crypto.randomUUID(),

                pagina:
                    paginaAtual,

                tipo:
                    "IMAGEM",

                x: 0.15,
                y: 0.15,

                largura,
                altura,

                arquivo_path:
                    upload.path,

                arquivo_nome:
                    upload.nome,

                arquivo_tipo:
                    upload.tipo,

                opacidade: 1,
            };


            registrarHistorico();


            setUrlsImagensEditor(
                (atuais) => ({
                    ...atuais,

                    [upload.path]:
                        url,
                })
            );


            setElementosEdicao(
                (atuais) => [
                    ...atuais,
                    elemento,
                ]
            );


            setElementoSelecionadoId(
                elemento.id
            );


        } catch (error) {

            console.error(
                "[EDITOR] Erro ao adicionar imagem:",
                error
            );


            setErroRascunho(
                error instanceof Error
                    ? error.message
                    : "Não foi possível adicionar a imagem."
            );
        }
    }


    async function salvarRascunho() {

        if (
            !apresentacaoId ||
            !pessoa?.id
        ) {
            setErroRascunho(
                "Não foi possível identificar o usuário responsável pela edição."
            );

            return;
        }

        try {

            setErroRascunho(null);

            await PresentationEditorService
                .salvarRascunho({
                    apresentacaoId,

                    elementos:
                        elementosEdicao,

                    pessoaId:
                        pessoa.id,
                });

        } catch (error) {

            console.error(
                "[EDITOR] Erro ao salvar rascunho:",
                error
            );

            setErroRascunho(
                error instanceof Error
                    ? error.message
                    : "Não foi possível salvar o rascunho."
            );
        }
    }

    async function publicarApresentacao() {

        if (
            !apresentacaoId ||
            !pessoa?.id
        ) {
            setErroRascunho(
                "Não foi possível identificar a apresentação ou o usuário."
            );

            return;
        }


        try {

            setPublicando(true);
            setErroRascunho(null);
            setPublicacaoConcluida(false);


            /*
             * Primeiro persistimos exatamente
             * o que está aberto no editor.
             */
            await PresentationEditorService
                .salvarRascunho({
                    apresentacaoId,

                    elementos:
                        elementosEdicao,

                    pessoaId:
                        pessoa.id,
                });


            /*
             * A RPC cria o snapshot imutável
             * e troca versao_publicada_id
             * na mesma transação.
             */
            await PresentationEditorService
                .publicar(
                    apresentacaoId
                );


            setPublicacaoConcluida(
                true
            );


        } catch (error) {

            console.error(
                "[EDITOR] Erro ao publicar apresentação:",
                error
            );


            setErroRascunho(
                error instanceof Error
                    ? error.message
                    : "Não foi possível publicar a apresentação."
            );

        } finally {

            setPublicando(false);
        }
    }

    async function abrirReferenciaBiblica(
        referencia: ReferenciaBiblica
    ) {

        setReferenciaSelecionada(
            referencia
        );

        setPassagemBiblica(null);
        setErroPassagem(null);
        setCarregandoPassagem(true);

        try {

            const passagem =
                await BibleService
                    .buscarPassagem(
                        referencia,
                        "BLIVRE"
                    );

            setPassagemBiblica(
                passagem
            );

        } catch (error) {

            console.error(
                "Erro ao buscar passagem bíblica:",
                error
            );

            setErroPassagem(
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar o texto bíblico."
            );

        } finally {

            setCarregandoPassagem(false);

        }
    }

    useEffect(() => {

        if (!aulaId) {
            return;
        }

        if (!estadoRestauradoRef.current) {
            return;
        }

        const estado: EstadoApresentacaoSalvo = {
            pagina:
                paginaAtual,

            tamanhoFonteBiblia,

            referenciaAberta:
                referenciaSelecionada,
        };

        localStorage.setItem(
            chaveEstadoApresentacao(
                aulaId,
                modo
            ),
            JSON.stringify(
                estado
            )
        );

    }, [
        aulaId,
        modo,
        paginaAtual,
        tamanhoFonteBiblia,
        referenciaSelecionada,
    ]);


    useEffect(() => {

        let ativo = true;

        async function carregarPdf() {

            if (!aulaId) {
                setErro(
                    "Aula não identificada."
                );
                setCarregando(false);
                return;
            }

            try {

                setCarregando(true);
                setErro(null);

                const url =
    await PresentationService
        .gerarUrl(
            aulaId
        );

const resposta =
    await fetch(
        url,
        {
            cache: "no-store",
        }
    );

if (!resposta.ok) {
    throw new Error(
        `Não foi possível baixar o PDF atualizado. HTTP ${resposta.status}.`
    );
}

const arrayBuffer =
    await resposta.arrayBuffer();

if (
    arrayBuffer.byteLength === 0
) {
    throw new Error(
        "O PDF retornado pelo armazenamento está vazio."
    );
}

const tarefa =
    pdfjsLib.getDocument({
        data:
            new Uint8Array(
                arrayBuffer
            ),
    });

const pdf =
    await tarefa.promise;
                
                if (!ativo) {
                    return;
                }

                const estadoSalvo =
                    lerEstadoApresentacao(
                        aulaId,
                        modo
                    );

                const paginaSalva =
                    estadoSalvo?.pagina ?? 1;

                const paginaRestaurada =
                    Math.min(
                        Math.max(
                            paginaSalva,
                            1
                        ),
                        pdf.numPages
                    );

                setDocumento(pdf);

                setTotalPaginas(
                    pdf.numPages
                );

                setPaginaAtual(
                    paginaRestaurada
                );

                if (estadoSalvo) {

                    setTamanhoFonteBiblia(
                        Math.min(
                            Math.max(
                                estadoSalvo
                                    .tamanhoFonteBiblia ??
                                22,
                                18
                            ),
                            36
                        )
                    );

                    if (
                        estadoSalvo
                            .referenciaAberta
                    ) {
                        void abrirReferenciaBiblica(
                            estadoSalvo
                                .referenciaAberta
                        );
                    }
                }

                estadoRestauradoRef.current =
                    true;

            } catch (error) {

                console.error(
                    "[APRESENTAÇÃO] Erro ao carregar PDF:",
                    error
                );

                if (ativo) {
                    setErro(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar a apresentação."
                    );
                }

            } finally {

                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        void carregarPdf();

        return () => {
            ativo = false;
        };

    }, [aulaId, modo]);

    useEffect(() => {

        let ativo = true;

        async function carregarVersaoPublicada() {

            if (
                modoEdicao ||
                !aulaId
            ) {
                return;
            }

            try {

                const apresentacao =
                    await PresentationRepository
                        .buscarPorAula(
                            aulaId
                        );

                if (!ativo) {
                    return;
                }

                if (
                    !apresentacao ||
                    !apresentacao.versao_publicada_id
                ) {
                    setElementosPublicados([]);
                    return;
                }

                const versao =
                    await PresentationEditorService
                        .buscarVersaoPublicada({
                            apresentacaoId:
                                apresentacao.id,

                            versaoPublicadaId:
                                apresentacao
                                    .versao_publicada_id,
                        });

                if (!ativo) {
                    return;
                }

                const elementos =
                    versao?.elementos ?? [];

                setElementosPublicados(
                    elementos
                );


                const imagens =
                    elementos.filter(
                        (elemento) =>
                            elemento.tipo ===
                            "IMAGEM" &&
                            elemento.arquivo_path
                    );


                const urls:
                    Record<string, string> =
                    {};


                for (const imagem of imagens) {

                    if (!imagem.arquivo_path) {
                        continue;
                    }

                    try {

                        urls[
                            imagem.arquivo_path
                        ] =
                            await PresentationRepository
                                .gerarUrlImagemEditor(
                                    imagem.arquivo_path
                                );

                    } catch (error) {

                        console.error(
                            "[APRESENTAÇÃO] Erro ao carregar imagem publicada:",
                            imagem.arquivo_path,
                            error
                        );
                    }
                }


                if (ativo) {
                    setUrlsImagensEditor(
                        (atuais) => ({
                            ...atuais,
                            ...urls,
                        })
                    );
                }

            } catch (error) {

                console.error(
                    "[APRESENTAÇÃO] Erro ao carregar versão publicada:",
                    error
                );

                if (ativo) {
                    setErro(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar a versão publicada."
                    );
                }
            }
        }


        void carregarVersaoPublicada();


        return () => {
            ativo = false;
        };

    }, [aulaId, modo, modoEdicao]);


    useEffect(() => {

        let ativo = true;

        async function carregarRascunho() {

            if (
                !modoEdicao ||
                !aulaId
            ) {
                return;
            }

            try {

                setCarregandoRascunho(true);
                setErroRascunho(null);

                const apresentacao =
                    await PresentationRepository
                        .buscarPorAula(
                            aulaId
                        );

                if (!ativo) {
                    return;
                }

                if (!apresentacao) {
                    throw new Error(
                        "Esta aula não possui apresentação para editar."
                    );
                }

                setApresentacaoId(
                    apresentacao.id
                );

                const rascunho =
                    await PresentationEditorService
                        .buscarRascunho(
                            apresentacao.id
                        );

                if (!ativo) {
                    return;
                }

                const elementos =
                    rascunho?.elementos ??
                    [];


                setElementosEdicao(
                    elementos
                );


                const imagens =
                    elementos.filter(
                        (
                            elemento
                        ) =>
                            elemento.tipo ===
                            "IMAGEM" &&
                            elemento.arquivo_path
                    );


                const urls:
                    Record<string, string> =
                    {};


                for (
                    const imagem
                    of imagens
                ) {

                    if (
                        !imagem.arquivo_path
                    ) {
                        continue;
                    }


                    try {

                        urls[
                            imagem.arquivo_path
                        ] =
                            await PresentationRepository
                                .gerarUrlImagemEditor(
                                    imagem.arquivo_path
                                );

                    } catch (
                    error
                    ) {

                        console.error(
                            "[EDITOR] Erro ao carregar imagem:",
                            imagem.arquivo_path,
                            error
                        );
                    }
                }


                if (ativo) {
                    setUrlsImagensEditor(
                        urls
                    );
                }

            } catch (error) {

                console.error(
                    "[EDITOR] Erro ao carregar rascunho:",
                    error
                );

                if (ativo) {
                    setErroRascunho(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar o rascunho."
                    );
                }

            } finally {

                if (ativo) {
                    setCarregandoRascunho(
                        false
                    );
                }
            }
        }

        void carregarRascunho();

        return () => {
            ativo = false;
        };

    }, [
        aulaId,
        modoEdicao,
    ]);


    useEffect(() => {

        if (!documento) {
            return;
        }

        let cancelado = false;
        let tarefaRenderizacao:
            ReturnType<
                pdfjsLib.PDFPageProxy["render"]
            > | null = null;

        async function renderizarPagina() {

            try {

                setRenderizando(true);

                const pagina =
                    await documento.getPage(
                        paginaAtual
                    );

                if (cancelado) {
                    return;
                }

                const conteudoTexto =
                    await pagina.getTextContent();


                const canvas =
                    canvasRef.current;

                const container =
                    containerRef.current;

                if (
                    !canvas ||
                    !container
                ) {
                    return;
                }

                const viewportBase =
                    pagina.getViewport({
                        scale: 1,
                    });

                const margemInterna =
                    telaCheiaAtiva
                        ? 0
                        : 32;

                const minimoVisual =
                    telaCheiaAtiva
                        ? 120
                        : 280;

                const larguraDisponivel =
                    Math.max(
                        container.clientWidth -
                            margemInterna,
                        minimoVisual
                    );

                const alturaDisponivel =
                    Math.max(
                        container.clientHeight -
                            margemInterna,
                        minimoVisual
                    );

                const escalaLargura =
                    larguraDisponivel /
                    viewportBase.width;

                const escalaAltura =
                    alturaDisponivel /
                    viewportBase.height;

                const escala =
                    Math.min(
                        escalaLargura,
                        escalaAltura
                    );

                const viewport =
                    pagina.getViewport({
                        scale: escala,
                    });

                const novosOverlays:
                    ReferenciaOverlay[] = [];

                const novosTextosPdf:
                    TextoPdfOverlay[] = [];

                conteudoTexto.items.forEach(
                    (item, indice) => {

                        if (!("str" in item)) {
                            return;
                        }

                        const textoItem =
                            item.str.trim();

                        if (!textoItem) {
                            return;
                        }

                        const transformacao =
                            pdfjsLib.Util.transform(
                                viewport.transform,
                                item.transform
                            );

                        const left =
                            transformacao[4];

                        const altura =
                            Math.hypot(
                                transformacao[2],
                                transformacao[3]
                            );

                        const top =
                            transformacao[5] -
                            altura;

                        const larguraItem =
                            item.width *
                            escala;

                        novosTextosPdf.push({
                            id:
                                `texto-${paginaAtual}-${indice}`,

                            texto:
                                textoItem,

                            left,

                            top,

                            width:
                                Math.max(
                                    larguraItem,
                                    4
                                ),

                            height:
                                Math.max(
                                    altura,
                                    4
                                ),

                            fontSize:
                                Math.max(
                                    altura,
                                    8
                                ),
                        });


                        const referenciasItem =
                            extrairReferenciasBiblicas(
                                textoItem
                            );

                        if (
                            referenciasItem.length ===
                            0
                        ) {
                            return;
                        }

                        for (
                            const referencia
                            of referenciasItem
                        ) {
                            const versiculos =
                                referencia
                                    .versiculoInicial ===
                                    null
                                    ? ""
                                    : referencia
                                        .versiculoFinal !==
                                        null &&
                                        referencia
                                            .versiculoFinal !==
                                        referencia
                                            .versiculoInicial
                                        ? `:${referencia.versiculoInicial}-${referencia.versiculoFinal}`
                                        : `:${referencia.versiculoInicial}`;

                            /*
                             * Descobre onde a referência
                             * começa dentro do TextItem.
                             *
                             * Exemplo:
                             *
                             * "cruz (Fp 2.8)."
                             *       ^^^^^^^^
                             */
                            const proporcaoInicio =
                                referencia.inicioTexto /
                                textoItem.length;

                            const proporcaoLargura =
                                (
                                    referencia.fimTexto -
                                    referencia.inicioTexto
                                ) /
                                textoItem.length;

                            const leftReferencia =
                                left +
                                larguraItem *
                                proporcaoInicio;

                            const widthReferencia =
                                Math.max(
                                    larguraItem *
                                    proporcaoLargura,
                                    18
                                );

                            novosOverlays.push({
                                id:
                                    `${paginaAtual}-${indice}-${referencia.original}`,
                                original:
                                    referencia.original,
                                rotulo:
                                    `${referencia.livro} ${referencia.capitulo}${versiculos}`,
                                referencia,
                                left:
                                    leftReferencia,
                                top,
                                width:
                                    widthReferencia,
                                height:
                                    Math.max(
                                        altura,
                                        item.height *
                                        escala
                                    ),
                            });
                        }
                    }
                );

                if (!cancelado) {

                    setReferenciasOverlay(
                        novosOverlays
                    );

                    setTextosPdfOverlay(
                        novosTextosPdf
                    );
                }

                const pixelRatio =
                    window.devicePixelRatio || 1;

                canvas.width =
                    Math.floor(
                        viewport.width *
                        pixelRatio
                    );

                canvas.height =
                    Math.floor(
                        viewport.height *
                        pixelRatio
                    );

                canvas.style.width =
                    `${Math.floor(
                        viewport.width
                    )}px`;

                canvas.style.height =
                    `${Math.floor(
                        viewport.height
                    )}px`;

                const contexto =
                    canvas.getContext(
                        "2d"
                    );

                if (!contexto) {
                    throw new Error(
                        "Não foi possível preparar o visualizador."
                    );
                }

                tarefaRenderizacao =
                    pagina.render({
                        canvas,
                        canvasContext:
                            contexto,
                        viewport,
                        transform:
                            pixelRatio !== 1
                                ? [
                                    pixelRatio,
                                    0,
                                    0,
                                    pixelRatio,
                                    0,
                                    0,
                                ]
                                : undefined,
                    });

                await tarefaRenderizacao
                    .promise;

            } catch (error) {

                if (
                    error instanceof Error &&
                    error.name ===
                    "RenderingCancelledException"
                ) {
                    return;
                }

                console.error(
                    "[APRESENTAÇÃO] Erro ao renderizar página:",
                    error
                );

                setErro(
                    "Não foi possível renderizar esta página."
                );

            } finally {

                if (!cancelado) {
                    setRenderizando(false);
                }
            }
        }

        void renderizarPagina();

        return () => {

            cancelado = true;

            if (tarefaRenderizacao) {
                tarefaRenderizacao.cancel();
            }
        };

    }, [
        documento,
        paginaAtual,
        telaCheiaAtiva,
        versaoLayout,
    ]);


    useEffect(() => {

        let frame = 0;

        const atualizarLayout =
            () => {

                window.cancelAnimationFrame(
                    frame
                );

                frame =
                    window.requestAnimationFrame(
                        () =>
                            setVersaoLayout(
                                (versao) =>
                                    versao + 1
                            )
                    );
            };


        window.addEventListener(
            "resize",
            atualizarLayout
        );

        window.visualViewport
            ?.addEventListener(
                "resize",
                atualizarLayout
            );

        screen.orientation
            ?.addEventListener(
                "change",
                atualizarLayout
            );


        return () => {

            window.cancelAnimationFrame(
                frame
            );

            window.removeEventListener(
                "resize",
                atualizarLayout
            );

            window.visualViewport
                ?.removeEventListener(
                    "resize",
                    atualizarLayout
                );

            screen.orientation
                ?.removeEventListener(
                    "change",
                    atualizarLayout
                );
        };

    }, []);


    useEffect(() => {

        function aoAlterarTelaCheia() {

            const ativa =
                document.fullscreenElement ===
                presentationRootRef.current;

            setTelaCheiaAtiva(
                ativa
            );

            setVersaoLayout(
                (versao) =>
                    versao + 1
            );


            if (!ativa) {

                const orientacao =
                    screen.orientation as unknown as {
                        unlock?: () => void;
                    };

                try {
                    orientacao.unlock?.();
                } catch {
                    // Navegador sem suporte a desbloqueio de orientação.
                }
            }
        }


        document.addEventListener(
            "fullscreenchange",
            aoAlterarTelaCheia
        );

        return () => {

            document.removeEventListener(
                "fullscreenchange",
                aoAlterarTelaCheia
            );
        };

    }, []);


    async function alternarTelaCheia() {

        const elemento =
            presentationRootRef.current;

        if (!elemento) {
            return;
        }

        try {

            if (
                document.fullscreenElement
            ) {
                await document
                    .exitFullscreen();

                return;
            }

            await elemento
                .requestFullscreen({
                    navigationUI:
                        "hide",
                });


            const orientacao =
                screen.orientation as unknown as {
                    lock?: (
                        orientacao:
                            "landscape"
                    ) => Promise<void>;
                };


            if (
                orientacao.lock
            ) {

                try {

                    await orientacao
                        .lock(
                            "landscape"
                        );

                } catch (error) {

                    console.info(
                        "[APRESENTAÇÃO] O navegador não permitiu travar a orientação:",
                        error
                    );
                }
            }


            setVersaoLayout(
                (versao) =>
                    versao + 1
            );

        } catch (error) {

            console.error(
                "[APRESENTAÇÃO] Não foi possível alternar tela cheia:",
                error
            );
        }
    }


    if (carregando) {

        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

                    <p>
                        Carregando apresentação...
                    </p>
                </div>
            </div>
        );
    }


    if (erro || !documento) {

        return (
            <div className="mx-auto max-w-xl p-6">

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

                    <h1 className="font-semibold text-red-800">
                        Não foi possível abrir a apresentação
                    </h1>

                    <p className="mt-2 text-sm text-red-700">
                        {erro ??
                            "Apresentação não encontrada."}
                    </p>


                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/minhas-aulas"
                            )
                        }
                        className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Voltar para minhas aulas
                    </button>

                </div>
            </div>
        );
    }


    return (
        <div
            ref={
                presentationRootRef
            }
            className={
                telaCheiaAtiva
                    ? "relative flex h-dvh w-screen flex-col overflow-hidden bg-slate-950 text-white"
                    : "relative flex h-[calc(100dvh-1rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl bg-slate-950 text-white"
            }
        >

            <header
                className={
                    telaCheiaAtiva
                        ? "absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-2 py-2"
                        : "flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-5"
                }
            >



                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/minhas-aulas"
                        )
                    }
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                    <ArrowLeft className="h-5 w-5" />

                    <span className="hidden sm:inline">
                        Sair
                    </span>
                </button>

                <div
                    className={
                        telaCheiaAtiva
                            ? "pointer-events-none min-w-0 text-center opacity-0"
                            : "min-w-0 text-center"
                    }
                >

                    <p className="text-sm font-semibold">
                        Apresentação
                    </p>

                    <p className="text-sm font-semibold">
                        {modoAula
                            ? "Ver aula"
                            : "Apresentação"}
                    </p>

                </div>

                <button
                    type="button"
                    onClick={
                        alternarTelaCheia
                    }
                    className="rounded-lg p-2.5 text-slate-200 transition hover:bg-white/10"
                    title={
                        telaCheiaAtiva
                            ? "Sair da tela cheia"
                            : "Tela cheia"
                    }
                    aria-label={
                        telaCheiaAtiva
                            ? "Sair da tela cheia"
                            : "Abrir em tela cheia"
                    }
                >
                    {telaCheiaAtiva ? (
                        <Minimize className="h-5 w-5" />
                    ) : (
                        <Maximize className="h-5 w-5" />
                    )}
                </button>

            </header>


            {modoEdicao && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 bg-slate-900 px-3 py-2 sm:px-5">

                    <button
                        type="button"
                        onClick={() =>
                            adicionarElemento(
                                "TEXTO"
                            )
                        }
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                        <FileText className="h-4 w-4" />
                        Texto
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            adicionarElemento(
                                "REFERENCIA_BIBLICA"
                            )
                        }
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                        <BookOpenText className="h-4 w-4" />
                        Referência
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            adicionarElemento(
                                "COBERTURA"
                            )
                        }
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                        <Square className="h-4 w-4" />
                        Cobertura
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setEditandoConteudoPdf(
                                (ativo) =>
                                    !ativo
                            )
                        }
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition ${editandoConteudoPdf
                            ? "bg-amber-600 hover:bg-amber-500"
                            : "bg-white/10 hover:bg-white/20"
                            }`}
                    >
                        <FileText className="h-4 w-4" />

                        {editandoConteudoPdf
                            ? "Cancelar edição PDF"
                            : "Editar PDF"}
                    </button>

                    <input
                        ref={inputImagemRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {

                            const arquivo =
                                event.target
                                    .files?.[0];

                            if (arquivo) {
                                void adicionarImagem(
                                    arquivo
                                );
                            }

                            event.currentTarget.value =
                                "";
                        }}
                    />


                    <button
                        type="button"
                        onClick={() =>
                            inputImagemRef
                                .current
                                ?.click()
                        }
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                        <ImagePlus className="h-4 w-4" />

                        Imagem
                    </button>

                    <button
                        type="button"
                        onClick={
                            desfazerEdicao
                        }
                        disabled={
                            historicoEdicao.length ===
                            0
                        }
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Desfazer"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Desfazer
                    </button>

                    <div className="flex-1" />

                    {carregandoRascunho && (
                        <span className="text-xs text-slate-400">
                            Carregando editor...
                        </span>
                    )}

                    {erroRascunho && (
                        <span
                            className="max-w-xs truncate text-xs text-red-300"
                            title={erroRascunho}
                        >
                            {erroRascunho}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            void salvarRascunho()
                        }
                        disabled={
                            !apresentacaoId ||
                            !pessoa?.id ||
                            carregandoRascunho
                        }
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        Salvar rascunho
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            void publicarApresentacao()
                        }
                        disabled={
                            !apresentacaoId ||
                            !pessoa?.id ||
                            carregandoRascunho ||
                            publicando
                        }
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {publicando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="h-4 w-4" />
                        )}

                        {publicando
                            ? "Publicando..."
                            : "Publicar aula"}
                    </button>

                    {publicacaoConcluida && (
                        <span className="text-sm font-medium text-emerald-300">
                            Aula publicada
                        </span>
                    )}

                </div>
            )}

            {modoEdicao &&
                elementoSelecionado && (
                    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 bg-slate-800 px-3 py-2 sm:px-5">

                        {elementoSelecionado.tipo !==
                            "COBERTURA" && (
                                <input
                                    type="text"
                                    value={
                                        elementoSelecionado
                                            .conteudo ??
                                        ""
                                    }
                                    onFocus={() =>
                                        registrarHistorico()
                                    }
                                    onChange={(event) =>
                                        atualizarElemento(
                                            elementoSelecionado.id,
                                            {
                                                conteudo:
                                                    event
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    placeholder={
                                        elementoSelecionado.tipo ===
                                            "REFERENCIA_BIBLICA"
                                            ? "Ex.: Fp 2.8"
                                            : "Digite o texto"
                                    }
                                    className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                />
                            )}

                        {elementoSelecionado.tipo !==
                            "COBERTURA" && (
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    Fonte

                                    <input
                                        type="number"
                                        min={10}
                                        max={72}
                                        value={
                                            elementoSelecionado
                                                .tamanho_fonte ??
                                            24
                                        }
                                        onFocus={() =>
                                            registrarHistorico()
                                        }
                                        onChange={(event) =>
                                            atualizarElemento(
                                                elementoSelecionado.id,
                                                {
                                                    tamanho_fonte:
                                                        Number(
                                                            event
                                                                .target
                                                                .value
                                                        ),
                                                }
                                            )
                                        }
                                        className="w-20 rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-white outline-none"
                                    />
                                </label>
                            )}

                        <button
                            type="button"
                            onClick={() =>
                                excluirElemento(
                                    elementoSelecionado.id
                                )
                            }
                            className="flex items-center gap-2 rounded-lg bg-red-600/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                        </button>

                    </div>
                )}


            <main
                ref={containerRef}
                className={
                    telaCheiaAtiva
                        ? "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-0"
                        : "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4"
                }
            >

                <div className="relative inline-block">

                    {modoEdicao &&
                        editandoConteudoPdf &&
                        textosPdfOverlay.map(
                            (textoPdf) => (
                                <button
                                    key={
                                        textoPdf.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        editarTextoOriginalPdf(
                                            textoPdf
                                        )
                                    }
                                    title={
                                        `Editar: ${textoPdf.texto}`
                                    }
                                    className="absolute z-30 cursor-pointer border border-amber-400/80 bg-amber-300/15 transition hover:bg-amber-300/35"
                                    style={{
                                        left:
                                            textoPdf.left,

                                        top:
                                            textoPdf.top,

                                        width:
                                            Math.max(
                                                textoPdf.width,
                                                8
                                            ),

                                        height:
                                            Math.max(
                                                textoPdf.height,
                                                12
                                            ),
                                    }}
                                />
                            )
                        )}

                    <canvas
                        ref={canvasRef}
                        className="block max-h-full max-w-full bg-white shadow-2xl"
                    />

                    {referenciasOverlay.map(
                        (referencia) => (
                            <button
                                key={referencia.id}
                                type="button"
                                onClick={() =>
                                    abrirReferenciaBiblica(
                                        referencia.referencia
                                    )
                                }
                                title={
                                    referencia.rotulo
                                }
                                aria-label={
                                    `Abrir ${referencia.rotulo}`
                                }
                                className="absolute z-10 cursor-pointer rounded border border-blue-400/70 bg-blue-400/15 transition hover:bg-blue-400/30"
                                style={{
                                    left:
                                        referencia.left,
                                    top:
                                        referencia.top,
                                    width:
                                        referencia.width,
                                    height:
                                        Math.max(
                                            referencia.height,
                                            18
                                        ),
                                }}
                            />
                        )
                    )}

                    {(modoEdicao
                        ? elementosEdicao
                        : elementosPublicados)
                        .filter(
                            (elemento) =>
                                elemento.pagina ===
                                paginaAtual
                        )
                        .map(
                            (elemento) => {

                                const selecionado =
                                    elemento.id ===
                                    elementoSelecionadoId;

                                return (
                                    <div
                                        key={
                                            elemento.id
                                        }
                                        onPointerDown={
                                            modoEdicao
                                                ? (event) =>
                                                    iniciarInteracao(
                                                        event,
                                                        elemento,
                                                        "mover"
                                                    )
                                                : undefined
                                        }
                                        onPointerMove={
                                            modoEdicao
                                                ? moverInteracao
                                                : undefined
                                        }
                                        onPointerUp={
                                            modoEdicao
                                                ? finalizarInteracao
                                                : undefined
                                        }
                                        onPointerCancel={
                                            modoEdicao
                                                ? finalizarInteracao
                                                : undefined
                                        }
                                        className={`absolute z-20 select-none ${modoEdicao
                                            ? `overflow-visible touch-none ${selecionado
                                                ? "cursor-move border-2 border-blue-500"
                                                : "cursor-move border border-dashed border-amber-400"
                                            }`
                                            : "overflow-hidden pointer-events-none"
                                            }`}
                                        style={{
                                            left:
                                                `${elemento.x * 100}%`,

                                            top:
                                                `${elemento.y * 100}%`,

                                            width:
                                                `${elemento.largura * 100}%`,

                                            height:
                                                `${elemento.altura * 100}%`,

                                            backgroundColor:
                                                elemento.cor_fundo ??
                                                "transparent",

                                            opacity:
                                                elemento.opacidade ??
                                                1,

                                            color:
                                                elemento.cor_texto ??
                                                "#111827",

                                            fontSize:
                                                elemento.tamanho_fonte
                                                    ? `${elemento.tamanho_fonte}px`
                                                    : undefined,

                                            fontWeight:
                                                elemento.negrito
                                                    ? 700
                                                    : 400,

                                            fontStyle:
                                                elemento.italico
                                                    ? "italic"
                                                    : "normal",

                                            textAlign:
                                                elemento.alinhamento ??
                                                "left",
                                        }}
                                    >
                                        {elemento.tipo ===
                                            "IMAGEM" ? (

                                            elemento.arquivo_path &&
                                                urlsImagensEditor[
                                                elemento.arquivo_path
                                                ] ? (

                                                <img
                                                    src={
                                                        urlsImagensEditor[
                                                        elemento.arquivo_path
                                                        ]
                                                    }
                                                    alt={
                                                        elemento.arquivo_nome ??
                                                        "Imagem"
                                                    }
                                                    draggable={
                                                        false
                                                    }
                                                    className="pointer-events-none h-full w-full select-none object-fill"
                                                />

                                            ) : (

                                                <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-600">
                                                    Carregando imagem...
                                                </div>
                                            )

                                        ) : elemento.tipo !==
                                            "COBERTURA" ? (

                                            <div className="h-full w-full overflow-hidden p-1">
                                                {
                                                    elemento.conteudo
                                                }
                                            </div>

                                        ) : null}

                                        {modoEdicao &&
                                            selecionado && (
                                                <div
                                                    role="button"
                                                    aria-label="Redimensionar elemento"
                                                    onPointerDown={(
                                                        event
                                                    ) =>
                                                        iniciarInteracao(
                                                            event,
                                                            elemento,
                                                            "redimensionar"
                                                        )
                                                    }
                                                    onPointerMove={
                                                        moverInteracao
                                                    }
                                                    onPointerUp={
                                                        finalizarInteracao
                                                    }
                                                    onPointerCancel={
                                                        finalizarInteracao
                                                    }
                                                    className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize touch-none rounded-sm border-2 border-white bg-blue-600 shadow"
                                                />
                                            )}
                                    </div>
                                );
                            }
                        )}

                </div>

                {renderizando && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}

            </main>

            {referenciaSelecionada && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
                    onClick={() =>
                        setReferenciaSelecionada(null)
                    }
                >
                    <div
                        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">

                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Referência bíblica
                                </p>

                                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                                    {passagemBiblica?.referencia ??
                                        `${referenciaSelecionada.livro} ${referenciaSelecionada.capitulo}`}
                                </h2>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setTamanhoFonteBiblia(
                                            (tamanho) =>
                                                Math.max(
                                                    18,
                                                    tamanho - 2
                                                )
                                        )
                                    }
                                    disabled={
                                        tamanhoFonteBiblia <= 18
                                    }
                                    className="flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-base font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="Diminuir tamanho do texto"
                                    title="Diminuir texto"
                                >
                                    A−
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setTamanhoFonteBiblia(
                                            (tamanho) =>
                                                Math.min(
                                                    36,
                                                    tamanho + 2
                                                )
                                        )
                                    }
                                    disabled={
                                        tamanhoFonteBiblia >= 36
                                    }
                                    className="flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-xl font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="Aumentar tamanho do texto"
                                    title="Aumentar texto"
                                >
                                    A+
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setReferenciaSelecionada(
                                            null
                                        )
                                    }
                                    className="flex h-11 w-11 items-center justify-center rounded-full text-3xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                    aria-label="Fechar texto bíblico"
                                    title="Fechar"
                                >
                                    ×
                                </button>

                            </div>

                        </div>

                        <div className="overflow-y-auto px-5 py-5 sm:px-6">

                            {carregandoPassagem && (
                                <div className="flex min-h-32 items-center justify-center gap-3 text-slate-500">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>
                                        Carregando texto bíblico...
                                    </span>
                                </div>
                            )}

                            {!carregandoPassagem &&
                                erroPassagem && (
                                    <div className="rounded-xl bg-red-50 p-4 text-base text-red-700">
                                        {erroPassagem}
                                    </div>
                                )}

                            {!carregandoPassagem &&
                                passagemBiblica && (
                                    <>
                                        <div
                                            className="space-y-4 leading-relaxed"
                                            style={{
                                                fontSize:
                                                    `${tamanhoFonteBiblia}px`,
                                            }}
                                        >

                                            {passagemBiblica.versiculos.map(
                                                (versiculo) => (
                                                    <p
                                                        key={
                                                            versiculo.id
                                                        }
                                                    >
                                                        <sup className="mr-1.5 text-sm font-bold text-slate-500">
                                                            {
                                                                versiculo.versiculo
                                                            }
                                                        </sup>

                                                        {
                                                            versiculo.texto
                                                        }
                                                    </p>
                                                )
                                            )}

                                        </div>

                                        <div className="mt-7 border-t border-slate-200 pt-4">
                                            <p className="text-sm font-semibold text-slate-600">
                                                {
                                                    passagemBiblica
                                                        .traducao
                                                        .nome
                                                }{" "}
                                                (
                                                {
                                                    passagemBiblica
                                                        .traducao
                                                        .codigo
                                                }
                                                )
                                            </p>

                                            {passagemBiblica
                                                .traducao
                                                .atribuicao && (
                                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                                        {
                                                            passagemBiblica
                                                                .traducao
                                                                .atribuicao
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </>
                                )}

                        </div>
                    </div>
                </div>
            )}


            <footer
                className={
                    telaCheiaAtiva
                        ? "absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8"
                        : "flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-3 py-3 sm:px-5"
                }
            >

                <button
                    type="button"
                    disabled={
                        paginaAtual <= 1
                    }
                    onClick={() =>
                        setPaginaAtual(
                            (pagina) =>
                                Math.max(
                                    1,
                                    pagina - 1
                                )
                        )
                    }
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <ChevronLeft className="h-5 w-5" />

                    <span className="hidden sm:inline">
                        Anterior
                    </span>
                </button>


                <div className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">
                    {paginaAtual}
                    {" / "}
                    {totalPaginas}
                </div>


                <button
                    type="button"
                    disabled={
                        paginaAtual >=
                        totalPaginas
                    }
                    onClick={() =>
                        setPaginaAtual(
                            (pagina) =>
                                Math.min(
                                    totalPaginas,
                                    pagina + 1
                                )
                        )
                    }
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <span className="hidden sm:inline">
                        Próximo
                    </span>

                    <ChevronRight className="h-5 w-5" />
                </button>

            </footer>

        </div>
    );
}
