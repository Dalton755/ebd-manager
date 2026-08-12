import {
    CheckCircle2,
    Loader2,
    MapPin,
} from "lucide-react";

type Props = {
    checkedIn: boolean;
    loading: boolean;
    onCheckin: () => void;
    checkinDisponivel: boolean;
    mensagemCheckin: string;
};

export function CheckinCard({
    checkedIn,
    loading,
    onCheckin,
    checkinDisponivel,
    mensagemCheckin,
}: Props) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-lg">
            {checkedIn ? (
                <div className="text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2
                            className="h-10 w-10 text-green-600"
                        />
                    </div>

                    <h2 className="text-xl font-bold text-slate-800">
                        Check-in realizado!
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Sua presença foi registrada com sucesso.
                    </p>

                    <div className="mt-6 rounded-xl bg-green-50 p-4">
                        <p className="text-sm font-medium text-green-700">
                            Presença confirmada
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                            <MapPin
                                className="h-10 w-10 text-blue-600"
                            />
                        </div>

                        <h2 className="text-xl font-bold text-slate-800">
                            Faça seu Check-in
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Registre sua presença na Escola Bíblica
                            usando sua localização.
                        </p>
                    </div>

                    <div className="mb-6 rounded-xl bg-slate-50 p-4">
                        <div className="flex gap-3">
                            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    Localização necessária
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Para confirmar que você está na
                                    Escola Bíblica, precisaremos
                                    acessar sua localização.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 rounded-xl bg-slate-50 p-4 text-center">
                        <p className="text-sm font-medium text-slate-600">
                            {mensagemCheckin}
                        </p>

                        {checkinDisponivel && (
                            <p className="mt-1 text-xs text-slate-400">
                                Disponível das 09:00 às 10:45
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onCheckin}
                        disabled={
                            loading ||
                            !checkinDisponivel
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <MapPin className="h-5 w-5" />
                                Fazer Check-in
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}