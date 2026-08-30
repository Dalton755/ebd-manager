import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import { CheckinCard } from "../components/CheckinCard";
import { AuthService } from "@/modules/auth/services/AuthService";
import { supabase } from "@/shared/lib/supabase/client";
import { StudentCheckinService } from "../services/StudentCheckinService";


type AulaHoje = {
    id: string;
    numero: number;
    titulo: string;
    data: string;
    hora_inicio: string | null;
    hora_fim: string | null;
    link_drive: string | null;

    professor:
        | {
            id: string;
            nome: string;
        }
        | {
            id: string;
            nome: string;
        }[]
        | null;

    trimestre:
        | {
            numero: number;
            ano: number;
            tema: string;
            ativo: boolean;
            igreja_id: string;
        }
        | {
            numero: number;
            ano: number;
            tema: string;
            ativo: boolean;
            igreja_id: string;
        }[]
        | null;
};


function horarioParaMinutos(
    horario: string
) {

    const [
        hora,
        minuto,
    ] =
        horario
            .slice(0, 5)
            .split(":")
            .map(Number);


    return hora * 60 + minuto;
}


function formatarMinutosHorario(
    minutos: number
) {

    const normalizado =
        ((minutos % 1440) + 1440) % 1440;


    const hora =
        Math.floor(
            normalizado / 60
        );


    const minuto =
        normalizado % 60;


    return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}


function primeiroRelacionamento<T>(
    valor: T | T[] | null | undefined
): T | null {

    if (!valor) {
        return null;
    }


    return Array.isArray(valor)
        ? valor[0] ?? null
        : valor;
}


