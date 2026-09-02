import {
    createContext,
    useContext,
    useEffect,
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

    const [user, setUser] =
        useState<User | null>(null);

    const [session, setSession] =
        useState<Session | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [pessoa, setPessoa] =
        useState<Pessoa | null>(null);

    const [igrejaId, setIgrejaId] =
        useState<string | null>(null);

    const [igrejaNome, setIgrejaNome] =
        useState<string | null>(null);

    const [igrejaLogoUrl, setIgrejaLogoUrl] =
        useState<string | null>(null);

    const [senhaTemporaria, setSenhaTemporaria] =
        useState(false);

    const [plano, setPlano] =
        useState<PlanoCompleto | null>(null);

    const [isSuperAdmin, setIsSuperAdmin] =
        useState(false);

    const [
        assinaturaExpirada,
        setAssinaturaExpirada,
    ] = useState(false);


    // =====================================================
    // BUSCA A PESSOA OU CRIA AUTOMATICAMENTE
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


        // Usuário já possui cadastro
        if (data) {

            return data;
        }


        // =================================================
        // PRIMEIRO LOGIN COM GOOGLE
        // Cria como ALUNO ATIVO quando veio por convite
        // =================================================

        console.log(
            "Novo usuário autenticado. Criando cadastro..."
        );


        const igrejaIdConvite =
            localStorage.getItem(
                "ebd_convite_igreja_id"
            );


        if (!igrejaIdConvite) {

            console.error(
                "Novo usuário Google sem igreja de convite."
            );

            return null;
        }


        const {
            data: igrejaConvite,
            error: igrejaConviteError,
        } =
            await supabase
                .schema("ebd")
                .from("igrejas")
                .select(`
            id,
            nome,
            ativa
        `)
                .eq(
                    "id",
                    igrejaIdConvite
                )
                .eq(
                    "ativa",
                    true
                )
                .maybeSingle();


        if (
            igrejaConviteError ||
            !igrejaConvite
        ) {

            console.error(
                "Igreja do convite inválida:",
                igrejaConviteError
            );

            localStorage.removeItem(
                "ebd_convite_igreja_id"
            );

            return null;
        }


        const {
            data: novaPessoa,
            error: erroCadastro,
        } =
            await supabase
                .schema("ebd")
                .from("pessoas")
                .insert({

                    user_id:
                        usuario.id,

                    igreja_id:
                        igrejaConvite.id,

                    nome:
                        usuario.user_metadata?.full_name ??
                        usuario.user_metadata?.name ??
                        "Usuário",

                    email:
                        usuario.email ?? "",

                    telefone:
                        "",

                    ativo:
                        true,

                    status:
                        "ATIVO",

                    perfil:
                        "ALUNO",

                })
                .select()
                .single();


        if (!erroCadastro) {

            localStorage.removeItem(
                "ebd_convite_igreja_id"
            );

            localStorage.setItem(
                "login_at",
                new Date().toISOString()
            );
        }


        if (erroCadastro) {

            console.error(
                "Erro ao criar cadastro:",
                erroCadastro
            );

            return null;
        }


        console.log(
            "Cadastro criado com sucesso:",
            novaPessoa
        );


        return novaPessoa;
    }


    // =====================================================
    // ATUALIZA ESTADO DA AUTENTICAÇÃO
    // =====================================================

    async function atualizarAutenticacao(
        novaSession: Session | null
    ) {

        setLoading(true);

        setSession(
            novaSession
        );


        const usuario =
            novaSession?.user ?? null;

        setUser(
            usuario
        );


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

            setPessoa(null);

            setIgrejaId(null);

            setPlano(null);

            setAssinaturaExpirada(false);

            setSenhaTemporaria(false);

            setIgrejaNome(null);

            setIgrejaLogoUrl(null);

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
                        "nome, logo_url"
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

            } catch (erro) {

                console.error(
                    "Erro ao carregar identidade da igreja:",
                    erro
                );

                setIgrejaNome(null);

                setIgrejaLogoUrl(null);
            }

        } else {

            setIgrejaNome(null);

            setIgrejaLogoUrl(null);
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


            await atualizarAutenticacao(
                session
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


        setSession(null);

        setUser(null);

        setPessoa(null);

        setIgrejaId(null);

        setPlano(null);

        setIgrejaNome(null);

        setIgrejaLogoUrl(null);

        setSenhaTemporaria(false);

        setAssinaturaExpirada(false);

        setIsSuperAdmin(false);
    }


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
