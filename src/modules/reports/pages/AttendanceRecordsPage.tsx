import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AttendanceService } from "../services/AttendanceService";
import type { AttendanceRecord } from "../types/AttendanceRecord";

export function AttendanceRecordsPage() {
    const [registros, setRegistros] =
        useState<AttendanceRecord[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [dataInicial, setDataInicial] =
        useState("");

    const [dataFinal, setDataFinal] =
        useState("");

    const [statusFiltro, setStatusFiltro] =
        useState<"TODOS" | "DENTRO" | "FORA">(
            "TODOS"
        );

    const [alunoFiltro, setAlunoFiltro] =
        useState("");

    useEffect(() => {
        carregarRegistros();
    }, []);

    async function carregarRegistros() {
        try {
            setLoading(true);

            const dados =
                await AttendanceService.listarPresencas();

            setRegistros(dados);
        } catch (error) {
            console.error(error);

            toast.error(
                "Não foi possível carregar os registros."
            );
        } finally {
            setLoading(false);
        }
    }

    function formatarData(data: string) {
        const [ano, mes, dia] =
            data.split("-");

        return `${dia}/${mes}/${ano}`;
    }

    function formatarHora(
        dataHora: string | null
    ) {
        if (!dataHora) {
            return "-";
        }

        return new Date(
            dataHora
        ).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function abrirMapa(
        latitude: number | null,
        longitude: number | null
    ) {
        if (
            latitude === null ||
            longitude === null
        ) {
            toast.error(
                "Este registro não possui localização."
            );
            return;
        }

        const url =
            `https://www.google.com/maps?q=${latitude},${longitude}`;

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }

    const alunos = Array.from(
        new Set(
            registros.map((registro) => registro.nome)
        )
    ).sort();

    const registrosFiltrados = registros.filter(
        (registro) => {
            if (
                dataInicial &&
                registro.data < dataInicial
            ) {
                return false;
            }

            if (
                dataFinal &&
                registro.data > dataFinal
            ) {
                return false;
            }

            if (
                statusFiltro !== "TODOS" &&
                registro.localizacao_status !==
                statusFiltro
            ) {
                return false;
            }

            if (
                alunoFiltro &&
                registro.nome !== alunoFiltro
            ) {
                return false;
            }

            return true;
        }
    );

    if (loading) {
        return (
            <div className="p-6">
                Carregando registros...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Registros de Presença
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Valide os check-ins realizados pelos alunos.
                    </p>
                </div>

                <div className="mb-6 rounded-xl bg-white p-4 shadow">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-600">
                                Data inicial
                            </label>

                            <input
                                type="date"
                                value={dataInicial}
                                onChange={(event) =>
                                    setDataInicial(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-600">
                                Data final
                            </label>

                            <input
                                type="date"
                                value={dataFinal}
                                onChange={(event) =>
                                    setDataFinal(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-600">
                                Status
                            </label>

                            <select
                                value={statusFiltro}
                                onChange={(event) =>
                                    setStatusFiltro(
                                        event.target.value as
                                        | "TODOS"
                                        | "DENTRO"
                                        | "FORA"
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                            >
                                <option value="TODOS">
                                    Todos
                                </option>

                                <option value="DENTRO">
                                    Dentro
                                </option>

                                <option value="FORA">
                                    Fora
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-600">
                                Aluno
                            </label>

                            <select
                                value={alunoFiltro}
                                onChange={(event) =>
                                    setAlunoFiltro(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Todos os alunos
                                </option>

                                {alunos.map((aluno) => (
                                    <option
                                        key={aluno}
                                        value={aluno}
                                    >
                                        {aluno}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            {registrosFiltrados.length} registro(s) encontrado(s)
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setDataInicial("");
                                setDataFinal("");
                                setStatusFiltro("TODOS");
                                setAlunoFiltro("");
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Limpar filtros
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow">
                    {registrosFiltrados.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum registro encontrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                            Aluno
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                            Data
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                            Hora
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                            Localização
                                        </th>

                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                            Distância
                                        </th>

                                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">
                                            Mapa
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {registrosFiltrados.map((registro) => (
                                        <tr
                                            key={registro.id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-4 py-4 font-medium text-slate-800">
                                                {registro.nome}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {formatarData(
                                                    registro.data
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {formatarHora(
                                                    registro.hora_checkin
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                {registro.localizacao_status ===
                                                    "DENTRO" ? (
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                        DENTRO
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                        FORA
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {registro.distancia_metros !==
                                                    null
                                                    ? `${registro.distancia_metros} m`
                                                    : "-"}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        abrirMapa(
                                                            registro.latitude,
                                                            registro.longitude
                                                        )
                                                    }
                                                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                >
                                                    Ver mapa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}