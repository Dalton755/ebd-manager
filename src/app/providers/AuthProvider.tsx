import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

import type {
    Session,
    User,
} from "@supabase/supabase-js";

import type {
    Pessoa,
} from "@/modules/people/types/Pessoa";

import {
    supabase,
} from "@/shared/lib/supabase/client";

import {
    AuthService,
} from "@/modules/auth/services/AuthService";

import {
    PushNotificationService,
} from "@/modules/notifications/services/PushNotificationService";

import {
    PlanService,
} from "@/shared/plans/PlanService";

import type {
    PlanoCompleto,
} from "@/shared/plans/PlanTypes";


type AuthContextType = {
    user: User | null;
    session: Session | null;
    pessoa: Pessoa | null;
    igrejaId: string | null;
    igrejaNome: string | null;
    igrejaLogoUrl: string | null;
    modoDemo: boolean;
    demoExpiraEm: string | null;
    plano: PlanoCompleto | null;
    isSuperAdmin: boolean;
    senhaTemporaria: boolean;
    assinaturaExpirada: boolean;
    loading: boolean;
    logout: () => Promise<void>;
};


const AuthContext = createContext(
    {} as AuthContextType
);


type Props = {
    children: ReactNode;
};


const AUTH_VISUAL_CACHE_KEY =
    "ebd_auth_visual_v2";

const AUTH_VISUAL_CACHE_TTL =
    12 * 60 * 60 * 1000;

type AuthVisualCache = {
    userId: string;
    pessoa: Pessoa;
    igrejaId: string | null;
    igrejaNome: string | null;
    igrejaLogoUrl: string | null;
    modoDemo: boolean;
    demoExpiraEm: string | null;
    plano: PlanoCompleto | null;
    isSuperAdmin: boolean;
    senhaTemporaria: boolean;
    assinaturaExpirada: boolean;
    salvoEm: number;
};

function lerAuthVisualCache():
    AuthVisualCache | null {

    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }

    try {

        const bruto =
            window.sessionStorage
                .getItem(
                    AUTH_VISUAL_CACHE_KEY
                );

        if (!bruto) {
            return null;
        }

        const cache =
            JSON.parse(
                bruto
            ) as AuthVisualCache;

        if (
            !cache?.userId ||
            !cache?.pessoa?.id ||
            Date.now() -
                cache.salvoEm >
                AUTH_VISUAL_CACHE_TTL
        ) {

            window.sessionStorage
                .removeItem(
                    AUTH_VISUAL_CACHE_KEY
                );

            return null;
        }

        return cache;

    } catch {

        window.sessionStorage
            .removeItem(
                AUTH_VISUAL_CACHE_KEY
            );

        return null;
    }
}

function limparAuthVisualCache() {

    if (
        typeof window ===
        "undefined"
    ) {
        return;
    }

    window.sessionStorage
        .removeItem(
            AUTH_VISUAL_CACHE_KEY
        );
}


// =========================================================
// CALCULA A DATA DE EXPIRAÇÃO DO TESTE GRATUITO
// =========================================================

function calcularFimTeste(
    inicioEm: string,
    duracaoDias: number
): Date {

    const inicio =
        new Date(inicioEm);

    const fim =
        new Date(inicio);

    fim.setDate(
        fim.getDate() + duracaoDias
    );

    return fim;
}


// =========================================================
// VERIFICA SE A ASSINATURA DA IGREJA ESTÁ EXPIRADA
// =========================================================