export function StudentCheckinPage() {

    const navigate =
        useNavigate();


    const [
        loading,
        setLoading,
    ] =
        useState(false);


    const [
        checkedIn,
        setCheckedIn,
    ] =
        useState(false);


    const [
        checkinDisponivel,
        setCheckinDisponivel,
    ] =
        useState(false);


    const [
        mensagemCheckin,
        setMensagemCheckin,
    ] =
        useState(
            "Verificando disponibilidade..."
        );


    const [
        horarioCheckin,
        setHorarioCheckin,
    ] =
        useState("");


    const [
        aulaHoje,
        setAulaHoje,
    ] =
        useState<AulaHoje | null>(
            null
        );


    const [
        classeNome,
        setClasseNome,
    ] =
        useState<string | null>(
            null
        );


    useEffect(() => {

        let ativo =
            true;


        async function verificarDisponibilidade() {

            try {

                const user =
                    await AuthService.getUser();


                if (
                    !ativo
                ) {
                    return;
                }


                if (!user) {

                    setCheckinDisponivel(false);

                    setMensagemCheckin(
                        "Não foi possível identificar o usuário."
                    );

                    return;
                }


                const {
                    data: pessoaAtual,
                    error: pessoaError,
                } =
                    await supabase
                        .schema("ebd")
                        .from("pessoas")
                        .select(`
                            id,
                            igreja_id,
                            classe_id
                        `)
                        .eq(
                            "user_id",
                            user.id
                        )
                        .maybeSingle();


                if (pessoaError) {
                    throw pessoaError;
                }


                if (
                    !ativo
                ) {
                    return;
                }


                if (!pessoaAtual?.igreja_id) {

                    setCheckinDisponivel(false);

                    setMensagemCheckin(
                        "Não foi possível identificar sua igreja."
                    );

                    return;
                }


                if (!pessoaAtual.classe_id) {

                    setCheckinDisponivel(false);

                    setMensagemCheckin(
                        "Você ainda não está vinculado a uma classe."
                    );

                    return;
                }


                const [
                    situacao,
                    classeResultado,
                ] =
                    await Promise.all([

                        StudentCheckinService
                            .buscarSituacaoAulaHoje(
                                pessoaAtual.id,
                                pessoaAtual.igreja_id,
                                pessoaAtual.classe_id
                            ),

                        supabase
                            .schema("ebd")
                            .from("classes")
                            .select("nome")
                            .eq(
                                "id",
                                pessoaAtual.classe_id
                            )
                            .eq(
                                "igreja_id",
                                pessoaAtual.igreja_id
                            )
                            .maybeSingle(),

                    ]);


                if (
                    !ativo
                ) {
                    return;
                }


                if (
                    classeResultado.error
                ) {
                    throw classeResultado.error;
                }


                setClasseNome(
                    classeResultado.data?.nome ??
                    null
                );


                if (!situacao.aula) {

                    setAulaHoje(null);
                    setCheckedIn(false);
                    setCheckinDisponivel(false);
                    setMensagemCheckin(
                        situacao.mensagem
                    );
                    setHorarioCheckin("");

                    return;
                }


                const aula =
                    situacao.aula as AulaHoje;


                setAulaHoje(
                    aula
                );


                if (
                    situacao.presencaRegistrada
                ) {

                    navigate(
                        `/minhas-aulas?aula=${aula.id}&material=1`,
                        {
                            replace: true,
                        }
                    );

                    return;
                }


                setCheckedIn(false);


                if (
                    aula.hora_inicio &&
                    aula.hora_fim
                ) {

                    const abertura =
                        horarioParaMinutos(
                            aula.hora_inicio
                        ) - 30;


                    const fechamento =
                        horarioParaMinutos(
                            aula.hora_fim
                        ) + 30;


                    setHorarioCheckin(
                        `Disponível das ${formatarMinutosHorario(abertura)} às ${formatarMinutosHorario(fechamento)}`
                    );

                } else {

                    setHorarioCheckin("");

                }


                setCheckinDisponivel(
                    situacao.checkinDisponivel
                );


                setMensagemCheckin(
                    situacao.mensagem
                );


            } catch (error) {

                console.error(error);


                if (
                    !ativo
                ) {
                    return;
                }


                setCheckinDisponivel(false);

                setMensagemCheckin(
                    "Não foi possível verificar o check-in."
                );

            }
        }


        void verificarDisponibilidade();


        const intervalo =
            window.setInterval(
                verificarDisponibilidade,
                30000
            );


        return () => {

            ativo = false;

            window.clearInterval(
                intervalo
            );

        };

    }, [
        navigate,
    ]);


    async function handleCheckin() {

        if (!navigator.geolocation) {

            toast.error(
                "Seu dispositivo não suporta localização."
            );

            return;
        }


        try {

            setLoading(true);


            const user =
                await AuthService.getUser();


            if (!user) {

                toast.error(
                    "Não foi possível identificar o usuário."
                );

                setLoading(false);

                return;
            }


            const {
                data: pessoa,
                error,
            } =
                await supabase
                    .schema("ebd")
                    .from("pessoas")
                    .select(`
                        id,
                        nome,
                        perfil,
                        status,
                        ativo,
                        igreja_id,
                        classe_id
                    `)
                    .eq(
                        "user_id",
                        user.id
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!pessoa?.id) {

                toast.error(
                    "Seu cadastro de aluno não foi encontrado."
                );

                setLoading(false);

                return;
            }


            if (
                pessoa.perfil !==
                "ALUNO"
            ) {

                toast.error(
                    "Esta área é exclusiva para alunos."
                );

                setLoading(false);

                return;
            }


            if (
                !pessoa.ativo ||
                pessoa.status !== "ATIVO"
            ) {

                toast.error(
                    "Seu cadastro não está ativo."
                );

                setLoading(false);

                return;
            }


            if (!pessoa.igreja_id) {

                toast.error(
                    "Não foi possível identificar sua igreja."
                );

                setLoading(false);

                return;
            }


            if (!pessoa.classe_id) {

                toast.error(
                    "Você ainda não está vinculado a uma classe."
                );

                setLoading(false);

                return;
            }


            navigator.geolocation.getCurrentPosition(

                async (position) => {

                    try {

                        const {
                            latitude,
                            longitude,
                            accuracy,
                        } =
                            position.coords;


                        await StudentCheckinService
                            .realizarCheckin(
                                pessoa.id,
                                pessoa.igreja_id,
                                pessoa.classe_id,
                                latitude,
                                longitude,
                                accuracy
                            );


                        setCheckedIn(true);


                        toast.success(
                            "Presença registrada com sucesso!"
                        );


                        const aulaId =
                            aulaHoje?.id;


                        window.setTimeout(
                            () => {

                                if (aulaId) {

                                    navigate(
                                        `/minhas-aulas?aula=${aulaId}&material=1`,
                                        {
                                            replace: true,
                                        }
                                    );

                                } else {

                                    navigate(
                                        "/minhas-aulas",
                                        {
                                            replace: true,
                                        }
                                    );

                                }

                            },
                            1100
                        );


                    } catch (error) {

                        console.error(error);


                        const mensagem =
                            error instanceof Error
                                ? error.message
                                : "Não foi possível realizar o check-in.";


                        toast.error(
                            mensagem
                        );


                    } finally {

                        setLoading(false);

                    }

                },

                (error) => {

                    console.error(
                        "Erro ao obter localização:",
                        error
                    );


                    switch (error.code) {

                        case error.PERMISSION_DENIED:

                            toast.error(
                                "Permissão de localização negada."
                            );

                            break;


                        case error.POSITION_UNAVAILABLE:

                            toast.error(
                                "Não foi possível obter sua localização."
                            );

                            break;


                        case error.TIMEOUT:

                            toast.error(
                                "Tempo limite para obter sua localização."
                            );

                            break;


                        default:

                            toast.error(
                                "Erro ao obter sua localização."
                            );

                    }


                    setLoading(false);

                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                }

            );


        } catch (error) {

            console.error(error);


            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Não foi possível iniciar o check-in.";


            toast.error(
                mensagem
            );

            setLoading(false);

        }
    }


    const professor =
        primeiroRelacionamento(
            aulaHoje?.professor
        );


    const trimestre =
        primeiroRelacionamento(
            aulaHoje?.trimestre
        );


    return (
        <div className="min-h-screen bg-slate-100 px-3 py-5 sm:px-5 sm:py-8">

            <div className="mx-auto w-full max-w-2xl">

                <div className="mb-5 text-center sm:mb-7">

                    <h1 className="text-2xl font-black tracking-tight text-blue-600 sm:text-3xl">
                        EBD Manager
                    </h1>


                    <p className="mt-1 text-sm text-slate-500">
                        Sua aula está pronta. Registre sua presença para continuar.
                    </p>

                </div>


                <CheckinCard
                    checkedIn={checkedIn}
                    loading={loading}
                    onCheckin={handleCheckin}
                    checkinDisponivel={checkinDisponivel}
                    mensagemCheckin={mensagemCheckin}
                    horarioCheckin={horarioCheckin}
                    classeNome={classeNome}
                    aula={
                        aulaHoje
                            ? {
                                numero:
                                    aulaHoje.numero,

                                titulo:
                                    aulaHoje.titulo,

                                data:
                                    aulaHoje.data,

                                hora_inicio:
                                    aulaHoje.hora_inicio,

                                hora_fim:
                                    aulaHoje.hora_fim,

                                tema:
                                    trimestre?.tema ??
                                    null,

                                professorNome:
                                    professor?.nome ??
                                    null,
                            }
                            : null
                    }
                />

            </div>

        </div>
    );
}
