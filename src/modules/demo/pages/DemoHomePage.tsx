import {
    useEffect,
    useState,
} from "react";

import {
    BarChart3,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    Presentation,
    Users,
    WalletCards,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import {
    useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
    supabase,
} from "@/shared/lib/supabase/client";


type AulaDemo = {
    id: string;
    titulo: string;
    numero: number;
    trimestre_id: string;
    classe_id: string | null;
};


type ResumoDemo = {
    pessoas: number;
    alunos: number;
    classes: number;
    aulas: number;
    presencas: number;
    aulaHoje: AulaDemo | null;
    temApresentacao: boolean;
};


export function DemoHomePage() {

    const {
        igrejaId,
    } =
        useAuth();

    const [
        resumo,
        setResumo,
    ] =
        useState<ResumoDemo>({
            pessoas: 0,
            alunos: 0,
            classes: 0,
            aulas: 0,
            presencas: 0,
            aulaHoje: null,
            temApresentacao: false,
        });


    useEffect(() => {

        if (!igrejaId) {
            return;
        }


        let ativo =
            true;


        async function carregar() {

            const hoje =
                new Date();

            const dataHoje =
                [
                    hoje.getFullYear(),
                    String(
                        hoje.getMonth() + 1
                    ).padStart(
                        2,
                        "0"
                    ),
                    String(
                        hoje.getDate()
                    ).padStart(
                        2,
                        "0"
                    ),
                ].join("-");


            const [
                pessoas,
                alunos,
                classes,
                aulas,
                presencas,
                aulaHoje,
            ] =
                await Promise.all([

                    supabase
                        .schema("ebd")
                        .from("pessoas")
                        .select(
                            "id",
                            {
                                count:
                                    "exact",
                                head:
                                    true,
                            }
                        )
                        .eq(
                            "igreja_id",
                            igrejaId
                        ),

                    supabase
                        .schema("ebd")
                        .from("pessoas")
                        .select(
                            "id",
                            {
                                count:
                                    "exact",
                                head:
                                    true,
                            }
                        )
                        .eq(
                            "igreja_id",
                            igrejaId
                        )
                        .eq(
                            "perfil",
                            "ALUNO"
                        ),

                    supabase
                        .schema("ebd")
                        .from("classes")
                        .select(
                            "id",
                            {
                                count:
                                    "exact",
                                head:
                                    true,
                            }
                        )
                        .eq(
                            "igreja_id",
                            igrejaId
                        ),

                    supabase
                        .schema("ebd")
                        .from("aulas")
                        .select(
                            "id, trimestres!inner(igreja_id)",
                            {
                                count:
                                    "exact",
                                head:
                                    true,
                            }
                        )
                        .eq(
                            "trimestres.igreja_id",
                            igrejaId
                        ),

                    supabase
                        .schema("ebd")
                        .from("presencas")
                        .select(
                            "id, pessoas!inner(igreja_id)",
                            {
                                count:
                                    "exact",
                                head:
                                    true,
                            }
                        )
                        .eq(
                            "pessoas.igreja_id",
                            igrejaId
                        ),

                    supabase
                        .schema("ebd")
                        .from("aulas")
                        .select(
                            "id, titulo, numero, trimestre_id, classe_id, trimestres!inner(igreja_id)"
                        )
                        .eq(
                            "trimestres.igreja_id",
                            igrejaId
                        )
                        .eq(
                            "data",
                            dataHoje
                        )
                        .eq(
                            "cancelada",
                            false
                        )
                        .limit(1)
                        .maybeSingle(),

                ]);


            if (!ativo) {
                return;
            }


            const aula =
                aulaHoje.data
                    ? {
                        id:
                            aulaHoje.data.id,
                        titulo:
                            aulaHoje.data.titulo,
                        numero:
                            aulaHoje.data.numero,
                        trimestre_id:
                            aulaHoje.data.trimestre_id,
                        classe_id:
                            aulaHoje.data.classe_id,
                    }
                    : null;


            let temApresentacao =
                false;


            if (aula?.id) {

                const {
                    data,
                } =
                    await supabase
                        .schema("ebd")
                        .from(
                            "apresentacoes_aula"
                        )
                        .select("id")
                        .eq(
                            "aula_id",
                            aula.id
                        )
                        .maybeSingle();


                temApresentacao =
                    Boolean(
                        data?.id
                    );
            }


            if (!ativo) {
                return;
            }


            setResumo({
                pessoas:
                    pessoas.count ??
                    0,
                alunos:
                    alunos.count ??
                    0,
                classes:
                    classes.count ??
                    0,
                aulas:
                    aulas.count ??
                    0,
                presencas:
                    presencas.count ??
                    0,
                aulaHoje:
                    aula,
                temApresentacao,
            });
        }


        void carregar();


        return () => {
            ativo =
                false;
        };

    }, [
        igrejaId,
    ]);


    const cards = [
        {
            titulo:
                "Pessoas organizadas",
            valor:
                resumo.pessoas,
            detalhe:
                `${resumo.alunos} alunos + equipe da EBD`,
            icon:
                Users,
        },
        {
            titulo:
                "Classes",
            valor:
                resumo.classes,
            detalhe:
                "Alunos vinculados à sala correta",
            icon:
                BookOpen,
        },
        {
            titulo:
                "Aulas",
            valor:
                resumo.aulas,
            detalhe:
                "Histórico, aula de hoje e próximas",
            icon:
                Presentation,
        },
        {
            titulo:
                "Presenças",
            valor:
                resumo.presencas,
            detalhe:
                "Base pronta para acompanhar assiduidade",
            icon:
                CheckCircle2,
        },
    ];


    const modulos = [
        {
            to:
                "/pessoas",
            titulo:
                "Pessoas",
            texto:
                "Alunos, professores, pastor, secretaria e superintendência.",
            icon:
                Users,
        },
        {
            to:
                "/classes",
            titulo:
                "Classes",
            texto:
                "Organize salas e alunos sem depender de planilhas.",
            icon:
                BookOpen,
        },
        {
            to:
                "/checkin",
            titulo:
                "Chamada",
            texto:
                "Registre presença e acompanhe a participação em cada aula.",
            icon:
                ClipboardCheck,
        },
        {
            to:
                "/relatorios/presencas",
            titulo:
                "Relatórios",
            texto:
                "Enxergue faltas, frequência e comportamento da EBD.",
            icon:
                BarChart3,
        },
        {
            to:
                "/financeiro",
            titulo:
                "Financeiro",
            texto:
                "Centralize entradas e despesas relacionadas à escola bíblica.",
            icon:
                WalletCards,
        },
    ];


    const rotaAula =
        resumo.aulaHoje
            ? resumo
                .aulaHoje
                .classe_id
                ? `/aulas/${resumo.aulaHoje.trimestre_id}/classe/${resumo.aulaHoje.classe_id}`
                : `/aulas/${resumo.aulaHoje.trimestre_id}`
            : "/aulas";


    return (
        <div className="mx-auto max-w-7xl space-y-5">

            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white shadow-xl sm:p-8">

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

                    <div>

                        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-100">
                            Sua EBD em funcionamento
                        </span>

                        <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                            O que você precisa enxergar antes, durante e depois de uma aula.
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                            Explore os dados fictícios como se fossem da sua igreja. Nada aqui exige que você cadastre pessoas reais para entender o valor da plataforma.
                        </p>

                    </div>


                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">

                        <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                            Aula demonstrativa de hoje
                        </p>

                        <h2 className="mt-2 text-xl font-black">
                            {resumo.aulaHoje
                                ? `Aula ${resumo.aulaHoje.numero} — ${resumo.aulaHoje.titulo}`
                                : "Aula preparada para demonstração"}
                        </h2>

                        <p className="mt-2 text-sm text-blue-100">
                            {resumo.temApresentacao
                                ? "Seu PDF já foi importado. Abra a apresentação e teste as referências bíblicas."
                                : "Importe um PDF nesta aula e experimente a apresentação interativa."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">

                            {resumo.temApresentacao &&
                            resumo.aulaHoje ? (

                                <Link
                                    to={
                                        `/minhas-aulas/${resumo.aulaHoje.id}/apresentacao?modo=apresentacao`
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-800"
                                >
                                    <Presentation className="h-4 w-4" />
                                    Ver apresentação
                                </Link>

                            ) : (

                                <Link
                                    to={
                                        rotaAula
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-800"
                                >
                                    <FileText className="h-4 w-4" />
                                    Importar meu PDF
                                </Link>

                            )}


                            <Link
                                to={
                                    rotaAula
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white"
                            >
                                Abrir aula
                            </Link>

                        </div>

                    </div>

                </div>

            </section>


            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                {cards.map(
                    (
                        card
                    ) => {

                        const Icon =
                            card.icon;

                        return (
                            <div
                                key={
                                    card.titulo
                                }
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <Icon className="h-5 w-5 text-blue-600" />
                                    <span className="text-2xl font-black text-slate-900">
                                        {card.valor}
                                    </span>
                                </div>

                                <p className="mt-3 text-sm font-bold text-slate-800">
                                    {card.titulo}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {card.detalhe}
                                </p>
                            </div>
                        );
                    }
                )}

            </section>


            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

                <p className="text-sm font-bold text-blue-600">
                    Explore como responsável pela EBD
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                    Menos procura, mais visão do que está acontecendo
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Abra cada área e veja como cadastro, chamada, assiduidade, aula e apresentação ficam conectados no mesmo fluxo.
                </p>


                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                    {modulos.map(
                        (
                            modulo
                        ) => {

                            const Icon =
                                modulo.icon;

                            return (
                                <Link
                                    key={
                                        modulo.to
                                    }
                                    to={
                                        modulo.to
                                    }
                                    className="group rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <h3 className="mt-3 font-black text-slate-900">
                                        {modulo.titulo}
                                    </h3>

                                    <p className="mt-1 text-sm leading-5 text-slate-500">
                                        {modulo.texto}
                                    </p>
                                </Link>
                            );
                        }
                    )}

                </div>

            </section>

        </div>
    );
}
