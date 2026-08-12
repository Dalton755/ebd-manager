import {
    CheckCircle2,
    Clock3,
    Flame,
    XCircle,
    ClipboardCheck,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useAuth } from "@/modules/auth/hooks/useAuth";

import { AttendanceService } from "@/modules/attendance/services/AttendanceService";

import type { Presenca } from "@/modules/attendance/types/Presenca";


export function StudentAttendancePage() {

    const {
        pessoa,
    } = useAuth();

    const [
        presencas,
        setPresencas,
    ] = useState<Presenca[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);


    async function carregar() {

        if (!pessoa?.id) {
            return;
        }

        try {

            setLoading(true);

            const resultado =
                await AttendanceService
                    .listarMinhasPresencas(
                        pessoa.id
                    );

            setPresencas(
                resultado as Presenca[]
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Não foi possível carregar suas presenças."
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        carregar();

    }, [pessoa?.id]);


    const presencasConsideradas =
        useMemo(() => {

            return presencas.filter(
                (presenca) =>
                    presenca.status_validacao !==
                    "REJEITADO"
            );

        }, [presencas]);


    const totalPresencas =
        presencasConsideradas.length;


    


    const totalPendentes =
        presencas.filter(
            (presenca) =>
                !presenca.status_validacao ||
                presenca.status_validacao ===
                "PENDENTE"
        ).length;


    /*
     * Calcula a sequência atual.
     *
     * A sequência usa o número da aula,
     * e não simplesmente os dias do calendário.
     *
     * Exemplo:
     * Aula 1
     * Aula 2
     * Aula 3
     *
     * = sequência 3
     */

    const sequenciaAtual =
        useMemo(() => {

            const aulas = presencasConsideradas
                .filter(
                    (presenca) =>
                        presenca.aula
                )
                .sort(
                    (a, b) =>
                        (b.aula?.numero ?? 0) -
                        (a.aula?.numero ?? 0)
                );

            if (aulas.length === 0) {
                return 0;
            }

            let sequencia = 1;

            for (
                let i = 0;
                i < aulas.length - 1;
                i++
            ) {

                const atual =
                    aulas[i].aula?.numero ?? 0;

                const anterior =
                    aulas[i + 1].aula?.numero ?? 0;

                if (
                    atual ===
                    anterior + 1
                ) {

                    sequencia++;

                } else {

                    break;

                }
            }

            return sequencia;

        }, [
            presencasConsideradas,
        ]);


    function formatarData(
        data: string
    ) {

        return new Date(
            `${data}T00:00:00`
        ).toLocaleDateString(
            "pt-BR"
        );
    }


    function formatarHora(
        dataHora: string | null
    ) {

        if (!dataHora) {
            return "—";
        }

        return new Date(
            dataHora
        ).toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    }


    function obterStatus(
        presenca: Presenca
    ) {

        if (
            presenca.status_validacao ===
            "VALIDADO"
        ) {

            return {
                texto: "Presença validada",
                classe:
                    "bg-green-100 text-green-700",
                Icon: CheckCircle2,
            };

        }

        if (
            presenca.status_validacao ===
            "REJEITADO"
        ) {

            return {
                texto: "Presença rejeitada",
                classe:
                    "bg-red-100 text-red-700",
                Icon: XCircle,
            };

        }

        return {
            texto: "Aguardando validação",
            classe:
                "bg-yellow-100 text-yellow-700",
            Icon: Clock3,
        };
    }


    if (loading) {

        return (
            <div className="mx-auto w-full max-w-5xl py-12 text-center text-slate-500">
                Carregando suas presenças...
            </div>
        );

    }


    return (

        <div className="mx-auto w-full max-w-5xl space-y-6">

            {/* CABEÇALHO */}

            <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">

                    <ClipboardCheck
                        size={28}
                        className="text-blue-600"
                    />

                </div>

                <div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        Minhas presenças
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Acompanhe sua frequência na Escola Bíblica Dominical.
                    </p>

                </div>

            </div>


            {/* RESUMO */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                {/* PRESENÇAS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">

                            <CheckCircle2
                                size={22}
                                className="text-blue-600"
                            />

                        </div>

                        <div>

                            <p className="text-sm text-slate-500">
                                Presenças
                            </p>

                            <p className="text-3xl font-bold text-slate-900">
                                {totalPresencas}
                            </p>

                        </div>

                    </div>

                </div>


                {/* SEQUÊNCIA */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100">

                            <Flame
                                size={22}
                                className="text-orange-500"
                            />

                        </div>

                        <div>

                            <p className="text-sm text-slate-500">
                                Sequência atual
                            </p>

                            <p className="text-3xl font-bold text-slate-900">
                                {sequenciaAtual}
                            </p>

                            <p className="text-xs text-slate-400">
                                aulas consecutivas
                            </p>

                        </div>

                    </div>

                </div>


                {/* PENDENTES */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100">

                            <Clock3
                                size={22}
                                className="text-yellow-600"
                            />

                        </div>

                        <div>

                            <p className="text-sm text-slate-500">
                                Em validação
                            </p>

                            <p className="text-3xl font-bold text-slate-900">
                                {totalPendentes}
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* HISTÓRICO */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-5">

                    <h2 className="text-xl font-bold text-slate-900">
                        Histórico
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Veja todas as aulas em que você registrou presença.
                    </p>

                </div>


                {presencas.length === 0 ? (

                    <div className="p-10 text-center">

                        <ClipboardCheck
                            size={40}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-4 font-semibold text-slate-700">
                            Nenhuma presença registrada
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Quando você fizer seu primeiro check-in, ele aparecerá aqui.
                        </p>

                    </div>

                ) : (

                    <div className="divide-y divide-slate-100">

                        {presencas.map(
                            (presenca) => {

                                const status =
                                    obterStatus(
                                        presenca
                                    );

                                const StatusIcon =
                                    status.Icon;

                                return (

                                    <div
                                        key={
                                            presenca.id
                                        }
                                        className="p-5 transition hover:bg-slate-50"
                                    >

                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                            {/* AULA */}

                                            <div className="flex items-center gap-4">

                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">

                                                    {presenca.aula?.numero ??
                                                        "—"}

                                                </div>

                                                <div>

                                                    <p className="font-semibold text-slate-900">

                                                        {presenca.aula?.titulo ??
                                                            "Aula não identificada"}

                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-500">

                                                        {formatarData(
                                                            presenca.data
                                                        )}

                                                        {" • "}

                                                        {formatarHora(
                                                            presenca.hora_checkin
                                                        )}

                                                    </p>

                                                </div>

                                            </div>


                                            {/* STATUS */}

                                            <div
                                                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${status.classe}`}
                                            >

                                                <StatusIcon
                                                    size={15}
                                                />

                                                {status.texto}

                                            </div>

                                        </div>


                                        {/* MOTIVO REJEIÇÃO */}

                                        {presenca.status_validacao ===
                                            "REJEITADO" &&
                                            presenca.observacao_validacao && (

                                                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">

                                                    <strong>
                                                        Motivo:
                                                    </strong>{" "}

                                                    {
                                                        presenca.observacao_validacao
                                                    }

                                                </div>

                                            )}

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}