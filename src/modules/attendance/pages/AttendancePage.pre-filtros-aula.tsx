import { useEffect, useState } from "react";
import {
    CalendarDays,
    Check,
    Search,
    UserPlus,
    Users,
} from "lucide-react";
import { toast } from "sonner";

import { PeopleService } from "@/modules/people/services/PeopleService";
import { AttendanceService } from "../services/AttendanceService";

import type { Pessoa } from "@/modules/people/types/Pessoa";
import { ManualAttendanceModal } from "../components/ManualAttendanceModal";

import { useAuth } from "@/modules/auth/hooks/useAuth";

type Aluno = Pessoa & {
    presente: boolean;
};

export function AttendancePage() {

    const { pessoa } = useAuth();



    const [data, setData] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [pesquisa, setPesquisa] = useState("");

    const [alunos, setAlunos] = useState<Aluno[]>([]);

    const [loading, setLoading] = useState(true);

    const [manualModalOpen, setManualModalOpen] =
        useState(false);

    async function carregarDados() {
        setLoading(true);

        try {
            

            if (!pessoa?.igreja_id) {
                throw new Error(
                    "Não foi possível identificar a igreja do usuário."
                );
            }

            const pessoas =
                await PeopleService.listar(
                    pessoa.igreja_id
                );

            const alunosAtivos = (pessoas ?? [])
                .filter(
                    (pessoa) =>
                        pessoa.ativo &&
                        pessoa.perfil !== "ADMIN" &&
                        pessoa.perfil !== "SUPERINTENDENTE"
                );

            const presencas =
                await AttendanceService.listarPorData(data);

            const alunosComPresenca =
                alunosAtivos.map((aluno) => ({
                    ...aluno,
                    presente: presencas.some(
                        (presenca: any) =>
                            presenca.pessoa_id === aluno.id
                    ),
                }));

            setAlunos(alunosComPresenca);

        } catch (error) {
            console.error(error);
            toast.error(
                "Erro ao carregar alunos e presenças."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
    if (!pessoa?.igreja_id) {
        return;
    }

    carregarDados();
}, [data, pessoa?.igreja_id]);

    async function registrarPresenca(
        aluno: Aluno
    ) {
        try {
            if (aluno.presente) {
                await AttendanceService.removerPresenca(
                    aluno.id!,
                    data
                );

                toast.success(
                    `${aluno.nome} marcado como ausente.`
                );

            } else {
                await AttendanceService.registrarCheckin(
                    aluno.id!,
                    data
                );

                toast.success(
                    `${aluno.nome} presente.`
                );
            }

            await carregarDados();

        } catch (error) {
            console.error(error);

            toast.error(
                "Erro ao registrar presença."
            );
        }
    }

    const alunosFiltrados = alunos.filter(
        (aluno) =>
            aluno.nome
                .toLowerCase()
                .includes(pesquisa.toLowerCase())
    );

    const presentes = alunos.filter(
        (aluno) => aluno.presente
    ).length;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">

            {/* Cabeçalho */}

            <div className="flex items-start gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100">
                    <Users
                        size={28}
                        className="text-blue-600"
                    />
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Check-in
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Registre a presença dos alunos
                    </p>
                </div>

            </div>

            {/* Data */}

            <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <div className="flex items-center gap-3">

                    <CalendarDays
                        size={22}
                        className="text-blue-600"
                    />

                    <div className="flex-1">

                        <label className="block text-sm font-medium text-slate-500">
                            Data da aula
                        </label>

                        <input
                            type="date"
                            value={data}
                            onChange={(e) =>
                                setData(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                        />

                    </div>

                </div>

            </div>

            {/* Resumo */}

            <div className="grid grid-cols-2 gap-4">

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Alunos
                    </p>

                    <p className="mt-1 text-3xl font-bold text-slate-900">
                        {alunos.length}
                    </p>

                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">

                    <p className="text-sm text-slate-500">
                        Presentes
                    </p>

                    <p className="mt-1 text-3xl font-bold text-green-600">
                        {presentes}
                    </p>

                </div>

            </div>

            {/* Pesquisa */}

            <div className="rounded-2xl border bg-white p-4 shadow-sm">

                <div className="relative">

                    <Search
                        size={21}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        placeholder="Pesquisar aluno..."
                        value={pesquisa}
                        onChange={(e) =>
                            setPesquisa(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600"
                    />

                </div>

            </div>

            {/* Lista */}

            <div className="rounded-2xl border bg-white p-4 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                    <h2 className="text-xl font-bold text-slate-900">
                        Alunos
                    </h2>

                    <span className="text-sm text-slate-500">
                        {presentes}/{alunos.length}
                    </span>

                </div>

                {loading ? (

                    <div className="py-8 text-center text-slate-500">
                        Carregando alunos...
                    </div>

                ) : (

                    <div className="space-y-3">

                        {alunosFiltrados.map((aluno) => (

                            <div
                                key={aluno.id}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                            >

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
                                    {aluno.nome
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">

                                    <p className="truncate font-semibold text-slate-900">
                                        {aluno.nome}
                                    </p>

                                    <p
                                        className={`text-sm ${aluno.presente
                                            ? "text-green-600"
                                            : "text-slate-400"
                                            }`}
                                    >
                                        {aluno.presente
                                            ? "Presente"
                                            : "Aguardando"}
                                    </p>

                                </div>

                                <button
                                    onClick={() =>
                                        registrarPresenca(aluno)
                                    }
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${aluno.presente
                                        ? "bg-green-100 text-green-600"
                                        : "bg-blue-100 text-blue-600"
                                        }`}
                                >
                                    <Check size={22} />
                                </button>

                            </div>

                        ))}

                        {alunosFiltrados.length === 0 && (

                            <div className="py-8 text-center text-slate-500">
                                Nenhum aluno encontrado.
                            </div>

                        )}

                    </div>

                )}

            </div>

            {/* Chamada manual */}

            <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-600 transition hover:bg-blue-100"
            >
                <UserPlus size={20} />

                Adicionar chamada manual
            </button>

            <ManualAttendanceModal
                open={manualModalOpen}
                data={data}
                onClose={() => setManualModalOpen(false)}
                onSaved={carregarDados}
            />

        </div>
    );
}