async function verificarAssinaturaExpirada(
    igrejaId: string
): Promise<boolean> {

    try {

        const {
            data: assinatura,
            error,
        } =
            await supabase
                .schema("ebd")
                .from("assinaturas")
                .select(`
                    id,
                    status,
                    inicio_em,
                    fim_em,
                    carencia_ate,
                    gratuito_contratado,
                    duracao_gratuita_contratada_dias,
                    preco_recorrente_contratado,
                    periodo_recorrente_contratado
                `)
                .eq(
                    "igreja_id",
                    igrejaId
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();


        if (error) {

            console.error(
                "Erro ao verificar assinatura:",
                error
            );

            // Em caso de erro de consulta,
            // não bloqueamos a igreja.
            return false;
        }


        // -------------------------------------------------
        // NÃO EXISTE ASSINATURA
        // -------------------------------------------------

        if (!assinatura) {

            return false;
        }


        // -------------------------------------------------
        // ASSINATURA NÃO ESTÁ ATIVA
        // -------------------------------------------------

        if (
            assinatura.status !==
            "ATIVA"
        ) {

            return true;
        }


        // -------------------------------------------------
        // ASSINATURA COM VENCIMENTO
        // -------------------------------------------------

        if (assinatura.fim_em) {

            const agora =
                Date.now();

            const fim =
                new Date(
                    assinatura.fim_em
                );


            if (
                fim.getTime() >
                agora
            ) {

                return false;
            }


            // ---------------------------------------------
            // VENCIDA, MAS AINDA DENTRO DA CARÊNCIA
            // ---------------------------------------------

            if (
                assinatura.carencia_ate
            ) {

                const carencia =
                    new Date(
                        assinatura.carencia_ate
                    );


                if (
                    carencia.getTime() >
                    agora
                ) {

                    return false;
                }

            }


            return true;
        }


        // -------------------------------------------------
        // TESTE GRATUITO
        // -------------------------------------------------

        if (
            assinatura.gratuito_contratado === true &&
            assinatura.duracao_gratuita_contratada_dias > 0 &&
            assinatura.inicio_em
        ) {

            const fim =
                calcularFimTeste(
                    assinatura.inicio_em,
                    assinatura.duracao_gratuita_contratada_dias
                );

            return (
                fim.getTime() <=
                Date.now()
            );
        }


        // -------------------------------------------------
        // IGREJA ISENTA / ACESSO PERMANENTE
        // -------------------------------------------------

        if (
            assinatura.gratuito_contratado ===
            true
        ) {

            return false;
        }


        // -------------------------------------------------
        // ASSINATURA RECORRENTE PAGA SEM FIM_EM
        // -------------------------------------------------

        // Pela regra atual do banco, isso é uma inconsistência.
        // Bloqueamos por segurança para evitar acesso indefinido.
        if (
            assinatura
                .preco_recorrente_contratado !=
            null
        ) {

            return true;
        }


        return false;

    } catch (erro) {

        console.error(
            "Erro inesperado ao verificar assinatura:",
            erro
        );

        return false;
    }
}


export function AuthProvider({
    children,
}: Props) {

    /*
     * Cache apenas visual, mantido na sessão da aba.
     *
     * Ele não substitui a autenticação nem as RLS.
     * Serve somente para evitar que a interface suma
     * quando o Android recria a aba do navegador.
     */
    const cacheInicial =
        useRef(
            lerAuthVisualCache()
        ).current;

    const [user, setUser] =
        useState<User | null>(null);

    const usuarioAutenticadoRef =
        useRef<string | null>(
            cacheInicial?.userId ??
            null
        );

    const [session, setSession] =
        useState<Session | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [pessoa, setPessoa] =
        useState<Pessoa | null>(
            cacheInicial?.pessoa ??
            null
        );

    const [igrejaId, setIgrejaId] =
        useState<string | null>(
            cacheInicial?.igrejaId ??
            null
        );

    const [igrejaNome, setIgrejaNome] =
        useState<string | null>(
            cacheInicial?.igrejaNome ??
            null
        );

    const [igrejaLogoUrl, setIgrejaLogoUrl] =
        useState<string | null>(
            cacheInicial?.igrejaLogoUrl ??
            null
        );

    const [modoDemo, setModoDemo] =
        useState(
            cacheInicial?.modoDemo ??
            false
        );

    const [demoExpiraEm, setDemoExpiraEm] =
        useState<string | null>(
            cacheInicial?.demoExpiraEm ??
            null
        );

    const [senhaTemporaria, setSenhaTemporaria] =
        useState(
            cacheInicial?.senhaTemporaria ??
            false
        );

    const [plano, setPlano] =
        useState<PlanoCompleto | null>(
            cacheInicial?.plano ??
            null
        );

    const [isSuperAdmin, setIsSuperAdmin] =
        useState(
            cacheInicial?.isSuperAdmin ??
            false
        );

    const [
        assinaturaExpirada,
        setAssinaturaExpirada,
    ] = useState(
        cacheInicial?.assinaturaExpirada ??
        false
    );


    // =====================================================
    // BUSCA A PESSOA / VINCULA CADASTRO EXISTENTE
    // =====================================================

    async function buscarOuCriarPessoa(
        usuario: User
    ): Promise<Pessoa | null> {

        const {
            data,
            error,
        } = await supabase
            .schema("ebd")
            .from("pessoas")
            .select("*")
            .eq(
                "user_id",
                usuario.id
            )
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao buscar cadastro:",
                error
            );

            return null;
        }


        if (data) {
            return data;
        }


        /*
         * Primeiro acesso com Google:
         *
         * antes de tratar como novo aluno, tenta localizar um
         * cadastro já criado pela igreja usando o e-mail
         * confirmado da conta autenticada.
         *
         * Isso permite que professor, secretário, superintendente
         * e administrador entrem com Google sem perder o perfil.
         */
        const {
            data:
                pessoaVinculada,
            error:
                erroVinculo,
        } =
            await supabase
                .schema("ebd")
                .rpc(
                    "resolver_acesso_google"
                );


        if (erroVinculo) {

            console.error(
                "Erro ao resolver acesso existente:",
                erroVinculo
            );

            return null;
        }


        if (
            pessoaVinculada
        ) {

            AuthService
                .saveLoginTime();

            return (
                pessoaVinculada as Pessoa
            );
        }


        /*
         * Sem cadastro prévio:
         * permanece autenticado, porém ainda sem pessoa.
         * ProtectedRoute direcionará para /entrar-classe.
         */
        return null;
    }


    // =====================================================
    // ATUALIZA ESTADO DA AUTENTICAÇÃO
    // =====================================================

    async function atualizarAutenticacao(
        novaSession: Session | null,
        silencioso = false
    ) {

        if (!silencioso) {
            setLoading(true);
        }

        setSession(
            novaSession
        );


        const usuario =
            novaSession?.user ?? null;

        setUser(
            usuario
        );

        usuarioAutenticadoRef.current =
            usuario?.id ?? null;


        let superAdmin = false;


        // =================================================
        // VERIFICA SUPERADMIN
        // =================================================

        if (usuario) {

            const {
                data,
                error,
            } = await supabase
                .schema("ebd")
                .rpc(
                    "usuario_e_superadmin"
                );


            if (error) {

                console.error(
                    "Erro ao verificar SUPERADMIN:",
                    error
                );

            } else {

                console.log(
                    "VERIFICAÇÃO SUPERADMIN:",
                    data
                );

                superAdmin =
                    data === true;
            }
        }


        setIsSuperAdmin(
            superAdmin
        );


        // =================================================
        // USUÁRIO DESLOGADO
        // =================================================

        if (!usuario) {

            limparAuthVisualCache();

            setPessoa(null);

            setIgrejaId(null);

            setPlano(null);

            setAssinaturaExpirada(false);

            setSenhaTemporaria(false);

            setIgrejaNome(null);

            setIgrejaLogoUrl(null);

            setModoDemo(false);

            setDemoExpiraEm(null);

            setLoading(false);

            setIsSuperAdmin(false);

            return;
        }


        // =================================================
        // BUSCA / CRIA PESSOA
        // =================================================

        const pessoaEncontrada =
            await buscarOuCriarPessoa(
                usuario
            );


        setPessoa(
            pessoaEncontrada
        );


        const igrejaDaPessoa =
            pessoaEncontrada?.igreja_id ??
            null;


        setIgrejaId(
            igrejaDaPessoa
        );


        // =================================================
        // CARREGA IDENTIDADE DA IGREJA
        // =================================================

        if (igrejaDaPessoa) {

            try {

                const {
                    data: igreja,
                    error: igrejaError,
                } = await supabase
                    .schema("ebd")
                    .from("igrejas")
                    .select(
                        "nome, logo_url, modo_demo, demo_expira_em"
                    )
                    .eq(
                        "id",
                        igrejaDaPessoa
                    )
                    .single();


                if (igrejaError) {

                    throw igrejaError;
                }


                setIgrejaNome(
                    igreja?.nome ?? null
                );


                setIgrejaLogoUrl(
                    igreja?.logo_url ?? null
                );

                setModoDemo(
                    igreja?.modo_demo === true
                );

                setDemoExpiraEm(
                    igreja?.demo_expira_em ?? null
                );

            } catch (erro) {

                console.error(
                    "Erro ao carregar identidade da igreja:",
                    erro
                );

                setIgrejaNome(null);

                setIgrejaLogoUrl(null);

                setModoDemo(false);

                setDemoExpiraEm(null);
            }

        } else {

            setIgrejaNome(null);

            setIgrejaLogoUrl(null);

            setModoDemo(false);

            setDemoExpiraEm(null);
        }


        // =================================================
        // SENHA TEMPORÁRIA
        // =================================================

        setSenhaTemporaria(
            pessoaEncontrada?.senha_temporaria === true
        );


        // =================================================
        // CARREGA PLANO DA IGREJA
        // =================================================

        if (igrejaDaPessoa) {

            try {

                const planoEncontrado =
                    await PlanService.buscarPlanoDaIgreja(
                        igrejaDaPessoa
                    );


                setPlano(
                    planoEncontrado
                );


                console.log(
                    "Plano da igreja:",
                    planoEncontrado
                );

            } catch (erro) {

                console.error(
                    "Erro ao carregar plano da igreja:",
                    erro
                );

                setPlano(null);
            }

        } else {

            setPlano(null);
        }


        // =================================================
        // VERIFICA EXPIRAÇÃO DA ASSINATURA
        // =================================================

        if (igrejaDaPessoa) {

            const expirada =
                await verificarAssinaturaExpirada(
                    igrejaDaPessoa
                );


            setAssinaturaExpirada(
                expirada
            );


            console.log(
                "ASSINATURA EXPIRADA:",
                expirada
            );

        } else {

            setAssinaturaExpirada(
                false
            );
        }


        // =================================================
        // REGISTRA DISPOSITIVO PARA PUSH
        // =================================================

        if (pessoaEncontrada?.id) {

            try {

                const pushRegistrado =
                    await PushNotificationService.registrarDispositivo(
                        pessoaEncontrada.id
                    );


                console.log(
                    "Resultado do registro Push:",
                    pushRegistrado
                );

            } catch (erro) {

                console.error(
                    "Erro ao registrar dispositivo Push:",
                    erro
                );
            }
        }


        setLoading(false);
    }


    // =====================================================
    // CARREGA USUÁRIO AO INICIAR O APP
    // =====================================================

    useEffect(() => {

        let ativo = true;


        async function carregarUsuario() {

            const {
                data: {
                    session,
                },
            } =
                await supabase.auth.getSession();


            if (!ativo) {

                return;
            }


            // =============================================
            // CONTROLE DE EXPIRAÇÃO DE 12 HORAS
            // =============================================

            if (session) {

                const loginAt =
                    localStorage.getItem(
                        "login_at"
                    );


                // Login Google não passa pelo
                // AuthService.login()
                if (!loginAt) {

                    AuthService.saveLoginTime();
                }


                if (
                    AuthService.isSessionExpired()
                ) {

                    await AuthService.logout();


                    if (!ativo) {

                        return;
                    }


                    setSession(null);

                    setUser(null);

                    setPessoa(null);

                    setIgrejaId(null);

                    setSenhaTemporaria(false);

                    setLoading(false);

                    setPlano(null);

                    setIgrejaNome(null);

                    setIgrejaLogoUrl(null);

                    setAssinaturaExpirada(false);

                    return;
                }
            }


            const cacheEhDoMesmoUsuario =
                Boolean(
                    session?.user?.id &&
                    cacheInicial?.userId ===
                        session.user.id
                );


            if (
                cacheInicial &&
                !cacheEhDoMesmoUsuario
            ) {

                limparAuthVisualCache();

                setPessoa(null);
                setIgrejaId(null);
                setIgrejaNome(null);
                setIgrejaLogoUrl(null);
                setPlano(null);
                setIsSuperAdmin(false);
                setSenhaTemporaria(false);
                setAssinaturaExpirada(false);
            }


            await atualizarAutenticacao(
                session,
                cacheEhDoMesmoUsuario
            );
        }


        carregarUsuario();


        // =================================================
        // OBSERVA ALTERAÇÕES DE AUTENTICAÇÃO
        // =================================================

        const {
            data: {
                subscription,
            },
        } =
            supabase.auth.onAuthStateChange(
                (
                    event,
                    novaSession
                ) => {

                    console.log(
                        "Evento de autenticação:",
                        event
                    );


                    /*
                     * A sessão inicial já é tratada por
                     * carregarUsuario(). Ignorar este evento
                     * evita uma segunda validação completa e
                     * uma piscada de "Verificando acesso".
                     */
                    if (
                        event ===
                        "INITIAL_SESSION"
                    ) {
                        return;
                    }


                    /*
                     * TOKEN_REFRESHED acontece normalmente
                     * quando o app volta do segundo plano.
                     *
                     * No celular isso é muito comum ao abrir
                     * o seletor de arquivos.
                     *
                     * Não podemos ligar o loading global aqui,
                     * porque ProtectedRoute desmontaria a tela
                     * atual e destruiria o <input type="file">
                     * antes do onChange receber o arquivo.
                     */
                    const mesmoUsuarioJaCarregado =
                        Boolean(
                            novaSession?.user?.id &&
                            usuarioAutenticadoRef.current ===
                                novaSession.user.id
                        );


                    if (
                        event === "TOKEN_REFRESHED" ||
                        (
                            event === "SIGNED_IN" &&
                            mesmoUsuarioJaCarregado
                        )
                    ) {

                        if (!ativo) {
                            return;
                        }

                        setSession(
                            novaSession
                        );

                        setUser(
                            novaSession?.user ??
                            null
                        );

                        return;
                    }


                    if (
                        event === "SIGNED_IN" &&
                        novaSession
                    ) {

                        AuthService.saveLoginTime();
                    }


                    // Não fazemos consultas ao Supabase
                    // diretamente dentro do callback.
                    setTimeout(() => {

                        if (ativo) {

                            void atualizarAutenticacao(
                                novaSession
                            );
                        }

                    }, 0);
                }
            );


        // =================================================
        // LIMPEZA
        // =================================================

        return () => {

            ativo = false;

            subscription.unsubscribe();
        };

    }, []);


    // =====================================================
    // LOGOUT
    // =====================================================

    async function logout() {

        await AuthService.logout();

        limparAuthVisualCache();


        setSession(null);

        setUser(null);

        usuarioAutenticadoRef.current =
            null;

        setPessoa(null);

        setIgrejaId(null);

        setPlano(null);

        setIgrejaNome(null);

        setIgrejaLogoUrl(null);

        setModoDemo(false);

        setDemoExpiraEm(null);

        setSenhaTemporaria(false);

        setAssinaturaExpirada(false);

        setIsSuperAdmin(false);
    }


    /*
     * Salva somente o estado visual necessário
     * para reconstruir a interface sem tela branca
     * caso o navegador descarregue a aba no mobile.
     */
    useEffect(() => {

        if (
            loading ||
            !user?.id ||
            !pessoa?.id
        ) {
            return;
        }

        const cache: AuthVisualCache = {
            userId:
                user.id,

            pessoa,

            igrejaId,

            igrejaNome,

            igrejaLogoUrl,

            modoDemo,

            demoExpiraEm,

            plano,

            isSuperAdmin,

            senhaTemporaria,

            assinaturaExpirada,

            salvoEm:
                Date.now(),
        };


        try {

            window.sessionStorage
                .setItem(
                    AUTH_VISUAL_CACHE_KEY,
                    JSON.stringify(
                        cache
                    )
                );

        } catch {

            /*
             * Sem impacto funcional se o
             * navegador bloquear o storage.
             */
        }

    }, [
        loading,
        user?.id,
        pessoa,
        igrejaId,
        igrejaNome,
        igrejaLogoUrl,
        modoDemo,
        demoExpiraEm,
        plano,
        isSuperAdmin,
        senhaTemporaria,
        assinaturaExpirada,
    ]);


    // =====================================================
    // PROVIDER
    // =====================================================

    return (
        <AuthContext.Provider
            value={{

                user,

                session,

                pessoa,

                igrejaId,

                igrejaNome,

                igrejaLogoUrl,

                modoDemo,

                demoExpiraEm,

                plano,

                isSuperAdmin,

                senhaTemporaria,

                assinaturaExpirada,

                loading,

                logout,

            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


// =========================================================
// HOOK
// =========================================================

export function useAuth() {

    return useContext(
        AuthContext
    );
}
