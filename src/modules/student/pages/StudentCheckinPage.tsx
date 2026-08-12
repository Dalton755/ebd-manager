import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CheckinCard } from "../components/CheckinCard";
import { AuthService } from "@/modules/auth/services/AuthService";
import { supabase } from "@/shared/lib/supabase/client";
import { StudentCheckinService } from "../services/StudentCheckinService";

export function StudentCheckinPage() {
    const [loading, setLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [checkinDisponivel, setCheckinDisponivel] =
        useState(false);
    const [mensagemCheckin, setMensagemCheckin] =
        useState("Verificando disponibilidade...");

    useEffect(() => {

        async function verificarDisponibilidade() {

            try {

                const aula =
                    await StudentCheckinService
                        .buscarAulaDeHoje();

                if (!aula) {

                    setCheckinDisponivel(false);

                    setMensagemCheckin(
                        "Não há aula agendada para hoje."
                    );

                    return;
                }

                const janela =
                    StudentCheckinService
                        .verificarJanelaCheckin();

                setCheckinDisponivel(
                    janela.permitido
                );

                setMensagemCheckin(
                    janela.permitido
                        ? "Check-in disponível."
                        : janela.mensagem
                );

            } catch (error) {

                console.error(error);

                setCheckinDisponivel(false);

                setMensagemCheckin(
                    "Não foi possível verificar o check-in."
                );
            }
        }

        verificarDisponibilidade();

        const intervalo =
            window.setInterval(
                verificarDisponibilidade,
                30000
            );

        return () =>
            window.clearInterval(intervalo);

    }, []);

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

            const { data: pessoa, error } =
                await supabase
                    .schema("ebd")
                    .from("pessoas")
                    .select("id, nome, perfil, status, ativo")
                    .eq("user_id", user.id)
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
                pessoa.perfil !== "ALUNO"
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

            navigator.geolocation.getCurrentPosition(

                async (position) => {

                    try {

                        const {
                            latitude,
                            longitude,
                            accuracy,
                        } = position.coords;

                        await StudentCheckinService
                            .realizarCheckin(
                                pessoa.id,
                                latitude,
                                longitude,
                                accuracy
                            );

                        setCheckedIn(true);

                        toast.success(
                            "Check-in realizado com sucesso!"
                        );

                    } catch (error) {

                        console.error(error);

                        const mensagem =
                            error instanceof Error
                                ? error.message
                                : "Não foi possível realizar o check-in.";

                        toast.error(mensagem);

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

            toast.error(mensagem);

            setLoading(false);

        }

    }

    return (
        <div className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
                <div className="w-full">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-blue-600">
                            EBD Manager
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Check-in da Escola Bíblica
                        </p>
                    </div>

                    <CheckinCard
                        checkedIn={checkedIn}
                        loading={loading}
                        onCheckin={handleCheckin}
                        checkinDisponivel={checkinDisponivel}
                        mensagemCheckin={mensagemCheckin}
                    />
                </div>
            </div>
        </div>
    );
}