import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    School,
    UserRound,
} from "lucide-react";


type Props = {
    checkedIn: boolean;
    loading: boolean;
    onCheckin: () => void;
    checkinDisponivel: boolean;
    mensagemCheckin: string;
    horarioCheckin: string;

    aula: {
        numero: number;
        titulo: string;
        data: string;
        hora_inicio: string | null;
        hora_fim: string | null;
        tema: string | null;
        professorNome: string | null;
    } | null;

    classeNome: string | null;
};


function formatarData(
    data: string
) {

    const [
        ano,
        mes,
        dia,
    ] =
        data.split("-");


    return `${dia}/${mes}/${ano}`;
}


function formatarHorario(
    inicio: string | null,
    fim: string | null
) {

    if (
        !inicio ||
        !fim
    ) {
        return "Horário não definido";
    }


    return `${inicio.slice(0, 5)} às ${fim.slice(0, 5)}`;
}


export function CheckinCard({
    checkedIn,
    loading,
    onCheckin,
    checkinDisponivel,
    mensagemCheckin,
    horarioCheckin,
    aula,
    classeNome,
}: Props) {

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">

            {checkedIn ? (

                <div className="px-6 py-10 text-center sm:px-8">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>


                    <h2 className="mt-5 text-2xl font-bold text-slate-900">
                        Presença registrada!
                    </h2>


                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Tudo certo. Agora vamos levar você diretamente para a aula de hoje.
                    </p>


                    <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-700">
                            Abrindo sua aula...
                        </p>
                    </div>

                </div>

            ) : (

                <>

                    {/* AULA */}
                    <div className="border-b border-slate-100 bg-gradient-to-b from-blue-50 to-white px-5 py-6 sm:px-7">

                        <div className="flex items-center justify-between gap-3">

                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                                <BookOpen className="h-3.5 w-3.5" />
                                Aula de hoje
                            </span>


                            {aula && (
                                <span className="text-xs font-semibold text-slate-400">
                                    Lição {aula.numero}
                                </span>
                            )}

                        </div>


                        {aula ? (

                            <>

                                <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                                    {aula.titulo}
                                </h2>


                                {aula.tema && (
                                    <p className="mt-2 text-sm font-medium text-blue-700">
                                        {aula.tema}
                                    </p>
                                )}


                                <div className="mt-5 grid gap-3 sm:grid-cols-2">

                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                                        <School className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Classe
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-slate-800">
                                                {classeNome ?? "Sua classe"}
                                            </p>
                                        </div>
                                    </div>


                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                                        <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Professor
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-slate-800">
                                                {aula.professorNome ?? "A definir"}
                                            </p>
                                        </div>
                                    </div>


                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Data
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-slate-800">
                                                {formatarData(aula.data)}
                                            </p>
                                        </div>
                                    </div>


                                    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                                        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Horário
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-slate-800">
                                                {formatarHorario(
                                                    aula.hora_inicio,
                                                    aula.hora_fim
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                </div>

                            </>

                        ) : (

                            <div className="mt-5 rounded-2xl bg-slate-100 p-5 text-center">
                                <p className="text-sm font-medium text-slate-600">
                                    Carregando informações da aula...
                                </p>
                            </div>

                        )}

                    </div>


                    {/* AÇÃO PRINCIPAL */}
                    <div className="px-5 py-6 sm:px-7 sm:py-7">

                        <div
                            className={`rounded-2xl border px-4 py-3 text-center ${
                                checkinDisponivel
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-slate-200 bg-slate-50"
                            }`}
                        >
                            <p
                                className={`text-sm font-bold ${
                                    checkinDisponivel
                                        ? "text-emerald-700"
                                        : "text-slate-600"
                                }`}
                            >
                                {mensagemCheckin}
                            </p>

                            {horarioCheckin && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {horarioCheckin}
                                </p>
                            )}
                        </div>


                        <div className="mx-auto mt-5 flex w-full max-w-sm justify-center">
                            <button
                                type="button"
                                onClick={onCheckin}
                                disabled={
                                    loading ||
                                    !checkinDisponivel
                                }
                                className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="h-6 w-6" />
                                        FAZER MEU CHECK-IN
                                    </>
                                )}
                            </button>
                        </div>


                        <div className="mx-auto mt-5 flex max-w-sm items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3.5">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <p className="text-xs leading-5 text-slate-500">
                                Sua localização será usada para registrar sua presença. Mesmo fora do raio configurado, o registro poderá ser enviado para validação conforme as regras da sua igreja.
                            </p>
                        </div>

                    </div>

                </>

            )}

        </div>
    );
}
