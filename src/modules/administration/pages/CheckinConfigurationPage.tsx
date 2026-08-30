import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    LocateFixed,
    MapPin,
    Save,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase } from "@/shared/lib/supabase/client";
import { useFormDraft } from "@/shared/hooks/useFormDraft";

export function CheckinConfigurationPage() {

    const { pessoa } = useAuth();

    const [configuracaoId, setConfiguracaoId] =
        useState<string | null>(null);

    const {
        valores: formulario,
        setValores: setFormulario,
        limparRascunho,
    } = useFormDraft(
        `configuracao-checkin-${pessoa?.igreja_id ?? "sem-igreja"}`,
        {
            nome: "",
            latitude: "",
            longitude: "",
            raioMetros: "100",
        }
    );

    const nome = formulario.nome;
    const latitude = formulario.latitude;
    const longitude = formulario.longitude;
    const raioMetros = formulario.raioMetros;

    function setNome(valor: string) {
        setFormulario((atual) => ({
            ...atual,
            nome: valor,
        }));
    }

    function setLatitude(valor: string) {
        setFormulario((atual) => ({
            ...atual,
            latitude: valor,
        }));
    }

    function setLongitude(valor: string) {
        setFormulario((atual) => ({
            ...atual,
            longitude: valor,
        }));
    }

    function setRaioMetros(valor: string) {
        setFormulario((atual) => ({
            ...atual,
            raioMetros: valor,
        }));
    }

    const [loading, setLoading] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [
        buscandoLocalizacao,
        setBuscandoLocalizacao,
    ] = useState(false);

    const [mensagem, setMensagem] =
        useState("");

    const [erro, setErro] =
        useState("");


    useEffect(() => {

        async function carregarConfiguracao() {

            if (!pessoa?.igreja_id) {
                setLoading(false);
                return;
            }

            try {

                setLoading(true);
                setErro("");

                const {
                    data,
                    error,
                } =
                    await supabase
                        .schema("ebd")
                        .from("configuracoes_checkin")
                        .select(`
                            id,
                            nome,
                            latitude,
                            longitude,
                            raio_metros,
                            ativo
                        `)
                        .eq(
                            "igreja_id",
                            pessoa.igreja_id
                        )
                        .eq("ativo", true)
                        .maybeSingle();

                if (error) {
                    throw error;
                }

                if (!data) {
                    return;
                }

                setConfiguracaoId(data.id);

                const chaveRascunho =
                    `configuracao-checkin-${pessoa.igreja_id}`;

                const rascunhoSalvo =
                    localStorage.getItem(
                        chaveRascunho
                    );

                let temRascunhoReal = false;

                if (rascunhoSalvo) {

                    try {

                        const rascunho =
                            JSON.parse(
                                rascunhoSalvo
                            ) as {
                                nome?: string;
                                latitude?: string;
                                longitude?: string;
                                raioMetros?: string;
                            };

                        temRascunhoReal =
                            Boolean(
                                rascunho.nome?.trim()
                            ) ||
                            Boolean(
                                rascunho.latitude?.trim()
                            ) ||
                            Boolean(
                                rascunho.longitude?.trim()
                            ) ||
                            (
                                rascunho.raioMetros !==
                                undefined &&
                                String(
                                    rascunho.raioMetros
                                ) !== "100"
                            );

                    } catch (error) {

                        console.error(
                            "[CHECKIN CONFIG] Rascunho inválido:",
                            error
                        );
                    }
                }

                if (temRascunhoReal) {
                    return;
                }

                /*
                 * O rascunho encontrado era apenas o estado
                 * inicial criado automaticamente pelo hook.
                 *
                 * Limpamos antes de carregar o banco para que
                 * os valores vindos do banco não sejam tratados
                 * como um novo rascunho.
                 */
                limparRascunho();

                setFormulario({
                    nome:
                        data.nome ?? "",

                    latitude:
                        String(
                            data.latitude
                        ),

                    longitude:
                        String(
                            data.longitude
                        ),

                    raioMetros:
                        String(
                            data.raio_metros ?? 100
                        ),
                });

            } catch (error) {

                console.error(
                    "[CHECKIN CONFIG] Erro ao carregar:",
                    error
                );

                setErro(
                    "Não foi possível carregar a configuração do check-in."
                );

            } finally {

                setLoading(false);

            }
        }

        void carregarConfiguracao();

    }, [pessoa?.igreja_id]);


    function usarMinhaLocalizacao() {

        if (!navigator.geolocation) {

            setErro(
                "Este dispositivo não oferece suporte à localização."
            );

            return;
        }

        setBuscandoLocalizacao(true);
        setErro("");
        setMensagem("");

        navigator.geolocation
            .getCurrentPosition(

                (position) => {

                    setLatitude(
                        position.coords.latitude
                            .toFixed(6)
                    );

                    setLongitude(
                        position.coords.longitude
                            .toFixed(6)
                    );

                    setMensagem(
                        "Localização atual capturada com sucesso."
                    );

                    setBuscandoLocalizacao(false);

                },

                (error) => {

                    console.error(
                        "[CHECKIN CONFIG] Erro de geolocalização:",
                        error
                    );

                    setErro(
                        "Não foi possível obter sua localização. Verifique a permissão de localização do navegador."
                    );

                    setBuscandoLocalizacao(false);

                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                }
            );
    }


    async function salvar() {

        if (!pessoa?.igreja_id) {

            setErro(
                "Não foi possível identificar a igreja."
            );

            return;
        }

        const latitudeNumero =
            Number(
                latitude.replace(",", ".")
            );

        const longitudeNumero =
            Number(
                longitude.replace(",", ".")
            );

        const raioNumero =
            Number(raioMetros);

        if (!nome.trim()) {

            setErro(
                "Informe o nome do local."
            );

            return;
        }

        if (
            !Number.isFinite(latitudeNumero) ||
            latitudeNumero < -90 ||
            latitudeNumero > 90
        ) {

            setErro(
                "Informe uma latitude válida."
            );

            return;
        }

        if (
            !Number.isFinite(longitudeNumero) ||
            longitudeNumero < -180 ||
            longitudeNumero > 180
        ) {

            setErro(
                "Informe uma longitude válida."
            );

            return;
        }

        if (
            !Number.isFinite(raioNumero) ||
            raioNumero <= 0
        ) {

            setErro(
                "Informe um raio válido em metros."
            );

            return;
        }

        try {

            setSalvando(true);
            setErro("");
            setMensagem("");

            const dados = {
                nome: nome.trim(),
                latitude: latitudeNumero,
                longitude: longitudeNumero,
                raio_metros:
                    Math.round(raioNumero),
                ativo: true,
                igreja_id:
                    pessoa.igreja_id,
            };

            if (configuracaoId) {

                const {
                    error,
                } =
                    await supabase
                        .schema("ebd")
                        .from("configuracoes_checkin")
                        .update(dados)
                        .eq(
                            "id",
                            configuracaoId
                        )
                        .eq(
                            "igreja_id",
                            pessoa.igreja_id
                        );

                if (error) {
                    throw error;
                }

            } else {

                const {
                    data,
                    error,
                } =
                    await supabase
                        .schema("ebd")
                        .from("configuracoes_checkin")
                        .insert(dados)
                        .select("id")
                        .single();

                if (error) {
                    throw error;
                }

                setConfiguracaoId(
                    data.id
                );
            }

            limparRascunho();

            setMensagem(
                "Configuração do check-in salva com sucesso."
            );

        } catch (error) {

            console.error(
                "[CHECKIN CONFIG] Erro ao salvar:",
                error
            );

            setErro(
                "Não foi possível salvar a configuração do check-in."
            );

        } finally {

            setSalvando(false);

        }
    }


    if (loading) {

        return (
            <div className="flex min-h-[300px] items-center justify-center">

                <p className="text-sm text-slate-500">
                    Carregando configuração...
                </p>

            </div>
        );
    }


    return (
        <div className="space-y-6">

            {/* CABEÇALHO */}

            <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                    <MapPin size={22} />

                </div>

                <div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Configuração do check-in
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Defina a localização e o raio permitido para o check-in dos alunos.
                    </p>

                </div>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="grid gap-6 lg:grid-cols-2">

                    {/* NOME */}

                    <div className="lg:col-span-2">

                        <label className="text-sm font-semibold text-slate-700">
                            Nome do local
                        </label>

                        <input
                            type="text"
                            value={nome}
                            onChange={(event) =>
                                setNome(
                                    event.target.value
                                )
                            }
                            placeholder="Ex.: Igreja principal"
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />

                    </div>


                    {/* LATITUDE */}

                    <div>

                        <label className="text-sm font-semibold text-slate-700">
                            Latitude
                        </label>

                        <input
                            type="text"
                            inputMode="decimal"
                            value={latitude}
                            onChange={(event) =>
                                setLatitude(
                                    event.target.value
                                )
                            }
                            placeholder="-23.000000"
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />

                    </div>


                    {/* LONGITUDE */}

                    <div>

                        <label className="text-sm font-semibold text-slate-700">
                            Longitude
                        </label>

                        <input
                            type="text"
                            inputMode="decimal"
                            value={longitude}
                            onChange={(event) =>
                                setLongitude(
                                    event.target.value
                                )
                            }
                            placeholder="-46.000000"
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />

                    </div>


                    {/* RAIO */}

                    <div>

                        <label className="text-sm font-semibold text-slate-700">
                            Raio permitido
                        </label>

                        <div className="mt-2 flex items-center">

                            <input
                                type="number"
                                min="1"
                                value={raioMetros}
                                onChange={(event) =>
                                    setRaioMetros(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-l-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />

                            <div className="rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                metros
                            </div>

                        </div>

                    </div>


                    {/* LOCALIZAÇÃO ATUAL */}

                    <div className="flex items-end">

                        <button
                            type="button"
                            onClick={
                                usarMinhaLocalizacao
                            }
                            disabled={
                                buscandoLocalizacao
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                            <LocateFixed
                                size={17}
                            />

                            {buscandoLocalizacao
                                ? "Obtendo localização..."
                                : "Usar minha localização atual"}

                        </button>

                    </div>

                </div>


                {/* INFORMAÇÃO */}

                <div className="mt-6 rounded-xl bg-slate-50 p-4">

                    <p className="text-sm leading-6 text-slate-600">

                        O aluno poderá realizar o check-in quando estiver dentro do raio definido para esta localização.

                    </p>

                </div>


                {/* ERRO */}

                {erro && (

                    <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

                        {erro}

                    </div>

                )}


                {/* SUCESSO */}

                {mensagem && (

                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

                        <CheckCircle2
                            size={17}
                        />

                        {mensagem}

                    </div>

                )}


                {/* SALVAR */}

                <div className="mt-6 flex justify-end">

                    <button
                        type="button"
                        onClick={salvar}
                        disabled={salvando}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <Save size={17} />

                        {salvando
                            ? "Salvando..."
                            : "Salvar configuração"}

                    </button>

                </div>

            </div>

        </div>
    );
}